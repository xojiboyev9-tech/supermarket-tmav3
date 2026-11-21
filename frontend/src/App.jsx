// JOYI: frontend/src/App.jsx
// JOYI: frontend/src/App.jsx  (GitHub'da shu yo'l bilan yarating)
import {useState,useEffect,useCallback} from 'react'
const API=import.meta.env.PROD?'':(import.meta.env.VITE_API_URL||'http://localhost:8080')
const tg=window.Telegram?.WebApp
async function api(p,method='GET',body){
  const r=await fetch(API+p,{method,headers:{'Content-Type':'application/json','X-Init-Data':tg?.initData||''},body:body?JSON.stringify(body):undefined})
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Xato');return j}
const RU={"Do'kon": "Магазин", "Savat": "Корзина", "Buyurtma": "Заказы", "Boshqaruv": "Управление", "Hammasi": "Все", "Taom mahsulotlari": "Продукты питания", "Ichimliklar": "Напитки", "Sut mahsulotlari": "Молочные продукты", "Non mahsulotlari": "Хлебобулочные", "Go'sht va kolbasa": "Мясо и колбасы", "Meva-sabzavot": "Фрукты и овощи", "Hech narsa topilmadi": "Ничего не найдено", "Tugagan": "Нет в наличии", "Savatga": "В корзину", "O'chirish": "Удалить", "🛒 Savat bo'sh": "🛒 Корзина пуста", "🏃 Olib ketish": "🏃 Самовывоз", "🚚 Yetkazib berish": "🚚 Доставка", "Mahsulotlar": "Товары", "Yetkazib berish": "Доставка", "Jami": "Итого", "Buyurtma berish": "Оформить заказ", "Buyurtmalarim": "Мои заказы", "Buyurtmalar yo'q": "Заказов нет", "Roziman": "Согласен", "Bekor qilish": "Отменить", "Olib ketish kodi": "Код получения", "Yangi": "Новый", "Qabul qilindi": "Принят", "Tasdiq kutilmoqda": "Ждёт подтверждения", "Yig'ilmoqda": "Собирается", "Tayyor": "Готов", "Yakunlandi": "Завершён", "Bekor qilingan": "Отменён", "Statistika": "Статистика", "Buyurtmalar": "Заказы", "Tovarlar": "Товары", "Sozlamalar": "Настройки", "Audit": "Аудит", "Jami tushum": "Выручка", "Mijozlar": "Клиенты", "Saqlash": "Сохранить", "Qabul": "Принять", "Bekor": "Отмена", "Yuklanmoqda…": "Загрузка…", "🔍 Mahsulot qidirish": "🔍 Поиск товаров", "Nomi": "Название", "Narx (dona yoki kg uchun)": "Цена (за шт. или кг)", "Manzil (ko'cha, uy, mo'ljal)": "Адрес (улица, дом, ориентир)"}
Object.assign(RU,{"Yangiliklar": "Новости", "Naborlar": "Наборы", "Faol": "Активен", "Nofaol": "Скрыт", "Kontent": "Контент", "Bugun": "Сегодня", "7 kun": "7 дней", "30 kun": "30 дней", "Yil": "Год", "Sana": "Даты", "Yana": "Ещё", "Yosh tasdig'i kutilmoqda": "Ждёт подтверждения возраста", "🔞 Yosh tasdig'i botda so'raladi.": "🔞 Подтверждение возраста запросит бот.", "Boshqa": "Другое", "Shirinliklar": "Сладости", "Bakaleya": "Бакалея", "Maishiy kimyo": "Бытовая химия", "Bannerlar": "Баннеры", "Videolar": "Видео"})
const LANG=(()=>{try{return localStorage.getItem('lang')||(tg?.initDataUnsafe?.user?.language_code==='ru'?'ru':'uz')}catch{return 'uz'}})()
const t=s=>LANG==='ru'&&RU[s]||s
const so=n=>Number(n||0).toLocaleString('ru-RU')+" so'm"
const ST={new:['Yangi','blue'],accepted:['Qabul qilindi','indigo'],awaiting_confirm:['Tasdiq kutilmoqda','amber'],age_check:["Yosh tasdig'i kutilmoqda",'amber'],preparing:["Yig'ilmoqda",'amber'],ready:['Tayyor','green'],completed:['Yakunlandi','gray'],cancelled:['Bekor qilingan','red']}
const NEXT={new:[['accepted','Qabul']],accepted:[['preparing',"Yig'ish"]],preparing:[['ready','Tayyor']],ready:[['completed','Topshirildi']]}
const Badge=({s})=><span className={'badge '+ST[s][1]}>{t(ST[s][0])}</span>

function WeightSheet({p,cur,close,set}){
  const [v,setV]=useState(cur||20000)
  return <div className="sheet" onClick={close}><div onClick={e=>e.stopPropagation()}>
    <h2>{p.name} — {so(p.price)} / kg</h2>
    <div className="gap" style={{marginBottom:10}}>{[10000,20000,50000,100000].map(x=><button key={x} className={'chip'+(v===x?' on':'')} onClick={()=>setV(x)}>{so(x)}</button>)}</div>
    <input className="in" type="text" inputMode="numeric" value={v||''} onChange={e=>setV(Number(e.target.value.replace(/\D/g,''))||0)}/>
    <div className="m" style={{marginBottom:12}}>≈ {(v/p.price).toFixed(3)} kg. Tortilgandan so'ng summa biroz o'zgarishi mumkin — o'zgarsa sizdan tasdiq so'raymiz.</div>
    <div className="gap"><button className="btn" style={{flex:1}} disabled={v<1000} onClick={()=>set(v)}>{t("Savatga")}</button>{cur&&<button className="btn g" style={{flex:'0 0 auto',width:'auto'}} onClick={()=>set(0)}>{t("O'chirish")}</button>}</div>
  </div></div>}


const EMO={"Sut mahsulotlari":'🥛',"Go'sht va kolbasa":'🥩',"Non mahsulotlari":'🍞',Ichimliklar:'🥤',Shirinliklar:'🍫',Bakaleya:'🌾',"Maishiy kimyo":'🧴',"Meva-sabzavot":'🍎',"Taom mahsulotlari":'🍲',Boshqa:'🛒'}
const Thumb=({p,cls='img'})=><div className={cls} style={p.image?{backgroundImage:`url(${p.image})`}:{}}>{!p.image&&<span>{p.bundle?'🎁':EMO[p.category]||'🛒'}</span>}{p.age_min>0&&<i className="age">{p.age_min}+</i>}</div>
const upload=file=>new Promise((res,rej)=>{const img=new Image();img.onerror=()=>rej(new Error('Rasm ochilmadi'));img.onload=async()=>{try{const k=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);res((await api('/api/upload','POST',{data:c.toDataURL('image/jpeg',0.8)})).url)}catch(e){rej(e)}};img.src=URL.createObjectURL(file)})
const useDebounced=(v,ms=300)=>{const [x,setX]=useState(v);useEffect(()=>{const h=setTimeout(()=>setX(v),ms);return()=>clearTimeout(h)},[v,ms]);return x}

