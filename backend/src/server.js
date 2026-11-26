// JOYI: backend/src/server.js  (GitHub'da shu yo'l bilan yarating)
require('dotenv').config();
const express=require('express'),helmet=require('helmet'),cors=require('cors'),crypto=require('crypto'),zlib=require('zlib');
const {q,audit,getSetting,setSetting}=require('./db');const O=require('./orders');
const {bot,notifyCardApplied,notifyCardApproved,notifyCardRejected,notifyAutoBlock,runBroadcast}=require('./bot');
const S=require('./security');
process.on('unhandledRejection',e=>console.error('unhandled',e));
const app=express();app.set('trust proxy',1);app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false,frameguard:false,referrerPolicy:{policy:'strict-origin-when-cross-origin'}}));
const origin=(process.env.WEBAPP_URL||'').replace(/\/+$/,'');
app.use(cors({origin:origin||false}));
const json1=express.json({limit:'1mb'}),json10=express.json({limit:'10mb'});
app.use((req,res,next)=>(req.path==='/api/sync/products'||req.path==='/api/admin/products/sync')?json10(req,res,next):json1(req,res,next));

/* Lightweight gzip compression for JSON API responses > 1KB */
app.use('/api',(req,res,next)=>{
 if(!/\bgzip\b/i.test(req.get('accept-encoding')||''))return next();
 const orig=res.json.bind(res);
 res.json=body=>{
  const raw=Buffer.from(JSON.stringify(body));
  if(raw.length<1024)return orig(body);
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Content-Encoding','gzip');
  res.setHeader('Vary','Accept-Encoding');
  return res.send(zlib.gzipSync(raw));
 };
 next();
});

/* In-memory LRU image cache (max 150 hot images) */
const imgCache=new Map();
app.get('/img/:id',async(req,res)=>{
 try{
  const id=+req.params.id;if(!(id>0))return res.sendStatus(404);
  let r=imgCache.get(id);
  if(r){imgCache.delete(id);imgCache.set(id,r)}
  else{
   r=(await q('select mime,data from images where id=$1',[id])).rows[0];
   if(!r)return res.sendStatus(404);
   if(imgCache.size>=150)imgCache.delete(imgCache.keys().next().value);
   imgCache.set(id,r);
  }
  res.set({'Content-Type':r.mime,'Cache-Control':'public,max-age=31536000,immutable'}).send(r.data);
 }catch{res.sendStatus(404)}
});

app.get('/health',(r,s)=>s.json({ok:true}));
const wrap=f=>(req,res)=>f(req,res).catch(e=>{if(!e.status)console.error(e);res.status(e.status||500).json({error:e.status?e.message:'Server xatosi'})});

/* Short-lived auth user cache (avoids blind UPDATE on every single request) */
const userCache=new Map(); // tg_id -> {u, exp}
const bustUser=id=>userCache.delete(String(id));
setInterval(()=>{const now=Date.now();for(const [k,v] of userCache)if(v.exp<=now)userCache.delete(k)},60000).unref();

/* Shared public catalog/content/settings cache (30s TTL + instant bust on admin writes) */
const SALE_SQL='sale_price is not null and sale_price>0 and sale_price<price and (sale_until is null or sale_until>now())';
let pubCache=null,pubExp=0,pubPromise=null;
const bustPub=()=>{pubCache=null;pubExp=0};
async function getPub(){
 if(pubCache&&pubExp>Date.now())return pubCache;
 if(pubPromise)return pubPromise;
 pubPromise=(async()=>{
  const [whR,dlR,anR,suR,bnR,bdR,vdR,ctR,scR,fmR]=await Promise.all([
   getSetting('warehouse'),
   getSetting('delivery'),
   q("select value from settings where key='animation'"),
   q("select value from settings where key='support'"),
   q('select id,image,title,subtitle,link from banners where active order by sort,id'),
   q(`select b.id,b.title,b.title_ru,b.description,b.description_ru,b.image,b.price,coalesce((select sum(p.price*bi.qty)::int from bundle_items bi join products p on p.id=bi.product_id where bi.bundle_id=b.id),0) old_price,coalesce((select json_agg(p.name||' ×'||bi.qty::text) from bundle_items bi join products p on p.id=bi.product_id where bi.bundle_id=b.id),'[]') parts,coalesce((select json_agg(json_build_object('id',p.id,'name',p.name,'name_uz',p.name_uz,'price',p.price,'unit',p.unit,'image',p.image,'qty',bi.qty,'age_min',p.age_min) order by bi.product_id) from bundle_items bi join products p on p.id=bi.product_id where bi.bundle_id=b.id),'[]') items from bundles b where b.active order by b.id desc`),
   q('select id,title,yt_id from videos where active order by id desc'),
   q('select name,name_ru,image,section,sort,parent from categories order by case when coalesce(sort,0)>0 then sort else 999999 end asc,id asc'),
   q(`select count(*)::int c from products where active and ${SALE_SQL}`),
   q("select distinct family from products where active and family is not null and family<>'' order by family limit 40")
  ]);
  pubCache={
   wh:!!whR.enabled,
   d:dlR,
   anim:anR.rows[0]?.value||{preset:'none'},
   sup:suR.rows[0]?.value||{username:'',phone:''},
   banners:bnR.rows,
   bundles:bdR.rows,
   videos:vdR.rows,
   cats:ctR.rows,
   saleCount:scR.rows[0].c,
   families:fmR.rows.map(r=>r.family)
  };
  pubExp=Date.now()+30000;
  return pubCache;
 })().finally(()=>{pubPromise=null});
 return pubPromise;
}

