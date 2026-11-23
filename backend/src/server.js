// JOYI: backend/src/server.js  (GitHub'da shu yo'l bilan yarating)
require('dotenv').config();
const express=require('express'),helmet=require('helmet'),cors=require('cors'),rate=require('express-rate-limit'),crypto=require('crypto');
const {q,audit,getSetting,setSetting}=require('./db');const O=require('./orders');const {bot}=require('./bot');
process.on('unhandledRejection',e=>console.error('unhandled',e));
const app=express();app.set('trust proxy',1);app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false,frameguard:false,referrerPolicy:{policy:'strict-origin-when-cross-origin'}}));
app.use(cors({origin:(process.env.WEBAPP_URL||'').replace(/\/+$/,'')}));app.use(express.json({limit:'1mb'}));
app.get('/img/:id',async(req,res)=>{try{const r=(await q('select mime,data from images where id=$1',[+req.params.id])).rows[0];if(!r)return res.sendStatus(404);res.set({'Content-Type':r.mime,'Cache-Control':'public,max-age=31536000,immutable'}).send(r.data)}catch{res.sendStatus(404)}});
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
 const anim=(await q("select value from settings where key='animation'")).rows[0]?.value||{preset:'none'};
 const banners=(await q('select id,image,title,subtitle,link from banners where active order by sort,id')).rows,
  bundles=(await q(`select b.id,b.title,b.description,b.image,b.price,coalesce((select sum(p.price*bi.qty)::int from bundle_items bi join products p on p.id=bi.product_id where bi.bundle_id=b.id),0) old_price,coalesce((select json_agg(p.name||' ×'||bi.qty::text) from bundle_items bi join products p on p.id=bi.product_id where bi.bundle_id=b.id),'[]') parts,coalesce((select json_agg(json_build_object('id',p.id,'name',p.name,'name_uz',p.name_uz,'price',p.price,'unit',p.unit,'image',p.image,'qty',bi.qty,'age_min',p.age_min) order by bi.product_id) from bundle_items bi join products p on p.id=bi.product_id where bi.bundle_id=b.id),'[]') items from bundles b where b.active order by b.id desc`)).rows,
  videos=(await q('select id,title,yt_id from videos where active order by id desc')).rows,
  cats=(await q('select name,name_ru,image,section,sort,parent from categories order by sort,id')).rows;
 const ord=(await q(`select o.*,coalesce((select json_agg(json_build_object('id',i.id,'name',i.name,'name_uz',p.name_uz,'unit',i.unit,'qty',i.qty,'ordered_sum',i.ordered_sum,'actual_sum',i.actual_sum,'product_id',i.product_id,'image',p.image,'unit_price',i.unit_price,'cur_price',p.price,'min_grams',p.min_grams,'age_min',p.age_min,'active',p.active,'category',p.category,'sub_name',i.sub_name,'sub_status',i.sub_status) order by i.id) from order_items i left join products p on p.id=i.product_id where i.order_id=o.id),'[]') items from orders o ${staff?'':'where user_id=$1'} order by id desc limit 200`,staff?[]:[m.tg_id])).rows;
 res.json({role:m.role,workerDepartment:m.department,user:{telegramId:m.tg_id,name:m.name,phone:m.phone,lang:m.lang||'uz'},warehouseEnabled:wh,
  settings:{deliveryEnabled:d.enabled,freeDeliveryThreshold:Math.min(...d.rules.filter(r=>r.fee===0).map(r=>r.minTotal),Infinity),delivery:staff?d:{enabled:d.enabled,minTotal:d.minTotal||0,note:d.note||''},animation:anim},
  cats,categories:cats.map(c=>c.name),products:[],banners,bundles,videos,orders:ord,
  pendingProducts:ADM.includes(m.role)?(await q('select * from pending_changes order by id')).rows:[],
  roles:m.role==='superadmin'?(await q("select tg_id,name,role,department from users where role<>'user'")).rows:null})}));
app.put('/api/user/lang',wrap(async(req,res)=>{const lang=req.body.lang==='ru'?'ru':'uz';await q('update users set lang=$1 where tg_id=$2',[lang,req.me.tg_id]);res.json({lang})}));
app.post('/api/delivery/quote',wrap(async(req,res)=>res.json(await O.deliveryFee(Number(req.body.subtotal)||0,{lat:Number(req.body.lat),lng:Number(req.body.lng)}))));
app.post('/api/orders',wrap(async(req,res)=>res.json({success:true,order:await O.createOrder(req.me,req.body)})));
app.post('/api/orders/:id/status',need(...STAFF),wrap(async(req,res)=>res.json(await O.setStatus(req.me.tg_id,+req.params.id,req.body.status,req.body.fee))));
app.post('/api/orders/:id/weigh',need(...STAFF),wrap(async(req,res)=>res.json(await O.weigh(req.me.tg_id,+req.params.id,req.body.items))));
app.post('/api/orders/:id/confirm',wrap(async(req,res)=>{await O.confirm(req.me.tg_id,+req.params.id,!!req.body.accept);res.json({success:true})}));
app.post('/api/upload',need('worker',...ADM),wrap(async(req,res)=>{const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+\/=]+)$/.exec(String(req.body.data||''));if(!m)return res.status(400).json({error:"Rasm formati noto'g'ri"});const buf=Buffer.from(m[2],'base64');if(buf.length>700000)return res.status(400).json({error:'Rasm juda katta'});
 const r=(await q('insert into images(mime,data) values($1,$2) returning id',[m[1],buf])).rows[0];res.json({url:'/img/'+r.id})}));
