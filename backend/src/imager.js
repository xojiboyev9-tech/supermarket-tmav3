/* Studio White-Background HD Product Image Finder for TEGEN Market
   1. Translates generic Uzbek grocery names ("Olma" -> "Яблоко свежее фрукт на белом фоне") so foreign names like "OLMA Messe" never match.
   2. Searches with "на белом фоне" / supermarket catalog priority (Ozon, X5, Lenta, Vprok, Magnit, Korzinka, Freepik white background).
   3. Upgrades Bing CDN thumbnails to 800x800 HD (&w=800&h=800&c=7&r=0&o=5) so images are crisp and never crop the product box.
   4. Supports replaceAuto=true to clean up previously auto-assigned low-res / non-white-bg images and fill all remaining missing products. */
const {q,audit}=require('./db');

const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
const STOP=new Set([
 'вес','весовой','весовые','весовая','гр','г','кг','мл','л','шт','уп','пак','пакет','бут','ст','жб','пэт','дой',
 'для','из','со','во','на','по','от','до','без','или','при','под','над','вкусом','вкус','ароматом',
 'купить','цена','оптом','доставка','ташкент','узбекистан','москва','фото','отзывы','интернет','магазин',
 'белом','фоне','свежий','свежее','свежая','свежие','продукт','товар',
 'the','and','with','for','pack','new','fresh','original','classic','extra','plus','super','gold','premium'
]);