/* External One-Way POS Sync Endpoint (Store 'Торговля' -> Mini App, protected by SYNC_API_KEY) */
const syncAuth=(req,res,next)=>{
 const key=String(process.env.SYNC_API_KEY||'').trim();
 if(!key)return res.status(503).json({error:'SYNC_API_KEY sozlanmagan'});
 const got=String(req.get('x-sync-key')||'');
 if(got.length!==key.length||!crypto.timingSafeEqual(Buffer.from(got),Buffer.from(key)))return res.status(401).json({error:"Kalit noto'g'ri"});
 next();
};
app.get('/api/sync/ping',syncAuth,wrap(async(req,res)=>{
 const [cR,lsR]=await Promise.all([
  q("select count(*)::int total_now,count(*) filter(where active)::int active_now,count(*) filter(where needs_setup)::int setup_now from products"),
  q("select value from settings where key='last_sync'")
 ]);
 const c=cR.rows[0]||{};
 res.json({ok:true,totalNow:c.total_now||0,activeNow:c.active_now||0,setupNow:c.setup_now||0,lastSync:lsR.rows[0]?.value||null});
}));
app.post('/api/sync/products',syncAuth,wrap(async(req,res)=>{
 const b=req.body||{};
 const out=await O.syncProducts(0,b.items,{autoActive:b.autoActive!==false,autoActivate:b.autoActivate,autoDeactivate:b.autoDeactivate,onlyInStockNew:b.onlyInStockNew===true,activateNew:b.activateNew===true,source:String(b.source||'pos').slice(0,30),runId:b.runId||null});
 bustPub();
 res.json({success:true,...out});
}));

const auth=async(req,res,next)=>{try{
 const p=new URLSearchParams(req.get('x-init-data')||'');const h=p.get('hash');p.delete('hash');
 const str=[...p.entries()].map(([k,v])=>`${k}=${v}`).sort().join('\n');
 const sec=crypto.createHmac('sha256','WebAppData').update(process.env.BOT_TOKEN).digest();
 const sig=crypto.createHmac('sha256',sec).update(str).digest('hex');
 if(!h||h.length!==sig.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(h))||Date.now()/1000-Number(p.get('auth_date'))>86400)throw 0;
 const u=JSON.parse(p.get('user'));const name=`${u.first_name||''} ${u.last_name||''}`.trim();
 const key=String(u.id);
 if(S.isBlocked(key))return res.status(403).json({error:"Hisobingiz xavfsizlik tizimi tomonidan bloklangan. Administratorga murojaat qiling."});
 const hit=userCache.get(key);
 if(hit&&hit.exp>Date.now()&&hit.u.name===name){req.me=hit.u;return next()}
 let row=(await q('select * from users where tg_id=$1',[u.id])).rows[0];
 if(!row)row=(await q('insert into users(tg_id,name) values($1,$2) on conflict(tg_id) do update set name=excluded.name returning *',[u.id,name])).rows[0];
 else if(name&&row.name!==name)row=(await q('update users set name=$1 where tg_id=$2 returning *',[name,u.id])).rows[0];
 userCache.set(key,{u:row,exp:Date.now()+15000});
 req.me=row;next();
}catch{res.status(401).json({error:'Avtorizatsiya xatosi'})}};
const need=(...r)=>(req,res,next)=>r.includes(req.me.role)?next():res.status(403).json({error:"Ruxsat yo'q"});
const needBroadcast=(req,res,next)=>(req.me.role==='superadmin'||(req.me.role==='admin'&&req.me.can_broadcast))?next():res.status(403).json({error:"Xabar yuborish ruxsati yo'q"});
const STAFF=['operator','admin','superadmin'],ADM=['admin','superadmin'];

app.use('/api',S.ipShield,auth,S.ddosGuard);

app.get('/api/init',wrap(async(req,res)=>{
 const m=req.me,staff=STAFF.includes(m.role),isAdm=ADM.includes(m.role);
 const [pub,ordR,pcR,bcR,suR,ppR,lsR,rlR,crR]=await Promise.all([
  getPub(),
  q(`select o.*,coalesce((select json_agg(json_build_object('id',i.id,'name',i.name,'name_uz',p.name_uz,'unit',i.unit,'qty',i.qty,'ordered_sum',i.ordered_sum,'actual_sum',i.actual_sum,'product_id',i.product_id,'image',p.image,'unit_price',i.unit_price,'cur_price',p.price,'sale_price',p.sale_price,'sale_until',p.sale_until,'min_grams',p.min_grams,'min_sum',p.min_sum,'weight_g',p.weight_g,'priority',p.priority,'family',p.family,'age_min',p.age_min,'active',p.active,'category',p.category,'sub_name',i.sub_name,'sub_status',i.sub_status) order by i.id) from order_items i left join products p on p.id=i.product_id where i.order_id=o.id),'[]') items from orders o ${staff?'':'where user_id=$1'} order by id desc limit ${staff?200:50}`,staff?[]:[m.tg_id]),
  isAdm?q("select count(*)::int c from users where card_status='pending'"):null,
  isAdm?q('select count(*)::int c from blocked_users where expires_at is null or expires_at>now()'):null,
  isAdm?q('select count(*)::int c from products where needs_setup'):null,
  isAdm?q('select * from pending_changes order by id'):null,
  isAdm?q("select value from settings where key='last_sync'"):null,
  m.role==='superadmin'?q("select tg_id,name,role,role_title,department,coalesce(can_broadcast,false) can_broadcast from users where role<>'user'"):null,
  m.role==='superadmin'?q("select value from settings where key='custom_roles'"):null
 ]);
 const d=pub.d;
 res.json({
  role:m.role,workerDepartment:m.department,
  user:{telegramId:m.tg_id,name:m.name,phone:m.phone,lang:m.lang||'uz',roleTitle:m.role_title||null,canBroadcast:m.role==='superadmin'||(m.role==='admin'&&!!m.can_broadcast),cardNumber:m.card_number||null,cardStatus:m.card_status||null,cardFullName:m.card_full_name||null,cardPhone:m.card_phone||null,cardAddress:m.card_address||null},
  warehouseEnabled:pub.wh,saleCount:pub.saleCount,
  pendingCardsCount:pcR?pcR.rows[0].c:0,
  blockedCount:bcR?bcR.rows[0].c:0,
  setupCount:suR?suR.rows[0].c:0,
  lastSync:lsR?lsR.rows[0]?.value||null:null,
  syncKeySet:isAdm?Boolean(String(process.env.SYNC_API_KEY||'').trim()):false,
  settings:{deliveryEnabled:d.enabled,freeDeliveryThreshold:Math.min(...d.rules.filter(r=>r.fee===0).map(r=>r.minTotal),Infinity),delivery:staff?d:{enabled:d.enabled,minTotal:d.minTotal||0,maxKg:d.maxKg||0,note:d.note||''},animation:pub.anim,support:pub.sup},
  cats:pub.cats,categories:pub.cats.map(c=>c.name),families:pub.families,products:[],banners:pub.banners,bundles:pub.bundles,videos:pub.videos,orders:ordR.rows,
  pendingProducts:ppR?ppR.rows:[],
  roles:rlR?rlR.rows:null,
  customRoles:crR&&Array.isArray(crR.rows[0]?.value)?crR.rows[0].value:[]
 });
}));

