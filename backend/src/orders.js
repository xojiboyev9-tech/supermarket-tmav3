// JOYI: backend/src/orders.js  (GitHub'da shu yo'l bilan yarating)
const {pool,q,audit,getSetting}=require('./db');
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
exports.createOrder=async(me,b)=>{
 if(!Array.isArray(b.items)||!b.items.length||b.items.length>60)throw bad("Savat bo'sh");
 if(!me.phone)throw bad('Avval botda telefon raqamni yuboring');
 const wh=(await getSetting('warehouse')).enabled,c=await pool.connect();
 try{await c.query('begin');const lines=[];let subtotal=0;
  for(const it of b.items){
   const p=(await c.query('select * from products where id=$1 and active for update',[Number(it.productId??it.id)])).rows[0];
   if(!p)throw bad('Mahsulot topilmadi');let qty,sum;
   if(p.unit==='weight'){sum=Math.round(Number(it.sum));if(!(sum>=1000&&sum<=5000000))throw bad(`${p.name}: summa noto'g'ri`);qty=Math.round(sum/p.price*1000)/1000}
   else{qty=Number(it.qty);if(!Number.isInteger(qty)||qty<1||qty>100)throw bad(`${p.name}: soni noto'g'ri`);sum=qty*p.price}
   if(wh&&p.stock!==null){if(Number(p.stock)<qty)throw bad(`${p.name}: omborda yetarli emas`);await c.query('update products set stock=stock-$1 where id=$2',[qty,p.id])}
   subtotal+=sum;lines.push([p,qty,sum]);
  }
  let fee=0,type='pickup';
  if(b.type==='delivery'){type='delivery';fee=(await deliveryFee(subtotal,{lat:Number(b.lat),lng:Number(b.lng)})).fee}
  const code=String(1000+Math.floor(Math.random()*9000));
  const o=(await c.query('insert into orders(code,user_id,name,phone,type,address,lat,lng,delivery_fee,subtotal,total) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10+$9) returning *',[code,me.tg_id,me.name,me.phone,type,String(b.address||'').slice(0,300),b.lat||null,b.lng||null,fee,subtotal])).rows[0];
  for(const [p,qty,sum] of lines)await c.query('insert into order_items(order_id,product_id,name,unit,unit_price,qty,ordered_sum) values($1,$2,$3,$4,$5,$6,$7)',[o.id,p.id,p.name,p.unit,p.price,qty,sum]);
  await c.query('commit');await audit(me.tg_id,'order.create','order:'+o.id,{total:o.total});
  N.newOrder(o,lines.map(([p,qty,sum])=>({name:p.name,unit:p.unit,qty,sum})));return o;
 }catch(e){await c.query('rollback');throw e}finally{c.release()}
};
const NEXT={new:['accepted','cancelled'],accepted:['preparing','cancelled'],preparing:['ready','cancelled'],ready:['completed'],awaiting_confirm:['cancelled']};
async function restock(id){if(!(await getSetting('warehouse')).enabled)return;
 await q('update products p set stock=stock+i.qty from order_items i where i.order_id=$1 and i.product_id=p.id and p.stock is not null',[id])}
exports.setStatus=async(actor,id,status)=>{
 const o=(await q('select * from orders where id=$1',[id])).rows[0];if(!o)throw bad('Buyurtma topilmadi');
 if(!(NEXT[o.status]||[]).includes(status))throw bad(`${o.status} → ${status} mumkin emas`);
 await q('update orders set status=$1 where id=$2',[status,id]);if(status==='cancelled')await restock(id);
 await audit(actor,'order.'+status,'order:'+id);N.statusChanged({...o,status});return{...o,status};
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
exports.saveProduct=async(me,body,id)=>{
 const d={name:String(body.name||'').trim().slice(0,120),price:Math.round(Number(body.price)),unit:body.unit==='weight'?'weight':'piece',image:body.image||null,category:body.category};
 if(!d.name||!(d.price>0))throw bad("Nom va narx noto'g'ri");
 if(me.role==='worker'){d.category=me.department;
  const r=(await q("insert into pending_changes(action,product,worker_id,worker_name,department) values($1,$2,$3,$4,$5) returning *",[id?'edit':'add',{...d,id},me.tg_id,me.name,me.department])).rows[0];
  await audit(me.tg_id,'product.request','change:'+r.id,d);N.pending(r);return{pending:true}}
 if(id)await q('update products set name=$1,price=$2,unit=$3,image=coalesce($4,image),category=$5 where id=$6',[d.name,d.price,d.unit,d.image,d.category,id]);
 else id=(await q('insert into products(name,price,unit,image,category) values($1,$2,$3,$4,$5) returning id',[d.name,d.price,d.unit,d.image,d.category])).rows[0].id;
 await audit(me.tg_id,id?'product.save':'product.add','product:'+id,d);return{id};
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
  if(r.action==='add')await q('insert into products(name,price,unit,image,category) values($1,$2,$3,$4,$5)',[p.name,p.price,p.unit,p.image,p.category]);
  else if(r.action==='edit')await q('update products set name=$1,price=$2,unit=$3,image=coalesce($4,image) where id=$5 and category=$6',[p.name,p.price,p.unit,p.image,p.id,r.department]);
  else await q('update products set active=false where id=$1 and category=$2',[p.id,r.department])}
 await audit(actor,ok?'change.approve':'change.reject','change:'+id,r.product);N.changeResolved(r,ok);
};
exports.bad=bad;
                      
