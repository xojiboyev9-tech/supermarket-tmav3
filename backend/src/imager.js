/* Exact Product Image Finder for TEGEN Market
   Finds a product's own real photo from the internet using:
   1. Barcode lookup on OpenFoodFacts / OpenBeautyFacts / OpenProductsFacts & UPCItemDB
   2. Exact product name search on DuckDuckGo Images (ru-ru) + Bing Images (cc=ru)
   3. Strict token verification: image title MUST share the product's core brand/type words,
      rejecting generic or unrelated results so every product gets ONLY its own photo. */
const {q,audit}=require('./db');

const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
const STOP=new Set([
 'вес','весовой','весовые','весовая','гр','г','кг','мл','л','шт','уп','пак','пакет','бут','ст','жб','пэт','дой',
 'для','из','со','во','на','по','от','до','без','или','при','под','над','вкусом','вкус','ароматом',
 'купить','цена','оптом','доставка','ташкент','узбекистан','москва','фото','отзывы','интернет','магазин',
 'the','and','with','for','pack','new','fresh','original','classic','extra','plus','super','gold','premium'
]);

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* Clean product name into a search query (removes POS codes, trailing "вес", excess punctuation) */
function cleanQuery(name){
 let s=String(name||'')
  .replace(/\b(вес(ов(ой|ые|ая))?|шт\.?|уп\.?)\b/gi,' ')
  .replace(/\b(п\/к|в\/к|с\/к|в\/с|1с|2с|ж\/б|ст\/б|пэт)\b/gi,' ')
  .replace(/[()[\]{}"'«»*#№]/g,' ')
  .replace(/\s+/g,' ')
  .trim();
 return s;
}

/* Extract distinctive tokens (letters/numbers >= 3 chars, excluding unit/stop words) */
function getTokens(str){
 const raw=String(str||'').toLowerCase()
  .replace(/ё/g,'е')
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:гр|г|кг|мл|л|шт|%|см|мм)\b/gi,' ')
  .split(/[^а-яa-z0-9]+/i)
  .filter(w=>w.length>=3&&!STOP.has(w)&&!/^\d+$/.test(w));
 return [...new Set(raw)];
}

/* Does candidate title match product tokens? Uses stem prefix (first 4-5 letters) for Russian inflections. */
function scoreCandidate(prodName,cand){
 const pTokens=getTokens(prodName);
 if(!pTokens.length)return 0;
 const title=String(cand.title||'').toLowerCase().replace(/ё/g,'е');
 if(!title)return 0;

 // Reject obvious non-product pages (memes, news, sports, wallpapers, youtube videos)
 if(/\b(youtube|tiktok|football|nfl|soccer|meme|wallpaper|обои|новости|википедия|wikipedia|рецепт|как\s+приготовить)\b/i.test(title))return -10;

 let matched=0,firstMatched=false;
 for(let i=0;i<pTokens.length;i++){
  const tk=pTokens[i];
  const stem=tk.length>=6?tk.slice(0,5):(tk.length>=4?tk.slice(0,4):tk);
  if(title.includes(stem)){
   matched++;
   if(i===0||i===1)firstMatched=true;
  }
 }
 if(!matched)return 0;
 const ratio=matched/Math.min(pTokens.length,4);
 // Require at least 1 strong match if 1-2 tokens, or >= 50% if 3+ tokens
 if(pTokens.length>=3&&matched<2)return 0;
 if(!firstMatched&&matched<2)return 0;

 let score=ratio*100;
 // Prefer square / grocery catalog images (Ozon, Wildberries, Korzinka, Makro, X5, Magnit, Lenta, etc.)
 const u=String(cand.murl||cand.image||'').toLowerCase();
 if(/(ozone\.ru|ozon\.ru|wb\.ru|wildberries|x5static|lenta\.com|magnit|vprok|perekrestok|korzinka|uzum|arbuz|makro|sbermarket|kuper|utkonos|auchan|metro-cc|goods|products|catalog)/i.test(u))score+=25;
 if(cand.width&&cand.height){
  const ar=cand.width/cand.height;
  if(ar>=0.65&&ar<=1.45)score+=15;
 }
 return Math.round(score);
}