app.put('/api/user/lang',wrap(async(req,res)=>{const lang=req.body.lang==='ru'?'ru':'uz';await q('update users set lang=$1 where tg_id=$2',[lang,req.me.tg_id]);bustUser(req.me.tg_id);res.json({lang})}));
app.put('/api/user/phone',S.actionLimit('phone',5,600000),wrap(async(req,res)=>{const ph=O.normPhone(req.body.phone);if(!ph)return res.status(400).json({error:"Telefon raqam noto'g'ri"});await q('update users set phone=$1 where tg_id=$2',[ph,req.me.tg_id]);bustUser(req.me.tg_id);res.json({phone:ph})}));
app.post('/api/card/apply',S.actionLimit('card',3,600000),wrap(async(req,res)=>{
 if(req.me.card_status==='active'&&req.me.card_number)return res.status(400).json({error:'Sizda diskont karta allaqachon mavjud'});
 const fullName=String(req.body.fullName||'').trim().slice(0,120),phone=String(req.body.phone||req.me.phone||'').trim().slice(0,40),address=String(req.body.address||'').trim().slice(0,250);
 const phNorm=O.normPhone(phone);
 if(fullName.length<3||!phNorm||address.length<5)return res.status(400).json({error:"Ism-familiya, telefon va yashash manzilini to'liq kiriting"});
 await q("update users set card_status='pending',card_full_name=$1,card_phone=$2,card_address=$3,card_applied_at=now(),phone=coalesce(phone,$5) where tg_id=$4",[fullName,phone,address,req.me.tg_id,phNorm]);
 bustUser(req.me.tg_id);
 await audit(req.me.tg_id,'card.apply','user:'+req.me.tg_id,{fullName,phone});
 notifyCardApplied({tg_id:req.me.tg_id,fullName,phone,address});
 res.json({success:true})}));
app.get('/api/cards',need(...ADM),wrap(async(req,res)=>{
 const pending=(await q("select tg_id,name,phone,card_full_name,card_phone,card_address,card_applied_at from users where card_status='pending' order by card_applied_at desc nulls last")).rows;
 const active=(await q("select tg_id,name,phone,card_number,card_full_name,card_phone,card_address,card_applied_at from users where card_status='active' and card_number is not null order by card_applied_at desc nulls last limit 300")).rows;
 res.json({pending,active})}));
app.post('/api/cards/:tgId/approve',need(...ADM),wrap(async(req,res)=>{
 const num=String(req.body.cardNumber||'').trim().slice(0,40);if(num.length<3)return res.status(400).json({error:'Karta raqamini kiriting'});
 const tid=req.params.tgId;
 await q("update users set card_number=$1,card_status='active',card_applied_at=coalesce(card_applied_at,now()) where tg_id=$2",[num,tid]);
 bustUser(tid);
 await audit(req.me.tg_id,'card.approve','user:'+tid,{card:num});
 notifyCardApproved(tid,num);
 res.json({success:true})}));
app.post('/api/cards/:tgId/reject',need(...ADM),wrap(async(req,res)=>{
 const tid=req.params.tgId;
 await q("update users set card_status='rejected' where tg_id=$1 and card_status='pending'",[tid]);
 bustUser(tid);
 await audit(req.me.tg_id,'card.reject','user:'+tid);
 notifyCardRejected(tid);
 res.json({success:true})}));
app.put('/api/cards/:tgId',need(...ADM),wrap(async(req,res)=>{
 const num=String(req.body.cardNumber||'').trim().slice(0,40),tid=req.params.tgId;
 if(!num){await q('update users set card_number=null,card_status=null where tg_id=$1',[tid]);bustUser(tid);await audit(req.me.tg_id,'card.remove','user:'+tid);return res.json({success:true})}
 await q("update users set card_number=$1,card_status='active',card_applied_at=coalesce(card_applied_at,now()) where tg_id=$2",[num,tid]);
 bustUser(tid);
 await audit(req.me.tg_id,'card.bind','user:'+tid,{card:num});
 notifyCardApproved(tid,num);
 res.json({success:true})}));

/* Security & Blocked Users Management */
app.get('/api/security/blocked',need(...ADM),wrap(async(req,res)=>res.json(await S.listBlocked())));
app.post('/api/security/block',need(...ADM),wrap(async(req,res)=>{
 const tid=Number(req.body.tgId);
 const reason=String(req.body.reason||"Admin tomonidan bloklandi").trim().slice(0,200);
 const rec=await S.blockUser({tgId:tid,name:req.body.name||'',reason,auto:false,blockedBy:req.me.tg_id});
 bustUser(tid);
 res.json({success:true,item:rec})}));
