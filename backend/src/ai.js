// AI Assistant powered by Google Gemini (Admin + Customer, text + voice, confirmation-gated mutations)
const crypto=require('crypto');
const {q,audit,getSetting,setSetting}=require('./db');
const O=require('./orders');

let hooks={runBroadcast:null,bustPub:()=>{}};
exports.init=h=>{hooks={...hooks,...h}};

const DEFAULT_CFG={customerEnabled:true,customerDailyLimit:15};
const SALE_SQL='sale_price is not null and sale_price>0 and sale_price<price and (sale_until is null or sale_until>now())';
const PSEL='id,pos,category,name,name_uz,description,min_grams,min_sum,weight_g,priority,family,sales_count,unit,price,sale_price,sale_until,image,age_min';
const NEXT_ST={new:['accepted','cancelled'],accepted:['preparing','cancelled'],preparing:['ready','cancelled'],ready:['completed'],awaiting_confirm:['cancelled'],age_check:['cancelled'],sub_pending:['cancelled']};
const ST_UZ={new:'Yangi',accepted:'Qabul qilindi',preparing:"Yig'ilmoqda",ready:'Tayyor',completed:'Topshirildi',cancelled:'Bekor qilindi',awaiting_confirm:'Narx tasdiqlash',age_check:'Yosh tasdiqlash',sub_pending:'Almashtirish'};
const CAT_WHERE='(category=$1 or category in (select name from categories where parent=$1) or category in (select c2.name from categories c2 join categories c1 on c2.parent=c1.name where c1.parent=$1))';

const apiKey=()=>String(process.env.GEMINI_API_KEY||'').trim();
const modelName=()=>String(process.env.GEMINI_MODEL||'gemini-2.5-flash').trim()||'gemini-2.5-flash';
exports.isReady=()=>Boolean(apiKey());
exports.modelName=modelName;

const so=(n,l='uz')=>Number(n||0).toLocaleString('ru-RU')+(l==='ru'?' сум':" so'm");
const isAdm=u=>Boolean(u&&['admin','superadmin'].includes(u.role));
const canBc=u=>Boolean(u&&(u.role==='superadmin'||(u.role==='admin'&&u.can_broadcast)));

function tashkentNow(){
 const now=new Date();
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now).map(x=>[x.type,x.value]));
 return{date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
}

/* Settings & per-day usage quotas */
async function getConfig(){
 const r=await getSetting('ai').catch(()=>null);
 if(!r||typeof r!=='object')return{...DEFAULT_CFG};
 return{
  customerEnabled:r.customerEnabled!==false,
  customerDailyLimit:Math.max(1,Math.min(200,Math.round(+r.customerDailyLimit)||DEFAULT_CFG.customerDailyLimit))
 };
}
exports.getConfig=getConfig;

async function saveConfig(actorId,body){
 const cur=await getConfig();
 const v={
  customerEnabled:typeof body.customerEnabled==='boolean'?body.customerEnabled:cur.customerEnabled,
  customerDailyLimit:body.customerDailyLimit!=null?Math.max(1,Math.min(200,Math.round(+body.customerDailyLimit)||cur.customerDailyLimit)):cur.customerDailyLimit
 };
 await setSetting('ai',v);
 hooks.bustPub();
 await audit(actorId,'settings.ai','settings',v);
 return v;
}
exports.saveConfig=saveConfig;

const usageMap=new Map(); // `${mode}:${tg_id}:${date}` -> count
const dayTotals=new Map(); // `${mode}:${date}` -> count
function checkQuota(mode,user,limit){
 const {date}=tashkentNow();
 if(usageMap.size>2000){for(const k of usageMap.keys())if(!k.endsWith(':'+date))usageMap.delete(k)}
 const key=`${mode}:${user.tg_id}:${date}`;
 const used=usageMap.get(key)||0;
 if(mode==='customer'&&isAdm(user))return{ok:true,used,limit,remaining:limit};
 if(used>=limit)return{ok:false,used,limit,remaining:0};
 usageMap.set(key,used+1);
 const tk=`${mode}:${date}`;
 dayTotals.set(tk,(dayTotals.get(tk)||0)+1);
 return{ok:true,used:used+1,limit,remaining:limit-used-1};
}
exports.getTodayStats=()=>{
 const {date}=tashkentNow();
 return{date,customerRequests:dayTotals.get('customer:'+date)||0,adminRequests:dayTotals.get('admin:'+date)||0};
};

/* Short-term conversation memory (text only, never audio) */
const convMem=new Map(); // `${mode}:${tg_id}` -> {turns, at}
const MEM_TTL=30*60*1000;
function getTurns(mode,tgId){
 const hit=convMem.get(`${mode}:${tgId}`);
 if(!hit||Date.now()-hit.at>MEM_TTL)return[];
 return hit.turns;
}
function pushTurn(mode,tgId,userTxt,modelTxt){
 const key=`${mode}:${tgId}`;
 const prev=getTurns(mode,tgId);
 const next=[...prev,{role:'user',parts:[{text:String(userTxt||'').slice(0,800)}]},{role:'model',parts:[{text:String(modelTxt||'').slice(0,1200)}]}].slice(-8);
 convMem.set(key,{turns:next,at:Date.now()});
 if(convMem.size>500){
  const now=Date.now();
  for(const [k,v] of convMem)if(now-v.at>MEM_TTL||convMem.size>500)convMem.delete(k);
 }
}
exports.clearHistory=(tgId,mode)=>{
 if(mode)convMem.delete(`${mode}:${tgId}`);
 else{convMem.delete(`admin:${tgId}`);convMem.delete(`customer:${tgId}`)}
};

