// JOYI: backend/src/orders.js  (GitHub'da shu yo'l bilan yarating)
const {pool,q,audit,getSetting,setSetting}=require('./db');
let N={staff:async()=>{},user:async()=>{}};exports.setNotifier=n=>{N=n};
const bad=m=>{const e=new Error(m);e.status=400;return e};
const km=(a,b)=>{const r=x=>x*Math.PI/180,h=Math.sin(r(b.lat-a.lat)/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lng-a.lng)/2)**2;return 12742*Math.asin(Math.sqrt(h))};
async function deliveryFee(subtotal,pt){
 const d=await getSetting('delivery');
 if(!d.enabled)throw bad("Yetkazib berish hozir o'chirilgan");
 if(!pt||!Number.isFinite(pt.lat)||!Number.isFinite(pt.lng))throw bad('Manzil joylashuvi kerak');
 const dist=km(d.store,pt);if(dist>d.maxKm)throw bad(`Manzil ${d.maxKm} km zonadan tashqarida`);
 const fees=d.rules.filter(r=>dist<=r.maxKm&&subtotal>=r.minTotal).map(r=>r.fee);
 return{fee:Math.min(d.baseFee,...fees),dist:Math.round(dist*10)/10};
}
exports.deliveryFee=deliveryFee;
const effPrice=p=>(p.sale_price&&p.sale_price>0&&p.sale_price<p.price&&(!p.sale_until||new Date(p.sale_until)>new Date()))?p.sale_price:p.price;
const normPhone=raw=>{const d=String(raw||'').replace(/\D/g,'');if(!d)return null;const f=d.length===9?'998'+d:d;return f.length>=9&&f.length<=15?f:null};
exports.normPhone=normPhone;
exports.createOrder=async(me,b)=>{
 if(!Array.isArray(b.items)||!b.items.length||b.items.length>60)throw bad("Savat bo'sh");
 const phone=me.phone||normPhone(b.phone);
 if(!phone)throw bad('Buyurtma berish uchun telefon raqamingizni kiriting');
 const wh=(await getSetting('warehouse')).enabled,c=await pool.connect();
 try{await c.query('begin');const lines=[];let subtotal=0,age=0,orderKg=0;
  if(!me.phone)await c.query('update users set phone=$1 where tg_id=$2',[phone,me.tg_id]);
  for(const it of b.items){
   if(it.bundleId){const bd=(await c.query("select b.*,(select string_agg(p.name||' ×'||bi.qty::text,', ') from bundle_items bi join products p on p.id=bi.product_id where bi.bundle_id=b.id) comp from bundles b where id=$1 and active",[Number(it.bundleId)])).rows[0];if(!bd)throw bad('Nabor topilmadi');const bq=Number(it.qty);if(!Number.isInteger(bq)||bq<1||bq>20)throw bad("Nabor soni noto'g'ri");subtotal+=bd.price*bq;lines.push([{id:null,name:'🎁 '+bd.title+(bd.comp?' ('+bd.comp+')':''),unit:'piece',price:bd.price},bq,bd.price*bq]);continue}
   const p=(await c.query('select * from products where id=$1 and active for update',[Number(it.productId??it.id)])).rows[0];
   if(!p)throw bad('Mahsulot topilmadi');age=Math.max(age,p.age_min||0);const up=effPrice(p);let qty,sum;
   if(p.unit==='weight'&&p.min_grams>0){const g=Math.round(Number(it.grams));if(!(g>=p.min_grams&&g<=20000&&g%50===0))throw bad(`${p.name}: og'irlik noto'g'ri`);qty=g/1000;sum=Math.round(up*g/1000);orderKg+=qty}
   else if(p.unit==='weight'){const minS=Math.max(1000,Number(p.min_sum)||0);sum=Math.round(Number(it.sum));if(!(sum>=minS&&sum<=5000000))throw bad(`${p.name}: minimal summa ${minS.toLocaleString('ru-RU')} so'm`);qty=Math.round(sum/up*1000)/1000;orderKg+=qty}
   else{qty=Number(it.qty);if(!Number.isInteger(qty)||qty<1||qty>500)throw bad(`${p.name}: soni noto'g'ri`);sum=qty*up;if(p.weight_g>0)orderKg+=(p.weight_g*qty)/1000}
   if(wh&&p.stock!==null){if(Number(p.stock)<qty)throw bad(`${p.name}: omborda yetarli emas`);await c.query('update products set stock=stock-$1 where id=$2',[qty,p.id])}
   subtotal+=sum;lines.push([{...p,price:up},qty,sum]);
  }
  let fee=0,type='pickup';
  if(b.type==='delivery'){
   const dv=await getSetting('delivery');
   if(!dv.enabled)throw bad("Yetkazib berish hozir o'chirilgan");
   if(subtotal<(dv.minTotal||0))throw bad(`Yetkazib berish ${(dv.minTotal||0).toLocaleString('ru-RU')} so'mdan boshlanadi`);
   if(dv.maxKg>0&&orderKg>dv.maxKg)throw bad(`Yetkazib berish maksimal ${dv.maxKg} kg gacha (savatingiz: ${orderKg.toFixed(1)} kg)`);
   if(String(b.address||'').trim().length<5)throw bad('Manzilni yozing');
   type='delivery';
  }
  const code=String(1000+Math.floor(Math.random()*9000));
  const cardNum=me.card_status==='active'&&me.card_number?me.card_number:null;
  const o=(await c.query('insert into orders(code,user_id,name,phone,type,address,lat,lng,delivery_fee,subtotal,total,card_number) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10::int+$9::int,$11) returning *',[code,me.tg_id,me.name,phone,type,String(b.address||'').slice(0,300),b.lat||null,b.lng||null,fee,subtotal,cardNum])).rows[0];
  for(const [p,qty,sum] of lines){
   await c.query('insert into order_items(order_id,product_id,name,unit,unit_price,qty,ordered_sum) values($1,$2,$3,$4,$5,$6,$7)',[o.id,p.id,p.name,p.unit,p.price,qty,sum]);
   if(p.id)await c.query('update products set sales_count=coalesce(sales_count,0)+1 where id=$1',[p.id]);
  }
  if(age>0){await c.query("update orders set status='age_check' where id=$1",[o.id]);o.status='age_check'}
  await c.query('commit');await audit(me.tg_id,'order.create','order:'+o.id,{total:o.total,age,card:cardNum,kg:Math.round(orderKg*10)/10});
  if(age>0)N.ageCheck(o,age);else N.newOrder(o,lines.map(([p,qty,sum])=>({name:p.name,unit:p.unit,qty,sum})));return o;
 }catch(e){await c.query('rollback');throw e}finally{c.release()}
};
const NEXT={new:['accepted','cancelled'],accepted:['preparing','cancelled'],preparing:['ready','cancelled'],ready:['completed'],awaiting_confirm:['cancelled'],age_check:['cancelled'],sub_pending:['cancelled']};
async function restock(id,cl=null){if(!(await getSetting('warehouse')).enabled)return;
 const run=(cl?cl.query.bind(cl):q);
 await run('update products p set stock=stock+i.qty from order_items i where i.order_id=$1 and i.product_id=p.id and p.stock is not null',[id])}