app.delete('/api/security/blocked/:tgId',need(...ADM),wrap(async(req,res)=>{
 const tid=Number(req.params.tgId);
 await S.unblockUser(tid,req.me.tg_id);
 bustUser(tid);
 res.json({success:true})}));

app.post('/api/delivery/quote',wrap(async(req,res)=>res.json(await O.deliveryFee(Number(req.body.subtotal)||0,{lat:Number(req.body.lat),lng:Number(req.body.lng)}))));
app.post('/api/orders',S.actionLimit('order',5,60000),wrap(async(req,res)=>{const order=await O.createOrder(req.me,req.body);bustUser(req.me.tg_id);res.json({success:true,order})}));
app.post('/api/orders/:id/status',need(...STAFF),wrap(async(req,res)=>res.json(await O.setStatus(req.me.tg_id,+req.params.id,req.body.status,req.body.fee))));
app.post('/api/orders/:id/weigh',need(...STAFF),wrap(async(req,res)=>res.json(await O.weigh(req.me.tg_id,+req.params.id,req.body.items))));
app.post('/api/orders/:id/confirm',wrap(async(req,res)=>{await O.confirm(req.me.tg_id,+req.params.id,!!req.body.accept);res.json({success:true})}));
app.post('/api/upload',need('worker',...ADM),S.actionLimit('upload',30,60000),wrap(async(req,res)=>{const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+\/=]+)$/.exec(String(req.body.data||''));if(!m)return res.status(400).json({error:"Rasm formati noto'g'ri"});const buf=Buffer.from(m[2],'base64');if(buf.length>700000)return res.status(400).json({error:'Rasm juda katta'});
 const r=(await q('insert into images(mime,data) values($1,$2) returning id',[m[1],buf])).rows[0];res.json({url:'/img/'+r.id})}));
app.post('/api/products',need('worker',...ADM),wrap(async(req,res)=>{const r=await O.saveProduct(req.me,req.body);bustPub();res.json(r)}));
app.put('/api/products/:id',need('worker',...ADM),wrap(async(req,res)=>{const r=await O.saveProduct(req.me,req.body,+req.params.id);bustPub();res.json(r)}));
app.delete('/api/products/:id',need('worker',...ADM),wrap(async(req,res)=>{const r=await O.deleteProduct(req.me,+req.params.id);bustPub();res.json(r)}));
app.post('/api/changes/:id',need(...ADM),wrap(async(req,res)=>{await O.resolveChange(req.me.tg_id,+req.params.id,!!req.body.approve);bustPub();res.json({success:true})}));
app.post('/api/categories',need(...ADM),wrap(async(req,res)=>{const n=String(req.body.name||'').trim().slice(0,60);if(!n)return res.status(400).json({error:'Nom kerak'});
 if(req.body.action==='delete')await q('delete from categories where name=$1',[n]);else await q('insert into categories(name) values($1) on conflict do nothing',[n]);
 bustPub();await audit(req.me.tg_id,'category.'+(req.body.action||'add'),'category',{n});res.json({success:true})}));
app.put('/api/settings/delivery',need(...ADM),wrap(async(req,res)=>{const b=req.body,old=await getSetting('delivery');const v={...old,enabled:typeof b.enabled==='boolean'?b.enabled:old.enabled,minTotal:Math.max(0,Math.round(+b.minTotal||0)),maxKg:Math.max(0,Math.min(500,Math.round((+b.maxKg||0)*10)/10)),note:String(b.note||'').slice(0,200)};await setSetting('delivery',v);bustPub();await audit(req.me.tg_id,'settings.delivery','settings',{old,new:v});res.json(v)}));
app.post('/api/admin/products/sync',need(...ADM),wrap(async(req,res)=>{const b=req.body||{};const out=await O.syncProducts(req.me.tg_id,b.items,{autoActive:b.autoActive!==false,autoActivate:b.autoActivate,autoDeactivate:b.autoDeactivate,onlyInStockNew:b.onlyInStockNew===true,activateNew:b.activateNew===true,source:String(b.source||'csv').slice(0,30),runId:b.runId||null});bustPub();res.json({success:true,...out})}));
app.put('/api/settings/support',need(...ADM),wrap(async(req,res)=>{const raw=String(req.body.username||'').trim().replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i,'').replace(/^@+/,'').replace(/\/.*$/,'').trim();
 if(raw&&!/^[a-zA-Z0-9_]{3,32}$/.test(raw))return res.status(400).json({error:"Telegram username noto'g'ri (masalan: @tegen_support)"});
 const phone=String(req.body.phone||'').trim().slice(0,30);const v={username:raw,phone};await setSetting('support',v);bustPub();await audit(req.me.tg_id,'settings.support','settings',v);res.json(v)}));
app.put('/api/settings/warehouse',need('superadmin'),wrap(async(req,res)=>{const v={enabled:!!req.body.enabled};await setSetting('warehouse',v);bustPub();
 await audit(req.me.tg_id,'settings.warehouse','settings',v);res.json(v)}));
app.put('/api/settings/animation',need('superadmin'),wrap(async(req,res)=>{const ok=['none','newyear','navruz','ramazon','autumn','confetti'];const preset=ok.includes(req.body.preset)?req.body.preset:'none';const v={preset};await setSetting('animation',v);bustPub();await audit(req.me.tg_id,'settings.animation','settings',v);res.json(v)}));
app.put('/api/products/:id/stock',need('superadmin'),wrap(async(req,res)=>{if(!(await getSetting('warehouse')).enabled)return res.status(400).json({error:'Ombor tizimi yoqilmagan'});
 await q('update products set stock=$1 where id=$2',[req.body.stock==null?null:Number(req.body.stock),+req.params.id]);await audit(req.me.tg_id,'product.stock','product:'+req.params.id,req.body);res.json({success:true})}));