/* Pending confirmation store for admin mutations */
const pendingMap=new Map(); // id -> {id,actorId,actions,summary,details,at}
const PEND_TTL=15*60*1000;
function putPending(actorId,actions,summary,details){
 const now=Date.now();
 for(const [k,v] of pendingMap)if(now-v.at>PEND_TTL)pendingMap.delete(k);
 const id=crypto.randomBytes(5).toString('hex');
 const rec={id,actorId:String(actorId),actions,summary,details,at:now};
 pendingMap.set(id,rec);
 return rec;
}
exports.cancelAction=(user,actionId)=>{
 const rec=pendingMap.get(String(actionId||''));
 if(!rec||rec.actorId!==String(user.tg_id))return{ok:false,error:'Amal topilmadi yoki muddati tugagan'};
 pendingMap.delete(rec.id);
 return{ok:true};
};

/* Raw Gemini REST call (native Node 18+ fetch, zero npm deps) */
async function callGemini({system,contents,tools}){
 const key=apiKey();
 if(!key)throw O.bad("AI ulanmagan: Railway Variables bo'limiga GEMINI_API_KEY qo'shing.");
 const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName())}:generateContent?key=${encodeURIComponent(key)}`;
 const body={
  system_instruction:{parts:[{text:system}]},
  contents,
  generationConfig:{temperature:0.3,maxOutputTokens:1024}
 };
 if(tools&&tools.length)body.tools=[{functionDeclarations:tools}];
 let res;
 try{
  res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 }catch(e){
  throw O.bad(e?.name==='TimeoutError'?"AI javob berishi cho'zilib ketdi, qayta urinib ko'ring.":"AI serveriga ulanib bo'lmadi, qayta urinib ko'ring.");
 }
 const data=await res.json().catch(()=>({}));
 if(!res.ok){
  const msg=data?.error?.message||'';
  if(res.status===429)throw O.bad("AI vaqtincha band (limitga yetdi). 1 daqiqadan keyin qayta urinib ko'ring.");
  if(res.status===400||res.status===401||res.status===403){
   if(/api.?key|permission|invalid/i.test(msg))throw O.bad("Gemini API kaliti noto'g'ri yoki ruxsatsiz. Railway Variables dagi GEMINI_API_KEY ni tekshiring.");
  }
  console.error('gemini',res.status,msg.slice(0,300));
  throw O.bad('AI xatosi: '+(msg.slice(0,120)||`HTTP ${res.status}`));
 }
 const parts=data?.candidates?.[0]?.content?.parts||[];
 const text=parts.filter(p=>typeof p.text==='string').map(p=>p.text).join('\n').trim();
 const calls=parts.filter(p=>p.functionCall).map(p=>p.functionCall);
 return{parts,text,calls};
}

/* ==================== ADMIN TOOLS ==================== */
const ADMIN_TOOLS=[
 {
  name:'search_products',
  description:"Do'kondagi mahsulotlarni qidirish (nomi, o'zbekcha nomi, shtrix-kodi, kategoriya, faol yoki aksiya bo'yicha).",
  parameters:{type:'OBJECT',properties:{
   query:{type:'STRING',description:'Qidiruv matni (masalan: olma, яблоко, cola).'},
   category:{type:'STRING',description:'Kategoriya nomi (aniq nomi).'},
   activeOnly:{type:'BOOLEAN',description:'Faqat faol mahsulotlar.'},
   saleOnly:{type:'BOOLEAN',description:'Faqat aksiyadagi mahsulotlar.'},
   limit:{type:'INTEGER',description:'Nechta qaytarish (max 25).'}
  }}
 },
 {
  name:'list_categories',
  description:"Barcha kategoriyalar va ularning ichidagi faol mahsulotlar sonini ko'rish.",
  parameters:{type:'OBJECT',properties:{}}
 },
 {
  name:'get_stats',
  description:"Savdo statistikasi, tushum, buyurtmalar soni, top kategoriyalar va eng ko'p sotilgan mahsulotlarni olish. from/to bo'sh bo'lsa oxirgi 7 kun.",
  parameters:{type:'OBJECT',properties:{
   from:{type:'STRING',description:'Boshlanish sanasi YYYY-MM-DD (Toshkent vaqti).'},
   to:{type:'STRING',description:'Tugash sanasi YYYY-MM-DD (Toshkent vaqti).'}
  }}
 },
 {
  name:'list_orders',
  description:"Oxirgi buyurtmalar ro'yxatini ko'rish.",
  parameters:{type:'OBJECT',properties:{
   status:{type:'STRING',description:'Filtr: new, accepted, preparing, ready, completed, cancelled, awaiting_confirm, age_check.'},
   limit:{type:'INTEGER',description:'Nechta (max 25).'}
  }}
 },
 {
  name:'get_order',
  description:"Bitta buyurtmaning to'liq tarkibi va keyingi ruxsat etilgan holatlarini ko'rish.",
  parameters:{type:'OBJECT',properties:{id:{type:'INTEGER',description:'Buyurtma ID raqami.'}},required:['id']}
 },
 {
  name:'update_product',
  description:"Bitta mahsulotni o'zgartirish: narx, aksiya (foiz yoki aniq narx, soat muddati, yoki o'chirish), faol/nofaol, prioritet (1-5), o'zbekcha nom yoki kategoriya. Avval search_products bilan ID ni aniqlang.",
  parameters:{type:'OBJECT',properties:{
   id:{type:'INTEGER',description:'Mahsulot ID.'},
   price:{type:'INTEGER',description:"Yangi asosiy narx (so'm)."},
   sale_price:{type:'INTEGER',description:"Yangi aksiya narxi (so'm). 0 bo'lsa aksiya olib tashlanadi."},
   sale_percent:{type:'NUMBER',description:'Chegirma foizi (1-95), masalan 15 -> 15% chegirma.'},
   sale_hours:{type:'NUMBER',description:'Aksiya necha soat davom etadi (masalan 24 -> ertagacha).'},
   sale_until:{type:'STRING',description:'Aksiya tugash vaqti ISO formatda (ixtiyoriy).'},
   clear_sale:{type:'BOOLEAN',description:'Aksiyani bekor qilish.'},
   active:{type:'BOOLEAN',description:'true = faol, false = nofaol.'},
   priority:{type:'INTEGER',description:'Ustuvorlik 1 (eng yuqori) dan 5 gacha.'},
   name_uz:{type:'STRING',description:"O'zbekcha nom."},
   category:{type:'STRING',description:'Kategoriya nomi.'}
  },required:['id']}
 },
 {
  name:'bulk_update_products',
  description:"Bir nechta mahsulotni (max 50 ta) birdaniga o'zgartirish (faol/nofaol, chegirma %, aksiya o'chirish, prioritet).",
  parameters:{type:'OBJECT',properties:{
   ids:{type:'ARRAY',items:{type:'INTEGER'},description:'Mahsulot ID lari.'},
   active:{type:'BOOLEAN'},
   sale_percent:{type:'NUMBER'},
   sale_hours:{type:'NUMBER'},
   clear_sale:{type:'BOOLEAN'},
   priority:{type:'INTEGER'}
  },required:['ids']}
 },
 {
  name:'set_product_position',
  description:"Katalog ichida mahsulotning tartib raqamini (1-dan boshlab) o'zgartirish. pos=0 katalogni avtomatik tartibga qaytaradi.",
  parameters:{type:'OBJECT',properties:{
   id:{type:'INTEGER',description:'Mahsulot ID.'},
   category:{type:'STRING',description:"Katalog nomi (bo'sh bo'lsa mahsulotning o'z katalogi olinadi)."},
   pos:{type:'INTEGER',description:"Yangi o'rin raqami (1, 2, 3...) yoki 0 (avtomatik tartib)."}
  },required:['id','pos']}
 },
 {
  name:'set_order_status',
  description:"Buyurtma holatini o'zgartirish (mijozga bot orqali avtomatik xabar boradi).",
  parameters:{type:'OBJECT',properties:{
   id:{type:'INTEGER',description:'Buyurtma ID.'},
   status:{type:'STRING',description:'Yangi holat: accepted, preparing, ready, completed, cancelled.'},
   fee:{type:'INTEGER',description:"Yetkazib berish narxi (faqat accepted da, ixtiyoriy)."}
  },required:['id','status']}
 },
 {
  name:'send_broadcast',
  description:"Mijozlarga Telegram bot orqali xabar tarqatish (broadcast).",
  parameters:{type:'OBJECT',properties:{
   target:{type:'STRING',description:'Kimga: all (hammasi), uz (oʻzbekcha), ru (ruscha).'},
   text:{type:'STRING',description:'Xabar matni.'},
   withBtn:{type:'BOOLEAN',description:"Do'konni ochish tugmasini qo'shish (standart true)."}
  },required:['text']}
 }
];

const ADMIN_WRITE_TOOLS=new Set(['update_product','bulk_update_products','set_product_position','set_order_status','send_broadcast']);

async function runAdminRead(name,args={}){
 if(name==='search_products'){
  const lim=Math.max(1,Math.min(25,Math.round(+args.limit)||12));
  const w=['true'],p=[];
  if(args.query){
   const s=String(args.query).trim().slice(0,60);
   p.push('%'+s+'%',s);
   w.push(`(name ilike $${p.length-1} or coalesce(name_uz,'') ilike $${p.length-1} or barcode=$${p.length})`);
  }
  if(args.category){
   p.push(String(args.category).trim().slice(0,80));const k=p.length;
   w.push(`(category=$${k} or category in (select name from categories where parent=$${k}) or category in (select c2.name from categories c2 join categories c1 on c2.parent=c1.name where c1.parent=$${k}))`);
  }
  if(args.activeOnly)w.push('active');
  if(args.saleOnly)w.push(SALE_SQL);
  const rows=(await q(`select id,name,name_uz,category,unit,price,sale_price,sale_until,active,priority,pos,stock,sales_count from products where ${w.join(' and ')} order by active desc,pos asc nulls last,coalesce(sales_count,0) desc,name limit ${lim}`,p)).rows;
  return{count:rows.length,products:rows};
 }
 if(name==='list_categories'){
  const rows=(await q(`select c.name,c.name_ru,c.parent,(select count(*)::int from products p where p.active and p.category=c.name) active_count from categories c order by case when coalesce(c.sort,0)>0 then c.sort else 999999 end,c.id`)).rows;
  return{categories:rows};
 }
 if(name==='get_stats'){
  const dd=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?String(x):null;
  const from=dd(args.from),to=dd(args.to);
  const df="($1::date is null or (o.created_at at time zone 'Asia/Tashkent')::date>=$1::date) and ($2::date is null or (o.created_at at time zone 'Asia/Tashkent')::date<=$2::date)";
  const [totR,catR,topR,pcR,cuR]=await Promise.all([
   q(`select count(*)::int orders,count(*) filter(where o.status<>'cancelled')::int valid_orders,count(*) filter(where o.status='cancelled')::int cancelled,coalesce(sum(o.total) filter(where o.status<>'cancelled'),0)::bigint revenue,coalesce(round(avg(o.total) filter(where o.status<>'cancelled')),0)::bigint avg_check,count(*) filter(where o.status in('new','age_check'))::int pending from orders o where ${df}`,[from,to]),
   q(`select coalesce(p.category,'Nabor') category,sum(coalesce(i.actual_sum,i.ordered_sum))::bigint revenue from order_items i join orders o on o.id=i.order_id and o.status<>'cancelled' and ${df} left join products p on p.id=i.product_id group by 1 order by 2 desc limit 8`,[from,to]),
   q(`select i.product_id id,coalesce(p.name_uz,p.name,i.name) name,sum(i.qty)::numeric qty,sum(coalesce(i.actual_sum,i.ordered_sum))::bigint revenue from order_items i join orders o on o.id=i.order_id and o.status<>'cancelled' and ${df} left join products p on p.id=i.product_id group by 1,2 order by 4 desc limit 10`,[from,to]),
   q("select count(*)::int total,count(*) filter(where active)::int active,count(*) filter(where needs_setup)::int setup from products"),
   q(`select count(*)::int total,count(*) filter(where ($1::date is null or (created_at at time zone 'Asia/Tashkent')::date>=$1::date) and ($2::date is null or (created_at at time zone 'Asia/Tashkent')::date<=$2::date))::int added from users`,[from,to])
  ]);
  return{from:from||'barchasi',to:to||'bugun',totals:totR.rows[0],topCategories:catR.rows,topProducts:topR.rows,products:pcR.rows[0],customers:cuR.rows[0]};
 }
 if(name==='list_orders'){
  const lim=Math.max(1,Math.min(25,Math.round(+args.limit)||10));
  const w=['true'],p=[];
  if(args.status){p.push(String(args.status));w.push(`o.status=$${p.length}`)}
  const rows=(await q(`select o.id,o.status,o.name,o.phone,o.type,o.address,o.total,o.code,o.created_at,coalesce((select string_agg(i.name||' ×'||i.qty::text,', ') from order_items i where i.order_id=o.id),'') items from orders o where ${w.join(' and ')} order by o.id desc limit ${lim}`,p)).rows;
  return{count:rows.length,orders:rows};
 }
 if(name==='get_order'){
  const id=Math.round(+args.id)||0;
  const o=(await q('select * from orders where id=$1',[id])).rows[0];
  if(!o)return{error:'Buyurtma topilmadi'};
  const items=(await q('select id,product_id,name,unit,qty,ordered_sum,actual_sum from order_items where order_id=$1 order by id',[id])).rows;
  return{order:o,items,allowedNextStatuses:NEXT_ST[o.status]||[]};
 }
 return{error:"Noma'lum vosita"};
}

function calcSalePrice(basePrice,pct){
 const raw=basePrice*(1-pct/100);
 return basePrice>=1000?Math.max(100,Math.round(raw/100)*100):Math.max(1,Math.round(raw));
}

async function prepareAdminWrite(user,name,args={}){
 if(name==='update_product'){
  const id=Math.round(+args.id)||0;
  const p=(await q('select id,name,name_uz,category,price,sale_price,sale_until,active,priority,pos from products where id=$1',[id])).rows[0];
  if(!p)return{error:`#${id} raqamli mahsulot topilmadi`};
  const nextPrice=args.price!=null&&Math.round(+args.price)>0?Math.round(+args.price):p.price;
  const patch={};const changes=[];
  if(args.price!=null&&nextPrice!==p.price){patch.price=nextPrice;changes.push(`Narx: ${so(p.price)} → ${so(nextPrice)}`)}
  if(args.clear_sale===true||args.sale_price===0){
   patch.sale_price=null;patch.sale_until=null;changes.push('Aksiya bekor qilinadi');
  }else if(args.sale_percent!=null||args.sale_price!=null){
   let sp;
   if(args.sale_percent!=null){
    const pct=Number(args.sale_percent);
    if(!(pct>0&&pct<95))return{error:'Chegirma foizi 1 dan 95 gacha boʻlishi kerak'};
    sp=calcSalePrice(nextPrice,pct);
   }else sp=Math.round(+args.sale_price);
   if(!(sp>0&&sp<nextPrice))return{error:`Aksiya narxi (${so(sp)}) asosiy narxdan (${so(nextPrice)}) kichik bo'lishi kerak`};
   patch.sale_price=sp;
   let until=null;
   if(args.sale_hours!=null&&Number(args.sale_hours)>0){
    until=new Date(Date.now()+Number(args.sale_hours)*3600000).toISOString();
    patch.sale_until=until;
   }else if(args.sale_until){
    const dt=new Date(args.sale_until);
    if(!Number.isNaN(dt.getTime())){until=dt.toISOString();patch.sale_until=until}
   }else patch.sale_until=null;
   const pctShow=Math.round((1-sp/nextPrice)*100);
   changes.push(`Aksiya: ${so(sp)} (−${pctShow}%)${args.sale_hours?`, ${args.sale_hours} soatga`:until?`, ${until.slice(0,16).replace('T',' ')} gacha`:''}`);
  }
  if(typeof args.active==='boolean'&&args.active!==p.active){patch.active=args.active;changes.push(args.active?'Holat: Faol ✅':"Holat: Nofaol (o'chiriladi) ⛔")}
  if(args.priority!=null){
   const pr=Math.max(1,Math.min(5,Math.round(+args.priority)||3));
   patch.priority=pr;changes.push(`Prioritet: ${p.priority||3} → ${pr}`);
  }
  if(args.name_uz!=null){patch.name_uz=String(args.name_uz).trim().slice(0,120)||null;changes.push(`O'zbekcha nom: ${patch.name_uz||'—'}`)}
  if(args.category!=null){patch.category=String(args.category).trim().slice(0,80)||p.category;changes.push(`Kategoriya: ${p.category} → ${patch.category}`)}
  if(!changes.length)return{error:"Hech qanday o'zgarish ko'rsatilmadi"};
  const label=p.name_uz||p.name;
  return{action:{tool:'update_product',id,patch},line:`🛍 ${label} (#${id}): ${changes.join(' · ')}`};
 }
 if(name==='bulk_update_products'){
  const ids=[...new Set((Array.isArray(args.ids)?args.ids:[]).map(x=>Math.round(+x)).filter(x=>x>0))].slice(0,50);
  if(!ids.length)return{error:'Mahsulot ID lari kerak'};
  const rows=(await q('select id,name,name_uz,price from products where id=any($1::int[])',[ids])).rows;
  if(!rows.length)return{error:'Koʻrsatilgan mahsulotlar topilmadi'};
  const desc=[];
  if(typeof args.active==='boolean')desc.push(args.active?'Faollashtirish ✅':"Nofaol qilish ⛔");
  if(args.clear_sale===true)desc.push('Aksiyani olib tashlash');
  if(args.sale_percent!=null){
   const pct=Number(args.sale_percent);
   if(!(pct>0&&pct<95))return{error:'Chegirma foizi 1–95 oraligʻida boʻlishi kerak'};
   desc.push(`−${pct}% aksiya${args.sale_hours?` (${args.sale_hours} soatga)`:''}`);
  }
  if(args.priority!=null)desc.push(`Prioritet = ${Math.max(1,Math.min(5,Math.round(+args.priority)||3))}`);
  if(!desc.length)return{error:"O'zgarish parametri ko'rsatilmadi"};
  const sample=rows.slice(0,4).map(r=>r.name_uz||r.name).join(', ')+(rows.length>4?` va yana ${rows.length-4} ta`:'');
  return{action:{tool:'bulk_update_products',ids:rows.map(r=>r.id),args:{active:args.active,sale_percent:args.sale_percent,sale_hours:args.sale_hours,clear_sale:args.clear_sale,priority:args.priority}},line:`📦 ${rows.length} ta mahsulot (${sample}): ${desc.join(' · ')}`};
 }
 if(name==='set_product_position'){
  const id=Math.round(+args.id)||0,pos=Math.round(+args.pos||0);
  const p=(await q('select id,name,name_uz,category,active from products where id=$1',[id])).rows[0];
  if(!p)return{error:`#${id} mahsulot topilmadi`};
  const cat=String(args.category||p.category||'').trim().slice(0,120);
  if(!cat)return{error:'Kategoriya aniqlanmadi'};
  const label=p.name_uz||p.name;
  const line=pos<=0?`↺ «${cat}» katalogini avtomatik tartibga qaytarish`:`🔢 ${label} (#${id}) — «${cat}» katalogida ${pos}-o'ringa ko'chirish`;
  return{action:{tool:'set_product_position',id,cat,pos},line};
 }
 if(name==='set_order_status'){
  const id=Math.round(+args.id)||0,st=String(args.status||'').trim();
  const o=(await q('select id,status,name,total,type from orders where id=$1',[id])).rows[0];
  if(!o)return{error:`Buyurtma #${id} topilmadi`};
  const allowed=NEXT_ST[o.status]||[];
  if(!allowed.includes(st))return{error:`Buyurtma #${id} hozir «${ST_UZ[o.status]||o.status}» holatida. Ruxsat etilgan: ${allowed.join(', ')||'yoʻq'}`};
  const fee=args.fee!=null?Math.max(0,Math.round(+args.fee)):undefined;
  return{action:{tool:'set_order_status',id,status:st,fee},line:`📦 Buyurtma #${id} (${o.name}): ${ST_UZ[o.status]||o.status} → ${ST_UZ[st]||st}${fee?` (+${so(fee)} yetkazish)`:''}`};
 }
 if(name==='send_broadcast'){
  if(!canBc(user))return{error:"Sizda mijozlarga xabar yuborish (broadcast) ruxsati yo'q"};
  const target=['all','uz','ru'].includes(args.target)?args.target:'all';
  const text=String(args.text||'').trim().slice(0,3800);
  if(!text)return{error:'Xabar matni boʻsh'};
  const withBtn=args.withBtn!==false;
  const cnt=(await q("select count(*)::int all_c,count(*) filter(where coalesce(lang,'uz')<>'ru')::int uz_c,count(*) filter(where lang='ru')::int ru_c from users")).rows[0]||{all_c:0,uz_c:0,ru_c:0};
  const n=target==='uz'?cnt.uz_c:target==='ru'?cnt.ru_c:cnt.all_c;
  const tLbl=target==='uz'?"O'zbekcha":target==='ru'?'Ruscha':'Barcha mijozlar';
  return{action:{tool:'send_broadcast',target,text,withBtn},line:`📣 Xabar yuborish (${tLbl} — ${n} kishiga):\n«${text.slice(0,200)}${text.length>200?'…':''}»`};
 }
 return{error:"Noma'lum amal"};
}

