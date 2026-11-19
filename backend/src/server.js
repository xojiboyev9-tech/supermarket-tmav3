// JOYI: backend/src/server.js  (GitHub'da shu yo'l bilan yarating)
require('dotenv').config();
const express=require('express'),helmet=require('helmet'),cors=require('cors'),rate=require('express-rate-limit'),crypto=require('crypto');
const {q,audit,getSetting,setSetting}=require('./db');const O=require('./orders');const {bot}=require('./bot');
process.on('unhandledRejection',e=>console.error('unhandled',e));
const app=express();app.set('trust proxy',1);app.use(helmet());
app.use(cors({origin:(process.env.WEBAPP_URL||'').replace(/\/+$/,'')}));app.use(express.json({limit:'200kb'}));
app.use('/api',rate({windowMs:60000,limit:120}));
app.get('/health',(r,s)=>s.json({ok:true}));
const wrap=f=>(req,res)=>f(req,res).catch(e=>{if(!e.status)console.error(e);res.status(e.status||500).json({error:e.status?e.message:'Server xatosi'})});
const auth=async(req,res,next)=>{try{
 const p=new URLSearchParams(req.get('x-init-data')||'');const h=p.get('hash');p.delete('hash');
 const str=[...p.entries()].map(([k,v])=>`${k}=${v}`).sort().join('\n');
 const sec=crypto.createHmac('sha256','WebAppData').update(process.env.BOT_TOKEN).digest();
 const sig=crypto.createHmac('sha256',sec).update(str).digest('hex');
 if(!h||h.length!==sig.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(h))||Date.now()/1000-Number(p.get('auth_date'))>86400)throw 0;
 const u=JSON.parse(p.get('user'));const name=`${u.first_name||''} ${u.last_name||''}`.trim();
 req.me=(await q("insert into users(tg_id,name) values($1,$2) on conflict(tg_id) do update set name=excluded.name returning *",[u.id,name])).rows[0];next();
}catch{res.status(401).json({error:'Avtorizatsiya xatosi'})}};
const need=(...r)=>(req,res,next)=>r.includes(req.me.role)?next():res.status(403).json({error:"Ruxsat yo'q"});
const STAFF=['operator','admin','superadmin'],ADM=['admin','superadmin'];
app.use('/api',auth);
app.get('/api/init',wrap(async(req,res)=>{const m=req.me,staff=STAFF.includes(m.role),wh=(await getSetting('warehouse')).enabled,d=await getSetting('delivery');
 const prods=(await q('select id,category,name,unit,price,image'+(wh?',stock':'')+' from products where active order by id')).rows;
 const ord=(await q(`select o.*,coalesce((select json_agg(i order by i.id) from order_items i where i.order_id=o.id),'[]') items from orders o ${staff?'':'where user_id=$1'} order by id desc limit 200`,staff?[]:[m.tg_id])).rows;
 res.json({role:m.role,workerDepartment:m.department,user:{telegramId:m.tg_id,name:m.name,phone:m.phone},warehouseEnabled:wh,
  settings:{deliveryEnabled:d.enabled,freeDeliveryThreshold:Math.min(...d.rules.filter(r=>r.fee===0).map(r=>r.minTotal),Infinity),delivery:staff?d:{enabled:d.enabled,maxKm:d.maxKm,baseFee:d.baseFee,rules:d.rules}},
  categories:(await q('select name from categories order by id')).rows.map(r=>r.name),products:prods,orders:ord,
  pendingProducts:ADM.includes(m.role)?(await q('select * from pending_changes order by id')).rows:[],
  roles:m.role==='superadmin'?(await q("select tg_id,name,role,department from users where role<>'user'")).rows:null})}));
app.post('/api/delivery/quote',wrap(async(req,res)=>res.json(await O.deliveryFee(Number(req.body.subtotal)||0,{lat:Number(req.body.lat),lng:Number(req.body.lng)}))));
app.post('/api/orders',wrap(async(req,res)=>res.json({success:true,order:await O.createOrder(req.me,req.body)})));
app.post('/api/orders/:id/status',need(...STAFF),wrap(async(req,res)=>res.json(await O.setStatus(req.me.tg_id,+req.params.id,req.body.status))));
app.post('/api/orders/:id/weigh',need(...STAFF),wrap(async(req,res)=>res.json(await O.weigh(req.me.tg_id,+req.params.id,req.body.items))));
app.post('/api/orders/:id/confirm',wrap(async(req,res)=>{await O.confirm(req.me.tg_id,+req.params.id,!!req.body.accept);res.json({success:true})}));
app.post('/api/products',need('worker',...ADM),wrap(async(req,res)=>res.json(await O.saveProduct(req.me,req.body))));
app.put('/api/products/:id',need('worker',...ADM),wrap(async(req,res)=>res.json(await O.saveProduct(req.me,req.body,+req.params.id))));
app.delete('/api/products/:id',need('worker',...ADM),wrap(async(req,res)=>res.json(await O.deleteProduct(req.me,+req.params.id))));
app.post('/api/changes/:id',need(...ADM),wrap(async(req,res)=>{await O.resolveChange(req.me.tg_id,+req.params.id,!!req.body.approve);res.json({success:true})}));
app.post('/api/categories',need(...ADM),wrap(async(req,res)=>{const n=String(req.body.name||'').trim().slice(0,60);if(!n)return res.status(400).json({error:'Nom kerak'});
 if(req.body.action==='delete')await q('delete from categories where name=$1',[n]);else await q('insert into categories(name) values($1) on conflict do nothing',[n]);
 await audit(req.me.tg_id,'category.'+(req.body.action||'add'),'category',{n});res.json({success:true})}));