app.post('/api/roles',need('superadmin'),wrap(async(req,res)=>{const{targetId,role,roleTitle,name,department,canBroadcast}=req.body;
 if(!['user','worker','operator','admin'].includes(role)||!Number(targetId))return res.status(400).json({error:"Noto'g'ri"});
 const ex=(await q('select role from users where tg_id=$1',[targetId])).rows[0];
 if(ex?.role==='superadmin')return res.status(403).json({error:"Super Admin rolini o'zgartirib bo'lmaydi"});
 const cb=role==='admin'?!!canBroadcast:false;
 const rt=role==='user'?null:(String(roleTitle||'').trim().slice(0,40)||null);
 await q("insert into users(tg_id,name,role,role_title,department,can_broadcast) values($1,$2,$3,$4,$5,$6) on conflict(tg_id) do update set role=$3,role_title=$4,department=$5,can_broadcast=$6,name=coalesce(nullif($2,''),users.name)",[targetId,name||'',role,rt,role==='worker'?department:null,cb]);
 bustUser(targetId);
 await audit(req.me.tg_id,'role.set','user:'+targetId,{role,roleTitle:rt,department,canBroadcast:cb});res.json({success:true})}));
app.post('/api/custom-roles',need('superadmin'),wrap(async(req,res)=>{
 const name=String(req.body.name||'').trim().slice(0,40);
 const base=['worker','operator','admin'].includes(req.body.base)?req.body.base:'operator';
 const icon=String(req.body.icon||'👤').trim().slice(0,8)||'👤';
 const canBroadcast=base==='admin'?!!req.body.canBroadcast:false;
 if(name.length<2)return res.status(400).json({error:'Rol nomini kiriting'});
 const row=(await q("select value from settings where key='custom_roles'")).rows[0];
 const list=Array.isArray(row?.value)?[...row.value]:[];
 const id='cr_'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
 const item={id,name,base,icon,canBroadcast};
 const next=[...list.filter(x=>x.name.toLowerCase()!==name.toLowerCase()),item].slice(-30);
 await setSetting('custom_roles',next);
 await audit(req.me.tg_id,'role.custom_add','settings',{name,base});
 res.json({item,customRoles:next});
}));
app.delete('/api/custom-roles/:id',need('superadmin'),wrap(async(req,res)=>{
 const id=String(req.params.id||'');
 const row=(await q("select value from settings where key='custom_roles'")).rows[0];
 const list=Array.isArray(row?.value)?row.value.filter(x=>x.id!==id):[];
 await setSetting('custom_roles',list);
 await audit(req.me.tg_id,'role.custom_delete','settings',{id});
 res.json({customRoles:list});
}));
app.put('/api/roles/:tgId/broadcast',need('superadmin'),wrap(async(req,res)=>{const tid=req.params.tgId,cb=!!req.body.canBroadcast;
 await q("update users set can_broadcast=$1 where tg_id=$2 and role='admin'",[cb,tid]);
 bustUser(tid);
 await audit(req.me.tg_id,'role.broadcast','user:'+tid,{canBroadcast:cb});res.json({success:true})}));
app.get('/api/broadcast',needBroadcast,wrap(async(req,res)=>{
 const counts=(await q("select count(*)::int all_c,count(*) filter(where coalesce(lang,'uz')<>'ru')::int uz_c,count(*) filter(where lang='ru')::int ru_c from users")).rows[0];
 const history=(await q('select * from broadcasts order by id desc limit 30')).rows;
 res.json({counts:{all:counts.all_c,uz:counts.uz_c,ru:counts.ru_c},history})}));
app.post('/api/broadcast',needBroadcast,wrap(async(req,res)=>{
 const kind=['text','photo','video'].includes(req.body.kind)?req.body.kind:'text';
 const target=['all','uz','ru'].includes(req.body.target)?req.body.target:'all';
 const text=String(req.body.text||'').trim().slice(0,kind==='text'?3800:1000);
 const mediaUrl=String(req.body.mediaUrl||'').trim().slice(0,500);
 const withBtn=req.body.withBtn!==false;
 if(kind==='text'&&!text)return res.status(400).json({error:'Xabar matnini kiriting'});
 if(kind==='photo'&&!mediaUrl)return res.status(400).json({error:'Rasm yuklang'});
 if(kind==='video'&&!/^https?:\/\//i.test(mediaUrl))return res.status(400).json({error:"Video uchun to'g'ri https:// havola kiriting (yoki botda /broadcast ishlating)"});
 const r=await runBroadcast({sender:req.me,target,kind,text,mediaUrl,preview:text,withBtn});
 res.json({success:true,...r})}));
app.get('/api/audit',need(...ADM),wrap(async(req,res)=>{const dd=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||'')?x:null;
 res.json((await q(`select a.*,u.name actor_name from audit a left join users u on u.tg_id=a.actor where ($1::date is null or (a.at at time zone 'Asia/Tashkent')::date>=$1::date) and ($2::date is null or (a.at at time zone 'Asia/Tashkent')::date<=$2::date) order by a.id desc limit 1000`,[dd(req.query.from),dd(req.query.to)])).rows)}));
