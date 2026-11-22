// JOYI: frontend/src/App.jsx
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
Object.assign(RU,{"Katalog": "Каталог", "Profil": "Профиль", "Minimal": "Минимум", "Jami xarid": "Всего куплено", "Kategoriyalar": "Категории", "Yana nimadir olasizmi?": "Хотите что-то ещё?", "Almashtirish tasdig'i kutilmoqda": "Ждёт подтверждения замены"})
const LANG=(()=>{try{return localStorage.getItem('lang')||(tg?.initDataUnsafe?.user?.language_code==='ru'?'ru':'uz')}catch{return 'uz'}})()
const t=s=>LANG==='ru'&&RU[s]||s
const so=n=>Number(n||0).toLocaleString('ru-RU')+" so'm"
const ST={new:['Yangi','blue'],accepted:['Qabul qilindi','indigo'],awaiting_confirm:['Tasdiq kutilmoqda','amber'],sub_pending:["Almashtirish tasdig'i kutilmoqda",'amber'],age_check:["Yosh tasdig'i kutilmoqda",'amber'],preparing:["Yig'ilmoqda",'amber'],ready:['Tayyor','green'],completed:['Yakunlandi','gray'],cancelled:['Bekor qilingan','red']}
const NEXT={new:[['accepted','Qabul']],accepted:[['preparing',"Yig'ish"]],preparing:[['ready','Tayyor']],ready:[['completed','Topshirildi']]}
const Badge=({s})=><span className={'badge '+ST[s][1]}>{t(ST[s][0])}</span>


const EMO={"Sut mahsulotlari":'🥛',"Go'sht va kolbasa":'🥩',"Non mahsulotlari":'🍞',Ichimliklar:'🥤',Shirinliklar:'🍫',Bakaleya:'🌾',"Maishiy kimyo":'🧴',"Meva-sabzavot":'🍎',"Taom mahsulotlari":'🍲',Boshqa:'🛒'}
const pn=p=>LANG==='uz'?(p.name_uz||p.name||p.title):(p.name||p.title)
const cn=c=>(LANG==='ru'&&c.name_ru)||c.name
const lsum=(p,v)=>v.sum||(v.grams?Math.round(p.price*v.grams/1000):v.qty*p.price)
const keyOf=p=>(p.bundle?'b':'p')+p.id
const toggleLang=()=>{try{localStorage.setItem('lang',LANG==='ru'?'uz':'ru')}catch{}location.reload()}
const Thumb=({p,cls='img'})=><div className={cls} style={p.image?{backgroundImage:`url(${p.image})`}:{}}>{!p.image&&<span>{p.bundle?'🎁':EMO[p.category]||'🛒'}</span>}{p.age_min>0&&<i className="age">{p.age_min}+</i>}</div>
const upload=file=>new Promise((res,rej)=>{const img=new Image();img.onerror=()=>rej(new Error('Rasm ochilmadi'));img.onload=async()=>{try{const k=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);res((await api('/api/upload','POST',{data:c.toDataURL('image/jpeg',0.8)})).url)}catch(e){rej(e)}};img.src=URL.createObjectURL(file)})
const useDebounced=(v,ms=300)=>{const [x,setX]=useState(v);useEffect(()=>{const h=setTimeout(()=>setX(v),ms);return()=>clearTimeout(h)},[v,ms]);return x}
const digits=s=>s.replace(/\D/g,'').replace(/^0+/,'')

function WeightSheet({p,cur,close,set}){
  const g=p.min_grams>0,[v,setV]=useState(g?(cur?.grams||p.min_grams):(cur?.sum||20000))
  return <div className="sheet" onClick={close}><div onClick={e=>e.stopPropagation()}>
    <h2>{pn(p)} — {so(p.price)} / kg</h2>
    {g?<><div className="step big"><button onClick={()=>setV(x=>Math.max(p.min_grams,x-p.min_grams))}>−</button><b>{v>=1000?v/1000+' kg':v+' g'}</b><button onClick={()=>setV(x=>Math.min(20000,x+p.min_grams))}>+</button></div>
      <div className="m" style={{margin:'10px 0'}}>≈ {so(Math.round(p.price*v/1000))} · {t("Minimal")}: {p.min_grams} g</div></>
    :<><div className="gap" style={{marginBottom:10}}>{[10000,20000,50000,100000].map(x=><button key={x} className={'chip'+(v===x?' on':'')} onClick={()=>setV(x)}>{so(x)}</button>)}</div>
      <input className="in" type="text" inputMode="numeric" value={v||''} onChange={e=>setV(Number(e.target.value.replace(/\D/g,''))||0)}/>
      <div className="m" style={{marginBottom:12}}>≈ {(v/p.price).toFixed(3)} kg. Tortilgandan so'ng summa biroz o'zgarishi mumkin — o'zgarsa sizdan tasdiq so'raymiz.</div></>}
    <div className="gap"><button className="btn" style={{flex:1}} disabled={!g&&v<1000} onClick={()=>set(g?{grams:v}:{sum:v})}>{t("Savatga")}</button>{cur&&<button className="btn g" style={{flex:'0 0 auto',width:'auto'}} onClick={()=>set(null)}>{t("O'chirish")}</button>}</div>
  </div></div>}

function Detail({p,cart,put,close,onWeight}){
  const it=cart[keyOf(p)]
  return <div className="sheet" onClick={close}><div className="det" onClick={e=>e.stopPropagation()}>
    <Thumb p={p} cls="dimg"/><h2 style={{marginTop:12}}>{pn(p)}</h2>
    <div className="dprice">{so(p.price)}{p.unit==='weight'&&<small> / kg</small>}</div>
    <div className="gap" style={{margin:'6px 0'}}><span className="badge gray">{t(p.category||'Boshqa')}</span>{p.age_min>0&&<span className="badge red">{p.age_min}+</span>}{p.min_grams>0&&<span className="badge amber">{t("Minimal")}: {p.min_grams} g</span>}</div>
    {p.description&&<p className="m" style={{fontSize:14}}>{p.description}</p>}
    {p.unit==='weight'?<button className="btn" onClick={()=>{close();onWeight(p)}}>{it?so(lsum(p,it)):t("Savatga")}</button>
    :it?<div className="gap"><div className="step big" style={{flex:1}}><button onClick={()=>put(p,it.qty>1?{qty:it.qty-1}:null)}>−</button><b>{it.qty}</b><button onClick={()=>put(p,{qty:Math.min(100,it.qty+1)})}>+</button></div><button className="btn" style={{flex:1}} onClick={close}>OK</button></div>
    :<button className="btn" onClick={()=>put(p,{qty:1})}>{t("Savatga")}</button>}
  </div></div>}