exports.setStatus=async(actor,id,status,fee)=>{
 const c=await pool.connect();
 try{
  await c.query('begin');
  const o=(await c.query('select * from orders where id=$1 for update',[id])).rows[0];
  if(!o)throw bad('Buyurtma topilmadi');
  if(!(NEXT[o.status]||[]).includes(status))throw bad(`${o.status} → ${status} mumkin emas`);
  await c.query('update orders set status=$1 where id=$2',[status,id]);
  if(status==='accepted'&&o.type==='delivery'&&Math.round(+fee)>0)await c.query('update orders set delivery_fee=$1,total=subtotal+$1 where id=$2',[Math.round(+fee),id]);
  if(status==='cancelled')await restock(id,c);
  await c.query('commit');
  await audit(actor,'order.'+status,'order:'+id);N.statusChanged({...o,status});return{...o,status};
 }catch(e){await c.query('rollback');throw e}finally{c.release()}
};
exports.weigh=async(actor,id,actuals)=>{
 const o=(await q('select * from orders where id=$1',[id])).rows[0];if(!o||!['accepted','preparing'].includes(o.status))throw bad("Hozir tortib bo'lmaydi");
 for(const a of actuals||[]){const s=Math.round(Number(a.actualSum));if(!(s>=1))throw bad('Summa xato');
  await q("update order_items set actual_sum=$1 where id=$2 and order_id=$3 and unit='weight'",[s,a.itemId,id])}
 const items=(await q('select * from order_items where order_id=$1 order by id',[id])).rows;
 const sub=items.reduce((s,i)=>s+(i.actual_sum??i.ordered_sum),0);
 if(sub===o.subtotal){await q("update orders set status='preparing' where id=$1",[id]);await audit(actor,'order.weighed','order:'+id,{same:true});return{changed:false}}
 await q("update orders set status='awaiting_confirm',pending_subtotal=$1 where id=$2",[sub,id]);
 await audit(actor,'order.weighed','order:'+id,{old:o.subtotal,new:sub});N.confirmRequest(o,items,sub);return{changed:true,newSubtotal:sub};
};
exports.confirm=async(userId,id,yes)=>{
 const o=(await q('select * from orders where id=$1 and user_id=$2',[id,userId])).rows[0];
 if(!o||o.status!=='awaiting_confirm')throw bad("Tasdiqlash so'rovi topilmadi");
 if(yes)await q("update orders set subtotal=pending_subtotal,total=pending_subtotal+delivery_fee,pending_subtotal=null,status='preparing' where id=$1",[id]);
 else{await q("update orders set status='cancelled' where id=$1",[id]);await restock(id)}
 await audit(userId,yes?'order.confirm_price':'order.reject_price','order:'+id);N.confirmDone(o,yes);
};
const parseSale=(price,sp,su)=>{const n=Math.round(Number(sp)||0);if(!(n>0&&n<price))return{sale_price:null,sale_until:null};let dt=null;if(su){const d=new Date(su);if(!Number.isNaN(d.getTime()))dt=d.toISOString()}return{sale_price:n,sale_until:dt}};
const clampPrio=v=>{const n=Math.round(Number(v)||3);return Math.max(1,Math.min(5,n))};
exports.saveProduct=async(me,body,id)=>{
 const price=Math.round(Number(body.price));
 const sl=parseSale(price,body.sale_price,body.sale_until);
 const d={
  name:String(body.name||'').trim().slice(0,120),
  price,
  unit:body.unit==='weight'?'weight':'piece',
  image:body.image||null,
  category:body.category||'Boshqa',
  name_uz:String(body.name_uz||'').trim().slice(0,120)||null,
  description:String(body.description||'').slice(0,600)||null,
  min_grams:Math.max(0,Math.min(5000,Math.round(Number(body.min_grams))||0)),
  min_sum:Math.max(0,Math.min(1000000,Math.round(Number(body.min_sum))||0)),
  weight_g:Math.max(0,Math.min(100000,Math.round(Number(body.weight_g))||0)),
  priority:clampPrio(body.priority),
  family:String(body.family||'').trim().slice(0,60)||null,
  age_min:Math.max(0,Math.min(99,Math.round(Number(body.age_min))||0)),
  barcode:String(body.barcode||'').trim().slice(0,64)||null,
  sale_price:sl.sale_price,
  sale_until:sl.sale_until
 };
 if(!d.name||!(d.price>0))throw bad("Nom va narx noto'g'ri");
 if(me.role==='worker'){d.category=me.department;
  const r=(await q("insert into pending_changes(action,product,worker_id,worker_name,department) values($1,$2,$3,$4,$5) returning *",[id?'edit':'add',{...d,id},me.tg_id,me.name,me.department])).rows[0];
  await audit(me.tg_id,'product.request','change:'+r.id,d);N.pending(r);return{pending:true}}
 const isEdit=!!id;
 const activate=body.activate===true;
 if(isEdit)await q(
  `update products set name=$1,price=$2,unit=$3,image=coalesce($4,image),category=$5,age_min=$7,name_uz=$8,description=$9,min_grams=$10,barcode=$11,sale_price=$12,sale_until=$13,min_sum=$14,weight_g=$15,priority=$16,family=$17,needs_setup=false${activate?',active=true':''} where id=$6`,
  [d.name,d.price,d.unit,d.image,d.category,id,d.age_min,d.name_uz,d.description,d.min_grams,d.barcode,d.sale_price,d.sale_until,d.min_sum,d.weight_g,d.priority,d.family]
 );
 else id=(await q(
  'insert into products(name,price,unit,image,category,age_min,name_uz,description,min_grams,barcode,sale_price,sale_until,min_sum,weight_g,priority,family,needs_setup) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false) returning id',
  [d.name,d.price,d.unit,d.image,d.category,d.age_min,d.name_uz,d.description,d.min_grams,d.barcode,d.sale_price,d.sale_until,d.min_sum,d.weight_g,d.priority,d.family]
 )).rows[0].id;
 await audit(me.tg_id,isEdit?'product.save':'product.add','product:'+id,d);return{id};
};
exports.deleteProduct=async(me,id)=>{
 const p=(await q('select * from products where id=$1',[id])).rows[0];if(!p)throw bad('Topilmadi');
 if(me.role==='worker'){if(p.category!==me.department)throw bad("Ruxsat yo'q");
  const r=(await q("insert into pending_changes(action,product,worker_id,worker_name,department) values('delete',$1,$2,$3,$4) returning *",[{id,name:p.name,price:p.price},me.tg_id,me.name,me.department])).rows[0];N.pending(r);return{pending:true}}
 await q('update products set active=false where id=$1',[id]);await audit(me.tg_id,'product.delete','product:'+id);return{};
};
exports.resolveChange=async(actor,id,ok)=>{
 const r=(await q('delete from pending_changes where id=$1 returning *',[id])).rows[0];if(!r)throw bad("So'rov topilmadi");
 if(ok){const p=r.product;
  if(r.action==='add')await q('insert into products(name,price,unit,image,category,age_min,name_uz,description,min_grams,barcode,sale_price,sale_until,min_sum,weight_g,priority,family,needs_setup) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,false)',[p.name,p.price,p.unit,p.image,p.category,p.age_min||0,p.name_uz||null,p.description||null,p.min_grams||0,p.barcode||null,p.sale_price||null,p.sale_until||null,p.min_sum||0,p.weight_g||0,clampPrio(p.priority),p.family||null]);
  else if(r.action==='edit')await q('update products set name=$1,price=$2,unit=$3,image=coalesce($4,image),age_min=$7,name_uz=$8,description=$9,min_grams=$10,barcode=$11,sale_price=$12,sale_until=$13,min_sum=$14,weight_g=$15,priority=$16,family=$17,needs_setup=false where id=$5 and category=$6',[p.name,p.price,p.unit,p.image,p.id,r.department,p.age_min||0,p.name_uz||null,p.description||null,p.min_grams||0,p.barcode||null,p.sale_price||null,p.sale_until||null,p.min_sum||0,p.weight_g||0,clampPrio(p.priority),p.family||null]);
  else await q('update products set active=false where id=$1 and category=$2',[p.id,r.department])}
 await audit(actor,ok?'change.approve':'change.reject','change:'+id,r.product);N.changeResolved(r,ok);
};

