// Admin-only AI Assistant powered by Google Gemini (superadmin + selected admins via can_ai)
const crypto=require('crypto');
const {q,audit,getSetting}=require('./db');
const O=require('./orders');

let hooks={runBroadcast:null,bustPub:()=>{}};
exports.init=h=>{hooks={...hooks,...h}};

const SALE_SQL='sale_price is not null and sale_price>0 and sale_price<price and (sale_until is null or sale_until>now())';
const NEXT_ST={new:['accepted','cancelled'],accepted:['preparing','cancelled'],preparing:['ready','cancelled'],ready:['completed'],awaiting_confirm:['cancelled'],age_check:['cancelled'],sub_pending:['cancelled']};
const ST_UZ={new:'Yangi',accepted:'Qabul qilindi',preparing:"Yig'ilmoqda",ready:'Tayyor',completed:'Topshirildi',cancelled:'Bekor qilindi',awaiting_confirm:'Narx tasdiqlash',age_check:'Yosh tasdiqlash',sub_pending:'Almashtirish'};
const CAT_WHERE='(category=$1 or category in (select name from categories where parent=$1) or category in (select c2.name from categories c2 join categories c1 on c2.parent=c1.name where c1.parent=$1))';

let resolvedModel=null;
const apiKey=()=>String(process.env.GEMINI_API_KEY||'').trim();
const modelName=()=>String(process.env.GEMINI_MODEL||resolvedModel||'gemini-3.8').trim()||'gemini-3.8';
exports.isReady=()=>Boolean(apiKey());
exports.modelName=modelName;

const so=(n,l='uz')=>Number(n||0).toLocaleString('ru-RU')+(l==='ru'?' сум':" so'm");
const canAi=u=>Boolean(u&&(u.role==='superadmin'||(u.role==='admin'&&u.can_ai)));
const canBc=u=>Boolean(u&&(u.role==='superadmin'||(u.role==='admin'&&u.can_broadcast)));
exports.canAi=canAi;

function tashkentNow(){
 const now=new Date();
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tashkent',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now).map(x=>[x.type,x.value]));
 return{date:`${parts.year}-${parts.month}-${parts.day}`,time:`${parts.hour}:${parts.minute}`};
}

const usageMap=new Map();
const dayTotals=new Map();
function checkQuota(user,limit=200){
 const {date}=tashkentNow();
 if(usageMap.size>1000){for(const k of usageMap.keys())if(!k.endsWith(':'+date))usageMap.delete(k)}
 const key=`${user.tg_id}:${date}`;
 const used=usageMap.get(key)||0;
 if(used>=limit)return{ok:false,used,limit};
 usageMap.set(key,used+1);
 dayTotals.set(date,(dayTotals.get(date)||0)+1);
 return{ok:true,used:used+1,limit};
}
exports.getTodayStats=()=>{
 const {date}=tashkentNow();
 return{date,requests:dayTotals.get(date)||0};
};

/* Short-term conversation memory (text only, never audio) */
const convMem=new Map(); // tg_id -> {turns, at}
const MEM_TTL=30*60*1000;
function getTurns(tgId){
 const hit=convMem.get(String(tgId));
 if(!hit||Date.now()-hit.at>MEM_TTL)return[];
 return hit.turns;
}
function pushTurn(tgId,userTxt,modelTxt){
 const key=String(tgId);
 const next=[...getTurns(tgId),{role:'user',parts:[{text:String(userTxt||'').slice(0,800)}]},{role:'model',parts:[{text:String(modelTxt||'').slice(0,1200)}]}].slice(-8);
 convMem.set(key,{turns:next,at:Date.now()});
 if(convMem.size>300){
  const now=Date.now();
  for(const [k,v] of convMem)if(now-v.at>MEM_TTL||convMem.size>300)convMem.delete(k);
 }
}
exports.clearHistory=tgId=>{convMem.delete(String(tgId))};

/* Pending confirmation store for admin mutations */
const pendingMap=new Map();
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