async function execAdminAction(user,a){
 if(a.tool==='update_product'){
  const keys=Object.keys(a.patch);
  const setSql=keys.map((k,i)=>`${k}=$${i+1}`).join(',');
  await q(`update products set ${setSql},needs_setup=false where id=$${keys.length+1}`,[...keys.map(k=>a.patch[k]),a.id]);
  hooks.bustPub();
  await audit(user.tg_id,'ai.product_update','product:'+a.id,a.patch);
  return`✅ #${a.id} yangilandi`;
 }
 if(a.tool==='bulk_update_products'){
  const {ids,args}=a;
  if(typeof args.active==='boolean')await q('update products set active=$1 where id=any($2::int[])',[args.active,ids]);
  if(args.clear_sale===true)await q('update products set sale_price=null,sale_until=null where id=any($1::int[])',[ids]);
  if(args.sale_percent!=null){
   const pct=Number(args.sale_percent);
   const until=args.sale_hours>0?new Date(Date.now()+Number(args.sale_hours)*3600000).toISOString():null;
   const rows=(await q('select id,price from products where id=any($1::int[])',[ids])).rows;
   const spIds=[],spVals=[];
   for(const r of rows){const sp=calcSalePrice(r.price,pct);if(sp>0&&sp<r.price){spIds.push(r.id);spVals.push(sp)}}
   if(spIds.length)await q('update products p set sale_price=v.sp,sale_until=$3 from unnest($1::int[],$2::int[]) v(id,sp) where p.id=v.id',[spIds,spVals,until]);
  }
  if(args.priority!=null){
   const pr=Math.max(1,Math.min(5,Math.round(+args.priority)||3));
   await q('update products set priority=$1 where id=any($2::int[])',[pr,ids]);
  }
  hooks.bustPub();
  await audit(user.tg_id,'ai.bulk_update','products:'+ids.length,{count:ids.length,...args});
  return`✅ ${ids.length} ta mahsulot yangilandi`;
 }
 if(a.tool==='set_product_position'){
  const W=`active and ${CAT_WHERE}`;
  if(a.pos<=0){
   await q(`update products set pos=null where ${W}`,[a.cat]);
   hooks.bustPub();
   await audit(user.tg_id,'product.pos.reset','cat:'+a.cat,{via:'ai'});
   return`✅ «${a.cat}» avtomatik tartibga qaytarildi`;
  }
  const wh=!!(await getSetting('warehouse').catch(()=>({}))).enabled;
  const vis=wh?'(stock is null or stock>0)':'true';
  const rows=(await q(`select id,${vis} v from products where ${W} order by pos asc nulls last,coalesce(priority,3) asc,coalesce(sales_count,0) desc,name`,[a.cat])).rows;
  const shown=rows.filter(r=>r.v).map(r=>r.id),hidden=rows.filter(r=>!r.v).map(r=>r.id);
  if(!shown.includes(a.id))throw O.bad(`Mahsulot «${a.cat}» katalogida faol holatda topilmadi`);
  const ids=[...O.moveTo(shown,a.id,a.pos),...hidden];
  await q('update products p set pos=v.n from unnest($1::int[]) with ordinality v(id,n) where p.id=v.id',[ids]);
  hooks.bustPub();
  await audit(user.tg_id,'product.pos','product:'+a.id,{cat:a.cat,pos:a.pos,via:'ai'});
  return`✅ ${Math.min(Math.max(1,a.pos),shown.length)}-o'ringa ko'chirildi`;
 }
 if(a.tool==='set_order_status'){
  await O.setStatus(user.tg_id,a.id,a.status,a.fee);
  return`✅ Buyurtma #${a.id} → ${ST_UZ[a.status]||a.status}`;
 }
 if(a.tool==='send_broadcast'){
  if(!canBc(user))throw O.bad("Xabar yuborish ruxsati yo'q");
  if(!hooks.runBroadcast)throw O.bad('Broadcast xizmati ulanmagan');
  const r=await hooks.runBroadcast({sender:user,target:a.target,kind:'text',text:a.text,preview:a.text,withBtn:a.withBtn});
  return`🚀 Xabar yuborish boshlandi (#${r.id}, ${r.total} ta mijozga)`;
 }
 throw O.bad("Noma'lum amal");
}