function Shop({d,cart,setCart}){
  const [q,setQ]=useState(''),[cat,setCat]=useState(''),[items,setItems]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[sh,setSh]=useState(null),[vid,setVid]=useState(null),[ban,setBan]=useState(0)
  const dq=useDebounced(q)
  const load=useCallback((n,reset)=>api(`/api/products?q=${encodeURIComponent(dq)}&cat=${encodeURIComponent(cat)}&page=${n}`).then(r=>{setItems(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)}).catch(()=>{}),[dq,cat])
  useEffect(()=>{load(0,true)},[load])
  useEffect(()=>{if(d.banners.length<2)return;const h=setInterval(()=>setBan(b=>(b+1)%d.banners.length),4000);return()=>clearInterval(h)},[d.banners.length])
  const put=(p,v,key)=>setCart(c=>{const n={...c};v?n[key]={p,...v}:delete n[key];return n})
  const home=!q&&!cat,b=d.banners[ban]
  const Btn=({p,key2})=>{const it=cart[key2];return p.unit==='weight'?<button className="add" onClick={()=>setSh({p,key2})}>{it?so(it.sum):'+'}</button>
    :it?<div className="step"><button onClick={()=>put(p,it.qty>1?{qty:it.qty-1}:null,key2)}>−</button><b>{it.qty}</b><button onClick={()=>put(p,{qty:Math.min(p.bundle?20:100,it.qty+1)},key2)}>+</button></div>
    :<button className="add" onClick={()=>put(p,{qty:1},key2)}>+</button>}
  return <>
    <input className="search" placeholder={t("🔍 Mahsulot qidirish")} value={q} onChange={e=>setQ(e.target.value)}/>
    {home&&b&&<div className="banner" style={{backgroundImage:`url(${b.image})`}} onClick={()=>{const m=/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/.exec(b.link||'');if(m)setVid(m[1]);else if(b.link)tg?.openLink?tg.openLink(b.link):window.open(b.link)}}>{b.title&&<span>{b.title}</span>}{d.banners.length>1&&<em>{d.banners.map((_,i)=><u key={i} className={i===ban?'on':''}/>)}</em>}</div>}
    {home&&d.bundles.length>0&&<><h2 className="sec">🎁 {t("Naborlar")}</h2><div className="hrow">{d.bundles.map(x=>{const p={...x,bundle:true,category:'Boshqa'};return <div className="card bun" key={x.id}><Thumb p={p}/><b>{x.title}</b><div className="m">{(x.parts||[]).slice(0,3).join(', ')}</div>
      <div className="bp">{x.old_price>x.price&&<s>{so(x.old_price)}</s>}<span>{so(x.price)}</span></div><Btn p={p} key2={'b'+x.id}/></div>})}</div></>}
    {home&&d.videos.length>0&&<><h2 className="sec">▶ {t("Yangiliklar")}</h2><div className="hrow">{d.videos.map(v=><div className="vid" key={v.id} onClick={()=>setVid(v.yt_id)} style={{backgroundImage:`url(https://img.youtube.com/vi/${v.yt_id}/hqdefault.jpg)`}}><b>▶</b><span>{v.title}</span></div>)}</div></>}
    <div className="chips">{['',...d.categories].map(c=><button key={c} className={'chip'+(cat===c?' on':'')} onClick={()=>setCat(c)}>{c?(EMO[c]||'')+' '+t(c):t("Hammasi")}</button>)}</div>
    <div className="grid">{items.map(p=><div className="card prod" key={p.id}><Thumb p={p}/><div className="price">{so(p.price)}{p.unit==='weight'&&<small> / kg</small>}</div><div className="name">{p.name}</div><Btn p={p} key2={'p'+p.id}/></div>)}</div>
    {!items.length&&<div className="center" style={{minHeight:160}}>{t("Hech narsa topilmadi")}</div>}
    {more&&<button className="btn g" style={{marginTop:12}} onClick={()=>load(pg+1,false)}>{t("Yana")}</button>}
    {sh&&<WeightSheet p={sh.p} cur={cart[sh.key2]?.sum} close={()=>setSh(null)} set={v=>{put(sh.p,v?{sum:v}:null,sh.key2);setSh(null)}}/>}
    {vid&&<div className="sheet" onClick={()=>setVid(null)}><div onClick={e=>e.stopPropagation()}><div className="yt"><iframe src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen/></div><button className="btn g" style={{marginTop:10}} onClick={()=>setVid(null)}>✕</button></div></div>}
  </>}