app.put('/api/settings/delivery',need(...ADM),wrap(async(req,res)=>{const b=req.body,old=await getSetting('delivery'),n=Number;
 const rules=(Array.isArray(b.rules)?b.rules:old.rules).slice(0,20).map(r=>({minTotal:Math.max(0,n(r.minTotal)||0),maxKm:Math.max(0,n(r.maxKm)||0),fee:Math.max(0,n(r.fee)||0)}));
 const v={enabled:typeof b.enabled==='boolean'?b.enabled:old.enabled,store:b.store&&isFinite(b.store.lat)&&isFinite(b.store.lng)?{lat:n(b.store.lat),lng:n(b.store.lng)}:old.store,maxKm:n(b.maxKm)||old.maxKm,baseFee:b.baseFee!=null?Math.max(0,n(b.baseFee)):old.baseFee,rules};
 await setSetting('delivery',v);await audit(req.me.tg_id,'settings.delivery','settings',{old,new:v});res.json(v)}));
app.put('/api/settings/warehouse',need('superadmin'),wrap(async(req,res)=>{const v={enabled:!!req.body.enabled};await setSetting('warehouse',v);
 await audit(req.me.tg_id,'settings.warehouse','settings',v);res.json(v)}));
app.put('/api/products/:id/stock',need('superadmin'),wrap(async(req,res)=>{if(!(await getSetting('warehouse')).enabled)return res.status(400).json({error:'Ombor tizimi yoqilmagan'});
 await q('update products set stock=$1 where id=$2',[req.body.stock==null?null:Number(req.body.stock),+req.params.id]);await audit(req.me.tg_id,'product.stock','product:'+req.params.id,req.body);res.json({success:true})}));
app.post('/api/roles',need('superadmin'),wrap(async(req,res)=>{const{targetId,role,name,department}=req.body;
 if(!['user','worker','operator','admin'].includes(role)||!Number(targetId))return res.status(400).json({error:"Noto'g'ri"});
 await q("insert into users(tg_id,name,role,department) values($1,$2,$3,$4) on conflict(tg_id) do update set role=$3,department=$4,name=coalesce(nullif($2,''),users.name)",[targetId,name||'',role,role==='worker'?department:null]);
 await audit(req.me.tg_id,'role.set','user:'+targetId,{role,department});res.json({success:true})}));
app.get('/api/audit',need(...ADM),wrap(async(req,res)=>res.json((await q('select a.*,u.name actor_name from audit a left join users u on u.tg_id=a.actor order by a.id desc limit 300')).rows)));
app.get('/api/stats',need(...ADM),wrap(async(req,res)=>{
 const days=(await q("select to_char(created_at,'YYYY-MM-DD') d,count(*)::int n,coalesce(sum(total),0)::bigint sum from orders where status not in('cancelled') and created_at>now()-interval '14 days' group by 1 order by 1")).rows;
 const t=(await q("select count(*)::int orders,coalesce(sum(total) filter(where status<>'cancelled'),0)::bigint revenue from orders")).rows[0];
 res.json({totals:t,days,customers:(await q("select count(*)::int c from users where phone is not null")).rows[0].c})}));
(async()=>{const port=process.env.PORT||8080;
 if(process.env.PUBLIC_URL&&process.env.BOT_TOKEN){app.use(await bot.createWebhook({domain:process.env.PUBLIC_URL.replace(/^https?:\/\//,'').replace(/\/+$/,''),path:'/bot',secret_token:process.env.WEBHOOK_SECRET}))}
 else if(process.env.BOT_TOKEN)bot.launch();
 app.listen(port,()=>console.log('server',port));
 process.once('SIGTERM',()=>process.exit(0));})();
                                 