exports.confirmAction=async(user,actionId)=>{
 if(!isAdm(user))throw O.bad("Ruxsat yo'q");
 const rec=pendingMap.get(String(actionId||''));
 if(!rec||rec.actorId!==String(user.tg_id))throw O.bad('Tasdiqlash soʻrovi topilmadi yoki muddati tugagan');
 if(Date.now()-rec.at>PEND_TTL){pendingMap.delete(rec.id);throw O.bad('Muddati tugagan, qaytadan soʻrang')}
 pendingMap.delete(rec.id); // consume immediately to prevent double-execution
 const results=[];
 for(const a of rec.actions){
  results.push(await execAdminAction(user,a));
 }
 return{ok:true,results,message:results.join('\n')};
};

async function chatAdmin(user,{text='',audioBase64='',audioMime=''}){
 if(!isAdm(user))throw O.bad("Faqat adminlar uchun");
 const qk=checkQuota('admin',user,150);
 if(!qk.ok)throw O.bad('Bugungi admin AI limiti tugadi.');
 const now=tashkentNow();
 const system=`Sen TEGEN Market supermarketi admini uchun aqlli AI yordamchisan.
Hozirgi vaqt (Toshkent): ${now.date} ${now.time}.
Admin ismi: ${user.name||'Admin'} (rol: ${user.role}).
Qoidalar:
1. Foydalanuvchi qaysi tilda (O'zbekcha yoki Ruscha) murojaat qilsa, o'sha tilda qisqa, aniq, samimiy javob ber.
2. Ovozli xabarni tinglab, foydalanuvchi nimani so'raganini tushunib darhol bajar.
3. Do'kon ma'lumotlari haqida hech qachon taxmin qilma — doim vositalardan (search_products, list_categories, get_stats, list_orders, get_order) foydalan.
4. Mahsulot nomlari bazada ruscha (kirill) yoki o'zbekcha (lotin) bo'lishi mumkin. Topilmasa muqobil tilda ham qidir (masalan olma -> яблок, go'sht -> говядин, sut -> молок).
5. Mahsulotni o'zgartirish, tartibini surish, buyurtma holatini o'zgartirish yoki broadcast yuborishdan oldin avval aniq ID ni qidirib top, keyin tegishli vositani chaqir (tizim avtomatik admindan tasdiqlash so'raydi).
6. Agar bir nechta o'xshash mahsulot topilsa va qaysi biri aniq bo'lmasa, ro'yxatni raqamlab ko'rsat va qaysi birini nazarda tutganini so'ra.
7. Narxlarni o'qishga qulay formatda yoz (masalan: 15 000 so'm).`;

 const userParts=[];
 const cleanTxt=String(text||'').trim().slice(0,1200);
 if(audioBase64){
  if(audioBase64.length>2800000)throw O.bad('Ovozli xabar juda uzun (max ~30 soniya)');
  userParts.push({inlineData:{mimeType:audioMime||'audio/ogg',data:audioBase64}});
  userParts.push({text:cleanTxt||"Ovozli buyruqni tingla va bajar."});
 }else if(cleanTxt){
  userParts.push({text:cleanTxt});
 }else throw O.bad('Xabar yozing yoki ovozli xabar yuboring');

 const contents=[...getTurns('admin',user.tg_id),{role:'user',parts:userParts}];

 for(let step=0;step<5;step++){
  const res=await callGemini({system,contents,tools:ADMIN_TOOLS});
  if(!res.calls.length){
   const reply=res.text||'Tayyor.';
   pushTurn('admin',user.tg_id,cleanTxt||'[Ovozli xabar]',reply);
   return{reply,pending:null};
  }
  const writeCalls=res.calls.filter(c=>ADMIN_WRITE_TOOLS.has(c.name));
  const readCalls=res.calls.filter(c=>!ADMIN_WRITE_TOOLS.has(c.name));

  // If there are write calls, validate them immediately
  if(writeCalls.length){
   const prepared=[],lines=[],errors=[];
   for(const c of writeCalls){
    const pr=await prepareAdminWrite(user,c.name,c.args||{});
    if(pr.error)errors.push({name:c.name,error:pr.error});
    else{prepared.push(pr.action);lines.push(pr.line)}
   }
   if(errors.length&&!prepared.length){
    // Feed validation errors back to Gemini so it can self-correct or explain
    contents.push({role:'model',parts:res.parts});
    const respParts=res.calls.map(c=>{
     const er=errors.find(e=>e.name===c.name);
     return{functionResponse:{name:c.name,response:er?{error:er.error}:{skipped:true}}};
    });
    contents.push({role:'user',parts:respParts});
    continue;
   }
   const summary=lines.join('\n');
   const rec=putPending(user.tg_id,prepared,summary,lines);
   const reply=(res.text?res.text+'\n\n':'')+'Quyidagi amalni bajarishni tasdiqlaysizmi?';
   pushTurn('admin',user.tg_id,cleanTxt||'[Ovozli xabar]',`${reply}\n${summary}`);
   return{reply,pending:{id:rec.id,summary:rec.summary,details:rec.details}};
  }

  // Otherwise execute all read calls in parallel and continue loop
  contents.push({role:'model',parts:res.parts});
  const respParts=await Promise.all(readCalls.map(async c=>{
   try{
    const out=await runAdminRead(c.name,c.args||{});
    return{functionResponse:{name:c.name,response:out}};
   }catch(e){
    return{functionResponse:{name:c.name,response:{error:e.message||'Xato'}}};
   }
  }));
  contents.push({role:'user',parts:respParts});
 }
 return{reply:"So'rov juda murakkab bo'ldi, iltimos aniqroq yozing.",pending:null};
}
exports.chatAdmin=chatAdmin;