function Cart({d,cart,setCart,act,done}){
  const [type,setType]=useState('pickup'),[addr,setAddr]=useState(''),[pos,setPos]=useState(null),[fee,setFee]=useState(0),[qe,setQe]=useState('')
  const lines=Object.entries(cart).map(([k,v])=>({k,p:v.p,v})),dl=d.settings.delivery
  const sub=lines.reduce((s,{p,v})=>s+(v.sum||v.qty*p.price),0),age=Math.max(0,...lines.map(l=>l.p.age_min||0))
  useEffect(()=>{setFee(0);setQe('');if(type==='delivery'&&pos)api('/api/delivery/quote','POST',{subtotal:sub,...pos}).then(r=>setFee(r.fee)).catch(e=>setQe(e.message))},[type,pos,sub])
  const loc=()=>navigator.geolocation?.getCurrentPosition(x=>setPos({lat:x.coords.latitude,lng:x.coords.longitude}),()=>setQe('Joylashuvga ruxsat bering'))
  if(!lines.length)return <div className="center" style={{minHeight:300}}>{t("🛒 Savat bo'sh")}</div>
  const ok=type==='pickup'||(pos&&addr.trim()&&!qe)
  return <>
    <h1>{t("Savat")}</h1>
    <div className="card">{lines.map(({k,p,v})=><div className="row" key={k}><div><b>{p.bundle?'🎁 ':''}{p.name||p.title}</b>{p.age_min>0&&<span className="age2">{p.age_min}+</span>}<div className="m">{v.sum?`≈ ${(v.sum/p.price).toFixed(3)} kg`:`${v.qty} × ${so(p.price)}`}</div></div>
      <div style={{textAlign:'right'}}><b>{so(v.sum||v.qty*p.price)}</b><br/><button className="m" style={{border:0,background:'none',color:'#E11D48'}} onClick={()=>setCart(c=>{const n={...c};delete n[k];return n})}>{t("O'chirish")}</button></div></div>)}</div>
    <div className="seg"><button className={type==='pickup'?'on':''} onClick={()=>setType('pickup')}>{t("🏃 Olib ketish")}</button>
      {dl.enabled&&<button className={type==='delivery'?'on':''} onClick={()=>setType('delivery')}>{t("🚚 Yetkazib berish")}</button>}</div>
    {type==='delivery'&&<div className="card"><button className="btn g s" onClick={loc}>{pos?'📍 Joylashuv aniqlandi':'📍 Joylashuvni aniqlash'}</button>
      <textarea className="in" style={{marginTop:8}} rows={2} placeholder={t("Manzil (ko'cha, uy, mo'ljal)")} value={addr} onChange={e=>setAddr(e.target.value)}/>
      {qe&&<div style={{color:'#BE123C',fontSize:13}}>{qe}</div>}<div className="m">Maksimal masofa: {dl.maxKm} km</div></div>}
    <div className="card"><div className="row"><span>{t("Mahsulotlar")}</span><b>{so(sub)}</b></div>
      {type==='delivery'&&<div className="row"><span>{t("Yetkazib berish")}</span><b style={{color:fee?'inherit':'#059669'}}>{pos?(fee?so(fee):'Bepul'):'—'}</b></div>}
      <div className="row" style={{fontSize:17}}><b>{t("Jami")}</b><b style={{color:'#E11D48'}}>{so(sub+(type==='delivery'?fee:0))}</b></div>
      {lines.some(l=>l.v.sum)&&<div className="m">⚖️ Og'irlikli tovarlar tortilgach narx o'zgarsa, tasdiqlashingiz so'raladi.</div>}
      {age>0&&<div className="m">{t("🔞 Yosh tasdig'i botda so'raladi.")}</div>}</div>
    <button className="btn" disabled={!ok} onClick={()=>act(async()=>{await api('/api/orders','POST',{items:lines.map(({p,v})=>p.bundle?{bundleId:p.id,qty:v.qty}:{productId:p.id,...(v.sum?{sum:v.sum}:{qty:v.qty})}),type,address:addr,...(pos||{})});setCart({});done()},'Buyurtma yuborildi ✅')}>{t("Buyurtma berish")}</button>
  </>}
function Orders({d,act}){
  if(!d.orders.length)return <div className="center" style={{minHeight:300}}>{t("Buyurtmalar yo'q")}</div>
  return <><h1>{t("Buyurtmalarim")}</h1>{d.orders.filter(o=>o.user_id==d.user.telegramId).map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id}</b><Badge s={o.status}/></div>
    {o.items.map(i=><div className="row m" key={i.id}><span>{i.name}</span><span>{so(i.actual_sum??i.ordered_sum)}</span></div>)}
    <div className="row"><span>{o.type==='delivery'?'🚚 Yetkazib berish':'🏃 Olib ketish'}</span><b>{so(o.total)}</b></div>
    {o.status==='ready'&&<div className="row"><span>{t("Olib ketish kodi")}</span><b style={{fontSize:20,color:'#E11D48'}}>{o.code}</b></div>}
    {o.status==='awaiting_confirm'&&<><div className="card" style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>⚖️ Tortgandan so'ng narx o'zgardi. Yangi mahsulotlar jami: <b>{so(o.pending_subtotal)}</b></div>
      <div className="gap"><button className="btn k" style={{flex:1}} onClick={()=>act(()=>api(`/api/orders/${o.id}/confirm`,'POST',{accept:true}),'Tasdiqlandi')}>{t("Roziman")}</button>
      <button className="btn g" style={{flex:1}} onClick={()=>act(()=>api(`/api/orders/${o.id}/confirm`,'POST',{accept:false}),'Bekor qilindi')}>{t("Bekor qilish")}</button></div></>}
  </div>)}</>}