app.get('/api/stats',need(...ADM),wrap(async(req,res)=>{
 const dd=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||'')?x:null;
 const from=dd(req.query.from),to=dd(req.query.to);
 const oneDay=Boolean(from&&to&&from===to);
 const df="($1::date is null or (o.created_at at time zone 'Asia/Tashkent')::date>=$1::date) and ($2::date is null or (o.created_at at time zone 'Asia/Tashkent')::date<=$2::date)";
 const days=oneDay
  ?(await q(`select to_char(o.created_at at time zone 'Asia/Tashkent','HH24:00') d,count(*)::int n,coalesce(sum(o.total),0)::bigint sum from orders o where o.status<>'cancelled' and ${df} group by 1 order by 1`,[from,to])).rows
  :(await q(`select to_char(o.created_at at time zone 'Asia/Tashkent','YYYY-MM-DD') d,count(*)::int n,coalesce(sum(o.total),0)::bigint sum from orders o where o.status<>'cancelled' and ${from||to?df:"o.created_at>now()-interval '14 days'"} group by 1 order by 1`,from||to?[from,to]:[])).rows;
 const t=(await q(`select count(*)::int orders,count(*) filter(where o.status<>'cancelled')::int valid_orders,count(*) filter(where o.status='cancelled')::int cancelled,coalesce(sum(o.total) filter(where o.status<>'cancelled'),0)::bigint revenue,coalesce(round(avg(o.total) filter(where o.status<>'cancelled')),0)::bigint avg_check,count(*) filter(where o.status in('new','age_check'))::int pending from orders o where ${df}`,[from,to])).rows[0];
 const byCat=(await q(`select coalesce(p.category,'Nabor') c,sum(coalesce(i.actual_sum,i.ordered_sum))::bigint s from order_items i join orders o on o.id=i.order_id and o.status<>'cancelled' and ${df} left join products p on p.id=i.product_id group by 1 order by 2 desc limit 6`,[from,to])).rows;
 const pc=(await q("select count(*)::int total,count(*) filter(where active)::int active,count(*) filter(where needs_setup)::int setup from products")).rows[0];
 const cust=(await q(`select count(*)::int total,count(*) filter(where ($1::date is null or (created_at at time zone 'Asia/Tashkent')::date>=$1::date) and ($2::date is null or (created_at at time zone 'Asia/Tashkent')::date<=$2::date))::int added from users`,[from,to])).rows[0];
 res.json({totals:t,days,granularity:oneDay?'hour':'day',byCat,products:pc,customers:cust.total,newCustomers:cust.added})}));
const YT=/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/;
const KIND={banners:['image','title','subtitle','link'],videos:['title','yt_id'],bundles:['title','title_ru','description','description_ru','image','price']};
const PSEL='id,category,name,name_uz,description,min_grams,min_sum,weight_g,priority,family,sales_count,unit,price,sale_price,sale_until,image,age_min';
app.get('/api/products',wrap(async(req,res)=>{const s=String(req.query.q||'').trim().slice(0,60),cat=String(req.query.cat||''),fam=String(req.query.family||'').trim().slice(0,60),sale=req.query.sale==='1',pg=Math.max(0,Math.min(500,+req.query.page||0)),w=['active'],p=[];
 if(s){p.push('%'+s+'%',s);w.push(`(name ilike $${p.length-1} or name_uz ilike $${p.length-1} or barcode=$${p.length})`)}
 if(cat){p.push(cat);const k=p.length;w.push(`(category=$${k} or category in (select name from categories where parent=$${k}) or category in (select c2.name from categories c2 join categories c1 on c2.parent=c1.name where c1.parent=$${k}))`)}
 if(fam){p.push(fam);w.push(`family=$${p.length}`)}
 if(sale)w.push(SALE_SQL);
 const pub=await getPub();
 if(pub.wh)w.push('(stock is null or stock>0)');
 const ord=sale?'coalesce(priority,3) asc,sale_until nulls last,coalesce(sales_count,0) desc,name':'coalesce(priority,3) asc,coalesce(sales_count,0) desc,name';
 const r=(await q(`select ${PSEL} from products where ${w.join(' and ')} order by ${ord} limit 51 offset ${pg*50}`,p)).rows;
 res.json({items:r.slice(0,50),more:r.length>50})}));
app.get('/api/admin/products',need('worker','operator',...ADM),wrap(async(req,res)=>{const s=String(req.query.q||'').trim().slice(0,60),st=req.query.state,cat=String(req.query.cat||''),fam=String(req.query.family||'').trim().slice(0,60),pr=Number(req.query.prio)||0,pg=Math.max(0,Math.min(2000,+req.query.page||0)),w=['true'],p=[];
 if(req.me.role==='worker'){p.push(req.me.department);w.push(`category=$${p.length}`)}
 else if(cat){p.push(cat);const k=p.length;w.push(`(category=$${k} or category in (select name from categories where parent=$${k}) or category in (select c2.name from categories c2 join categories c1 on c2.parent=c1.name where c1.parent=$${k}))`)}
 if(fam){p.push(fam);w.push(`family=$${p.length}`)}
 if(pr>=1&&pr<=5){p.push(pr);w.push(`coalesce(priority,3)=$${p.length}`)}
 if(s){p.push('%'+s+'%',s);w.push(`(name ilike $${p.length-1} or name_uz ilike $${p.length-1} or barcode=$${p.length})`)}
 if(st==='on')w.push('active');if(st==='off')w.push('not active');if(st==='sale')w.push(SALE_SQL);if(st==='setup')w.push('needs_setup');
 const r=(await q(`select ${PSEL},active,stock,barcode,needs_setup from products where ${w.join(' and ')} order by needs_setup desc,coalesce(priority,3) asc,coalesce(sales_count,0) desc,name limit 51 offset ${pg*50}`,p)).rows;
 res.json({items:r.slice(0,50),more:r.length>50})}));
