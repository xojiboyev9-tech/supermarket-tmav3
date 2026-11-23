// JOYI: backend/src/security.js
const {q,audit}=require('./db');

const CFG={
 burstWindowMs:10000,
 burstSoft:35,
 burstBlock:60,
 minWindowMs:60000,
 minBlock:220,
 ipBurstWindowMs:10000,
 ipBurstLimit:600,
 botBurstWindowMs:10000,
 botBurstBlock:20
};

const blocked=new Map(); // String(tgId) -> {tg_id,name,reason,hits,ip,auto,blocked_at,expires_at}
const userHits=new Map(); // String(tgId) -> {w10:number[], w60:number[], warns:number[]}
const botHits=new Map();  // String(tgId) -> number[]
const ipHits=new Map();   // ip -> number[]
const actHits=new Map();  // `${name}:${tgId}` -> number[]
const alerted=new Map();  // String(tgId) -> timestamp
let droppedTotal=0;
let notifyFn=null;

const prune=(arr,cutoff)=>{while(arr.length&&arr[0]<cutoff)arr.shift();return arr};
const clientIp=req=>String(req.ip||req.headers['x-forwarded-for']||'').split(',')[0].trim().slice(0,64);

setInterval(()=>{
 const now=Date.now();
 for(const [k,v] of userHits){prune(v.w10,now-CFG.burstWindowMs);prune(v.w60,now-CFG.minWindowMs);prune(v.warns,now-60000);if(!v.w60.length&&!v.warns.length)userHits.delete(k)}
 for(const [k,arr] of botHits){prune(arr,now-CFG.botBurstWindowMs);if(!arr.length)botHits.delete(k)}
 for(const [k,arr] of ipHits){prune(arr,now-CFG.ipBurstWindowMs);if(!arr.length)ipHits.delete(k)}
 for(const [k,arr] of actHits){prune(arr,now-600000);if(!arr.length)actHits.delete(k)}
 for(const [k,ts] of alerted){if(now-ts>3600000)alerted.delete(k)}
},60000).unref();

async function initSecurity(onAutoBlock){
 notifyFn=onAutoBlock||null;
 try{
  const rows=(await q('select * from blocked_users where expires_at is null or expires_at>now()')).rows;
  blocked.clear();
  for(const r of rows)blocked.set(String(r.tg_id),r);
 }catch(e){console.error('initSecurity',e.message)}
}

function isBlocked(tgId){
 if(!tgId)return null;
 const rec=blocked.get(String(tgId));
 if(!rec)return null;
 if(rec.expires_at&&new Date(rec.expires_at).getTime()<=Date.now()){blocked.delete(String(tgId));return null}
 return rec;
}

async function blockUser({tgId,name='',reason='DDoS / haddan tashqari ko\'p so\'rov',hits=0,ip=null,auto=true,blockedBy=null}){
 const tid=Number(tgId);
 if(!Number.isFinite(tid)||tid<=0)throw Object.assign(new Error("Telegram ID noto'g'ri"),{status:400});
 const existing=(await q('select tg_id,name,role from users where tg_id=$1',[tid])).rows[0];
 if(existing?.role==='superadmin')throw Object.assign(new Error("Super Adminni bloklab bo'lmaydi"),{status:403});
 if(auto&&existing?.role==='admin')return null;
 const cleanName=String(name||existing?.name||'').trim().slice(0,120)||null;
 const cleanReason=String(reason||'ddos').trim().slice(0,200);
 const rec=(await q(
  `insert into blocked_users(tg_id,name,reason,hits,ip,auto,blocked_by,blocked_at,expires_at)
   values($1,$2,$3,$4,$5,$6,$7,now(),null)
   on conflict(tg_id) do update set
    name=coalesce(excluded.name,blocked_users.name),
    reason=excluded.reason,
    hits=greatest(blocked_users.hits,excluded.hits),
    ip=coalesce(excluded.ip,blocked_users.ip),
    auto=excluded.auto,
    blocked_by=excluded.blocked_by,
    blocked_at=now(),
    expires_at=null
   returning *`,
  [tid,cleanName,cleanReason,Math.max(0,Math.round(Number(hits)||0)),ip||null,!!auto,blockedBy||null]
 )).rows[0];
 blocked.set(String(tid),rec);
 await audit(blockedBy||0,auto?'security.autoblock':'security.block','user:'+tid,{reason:cleanReason,hits:rec.hits,ip});
 if(auto&&notifyFn){
  const prev=alerted.get(String(tid))||0;
  if(Date.now()-prev>600000){
   alerted.set(String(tid),Date.now());
   notifyFn(rec).catch(()=>{});
  }
 }
 return rec;
}

async function unblockUser(tgId,actorId){
 const tid=Number(tgId);
 if(!Number.isFinite(tid)||tid<=0)throw Object.assign(new Error("Telegram ID noto'g'ri"),{status:400});
 blocked.delete(String(tid));
 userHits.delete(String(tid));
 botHits.delete(String(tid));
 await q('delete from blocked_users where tg_id=$1',[tid]);
 await audit(actorId||0,'security.unblock','user:'+tid);
 return{success:true};
}