function Dash(){
  const [s,setS]=useState(null);useEffect(()=>{api('/api/stats').then(setS).catch(()=>{})},[])
  if(!s)return null;const mx=Math.max(1,...s.days.map(x=>Number(x.sum)))
  return <><div className="kpi"><div className="card"><span className="m">{t("Jami tushum")}</span><b>{so(s.totals.revenue)}</b></div><div className="card"><span className="m">{t("Buyurtmalar")}</span><b>{s.totals.orders}</b></div>
    <div className="card"><span className="m">{t("Mijozlar")}</span><b>{s.customers}</b></div></div>
    <div className="card"><h2>So'nggi 14 kun</h2><div className="bars">{s.days.map(x=><div key={x.d} title={x.d+': '+so(x.sum)} style={{height:Math.max(3,Number(x.sum)/mx*100)+'%'}}/>)}</div></div></>}

function AdminOrders({d,act}){
  const [w,setW]=useState({})
  return d.orders.map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id} · {o.code}</b><Badge s={o.status}/></div><div className="m">{o.name} · {o.phone} · {o.type==='delivery'?'🚚 '+o.address:'🏃 olib ketish'}</div>
    {o.items.map(i=><div className="row" key={i.id}><span>{i.name}{i.unit==='weight'?` (${Number(i.qty).toFixed(3)} kg)`:` × ${Number(i.qty)}`}</span>
      {i.unit==='weight'&&['accepted','preparing'].includes(o.status)?<input className="in" style={{width:110,margin:0,padding:8}} type="number" placeholder={i.ordered_sum} value={w[i.id]??''} onChange={e=>setW({...w,[i.id]:e.target.value})}/>:<b>{so(i.actual_sum??i.ordered_sum)}</b>}</div>)}
    <div className="row"><span>{t("Jami")}</span><b>{so(o.total)}</b></div>
    <div className="gap">{(NEXT[o.status]||[]).map(([s,l])=><button key={s} className="btn s" onClick={()=>act(()=>api(`/api/orders/${o.id}/status`,'POST',{status:s}),l)}>{l}</button>)}
      {['accepted','preparing'].includes(o.status)&&o.items.some(i=>i.unit==='weight')&&<button className="btn s k" onClick={()=>act(()=>api(`/api/orders/${o.id}/weigh`,'POST',{items:o.items.filter(i=>w[i.id]).map(i=>({itemId:i.id,actualSum:Number(w[i.id])}))}),'Tortish natijasi yuborildi')}>⚖️ Tortildi</button>}
      {!['completed','cancelled'].includes(o.status)&&<button className="btn s g" onClick={()=>act(()=>api(`/api/orders/${o.id}/status`,'POST',{status:'cancelled'}),'Bekor qilindi')}>{t("Bekor")}</button>}</div>
  </div>)}