/* One-way Store POS -> Mini App product sync (updates price/stock/active, flags new products for setup, never overwrites photo/category/priority/family) */
exports.syncProducts=async(actorId,rawItems,opts={})=>{
 if(!Array.isArray(rawItems)||!rawItems.length)throw bad("Mahsulotlar ro'yxati bo'sh");
 const items=rawItems.slice(0,50000);
 const existing=(await q('select id,barcode,name,price,stock,active,needs_setup from products')).rows;
 const byBc=new Map(),byName=new Map();
 for(const r of existing){
  if(r.barcode)byBc.set(String(r.barcode).trim(),r);
  if(r.name)byName.set(String(r.name).trim().toLowerCase(),r);
 }
 let updated=0,activated=0,deactivated=0,created=0,skipped=0;
 const autoActive=opts.autoActive!==false;
 const c=await pool.connect();
 try{
  await c.query('begin');
  for(const raw of items){
   const name=String(raw.name||'').trim().slice(0,120);
   const barcode=String(raw.barcode||'').trim().slice(0,64)||null;
   const price=Math.round(Number(String(raw.price??'').replace(/[^\d.]/g,''))||0);
   const stockNum=raw.stock===undefined||raw.stock===null||raw.stock===''?null:Number(String(raw.stock).replace(',','.').replace(/[^\d.-]/g,''));
   const stock=stockNum!==null&&Number.isFinite(stockNum)?Math.max(0,stockNum):null;
   if((!name&&!barcode)||!(price>0)){skipped++;continue}
   const match=(barcode&&byBc.get(barcode))||(name&&byName.get(name.toLowerCase()));
   if(match){
    const nextStock=stock!==null?stock:match.stock;
    let nextActive=match.active;
    if(autoActive&&stock!==null&&!match.needs_setup){
     nextActive=stock>0;
    }
    const changed=match.price!==price||Number(match.stock)!==Number(nextStock)||match.active!==nextActive||(barcode&&!match.barcode);
    if(changed){
     await c.query('update products set price=$1,stock=$2,active=$3,barcode=coalesce(barcode,$4) where id=$5',[price,nextStock,nextActive,barcode,match.id]);
     updated++;
     if(!match.active&&nextActive)activated++;
     if(match.active&&!nextActive)deactivated++;
     match.price=price;match.stock=nextStock;match.active=nextActive;
     if(barcode&&!match.barcode){match.barcode=barcode;byBc.set(barcode,match)}
    }
   }else{
    if(!name){skipped++;continue}
    const isW=raw.unit==='weight'||/(^|[\s.,(\/])(вес|весов|весовой|кг|kg)\.?$/i.test(name);
    const unit=isW?'weight':'piece';
    const ins=(await c.query(
     "insert into products(name,price,unit,category,barcode,stock,active,priority,needs_setup) values($1,$2,$3,'Boshqa',$4,$5,false,3,true) returning id,barcode,name,price,stock,active,needs_setup",
     [name,price,unit,barcode,stock]
    )).rows[0];
    created++;
    if(barcode)byBc.set(barcode,ins);
    byName.set(name.toLowerCase(),ins);
   }
  }
  await c.query('commit');
 }catch(e){await c.query('rollback');throw e}finally{c.release()}
 const counts=(await q("select count(*)::int total_now,count(*) filter(where active)::int active_now,count(*) filter(where needs_setup)::int setup_now from products")).rows[0]||{};
 const source=String(opts.source||(actorId?'csv':'pos')).trim().slice(0,30)||'pos';
 const runId=opts.runId?String(opts.runId).trim().slice(0,48):null;
 const res={total:items.length,updated,activated,deactivated,created,skipped,source,at:new Date().toISOString(),activeNow:counts.active_now||0,setupNow:counts.setup_now||0,totalNow:counts.total_now||0};
 let saved={...res,runId};
 if(runId){
  const prev=(await q("select value from settings where key='last_sync'")).rows[0]?.value;
  if(prev&&prev.runId===runId){
   saved={...res,runId,total:(prev.total||0)+res.total,updated:(prev.updated||0)+res.updated,activated:(prev.activated||0)+res.activated,deactivated:(prev.deactivated||0)+res.deactivated,created:(prev.created||0)+res.created,skipped:(prev.skipped||0)+res.skipped};
  }
 }
 await setSetting('last_sync',saved);
 await audit(actorId||0,'products.sync','products',res);
 return res;
};
exports.ageConfirm=async(userId,id,yes)=>{const o=(await q('select * from orders where id=$1 and user_id=$2',[id,userId])).rows[0];if(!o||o.status!=='age_check')throw bad("So'rov topilmadi");
 if(!yes){await q("update orders set status='cancelled',age_confirmed=false where id=$1",[id]);await restock(id);await audit(userId,'order.age_denied','order:'+id);N.statusChanged({...o,status:'cancelled'});return}
 await q("update orders set status='new',age_confirmed=true where id=$1",[id]);await audit(userId,'order.age_confirmed','order:'+id);
 const items=(await q('select * from order_items where order_id=$1 order by id',[id])).rows;N.newOrder({...o,status:'new'},items.map(i=>({name:i.name,unit:i.unit,qty:i.qty,sum:i.ordered_sum})))};
const recalc=async id=>{const items=(await q('select * from order_items where order_id=$1',[id])).rows;
 if(!items.length){await q("update orders set status='cancelled' where id=$1",[id]);return null}
 const sub=items.reduce((s,i)=>s+(i.actual_sum??i.ordered_sum),0);await q('update orders set subtotal=$1,total=$1+delivery_fee where id=$2',[sub,id]);return sub};
exports.propose=async(actor,id,itemId,productId)=>{
 const o=(await q('select * from orders where id=$1',[id])).rows[0];if(!o||!['accepted','preparing'].includes(o.status))throw bad("Hozir almashtirib bo'lmaydi");
 const it=(await q('select * from order_items where id=$1 and order_id=$2',[itemId,id])).rows[0];if(!it)throw bad('Qator topilmadi');
 const p=(await q('select * from products where id=$1 and active',[productId])).rows[0];if(!p)throw bad('Mahsulot topilmadi');
 await q("update order_items set sub_product_id=$1,sub_name=$2,sub_price=$3,sub_unit=$4,sub_status='proposed' where id=$5",[p.id,p.name,p.price,p.unit,itemId]);
 await audit(actor,'order.substitute','order:'+id,{item:it.name,to:p.name});return{ok:true}};
exports.sendSub=async(actor,id)=>{
 const o=(await q('select * from orders where id=$1',[id])).rows[0];const items=(await q("select * from order_items where order_id=$1 and sub_status='proposed'",[id])).rows;
 if(!o||!['accepted','preparing'].includes(o.status)||!items.length)throw bad('Almashtirish tanlanmagan');
 await q("update orders set status='sub_pending' where id=$1",[id]);await audit(actor,'order.sub_sent','order:'+id);N.subRequest(o,items);return{ok:true}};
exports.subAnswer=async(userId,id,yes)=>{
 const o=(await q('select * from orders where id=$1 and user_id=$2',[id,userId])).rows[0];if(!o||o.status!=='sub_pending')throw bad("So'rov topilmadi");
 const items=(await q("select * from order_items where order_id=$1 and sub_status='proposed'",[id])).rows;
 for(const i of items){
  if(!yes){await q('delete from order_items where id=$1',[i.id]);continue}
  const qty=i.unit==='piece'&&i.sub_unit==='piece'?Number(i.qty):i.sub_unit==='weight'?Math.round(i.ordered_sum/i.sub_price*1000)/1000:Math.max(1,Math.round(i.ordered_sum/i.sub_price));
  const sum=i.sub_unit==='weight'?i.ordered_sum:i.sub_price*qty;
  await q("update order_items set product_id=$1,name=$2,unit=$3,unit_price=$4,qty=$5,ordered_sum=$6,actual_sum=null,sub_product_id=null,sub_name=null,sub_price=null,sub_unit=null,sub_status=null where id=$7",[i.sub_product_id,i.sub_name,i.sub_unit,i.sub_price,qty,sum,i.id])}
 const left=await recalc(id);if(left!==null)await q("update orders set status='preparing' where id=$1",[id]);
 await audit(userId,yes?'order.sub_accepted':'order.sub_rejected','order:'+id);N.subDone(o,yes)};
exports.editRequest=async(userId,id)=>{const o=(await q('select * from orders where id=$1 and user_id=$2',[id,userId])).rows[0];
 if(!o||!['new','accepted','preparing'].includes(o.status)||o.edit_state)throw bad("So'rab bo'lmaydi");
 await q("update orders set edit_state='requested' where id=$1",[id]);await audit(userId,'order.edit_requested','order:'+id);N.editRequested(o)};
exports.editDecide=async(actor,id,allow)=>{const o=(await q("select * from orders where id=$1 and edit_state='requested'",[id])).rows[0];if(!o)throw bad("So'rov topilmadi");
 await q('update orders set edit_state=$1 where id=$2',[allow?'allowed':null,id]);await audit(actor,allow?'order.edit_allowed':'order.edit_denied','order:'+id);N.editDecided(o,allow)};
exports.editApply=async(userId,id,changes)=>{
 const wh=(await getSetting('warehouse')).enabled,cl=await pool.connect();
 try{
  await cl.query('begin');
  const o=(await cl.query("select * from orders where id=$1 and user_id=$2 and edit_state='allowed' for update",[id,userId])).rows[0];
  if(!o)throw bad("Ruxsat yo'q");
  for(const ch of (Array.isArray(changes)?changes:[]).slice(0,60)){
   const i=(await cl.query("select * from order_items where id=$1 and order_id=$2 and unit='piece'",[+ch.itemId,id])).rows[0];
   if(!i)continue;
   const n=Math.max(0,Math.min(500,Math.round(+ch.qty)));
   const diff=n-Number(i.qty);
   if(wh&&i.product_id&&diff!==0){
    const p=(await cl.query('select stock from products where id=$1 for update',[i.product_id])).rows[0];
    if(p&&p.stock!==null){
     if(diff>0&&Number(p.stock)<diff)throw bad(`${i.name}: omborda yetarli emas`);
     await cl.query('update products set stock=stock-$1 where id=$2',[diff,i.product_id]);
    }
   }
   if(!n)await cl.query('delete from order_items where id=$1',[i.id]);
   else await cl.query('update order_items set qty=$1,ordered_sum=unit_price*$1 where id=$2',[n,i.id]);
  }
  await cl.query('update orders set edit_state=null where id=$1',[id]);
  const items=(await cl.query('select * from order_items where order_id=$1',[id])).rows;
  if(!items.length)await cl.query("update orders set status='cancelled' where id=$1",[id]);
  else{const sub=items.reduce((s,i)=>s+(i.actual_sum??i.ordered_sum),0);await cl.query('update orders set subtotal=$1,total=$1+delivery_fee where id=$2',[sub,id])}
  await cl.query('commit');
  await audit(userId,'order.edited','order:'+id);
 }catch(e){await cl.query('rollback');throw e}finally{cl.release()}
};
exports.bad=bad;
                                                                                                                                                                 