function Shop({d,cart,setCart,cat,setCat}){
  const [q,setQ]=useState(''),[items,setItems]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[sh,setSh]=useState(null),[vid,setVid]=useState(null),[det,setDet]=useState(null)
  const dq=useDebounced(q)
  const load=useCallback((n,reset)=>api(`/api/products?q=${encodeURIComponent(dq)}&cat=${encodeURIComponent(cat)}&page=${n}`).then(r=>{setItems(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)}).catch(()=>{}),[dq,cat])
  useEffect(()=>{load(0,true)},[load])
  const put=(p,v)=>setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})
  const home=!q&&!cat,st=e=>e.stopPropagation()
  const ab=p=>{const it=cart[keyOf(p)];return p.unit==='weight'?<button className="add" onClick={e=>{st(e);setSh(p)}}>{it?so(lsum(p,it)):'+'}</button>
    :it?<div className="step" onClick={st}><button onClick={()=>put(p,it.qty>1?{qty:it.qty-1}:null)}>−</button><b>{it.qty}</b><button onClick={()=>put(p,{qty:Math.min(p.bundle?20:100,it.qty+1)})}>+</button></div>
    :<button className="add" onClick={e=>{st(e);put(p,{qty:1})}}>+</button>}
  const openLink=l=>{const m=/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/.exec(l||'');if(m)setVid(m[1]);else if(l)tg?.openLink?tg.openLink(l):window.open(l)}
  return <>
    <input className="search" placeholder={t("🔍 Mahsulot qidirish")} value={q} onChange={e=>setQ(e.target.value)}/>
    {home&&d.banners.length>0&&<div className="hrow snap">{d.banners.map(b=><div className="bcardh" key={b.id} style={{backgroundImage:`url(${b.image})`}} onClick={()=>openLink(b.link)}>{(b.title||b.subtitle)&&<span><b>{b.title}</b>{b.subtitle&&<small>{b.subtitle}</small>}</span>}</div>)}</div>}
    {home&&d.videos.length>0&&<><h2 className="sec">▶ {t("Yangiliklar")}</h2><div className="hrow">{d.videos.map(v=><div className="vid" key={v.id} onClick={()=>setVid(v.yt_id)} style={{backgroundImage:`url(https://img.youtube.com/vi/${v.yt_id}/hqdefault.jpg)`}}><b>▶</b><span>{v.title}</span></div>)}</div></>}
    {home&&d.bundles.length>0&&<><h2 className="sec">🎁 {t("Naborlar")}</h2><div className="hrow">{d.bundles.map(x=>{const p={...x,bundle:true,category:'Boshqa'};return <div className="card bun" key={x.id}><Thumb p={p}/><b>{x.title}</b><div className="m">{(x.parts||[]).slice(0,3).join(', ')}</div>
      <div className="bp">{x.old_price>x.price&&<s>{so(x.old_price)}</s>}<span>{so(x.price)}</span></div>{ab(p)}</div>})}</div></>}
    <div className="chips">{[{name:''},...d.cats].map(c=><button key={c.name} className={'chip'+(cat===c.name?' on':'')} onClick={()=>setCat(c.name)}>{c.name?(EMO[c.name]||'')+' '+cn(c):t("Hammasi")}</button>)}</div>
    <div className="grid">{items.map(p=><div className="card prod" key={p.id} onClick={()=>setDet(p)}><Thumb p={p}/><div className="price">{so(p.price)}{p.unit==='weight'&&<small> / kg</small>}</div><div className="name">{pn(p)}</div>{ab(p)}</div>)}</div>
    {!items.length&&<div className="center" style={{minHeight:160}}>{t("Hech narsa topilmadi")}</div>}
    {more&&<button className="btn g" style={{marginTop:12}} onClick={()=>load(pg+1,false)}>{t("Yana")}</button>}
    {sh&&<WeightSheet p={sh} cur={cart[keyOf(sh)]} close={()=>setSh(null)} set={v=>{put(sh,v);setSh(null)}}/>}
    {det&&<Detail p={det} cart={cart} put={put} close={()=>setDet(null)} onWeight={setSh}/>}
    {vid&&<div className="sheet" onClick={()=>setVid(null)}><div onClick={e=>e.stopPropagation()}><div className="yt"><iframe src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(location.origin)}`} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><a className="btn g" style={{marginTop:10,display:'block',textAlign:'center',textDecoration:'none'}} href={`https://youtu.be/${vid}`} target="_blank" rel="noreferrer">YouTube ↗</a><button className="btn g" style={{marginTop:8}} onClick={()=>setVid(null)}>✕</button></div></div>}
  </>}

function Catalog({d,go}){return <><h1>{t("Katalog")}</h1><div className="card">{d.cats.map(c=><div className="row crow" key={c.name} onClick={()=>go(c.name)}><span className="gap" style={{alignItems:'center'}}><span className="ci" style={c.image?{backgroundImage:`url(${c.image})`}:{}}>{!c.image&&(EMO[c.name]||'🛒')}</span><b>{cn(c)}</b></span><span className="m">›</span></div>)}</div></>}