function Products({d,act}){
  const dept=d.role==='worker'?d.workerDepartment:null,e0={name:'',price:'',unit:'piece',image:'',category:dept||d.categories[0],age_min:0}
  const [f,setF]=useState(e0),[q,setQ]=useState(''),[st,setSt]=useState('all'),[list,setList]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[ver,setVer]=useState(0),dq=useDebounced(q)
  const set=k=>e=>setF({...f,[k]:e.target.value}),go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  const load=useCallback((n,reset)=>api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=${st}&page=${n}`).then(r=>{setList(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)}).catch(()=>{}),[dq,st])
  useEffect(()=>{load(0,true)},[load,ver])
  const save=()=>go(async()=>{await api(f.id?`/api/products/${f.id}`:'/api/products',f.id?'PUT':'POST',f);setF(e0)},dept?'Adminga tasdiqlash uchun yuborildi':'Saqlandi')
  const pick=async e=>{const file=e.target.files[0];if(!file)return;try{const u=await upload(file);setF(x=>({...x,image:u}))}catch(er){alert(er.message)}}
  return <>{d.pendingProducts.length>0&&<div className="card"><h2>⏳ Tasdiqlash kutilmoqda</h2>{d.pendingProducts.map(r=><div className="row" key={r.id}><span>{r.action}: {r.product.name} <span className="m">({r.worker_name})</span></span>
    <span className="gap"><button className="btn s k" onClick={()=>go(()=>api('/api/changes/'+r.id,'POST',{approve:true}))}>✓</button><button className="btn s g" onClick={()=>go(()=>api('/api/changes/'+r.id,'POST',{approve:false}))}>✕</button></span></div>)}</div>}
    <div className="card"><h2>{f.id?'Tahrirlash':"Yangi mahsulot"}</h2><input className="in" placeholder={t("Nomi")} value={f.name} onChange={set('name')}/>
      <div className="gap"><input className="in" style={{flex:1}} type="text" inputMode="numeric" placeholder={t("Narx (dona yoki kg uchun)")} value={f.price} onChange={e=>setF({...f,price:e.target.value.replace(/\D/g,'').replace(/^0+/,'')})}/><select className="in" style={{flex:1}} value={f.unit} onChange={set('unit')}><option value="piece">Dona</option><option value="weight">Og'irlik (kg)</option></select></div>
      <div className="gap">{!dept&&<select className="in" style={{flex:2}} value={f.category} onChange={set('category')}>{d.categories.map(c=><option key={c}>{c}</option>)}</select>}
        <select className="in" style={{flex:1}} value={f.age_min||0} onChange={set('age_min')}><option value="0">Yosh: yo'q</option><option value="16">16+</option><option value="18">18+</option><option value="20">20+</option><option value="21">21+</option></select></div>
      <div className="gap" style={{alignItems:'center',marginBottom:8}}>{f.image&&<img src={f.image} style={{width:56,height:56,borderRadius:12,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm tanlash<input type="file" accept="image/*" hidden onChange={pick}/></label></div>
      <div className="gap"><button className="btn" style={{flex:1}} onClick={save}>{t("Saqlash")}</button>{f.id&&<button className="btn g" style={{width:'auto'}} onClick={()=>setF(e0)}>{t("Bekor")}</button>}</div></div>
    <input className="search" placeholder="🔍 Nomi yoki shtrixkod" value={q} onChange={e=>setQ(e.target.value)}/>
    <div className="chips">{[['all','Hammasi'],['on','Faol'],['off','Nofaol']].map(([k,l])=><button key={k} className={'chip'+(st===k?' on':'')} onClick={()=>setSt(k)}>{t(l)}</button>)}</div>
    {list.map(p=><div className="card" key={p.id} style={{opacity:p.active?1:.55}}><div className="row"><div><b>{p.name}</b>{p.age_min>0&&<span className="age2">{p.age_min}+</span>}<div className="m">{p.category} · {so(p.price)}{p.unit==='weight'?' / kg':''}{p.stock!=null&&d.warehouseEnabled?` · ombor: ${Number(p.stock)}`:''}</div></div>
      <span className="gap" style={{alignItems:'center'}}>{!dept&&<label className="sw"><input type="checkbox" checked={p.active} onChange={e=>go(()=>api(`/api/products/${p.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label>}<button className="btn s g" onClick={()=>{setF({...p});scrollTo({top:0,behavior:'smooth'})}}>✎</button>{dept&&<button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api('/api/products/'+p.id,'DELETE'),"So'rov yuborildi")}>🗑</button>}</span></div>
      {d.warehouseEnabled&&d.role==='superadmin'&&<input className="in" type="number" placeholder="Ombor qoldig'i" defaultValue={p.stock??''} onBlur={e=>go(()=>api(`/api/products/${p.id}/stock`,'PUT',{stock:e.target.value===''?null:e.target.value}))}/>}</div>)}
    {more&&<button className="btn g" onClick={()=>load(pg+1,false)}>{t("Yana")}</button>}</>}