/* ==================== CUSTOMER TOOLS ==================== */
const CUSTOMER_TOOLS=[
 {
  name:'search_shop_products',
  description:"Do'kondagi mavjud mahsulotlarni qidirish. Bir martada bir nechta kalit so'z yuborish mumkin (masalan palov uchun: ['guruch','рис','sabzi','морков','piyoz','лук','yog','масло','go\\'sht','говядин']).",
  parameters:{type:'OBJECT',properties:{
   queries:{type:'ARRAY',items:{type:'STRING'},description:"Qidiruv so'zlari ro'yxati (o'zbekcha va ruscha qisqa ildizlar bilan, max 12 ta)."},
   category:{type:'STRING',description:'Kategoriya nomi (ixtiyoriy).'},
   saleOnly:{type:'BOOLEAN',description:'Faqat aksiyadagi mahsulotlar.'},
   limit:{type:'INTEGER',description:'Jami max mahsulot (max 36).'}
  }}
 },
 {
  name:'list_shop_categories',
  description:"Do'kondagi barcha bo'limlar (kategoriyalar) ro'yxatini ko'rish.",
  parameters:{type:'OBJECT',properties:{}}
 },
 {
  name:'get_my_orders',
  description:"Mijozning o'zining oxirgi buyurtmalari holatini ko'rish.",
  parameters:{type:'OBJECT',properties:{}}
 },
 {
  name:'suggest_cart',
  description:"Mijozga savatga qo'shish uchun aniq do'kon mahsulotlarini (search_shop_products dan olingan haqiqiy product_id lar bilan) tavsiya qilish.",
  parameters:{type:'OBJECT',properties:{
   items:{type:'ARRAY',items:{type:'OBJECT',properties:{
    product_id:{type:'INTEGER',description:'Haqiqiy mahsulot ID.'},
    qty:{type:'INTEGER',description:'Dona mahsulot uchun soni (1-20).'},
    grams:{type:'INTEGER',description:"Vaznli (unit='weight') mahsulot uchun gramm (masalan 500, 1000)."},
    note:{type:'STRING',description:'Qisqa izoh (masalan "4 kishiga 1 kg").'}
   },required:['product_id']}}
  },required:['items']}
 }
];