app.post('/api/products',need('worker',...ADM),wrap(async(req,res)=>res.json(await O.saveProduct(req.me,req.body))));
app.put('/api/products/:id',need('worker',...ADM),wrap(async(req,res)=>res.json(await O.saveProduct(req.me,req.body,+req.params.id))));
app.delete('/api/products/:id',need('worker',...ADM),wrap(async(req,res)=>res.json(await O.deleteProduct(req.me,+req.params.id))));
app.post('/api/changes/:id',need(...ADM),wrap(async(req,res)=>{await O.resolveChange(req.me.tg_id,+req.params.id,!!req.body.approve);res.json({success:true})}));
app.post('/api/categories',need(...ADM),wrap(async(req,res)=>{const n=String(req.body.name||'').trim().slice(0,60);if(!n)return res.status(400).json({error:'Nom kerak'});
 if(req.body.action==='delete')await q('delete from categories where name=$1',[n]);else await q('insert into categories(name) values($1) on conflict do nothing',[n]);
 await audit(req.me.tg_id,'category.'+(req.body.action||'add'),'category',{n});res.json({success:true})}));
app.put('/api/settings/delivery',need(...ADM),wrap(async(req,res)=>{const b=req.body,old=await getSetting('delivery');const v={...old,enabled:typeof b.enabled==='boolean'?b.enabled:old.enabled,minTotal:Math.max(0,Math.round(+b.minTotal||0)),note:String(b.note||'').slice(0,200)};await setSetting('delivery',v);await audit(req.me.tg_id,'settings.delivery','settings',{old,new:v});res.json(v)}));
app.put('/api/settings/warehouse',need('superadmin'),wrap(async(req,res)=>{const v={enabled:!!req.body.enabled};await setSetting('warehouse',v);
 await audit(req.me.tg_id,'settings.warehouse','settings',v);res.json(v)}));
app.put('/api/settings/animation',need('superadmin'),wrap(async(req,res)=>{const ok=['none','newyear','navruz','ramazon','autumn','confetti'];const preset=ok.includes(req.body.preset)?req.body.preset:'none';const v={preset};await setSetting('animation',v);await audit(req.me.tg_id,'settings.animation','settings',v);res.json(v)}));
app.put('/api/products/:id/stock',need('superadmin'),wrap(async(req,res)=>{if(!(await getSetting('warehouse')).enabled)return res.status(400).json({error:'Ombor tizimi yoqilmagan'});
 await q('update products set stock=$1 where id=$2',[req.body.stock==null?null:Number(req.body.stock),+req.params.id]);await audit(req.me.tg_id,'product.stock','product:'+req.params.id,req.body);res.json({success:true})}));
app.post('/api/roles',need('superadmin'),wrap(async(req,res)=>{const{targetId,role,name,department}=req.body;
 if(!['user','worker','operator','admin'].includes(role)||!Number(targetId))return res.status(400).json({error:"Noto'g'ri"});
 await q("insert into users(tg_id,name,role,department) values($1,$2,$3,$4) on conflict(tg_id) do update set role=$3,department=$4,name=coalesce(nullif($2,''),users.name)",[targetId,name||'',role,role==='worker'?department:null]);
 await audit(req.me.tg_id,'role.set','user:'+targetId,{role,department});res.json({success:true})}));
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
 const pc=(await q("select count(*)::int total,count(*) filter(where active)::int active from products")).rows[0];
 const cust=(await q(`select count(*)::int total,count(*) filter(where ($1::date is null or (created_at at time zone 'Asia/Tashkent')::date>=$1::date) and ($2::date is null or (created_at at time zone 'Asia/Tashkent')::date<=$2::date))::int added from users where phone is not null`,[from,to])).rows[0];
 res.json({totals:t,days,granularity:oneDay?'hour':'day',byCat,products:pc,customers:cust.total,newCustomers:cust.added})}));