/* Raw Gemini REST call (native Node 18+ fetch, zero npm deps, auto-fallback on 429 / deprecated model) */
const FALLBACK_MODELS=['gemini-2.5-flash','gemini-2.5-flash-lite','gemini-2.0-flash','gemini-2.0-flash-lite','gemini-3-flash-preview','gemini-3.0-flash'];
const rankModel=n=>{
 let s=0;
 if(/flash/i.test(n))s+=100;
 if(/lite/i.test(n))s-=5;
 if(/preview|exp/i.test(n))s-=20;
 if(/pro\b/i.test(n))s-=40;
 return s;
};
async function discoverModels(key,tried){
 const out=[];
 try{
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,{signal:AbortSignal.timeout(8000)});
  if(r.ok){
   const d=await r.json().catch(()=>({}));
   const list=(d.models||[]).filter(m=>Array.isArray(m.supportedGenerationMethods)&&m.supportedGenerationMethods.includes('generateContent'))
    .map(m=>String(m.name||'').replace(/^models\//,''))
    .filter(n=>n&&!tried.has(n)&&/^gemini-/i.test(n)&&!/embedding|tts|image|vision|aqa|robotics|computer/i.test(n))
    .sort((a,b)=>rankModel(b)-rankModel(a)||b.localeCompare(a));
   for(const n of list)if(!out.includes(n))out.push(n);
  }
 }catch{}
 for(const n of FALLBACK_MODELS)if(!tried.has(n)&&!out.includes(n))out.push(n);
 return out.slice(0,5);
}
async function postGemini(key,model,body){
 const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
 let res;
 try{
  res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 }catch(e){
  throw O.bad(e?.name==='TimeoutError'?"AI javob berishi cho'zilib ketdi, qayta urinib ko'ring.":"AI serveriga ulanib bo'lmadi, qayta urinib ko'ring.");
 }
 const data=await res.json().catch(()=>({}));
 return{res,data};
}
async function callGemini({system,contents,tools}){
 const key=apiKey();
 if(!key)throw O.bad("AI ulanmagan: Railway Variables bo'limiga GEMINI_API_KEY qo'shing.");
 const body={
  system_instruction:{parts:[{text:system}]},
  contents,
  generationConfig:{temperature:0.3,maxOutputTokens:1024}
 };
 if(tools&&tools.length)body.tools=[{functionDeclarations:tools}];
 let model=modelName();
 let {res,data}=await postGemini(key,model,body);
 const canRetry=r=>r&&(r.status===429||r.status===404||(r.status===400&&/no longer available|not found|not supported|deprecated|unknown model/i.test(String(data?.error?.message||''))));
 if(!res.ok&&canRetry(res)&&!process.env.GEMINI_MODEL){
  const tried=new Set([model]);
  const msg=String(data?.error?.message||'');
  const hint=/use\s+(?:models\/)?([a-zA-Z0-9._-]+)/i.exec(msg)?.[1];
  const candidates=[];
  if(hint&&!tried.has(hint))candidates.push(hint);
  for(const c of await discoverModels(key,tried))if(!candidates.includes(c))candidates.push(c);
  for(const next of candidates.slice(0,5)){
   tried.add(next);
   const retry=await postGemini(key,next,body);
   res=retry.res;data=retry.data;
   if(res.ok){resolvedModel=next;model=next;break}
   if(res.status===401||res.status===403)break;
  }
 }
 if(!res.ok){
  const msg=String(data?.error?.message||'');
  console.error('gemini',model,res.status,msg.slice(0,300));
  if(res.status===429){
   if(/limit:\s*0\b/i.test(msg))throw O.bad("Bu Google API kalitida bepul AI limiti 0 ga teng (Google AI Studio da yangi loyiha yoki Billing kerak). "+msg.slice(0,90));
   throw O.bad("AI vaqtincha band (limitga yetdi). 1 daqiqadan keyin qayta urinib ko'ring.");
  }
  if(res.status===400||res.status===401||res.status===403){
   if(/api.?key|permission|invalid/i.test(msg))throw O.bad("Gemini API kaliti noto'g'ri yoki ruxsatsiz. Railway Variables dagi GEMINI_API_KEY ni tekshiring.");
  }
  throw O.bad('AI xatosi: '+(msg.slice(0,120)||`HTTP ${res.status}`));
 }
 const parts=data?.candidates?.[0]?.content?.parts||[];
 const text=parts.filter(p=>typeof p.text==='string').map(p=>p.text).join('\n').trim();
 const calls=parts.filter(p=>p.functionCall).map(p=>p.functionCall);
 return{parts,text,calls};
}

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
  description:"Savdo statistikasi, tushum, buyurtmalar soni, top kategoriyalar va eng ko'p sotilgan mahsulotlarni olish. from/to bo'sh bo'lsa oxirgi davr.",
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
 if(!canAi(user))throw O.bad("AI ruxsati yo'q");
 const rec=pendingMap.get(String(actionId||''));
 if(!rec||rec.actorId!==String(user.tg_id))throw O.bad('Tasdiqlash soʻrovi topilmadi yoki muddati tugagan');
 if(Date.now()-rec.at>PEND_TTL){pendingMap.delete(rec.id);throw O.bad('Muddati tugagan, qaytadan soʻrang')}
 pendingMap.delete(rec.id);
 const results=[];
 for(const a of rec.actions){
  results.push(await execAdminAction(user,a));
 }
 return{ok:true,results,message:results.join('\n')};
};

async function chatAdmin(user,{text='',audioBase64='',audioMime=''}){
 if(!canAi(user))throw O.bad("AI yordamchidan foydalanish uchun Super Admin ruxsati kerak");
 const qk=checkQuota(user,200);
 if(!qk.ok)throw O.bad('Bugungi AI limiti tugadi.');
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

 const contents=[...getTurns(user.tg_id),{role:'user',parts:userParts}];

 for(let step=0;step<5;step++){
  const res=await callGemini({system,contents,tools:ADMIN_TOOLS});
  if(!res.calls.length){
   const reply=res.text||'Tayyor.';
   pushTurn(user.tg_id,cleanTxt||'[Ovozli xabar]',reply);
   return{reply,pending:null};
  }
  const writeCalls=res.calls.filter(c=>ADMIN_WRITE_TOOLS.has(c.name));
  const readCalls=res.calls.filter(c=>!ADMIN_WRITE_TOOLS.has(c.name));

  if(writeCalls.length){
   const prepared=[],lines=[],errors=[];
   for(const c of writeCalls){
    const pr=await prepareAdminWrite(user,c.name,c.args||{});
    if(pr.error)errors.push({name:c.name,error:pr.error});
    else{prepared.push(pr.action);lines.push(pr.line)}
   }
   if(errors.length&&!prepared.length){
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
   pushTurn(user.tg_id,cleanTxt||'[Ovozli xabar]',`${reply}\n${summary}`);
   return{reply,pending:{id:rec.id,summary:rec.summary,details:rec.details}};
  }

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