function Cart({d,cart,setCart,act,done}){
  const [type,setType]=useState('pickup'),[addr,setAddr]=useState(''),[rec,setRec]=useState([])
  const lines=Object.entries(cart).map(([k,v])=>({k,p:v.p,v})),dl=d.settings.delivery
  const sub=lines.reduce((s,{p,v})=>s+lsum(p,v),0),age=Math.max(0,...lines.map(l=>l.p.age_min||0))
  const prods=lines.filter(l=>!l.p.bundle),cats=[...new Set(prods.map(l=>l.p.category))].join('|'),ex=prods.map(l=>l.p.id).join(',')
  useEffect(()=>{if(!cats){setRec([]);return}api(`/api/recommend?cats=${encodeURIComponent(cats)}&ex=${ex}`).then(setRec).catch(()=>{})},[cats,ex])
  if(!lines.length)return <div className="center" style={{minHeight:300}}>{t("🛒 Savat bo'sh")}</div>
  const minT=dl.minTotal||0,ok=type==='pickup'||(sub>=minT&&addr.trim().length>=5)
  return <>
    <h1>{t("Savat")}</h1>
    <div className="card">{lines.map(({k,p,v})=><div className="row" key={k}><div className="gap" style={{alignItems:'center',flexWrap:'nowrap'}}><Thumb p={p} cls="ci sm"/><div><b>{pn(p)}</b>{p.age_min>0&&<span className="age2">{p.age_min}+</span>}<div className="m">{v.sum?`≈ ${(v.sum/p.price).toFixed(3)} kg`:v.grams?`${v.grams} g`:`${v.qty} × ${so(p.price)}`}</div></div></div>
      <div style={{textAlign:'right'}}><b>{so(lsum(p,v))}</b><br/><button className="m" style={{border:0,background:'none',color:'#E11D48'}} onClick={()=>setCart(c=>{const n={...c};delete n[k];return n})}>{t("O'chirish")}</button></div></div>)}</div>
    {rec.length>0&&<><h2 className="sec">{t("Yana nimadir olasizmi?")}</h2><div className="hrow">{rec.map(p=><div className="card bun" style={{minWidth:140,maxWidth:140}} key={p.id}><Thumb p={p}/><div className="price" style={{padding:'6px 10px 0'}}>{so(p.price)}</div><div className="name" style={{padding:'0 10px',minHeight:34,fontSize:12}}>{pn(p)}</div><button className="add" onClick={()=>setCart(c=>({...c,[keyOf(p)]:{p,qty:1}}))}>+</button></div>)}</div></>}
    <div className="seg"><button className={type==='pickup'?'on':''} onClick={()=>setType('pickup')}>{t("🏃 Olib ketish")}</button>
      {dl.enabled&&<button className={type==='delivery'?'on':''} onClick={()=>setType('delivery')}>{t("🚚 Yetkazib berish")}</button>}</div>
    {type==='delivery'&&<div className="card"><textarea className="in" rows={2} placeholder={t("Manzil (ko'cha, uy, mo'ljal)")} value={addr} onChange={e=>setAddr(e.target.value)}/>
      <div className="m">📞 Buyurtmadan keyin administrator telefon orqali bog'lanib tasdiqlaydi.{minT>0&&` Minimal summa: ${so(minT)}.`} {dl.note}</div>
      {sub<minT&&<div style={{color:'#BE123C',fontSize:13,marginTop:4}}>Yana {so(minT-sub)} kerak</div>}</div>}
    <div className="card"><div className="row"><span>{t("Mahsulotlar")}</span><b>{so(sub)}</b></div>
      <div className="row" style={{fontSize:17}}><b>{t("Jami")}</b><b style={{color:'#E11D48'}}>{so(sub)}</b></div>
      {lines.some(l=>l.v.sum)&&<div className="m">⚖️ Og'irlikli tovarlar tortilgach narx o'zgarsa, tasdiqlashingiz so'raladi.</div>}
      {age>0&&<div className="m">{t("🔞 Yosh tasdig'i botda so'raladi.")}</div>}</div>
    <button className="btn" disabled={!ok} onClick={()=>act(async()=>{await api('/api/orders','POST',{items:lines.map(({p,v})=>p.bundle?{bundleId:p.id,qty:v.qty}:{productId:p.id,...(v.sum?{sum:v.sum}:v.grams?{grams:v.grams}:{qty:v.qty})}),type,address:addr});setCart({});done()},'Buyurtma yuborildi ✅')}>{t("Buyurtma berish")}</button>
  </>}

function Orders({d,act}){
  const [ed,setEd]=useState(null),mine=d.orders.filter(o=>o.user_id==d.user.telegramId),post=(o,p,b,m)=>act(()=>api(`/api/orders/${o.id}/${p}`,'POST',b),m)
  if(!mine.length)return <div className="center" style={{minHeight:300}}>{t("Buyurtmalar yo'q")}</div>
  return <><h1>{t("Buyurtmalarim")}</h1>{mine.map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id}</b><Badge s={o.status}/></div>
    {o.items.map(i=><div className="row" key={i.id}><span className="gap" style={{alignItems:'center',flexWrap:'nowrap'}}><Thumb p={{image:i.image,category:'Boshqa'}} cls="ci sm"/><span style={{fontSize:13}}>{i.name}{i.sub_status==='proposed'&&<b> → {i.sub_name}</b>}</span></span>
      {ed?.id===o.id&&i.unit==='piece'?<span className="step" style={{position:'static'}}><button onClick={()=>setEd({...ed,ch:{...ed.ch,[i.id]:Math.max(0,ed.ch[i.id]-1)}})}>−</button><b>{ed.ch[i.id]}</b><button onClick={()=>setEd({...ed,ch:{...ed.ch,[i.id]:Math.min(100,ed.ch[i.id]+1)}})}>+</button></span>:<span className="m">{so(i.actual_sum??i.ordered_sum)}</span>}</div>)}
    <div className="row"><span>{o.type==='delivery'?'🚚 '+t("Yetkazib berish"):t("🏃 Olib ketish")}</span><b>{so(o.total)}</b></div>
    {o.type==='delivery'&&o.status==='new'&&<div className="m">📞 Administrator siz bilan bog'lanadi</div>}
    {o.status==='ready'&&<div className="row"><span>{t("Olib ketish kodi")}</span><b style={{fontSize:20,color:'#E11D48'}}>{o.code}</b></div>}
    {o.status==='awaiting_confirm'&&<><div className="card" style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>⚖️ Tortgandan so'ng narx o'zgardi. Yangi mahsulotlar jami: <b>{so(o.pending_subtotal)}</b></div>
      <div className="gap"><button className="btn k" style={{flex:1}} onClick={()=>post(o,'confirm',{accept:true},'Tasdiqlandi')}>{t("Roziman")}</button><button className="btn g" style={{flex:1}} onClick={()=>post(o,'confirm',{accept:false},'Bekor qilindi')}>{t("Bekor qilish")}</button></div></>}
    {o.status==='sub_pending'&&<><div className="card" style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>🔁 Almashtirish taklifi:{o.items.filter(i=>i.sub_status==='proposed').map(i=><div key={i.id}>{i.name} → <b>{i.sub_name}</b> ({so(i.sub_price)})</div>)}</div>
      <div className="gap"><button className="btn k" style={{flex:1}} onClick={()=>post(o,'sub-answer',{accept:true},'Tasdiqlandi')}>{t("Roziman")}</button><button className="btn g" style={{flex:1}} onClick={()=>post(o,'sub-answer',{accept:false},'Shunsiz davom etamiz')}>Shunsiz davom</button></div></>}
    {['new','accepted','preparing'].includes(o.status)&&!o.edit_state&&<button className="btn s g" onClick={()=>post(o,'edit-request',{},"So'rov yuborildi")}>✏️ O'zgartirishni so'rash</button>}
    {o.edit_state==='requested'&&<div className="m">⏳ Administrator ruxsatini kutyapmiz</div>}
    {o.edit_state==='allowed'&&(ed?.id===o.id?<div className="gap"><button className="btn s" onClick={()=>post(o,'edit-apply',{changes:Object.entries(ed.ch).map(([itemId,qty])=>({itemId,qty}))},'Saqlandi').then(()=>setEd(null))}>{t("Saqlash")}</button><button className="btn s g" onClick={()=>setEd(null)}>{t("Bekor")}</button></div>
      :<button className="btn s" onClick={()=>setEd({id:o.id,ch:Object.fromEntries(o.items.filter(i=>i.unit==='piece').map(i=>[i.id,Number(i.qty)]))})}>✏️ Tahrirlash (ruxsat berilgan)</button>)}
  </div>)}</>}