app.get('/api/admin/products/:id/analytics',need(...ADM),wrap(async(req,res)=>{
 const id=+req.params.id;
 if(!(id>0))return res.status(400).json({error:"Noto'g'ri ID"});
 const p=(await q(`select ${PSEL},active,stock,barcode,needs_setup from products where id=$1`,[id])).rows[0];
 if(!p)return res.status(404).json({error:'Mahsulot topilmadi'});
 const [totR,recR,dayR,rkR]=await Promise.all([
  q(`select coalesce(sum(i.qty),0)::numeric qty,coalesce(sum(coalesce(i.actual_sum,i.ordered_sum)),0)::bigint revenue,count(distinct o.id)::int orders,count(distinct o.user_id)::int buyers,max(o.created_at) last_order from order_items i join orders o on o.id=i.order_id and o.status<>'cancelled' where i.product_id=$1`,[id]),
  q(`select coalesce(sum(i.qty) filter(where o.created_at>now()-interval '7 days'),0)::numeric qty7,coalesce(sum(coalesce(i.actual_sum,i.ordered_sum)) filter(where o.created_at>now()-interval '7 days'),0)::bigint rev7,coalesce(sum(i.qty) filter(where o.created_at>now()-interval '30 days'),0)::numeric qty30,coalesce(sum(coalesce(i.actual_sum,i.ordered_sum)) filter(where o.created_at>now()-interval '30 days'),0)::bigint rev30 from order_items i join orders o on o.id=i.order_id and o.status<>'cancelled' where i.product_id=$1`,[id]),
  q(`select to_char(o.created_at at time zone 'Asia/Tashkent','YYYY-MM-DD') d,coalesce(sum(i.qty),0)::numeric qty,coalesce(sum(coalesce(i.actual_sum,i.ordered_sum)),0)::bigint sum from order_items i join orders o on o.id=i.order_id and o.status<>'cancelled' and o.created_at>now()-interval '14 days' where i.product_id=$1 group by 1 order by 1`,[id]),
  q(`select count(*) filter(where active)::int total,1+count(*) filter(where active and (coalesce(priority,3)<$2 or (coalesce(priority,3)=$2 and coalesce(sales_count,0)>$3) or (coalesce(priority,3)=$2 and coalesce(sales_count,0)=$3 and name<$4)))::int pos from products where category=$1`,[p.category,p.priority||3,p.sales_count||0,p.name])
 ]);
 const t=totR.rows[0],rc=recR.rows[0],rk=rkR.rows[0];
 res.json({
  product:p,
  totals:{qty:Number(t.qty)||0,revenue:Number(t.revenue)||0,orders:t.orders||0,buyers:t.buyers||0,lastOrder:t.last_order||null},
  recent:{qty7:Number(rc.qty7)||0,rev7:Number(rc.rev7)||0,qty30:Number(rc.qty30)||0,rev30:Number(rc.rev30)||0},
  days:dayR.rows.map(x=>({d:x.d,qty:Number(x.qty)||0,sum:Number(x.sum)||0})),
  rank:{inCat:p.active?rk.pos:null,totalInCat:rk.total||0}
 });
}));
app.get('/api/recommend',wrap(async(req,res)=>{const cats=String(req.query.cats||'').split('|').filter(Boolean).slice(0,6),ex=String(req.query.ex||'').split(',').map(Number).filter(Boolean).slice(0,60);
 res.json((await q(`select ${PSEL} from products where active and unit='piece' and category=any($1::text[]) and id<>all($2::int[]) order by random() limit 12`,[cats,ex])).rows)}));
app.put('/api/products/:id/active',need(...ADM),wrap(async(req,res)=>{await q('update products set active=$1 where id=$2',[!!req.body.active,+req.params.id]);bustPub();await audit(req.me.tg_id,'product.active','product:'+req.params.id,{active:!!req.body.active});res.json({success:true})}));
app.get('/api/content',need(...ADM),wrap(async(req,res)=>res.json({banners:(await q('select * from banners order by sort,id')).rows,videos:(await q('select * from videos order by id desc')).rows,bundles:(await q('select * from bundles order by id desc')).rows})));
app.post('/api/content/:kind',need(...ADM),wrap(async(req,res)=>{const k=req.params.kind,b={...req.body};if(!KIND[k])return res.sendStatus(404);
 if(k==='videos'){const m=YT.exec(String(b.url||''));if(!m)return res.status(400).json({error:"YouTube havolasi noto'g'ri"});b.yt_id=m[1]}
 if(k==='bundles'&&(!b.title||!(+b.price>0)||!Array.isArray(b.items)||!b.items.length))return res.status(400).json({error:"Nabor ma'lumoti to'liq emas"});
 if(k==='banners'){if(!b.image)return res.status(400).json({error:'Rasm kerak'});b.link=S.safeUrl(b.link)}
 const cols=KIND[k],r=(await q(`insert into ${k}(${cols.join(',')}) values(${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning id`,cols.map(c=>b[c]??null))).rows[0];
 if(k==='bundles')for(const it of b.items.slice(0,30))await q('insert into bundle_items values($1,$2,$3)',[r.id,+it.productId,Math.max(1,+it.qty||1)]);
 bustPub();await audit(req.me.tg_id,'content.'+k+'.add',k+':'+r.id,{title:b.title});res.json({id:r.id})}));
app.put('/api/content/:kind/:id/active',need(...ADM),wrap(async(req,res)=>{const k=req.params.kind;if(!KIND[k])return res.sendStatus(404);await q(`update ${k} set active=$1 where id=$2`,[!!req.body.active,+req.params.id]);bustPub();await audit(req.me.tg_id,'content.'+k+'.active',k+':'+req.params.id,{active:!!req.body.active});res.json({success:true})}));
app.delete('/api/content/:kind/:id',need(...ADM),wrap(async(req,res)=>{const k=req.params.kind;if(!KIND[k])return res.sendStatus(404);await q(`delete from ${k} where id=$1`,[+req.params.id]);bustPub();await audit(req.me.tg_id,'content.'+k+'.delete',k+':'+req.params.id);res.json({success:true})}));