const YT=/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/;
const KIND={banners:['image','title','subtitle','link'],videos:['title','yt_id'],bundles:['title','description','image','price']};
const PSEL='id,category,name,name_uz,description,min_grams,unit,price,image,age_min';
app.get('/api/products',wrap(async(req,res)=>{const s=String(req.query.q||'').trim().slice(0,60),cat=String(req.query.cat||''),pg=Math.max(0,Math.min(500,+req.query.page||0)),w=['active'],p=[];
 if(s){p.push('%'+s+'%',s);w.push(`(name ilike $${p.length-1} or name_uz ilike $${p.length-1} or barcode=$${p.length})`)}
 if(cat){p.push(cat);const k=p.length;w.push(`(category=$${k} or category in (select name from categories where parent=$${k}) or category in (select c2.name from categories c2 join categories c1 on c2.parent=c1.name where c1.parent=$${k}))`)}
 if((await getSetting('warehouse')).enabled)w.push('(stock is null or stock>0)');
 const r=(await q(`select ${PSEL} from products where ${w.join(' and ')} order by name limit 51 offset ${pg*50}`,p)).rows;
 res.json({items:r.slice(0,50),more:r.length>50})}));
app.get('/api/admin/products',need('worker','operator',...ADM),wrap(async(req,res)=>{const s=String(req.query.q||'').trim().slice(0,60),st=req.query.state,cat=String(req.query.cat||''),pg=Math.max(0,Math.min(2000,+req.query.page||0)),w=['true'],p=[];
 if(req.me.role==='worker'){p.push(req.me.department);w.push(`category=$${p.length}`)}
 else if(cat){p.push(cat);const k=p.length;w.push(`(category=$${k} or category in (select name from categories where parent=$${k}) or category in (select c2.name from categories c2 join categories c1 on c2.parent=c1.name where c1.parent=$${k}))`)}
 if(s){p.push('%'+s+'%',s);w.push(`(name ilike $${p.length-1} or name_uz ilike $${p.length-1} or barcode=$${p.length})`)}
 if(st==='on')w.push('active');if(st==='off')w.push('not active');
 const r=(await q(`select ${PSEL},active,stock,barcode from products where ${w.join(' and ')} order by name limit 51 offset ${pg*50}`,p)).rows;
 res.json({items:r.slice(0,50),more:r.length>50})}));
app.get('/api/recommend',wrap(async(req,res)=>{const cats=String(req.query.cats||'').split('|').filter(Boolean).slice(0,6),ex=String(req.query.ex||'').split(',').map(Number).filter(Boolean).slice(0,60);
 res.json((await q(`select ${PSEL} from products where active and unit='piece' and category=any($1::text[]) and id<>all($2::int[]) order by random() limit 12`,[cats,ex])).rows)}));
app.put('/api/products/:id/active',need(...ADM),wrap(async(req,res)=>{await q('update products set active=$1 where id=$2',[!!req.body.active,+req.params.id]);await audit(req.me.tg_id,'product.active','product:'+req.params.id,{active:!!req.body.active});res.json({success:true})}));
app.get('/api/content',need(...ADM),wrap(async(req,res)=>res.json({banners:(await q('select * from banners order by sort,id')).rows,videos:(await q('select * from videos order by id desc')).rows,bundles:(await q('select * from bundles order by id desc')).rows})));
app.post('/api/content/:kind',need(...ADM),wrap(async(req,res)=>{const k=req.params.kind,b={...req.body};if(!KIND[k])return res.sendStatus(404);
 if(k==='videos'){const m=YT.exec(String(b.url||''));if(!m)return res.status(400).json({error:"YouTube havolasi noto'g'ri"});b.yt_id=m[1]}
 if(k==='bundles'&&(!b.title||!(+b.price>0)||!Array.isArray(b.items)||!b.items.length))return res.status(400).json({error:"Nabor ma'lumoti to'liq emas"});
 if(k==='banners'&&!b.image)return res.status(400).json({error:'Rasm kerak'});
 const cols=KIND[k],r=(await q(`insert into ${k}(${cols.join(',')}) values(${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning id`,cols.map(c=>b[c]??null))).rows[0];
 if(k==='bundles')for(const it of b.items.slice(0,30))await q('insert into bundle_items values($1,$2,$3)',[r.id,+it.productId,Math.max(1,+it.qty||1)]);
 await audit(req.me.tg_id,'content.'+k+'.add',k+':'+r.id,{title:b.title});res.json({id:r.id})}));
app.put('/api/content/:kind/:id/active',need(...ADM),wrap(async(req,res)=>{const k=req.params.kind;if(!KIND[k])return res.sendStatus(404);await q(`update ${k} set active=$1 where id=$2`,[!!req.body.active,+req.params.id]);await audit(req.me.tg_id,'content.'+k+'.active',k+':'+req.params.id,{active:!!req.body.active});res.json({success:true})}));
app.delete('/api/content/:kind/:id',need(...ADM),wrap(async(req,res)=>{const k=req.params.kind;if(!KIND[k])return res.sendStatus(404);await q(`delete from ${k} where id=$1`,[+req.params.id]);await audit(req.me.tg_id,'content.'+k+'.delete',k+':'+req.params.id);res.json({success:true})}));

