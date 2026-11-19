// JOYI: frontend/src/App.jsx  (GitHub'da shu yo'l bilan yarating)
import {useState,useEffect,useCallback} from 'react'
const API=import.meta.env.PROD?'':(import.meta.env.VITE_API_URL||'http://localhost:8080')
const tg=window.Telegram?.WebApp
async function api(p,method='GET',body){
  const r=await fetch(API+p,{method,headers:{'Content-Type':'application/json','X-Init-Data':tg?.initData||''},body:body?JSON.stringify(body):undefined})
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Xato');return j}
const so=n=>Number(n||0).toLocaleString('ru-RU')+" so'm"
const ST={new:['Yangi','blue'],accepted:['Qabul qilindi','indigo'],awaiting_confirm:['Tasdiq kutilmoqda','amber'],preparing:["Yig'ilmoqda",'amber'],ready:['Tayyor','green'],completed:['Yakunlandi','gray'],cancelled:['Bekor qilingan','red']}
const NEXT={new:[['accepted','Qabul']],accepted:[['preparing',"Yig'ish"]],preparing:[['ready','Tayyor']],ready:[['completed','Topshirildi']]}
const Badge=({s})=><span className={'badge '+ST[s][1]}>{ST[s][0]}</span>

function WeightSheet({p,cur,close,set}){
  const [v,setV]=useState(cur||20000)
  return <div className="sheet" onClick={close}><div onClick={e=>e.stopPropagation()}>
    <h2>{p.name} — {so(p.price)} / kg</h2>
    <div className="gap" style={{marginBottom:10}}>{[10000,20000,50000,100000].map(x=><button key={x} className={'chip'+(v===x?' on':'')} onClick={()=>setV(x)}>{so(x)}</button>)}</div>
    <input className="in" type="number" inputMode="numeric" value={v} onChange={e=>setV(Number(e.target.value))}/>
    <div className="m" style={{marginBottom:12}}>≈ {(v/p.price).toFixed(3)} kg. Tortilgandan so'ng summa biroz o'zgarishi mumkin — o'zgarsa sizdan tasdiq so'raymiz.</div>
    <div className="gap"><button className="btn" style={{flex:1}} disabled={v<1000} onClick={()=>set(v)}>Savatga</button>{cur&&<button className="btn g" style={{flex:'0 0 auto',width:'auto'}} onClick={()=>set(0)}>O'chirish</button>}</div>
  </div></div>}

function Shop({d,cart,setCart}){
  const [q,setQ]=useState(''),[cat,setCat]=useState('Hammasi'),[sh,setSh]=useState(null)
  const list=d.products.filter(p=>(cat==='Hammasi'||p.category===cat)&&p.name.toLowerCase().includes(q.toLowerCase()))
  const put=(p,v)=>setCart(c=>{const n={...c};v?n[p.id]=v:delete n[p.id];return n})
  return <>
    <input className="search" placeholder="🔍 Mahsulot qidirish" value={q} onChange={e=>setQ(e.target.value)}/>
    <div className="chips">{['Hammasi',...d.categories].map(c=><button key={c} className={'chip'+(cat===c?' on':'')} onClick={()=>setCat(c)}>{c}</button>)}</div>
    <div className="grid">{list.map(p=>{const it=cart[p.id],out=d.warehouseEnabled&&p.stock!=null&&Number(p.stock)<=0
      return <div className="card prod" key={p.id}>
        <div className="img" style={{backgroundImage:p.image?`url(${p.image})`:'none'}}/>
        <div className="price">{so(p.price)}{p.unit==='weight'&&<small> / kg</small>}</div><div className="name">{p.name}</div>
        {out?<span className="badge gray" style={{position:'absolute',right:10,bottom:14}}>Tugagan</span>
        :p.unit==='weight'?<button className="add" onClick={()=>setSh(p)}>{it?so(it.sum):'+'}</button>
        :it?<div className="step"><button onClick={()=>put(p,it.qty>1?{qty:it.qty-1}:null)}>−</button><b>{it.qty}</b><button onClick={()=>put(p,{qty:Math.min(100,it.qty+1)})}>+</button></div>
        :<button className="add" onClick={()=>put(p,{qty:1})}>+</button>}
      </div>})}</div>
    {!list.length&&<div className="center" style={{minHeight:200}}>Hech narsa topilmadi</div>}
    {sh&&<WeightSheet p={sh} cur={cart[sh.id]?.sum} close={()=>setSh(null)} set={v=>{put(sh,v?{sum:v}:null);setSh(null)}}/>}
  </>}

function Cart({d,cart,setCart,act,done}){
  const [type,setType]=useState('pickup'),[addr,setAddr]=useState(''),[pos,setPos]=useState(null),[fee,setFee]=useState(0),[qe,setQe]=useState('')
  const lines=Object.entries(cart).map(([id,v])=>({p:d.products.find(p=>p.id==id),v})).filter(l=>l.p)
  const sub=lines.reduce((s,{p,v})=>s+(v.sum||v.qty*p.price),0),dl=d.settings.delivery
  useEffect(()=>{setFee(0);setQe('');if(type==='delivery'&&pos)api('/api/delivery/quote','POST',{subtotal:sub,...pos}).then(r=>setFee(r.fee)).catch(e=>setQe(e.message))},[type,pos,sub])
  const loc=()=>navigator.geolocation?.getCurrentPosition(x=>setPos({lat:x.coords.latitude,lng:x.coords.longitude}),()=>setQe('Joylashuvga ruxsat bering'))
  if(!lines.length)return <div className="center" style={{minHeight:300}}>🛒 Savat bo'sh</div>
  const ok=type==='pickup'||(pos&&addr.trim()&&!qe)
  return <>
    <h1>Savat</h1>
    <div className="card">{lines.map(({p,v})=><div className="row" key={p.id}><div><b>{p.name}</b><div className="m">{v.sum?`≈ ${(v.sum/p.price).toFixed(3)} kg`:`${v.qty} × ${so(p.price)}`}</div></div>
      <div style={{textAlign:'right'}}><b>{so(v.sum||v.qty*p.price)}</b><br/><button className="m" style={{border:0,background:'none',color:'#E11D48'}} onClick={()=>setCart(c=>{const n={...c};delete n[p.id];return n})}>O'chirish</button></div></div>)}</div>
    <div className="seg"><button className={type==='pickup'?'on':''} onClick={()=>setType('pickup')}>🏃 Olib ketish</button>
      {dl.enabled&&<button className={type==='delivery'?'on':''} onClick={()=>setType('delivery')}>🚚 Yetkazib berish</button>}</div>
    {type==='delivery'&&<div className="card"><button className="btn g s" onClick={loc}>{pos?'📍 Joylashuv aniqlandi':'📍 Joylashuvni aniqlash'}</button>
      <textarea className="in" style={{marginTop:8}} rows={2} placeholder="Manzil (ko'cha, uy, mo'ljal)" value={addr} onChange={e=>setAddr(e.target.value)}/>
      {qe&&<div style={{color:'#BE123C',fontSize:13}}>{qe}</div>}
      <div className="m">Maksimal masofa: {dl.maxKm} km</div></div>}
    <div className="card"><div className="row"><span>Mahsulotlar</span><b>{so(sub)}</b></div>
      {type==='delivery'&&<div className="row"><span>Yetkazib berish</span><b style={{color:fee?'inherit':'#059669'}}>{pos?(fee?so(fee):'Bepul'):'—'}</b></div>}
      <div className="row" style={{fontSize:17}}><b>Jami</b><b style={{color:'#E11D48'}}>{so(sub+(type==='delivery'?fee:0))}</b></div>
      {lines.some(l=>l.v.sum)&&<div className="m">⚖️ Og'irlikli tovarlar tortilgach narx o'zgarsa, tasdiqlashingiz so'raladi.</div>}</div>
    <button className="btn" disabled={!ok} onClick={()=>act(async()=>{await api('/api/orders','POST',{items:lines.map(({p,v})=>({productId:p.id,...v})),type,address:addr,...(pos||{})});setCart({});done()},'Buyurtma yuborildi ✅')}>Buyurtma berish</button>
  </>}

function Orders({d,act}){
  if(!d.orders.length)return <div className="center" style={{minHeight:300}}>Buyurtmalar yo'q</div>
  return <><h1>Buyurtmalarim</h1>{d.orders.filter(o=>o.user_id==d.user.telegramId).map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id}</b><Badge s={o.status}/></div>
    {o.items.map(i=><div className="row m" key={i.id}><span>{i.name}</span><span>{so(i.actual_sum??i.ordered_sum)}</span></div>)}
    <div className="row"><span>{o.type==='delivery'?'🚚 Yetkazib berish':'🏃 Olib ketish'}</span><b>{so(o.total)}</b></div>
    {o.status==='ready'&&<div className="row"><span>Olib ketish kodi</span><b style={{fontSize:20,color:'#E11D48'}}>{o.code}</b></div>}
    {o.status==='awaiting_confirm'&&<><div className="card" style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>⚖️ Tortgandan so'ng narx o'zgardi. Yangi mahsulotlar jami: <b>{so(o.pending_subtotal)}</b></div>
      <div className="gap"><button className="btn k" style={{flex:1}} onClick={()=>act(()=>api(`/api/orders/${o.id}/confirm`,'POST',{accept:true}),'Tasdiqlandi')}>Roziman</button>
      <button className="btn g" style={{flex:1}} onClick={()=>act(()=>api(`/api/orders/${o.id}/confirm`,'POST',{accept:false}),'Bekor qilindi')}>Bekor qilish</button></div></>}
  </div>)}</>}

function Dash(){
  const [s,setS]=useState(null);useEffect(()=>{api('/api/stats').then(setS).catch(()=>{})},[])
  if(!s)return null;const mx=Math.max(1,...s.days.map(x=>Number(x.sum)))
  return <><div className="kpi"><div className="card"><span className="m">Jami tushum</span><b>{so(s.totals.revenue)}</b></div><div className="card"><span className="m">Buyurtmalar</span><b>{s.totals.orders}</b></div>
    <div className="card"><span className="m">Mijozlar</span><b>{s.customers}</b></div></div>
    <div className="card"><h2>So'nggi 14 kun</h2><div className="bars">{s.days.map(x=><div key={x.d} title={x.d+': '+so(x.sum)} style={{height:Math.max(3,Number(x.sum)/mx*100)+'%'}}/>)}</div></div></>}

function AdminOrders({d,act}){
  const [w,setW]=useState({})
  return d.orders.map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id} · {o.code}</b><Badge s={o.status}/></div><div className="m">{o.name} · {o.phone} · {o.type==='delivery'?'🚚 '+o.address:'🏃 olib ketish'}</div>
    {o.items.map(i=><div className="row" key={i.id}><span>{i.name}{i.unit==='weight'?` (${Number(i.qty).toFixed(3)} kg)`:` × ${Number(i.qty)}`}</span>
      {i.unit==='weight'&&['accepted','preparing'].includes(o.status)?<input className="in" style={{width:110,margin:0,padding:8}} type="number" placeholder={i.ordered_sum} value={w[i.id]??''} onChange={e=>setW({...w,[i.id]:e.target.value})}/>:<b>{so(i.actual_sum??i.ordered_sum)}</b>}</div>)}
    <div className="row"><span>Jami</span><b>{so(o.total)}</b></div>
    <div className="gap">{(NEXT[o.status]||[]).map(([s,l])=><button key={s} className="btn s" onClick={()=>act(()=>api(`/api/orders/${o.id}/status`,'POST',{status:s}),l)}>{l}</button>)}
      {['accepted','preparing'].includes(o.status)&&o.items.some(i=>i.unit==='weight')&&<button className="btn s k" onClick={()=>act(()=>api(`/api/orders/${o.id}/weigh`,'POST',{items:o.items.filter(i=>w[i.id]).map(i=>({itemId:i.id,actualSum:Number(w[i.id])}))}),'Tortish natijasi yuborildi')}>⚖️ Tortildi</button>}
      {!['completed','cancelled'].includes(o.status)&&<button className="btn s g" onClick={()=>act(()=>api(`/api/orders/${o.id}/status`,'POST',{status:'cancelled'}),'Bekor qilindi')}>Bekor</button>}</div>
  </div>)}

function Products({d,act}){
  const dept=d.role==='worker'?d.workerDepartment:null,e0={name:'',price:'',unit:'piece',image:'',category:dept||d.categories[0]}
  const [f,setF]=useState(e0),set=k=>e=>setF({...f,[k]:e.target.value}),save=()=>act(async()=>{await api(f.id?`/api/products/${f.id}`:'/api/products',f.id?'PUT':'POST',f);setF(e0)},dept?'Adminga tasdiqlash uchun yuborildi':'Saqlandi')
  const list=d.products.filter(p=>!dept||p.category===dept)
  return <>{d.pendingProducts.length>0&&<div className="card"><h2>⏳ Tasdiqlash kutilmoqda</h2>{d.pendingProducts.map(r=><div className="row" key={r.id}><span>{r.action}: {r.product.name} <span className="m">({r.worker_name})</span></span>
    <span className="gap"><button className="btn s k" onClick={()=>act(()=>api('/api/changes/'+r.id,'POST',{approve:true}))}>✓</button><button className="btn s g" onClick={()=>act(()=>api('/api/changes/'+r.id,'POST',{approve:false}))}>✕</button></span></div>)}</div>}
    <div className="card"><h2>{f.id?'Tahrirlash':"Yangi mahsulot"}</h2><input className="in" placeholder="Nomi" value={f.name} onChange={set('name')}/>
      <div className="gap"><input className="in" style={{flex:1}} type="number" placeholder="Narx (dona yoki kg uchun)" value={f.price} onChange={set('price')}/><select className="in" style={{flex:1}} value={f.unit} onChange={set('unit')}><option value="piece">Dona</option><option value="weight">Og'irlik (kg)</option></select></div>
      {!dept&&<select className="in" value={f.category} onChange={set('category')}>{d.categories.map(c=><option key={c}>{c}</option>)}</select>}
      <input className="in" placeholder="Rasm havolasi (https://...)" value={f.image||''} onChange={set('image')}/>
      <div className="gap"><button className="btn" style={{flex:1}} onClick={save}>Saqlash</button>{f.id&&<button className="btn g" style={{width:'auto'}} onClick={()=>setF(e0)}>Bekor</button>}</div></div>
    {list.map(p=><div className="card" key={p.id}><div className="row"><div><b>{p.name}</b><div className="m">{p.category} · {so(p.price)}{p.unit==='weight'?' / kg':''}</div></div>
      <span className="gap"><button className="btn s g" onClick={()=>setF({...p})}>✎</button><button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&act(()=>api('/api/products/'+p.id,'DELETE'),dept?'So\'rov yuborildi':"O'chirildi")}>🗑</button></span></div>
      {d.warehouseEnabled&&d.role==='superadmin'&&<input className="in" type="number" placeholder="Ombor qoldig'i" defaultValue={p.stock??''} onBlur={e=>act(()=>api(`/api/products/${p.id}/stock`,'PUT',{stock:e.target.value===''?null:e.target.value}))}/>}</div>)}</>}

function Settings({d,act}){
  const [s,setS]=useState(d.settings.delivery),r=(i,k,v)=>setS({...s,rules:s.rules.map((x,j)=>j===i?{...x,[k]:v}:x)})
  const [u,setU]=useState({targetId:'',role:'worker',name:'',department:d.categories[0]})
  return <><div className="card"><h2>🚚 Yetkazib berish</h2>
    <label className="row"><span>Yoqilgan</span><input type="checkbox" checked={s.enabled} onChange={e=>setS({...s,enabled:e.target.checked})}/></label>
    <div className="gap"><label style={{flex:1}} className="m">Maks. masofa (km)<input className="in" type="number" value={s.maxKm} onChange={e=>setS({...s,maxKm:e.target.value})}/></label><label style={{flex:1}} className="m">Asosiy narx<input className="in" type="number" value={s.baseFee} onChange={e=>setS({...s,baseFee:e.target.value})}/></label></div>
    <div className="gap"><label style={{flex:1}} className="m">Do'kon lat<input className="in" value={s.store.lat} onChange={e=>setS({...s,store:{...s.store,lat:e.target.value}})}/></label><label style={{flex:1}} className="m">Do'kon lng<input className="in" value={s.store.lng} onChange={e=>setS({...s,store:{...s.store,lng:e.target.value}})}/></label></div>
    <h2>Qoidalar (summa + masofa → narx)</h2>
    {s.rules.map((x,i)=><div className="gap" key={i} style={{marginBottom:6}}><input className="in" style={{flex:1,margin:0}} type="number" title="Min summa" placeholder="Min summa" value={x.minTotal} onChange={e=>r(i,'minTotal',e.target.value)}/><input className="in" style={{flex:1,margin:0}} type="number" placeholder="km" value={x.maxKm} onChange={e=>r(i,'maxKm',e.target.value)}/><input className="in" style={{flex:1,margin:0}} type="number" placeholder="Narx (0=bepul)" value={x.fee} onChange={e=>r(i,'fee',e.target.value)}/><button className="btn s g" onClick={()=>setS({...s,rules:s.rules.filter((_,j)=>j!==i)})}>✕</button></div>)}
    <div className="gap"><button className="btn s g" onClick={()=>setS({...s,rules:[...s.rules,{minTotal:0,maxKm:3,fee:0}]})}>+ Qoida</button><button className="btn s" onClick={()=>act(()=>api('/api/settings/delivery','PUT',s),'Saqlandi')}>Saqlash</button></div></div>
    {d.role==='superadmin'&&<><div className="card"><h2>📦 Ombor tizimi</h2><label className="row"><span>Yoqilgan (faqat Super Admin)</span><input type="checkbox" checked={d.warehouseEnabled} onChange={e=>act(()=>api('/api/settings/warehouse','PUT',{enabled:e.target.checked}),'Saqlandi')}/></label></div>
    <div className="card"><h2>👥 Rollar</h2>{(d.roles||[]).map(x=><div className="row" key={x.tg_id}><span>{x.name||x.tg_id} <span className="m">{x.role}{x.department?' · '+x.department:''}</span></span>{x.role!=='superadmin'&&<button className="btn s g" onClick={()=>act(()=>api('/api/roles','POST',{targetId:x.tg_id,role:'user'}))}>Olib tashlash</button>}</div>)}
      <input className="in" placeholder="Telegram ID" value={u.targetId} onChange={e=>setU({...u,targetId:e.target.value})}/><input className="in" placeholder="Ism" value={u.name} onChange={e=>setU({...u,name:e.target.value})}/>
      <div className="gap"><select className="in" style={{flex:1}} value={u.role} onChange={e=>setU({...u,role:e.target.value})}><option value="worker">Bo'lim ishchisi</option><option value="operator">Operator</option><option value="admin">Admin</option></select>
      {u.role==='worker'&&<select className="in" style={{flex:1}} value={u.department} onChange={e=>setU({...u,department:e.target.value})}>{d.categories.map(c=><option key={c}>{c}</option>)}</select>}</div>
      <button className="btn" onClick={()=>act(()=>api('/api/roles','POST',u),'Saqlandi')}>Qo'shish</button></div></>}</>}

function Audit(){
  const [a,setA]=useState([]);useEffect(()=>{api('/api/audit').then(setA).catch(()=>{})},[])
  return <div className="card"><h2>🧾 Audit jurnali</h2>{a.map(x=><div className="tl" key={x.id}><b>{x.action}</b> · {x.entity}<div className="m">{x.actor_name||x.actor} · {new Date(x.at).toLocaleString('uz-UZ')}</div></div>)}</div>}

function Admin({d,act}){
  const isW=d.role==='worker',tabs=isW?[['p','Tovarlar']]:d.role==='operator'?[['o','Buyurtmalar']]:[['d','Statistika'],['o','Buyurtmalar'],['p','Tovarlar'],['s','Sozlamalar'],['a','Audit']]
  const [t,setT]=useState(tabs[0][0])
  return <><h1>Boshqaruv</h1><div className="seg" style={{overflowX:'auto'}}>{tabs.map(([k,l])=><button key={k} className={t===k?'on':''} onClick={()=>setT(k)}>{l}</button>)}</div>
    {t==='d'&&<Dash/>}{t==='o'&&<AdminOrders d={d} act={act}/>}{t==='p'&&<Products d={d} act={act}/>}{t==='s'&&<Settings d={d} act={act}/>}{t==='a'&&<Audit/>}</>}

export default function App(){
  const [d,setD]=useState(null),[err,setErr]=useState(''),[tab,setTab]=useState('shop'),[cart,setCart]=useState({}),[toast,setToast]=useState('')
  const say=m=>{setToast(m);setTimeout(()=>setToast(''),2500)}
  const load=useCallback(()=>api('/api/init').then(setD).catch(e=>setErr(e.message)),[])
  useEffect(()=>{tg?.ready();tg?.expand();load();const t=setInterval(load,20000);return()=>clearInterval(t)},[load])
  const act=async(fn,ok)=>{try{await fn();ok&&say(ok);await load()}catch(e){say(e.message)}}
  if(err)return <div className="center">⚠️ {err}<br/>Ilovani Telegram bot orqali oching.</div>
  if(!d)return <div className="center">Yuklanmoqda…</div>
  if(!d.user.phone)return <div className="center">📱 Avval botda /start bosib telefon raqamingizni yuboring.</div>
  const n=Object.keys(cart).length,adm=d.role!=='user'
  const tabs=[['shop','🏠','Do\'kon'],['cart','🛒','Savat'],['orders','📦','Buyurtma'],...(adm?[['admin','⚙️','Boshqaruv']]:[])]
  return <div className="app">
    <div className="top"><div className="logo">T</div><b style={{fontSize:17}}>TEGEN Market</b></div>
    {tab==='shop'&&<Shop d={d} cart={cart} setCart={setCart}/>}
    {tab==='cart'&&<Cart d={d} cart={cart} setCart={setCart} act={act} done={()=>setTab('orders')}/>}
    {tab==='orders'&&<Orders d={d} act={act}/>}
    {tab==='admin'&&adm&&<Admin d={d} act={act}/>}
    <div className="nav">{tabs.map(([k,i,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}><span>{i}</span>{l}{k==='cart'&&n>0&&<i>{n}</i>}</button>)}</div>
    {toast&&<div className="toast">{toast}</div>}</div>}
    