/* Uzbek -> Russian exact grocery map so Uzbek-named products ("Olma", "Sabzi", "Piyoz", "Pechenye"...) search Russian grocery catalogs accurately */
const UZ_TO_RU=[
 [/\bolma\b/gi,'яблоко свежее фрукт'],
 [/\bbanan\b/gi,'банан свежий фрукт'],
 [/\bnok\b/gi,'груша свежая фрукт'],
 [/\buzum\b/gi,'виноград свежий'],
 [/\banor\b/gi,'гранат свежий фрукт'],
 [/\bshaftoli\b/gi,'персик свежий фрукт'],
 [/\bo'rik\b|\borik\b/gi,'абрикос свежий'],
 [/\bolxo'ri\b|\bolxori\b/gi,'слива свежая'],
 [/\bqulupnay\b/gi,'клубника свежая'],
 [/\bgilos\b/gi,'черешня свежая'],
 [/\bolcha\b/gi,'вишня свежая'],
 [/\btarvuz\b/gi,'арбуз свежий'],
 [/\bqovun\b/gi,'дыня свежая'],
 [/\bxurmo\b/gi,'хурма свежая'],
 [/\blimon\b/gi,'лимон свежий'],
 [/\bmandarin\b/gi,'мандарин свежий'],
 [/\bapelsin\b/gi,'апельсин свежий'],
 [/\bkivi\b/gi,'киви свежий фрукт'],
 [/\bananas\b/gi,'ананас свежий'],
 [/\bkartoshka\b/gi,'картофель свежий овощ'],
 [/\bpiyoz\b/gi,'лук репчатый свежий'],
 [/\bsabzi\b/gi,'морковь свежая'],
 [/\bpomidor\b/gi,'помидоры томаты свежие'],
 [/\bbodring\b/gi,'огурцы свежие'],
 [/\bkaram\b/gi,'капуста белокочанная свежая'],
 [/\bsarimsoq\b/gi,'чеснок свежий'],
 [/\blavlagi\b/gi,'свекла свежая'],
 [/\bturp\b/gi,'редька свежая'],
 [/\bbaqlajon\b/gi,'баклажан свежий'],
 [/\bqalampir\b/gi,'перец болгарский свежий'],
 [/\bqovoq\b/gi,'тыква свежая'],
 [/\bko'kat\b|\bukrop\b/gi,'зелень укроп свежий пучок'],
 [/\bkashnich\b/gi,'зелень кинза свежая пучок'],
 [/\byong'oq\b/gi,'грецкий орех очищенный'],
 [/\bbodom\b/gi,'миндаль орех'],
 [/\bpista\b/gi,'фисташки орехи'],
 [/\bmayiz\b/gi,'изюм сухофрукты'],
 [/\bturshak\b/gi,'курага сухофрукты'],
 [/\bnon\b|\bbuxanka\b/gi,'хлеб пшеничный буханка'],
 [/\bpatir\b/gi,'лепешка узбекская тандырная'],
 [/\blavash\b/gi,'лаваш армянский'],
 [/\bbulochka\b/gi,'булочка сдобная выпечка'],
 [/\bpishiriq\b/gi,'выпечка булочка'],
 [/\bsuxarik\b/gi,'сухарики пшеничные'],
 [/\bsut\b/gi,'молоко питьевое упаковка'],
 [/\bqaymoq\b/gi,'сливки каймак молочный'],
 [/\bsaryog'\b|\bsaryog\b/gi,'масло сливочное пачка'],
 [/\btuxum\b/gi,'яйцо куриное десяток'],
 [/\bpishloq\b/gi,'сыр твердый кусок'],
 [/\bbrinza\b/gi,'сыр брынза рассольный'],
 [/\btvorog\b/gi,'творог молочный'],
 [/\bsmetana\b/gi,'сметана молочная стакан'],
 [/\bkefir\b/gi,'кефир молочный'],
 [/\byogurt\b/gi,'йогурт молочный стакан'],
 [/\bsirok\b/gi,'сырок творожный глазированный'],
 [/\bgo'sht\b|\bmol\s+go'shti\b/gi,'говядина свежее мясо'],
 [/\bqo'y\s+go'shti\b/gi,'баранина свежее мясо'],
 [/\bqiyma\b/gi,'фарш мясной говяжий'],
 [/\btovuq\b/gi,'курица тушка мясо птицы'],
 [/\bkolbasa\b/gi,'колбаса мясная батон'],
 [/\bsosiska\b/gi,'сосиски молочные мясные'],
 [/\bbaliq\b/gi,'рыба свежая филе'],
 [/\bchuchvara\b/gi,'пельмени замороженные пачка'],
 [/\bmanti\b/gi,'манты замороженные'],
 [/\bmuzqaymoq\b/gi,'мороженое пломбир'],
 [/\bshakar\b/gi,'сахар белый песок упаковка'],
 [/\btuz\b/gi,'соль пищевая пачка'],
 [/\bun\b/gi,'мука пшеничная высший сорт пачка'],
 [/\bguruch\b/gi,'рис крупа упаковка'],
 [/\bgrechka\b/gi,'гречка крупа гречневая пачка'],
 [/\bmakaron\b/gi,'макароны пачка'],
 [/\bkungaboqar\s+yog'i\b|\byog'\b/gi,'масло подсолнечное бутылка'],
 [/\bpechenye\b/gi,'печенье'],
 [/\bvafli\b/gi,'вафли'],
 [/\bshokolad\b/gi,'шоколад плитка'],
 [/\bkonfet\b/gi,'конфеты шоколадные'],
 [/\bsaqich\b/gi,'жевательная резинка'],
 [/\bchoy\b/gi,'чай пачка'],
 [/\bqahva\b/gi,'кофе банка'],
 [/\bsuv\b/gi,'вода питьевая бутылка'],
 [/\bsharbat\b/gi,'сок фруктовый тетрапак'],
 [/\bsovun\b/gi,'мыло туалетное кусок'],
 [/\bshampun\b/gi,'шампунь для волос флакон'],
 [/\btish\s+pastasi\b/gi,'зубная паста тюбик']
];

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* Convert any Uzbek words in a product name to Russian grocery terms and clean POS suffixes */
function buildSearchQueries(prod){
 const rawName=String(prod.name||prod.name_uz||'').trim();
 let s=rawName
  .replace(/(?:^|[^А-Яа-яЁёA-Za-z0-9])(вес(ов(ой|ые|ая))?|шт\.?|уп\.?|кор\.?|бл\.?|пак\.?|бут\.?|бан\.?|ст\.?|пэт|ж\/б|ст\/б|п\/э|м\/у|т\/п|п\/к|в\/к|с\/к|в\/с|1с|2с)(?![А-Яа-яЁёA-Za-z0-9])/gi,' ')
  .replace(/[()[\]{}"'«»*#№_/+]/g,' ')
  .replace(/\s+/g,' ')
  .trim();
 for(const [rx,ru] of UZ_TO_RU)s=s.replace(rx,ru);
 s=s.replace(/\s+/g,' ').trim();
 if(!s)return [];

 // Strip standalone dimensions/weights for the broader fallback query
 const noWeights=s
  .replace(/(?:^|\s)\d+(?:[.,]\d+)?\s*(?:гр|г|кг|мл|л|шт|%|см|мм)\.?/gi,' ')
  .replace(/\s+/g,' ')
  .trim();

 const words=(noWeights||s).split(/\s+/).filter(w=>w.length>=2);
 const queries=[];
 // 1. Full cleaned name + white background
 queries.push(`${s} упаковка на белом фоне`);
 // 2. Full cleaned name
 queries.push(s);
 // 3. Core 2-3 words (brand + product) + white background
 if(words.length>=2)queries.push(`${words.slice(0,Math.min(3,words.length)).join(' ')} на белом фоне`);
 if(words.length>=2)queries.push(`${words.slice(0,2).join(' ')} продукт на белом фоне`);
 // 4. First main word + category context on white background
 if(words.length>=1&&prod.category&&prod.category!=='Boshqa'){
  let catRu=prod.category;
  for(const [rx,ru] of UZ_TO_RU)catRu=catRu.replace(rx,ru);
  queries.push(`${words[0]} ${catRu} на белом фоне`);
 }
 return [...new Set(queries)];
}

/* Extract distinctive tokens (Russian & Latin words >= 3 chars) from both original and translated name */
function getTokens(str){
 let expanded=String(str||'');
 for(const [rx,ru] of UZ_TO_RU)expanded=expanded.replace(rx,ru);
 expanded=String(str||'')+' '+expanded;
 const raw=expanded.toLowerCase()
  .replace(/ё/g,'е')
  .replace(/\b\d+(?:[.,]\d+)?\s*(?:гр|г|кг|мл|л|шт|%|см|мм)\b/gi,' ')
  .split(/[^а-яa-z0-9]+/i)
  .filter(w=>w.length>=3&&!STOP.has(w)&&!/^\d+$/.test(w));
 return [...new Set(raw)];
}

/* Upgrade Bing thumbnail URL to 800x800 high-resolution product image */
function toHdBingUrl(turl){
 if(!turl||!turl.includes('bing.net/th'))return turl;
 const clean=turl.replace(/&amp;/g,'&');
 const m=/OIP\.[A-Za-z0-9_-]+/.exec(clean);
 if(!m)return clean;
 return `https://tse1.mm.bing.net/th?id=${m[0]}&w=800&h=800&c=7&r=0&o=5&pid=1.7`;
}

/* Score candidate image:
   - Rejects non-Russian/non-grocery pages, street photos, people, recipes, videos
   - Rewards white-background studio & supermarket catalog photos (Ozon, X5, Lenta, Vprok, Freepik white bg) */
function scoreCandidate(prod,cand){
 const pTokens=getTokens(prod.name);
 if(!pTokens.length)return 0;
 const title=String(cand.title||'').toLowerCase().replace(/ё/g,'е');
 const murl=String(cand.murl||'').toLowerCase();
 if(!title)return 0;

 // Reject non-grocery / crowd / event / video / recipe / meme results
 if(/(youtube|tiktok|football|nfl|soccer|meme|wallpaper|обои|новости|википедия|wikipedia|рецепт|как\s+приготовить|messe|ausfahrt|plaza|festival|crowd|people|street|building|чертеж|схема|карта|вектор|иллюстрац|клипарт|рисунок|иконк|мульт|vector|illustration|clipart|cartoon|drawing|sketch|icon)/i.test(title+' '+murl))return -100;

 // If product query is Russian/Uzbek grocery, require at least some Cyrillic in the result title (blocks German "OLMA Messe" etc.)
 if(!/[а-я]/i.test(title)&&!/\b(ozon|wildberries|korzinka|uzum|makro|arbuz)\b/i.test(murl))return -50;

 let matched=0,coreMatched=false;
 for(let i=0;i<pTokens.length;i++){
  const tk=pTokens[i];
  const stem=tk.length>=6?tk.slice(0,5):(tk.length>=4?tk.slice(0,4):tk);
  if(title.includes(stem)){
   matched++;
   if(i<=2)coreMatched=true;
  }
 }
 if(!matched)return 0;

 let score=Math.min(100,Math.round((matched/Math.min(pTokens.length,3))*90))+(coreMatched?15:0);

 // Strong bonus for white-background & studio e-commerce catalogs
 if(/(на\s+белом\s+фоне|white[\s_-]*background|isolated)/i.test(title+' '+murl))score+=45;
 if(/(ozone\.ru|ozon\.ru|wb\.ru|wildberries|x5static|lenta\.com|magnit|vprok|perekrestok|korzinka|uzum|arbuz|makro|sbermegamarket|sbermarket|kuper|utkonos|auchan|metro-cc|freepik\.com|vecteezy)/i.test(murl))score+=40;

 // Penalize hand-held / review / social media photos (irecommend, otzovik, avito, youla)
 if(/(irecommend|otzovik|avito\.|youla\.|pikabu|vk\.com|ok\.ru|instagram|livejournal|dzen\.ru)/i.test(murl+' '+title))score-=45;

 // Prefer square or clean studio aspect ratios
 if(cand.width&&cand.height){
  const ar=cand.width/cand.height;
  if(ar>=0.75&&ar<=1.35)score+=20;
 }
 return score;
}

/* 1. Barcode lookup via OpenFoodFacts / OpenBeautyFacts / OpenProductsFacts & UPCItemDB */
async function lookupByBarcode(barcode){
 const bc=String(barcode||'').replace(/\D/g,'');
 if(bc.length<8||bc.length>14||/^2\d{12}$/.test(bc))return [];
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
    if(img)out.push({url:img,thumb:img,title:j.product.product_name_ru||j.product.product_name||bc,source:'barcode',score:190});
   }
  }catch{}
  if(out.length)return out;
 }
 return out;
}

/* 2. Bing Images search (cc=ru&setlang=ru) with white-background filter support */
async function searchBing(query,whiteOnly=false){
 try{
  const qft=whiteOnly?'&qft=+filterui:color2-FGcls_WHITE':'';
  const r=await fetch(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&cc=ru&setlang=ru${qft}&first=1`,{
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
     const hdThumb=toHdBingUrl(j.turl);
     out.push({
      title:String(j.t||'').replace(/[\uE000-\uF8FF]/g,''),
      murl:j.murl||hdThumb,
      turl:hdThumb||j.murl
     });
    }
   }catch{}
   if(out.length>=18)break;
  }
  return out;
 }catch{return []}
}

/* 3. DuckDuckGo Images search (ru-ru) — warms Bing cache and returns width/height metadata */
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
  return (j.results||[]).slice(0,18).map(x=>({
   title:x.title||'',
   murl:x.image||toHdBingUrl(x.thumbnail),
   turl:toHdBingUrl(x.thumbnail)||x.image,
   width:x.width,
   height:x.height
  }));
 }catch{return []}
}

/* Find the top verified HD white-background candidate images for a single product */
async function findProductImages(prod){
 const cands=[];
 if(prod.barcode){
  const bcHits=await lookupByBarcode(prod.barcode);
  for(const h of bcHits)cands.push(h);
 }
 const queries=buildSearchQueries(prod);
 for(const qStr of queries){
  let raw=await searchBing(qStr,true);
  if(!raw.length)raw=await searchBing(qStr,false);
  if(!raw.length)raw=await searchDdg(qStr);
  for(const item of raw){
   const sc=scoreCandidate(prod,item);
   if(sc>=45){
    const bestUrl=toHdBingUrl(item.turl)||item.murl;
    if(bestUrl&&bestUrl.startsWith('https://')){
     cands.push({url:bestUrl,fullUrl:item.murl,thumb:bestUrl,title:item.title,score:sc,source:'web'});
    }
   }
  }
  // If we already found a high-confidence white-background studio shot (score >= 95), no need to run fallback queries
  if(cands.some(c=>c.score>=95))break;
 }
 cands.sort((a,b)=>b.score-a.score);
 const seen=new Set(),uniq=[];
 for(const c of cands){
  if(seen.has(c.url))continue;
  seen.add(c.url);
  uniq.push(c);
  if(uniq.length>=8)break;
 }
 return uniq;
}

/* Background batch job state */
let job={
 running:false,
 stopRequested:false,
 scope:'active',
 replaceAuto:false,
 total:0,
 done:0,
 found:0,
 skipped:0,
 currentName:'',
 startedAt:null,
 finishedAt:null,
 recent:[]
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
 const scope=opts.scope==='all'?'all':'active';
 const replaceAuto=opts.replaceAuto===true;
 // If replaceAuto is true, also re-fetch any product whose current image is an auto-fetched Bing/external URL (not an uploaded /api/images/ photo)
 const imgCond=replaceAuto
  ?"(image is null or image='' or image like 'https://%bing.net/%' or image like 'https://%ozone.ru/%')"
  :"(image is null or image='')";
 const cond=scope==='all'
  ?imgCond
  :`(active or needs_setup) and ${imgCond}`;
 const rows=(await q(`select id,name,name_uz,barcode,category,image from products where ${cond} order by (image is null or image='') desc,active desc,coalesce(priority,3) asc,coalesce(sales_count,0) desc,id asc`)).rows;

 job={
  running:true,
  stopRequested:false,
  scope,
  replaceAuto,
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
   const CONC=3;
   let idx=0;
   const worker=async()=>{
    while(idx<rows.length&&!job.stopRequested){
     const p=rows[idx++];
     job.currentName=p.name;
     try{
      const imgs=await findProductImages(p);
      const best=imgs[0];
      if(best&&best.score>=40){
       await q('update products set image=$1 where id=$2',[best.url,p.id]);
       job.found++;
       job.recent=[{id:p.id,name:p.name,image:best.url,title:best.title},...job.recent.slice(0,11)];
       if(job.found%3===0&&opts.onUpdate)opts.onUpdate();
      }else{
       if(replaceAuto&&p.image&&p.image.startsWith('https://'))await q('update products set image=null where id=$1',[p.id]);
       job.skipped++;
      }
     }catch{
      job.skipped++;
     }
     job.done++;
     await sleep(450);
    }
   };
   await Promise.all(Array.from({length:CONC},()=>worker()));
  }finally{
   job.running=false;
   job.currentName='';
   job.finishedAt=new Date().toISOString();
   if(opts.onUpdate)opts.onUpdate();
   await audit(actorId||0,'products.auto_images','products',{scope,replaceAuto,total:job.total,done:job.done,found:job.found,skipped:job.skipped}).catch(()=>{});
  }
 })();

 return getJobStatus();
}

module.exports={findProductImages,startBatchJob,getJobStatus,stopJob};