async function runCustomerTool(user,wh,name,args={},recBag){
 const stockCond=wh?' and (stock is null or stock>0)':'';
 if(name==='search_shop_products'){
  const lim=Math.max(5,Math.min(36,Math.round(+args.limit)||28));
  const qs=(Array.isArray(args.queries)?args.queries:[]).map(x=>String(x||'').trim().slice(0,40)).filter(Boolean).slice(0,12);
  const found=new Map();
  if(qs.length){
   const per=Math.max(3,Math.min(6,Math.ceil(lim/qs.length)+1));
   const resList=await Promise.all(qs.map(term=>{
    const w=[`active${stockCond}`],p=['%'+term+'%'];
    w.push(`(name ilike $1 or coalesce(name_uz,'') ilike $1)`);
    if(args.category){p.push(String(args.category).trim().slice(0,80));w.push(`category=$${p.length}`)}
    if(args.saleOnly)w.push(SALE_SQL);
    return q(`select id,name,name_uz,category,unit,price,sale_price,sale_until,min_grams,weight_g from products where ${w.join(' and ')} order by pos asc nulls last,coalesce(sales_count,0) desc,name limit ${per}`,p);
   }));
   for(const r of resList)for(const row of r.rows)if(!found.has(row.id)&&found.size<lim)found.set(row.id,row);
  }else{
   const w=[`active${stockCond}`],p=[];
   if(args.category){
    p.push(String(args.category).trim().slice(0,80));const k=p.length;
    w.push(`(category=$${k} or category in (select name from categories where parent=$${k}))`);
   }
   if(args.saleOnly)w.push(SALE_SQL);
   const r=await q(`select id,name,name_uz,category,unit,price,sale_price,sale_until,min_grams,weight_g from products where ${w.join(' and ')} order by pos asc nulls last,coalesce(sales_count,0) desc,name limit ${lim}`,p);
   for(const row of r.rows)found.set(row.id,row);
  }
  return{count:found.size,products:[...found.values()]};
 }
 if(name==='list_shop_categories'){
  const rows=(await q('select name,name_ru,parent from categories order by case when coalesce(sort,0)>0 then sort else 999999 end,id')).rows;
  return{categories:rows};
 }
 if(name==='get_my_orders'){
  const rows=(await q(`select o.id,o.status,o.total,o.code,o.type,o.created_at,coalesce((select string_agg(i.name||' ×'||i.qty::text,', ') from order_items i where i.order_id=o.id),'') items from orders o where o.user_id=$1 order by o.id desc limit 5`,[user.tg_id])).rows;
  return{orders:rows.map(o=>({...o,status_uz:ST_UZ[o.status]||o.status}))};
 }
 if(name==='suggest_cart'){
  const list=(Array.isArray(args.items)?args.items:[]).slice(0,15);
  const ids=[...new Set(list.map(x=>Math.round(+x.product_id)).filter(x=>x>0))];
  if(!ids.length)return{ok:false,added:0};
  const rows=(await q(`select ${PSEL} from products where active${stockCond} and id=any($1::int[])`,[ids])).rows;
  const byId=new Map(rows.map(r=>[r.id,r]));
  recBag.length=0;
  for(const it of list){
   const p=byId.get(Math.round(+it.product_id));
   if(!p||recBag.some(x=>x.product.id===p.id))continue;
   if(p.unit==='weight'){
    const minG=p.min_grams||250;
    const rawG=Math.round(+it.grams)||Math.round((+it.qty||0.5)*1000)||500;
    const grams=Math.max(minG,Math.min(10000,Math.round(rawG/50)*50));
    recBag.push({product:p,grams,note:String(it.note||'').slice(0,80)});
   }else{
    const qty=Math.max(1,Math.min(20,Math.round(+it.qty)||1));
    recBag.push({product:p,qty,note:String(it.note||'').slice(0,80)});
   }
  }
  return{ok:true,attached:recBag.length};
 }
 return{error:"Noma'lum vosita"};
}