app.get('/api/customers',need(...ADM),wrap(async(req,res)=>{const s='%'+String(req.query.q||'').trim().slice(0,40)+'%';
 res.json((await q(`select u.tg_id,u.name,u.phone,u.role,u.card_number,u.card_status,(b.tg_id is not null) blocked,max(o.created_at) last,count(o.id) filter(where o.status<>'cancelled')::int orders,coalesce(sum(o.total) filter(where o.status<>'cancelled'),0)::bigint spent from users u left join orders o on o.user_id=u.tg_id left join blocked_users b on b.tg_id=u.tg_id and (b.expires_at is null or b.expires_at>now()) where (u.name ilike $1 or coalesce(u.phone,'') ilike $1 or coalesce(u.card_number,'') ilike $1 or u.tg_id::text ilike $1) group by u.tg_id,b.tg_id order by last desc nulls last,u.created_at desc limit 200`,[s])).rows)}));
app.put('/api/content/banners/:id',need(...ADM),wrap(async(req,res)=>{const b=req.body;await q('update banners set title=$1,subtitle=$2,link=$3,image=coalesce(nullif($4,\'\'),image) where id=$5',[b.title||null,b.subtitle||null,S.safeUrl(b.link),b.image||'',+req.params.id]);bustPub();await audit(req.me.tg_id,'content.banners.edit','banners:'+req.params.id,{title:b.title});res.json({success:true})}));
app.post('/api/cats',need(...ADM),wrap(async(req,res)=>{const b=req.body,n=String(b.name||'').trim().slice(0,60);if(!n)return res.status(400).json({error:'Nom kerak'});
 const par=String(b.parent||'').trim().slice(0,60)||null;const cleanPar=par===n||par===b.old?null:par;
 if(b.old&&b.old!==n){await q('update categories set name=$1 where name=$2',[n,b.old]);await q('update categories set parent=$1 where parent=$2',[n,b.old]);await q('update products set category=$1 where category=$2',[n,b.old])}
 await q('insert into categories(name,name_ru,image,section,sort,parent) values($1,$2,$3,$4,$5,$6) on conflict(name) do update set name_ru=$2,image=coalesce($3,categories.image),section=$4,sort=$5,parent=$6',[n,b.name_ru||null,b.image||null,b.section||null,Math.max(0,Math.round(+b.sort)||0),cleanPar]);
 bustPub();await audit(req.me.tg_id,'category.save','category',{n,parent:cleanPar});res.json({success:true})}));
app.put('/api/cats/reorder',need(...ADM),wrap(async(req,res)=>{
 const names=Array.isArray(req.body.names)?req.body.names.map(x=>String(x||'').trim()).filter(Boolean).slice(0,200):[];
 if(!names.length)return res.status(400).json({error:"Ro'yxat bo'sh"});
 for(let i=0;i<names.length;i++)await q('update categories set sort=$1 where name=$2',[i+1,names[i]]);
 bustPub();await audit(req.me.tg_id,'category.save','category',{n:'reorder',count:names.length});res.json({success:true});
}));
app.delete('/api/cats/:name',need(...ADM),wrap(async(req,res)=>{await q('update categories set parent=null where parent=$1',[req.params.name]);await q("update products set category='Boshqa' where category=$1",[req.params.name]);await q('delete from categories where name=$1',[req.params.name]);bustPub();await audit(req.me.tg_id,'category.delete','category',{n:req.params.name});res.json({success:true})}));

app.post('/api/orders/:id/substitute',need(...STAFF),wrap(async(req,res)=>res.json(await O.propose(req.me.tg_id,+req.params.id,+req.body.itemId,+req.body.productId))));
app.post('/api/orders/:id/send-sub',need(...STAFF),wrap(async(req,res)=>res.json(await O.sendSub(req.me.tg_id,+req.params.id))));
app.post('/api/orders/:id/sub-answer',wrap(async(req,res)=>{await O.subAnswer(req.me.tg_id,+req.params.id,!!req.body.accept);res.json({success:true})}));
app.post('/api/orders/:id/edit-request',wrap(async(req,res)=>{await O.editRequest(req.me.tg_id,+req.params.id);res.json({success:true})}));
app.post('/api/orders/:id/edit-decide',need(...STAFF),wrap(async(req,res)=>{await O.editDecide(req.me.tg_id,+req.params.id,!!req.body.allow);res.json({success:true})}));
app.post('/api/orders/:id/edit-apply',wrap(async(req,res)=>{await O.editApply(req.me.tg_id,+req.params.id,req.body.changes);res.json({success:true})}));

(async()=>{const port=process.env.PORT||8080;
 await S.initSecurity(notifyAutoBlock);
 if(process.env.PUBLIC_URL&&process.env.BOT_TOKEN){app.use(await bot.createWebhook({domain:process.env.PUBLIC_URL.replace(/^https?:\/\//,'').replace(/\/+$/,''),path:'/bot',secret_token:process.env.WEBHOOK_SECRET}))}
 else if(process.env.BOT_TOKEN)bot.launch();
 const path=require('path'),fs=require('fs'),pub=path.join(__dirname,'../public');
 if(fs.existsSync(pub)){
  const noCache=res=>res.set({'Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate','Pragma':'no-cache','Expires':'0'});
  app.use('/assets',express.static(path.join(pub,'assets'),{maxAge:'1y',immutable:true}));
  app.use(express.static(pub,{index:false,maxAge:'10m'}));
  app.get('*',(req,res)=>{noCache(res);res.sendFile(path.join(pub,'index.html'))});
 }
 app.listen(port,()=>console.log('server',port));
 process.once('SIGTERM',()=>process.exit(0));})();

           