function Content({d,act}){
  const [c,setC]=useState({banners:[],videos:[],bundles:[]}),[ver,setVer]=useState(0),go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  const [bn,setBn]=useState({image:'',title:'',link:''}),[vd,setVd]=useState({title:'',url:''}),[bd,setBd]=useState({title:'',description:'',price:'',image:'',items:[]}),[bq,setBq]=useState(''),[res,setRes]=useState([]),dq=useDebounced(bq)
  useEffect(()=>{api('/api/content').then(setC).catch(()=>{})},[ver])
  useEffect(()=>{if(dq.length<2){setRes([]);return}api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=on&page=0`).then(r=>setRes(r.items.slice(0,8))).catch(()=>{})},[dq])
  const img=(setter,o)=>async e=>{const f=e.target.files[0];if(!f)return;try{setter({...o,image:await upload(f)})}catch(er){alert(er.message)}}
  const row=(k,x,label)=><div className="row" key={x.id}><span>{label}</span><span className="gap" style={{alignItems:'center'}}><label className="sw"><input type="checkbox" checked={x.active} onChange={e=>go(()=>api(`/api/content/${k}/${x.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label><button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api(`/api/content/${k}/${x.id}`,'DELETE'))}>🗑</button></span></div>
  return <>
    <div className="card"><h2>🖼 {t("Bannerlar")}</h2><div className="gap" style={{alignItems:'center',marginBottom:8}}>{bn.image&&<img src={bn.image} style={{width:96,height:48,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={img(setBn,bn)}/></label></div>
      <input className="in" placeholder="Sarlavha (ixtiyoriy)" value={bn.title} onChange={e=>setBn({...bn,title:e.target.value})}/><input className="in" placeholder="Havola (ixtiyoriy, YouTube ham bo'ladi)" value={bn.link} onChange={e=>setBn({...bn,link:e.target.value})}/>
      <button className="btn s" onClick={()=>go(async()=>{await api('/api/content/banners','POST',bn);setBn({image:'',title:'',link:''})},'Saqlandi')}>+ Banner</button>
      {c.banners.map(x=>row('banners',x,<span><img src={x.image} style={{width:56,height:28,borderRadius:6,objectFit:'cover',verticalAlign:'middle'}}/> {x.title||'#'+x.id}</span>))}</div>
    <div className="card"><h2>🎁 {t("Naborlar")}</h2><input className="in" placeholder="Nabor nomi (masalan: Yangi yil to'plami)" value={bd.title} onChange={e=>setBd({...bd,title:e.target.value})}/>
      <input className="in" type="text" inputMode="numeric" placeholder="Nabor narxi" value={bd.price} onChange={e=>setBd({...bd,price:e.target.value.replace(/\D/g,'').replace(/^0+/,'')})}/>
      <input className="in" placeholder="Mahsulot qo'shish: nomini yozing" value={bq} onChange={e=>setBq(e.target.value)}/>
      {res.map(p=><div className="row" key={p.id}><span>{p.name} <span className="m">{so(p.price)}</span></span><button className="btn s g" onClick={()=>{setBd(b=>({...b,items:b.items.some(i=>i.productId===p.id)?b.items:[...b.items,{productId:p.id,name:p.name,price:p.price,qty:1}]}));setBq('')}}>+</button></div>)}
      {bd.items.map(i=><div className="row" key={i.productId}><span>{i.name}</span><span className="gap" style={{alignItems:'center'}}><input className="in" style={{width:64,margin:0,padding:8}} type="number" min="1" value={i.qty} onChange={e=>setBd({...bd,items:bd.items.map(x=>x.productId===i.productId?{...x,qty:e.target.value}:x)})}/><button className="btn s g" onClick={()=>setBd({...bd,items:bd.items.filter(x=>x.productId!==i.productId)})}>✕</button></span></div>)}
      {bd.items.length>0&&<div className="m">Alohida narxi: {so(bd.items.reduce((s,i)=>s+i.price*i.qty,0))}</div>}
      <div className="gap" style={{alignItems:'center',margin:'8px 0'}}>{bd.image&&<img src={bd.image} style={{width:48,height:48,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={img(setBd,bd)}/></label></div>
      <button className="btn s" onClick={()=>go(async()=>{await api('/api/content/bundles','POST',bd);setBd({title:'',description:'',price:'',image:'',items:[]})},'Saqlandi')}>+ Nabor</button>
      {c.bundles.map(x=>row('bundles',x,x.title+' · '+so(x.price)))}</div>
    <div className="card"><h2>▶ {t("Videolar")}</h2><input className="in" placeholder="Sarlavha" value={vd.title} onChange={e=>setVd({...vd,title:e.target.value})}/><input className="in" placeholder="YouTube havolasi" value={vd.url} onChange={e=>setVd({...vd,url:e.target.value})}/>
      <button className="btn s" onClick={()=>go(async()=>{await api('/api/content/videos','POST',vd);setVd({title:'',url:''})},'Saqlandi')}>+ Video</button>
      {c.videos.map(x=>row('videos',x,x.title||x.yt_id))}</div></>}
function Settings({d,act}){
  const [s,setS]=useState(d.settings.delivery),r=(i,k,v)=>setS({...s,rules:s.rules.map((x,j)=>j===i?{...x,[k]:v}:x)})
  const [u,setU]=useState({targetId:'',role:'worker',name:'',department:d.categories[0]})
  return <><div className="card"><h2>{t("🚚 Yetkazib berish")}</h2>
    <label className="row"><span>Yoqilgan</span><input type="checkbox" checked={s.enabled} onChange={e=>setS({...s,enabled:e.target.checked})}/></label>
    <div className="gap"><label style={{flex:1}} className="m">Maks. masofa (km)<input className="in" type="number" value={s.maxKm} onChange={e=>setS({...s,maxKm:e.target.value})}/></label><label style={{flex:1}} className="m">Asosiy narx<input className="in" type="number" value={s.baseFee} onChange={e=>setS({...s,baseFee:e.target.value})}/></label></div>
    <div className="gap"><label style={{flex:1}} className="m">Do'kon lat<input className="in" value={s.store.lat} onChange={e=>setS({...s,store:{...s.store,lat:e.target.value}})}/></label><label style={{flex:1}} className="m">Do'kon lng<input className="in" value={s.store.lng} onChange={e=>setS({...s,store:{...s.store,lng:e.target.value}})}/></label></div>
    <h2>Qoidalar (summa + masofa → narx)</h2>
    {s.rules.map((x,i)=><div className="gap" key={i} style={{marginBottom:6}}><input className="in" style={{flex:1,margin:0}} type="number" title="Min summa" placeholder="Min summa" value={x.minTotal} onChange={e=>r(i,'minTotal',e.target.value)}/><input className="in" style={{flex:1,margin:0}} type="number" placeholder="km" value={x.maxKm} onChange={e=>r(i,'maxKm',e.target.value)}/><input className="in" style={{flex:1,margin:0}} type="number" placeholder="Narx (0=bepul)" value={x.fee} onChange={e=>r(i,'fee',e.target.value)}/><button className="btn s g" onClick={()=>setS({...s,rules:s.rules.filter((_,j)=>j!==i)})}>✕</button></div>)}
    <div className="gap"><button className="btn s g" onClick={()=>setS({...s,rules:[...s.rules,{minTotal:0,maxKm:3,fee:0}]})}>+ Qoida</button><button className="btn s" onClick={()=>act(()=>api('/api/settings/delivery','PUT',s),'Saqlandi')}>{t("Saqlash")}</button></div></div>
    {d.role==='superadmin'&&<><div className="card"><h2>📦 Ombor tizimi</h2><label className="row"><span>Yoqilgan (faqat Super Admin)</span><input type="checkbox" checked={d.warehouseEnabled} onChange={e=>act(()=>api('/api/settings/warehouse','PUT',{enabled:e.target.checked}),'Saqlandi')}/></label></div>
    <div className="card"><h2>👥 Rollar</h2>{(d.roles||[]).map(x=><div className="row" key={x.tg_id}><span>{x.name||x.tg_id} <span className="m">{x.role}{x.department?' · '+x.department:''}</span></span>{x.role!=='superadmin'&&<button className="btn s g" onClick={()=>act(()=>api('/api/roles','POST',{targetId:x.tg_id,role:'user'}))}>Olib tashlash</button>}</div>)}
      <input className="in" placeholder="Telegram ID" value={u.targetId} onChange={e=>setU({...u,targetId:e.target.value})}/><input className="in" placeholder="Ism" value={u.name} onChange={e=>setU({...u,name:e.target.value})}/>
      <div className="gap"><select className="in" style={{flex:1}} value={u.role} onChange={e=>setU({...u,role:e.target.value})}><option value="worker">Bo'lim ishchisi</option><option value="operator">Operator</option><option value="admin">Admin</option></select>
      {u.role==='worker'&&<select className="in" style={{flex:1}} value={u.department} onChange={e=>setU({...u,department:e.target.value})}>{d.categories.map(c=><option key={c}>{c}</option>)}</select>}</div>
      <button className="btn" onClick={()=>act(()=>api('/api/roles','POST',u),'Saqlandi')}>Qo'shish</button></div></>}</>}


const AG=[['all','Hammasi',null],['order','📦 Buyurtmalar',/^order\./],['prod','🛍 Mahsulotlar',/^(product|change|category|content)\./],['user','👤 Foydalanuvchilar',/^role\./],['set','⚙️ Sozlamalar',/^settings\./]]
const today=()=>new Date(Date.now()+5*3600e3).toISOString().slice(0,10),ago=n=>new Date(Date.now()+5*3600e3-n*864e5).toISOString().slice(0,10)
function Audit(){
  const [a,setA]=useState([]),[g,setG]=useState('all'),[per,setPer]=useState('7'),[from,setFrom]=useState(ago(7)),[to,setTo]=useState(today())
  const pick=k=>{setPer(k);if(k!=='c'){setFrom(k==='0'?today():ago(+k));setTo(today())}}
  useEffect(()=>{api(`/api/audit?from=${from}&to=${to}`).then(setA).catch(()=>{})},[from,to])
  const re=AG.find(x=>x[0]===g)[2],list=re?a.filter(x=>re.test(x.action)):a
  return <><div className="chips">{[['0','Bugun'],['7','7 kun'],['30','30 kun'],['365','Yil'],['c','Sana']].map(([k,l])=><button key={k} className={'chip'+(per===k?' on':'')} onClick={()=>pick(k)}>{t(l)}</button>)}</div>
  {per==='c'&&<div className="gap" style={{marginBottom:8}}><input className="in" style={{flex:1,margin:0}} type="date" value={from} onChange={e=>setFrom(e.target.value)}/><input className="in" style={{flex:1,margin:0}} type="date" value={to} onChange={e=>setTo(e.target.value)}/></div>}
  <div className="chips">{AG.map(([k,l])=><button key={k} className={'chip'+(g===k?' on':'')} onClick={()=>setG(k)}>{t(l)}</button>)}</div>
  <div className="card"><h2>🧾 Audit · {list.length}</h2>{list.length?list.map(x=><div className="tl" key={x.id}><b>{x.action}</b> · {x.entity}<div className="m">{x.actor_name||x.actor} · {new Date(x.at).toLocaleString('uz-UZ')}</div></div>):<div className="m">—</div>}</div></>}

function Admin({d,act}){
  const isW=d.role==='worker',tabs=isW?[['p','Tovarlar']]:d.role==='operator'?[['o','Buyurtmalar']]:[['d','Statistika'],['o','Buyurtmalar'],['p','Tovarlar'],['c','Kontent'],['s','Sozlamalar'],['a','Audit']]
  const [tb,setT]=useState(tabs[0][0])
  return <><h1>{t("Boshqaruv")}</h1><div className="seg" style={{overflowX:'auto'}}>{tabs.map(([k,l])=><button key={k} className={tb===k?'on':''} onClick={()=>setT(k)}>{t(l)}</button>)}</div>
    {tb==='d'&&<Dash/>}{tb==='o'&&<AdminOrders d={d} act={act}/>}{tb==='p'&&<Products d={d} act={act}/>}{tb==='c'&&<Content d={d} act={act}/>}{tb==='s'&&<Settings d={d} act={act}/>}{tb==='a'&&<Audit/>}</>}

export default function App(){
  const [d,setD]=useState(null),[err,setErr]=useState(''),[tab,setTab]=useState('shop'),[cart,setCart]=useState({}),[toast,setToast]=useState('')
  const say=m=>{setToast(m);setTimeout(()=>setToast(''),2500)}
  const load=useCallback(()=>api('/api/init').then(setD).catch(e=>setErr(e.message)),[])
  useEffect(()=>{tg?.ready();tg?.expand();load();const t=setInterval(load,20000);return()=>clearInterval(t)},[load])
  const act=async(fn,ok)=>{try{await fn();ok&&say(ok);await load()}catch(e){say(e.message)}}
  if(err)return <div className="center">⚠️ {err}<br/>Ilovani Telegram bot orqali oching.</div>
  if(!d)return <div className="center">{t("Yuklanmoqda…")}</div>
  if(!d.user.phone)return <div className="center">📱 Avval botda /start bosib telefon raqamingizni yuboring.</div>
  const n=Object.keys(cart).length,adm=d.role!=='user'
  const tabs=[['shop','🏠','Do\'kon'],['cart','🛒','Savat'],['orders','📦','Buyurtma'],...(adm?[['admin','⚙️','Boshqaruv']]:[])]
  return <div className="app">
    <div className="top"><div className="logo">T</div><b style={{fontSize:17,flex:1}}>TEGEN Market</b><button className="lang" onClick={()=>{try{localStorage.setItem('lang',LANG==='ru'?'uz':'ru')}catch{}location.reload()}}>{LANG==='ru'?'UZ':'RU'}</button></div>
    {tab==='shop'&&<Shop d={d} cart={cart} setCart={setCart}/>}
    {tab==='cart'&&<Cart d={d} cart={cart} setCart={setCart} act={act} done={()=>setTab('orders')}/>}
    {tab==='orders'&&<Orders d={d} act={act}/>}
    {tab==='admin'&&adm&&<Admin d={d} act={act}/>}
    <div className="nav">{tabs.map(([k,i,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}><span>{i}</span>{t(l)}{k==='cart'&&n>0&&<i>{n}</i>}</button>)}</div>
    {toast&&<div className="toast">{toast}</div>}</div>}