app.get('/api/customers',need(...ADM),wrap(async(req,res)=>{const s='%'+String(req.query.q||'').trim().slice(0,40)+'%';
 res.json((await q(`select u.tg_id,u.name,u.phone,u.role,max(o.created_at) last,count(o.id) filter(where o.status<>'cancelled')::int orders,coalesce(sum(o.total) filter(where o.status<>'cancelled'),0)::bigint spent from users u left join orders o on o.user_id=u.tg_id where u.phone is not null and (u.name ilike $1 or u.phone ilike $1) group by u.tg_id order by last desc nulls last limit 200`,[s])).rows)}));
app.put('/api/content/banners/:id',need(...ADM),wrap(async(req,res)=>{const b=req.body;await q('update banners set title=$1,subtitle=$2,link=$3,image=coalesce(nullif($4,\'\'),image) where id=$5',[b.title||null,b.subtitle||null,b.link||null,b.image||'',+req.params.id]);await audit(req.me.tg_id,'content.banners.edit','banners:'+req.params.id,{title:b.title});res.json({success:true})}));
app.post('/api/cats',need(...ADM),wrap(async(req,res)=>{const b=req.body,n=String(b.name||'').trim().slice(0,60);if(!n)return res.status(400).json({error:'Nom kerak'});
 const par=String(b.parent||'').trim().slice(0,60)||null;const cleanPar=par===n||par===b.old?null:par;
 if(b.old&&b.old!==n){await q('update categories set name=$1 where name=$2',[n,b.old]);await q('update categories set parent=$1 where parent=$2',[n,b.old]);await q('update products set category=$1 where category=$2',[n,b.old])}
 await q('insert into categories(name,name_ru,image,section,sort,parent) values($1,$2,$3,$4,$5,$6) on conflict(name) do update set name_ru=$2,image=coalesce($3,categories.image),section=$4,sort=$5,parent=$6',[n,b.name_ru||null,b.image||null,b.section||null,Math.round(+b.sort)||0,cleanPar]);
 await audit(req.me.tg_id,'category.save','category',{n,parent:cleanPar});res.json({success:true})}));
app.delete('/api/cats/:name',need(...ADM),wrap(async(req,res)=>{await q('update categories set parent=null where parent=$1',[req.params.name]);await q("update products set category='Boshqa' where category=$1",[req.params.name]);await q('delete from categories where name=$1',[req.params.name]);await audit(req.me.tg_id,'category.delete','category',{n:req.params.name});res.json({success:true})}));

app.post('/api/orders/:id/substitute',need(...STAFF),wrap(async(req,res)=>res.json(await O.propose(req.me.tg_id,+req.params.id,+req.body.itemId,+req.body.productId))));
app.post('/api/orders/:id/send-sub',need(...STAFF),wrap(async(req,res)=>res.json(await O.sendSub(req.me.tg_id,+req.params.id))));
app.post('/api/orders/:id/sub-answer',wrap(async(req,res)=>{await O.subAnswer(req.me.tg_id,+req.params.id,!!req.body.accept);res.json({success:true})}));
app.post('/api/orders/:id/edit-request',wrap(async(req,res)=>{await O.editRequest(req.me.tg_id,+req.params.id);res.json({success:true})}));
app.post('/api/orders/:id/edit-decide',need(...STAFF),wrap(async(req,res)=>{await O.editDecide(req.me.tg_id,+req.params.id,!!req.body.allow);res.json({success:true})}));
app.post('/api/orders/:id/edit-apply',wrap(async(req,res)=>{await O.editApply(req.me.tg_id,+req.params.id,req.body.changes);res.json({success:true})}));

(async()=>{const port=process.env.PORT||8080;
 if(process.env.PUBLIC_URL&&process.env.BOT_TOKEN){app.use(await bot.createWebhook({domain:process.env.PUBLIC_URL.replace(/^https?:\/\//,'').replace(/\/+$/,''),path:'/bot',secret_token:process.env.WEBHOOK_SECRET}))}
 else if(process.env.BOT_TOKEN)bot.launch();
 const path=require('path'),fs=require('fs'),pub=path.join(__dirname,'../public');
 if(fs.existsSync(pub)){app.use(express.static(pub));app.get('*',(req,res)=>res.sendFile(path.join(pub,'index.html')))}
 app.listen(port,()=>console.log('server',port));
 process.once('SIGTERM',()=>process.exit(0));})();
           