/* 1. Barcode lookup via OpenFoodFacts / OpenBeautyFacts / OpenProductsFacts & UPCItemDB */
async function lookupByBarcode(barcode){
 const bc=String(barcode||'').replace(/\D/g,'');
 if(bc.length<8||bc.length>14||/^2\d{12}$/.test(bc))return []; // skip internal 2000... weight barcodes
 const out=[];
 for(const host of ['world.openfoodfacts.org','world.openbeautyfacts.org','world.openproductsfacts.org']){
  try{
   const r=await fetch(`https://${host}/api/v2/product/${bc}?fields=product_name,product_name_ru,image_front_url,image_url`,{
    headers:{'User-Agent':'TegenMarket/1.0 (https://t.me/tegen_market)'},
    signal:AbortSignal.timeout(3500)
   });
   if(r.ok){
    const j=await r.json();
    const img=j?.product?.image_front_url||j?.product?.image_url;
    if(img)out.push({url:img,thumb:img,title:j.product.product_name_ru||j.product.product_name||bc,source:'barcode',score:180});
   }
  }catch{}
  if(out.length)return out;
 }
 try{
  const r=await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${bc}`,{
   headers:{'User-Agent':UA},
   signal:AbortSignal.timeout(3500)
  });
  if(r.ok){
   const j=await r.json();
   const it=j?.items?.[0];
   if(it?.images?.[0])out.push({url:it.images[0],thumb:it.images[0],title:it.title||bc,source:'upc',score:160});
  }
 }catch{}
 return out;
}

/* 2. Bing Images search (cc=ru&setlang=ru) */
async function searchBing(query){
 try{
  const r=await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&cc=ru&setlang=ru&first=1`,{
   headers:{'User-Agent':UA,'Accept-Language':'ru-RU,ru;q=0.9'},
   signal:AbortSignal.timeout(5500)
  });
  if(!r.ok)return [];
  const h=await r.text();
  const out=[];
  for(const m of h.matchAll(/m="(\{[^"]+murl[^"]+\})"/g)){
   try{
    const j=JSON.parse(m[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&'));
    if(j.murl||j.turl){
     const cleanTurl=j.turl?j.turl.replace(/&amp;/g,'&'):'';
     out.push({
      title:String(j.t||'').replace(/[\uE000-\uF8FF]/g,''),
      murl:j.murl||cleanTurl,
      turl:cleanTurl||j.murl
     });
    }
   }catch{}
   if(out.length>=15)break;
  }
  return out;
 }catch{return []}
}

/* 3. DuckDuckGo Images search (ru-ru) — also warms Bing's edge cache */
async function searchDdg(query){
 try{
  const r1=await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,{
   headers:{'User-Agent':UA,'Accept-Language':'ru-RU,ru;q=0.9'},
   signal:AbortSignal.timeout(5000)
  });
  if(!r1.ok)return [];
  const h1=await r1.text();
  const vqd=(/vqd=([\d-]+)/.exec(h1)||/vqd="([\d-]+)"/.exec(h1)||/vqd='([\d-]+)'/.exec(h1)||[])[1];
  if(!vqd)return [];
  const r2=await fetch(`https://duckduckgo.com/i.js?l=ru-ru&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`,{
   headers:{'User-Agent':UA,'Referer':'https://duckduckgo.com/','Accept-Language':'ru-RU,ru;q=0.9'},
   signal:AbortSignal.timeout(5500)
  });
  const txt=await r2.text();
  if(!txt.startsWith('{'))return [];
  const j=JSON.parse(txt);
  return (j.results||[]).slice(0,15).map(x=>({
   title:x.title||'',
   murl:x.image||x.thumbnail,
   turl:x.thumbnail||x.image,
   width:x.width,
   height:x.height
  }));
 }catch{return []}
}