async function chatCustomer(user,{text='',audioBase64='',audioMime=''}){
 const cfg=await getConfig();
 if(!cfg.customerEnabled&&!isAdm(user))throw O.bad("AI maslahatchi hozircha o'chirilgan.");
 const qk=checkQuota('customer',user,cfg.customerDailyLimit);
 if(!qk.ok)throw O.bad(`Bugungi AI limiti tugadi (${cfg.customerDailyLimit} ta savol/kun). Ertaga yana foydalanishingiz mumkin.`);
 const wh=!!(await getSetting('warehouse').catch(()=>({}))).enabled;
 const now=tashkentNow();
 const system=`Sen TEGEN Market supermarketining samimiy AI xarid maslahatchisisan.
Hozirgi vaqt (Toshkent): ${now.date} ${now.time}.
Mijoz ismi: ${user.name||'Mijoz'}, tili: ${user.lang==='ru'?'Ruscha':'Oʻzbekcha'}.
Qoidalar:
1. Mijoz qaysi tilda yozsa yoki gapirsa (O'zbekcha yoki Ruscha), o'sha tilda qisqa, foydali va do'stona javob ber.
2. Mijoz ovqat retsepti (masalan "4 kishiga palov", "salat", "shorva", "nonushta") yoki mahsulot so'rasa:
   - Avval search_shop_products bilan barcha kerakli masalliqlarni BITTA chaqiruvda qidir!
   - MUHIM: Do'kondagi mahsulotlar ko'pincha ruscha (kirill) yoki o'zbekcha (lotin) yozilgan. Har bir masalliq uchun ikkala tilda qisqa ildiz yubor, masalan: ['guruch','рис','sabzi','морков','piyoz','лук','yog','масло','go\\'sht','говядин'].
   - Topilgan eng mos REAL mahsulotlarni suggest_cart vositasi orqali savatga tavsiya qil (hech qachon yo'q ID o'ylab topma!).
   - Agar biror masalliq do'konda topilmasa, uni halol aytib o't ("Do'konda hozir X topilmadi").
3. Mijoz aksiya so'rasa search_shop_products({saleOnly:true}) ni ishlat va eng yaxshilarini suggest_cart bilan ko'rsat.
4. Mijoz o'z buyurtmasini so'rasa get_my_orders ni ishlat.
5. Hech qachon mahsulot narxini o'ylab topma, faqat bazadan kelgan narxni ayt.`;

 const userParts=[];
 const cleanTxt=String(text||'').trim().slice(0,800);
 if(audioBase64){
  if(audioBase64.length>2800000)throw O.bad('Ovozli xabar juda uzun');
  userParts.push({inlineData:{mimeType:audioMime||'audio/ogg',data:audioBase64}});
  userParts.push({text:cleanTxt||"Mijozning ovozli savolini tingla va yordam ber."});
 }else if(cleanTxt){
  userParts.push({text:cleanTxt});
 }else throw O.bad('Savolingizni yozing');

 const contents=[...getTurns('customer',user.tg_id),{role:'user',parts:userParts}];
 const recBag=[];

 for(let step=0;step<4;step++){
  const res=await callGemini({system,contents,tools:CUSTOMER_TOOLS});
  if(!res.calls.length){
   const reply=res.text||'Marhamat!';
   pushTurn('customer',user.tg_id,cleanTxt||'[Ovozli xabar]',reply);
   return{reply,recommendations:recBag,remaining:qk.remaining};
  }
  contents.push({role:'model',parts:res.parts});
  const respParts=await Promise.all(res.calls.map(async c=>{
   try{
    const out=await runCustomerTool(user,wh,c.name,c.args||{},recBag);
    return{functionResponse:{name:c.name,response:out}};
   }catch(e){
    return{functionResponse:{name:c.name,response:{error:e.message||'Xato'}}};
   }
  }));
  contents.push({role:'user',parts:respParts});
 }
 const fallback=recBag.length?'Mana sizga mos mahsulotlar:':"Kechirasiz, qayta urinib ko'ring.";
 return{reply:fallback,recommendations:recBag,remaining:qk.remaining};
}
exports.chatCustomer=chatCustomer;