function Profile({d,go}){
  const mine=d.orders.filter(o=>o.user_id==d.user.telegramId),spent=mine.filter(o=>o.status!=='cancelled').reduce((s,o)=>s+o.total,0),staff=d.role!=='user'
  return <><div className="prof"><div className="av">{(d.user.name||'?')[0]}</div><div><b style={{fontSize:18}}>{d.user.name}</b><div className="m">+{d.user.phone}</div></div></div>
    <div className="kpi"><div className="card"><span className="m">{t("Buyurtmalar")}</span><b>{mine.length}</b></div><div className="card"><span className="m">{t("Jami xarid")}</span><b>{so(spent)}</b></div></div>
    <div className="card"><div className="row"><span>🌐 Til / Язык</span><button className="btn s g" onClick={toggleLang}>{LANG==='ru'?"O'zbekcha":'Русский'}</button></div>
      <div className="row"><span>📦 {t("Buyurtmalarim")}</span><button className="btn s g" onClick={()=>go('orders')}>›</button></div></div>
    {staff&&<button className="btn" onClick={()=>go('admin')}>⚙️ {t("Boshqaruv")}</button>}</>}

function Dash(){
  const [s,setS]=useState(null);useEffect(()=>{api('/api/stats').then(setS).catch(()=>{})},[])
  if(!s)return null
  const days=s.days,mx=Math.max(1,...days.map(x=>+x.sum)),W=320,H=120,pts=days.map((x,i)=>[days.length>1?i*(W/(days.length-1)):W/2,H-8-(+x.sum/mx)*(H-24)])
  const line=pts.map(p=>p.join(',')).join(' '),tot=s.byCat.reduce((a,x)=>a+Number(x.s),0)||1,COL=['#E11D48','#F59E0B','#10B981','#3B82F6','#8B5CF6','#6B7280'];let acc=0
  return <><div className="kpi">{[['💰',t("Jami tushum"),so(s.totals.revenue),''],['🛍',t("Buyurtmalar"),s.totals.orders+' ta',s.totals.pending?s.totals.pending+' ta kutilmoqda':''],['📦','Mahsulotlar',s.products.total,s.products.active+' faol'],['👥',t("Mijozlar"),s.customers,'']].map(([i,l,v,sb])=><div className="card kp" key={l}><span className="ico">{i}</span><span className="m">{l}</span><b>{v}</b>{sb&&<em>{sb}</em>}</div>)}</div>
    <div className="card"><h2>14 kunlik savdo</h2><svg viewBox={`0 0 ${W} ${H}`} className="chart"><polygon points={`0,${H} ${line} ${W},${H}`} fill="#E11D4814"/><polyline points={line} fill="none" stroke="#E11D48" strokeWidth="3" strokeLinejoin="round"/>{pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#E11D48"/>)}</svg></div>
    {s.byCat.length>0&&<div className="card"><h2>Kategoriyalar bo'yicha</h2><div className="donut-wrap"><svg viewBox="-1 -1 2 2" className="donut" style={{transform:'rotate(-90deg)'}}>{s.byCat.length===1?<circle r="1" fill={COL[0]}/>:s.byCat.map((x,i)=>{const a=acc/tot*2*Math.PI;acc+=Number(x.s);const b=acc/tot*2*Math.PI;return <path key={i} d={`M ${Math.cos(a)} ${Math.sin(a)} A 1 1 0 ${b-a>Math.PI?1:0} 1 ${Math.cos(b)} ${Math.sin(b)} L 0 0`} fill={COL[i%6]}/>})}<circle r=".55" fill="#fff"/></svg><div style={{flex:1}}>{s.byCat.map((x,i)=><div className="row" key={i}><span><i className="dot" style={{background:COL[i%6]}}/>{x.c}</span><b>{Math.round(Number(x.s)/tot*100)}%</b></div>)}</div></div></div>}</>}

function AdminOrders({d,act}){
  const [w,setW]=useState({}),[fee,setFee]=useState({}),[f,setF]=useState('all'),[sub,setSub]=useState(null),[sq,setSq]=useState(''),[res,setRes]=useState([]),dq=useDebounced(sq),list=d.orders.filter(o=>f==='all'||o.status===f),post=(o,p,b,m)=>act(()=>api(`/api/orders/${o.id}/${p}`,'POST',b),m)
  useEffect(()=>{if(!sub||dq.length<2){setRes([]);return}api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=on&page=0`).then(r=>setRes(r.items.slice(0,6))).catch(()=>{})},[dq,sub])
  return <><div className="chips">{['all','new','accepted','preparing','sub_pending','ready','completed','cancelled'].map(k=><button key={k} className={'chip'+(f===k?' on':'')} onClick={()=>setF(k)}>{k==='all'?t("Hammasi"):t(ST[k][0])}</button>)}</div>
  {list.map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id} · {o.code}</b><Badge s={o.status}/></div><div className="m">{o.name} · {o.type==='delivery'?'🚚 '+o.address:'🏃 olib ketish'}</div>
    <a className="btn s g" style={{display:'inline-block',textDecoration:'none',margin:'6px 0'}} href={`tel:+${o.phone}`}>📞 +{o.phone}</a>
    {o.items.map(i=><div key={i.id}><div className="row"><span className="gap" style={{alignItems:'center',flexWrap:'nowrap'}}><Thumb p={{image:i.image,category:'Boshqa'}} cls="ci sm"/><span style={{fontSize:13}}>{i.name}{i.unit==='weight'?` (${Number(i.qty).toFixed(3)} kg)`:` × ${Number(i.qty)}`}{i.sub_status==='proposed'&&<b style={{color:'#B45309'}}> → {i.sub_name}</b>}</span></span>
      {i.unit==='weight'&&['accepted','preparing'].includes(o.status)?<input className="in" style={{width:100,margin:0,padding:8}} type="number" placeholder={i.ordered_sum} value={w[i.id]??''} onChange={e=>setW({...w,[i.id]:e.target.value})}/>:<b>{so(i.actual_sum??i.ordered_sum)}</b>}
      {['accepted','preparing'].includes(o.status)&&<button className="btn s g" title="Almashtirish" onClick={()=>{setSub({o:o.id,i:i.id});setSq('')}}>🔁</button>}</div>
      {sub?.i===i.id&&<div className="card" style={{background:'#F9FAFB'}}><input className="in" autoFocus placeholder="Muqobil mahsulot nomi yoki shtrixkod" value={sq} onChange={e=>setSq(e.target.value)}/>{res.map(p=><div className="row" key={p.id}><span style={{fontSize:13}}>{p.name} <span className="m">{so(p.price)}</span></span><button className="btn s" onClick={()=>act(async()=>{await api(`/api/orders/${o.id}/substitute`,'POST',{itemId:i.id,productId:p.id});setSub(null)},'Tanlandi')}>✓</button></div>)}</div>}</div>)}
    <div className="row"><span>{t("Jami")}</span><b>{so(o.total)}</b></div>
    {o.type==='delivery'&&o.status==='new'&&<input className="in" type="text" inputMode="numeric" placeholder="Yetkazish narxi (so'm, ixtiyoriy)" value={fee[o.id]||''} onChange={e=>setFee({...fee,[o.id]:digits(e.target.value)})}/>}
    {o.edit_state==='requested'&&<div className="card" style={{background:'#FFFBEB'}}>✏️ Mijoz o'zgartirish so'radi <div className="gap" style={{marginTop:6}}><button className="btn s k" onClick={()=>post(o,'edit-decide',{allow:true},'Ruxsat berildi')}>Ruxsat</button><button className="btn s g" onClick={()=>post(o,'edit-decide',{allow:false},'Rad etildi')}>Rad</button></div></div>}
    <div className="gap">{(NEXT[o.status]||[]).map(([s,l])=><button key={s} className="btn s" onClick={()=>act(()=>api(`/api/orders/${o.id}/status`,'POST',{status:s,fee:fee[o.id]}),l)}>{t(l)}</button>)}
      {['accepted','preparing'].includes(o.status)&&o.items.some(i=>i.unit==='weight')&&<button className="btn s k" onClick={()=>act(()=>api(`/api/orders/${o.id}/weigh`,'POST',{items:o.items.filter(i=>w[i.id]).map(i=>({itemId:i.id,actualSum:Number(w[i.id])}))}),'Tortish natijasi yuborildi')}>⚖️ Tortildi</button>}
      {['accepted','preparing'].includes(o.status)&&o.items.some(i=>i.sub_status==='proposed')&&<button className="btn s k" onClick={()=>post(o,'send-sub',{},'Mijozga yuborildi')}>📨 Almashtirishni yuborish</button>}
      {!['completed','cancelled'].includes(o.status)&&<button className="btn s g" onClick={()=>act(()=>api(`/api/orders/${o.id}/status`,'POST',{status:'cancelled'}),'Bekor qilindi')}>{o.status==='new'?'Rad etish':t("Bekor")}</button>}</div>
  </div>)}</>}

function Products({d,act}){
  const dept=d.role==='worker'?d.workerDepartment:null,e0={name:'',name_uz:'',description:'',price:'',unit:'piece',image:'',category:dept||d.categories[0],age_min:0,min_grams:0}
  const [f,setF]=useState(e0),[q,setQ]=useState(''),[st,setSt]=useState('all'),[list,setList]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[ver,setVer]=useState(0),dq=useDebounced(q)
  const set=k=>e=>setF({...f,[k]:e.target.value}),go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  const load=useCallback((n,reset)=>api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=${st}&page=${n}`).then(r=>{setList(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)}).catch(()=>{}),[dq,st])
  useEffect(()=>{load(0,true)},[load,ver])
  const save=()=>go(async()=>{await api(f.id?`/api/products/${f.id}`:'/api/products',f.id?'PUT':'POST',f);setF(e0)},dept?'Adminga tasdiqlash uchun yuborildi':'Saqlandi')
  const pick=async e=>{const file=e.target.files[0];if(!file)return;try{const u=await upload(file);setF(x=>({...x,image:u}))}catch(er){alert(er.message)}}
  return <>{d.pendingProducts.length>0&&<div className="card"><h2>⏳ Tasdiqlash kutilmoqda</h2>{d.pendingProducts.map(r=><div className="row" key={r.id}><span>{r.action}: {r.product.name} <span className="m">({r.worker_name})</span></span>
    <span className="gap"><button className="btn s k" onClick={()=>go(()=>api('/api/changes/'+r.id,'POST',{approve:true}))}>✓</button><button className="btn s g" onClick={()=>go(()=>api('/api/changes/'+r.id,'POST',{approve:false}))}>✕</button></span></div>)}</div>}
    <div className="card"><h2>{f.id?'Tahrirlash':"Yangi mahsulot"}</h2><input className="in" placeholder="Название (русский)" value={f.name} onChange={set('name')}/><input className="in" placeholder="Nomi (o'zbekcha)" value={f.name_uz||''} onChange={set('name_uz')}/>
      <div className="gap"><input className="in" style={{flex:1}} type="text" inputMode="numeric" placeholder={t("Narx (dona yoki kg uchun)")} value={f.price} onChange={e=>setF({...f,price:digits(e.target.value)})}/><select className="in" style={{flex:1}} value={f.unit} onChange={set('unit')}><option value="piece">Dona</option><option value="weight">Og'irlik (kg)</option></select></div>
      {f.unit==='weight'&&<input className="in" type="text" inputMode="numeric" placeholder="Minimal gramm (masalan 250). Bo'sh = summa bilan sotiladi" value={f.min_grams||''} onChange={e=>setF({...f,min_grams:digits(e.target.value)})}/>}
      <div className="gap">{!dept&&<select className="in" style={{flex:2}} value={f.category} onChange={set('category')}>{d.cats.map(c=><option key={c.name} value={c.name}>{cn(c)}</option>)}</select>}
        <select className="in" style={{flex:1}} value={f.age_min||0} onChange={set('age_min')}><option value="0">Yosh: yo'q</option><option value="16">16+</option><option value="18">18+</option><option value="20">20+</option><option value="21">21+</option></select></div>
      <textarea className="in" rows={2} placeholder="Tavsif (ixtiyoriy)" value={f.description||''} onChange={set('description')}/>
      <div className="gap" style={{alignItems:'center',marginBottom:8}}>{f.image&&<img src={f.image} style={{width:56,height:56,borderRadius:12,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm tanlash<input type="file" accept="image/*" hidden onChange={pick}/></label></div>
      <div className="gap"><button className="btn" style={{flex:1}} onClick={save}>{t("Saqlash")}</button>{f.id&&<button className="btn g" style={{width:'auto'}} onClick={()=>setF(e0)}>{t("Bekor")}</button>}</div></div>
    <input className="search" placeholder="🔍 Nomi yoki shtrixkod" value={q} onChange={e=>setQ(e.target.value)}/>
    <div className="chips">{[['all','Hammasi'],['on','Faol'],['off','Nofaol']].map(([k,l])=><button key={k} className={'chip'+(st===k?' on':'')} onClick={()=>setSt(k)}>{t(l)}</button>)}</div>
    {list.map(p=><div className="card" key={p.id} style={{opacity:p.active?1:.55}}><div className="row"><div><b>{p.name}</b>{p.name_uz&&<div className="m">{p.name_uz}</div>}{p.age_min>0&&<span className="age2">{p.age_min}+</span>}<div className="m">{p.category} · {so(p.price)}{p.unit==='weight'?' / kg':''}</div></div>
      <span className="gap" style={{alignItems:'center'}}>{!dept&&<label className="sw"><input type="checkbox" checked={p.active} onChange={e=>go(()=>api(`/api/products/${p.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label>}<button className="btn s g" onClick={()=>{setF({...p});scrollTo({top:0,behavior:'smooth'})}}>✎</button>{dept&&<button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api('/api/products/'+p.id,'DELETE'),"So'rov yuborildi")}>🗑</button>}</span></div>
      {d.warehouseEnabled&&d.role==='superadmin'&&<input className="in" type="number" placeholder="Ombor qoldig'i" defaultValue={p.stock??''} onBlur={e=>go(()=>api(`/api/products/${p.id}/stock`,'PUT',{stock:e.target.value===''?null:e.target.value}))}/>}</div>)}
    {more&&<button className="btn g" onClick={()=>load(pg+1,false)}>{t("Yana")}</button>}</>}

function Banners({act}){
  const e0={image:'',title:'',subtitle:'',link:''},[list,setList]=useState([]),[ver,setVer]=useState(0),[f,setF]=useState(e0),[eid,setEid]=useState(null),go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  useEffect(()=>{api('/api/content').then(r=>setList(r.banners)).catch(()=>{})},[ver])
  const pick=async e=>{const x=e.target.files[0];if(!x)return;try{const u=await upload(x);setF(o=>({...o,image:u}))}catch(er){alert(er.message)}}
  return <><div className="card"><h2>🖼 {eid?'Bannerni tahrirlash':t("Bannerlar")}</h2><div className="gap" style={{alignItems:'center',marginBottom:8}}>{f.image&&<img src={f.image} style={{width:96,height:48,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={pick}/></label></div>
    <input className="in" placeholder="Sarlavha" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/><input className="in" placeholder="Qisqa izoh" value={f.subtitle} onChange={e=>setF({...f,subtitle:e.target.value})}/><input className="in" placeholder="Havola (ixtiyoriy, YouTube ham bo'ladi)" value={f.link} onChange={e=>setF({...f,link:e.target.value})}/>
    <div className="gap"><button className="btn s" onClick={()=>go(async()=>{await api(eid?`/api/content/banners/${eid}`:'/api/content/banners',eid?'PUT':'POST',f);setF(e0);setEid(null)},'Saqlandi')}>{eid?'Saqlash':'+ Banner'}</button>{eid&&<button className="btn s g" onClick={()=>{setEid(null);setF(e0)}}>{t("Bekor")}</button>}</div></div>
    {list.map(x=><div className="card bcard" key={x.id}><div className="bimg" style={{backgroundImage:`url(${x.image})`}}><span className={'badge '+(x.active?'green':'gray')}>{x.active?t("Faol"):t("Nofaol")}</span></div><b style={{display:'block',marginTop:8}}>{x.title||'—'}</b><div className="m">{x.subtitle}</div>
      <div className="row"><span className="gap" style={{alignItems:'center'}}><label className="sw"><input type="checkbox" checked={x.active} onChange={e=>go(()=>api(`/api/content/banners/${x.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label><button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api(`/api/content/banners/${x.id}`,'DELETE'))}>{t("O'chirish")}</button></span><button className="btn s g" onClick={()=>{setEid(x.id);setF({image:x.image,title:x.title||'',subtitle:x.subtitle||'',link:x.link||''});scrollTo({top:0,behavior:'smooth'})}}>✎ Tahrirlash</button></div></div>)}</>}

function Cats({d,act}){
  const e0={name:'',name_ru:'',image:'',sort:0},[f,setF]=useState(e0),[old,setOld]=useState('')
  const pick=async e=>{const x=e.target.files[0];if(!x)return;try{const u=await upload(x);setF(o=>({...o,image:u}))}catch(er){alert(er.message)}}
  return <div className="card"><h2>🗂 {t("Kategoriyalar")}</h2><input className="in" placeholder="Nomi (o'zbekcha)" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/><input className="in" placeholder="Название (русский)" value={f.name_ru||''} onChange={e=>setF({...f,name_ru:e.target.value})}/>
    <div className="gap" style={{alignItems:'center',marginBottom:8}}>{f.image&&<img src={f.image} style={{width:44,height:44,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={pick}/></label><input className="in" style={{width:90,margin:0}} type="text" inputMode="numeric" placeholder="Tartib" value={f.sort||''} onChange={e=>setF({...f,sort:digits(e.target.value)})}/></div>
    <button className="btn s" onClick={()=>act(async()=>{await api('/api/cats','POST',{...f,old});setF(e0);setOld('')},'Saqlandi')}>{old?'Saqlash':'+ Kategoriya'}</button>
    {d.cats.map(c=><div className="row" key={c.name}><span>{EMO[c.name]||'🛒'} {c.name}{c.name_ru&&<span className="m"> · {c.name_ru}</span>}</span><span className="gap"><button className="btn s g" onClick={()=>{setF({name:c.name,name_ru:c.name_ru||'',image:c.image||'',sort:c.sort||0});setOld(c.name);scrollTo({top:0,behavior:'smooth'})}}>✎</button><button className="btn s g" onClick={()=>confirm("O'chirilsinmi? Tovarlar 'Boshqa'ga o'tadi")&&act(()=>api('/api/cats/'+encodeURIComponent(c.name),'DELETE'))}>🗑</button></span></div>)}</div>}

function Customers(){
  const [q,setQ]=useState(''),[l,setL]=useState([]),dq=useDebounced(q);useEffect(()=>{api('/api/customers?q='+encodeURIComponent(dq)).then(setL).catch(()=>{})},[dq])
  return <><input className="search" placeholder="🔍 Ism yoki telefon" value={q} onChange={e=>setQ(e.target.value)}/><div className="card"><h2>👥 {t("Mijozlar")} · {l.length}</h2>{l.map(c=><div className="row" key={c.tg_id}><div><b>{c.name||c.tg_id}</b><div className="m">+{c.phone} · {c.orders} ta · {so(c.spent)}</div></div><a className="btn s g" style={{textDecoration:'none'}} href={`tel:+${c.phone}`}>📞</a></div>)}</div></>}
function Content({d,act}){
  const [c,setC]=useState({banners:[],videos:[],bundles:[]}),[ver,setVer]=useState(0),go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  const [bn,setBn]=useState({image:'',title:'',link:''}),[vd,setVd]=useState({title:'',url:''}),[bd,setBd]=useState({title:'',description:'',price:'',image:'',items:[]}),[bq,setBq]=useState(''),[res,setRes]=useState([]),dq=useDebounced(bq)
  useEffect(()=>{api('/api/content').then(setC).catch(()=>{})},[ver])
  useEffect(()=>{if(dq.length<2){setRes([]);return}api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=on&page=0`).then(r=>setRes(r.items.slice(0,8))).catch(()=>{})},[dq])
  const img=(setter,o)=>async e=>{const f=e.target.files[0];if(!f)return;try{setter({...o,image:await upload(f)})}catch(er){alert(er.message)}}
  const row=(k,x,label)=><div className="row" key={x.id}><span>{label}</span><span className="gap" style={{alignItems:'center'}}><label className="sw"><input type="checkbox" checked={x.active} onChange={e=>go(()=>api(`/api/content/${k}/${x.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label><button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api(`/api/content/${k}/${x.id}`,'DELETE'))}>🗑</button></span></div>
  return <>
    <Banners act={act}/><Cats d={d} act={act}/>
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
  const [s,setS]=useState(d.settings.delivery),[u,setU]=useState({targetId:'',role:'worker',name:'',department:d.categories[0]})
  return <><div className="card"><h2>{t("🚚 Yetkazib berish")}</h2>
    <label className="row"><span>Yoqilgan</span><input type="checkbox" checked={!!s.enabled} onChange={e=>setS({...s,enabled:e.target.checked})}/></label>
    <label className="m">Minimal buyurtma summasi (so'm)<input className="in" type="text" inputMode="numeric" value={s.minTotal||''} onChange={e=>setS({...s,minTotal:digits(e.target.value)})}/></label>
    <label className="m">Mijozga izoh<input className="in" value={s.note||''} onChange={e=>setS({...s,note:e.target.value})}/></label>
    <div className="m" style={{marginBottom:8}}>Mijoz manzilni yozadi, administrator telefon orqali bog'lanib tasdiqlaydi yoki rad etadi.</div>
    <button className="btn s" onClick={()=>act(()=>api('/api/settings/delivery','PUT',s),'Saqlandi')}>{t("Saqlash")}</button></div>
    {d.role==='superadmin'&&<><div className="card"><h2>📦 Ombor tizimi</h2><label className="row"><span>Yoqilgan (faqat Super Admin)</span><input type="checkbox" checked={d.warehouseEnabled} onChange={e=>act(()=>api('/api/settings/warehouse','PUT',{enabled:e.target.checked}),'Saqlandi')}/></label></div>
    <div className="card"><h2>👥 Rollar</h2>{(d.roles||[]).map(x=><div className="row" key={x.tg_id}><span>{x.name||x.tg_id} <span className="m">{x.role}{x.department?' · '+x.department:''}</span></span>{x.role!=='superadmin'&&<button className="btn s g" onClick={()=>act(()=>api('/api/roles','POST',{targetId:x.tg_id,role:'user'}))}>Olib tashlash</button>}</div>)}
      <input className="in" placeholder="Telegram ID" value={u.targetId} onChange={e=>setU({...u,targetId:e.target.value})}/><input className="in" placeholder="Ism" value={u.name} onChange={e=>setU({...u,name:e.target.value})}/>
      <div className="gap"><select className="in" style={{flex:1}} value={u.role} onChange={e=>setU({...u,role:e.target.value})}><option value="worker">Bo'lim ishchisi</option><option value="operator">Operator</option><option value="admin">Admin</option></select>
      {u.role==='worker'&&<select className="in" style={{flex:1}} value={u.department} onChange={e=>setU({...u,department:e.target.value})}>{d.categories.map(c=><option key={c}>{c}</option>)}</select>}</div>
      <button className="btn" onClick={()=>act(()=>api('/api/roles','POST',u),'Saqlandi')}>Qo'shish</button></div></>}</>}



const AL={'order.create':'Buyurtma yaratildi','order.accepted':'Buyurtma qabul qilindi','order.preparing':"Buyurtma yig'ilmoqda",'order.ready':'Buyurtma tayyor','order.completed':'Buyurtma topshirildi','order.cancelled':'Buyurtma bekor qilindi','order.weighed':'Tortib bo\'lindi','order.confirm_price':'Mijoz narxni tasdiqladi','order.reject_price':'Mijoz narxni rad etdi','order.age_confirmed':'Yosh tasdiqlandi','order.age_denied':'Yosh tasdiqlanmadi','product.save':'Mahsulot saqlandi','product.add':"Mahsulot qo'shildi",'product.delete':"Mahsulot o'chirildi",'product.active':"Mahsulot holati o'zgardi",'product.stock':"Ombor qoldig'i o'zgardi",'role.set':'Rol berildi','settings.delivery':'Yetkazish sozlamasi','settings.warehouse':'Ombor tizimi','category.save':'Kategoriya saqlandi','category.delete':"Kategoriya o'chirildi"}
const AG=[['all','Hammasi',null,'#6B7280'],['order','📦 Buyurtmalar',/^order\./,'#3B82F6'],['prod','🛍 Mahsulotlar',/^(product|change|category)\./,'#F59E0B'],['content','🖼 Kontent',/^content\./,'#10B981'],['user','👤 Foydalanuvchilar',/^role\./,'#8B5CF6'],['set','⚙️ Sozlamalar',/^settings\./,'#6B7280']]
const iso=n=>new Date(Date.now()+5*3600e3-n*864e5).toISOString().slice(0,10),fmt=s=>s.split('-').reverse().join('.'),parse=s=>{const m=/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(s.trim());return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:null}
const adet=x=>{const z=x.detail||{};if(z.active!=null)return z.active?'Yoqildi':'Faolsizlantirildi';if(z.total!=null)return so(z.total);if(z.title)return z.title;if(z.role)return z.role+(z.department?' · '+z.department:'');if(z.n)return z.n;return ''}
function Audit(){
  const [a,setA]=useState([]),[g,setG]=useState('all'),[per,setPer]=useState('7'),[from,setFrom]=useState(iso(7)),[to,setTo]=useState(iso(0)),[ft,setFt]=useState(fmt(iso(7))),[tt,setTt]=useState(fmt(iso(0)))
  const pick=k=>{setPer(k);if(k!=='c'){const f=k==='0'?iso(0):iso(+k);setFrom(f);setTo(iso(0));setFt(fmt(f));setTt(fmt(iso(0)))}}
  useEffect(()=>{api(`/api/audit?from=${from}&to=${to}`).then(setA).catch(()=>{})},[from,to])
  const G=AG.find(x=>x[0]===g),list=G[2]?a.filter(x=>G[2].test(x.action)):a,col=x=>(AG.find(z=>z[2]&&z[2].test(x.action))||AG[0])[3]
  const di=(txt,setTxt,setIso)=><span className="dt"><input className="in" style={{margin:0}} type="text" inputMode="numeric" placeholder="KK.OO.YYYY" value={txt} onChange={e=>{setTxt(e.target.value);const p=parse(e.target.value);if(p)setIso(p)}}/><input type="date" value={parse(txt)||''} onChange={e=>{if(e.target.value){setIso(e.target.value);setTxt(fmt(e.target.value))}}}/></span>
  return <><div className="chips">{[['0','Bugun'],['7','7 kun'],['30','30 kun'],['365','Yil'],['c','Sana']].map(([k,l])=><button key={k} className={'chip'+(per===k?' on':'')} onClick={()=>pick(k)}>{t(l)}</button>)}</div>
  {per==='c'&&<div className="gap" style={{marginBottom:8,flexWrap:'nowrap'}}>{di(ft,setFt,setFrom)}<span style={{alignSelf:'center'}}>→</span>{di(tt,setTt,setTo)}</div>}
  <div className="chips">{AG.map(([k,l])=><button key={k} className={'chip'+(g===k?' on':'')} onClick={()=>setG(k)}>{t(l)}</button>)}</div>
  <div className="card"><h2>🧾 Audit · {list.length}</h2>{list.map(x=><div className="alog" key={x.id}><i style={{background:col(x)}}/><div style={{flex:1}}><b>{AL[x.action]||x.action}</b><div className="m">{x.entity}{adet(x)&&' · '+adet(x)}</div><div className="m">{x.actor_name||x.actor} · {new Date(x.at).toLocaleString('uz-UZ')}</div></div></div>)}{!list.length&&<div className="m">—</div>}</div></>}

function Admin({d,act}){
  const isW=d.role==='worker',tabs=isW?[['p','Tovarlar']]:d.role==='operator'?[['o','Buyurtmalar']]:[['d','Statistika'],['o','Buyurtmalar'],['p','Tovarlar'],['m','Mijozlar'],['c','Kontent'],['s','Sozlamalar'],['a','Audit']]
  const [tb,setT]=useState(tabs[0][0])
  return <><h1>{t("Boshqaruv")}</h1><div className="seg" style={{overflowX:'auto'}}>{tabs.map(([k,l])=><button key={k} className={tb===k?'on':''} onClick={()=>setT(k)}>{t(l)}</button>)}</div>
    {tb==='d'&&<Dash/>}{tb==='o'&&<AdminOrders d={d} act={act}/>}{tb==='p'&&<Products d={d} act={act}/>}{tb==='m'&&<Customers/>}{tb==='c'&&<Content d={d} act={act}/>}{tb==='s'&&<Settings d={d} act={act}/>}{tb==='a'&&<Audit/>}</>}

export default function App(){
  const [d,setD]=useState(null),[err,setErr]=useState(''),[tab,setTab]=useState('shop'),[cart,setCart]=useState({}),[toast,setToast]=useState(''),[cat,setCat]=useState('')
  const say=m=>{setToast(m);setTimeout(()=>setToast(''),2500)}
  const load=useCallback(()=>api('/api/init').then(setD).catch(e=>setErr(e.message)),[])
  useEffect(()=>{tg?.ready();tg?.expand();load();const h=setInterval(load,20000);return()=>clearInterval(h)},[load])
  const act=async(fn,ok)=>{try{await fn();ok&&say(ok);await load()}catch(e){say(e.message)}}
  if(err)return <div className="center">⚠️ {err}<br/>Ilovani Telegram bot orqali oching.</div>
  if(!d)return <div className="center">{t("Yuklanmoqda…")}</div>
  if(!d.user.phone)return <div className="center">📱 Avval botda /start bosib telefon raqamingizni yuboring.</div>
  const n=Object.keys(cart).length,tabs=[['shop','🏠',"Do'kon"],['catalog','🗂','Katalog'],['cart','🛒','Savat'],['orders','📦','Buyurtma'],['profile','👤','Profil']]
  return <div className="app">
    <div className="top"><div className="logo">T</div><b style={{fontSize:17,flex:1}}>TEGEN Market</b><button className="lang" onClick={toggleLang}>{LANG==='ru'?'UZ':'RU'}</button></div>
    {tab==='shop'&&<Shop d={d} cart={cart} setCart={setCart} cat={cat} setCat={setCat}/>}
    {tab==='catalog'&&<Catalog d={d} go={c=>{setCat(c);setTab('shop')}}/>}
    {tab==='cart'&&<Cart d={d} cart={cart} setCart={setCart} act={act} done={()=>setTab('orders')}/>}
    {tab==='orders'&&<Orders d={d} act={act}/>}
    {tab==='profile'&&<Profile d={d} go={setTab}/>}
    {tab==='admin'&&d.role!=='user'&&<Admin d={d} act={act}/>}
    <div className="nav">{tabs.map(([k,i,l])=><button key={k} className={tab===k?'on':''} onClick={()=>{if(k==='shop')setCat('');setTab(k)}}><span>{i}</span>{t(l)}{k==='cart'&&n>0&&<i>{n}</i>}</button>)}</div>
    {toast&&<div className="toast">{toast}</div>}</div>}