/* Find the top verified candidate images for a single product {id, name, name_uz, barcode} */
async function findProductImages(prod){
 const cands=[];
 // A) Try barcode first
 if(prod.barcode){
  const bcHits=await lookupByBarcode(prod.barcode);
  for(const h of bcHits)cands.push(h);
 }
 const q1=cleanQuery(prod.name);
 if(q1){
  // B) Try Bing Images first (fast if cached)
  let raw=await searchBing(q1);
  // C) If Bing cache missed, query DuckDuckGo Images
  if(!raw.length)raw=await searchDdg(q1);
  // D) If still empty and query has >3 words, try shorter core query (first 3 words)
  const words=q1.split(/\s+/);
  if(!raw.length&&words.length>3){
   const qShort=words.slice(0,3).join(' ');
   raw=await searchBing(qShort);
   if(!raw.length)raw=await searchDdg(qShort);
  }
  for(const item of raw){
   const sc=scoreCandidate(prod.name,item);
   if(sc>0){
    // Use high-reliability Bing CDN thumbnail (turl) or direct HTTPS image
    const bestUrl=(item.turl&&item.turl.startsWith('https://'))?item.turl:item.murl;
    if(bestUrl&&bestUrl.startsWith('https://')){
     cands.push({url:bestUrl,fullUrl:item.murl,thumb:item.turl||item.murl,title:item.title,score:sc,source:'web'});
    }
   }
  }
 }
 cands.sort((a,b)=>b.score-a.score);
 // Deduplicate by URL
 const seen=new Set(),uniq=[];
 for(const c of cands){
  if(seen.has(c.url))continue;
  seen.add(c.url);
  uniq.push(c);
  if(uniq.length>=8)break;
 }
 return uniq;
}

/* Background batch job state so admin can watch progress live and stop/resume anytime */
let job={
 running:false,
 stopRequested:false,
 scope:'active',
 total:0,
 done:0,
 found:0,
 skipped:0,
 currentName:'',
 startedAt:null,
 finishedAt:null,
 recent:[] // [{id,name,image}]
};

function getJobStatus(){
 return {...job};
}

function stopJob(){
 if(job.running){job.stopRequested=true;return true}
 return false;
}

async function startBatchJob(actorId,opts={}){
 if(job.running)return getJobStatus();
 const scope=opts.scope==='all'?'all':'active'; // 'active' = active + needs_setup without image; 'all' = all without image
 const cond=scope==='all'
  ?"(image is null or image='')"
  :"(active or needs_setup) and (image is null or image='')";
 const rows=(await q(`select id,name,name_uz,barcode,category from products where ${cond} order by active desc,coalesce(priority,3) asc,coalesce(sales_count,0) desc,id asc`)).rows;

 job={
  running:true,
  stopRequested:false,
  scope,
  total:rows.length,
  done:0,
  found:0,
  skipped:0,
  currentName:'',
  startedAt:new Date().toISOString(),
  finishedAt:null,
  recent:[]
 };

 (async()=>{
  try{
   for(const p of rows){
    if(job.stopRequested)break;
    job.currentName=p.name;
    try{
     const imgs=await findProductImages(p);
     const best=imgs[0];
     if(best&&best.score>=45){
      await q('update products set image=$1 where id=$2 and (image is null or image=\'\')',[best.url,p.id]);
      job.found++;
      job.recent=[{id:p.id,name:p.name,image:best.url,title:best.title},...job.recent.slice(0,11)];
      if(opts.onUpdate)opts.onUpdate();
     }else{
      job.skipped++;
     }
    }catch{
     job.skipped++;
    }
    job.done++;
    // Polite 2.2s pacing so search engines never rate-limit
    await sleep(2200);
   }
  }finally{
   job.running=false;
   job.currentName='';
   job.finishedAt=new Date().toISOString();
   if(opts.onUpdate)opts.onUpdate();
   await audit(actorId||0,'products.auto_images','products',{scope,total:job.total,done:job.done,found:job.found,skipped:job.skipped}).catch(()=>{});
  }
 })();

 return getJobStatus();
}

module.exports={findProductImages,startBatchJob,getJobStatus,stopJob};