async function listBlocked(){
 const rows=(await q(
  `select b.*,coalesce(b.name,u.name) display_name,u.phone,u.role
   from blocked_users b left join users u on u.tg_id=b.tg_id
   where b.expires_at is null or b.expires_at>now()
   order by b.blocked_at desc limit 500`
 )).rows;
 return{
  items:rows,
  stats:{
   total:rows.length,
   auto:rows.filter(r=>r.auto).length,
   manual:rows.filter(r=>!r.auto).length,
   dropped:droppedTotal
  },
  thresholds:{
   burstSoft:CFG.burstSoft,
   burstBlock:CFG.burstBlock,
   minBlock:CFG.minBlock,
   botBurstBlock:CFG.botBurstBlock
  }
 };
}

/* Pre-auth raw IP flood shield (very high threshold so Uzbek CGNAT mobile users are safe) */
function ipShield(req,res,next){
 const ip=clientIp(req);
 if(!ip)return next();
 const now=Date.now();
 let arr=ipHits.get(ip);
 if(!arr){arr=[];ipHits.set(ip,arr)}
 prune(arr,now-CFG.ipBurstWindowMs);
 arr.push(now);
 if(arr.length>CFG.ipBurstLimit){
  droppedTotal++;
  return res.status(429).json({error:"Juda ko'p so'rov yuborildi. Biroz kuting."});
 }
 next();
}

/* Post-auth per-tg_id DDoS detector & instant RAM block enforcement */
function ddosGuard(req,res,next){
 const u=req.me;
 if(!u)return next();
 const key=String(u.tg_id);
 const blk=isBlocked(key);
 if(blk){
  droppedTotal++;
  return res.status(403).json({error:"Hisobingiz xavfsizlik tizimi tomonidan bloklangan. Administratorga murojaat qiling."});
 }
 if(u.role==='superadmin'||u.role==='admin')return next();

 const now=Date.now();
 let st=userHits.get(key);
 if(!st){st={w10:[],w60:[],warns:[]};userHits.set(key,st)}
 prune(st.w10,now-CFG.burstWindowMs);
 prune(st.w60,now-CFG.minWindowMs);
 prune(st.warns,now-60000);
 st.w10.push(now);
 st.w60.push(now);

 if(st.w10.length>=CFG.burstBlock||st.w60.length>=CFG.minBlock||st.warns.length>=3){
  const reason=st.w10.length>=CFG.burstBlock
   ?`DDoS: 10 soniyada ${st.w10.length} ta so'rov`
   :st.w60.length>=CFG.minBlock
   ?`DDoS: 1 daqiqada ${st.w60.length} ta so'rov`
   :`DDoS: takroriy limit buzilishi (${st.w60.length} so'rov)`;
  const hits=Math.max(st.w10.length,st.w60.length);
  const ip=clientIp(req);
  droppedTotal++;
  blocked.set(key,{tg_id:u.tg_id,name:u.name,reason,hits,ip,auto:true,blocked_at:new Date().toISOString(),expires_at:null});
  blockUser({tgId:u.tg_id,name:u.name,reason,hits,ip,auto:true}).catch(e=>console.error('autoblock',e.message));
  return res.status(403).json({error:"Juda ko'p so'rov yuborilgani uchun hisobingiz bloklandi."});
 }
 if(st.w10.length>CFG.burstSoft){
  st.warns.push(now);
  droppedTotal++;
  return res.status(429).json({error:"So'rovlar juda tez yuborilmoqda. Biroz kuting."});
 }
 next();
}

/* Per-tg_id action-specific rate limit (e.g. order spam, card spam, upload spam) */
function actionLimit(name,max,windowMs){
 return(req,res,next)=>{
  const u=req.me;
  if(!u||u.role==='superadmin'||u.role==='admin')return next();
  const key=`${name}:${u.tg_id}`,now=Date.now();
  let arr=actHits.get(key);
  if(!arr){arr=[];actHits.set(key,arr)}
  prune(arr,now-windowMs);
  if(arr.length>=max){
   droppedTotal++;
   return res.status(429).json({error:"Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring."});
  }
  arr.push(now);
  next();
 };
}

/* Telegram bot flood shield */
function checkBotFlood(from,role='user'){
 if(!from?.id)return{ok:true};
 const key=String(from.id);
 if(isBlocked(key)){droppedTotal++;return{ok:false,blocked:true}}
 if(role==='superadmin'||role==='admin')return{ok:true};
 const now=Date.now();
 let arr=botHits.get(key);
 if(!arr){arr=[];botHits.set(key,arr)}
 prune(arr,now-CFG.botBurstWindowMs);
 arr.push(now);
 if(arr.length>=CFG.botBurstBlock){
  const name=`${from.first_name||''} ${from.last_name||''}`.trim();
  const reason=`Bot flood: 10 soniyada ${arr.length} ta xabar`;
  droppedTotal++;
  blocked.set(key,{tg_id:from.id,name,reason,hits:arr.length,ip:null,auto:true,blocked_at:new Date().toISOString(),expires_at:null});
  blockUser({tgId:from.id,name,reason,hits:arr.length,auto:true}).catch(()=>{});
  return{ok:false,blocked:true};
 }
 return{ok:true};
}

function safeUrl(u){
 const s=String(u||'').trim().slice(0,500);
 if(!s)return null;
 if(s.startsWith('/')||/^https?:\/\//i.test(s))return s;
 return null;
}

module.exports={initSecurity,isBlocked,blockUser,unblockUser,listBlocked,ipShield,ddosGuard,actionLimit,checkBotFlood,safeUrl};
