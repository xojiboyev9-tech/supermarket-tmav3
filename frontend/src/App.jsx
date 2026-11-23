// JOYI: frontend/src/App.jsx  (GitHub'da shu yo'l bilan yarating)
import {useState,useEffect,useCallback,useRef,createContext,useContext} from 'react'
const API=import.meta.env.PROD?'':(import.meta.env.VITE_API_URL||'http://localhost:8080')
const tg=window.Telegram?.WebApp
async function api(p,method='GET',body){
  const r=await fetch(API+p,{method,headers:{'Content-Type':'application/json','X-Init-Data':tg?.initData||''},body:body?JSON.stringify(body):undefined})
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Xato');return j}

const RU={
  "Do'kon":"Магазин","Savat":"Корзина","Buyurtma":"Заказы","Boshqaruv":"Управление","Hammasi":"Все",
  "Taom mahsulotlari":"Продукты питания","Ichimliklar":"Напитки","Sut mahsulotlari":"Молочные продукты",
  "Non mahsulotlari":"Хлебобулочные","Go'sht va kolbasa":"Мясо и колбасы","Meva-sabzavot":"Фрукты и овощи",
  "Hech narsa topilmadi":"Ничего не найдено","Tugagan":"Нет в наличии","Savatga":"В корзину","O'chirish":"Удалить",
  "🛒 Savat bo'sh":"🛒 Корзина пуста","🏃 Olib ketish":"🏃 Самовывоз","🚚 Yetkazib berish":"🚚 Доставка",
  "Mahsulotlar":"Товары","Yetkazib berish":"Доставка","Jami":"Итого","Buyurtma berish":"Оформить заказ",
  "Buyurtmalarim":"Мои заказы","Buyurtmalar yo'q":"Заказов нет","Roziman":"Согласен","Bekor qilish":"Отменить",
  "Olib ketish kodi":"Код получения","Yangi":"Новый","Qabul qilindi":"Принят","Tasdiq kutilmoqda":"Ждёт подтверждения",
  "Yig'ilmoqda":"Собирается","Tayyor":"Готов","Yakunlandi":"Завершён","Bekor qilingan":"Отменён",
  "Statistika":"Статистика","Buyurtmalar":"Заказы","Tovarlar":"Товары","Sozlamalar":"Настройки","Audit":"Аудит",
  "Jami tushum":"Выручка","Mijozlar":"Клиенты","Saqlash":"Сохранить","Qabul":"Принять","Bekor":"Отмена",
  "Yuklanmoqda…":"Загрузка…","Mahsulot qidirish...":"Поиск товаров...","Nomi":"Название",
  "Narx (dona yoki kg uchun)":"Цена (за шт. или кг)","Manzil (ko'cha, uy, mo'ljal)":"Адрес (улица, дом, ориентир)",
  "Yangiliklar":"Новости","Naborlar":"Наборы","Faol":"Активен","Nofaol":"Скрыт","Kontent":"Контент",
  "1 kun":"1 день","1 hafta":"1 неделя","1 oy":"1 месяц","1 yil":"1 год","Bugun":"Сегодня","7 kun":"7 дней",
  "30 kun":"30 дней","Yil":"Год","Sana":"Даты","Yana":"Ещё","Yosh tasdig'i kutilmoqda":"Ждёт подтверждения возраста",
  "🔞 Yosh tasdig'i botda so'raladi.":"🔞 Подтверждение возраста запросит бот.","Boshqa":"Другое",
  "Shirinliklar":"Сладости","Bakaleya":"Бакалея","Maishiy kimyo":"Бытовая химия","Bannerlar":"Баннеры",
  "Videolar":"Видео","Katalog":"Каталог","Profil":"Профиль","Minimal":"Минимум","Jami xarid":"Всего куплено",
  "Kategoriyalar":"Категории","Yana nimadir olasizmi?":"Хотите что-то ещё?",
  "Almashtirish tasdig'i kutilmoqda":"Ждёт подтверждения замены","Bosh sahifa":"Главная",
  "Qidiruv natijalari":"Результаты поиска","Savatga o'tish":"В корзину","ta":"шт.",
  "Raqamni bosib sonini klaviaturada yozishingiz mumkin":"Нажмите на число, чтобы ввести количество с клавиатуры",
  "Savdo dinamikasi":"Динамика продаж","Bugun (soatbay)":"Сегодня (по часам)","Ma'lumot yo'q":"Нет данных",
  "Kategoriyalar bo'yicha":"По категориям","O'rtacha chek":"Средний чек","yangi":"новых","bekor":"отмен.",
  "kutilmoqda":"ожидают","faol":"акт.","Tez yetkazish va qulay xarid":"Быстрая доставка и удобные покупки",
  "Tahrirlash":"Редактировать","Yangi mahsulot":"Новый товар","Savatda":"В корзине",
  "Nabor tarkibi":"Состав набора","Tejamkorlik":"Экономия","bo'lim":"разд.",
  "Ichki bo'limlar":"Подразделы","Shtrixkod (ixtiyoriy)":"Штрихкод (необязательно)",
  "Ota kategoriya (ixtiyoriy)":"Родительская категория (необязательно)",
  "Asosiy kategoriya (yo'q)":"Основная категория (нет)",
  "Bayram animatsiyasi":"Праздничная анимация","O'chiq":"Выкл","Yangi yil":"Новый год",
  "Navro'z":"Навруз","Ramazon / Hayit":"Рамадан / Хаит","Kuz":"Осень",
  "Aksiya / Bayram":"Акция / Праздник","Sinab ko'rish":"Тест","Davomiyligi (soniya)":"Длительность (сек)",
  "Nabor tavsifi (ixtiyoriy)":"Описание набора (необязательно)","Qo'shish":"Добавить",
  "Buyurtmalar tarixi":"История заказов","Tez-tez olinadiganlar":"Часто покупаемые",
  "Saqlangan manzillar":"Сохранённые адреса","Manzil qo'shish":"Добавить адрес",
  "Yangi manzil (masalan: Uy, ko'cha, kvartira)":"Новый адрес (например: Дом, улица, кв.)",
  "Qayta buyurtma":"Повторить заказ","Barchasini ko'rish":"Показать все","Yakunlangan":"Завершённые",
  "Faol buyurtmalar":"Активные","Doimiy mijoz":"Постоянный клиент","VIP mijoz":"VIP клиент",
  "Yangi mijoz":"Новый клиент","Qo'llab-quvvatlash":"Поддержка",
  "Operator bilan bog'lanish uchun botga xabar yozing":"Напишите сообщение в чат бота, чтобы связаться с оператором",
  "Do'kon ma'lumotlari":"О магазине","Yetkazish yoqilgan":"Доставка активна",
  "Yetkazish o'chirilgan":"Доставка временно отключена","Savatga qo'shildi ✅":"Добавлено в корзину ✅",
  "Bu buyurtmada faol mahsulot topilmadi":"В этом заказе нет активных товаров",
  "Manzillar yo'q":"Сохранённых адресов нет","Bot chatiga o'tish":"Перейти в чат бота",
  "Mahsulotlar soni":"Товаров","Barcha buyurtmalar":"Все заказы",
  "Aksiya":"Акции","Aksiya va chegirmalar":"Акции и скидки",
  "Chegirmali mahsulotlar — vaqt tugaguncha ulguring!":"Товары со скидкой — успейте до конца таймера!",
  "Hozircha aksiya mahsulotlari yo'q":"Сейчас товаров по акции нет",
  "Diskont karta":"Дисконтная карта","2% keshbek":"Кешбэк 2%",
  "Diskont kartaga ariza berish":"Подать заявку на карту",
  "Ism va familiya":"Имя и фамилия","Telefon raqam":"Номер телефона","Yashash manzili":"Адрес проживания",
  "Ariza yuborish":"Отправить заявку","Ariza yuborildi ✅":"Заявка отправлена ✅",
  "Arizangiz ko'rib chiqilmoqda":"Ваша заявка рассматривается",
  "Har zakazda karta raqamingiz yuboriladi va 2% keshbek qo'shiladi":"При каждом заказе номер карты передаётся оператору и начисляется 2% кешбэк",
  "Nusxalandi ✅":"Скопировано ✅","Nusxalash":"Копировать","Kartalar":"Карты",
  "Aksiya narxi":"Цена по акции","Tugash vaqti":"Действует до","Tozalash":"Очистить",
  "Nabor nomi (o'zbekcha)":"Название набора (узбекский)","Название набора (русский)":"Название набора (русский)",
  "Nabor tavsifi (o'zbekcha)":"Описание набора (узбекский)","Описание набора (русский)":"Описание набора (русский)",
  "Telegramda yozish":"Написать в Telegram","Qo'ng'iroq qilish":"Позвонить",
  "Operator bilan bog'lanish":"Связаться с оператором",
  "Telefon raqam (ixtiyoriy)":"Номер телефона (необязательно)"
}

const fmtPhone=p=>{const s=String(p||'').replace(/\D/g,'');return s.length===12&&s.startsWith('998')?`+998 ${s.slice(3,5)} ${s.slice(5,8)} ${s.slice(8,10)} ${s.slice(10)}`:(s?'+'+s:'')}
const fmtDt=s=>{if(!s)return '';const d=new Date(s);return d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
const loadAddrs=()=>{try{const a=JSON.parse(localStorage.getItem('tegen_addrs')||'[]');return Array.isArray(a)?a:[]}catch{return []}}
const saveAddrs=a=>{try{localStorage.setItem('tegen_addrs',JSON.stringify(a.slice(0,10)))}catch{}}
const copyText=(txt,say)=>{if(navigator.clipboard)navigator.clipboard.writeText(String(txt)).catch(()=>{});say&&say()}

const isSale=(p,now=Date.now())=>Boolean(p&&!p.bundle&&p.sale_price>0&&p.sale_price<p.price&&(!p.sale_until||new Date(p.sale_until).getTime()>now))
const effPrice=(p,now=Date.now())=>isSale(p,now)?p.sale_price:p.price
const toLocalInput=isoStr=>{if(!isoStr)return '';const d=new Date(isoStr);if(Number.isNaN(d.getTime()))return '';const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
const addDaysLocal=days=>{const d=new Date(Date.now()+days*864e5);return toLocalInput(d.toISOString())}

const C39={'0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn','A':'wnnnnwnnw','B':'nnwnnwnnw','C':'wnwnnwnnn','D':'nnnnwwnnw','E':'wnnnwwnnn','F':'nnwnwwnnn','G':'nnnnnwwnw','H':'wnnnnwwnn','I':'nnwnnwwnn','J':'nnnnwwwnn','K':'wnnnnnnww','L':'nnwnnnnww','M':'wnwnnnnwn','N':'nnnnwnnww','O':'wnnnwnnwn','P':'nnwnwnnwn','Q':'nnnnnnwww','R':'wnnnnnwwn','S':'nnwnnnwwn','T':'nnnnwnwwn','U':'wwnnnnnnw','V':'nwwnnnnnw','W':'wwwnnnnnn','X':'nwnnwnnnw','Y':'wwnnwnnnn','Z':'nwwnwnnnn','-':'nwnnnnwnw',' ':'nwwnnnwnn','*':'nwnnwnwnn'}
function BarcodeSvg({value}){
  const raw='*'+String(value||'').toUpperCase().replace(/[^0-9A-Z\- ]/g,'')+'*'
  const bars=[];let x=8
  for(const ch of raw){
    const pat=C39[ch]||C39['-']
    for(let i=0;i<9;i++){
      const w=pat[i]==='w'?3:1
      if(i%2===0)bars.push([x,w])
      x+=w
    }
    x+=1
  }
  const W=x+8
  return <svg viewBox={`0 0 ${W} 54`} preserveAspectRatio="none" aria-label={value}>
    {bars.map(([bx,bw],i)=><rect key={i} x={bx} y="0" width={bw} height="54" fill="#111827"/>)}
  </svg>
}

const ANIM_PRESETS=[
  {id:'none',icon:'🚫',label:"O'chiq",chars:[]},
  {id:'newyear',icon:'❄️',label:'Yangi yil',chars:['❄️','❅','✨','🎄','⭐'],garland:true},
  {id:'navruz',icon:'🌸',label:"Navro'z",chars:['🌸','🌼','🌿','✨','🌷']},
  {id:'ramazon',icon:'🌙',label:'Ramazon / Hayit',chars:['🌙','✨','⭐','✦']},
  {id:'autumn',icon:'🍂',label:'Kuz',chars:['🍂','🍁','🍃']},
  {id:'confetti',icon:'🎉',label:'Aksiya / Bayram',chars:['🎉','🎊','✨','⭐']}
]

const buildCatTree=cats=>{
  const byName=new Map(cats.map(c=>[c.name,c]))
  const kids=new Map()
  const roots=[]
  for(const c of cats){
    if(c.parent&&c.parent!==c.name&&byName.has(c.parent)){
      if(!kids.has(c.parent))kids.set(c.parent,[])
      kids.get(c.parent).push(c)
    }else roots.push(c)
  }
  const flat=[],seen=new Set()
  const walk=(list,depth)=>{
    for(const c of list){
      if(seen.has(c.name)||depth>3)continue
      seen.add(c.name)
      flat.push({...c,depth})
      walk(kids.get(c.name)||[],depth+1)
    }
  }
  walk(roots,0)
  return {byName,roots,childrenOf:n=>kids.get(n)||[],flat}
}

function FestiveOverlay({preset}){
  const cfg=ANIM_PRESETS.find(x=>x.id===preset)
  if(!cfg||cfg.id==='none'||!cfg.chars.length)return null
  const particles=Array.from({length:20},(_,i)=>{
    const ch=cfg.chars[i%cfg.chars.length]
    const x=((i*37+9)%94)+3
    const dur=(4.4+(i%5)*0.95).toFixed(2)+'s'
    const delay=((i*0.43)%4.2).toFixed(2)+'s'
    const sz=(13+(i%4)*3)+'px'
    const drift=((i%2?1:-1)*(12+(i%4)*9))+'px'
    const rot=((i%2?1:-1)*(150+(i%3)*80))+'deg'
    const op=(0.42+(i%3)*0.11).toFixed(2)
    return <span key={i} className="fp" style={{'--x':x+'%','--dur':dur,'--delay':delay,'--sz':sz,'--drift':drift,'--rot':rot,'--op':op}}>{ch}</span>
  })
  return <div className={'festive '+cfg.id} aria-hidden="true">
    <div className="festive-glow"/>
    {cfg.garland&&<div className="festive-garland">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>}
    {particles}
  </div>
}

const LangCtx=createContext('uz')
const useLang=()=>{
  const lang=useContext(LangCtx)
  const t=useCallback(s=>(lang==='ru'&&RU[s])||s,[lang])
  const so=useCallback(n=>Number(n||0).toLocaleString('ru-RU')+(lang==='ru'?' сум':" so'm"),[lang])
  const pn=useCallback(p=>lang==='uz'?(p.name_uz||p.name||p.title):(p.name||p.title),[lang])
  const cn=useCallback(c=>(lang==='ru'&&c.name_ru)||c.name,[lang])
  const bt=useCallback(b=>(lang==='ru'&&b.title_ru)||b.title,[lang])
  const bdesc=useCallback(b=>(lang==='ru'&&b.description_ru)||b.description,[lang])
  return {lang,t,so,pn,cn,bt,bdesc}
}

const ST={new:['Yangi','blue'],accepted:['Qabul qilindi','indigo'],awaiting_confirm:['Tasdiq kutilmoqda','amber'],sub_pending:["Almashtirish tasdig'i kutilmoqda",'amber'],age_check:["Yosh tasdig'i kutilmoqda",'amber'],preparing:["Yig'ilmoqda",'amber'],ready:['Tayyor','green'],completed:['Yakunlandi','gray'],cancelled:['Bekor qilingan','red']}
const NEXT={new:[['accepted','Qabul']],accepted:[['preparing',"Yig'ish"]],preparing:[['ready','Tayyor']],ready:[['completed','Topshirildi']]}
const EMO={"Sut mahsulotlari":'🥛',"Go'sht va kolbasa":'🥩',"Non mahsulotlari":'🍞',Ichimliklar:'🥤',Shirinliklar:'🍫',Bakaleya:'🌾',"Maishiy kimyo":'🧴',"Meva-sabzavot":'🍎',"Taom mahsulotlari":'🍲',Boshqa:'🛒'}
const CAT_BG=["#EFF6FF","#FFF1F2","#FEFCE8","#ECFEFF","#FDF2F8","#F0FDF4","#FFF7ED","#F5F3FF","#F0FDFA","#F3F4F6"]

const lsum=(p,v)=>{const up=effPrice(p);return v.sum||(v.grams?Math.round(up*v.grams/1000):v.qty*up)}
const keyOf=p=>(p.bundle?'b':'p')+p.id
const digits=s=>s.replace(/\D/g,'').replace(/^0+/,'')
const useDebounced=(v,ms=300)=>{const [x,setX]=useState(v);useEffect(()=>{const h=setTimeout(()=>setX(v),ms);return()=>clearTimeout(h)},[v,ms]);return x}
const upload=file=>new Promise((res,rej)=>{const img=new Image();img.onerror=()=>rej(new Error('Rasm ochilmadi'));img.onload=async()=>{try{const k=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);res((await api('/api/upload','POST',{data:c.toDataURL('image/jpeg',0.8)})).url)}catch(e){rej(e)}};img.src=URL.createObjectURL(file)})

const iso=n=>new Date(Date.now()+5*3600e3-n*864e5).toISOString().slice(0,10)
const fmt=s=>s?s.split('-').reverse().join('.'):''
const parseDate=s=>{const m=/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec((s||'').trim());return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:null}

function Countdown({until,cls='sale-timer'}){
  const {lang}=useLang()
  const [now,setNow]=useState(()=>Date.now())
  useEffect(()=>{
    if(!until)return
    const end=new Date(until).getTime()
    if(Number.isNaN(end)||end<=Date.now())return
    const id=setInterval(()=>setNow(Date.now()),1000)
    return()=>clearInterval(id)
  },[until])
  if(!until)return null
  const diff=Math.floor((new Date(until).getTime()-now)/1000)
  if(!(diff>0))return null
  const d=Math.floor(diff/86400),h=Math.floor((diff%86400)/3600),m=Math.floor((diff%3600)/60),s=diff%60
  const pad=n=>String(n).padStart(2,'0')
  const txt=(d>0?`${d}${lang==='ru'?'д':'k'} `:'')+`${pad(h)}:${pad(m)}:${pad(s)}`
  return <span className={cls}>⏱ {txt}</span>
}

function PriceTag({p,big=false}){
  const {so}=useLang()
  const on=isSale(p)
  const up=on?p.sale_price:p.price
  if(big)return <div className="gap" style={{alignItems:'baseline'}}>
    <div className="dprice">{so(up)}{p.unit==='weight'&&<small> / kg</small>}</div>
    {on&&<span className="price-old" style={{fontSize:15}}>{so(p.price)}</span>}
  </div>
  return <div className="price-wrap">
    <div className={'price'+(on?' sale':'')}>{so(up)}{p.unit==='weight'&&<small> / kg</small>}</div>
    {on&&<span className="price-old">{so(p.price)}</span>}
  </div>
}

function Badge({s}){const {t}=useLang();return <span className={'badge '+(ST[s]?.[1]||'gray')}>{t(ST[s]?.[0]||s)}</span>}
function Thumb({p,cls='img',hideSale=false}){
  const on=!hideSale&&cls==='img'&&isSale(p)
  const pct=on?Math.max(1,Math.round((1-p.sale_price/p.price)*100)):0
  return <div className={cls} style={p.image?{backgroundImage:`url(${p.image})`}:{}}>
    {!p.image&&<span>{p.bundle?'🎁':EMO[p.category]||'🛒'}</span>}
    {p.age_min>0&&<i className="age">{p.age_min}+</i>}
    {on&&<span className="disc">−{pct}%</span>}
    {on&&p.sale_until&&<Countdown until={p.sale_until}/>}
  </div>
}

function NavIcon({k}){
  const p={fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',viewBox:'0 0 24 24'}
  if(k==='shop')return <svg {...p}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5"/><path d="M9 21v-6h6v6"/></svg>
  if(k==='catalog')return <svg {...p}><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>
  if(k==='promo')return <svg {...p}><path d="M12 2c.5 3.5 3 5 3 8a3 3 0 1 1-6 0c0-1.5.5-2.8 1.2-3.8C7.4 7.7 5 10.4 5 14a7 7 0 0 0 14 0c0-5-3.5-8.5-7-12Z"/></svg>
  if(k==='cart')return <svg {...p}><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h9.4a1.5 1.5 0 0 0 1.4-1.1L21 7H6"/></svg>
  if(k==='orders')return <svg {...p}><path d="M6 3h12l2 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7l2-4Z"/><path d="M4 7h16"/><path d="M9 11h6"/></svg>
  return <svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.6 4.7-5.5 8-5.5s6.5 1.9 8 5.5"/></svg>
}

function QtyControl({qty,max=500,onChange,variant='',stopProp=true}){
  const [draft,setDraft]=useState(String(qty))
  const [focused,setFocused]=useState(false)
  useEffect(()=>{if(!focused)setDraft(String(qty))},[qty,focused])
  const stop=e=>{if(stopProp)e.stopPropagation()}
  const commit=val=>{
    const clean=String(val||'').replace(/\D/g,'')
    if(!clean||Number(clean)<=0){onChange(0);return}
    const n=Math.min(max,Number(clean))
    onChange(n);setDraft(String(n))
  }
  return <div className={'qty'+(variant?' '+variant:'')} onClick={stop}>
    <button type="button" aria-label="Minus" onClick={e=>{stop(e);onChange(qty>1?qty-1:0)}}>−</button>
    <input
      className="qinput"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={focused?draft:String(qty)}
      onClick={stop}
      onFocus={e=>{setFocused(true);setDraft(String(qty));setTimeout(()=>e.target.select(),0)}}
      onChange={e=>{
        const raw=e.target.value.replace(/\D/g,'').slice(0,4)
        setDraft(raw)
        if(raw){const n=Math.min(max,Number(raw));if(n>=1)onChange(n)}
      }}
      onBlur={()=>{setFocused(false);commit(draft)}}
      onKeyDown={e=>{if(e.key==='Enter'){e.currentTarget.blur()}}}
    />
    <button type="button" aria-label="Plus" onClick={e=>{stop(e);onChange(Math.min(max,qty+1))}}>+</button>
  </div>
}

function HeroBanners({banners,onOpen}){
  const ref=useRef(null),[idx,setIdx]=useState(0),pauseRef=useRef(0)
  useEffect(()=>{
    if(banners.length<2)return
    const id=setInterval(()=>{
      if(Date.now()<pauseRef.current||!ref.current)return
      setIdx(i=>{
        const n=(i+1)%banners.length
        ref.current?.scrollTo({left:n*ref.current.clientWidth,behavior:'smooth'})
        return n
      })
    },5000)
    return()=>clearInterval(id)
  },[banners.length])
  const onScroll=()=>{
    if(!ref.current)return
    const w=ref.current.clientWidth||1
    setIdx(Math.round(ref.current.scrollLeft/w))
  }
  const jump=i=>{
    pauseRef.current=Date.now()+8000
    setIdx(i)
    ref.current?.scrollTo({left:i*(ref.current.clientWidth||0),behavior:'smooth'})
  }
  return <div className="hero-wrap">
    <div className="hero-track" ref={ref} onScroll={onScroll} onTouchStart={()=>{pauseRef.current=Date.now()+8000}}>
      {banners.map(b=><div key={b.id} className={'hero-slide'+(!(b.title||b.subtitle)?' no-text':'')} style={{backgroundImage:`url(${b.image})`}} onClick={()=>onOpen(b.link)}>
        {(b.title||b.subtitle)&&<div className="hero-cap">{b.title&&<b>{b.title}</b>}{b.subtitle&&<small>{b.subtitle}</small>}</div>}
      </div>)}
    </div>
    {banners.length>1&&<div className="hero-dots">{banners.map((b,i)=><i key={b.id} className={i===idx?'on':''} onClick={()=>jump(i)}/>)}</div>}
  </div>
}

function BundleCarousel({bundles,onOpen,actionBtn}){
  const {so,bt}=useLang()
  const ref=useRef(null),[idx,setIdx]=useState(0),pauseRef=useRef(0)
  useEffect(()=>{
    if(bundles.length<2)return
    const id=setInterval(()=>{
      if(Date.now()<pauseRef.current||!ref.current)return
      const step=186
      const maxScroll=ref.current.scrollWidth-ref.current.clientWidth
      if(maxScroll<=10)return
      setIdx(i=>{
        const next=(i+1)%bundles.length
        const target=Math.min(maxScroll,next*step)
        const loop=ref.current.scrollLeft>=maxScroll-12
        ref.current.scrollTo({left:loop?0:target,behavior:'smooth'})
        return loop?0:next
      })
    },4200)
    return()=>clearInterval(id)
  },[bundles.length])
  const onScroll=()=>{
    if(!ref.current)return
    setIdx(Math.min(bundles.length-1,Math.round(ref.current.scrollLeft/186)))
  }
  const jump=i=>{
    pauseRef.current=Date.now()+8000
    setIdx(i)
    ref.current?.scrollTo({left:i*186,behavior:'smooth'})
  }
  return <>
    <div className="hrow" ref={ref} onScroll={onScroll} onTouchStart={()=>{pauseRef.current=Date.now()+8000}}>
      {bundles.map(x=>{
        const p={...x,bundle:true,category:'Boshqa'}
        const pct=x.old_price>x.price?Math.round((1-x.price/x.old_price)*100):0
        return <div className="card bun" key={x.id} style={{cursor:'pointer'}} onClick={()=>onOpen(x)}>
          <div style={{position:'relative'}}><Thumb p={p}/>{pct>0&&<span className="disc">−{pct}%</span>}</div>
          <div className="bun-body">
            <div className="bun-title">{bt(x)}</div>
            <div className="bun-parts">{(x.parts||[]).slice(0,3).join(', ')}</div>
            <div className="bp"><span>{so(x.price)}</span>{x.old_price>x.price&&<s>{so(x.old_price)}</s>}</div>
            <div className="pfoot">{actionBtn(p)}</div>
          </div>
        </div>
      })}
    </div>
    {bundles.length>2&&<div className="hero-dots" style={{marginTop:0,marginBottom:8}}>{bundles.map((b,i)=><i key={b.id} className={i===idx?'on':''} onClick={()=>jump(i)}/>)}</div>}
  </>
}

function WeightSheet({p,cur,close,set}){
  const {t,so,pn}=useLang()
  const up=effPrice(p)
  const g=p.min_grams>0,[v,setV]=useState(g?(cur?.grams||p.min_grams):(cur?.sum||20000))
  return <div className="sheet" onClick={close}><div onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/>
    <h2>{pn(p)} — {so(up)} / kg</h2>
    {g?<><div className="qty big soft"><button onClick={()=>setV(x=>Math.max(p.min_grams,x-p.min_grams))}>−</button><b style={{fontSize:18}}>{v>=1000?v/1000+' kg':v+' g'}</b><button onClick={()=>setV(x=>Math.min(20000,x+p.min_grams))}>+</button></div>
      <div className="m" style={{margin:'10px 0'}}>≈ {so(Math.round(up*v/1000))} · {t("Minimal")}: {p.min_grams} g</div></>
    :<><div className="gap" style={{marginBottom:10}}>{[10000,20000,50000,100000].map(x=><button key={x} className={'chip'+(v===x?' on':'')} onClick={()=>setV(x)}>{so(x)}</button>)}</div>
      <input className="in" type="text" inputMode="numeric" value={v||''} onChange={e=>setV(Number(e.target.value.replace(/\D/g,''))||0)}/>
      <div className="m" style={{marginBottom:12}}>≈ {(v/up).toFixed(3)} kg. Tortilgandan so'ng summa biroz o'zgarishi mumkin — o'zgarsa sizdan tasdiq so'raymiz.</div></>}
    <div className="gap"><button className="btn" style={{flex:1}} disabled={!g&&v<1000} onClick={()=>set(g?{grams:v}:{sum:v})}>{t("Savatga")}</button>{cur&&<button className="btn g" style={{flex:'0 0 auto',width:'auto'}} onClick={()=>set(null)}>{t("O'chirish")}</button>}</div>
  </div></div>
}

function Detail({p,cart,put,close,onWeight}){
  const {t,so,pn}=useLang()
  const it=cart[keyOf(p)],max=p.bundle?20:500,on=isSale(p)
  const pct=on?Math.max(1,Math.round((1-p.sale_price/p.price)*100)):0
  return <div className="sheet" onClick={close}><div className="det" onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/>
    <div style={{position:'relative'}}><Thumb p={p} cls="dimg" hideSale/>{on&&<span className="disc" style={{fontSize:13,padding:'4px 10px'}}>−{pct}%</span>}</div>
    <h2 style={{marginTop:12,fontSize:18}}>{pn(p)}</h2>
    <PriceTag p={p} big/>
    {on&&p.sale_until&&<div style={{marginTop:8}}><Countdown until={p.sale_until} cls="sale-timer-lg"/></div>}
    <div className="gap" style={{margin:'8px 0'}}><span className="badge gray">{t(p.category||'Boshqa')}</span>{p.age_min>0&&<span className="badge red">{p.age_min}+</span>}{p.min_grams>0&&<span className="badge amber">{t("Minimal")}: {p.min_grams} g</span>}</div>
    {p.description&&<p className="m" style={{fontSize:13.5,margin:'6px 0 12px'}}>{p.description}</p>}
    {p.unit==='weight'?<button className="btn" onClick={()=>{close();onWeight(p)}}>{it?so(lsum(p,it)):t("Savatga")}</button>
    :<>
      <div className="quick-qty">{[1,5,10,20,50].filter(n=>n<=max).map(n=><button key={n} type="button" className={it?.qty===n?'on':''} onClick={()=>put(p,{qty:n})}>{n} {t("ta")}</button>)}</div>
      {it?<>
        <div className="gap"><div style={{flex:1}}><QtyControl qty={it.qty} max={max} variant="big" stopProp={false} onChange={n=>put(p,n>0?{qty:n}:null)}/></div><button className="btn" style={{flex:'0 0 auto',width:'auto',padding:'0 22px'}} onClick={close}>OK</button></div>
        <div className="m" style={{marginTop:8,textAlign:'center'}}>{t("Raqamni bosib sonini klaviaturada yozishingiz mumkin")}</div>
      </>:<button className="btn" onClick={()=>put(p,{qty:1})}>{t("Savatga")}</button>}
    </>}
  </div></div>
}

function BundleDetail({b,cart,put,close}){
  const {t,so,pn,bt,bdesc}=useLang()
  const p={...b,bundle:true,category:'Boshqa'}
  const it=cart[keyOf(p)]
  const pct=b.old_price>b.price?Math.round((1-b.price/b.old_price)*100):0
  const saved=b.old_price>b.price?b.old_price-b.price:0
  const list=Array.isArray(b.items)&&b.items.length?b.items:[]
  const desc=bdesc(b)
  return <div className="sheet" onClick={close}><div className="det" onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/>
    <div style={{position:'relative'}}><Thumb p={p} cls="dimg"/>{pct>0&&<span className="disc" style={{fontSize:13,padding:'4px 10px'}}>−{pct}%</span>}</div>
    <h2 style={{marginTop:12,fontSize:19}}>🎁 {bt(b)}</h2>
    <div className="gap" style={{alignItems:'baseline',marginBottom:6}}>
      <div className="dprice">{so(b.price)}</div>
      {b.old_price>b.price&&<s className="m" style={{fontSize:15}}>{so(b.old_price)}</s>}
    </div>
    {saved>0&&<div style={{marginBottom:8}}><span className="save-badge">✨ {t("Tejamkorlik")}: {so(saved)}</span></div>}
    {desc&&<p className="m" style={{fontSize:13.5,margin:'6px 0 10px'}}>{desc}</p>}

    <h2 style={{marginTop:10,marginBottom:6}}>{t("Nabor tarkibi")} ({list.length||(b.parts||[]).length})</h2>
    <div className="bitem-list">
      {list.length>0?list.map(x=><div className="bitem" key={x.id}>
        <div className="bitem-l">
          <Thumb p={{image:x.image,category:'Boshqa',age_min:x.age_min}} cls="ci sm"/>
          <div style={{minWidth:0}}>
            <b>{pn(x)}</b>
            <span className="m">{so(x.price)}{x.unit==='weight'?' / kg':''}</span>
          </div>
        </div>
        <div className="bitem-r">
          <span className="bitem-qty">× {Number(x.qty)}</span>
          <div className="m" style={{marginTop:2}}>{so(Math.round(x.price*Number(x.qty)))}</div>
        </div>
      </div>):(b.parts||[]).map((pt,i)=><div className="bitem" key={i}><b>• {pt}</b></div>)}
    </div>

    <div className="quick-qty">{[1,2,3,5].map(n=><button key={n} type="button" className={it?.qty===n?'on':''} onClick={()=>put(p,{qty:n})}>{n} {t("ta")}</button>)}</div>
    {it?<div className="gap"><div style={{flex:1}}><QtyControl qty={it.qty} max={20} variant="big" stopProp={false} onChange={n=>put(p,n>0?{qty:n}:null)}/></div><button className="btn" style={{flex:'0 0 auto',width:'auto',padding:'0 22px'}} onClick={close}>OK</button></div>
      :<button className="btn" onClick={()=>put(p,{qty:1})}>{t("Savatga")}</button>}
  </div></div>
}

function Shop({d,cart,setCart,cat,setCat}){
  const {t,so,pn,cn}=useLang()
  const [q,setQ]=useState(''),[items,setItems]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[loading,setLoading]=useState(false),[sh,setSh]=useState(null),[vid,setVid]=useState(null),[det,setDet]=useState(null),[bdet,setBdet]=useState(null)
  const dq=useDebounced(q)
  const home=!dq&&!cat
  const tree=buildCatTree(d.cats)

  const load=useCallback((n,reset)=>{
    if(!dq&&!cat){setItems([]);setMore(false);return}
    setLoading(true)
    api(`/api/products?q=${encodeURIComponent(dq)}&cat=${encodeURIComponent(cat)}&page=${n}`)
      .then(r=>{setItems(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)})
      .catch(()=>{}).finally(()=>setLoading(false))
  },[dq,cat])

  useEffect(()=>{load(0,true)},[load])

  const put=(p,v)=>setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})
  const st=e=>e.stopPropagation()

  const actionBtn=p=>{
    const it=cart[keyOf(p)]
    if(p.unit==='weight')return <button className={'add-full'+(it?' weight-in':'')} onClick={e=>{st(e);setSh(p)}}>{it?so(lsum(p,it)):'+ '+t("Savatga")}</button>
    if(it)return <QtyControl qty={it.qty} max={p.bundle?20:500} onChange={n=>put(p,n>0?{qty:n}:null)}/>
    return <button className="add-full" onClick={e=>{st(e);put(p,{qty:1})}}>+ {t("Savatga")}</button>
  }

  const openLink=l=>{const m=/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/.exec(l||'');if(m)setVid(m[1]);else if(l)tg?.openLink?tg.openLink(l):window.open(l)}
  const curCatObj=tree.byName.get(cat)
  const parentObj=curCatObj?.parent?tree.byName.get(curCatObj.parent):null
  const subCats=cat&&!dq?tree.childrenOf(cat):[]
  const chipList=parentObj?tree.childrenOf(parentObj.name):(subCats.length?subCats:tree.roots)

  return <>
    <div className="search-box">
      <span className="search-ico"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
      <input className="search" placeholder={t("Mahsulot qidirish...")} value={q} onChange={e=>setQ(e.target.value)}/>
      {q&&<button className="search-clr" onClick={()=>setQ('')}>✕</button>}
    </div>

    {home?<>
      {d.banners.length>0&&<HeroBanners banners={d.banners} onOpen={openLink}/>}

      {d.videos.length>0&&<>
        <div className="sec-head"><h2 className="sec">▶ {t("Yangiliklar")}</h2></div>
        <div className="hrow">{d.videos.map(v=><div className="vid" key={v.id} onClick={()=>setVid(v.yt_id)} style={{backgroundImage:`url(https://img.youtube.com/vi/${v.yt_id}/hqdefault.jpg)`}}><b>▶</b><span>{v.title}</span></div>)}</div>
      </>}

      {d.bundles.length>0&&<>
        <div className="sec-head"><h2 className="sec">🎁 {t("Naborlar")}</h2></div>
        <BundleCarousel bundles={d.bundles} onOpen={setBdet} actionBtn={actionBtn}/>
      </>}

      <div className="sec-head"><h2 className="sec">{t("Katalog")}</h2></div>
      <div className="cat-grid">
        {tree.roots.map((c,i)=>{
          const subCount=tree.childrenOf(c.name).length
          return <div
            key={c.name}
            className={'cat-tile'+(c.image?' has-bg':'')}
            style={c.image?{backgroundImage:`url(${c.image})`}:{background:CAT_BG[i%CAT_BG.length]}}
            onClick={()=>{setCat(c.name);scrollTo({top:0,behavior:'smooth'})}}
          >
            <b>{cn(c)}</b>
            {subCount>0&&<span className="cat-sub-badge">{subCount} {t("bo'lim")}</span>}
            {!c.image&&<span className="cat-emo">{EMO[c.name]||'🛒'}</span>}
          </div>
        })}
      </div>
    </>:<>
      {parentObj&&!dq&&<div className="crumb">
        <button onClick={()=>setCat('')}>{t("Bosh sahifa")}</button>
        <span>›</span>
        <button onClick={()=>setCat(parentObj.name)}>{cn(parentObj)}</button>
      </div>}
      <div className="cat-bar">
        <button className="back-btn" aria-label="Back" onClick={()=>{if(dq){setQ('')}else if(parentObj){setCat(parentObj.name)}else{setCat('')}}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1>{dq?t("Qidiruv natijalari"):(curCatObj?cn(curCatObj):cat)}</h1>
      </div>

      {subCats.length>0&&<>
        <div className="subcat-grid">
          {subCats.map(sc=><div className="subcat-tile" key={sc.name} onClick={()=>{setCat(sc.name);scrollTo({top:0,behavior:'smooth'})}}>
            <span className="sub-ic" style={sc.image?{backgroundImage:`url(${sc.image})`}:{}}>{!sc.image&&(EMO[sc.name]||EMO[cat]||'📁')}</span>
            <b>{cn(sc)}</b>
          </div>)}
        </div>
      </>}

      <div className="chips">
        {parentObj
          ?<button className={'chip'+(cat===parentObj.name?' on':'')} onClick={()=>setCat(parentObj.name)}>{t("Hammasi")}</button>
          :<button className={'chip'+(!cat?' on':'')} onClick={()=>setCat('')}>{dq?t("Hammasi"):'🏠 '+t("Bosh sahifa")}</button>}
        {chipList.map(c=><button key={c.name} className={'chip'+(cat===c.name?' on':'')} onClick={()=>setCat(c.name)}>{(EMO[c.name]||'')+' '+cn(c)}</button>)}
      </div>

      <div className="grid">
        {items.map(p=><div className="card prod" key={p.id} onClick={()=>setDet(p)}>
          <Thumb p={p}/>
          <div className="pbody">
            <PriceTag p={p}/>
            <div className="name">{pn(p)}</div>
            <div className="pfoot">{actionBtn(p)}</div>
          </div>
        </div>)}
      </div>
      {loading&&!items.length&&<div className="center" style={{minHeight:160}}>{t("Yuklanmoqda…")}</div>}
      {!loading&&!items.length&&<div className="center" style={{minHeight:160}}>{t("Hech narsa topilmadi")}</div>}
      {more&&<button className="btn g" style={{marginTop:12}} onClick={()=>load(pg+1,false)}>{t("Yana")}</button>}
    </>}

    {sh&&<WeightSheet p={sh} cur={cart[keyOf(sh)]} close={()=>setSh(null)} set={v=>{put(sh,v);setSh(null)}}/>}
    {det&&<Detail p={det} cart={cart} put={put} close={()=>setDet(null)} onWeight={setSh}/>}
    {bdet&&<BundleDetail b={bdet} cart={cart} put={put} close={()=>setBdet(null)}/>}
    {vid&&<div className="sheet" onClick={()=>setVid(null)}><div onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><div className="yt"><iframe src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(location.origin)}`} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><a className="btn g" style={{marginTop:10,display:'block',textAlign:'center',textDecoration:'none'}} href={`https://youtu.be/${vid}`} target="_blank" rel="noreferrer">YouTube ↗</a><button className="btn g" style={{marginTop:8}} onClick={()=>setVid(null)}>✕</button></div></div>}
  </>
}

function Promo({d,cart,setCart}){
  const {t,so,pn,cn}=useLang()
  const tree=buildCatTree(d.cats)
  const [cat,setCat]=useState(''),[items,setItems]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[loading,setLoading]=useState(true),[sh,setSh]=useState(null),[det,setDet]=useState(null)
  const load=useCallback((n,reset)=>{
    setLoading(true)
    api(`/api/products?sale=1&cat=${encodeURIComponent(cat)}&page=${n}`)
      .then(r=>{setItems(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)})
      .catch(()=>{}).finally(()=>setLoading(false))
  },[cat])
  useEffect(()=>{load(0,true)},[load])
  const put=(p,v)=>setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})
  const st=e=>e.stopPropagation()
  const actionBtn=p=>{
    const it=cart[keyOf(p)]
    if(p.unit==='weight')return <button className={'add-full'+(it?' weight-in':'')} onClick={e=>{st(e);setSh(p)}}>{it?so(lsum(p,it)):'+ '+t("Savatga")}</button>
    if(it)return <QtyControl qty={it.qty} max={500} onChange={n=>put(p,n>0?{qty:n}:null)}/>
    return <button className="add-full" onClick={e=>{st(e);put(p,{qty:1})}}>+ {t("Savatga")}</button>
  }
  return <>
    <div className="sale-hero">
      <h1>🔥 {t("Aksiya va chegirmalar")}</h1>
      <p>{t("Chegirmali mahsulotlar — vaqt tugaguncha ulguring!")}</p>
    </div>
    <div className="chips">
      <button className={'chip'+(!cat?' on':'')} onClick={()=>setCat('')}>{t("Hammasi")}</button>
      {tree.roots.map(c=><button key={c.name} className={'chip'+(cat===c.name?' on':'')} onClick={()=>setCat(c.name)}>{(EMO[c.name]||'')+' '+cn(c)}</button>)}
    </div>
    <div className="grid">
      {items.map(p=><div className="card prod" key={p.id} onClick={()=>setDet(p)}>
        <Thumb p={p}/>
        <div className="pbody">
          <PriceTag p={p}/>
          <div className="name">{pn(p)}</div>
          <div className="pfoot">{actionBtn(p)}</div>
        </div>
      </div>)}
    </div>
    {loading&&!items.length&&<div className="center" style={{minHeight:160}}>{t("Yuklanmoqda…")}</div>}
    {!loading&&!items.length&&<div className="center" style={{minHeight:180}}>{t("Hozircha aksiya mahsulotlari yo'q")}</div>}
    {more&&<button className="btn g" style={{marginTop:12}} onClick={()=>load(pg+1,false)}>{t("Yana")}</button>}
    {sh&&<WeightSheet p={sh} cur={cart[keyOf(sh)]} close={()=>setSh(null)} set={v=>{put(sh,v);setSh(null)}}/>}
    {det&&<Detail p={det} cart={cart} put={put} close={()=>setDet(null)} onWeight={setSh}/>}
  </>
}

function Catalog({d,go}){
  const {t,cn}=useLang()
  const tree=buildCatTree(d.cats)
  return <>
    <h1>{t("Katalog")}</h1>
    <div className="cat-grid">
      {tree.roots.map((c,i)=>{
        const subCount=tree.childrenOf(c.name).length
        return <div
          key={c.name}
          className={'cat-tile'+(c.image?' has-bg':'')}
          style={c.image?{backgroundImage:`url(${c.image})`}:{background:CAT_BG[i%CAT_BG.length]}}
          onClick={()=>go(c.name)}
        >
          <b>{cn(c)}</b>
          {subCount>0&&<span className="cat-sub-badge">{subCount} {t("bo'lim")}</span>}
          {!c.image&&<span className="cat-emo">{EMO[c.name]||'🛒'}</span>}
        </div>
      })}
    </div>
  </>
}

function Cart({d,cart,setCart,act,done}){
  const {t,so,pn}=useLang()
  const [type,setType]=useState('pickup'),[addr,setAddr]=useState(''),[rec,setRec]=useState([]),[sh,setSh]=useState(null)
  const lines=Object.entries(cart).map(([k,v])=>({k,p:v.p,v})),dl=d.settings.delivery
  const sub=lines.reduce((s,{p,v})=>s+lsum(p,v),0),age=Math.max(0,...lines.map(l=>l.p.age_min||0))
  const prods=lines.filter(l=>!l.p.bundle),cats=[...new Set(prods.map(l=>l.p.category))].join('|'),ex=prods.map(l=>l.p.id).join(',')
  useEffect(()=>{if(!cats){setRec([]);return}api(`/api/recommend?cats=${encodeURIComponent(cats)}&ex=${ex}`).then(setRec).catch(()=>{})},[cats,ex])
  const put=(p,v)=>setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})
  if(!lines.length)return <div className="center" style={{minHeight:300}}>{t("🛒 Savat bo'sh")}</div>
  const minT=dl.minTotal||0,ok=type==='pickup'||(sub>=minT&&addr.trim().length>=5)
  return <>
    <h1>{t("Savat")}</h1>
    <div className="card">
      {lines.map(({k,p,v})=><div className="cart-item" key={k}>
        <div className="gap" style={{alignItems:'center',flexWrap:'nowrap',minWidth:0,flex:1}} onClick={()=>p.unit==='weight'&&setSh(p)}>
          <Thumb p={p} cls="ci sm"/>
          <div style={{minWidth:0}}>
            <b style={{fontSize:13.5,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pn(p)}{p.age_min>0&&<span className="age2">{p.age_min}+</span>}</b>
            <div className="m">{v.sum?`≈ ${(v.sum/effPrice(p)).toFixed(3)} kg`:v.grams?`${v.grams} g`:`${so(effPrice(p))} × ${v.qty}`}</div>
            <b style={{fontSize:14,color:'var(--b)'}}>{so(lsum(p,v))}</b>
          </div>
        </div>
        <div style={{textAlign:'right',flex:'none'}}>
          {p.unit==='weight'?<button className="btn s g" onClick={()=>setSh(p)}>✎</button>
            :<QtyControl qty={v.qty} max={p.bundle?20:500} variant="soft compact" onChange={n=>put(p,n>0?{qty:n}:null)}/>}
          <div><button className="del-btn" onClick={()=>put(p,null)}>{t("O'chirish")}</button></div>
        </div>
      </div>)}
    </div>

    {rec.length>0&&<>
      <div className="sec-head"><h2 className="sec">{t("Yana nimadir olasizmi?")}</h2></div>
      <div className="hrow">{rec.map(p=><div className="card bun" style={{flex:'0 0 144px',width:144}} key={p.id}>
        <Thumb p={p}/>
        <div className="bun-body">
          <PriceTag p={p}/>
          <div className="bun-title" style={{fontSize:12}}>{pn(p)}</div>
          <div className="pfoot"><button className="add-full" style={{height:32,fontSize:12}} onClick={()=>put(p,{qty:1})}>+ {t("Savatga")}</button></div>
        </div>
      </div>)}</div>
    </>}

    <div className="seg"><button className={type==='pickup'?'on':''} onClick={()=>setType('pickup')}>{t("🏃 Olib ketish")}</button>
      {dl.enabled&&<button className={type==='delivery'?'on':''} onClick={()=>setType('delivery')}>{t("🚚 Yetkazib berish")}</button>}</div>
    {type==='delivery'&&<div className="card">
      {(()=>{const past=[...new Set([...loadAddrs(),...d.orders.filter(o=>o.user_id==d.user.telegramId&&o.type==='delivery'&&o.address).map(o=>o.address.trim())])].filter(Boolean).slice(0,5);return past.length>0&&<div className="addr-pick">{past.map(a=><button key={a} type="button" className={'chip'+(addr===a?' on':'')} onClick={()=>setAddr(a)}>📍 {a.length>26?a.slice(0,26)+'…':a}</button>)}</div>})()}
      <textarea className="in" rows={2} placeholder={t("Manzil (ko'cha, uy, mo'ljal)")} value={addr} onChange={e=>setAddr(e.target.value)}/>
      <div className="m">📞 Buyurtmadan keyin administrator telefon orqali bog'lanib tasdiqlaydi.{minT>0&&` Minimal summa: ${so(minT)}.`} {dl.note}</div>
      {sub<minT&&<div style={{color:'#BE123C',fontSize:13,marginTop:4,fontWeight:600}}>Yana {so(minT-sub)} kerak</div>}</div>}
    <div className="card"><div className="row"><span>{t("Mahsulotlar")}</span><b>{so(sub)}</b></div>
      <div className="row" style={{fontSize:17}}><b>{t("Jami")}</b><b style={{color:'#E11D48'}}>{so(sub)}</b></div>
      {d.user.cardStatus==='active'&&d.user.cardNumber&&<div className="m" style={{color:'#B91C1C',fontWeight:600}}>💳 {t("Diskont karta")}: {d.user.cardNumber} (2% {t("keshbek")})</div>}
      {lines.some(l=>l.v.sum)&&<div className="m">⚖️ Og'irlikli tovarlar tortilgach narx o'zgarsa, tasdiqlashingiz so'raladi.</div>}
      {age>0&&<div className="m">{t("🔞 Yosh tasdig'i botda so'raladi.")}</div>}</div>
    <button className="btn" disabled={!ok} onClick={()=>act(async()=>{
      if(type==='delivery'&&addr.trim().length>=5){const cur=loadAddrs();if(!cur.includes(addr.trim()))saveAddrs([addr.trim(),...cur])}
      await api('/api/orders','POST',{items:lines.map(({p,v})=>p.bundle?{bundleId:p.id,qty:v.qty}:{productId:p.id,...(v.sum?{sum:v.sum}:v.grams?{grams:v.grams}:{qty:v.qty})}),type,address:addr});setCart({});done()
    },'Buyurtma yuborildi ✅')}>{t("Buyurtma berish")}</button>
    {sh&&<WeightSheet p={sh} cur={cart[keyOf(sh)]} close={()=>setSh(null)} set={v=>{put(sh,v);setSh(null)}}/>}
  </>
}

function Orders({d,act}){
  const {t,so}=useLang()
  const [ed,setEd]=useState(null),mine=d.orders.filter(o=>o.user_id==d.user.telegramId),post=(o,p,b,m)=>act(()=>api(`/api/orders/${o.id}/${p}`,'POST',b),m)
  if(!mine.length)return <div className="center" style={{minHeight:300}}>{t("Buyurtmalar yo'q")}</div>
  return <><h1>{t("Buyurtmalarim")}</h1>{mine.map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id}</b><Badge s={o.status}/></div>
    {o.created_at&&<div className="m" style={{marginBottom:6}}>{fmtDt(o.created_at)}</div>}
    {o.items.map(i=><div className="row" key={i.id}><span className="gap" style={{alignItems:'center',flexWrap:'nowrap'}}><Thumb p={{image:i.image,category:'Boshqa'}} cls="ci sm"/><span style={{fontSize:13}}>{i.name}{i.sub_status==='proposed'&&<b> → {i.sub_name}</b>}</span></span>
      {ed?.id===o.id&&i.unit==='piece'?<QtyControl qty={ed.ch[i.id]||0} max={500} variant="soft compact" onChange={n=>setEd({...ed,ch:{...ed.ch,[i.id]:n}})}/>:<span className="m">{so(i.actual_sum??i.ordered_sum)}</span>}</div>)}
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
  </div>)}</>
}

function DiscountCardSection({d,act,say}){
  const {t}=useLang()
  const u=d.user
  const [open,setOpen]=useState(false)
  const [fullName,setFullName]=useState(u.cardFullName||u.name||'')
  const [phone,setPhone]=useState(u.cardPhone||(u.phone?'+'+u.phone:''))
  const [address,setAddress]=useState(u.cardAddress||loadAddrs()[0]||'')

  if(u.cardStatus==='active'&&u.cardNumber){
    return <div className="dcard">
      <div className="dcard-head">
        <span className="dcard-brand">💳 TEGEN {t("Diskont karta")}</span>
        <span className="dcard-cb">✨ {t("2% keshbek")}</span>
      </div>
      <div className="dcard-bar">
        <BarcodeSvg value={u.cardNumber}/>
        <div className="dcard-num">{u.cardNumber}</div>
      </div>
      <div className="dcard-foot">
        <span style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.cardFullName||u.name}</span>
        <button className="dcard-copy" onClick={()=>copyText(u.cardNumber,()=>say(t("Nusxalandi ✅")))}>📋 {t("Nusxalash")}</button>
      </div>
      <div style={{fontSize:11,opacity:.86,marginTop:8}}>{t("Har zakazda karta raqamingiz yuboriladi va 2% keshbek qo'shiladi")}</div>
    </div>
  }

  if(u.cardStatus==='pending'){
    return <div className="card" style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>
      <div className="row" style={{marginTop:0}}><b>💳 TEGEN {t("Diskont karta")}</b><span className="badge amber">⏳ {t("Tasdiq kutilmoqda")}</span></div>
      <div className="m">{t("Arizangiz ko'rib chiqilmoqda")}: <b>{u.cardFullName}</b> · {u.cardPhone} · {u.cardAddress}</div>
    </div>
  }

  return <div className="dcard" style={{paddingBottom:open?14:16}}>
    <div className="dcard-head" style={{marginBottom:8}}>
      <span className="dcard-brand">💳 TEGEN {t("Diskont karta")}</span>
      <span className="dcard-cb">✨ {t("2% keshbek")}</span>
    </div>
    <div style={{fontSize:12.5,opacity:.92,marginBottom:10}}>{t("Har zakazda karta raqamingiz yuboriladi va 2% keshbek qo'shiladi")}</div>
    {!open?<button className="dcard-copy" style={{width:'100%',padding:'10px 14px',fontSize:13.5,background:'#fff',color:'var(--b7)'}} onClick={()=>setOpen(true)}>+ {t("Diskont kartaga ariza berish")}</button>
    :<div style={{background:'#fff',color:'var(--t)',borderRadius:16,padding:12}}>
      <input className="in" placeholder={t("Ism va familiya")} value={fullName} onChange={e=>setFullName(e.target.value)}/>
      <input className="in" type="tel" placeholder={t("Telefon raqam")} value={phone} onChange={e=>setPhone(e.target.value)}/>
      <input className="in" placeholder={t("Yashash manzili")} value={address} onChange={e=>setAddress(e.target.value)}/>
      <div className="gap">
        <button className="btn s" style={{flex:1}} onClick={()=>act(async()=>{await api('/api/card/apply','POST',{fullName,phone,address});setOpen(false)},t("Ariza yuborildi ✅"))}>{t("Ariza yuborish")}</button>
        <button className="btn s g" onClick={()=>setOpen(false)}>{t("Bekor")}</button>
      </div>
    </div>}
  </div>
}

function Profile({d,go,onToggleLang,cart,setCart,say,act}){
  const {lang,t,so,pn}=useLang()
  const [hf,setHf]=useState('all'),[openId,setOpenId]=useState(null),[showAddrs,setShowAddrs]=useState(false),[showHelp,setShowHelp]=useState(false)
  const [addrs,setAddrs]=useState(()=>loadAddrs()),[newAddr,setNewAddr]=useState('')

  const mine=d.orders.filter(o=>o.user_id==d.user.telegramId)
  const valid=mine.filter(o=>o.status!=='cancelled')
  const active=mine.filter(o=>!['completed','cancelled'].includes(o.status))
  const spent=valid.reduce((s,o)=>s+o.total,0)
  const staff=d.role!=='user'
  const photo=tg?.initDataUnsafe?.user?.photo_url

  const tier=valid.length>=15?{l:t('VIP mijoz'),c:'amber'}:valid.length>=5?{l:t('Doimiy mijoz'),c:'green'}:{l:t('Yangi mijoz'),c:'blue'}

  const freqMap=new Map()
  for(const o of valid){
    for(const i of (o.items||[])){
      if(!i.product_id||i.active===false||i.unit!=='piece')continue
      const cur=freqMap.get(i.product_id)||{cnt:0,p:{id:i.product_id,name:i.name,name_uz:i.name_uz,price:i.cur_price||i.unit_price,sale_price:i.sale_price,sale_until:i.sale_until,unit:i.unit,image:i.image,category:i.category||'Boshqa',age_min:i.age_min||0,min_grams:i.min_grams||0}}
      cur.cnt+=Number(i.qty)||1
      freqMap.set(i.product_id,cur)
    }
  }
  const freq=[...freqMap.values()].sort((a,b)=>b.cnt-a.cnt).slice(0,8).map(x=>x.p)

  const put=(p,v)=>setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})

  const reorder=o=>{
    let added=0
    const next={...cart}
    for(const i of (o.items||[])){
      if(!i.product_id||i.active===false)continue
      const p={id:i.product_id,name:i.name,name_uz:i.name_uz,price:i.cur_price||i.unit_price,sale_price:i.sale_price,sale_until:i.sale_until,unit:i.unit,image:i.image,category:i.category||'Boshqa',age_min:i.age_min||0,min_grams:i.min_grams||0}
      if(!p.price)continue
      if(p.unit==='piece'){
        const qty=Math.max(1,Math.min(500,Math.round(Number(i.qty)||1)))
        next[keyOf(p)]={p,qty};added++
      }else if(p.unit==='weight'&&!(p.min_grams>0)){
        const sum=Math.max(1000,Math.round(Number(i.ordered_sum)||10000))
        next[keyOf(p)]={p,sum};added++
      }
    }
    if(!added){say(t("Bu buyurtmada faol mahsulot topilmadi"));return}
    setCart(next);say(t("Savatga qo'shildi ✅"));go('cart')
  }

  const pastAddrs=[...new Set([...addrs,...mine.filter(o=>o.type==='delivery'&&o.address).map(o=>o.address.trim())])].filter(Boolean)
  const addAddress=()=>{
    const a=newAddr.trim();if(a.length<5)return
    const next=[a,...addrs.filter(x=>x!==a)]
    setAddrs(next);saveAddrs(next);setNewAddr('');say('Saqlandi')
  }
  const delAddress=a=>{
    const next=addrs.filter(x=>x!==a)
    setAddrs(next);saveAddrs(next)
  }

  const hist=mine.filter(o=>hf==='all'||(hf==='active'?!['completed','cancelled'].includes(o.status):o.status==='completed')).slice(0,8)
  const dl=d.settings.delivery

  return <>
    <div className="card prof-hero">
      <div className="prof-top">
        {photo?<img className="av-pic" src={photo} alt=""/>:<div className="av">{(d.user.name||'?')[0]}</div>}
        <div className="prof-meta">
          <b>{d.user.name}</b>
          <div className="m">{fmtPhone(d.user.phone)}</div>
          <div className="prof-badges">
            <span className={'badge '+tier.c}>{tier.l}</span>
            {staff&&<span className="badge red">{d.role}</span>}
          </div>
        </div>
      </div>
      <div className="prof-stats">
        <div className="pstat" onClick={()=>go('orders')}><span>{t("Buyurtmalar")}</span><b>{valid.length} {t("ta")}</b></div>
        <div className="pstat hi"><span>{t("Jami xarid")}</span><b>{so(spent)}</b></div>
        <div className="pstat" onClick={()=>go('orders')}><span>{t("Faol buyurtmalar")}</span><b>{active.length}</b></div>
      </div>
    </div>

    <DiscountCardSection d={d} act={act} say={say}/>

    {staff&&<button className="btn" style={{marginBottom:12}} onClick={()=>go('admin')}>⚙️ {t("Boshqaruv")}</button>}

    {freq.length>0&&<>
      <div className="sec-head"><h2 className="sec">⭐ {t("Tez-tez olinadiganlar")}</h2></div>
      <div className="hrow">{freq.map(p=>{
        const it=cart[keyOf(p)]
        return <div className="card bun" style={{flex:'0 0 144px',width:144}} key={p.id}>
          <Thumb p={p}/>
          <div className="bun-body">
            <PriceTag p={p}/>
            <div className="bun-title" style={{fontSize:12}}>{pn(p)}</div>
            <div className="pfoot">
              {it?<QtyControl qty={it.qty} max={500} onChange={n=>put(p,n>0?{qty:n}:null)}/>
                :<button className="add-full" style={{height:32,fontSize:12}} onClick={()=>put(p,{qty:1})}>+ {t("Savatga")}</button>}
            </div>
          </div>
        </div>
      })}</div>
    </>}

    <div className="sec-head">
      <h2 className="sec">🧾 {t("Buyurtmalar tarixi")}</h2>
      {mine.length>0&&<button className="sec-link" onClick={()=>go('orders')}>{t("Barchasini ko'rish")} ›</button>}
    </div>
    {mine.length>0?<>
      <div className="chips">
        {[['all','Hammasi'],['active','Faol buyurtmalar'],['done','Yakunlangan']].map(([k,l])=><button key={k} className={'chip'+(hf===k?' on':'')} onClick={()=>setHf(k)}>{t(l)}</button>)}
      </div>
      {hist.map(o=>{
        const open=openId===o.id
        return <div className="card oh-card" key={o.id} onClick={()=>setOpenId(open?null:o.id)}>
          <div className="oh-head">
            <div><b>#{o.id}</b> <span className="m">{fmtDt(o.created_at)}</span></div>
            <Badge s={o.status}/>
          </div>
          <div className="oh-sub">
            <span className="m">{o.type==='delivery'?'🚚 '+t("Yetkazib berish"):'🏃 '+t("🏃 Olib ketish").replace('🏃 ','')} · {(o.items||[]).length} {t("ta")}</span>
            <b>{so(o.total)}</b>
          </div>
          {open&&<div className="oh-items" onClick={e=>e.stopPropagation()}>
            {(o.items||[]).map(i=><div className="oh-row" key={i.id}>
              <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.name} <span className="m">{i.unit==='weight'?`${Number(i.qty).toFixed(2)} kg`:`× ${Number(i.qty)}`}</span></span>
              <span className="m">{so(i.actual_sum??i.ordered_sum)}</span>
            </div>)}
            {o.address&&<div className="m" style={{marginTop:6}}>📍 {o.address}</div>}
            {o.status==='ready'&&<div className="row" style={{marginTop:6}}><span>{t("Olib ketish kodi")}</span><b style={{color:'var(--b)',fontSize:17}}>{o.code}</b></div>}
            <div className="gap" style={{marginTop:10}}>
              <button className="btn s" style={{flex:1}} onClick={()=>reorder(o)}>🔁 {t("Qayta buyurtma")}</button>
              <button className="btn s g" onClick={()=>go('orders')}>{t("Barcha buyurtmalar")} ›</button>
            </div>
          </div>}
        </div>
      })}
      {!hist.length&&<div className="card"><div className="m" style={{textAlign:'center',padding:8}}>{t("Buyurtmalar yo'q")}</div></div>}
    </>:<div className="card"><div className="m" style={{textAlign:'center',padding:10}}>{t("Buyurtmalar yo'q")}</div></div>}

    <div className="card menu-card">
      <div className="menu-row" onClick={onToggleLang}>
        <div className="menu-l"><span className="menu-ico">🌐</span><div><b>Til / Язык</b><small>{lang==='ru'?'Русский':"O'zbekcha"}</small></div></div>
        <span className="btn s g">{lang==='ru'?"🇺🇿 O'zbekcha":'🇷🇺 Русский'}</span>
      </div>
      <div className="menu-row" onClick={()=>setShowAddrs(v=>!v)}>
        <div className="menu-l"><span className="menu-ico">📍</span><div><b>{t("Saqlangan manzillar")}</b><small>{pastAddrs.length} {t("ta")}</small></div></div>
        <span className="m" style={{fontSize:18}}>{showAddrs?'⌄':'›'}</span>
      </div>
      {showAddrs&&<div style={{padding:'6px 0 10px'}}>
        {pastAddrs.map(a=><div className="addr-row" key={a}>
          <span style={{fontSize:13,flex:1}}>📍 {a}</span>
          {addrs.includes(a)&&<button className="btn s g" onClick={()=>delAddress(a)}>🗑</button>}
        </div>)}
        {!pastAddrs.length&&<div className="m" style={{marginBottom:8}}>{t("Manzillar yo'q")}</div>}
        <div className="gap" style={{marginTop:8}}>
          <input className="in" style={{flex:1,margin:0}} placeholder={t("Yangi manzil (masalan: Uy, ko'cha, kvartira)")} value={newAddr} onChange={e=>setNewAddr(e.target.value)}/>
          <button className="btn s" onClick={addAddress}>+</button>
        </div>
      </div>}
      {(()=>{const sup=d.settings.support||{},supUser=String(sup.username||'').replace(/^@+/,'').trim(),supPhone=String(sup.phone||'').trim();
        const openTg=()=>{const url=`https://t.me/${supUser}`;if(tg?.openTelegramLink)tg.openTelegramLink(url);else window.open(url,'_blank','noopener,noreferrer')};
        return <>
          <div className="menu-row" onClick={()=>setShowHelp(v=>!v)}>
            <div className="menu-l"><span className="menu-ico">💬</span><div><b>{t("Qo'llab-quvvatlash")}</b><small>{supUser?`@${supUser}`:'TEGEN Market'}</small></div></div>
            <span className="m" style={{fontSize:18}}>{showHelp?'⌄':'›'}</span>
          </div>
          {showHelp&&<div style={{padding:'6px 0 10px'}}>
            <div className="m" style={{marginBottom:8}}>{supUser?`${t("Operator bilan bog'lanish")}: @${supUser}`:t("Operator bilan bog'lanish uchun botga xabar yozing")}</div>
            <div className="m" style={{marginBottom:8}}>🚚 {dl.enabled?`${t("Yetkazish yoqilgan")}${dl.minTotal?` · ${t("Minimal")}: ${so(dl.minTotal)}`:''}`:t("Yetkazish o'chirilgan")}{dl.note?` · ${dl.note}`:''}</div>
            <div className="gap">
              {supUser&&<button className="btn s" style={{flex:1}} onClick={openTg}>✈️ {t("Telegramda yozish")} (@{supUser})</button>}
              {supPhone&&<a className="btn s g" style={{textDecoration:'none'}} href={`tel:${supPhone.replace(/[^\d+]/g,'')}`}>📞 {supPhone}</a>}
              {!supUser&&tg?.close&&<button className="btn s g" onClick={()=>tg.close()}>💬 {t("Bot chatiga o'tish")}</button>}
            </div>
          </div>}
        </>})()}
    </div>
  </>
}

function DateRangeBar({per,setPer,from,setFrom,to,setTo,ft,setFt,tt,setTt}){
  const {t}=useLang()
  const pick=k=>{
    setPer(k)
    if(k!=='c'){
      const f=k==='0'?iso(0):iso(+k)
      const t0=iso(0)
      setFrom(f);setTo(t0);setFt(fmt(f));setTt(fmt(t0))
    }
  }
  const di=(txt,setTxt,setIso)=><span className="dt">
    <input className="in" style={{margin:0}} type="text" inputMode="numeric" placeholder="KK.OO.YYYY" value={txt} onChange={e=>{setTxt(e.target.value);const p=parseDate(e.target.value);if(p)setIso(p)}}/>
    <input type="date" value={parseDate(txt)||''} onChange={e=>{if(e.target.value){setIso(e.target.value);setTxt(fmt(e.target.value))}}}/>
  </span>
  return <>
    <div className="chips">{[['0','1 kun'],['7','1 hafta'],['30','1 oy'],['365','1 yil'],['c','Sana']].map(([k,l])=><button key={k} className={'chip'+(per===k?' on':'')} onClick={()=>pick(k)}>{t(l)}</button>)}</div>
    {per==='c'&&<div className="gap" style={{marginBottom:10,flexWrap:'nowrap'}}>{di(ft,setFt,setFrom)}<span style={{alignSelf:'center',color:'var(--m)'}}>→</span>{di(tt,setTt,setTo)}</div>}
  </>
}

function Dash(){
  const {t,so}=useLang()
  const [per,setPer]=useState('7'),[from,setFrom]=useState(iso(7)),[to,setTo]=useState(iso(0)),[ft,setFt]=useState(fmt(iso(7))),[tt,setTt]=useState(fmt(iso(0)))
  const [s,setS]=useState(null),[loading,setLoading]=useState(true)
  useEffect(()=>{
    setLoading(true)
    api(`/api/stats?from=${from}&to=${to}`).then(setS).catch(()=>{}).finally(()=>setLoading(false))
  },[from,to])

  const days=s?.days||[],mx=Math.max(1,...days.map(x=>+x.sum)),W=320,H=124
  const pts=days.map((x,i)=>[days.length>1?12+i*((W-24)/(days.length-1)):W/2,H-12-(+x.sum/mx)*(H-28)])
  const line=pts.map(p=>p.join(',')).join(' ')
  const area=pts.length>1?`${pts[0][0]},${H-12} ${line} ${pts[pts.length-1][0]},${H-12}`:''
  const tot=(s?.byCat||[]).reduce((a,x)=>a+Number(x.s),0)||1
  const COL=['#E11D48','#F59E0B','#10B981','#3B82F6','#8B5CF6','#6B7280']
  let acc=0

  return <>
    <DateRangeBar per={per} setPer={setPer} from={from} setFrom={setFrom} to={to} setTo={setTo} ft={ft} setFt={setFt} tt={tt} setTt={setTt}/>
    {!s?<div className="center" style={{minHeight:180}}>{t("Yuklanmoqda…")}</div>:<div style={{opacity:loading?.6:1,transition:'opacity .15s'}}>
      <div className="kpi">
        <div className="card kp"><span className="ico">💰</span><span className="m">{t("Jami tushum")}</span><b>{so(s.totals.revenue)}</b><em className="muted">{t("O'rtacha chek")}: {so(s.totals.avg_check)}</em></div>
        <div className="card kp"><span className="ico">🛍</span><span className="m">{t("Buyurtmalar")}</span><b>{s.totals.valid_orders??s.totals.orders} {t("ta")}</b><em>{s.totals.pending?`${s.totals.pending} ${t("kutilmoqda")}`:`${s.totals.cancelled||0} ${t("bekor")}`}</em></div>
        <div className="card kp"><span className="ico">👥</span><span className="m">{t("Mijozlar")}</span><b>{s.customers}</b><em>+{s.newCustomers||0} {t("yangi")}</em></div>
        <div className="card kp"><span className="ico">📦</span><span className="m">{t("Mahsulotlar")}</span><b>{s.products.total}</b><em className="muted">{s.products.active} {t("faol")}</em></div>
      </div>

      <div className="card">
        <div className="row" style={{marginTop:0}}>
          <h2 style={{margin:0}}>{t("Savdo dinamikasi")}</h2>
          <span className="m">{s.granularity==='hour'?t("Bugun (soatbay)"):`${fmt(from)} — ${fmt(to)}`}</span>
        </div>
        {days.length>0?<div className="chart-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} className="chart">
            {[0.25,0.5,0.75,1].map(k=><line key={k} x1="12" x2={W-12} y1={H-12-k*(H-28)} y2={H-12-k*(H-28)} stroke="#F3F4F6" strokeWidth="1"/>)}
            {area&&<polygon points={area} fill="#E11D4816"/>}
            {pts.length>1&&<polyline points={line} fill="none" stroke="#E11D48" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"/>}
            {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={pts.length===1?5:3.2} fill="#E11D48"/>)}
          </svg>
          <div className="chart-axis">
            <span>{s.granularity==='hour'?days[0].d:fmt(days[0].d)}</span>
            {days.length>2&&<span>{s.granularity==='hour'?days[Math.floor(days.length/2)].d:fmt(days[Math.floor(days.length/2)].d)}</span>}
            {days.length>1&&<span>{s.granularity==='hour'?days[days.length-1].d:fmt(days[days.length-1].d)}</span>}
          </div>
        </div>:<div className="m" style={{padding:'20px 0',textAlign:'center'}}>{t("Ma'lumot yo'q")}</div>}
      </div>

      {s.byCat.length>0&&<div className="card">
        <h2>{t("Kategoriyalar bo'yicha")}</h2>
        <div className="donut-wrap">
          <svg viewBox="-1 -1 2 2" className="donut" style={{transform:'rotate(-90deg)'}}>
            {s.byCat.length===1?<circle r="1" fill={COL[0]}/>:s.byCat.map((x,i)=>{
              const a=acc/tot*2*Math.PI;acc+=Number(x.s);const b=acc/tot*2*Math.PI
              return <path key={i} d={`M ${Math.cos(a)} ${Math.sin(a)} A 1 1 0 ${b-a>Math.PI?1:0} 1 ${Math.cos(b)} ${Math.sin(b)} L 0 0`} fill={COL[i%6]}/>
            })}
            <circle r=".58" fill="#fff"/>
          </svg>
          <div style={{flex:1,minWidth:0}}>
            {s.byCat.map((x,i)=><div className="row" key={i} style={{margin:'5px 0'}}>
              <span style={{fontSize:12.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}><i className="dot" style={{background:COL[i%6]}}/>{t(x.c)}</span>
              <span style={{textAlign:'right',flex:'none'}}><b style={{fontSize:12.5}}>{Math.round(Number(x.s)/tot*100)}%</b><span className="m" style={{display:'block',fontSize:10.5}}>{so(x.s)}</span></span>
            </div>)}
          </div>
        </div>
      </div>}
    </div>}
  </>
}

function AdminOrders({d,act,say}){
  const {t,so}=useLang()
  const [w,setW]=useState({}),[fee,setFee]=useState({}),[f,setF]=useState('all'),[sub,setSub]=useState(null),[sq,setSq]=useState(''),[res,setRes]=useState([]),dq=useDebounced(sq),list=d.orders.filter(o=>f==='all'||o.status===f),post=(o,p,b,m)=>act(()=>api(`/api/orders/${o.id}/${p}`,'POST',b),m)
  useEffect(()=>{if(!sub||dq.length<2){setRes([]);return}api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=on&page=0`).then(r=>setRes(r.items.slice(0,6))).catch(()=>{})},[dq,sub])
  return <><div className="chips">{['all','new','accepted','preparing','sub_pending','ready','completed','cancelled'].map(k=><button key={k} className={'chip'+(f===k?' on':'')} onClick={()=>setF(k)}>{k==='all'?t("Hammasi"):t(ST[k][0])}</button>)}</div>
  {list.map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id} · {o.code}</b><Badge s={o.status}/></div><div className="m">{o.name} · {o.type==='delivery'?'🚚 '+o.address:'🏃 olib ketish'}</div>
    <div className="gap" style={{alignItems:'center',margin:'6px 0'}}>
      <a className="btn s g" style={{textDecoration:'none'}} href={`tel:+${o.phone}`}>📞 +{o.phone}</a>
      {o.card_number&&<button type="button" className="order-card-pill" onClick={()=>copyText(o.card_number,()=>say(t("Nusxalandi ✅")))}>💳 {o.card_number} (2%) 📋</button>}
    </div>
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
  </div>)}</>
}

function ProductFields({f,setF,dept,tree,onPick,onSave,onCancel,saveLabel}){
  const {t,cn}=useLang()
  const set=k=>e=>setF({...f,[k]:e.target.value})
  return <>
    <input className="in" placeholder="Название (русский)" value={f.name} onChange={set('name')}/>
    <input className="in" placeholder="Nomi (o'zbekcha)" value={f.name_uz||''} onChange={set('name_uz')}/>
    <input className="in" inputMode="numeric" placeholder={t("Shtrixkod (ixtiyoriy)")} value={f.barcode||''} onChange={set('barcode')}/>
    <div className="gap">
      <input className="in" style={{flex:1}} type="text" inputMode="numeric" placeholder={t("Narx (dona yoki kg uchun)")} value={f.price} onChange={e=>setF({...f,price:digits(e.target.value)})}/>
      <select className="in" style={{flex:1}} value={f.unit} onChange={set('unit')}><option value="piece">Dona</option><option value="weight">Og'irlik (kg)</option></select>
    </div>
    <div className="sale-box">
      <div className="sale-box-t">
        <span>🔥 {t("Aksiya")} (ixtiyoriy)</span>
        {(f.sale_price||f.sale_until)&&<button type="button" className="sec-link" style={{fontSize:11.5}} onClick={()=>setF({...f,sale_price:'',sale_until:''})}>{t("Tozalash")}</button>}
      </div>
      <input className="in" type="text" inputMode="numeric" placeholder={`${t("Aksiya narxi")} (masalan: 15000)`} value={f.sale_price||''} onChange={e=>setF({...f,sale_price:digits(e.target.value)})}/>
      {Number(f.sale_price)>0&&<>
        <div className="chips" style={{paddingBottom:6}}>
          {[[1,'1 kun'],[3,'3 kun'],[7,'7 kun'],[30,'30 kun']].map(([days,lbl])=><button key={days} type="button" className="chip" style={{padding:'5px 10px',fontSize:11.5}} onClick={()=>setF({...f,sale_until:addDaysLocal(days)})}>+{lbl}</button>)}
        </div>
        <label className="m">{t("Tugash vaqti")}
          <input className="in" style={{marginTop:4,marginBottom:0}} type="datetime-local" value={f.sale_until||''} onChange={e=>setF({...f,sale_until:e.target.value})}/>
        </label>
      </>}
    </div>
    {f.unit==='weight'&&<input className="in" type="text" inputMode="numeric" placeholder="Minimal gramm (masalan 250). Bo'sh = summa bilan sotiladi" value={f.min_grams||''} onChange={e=>setF({...f,min_grams:digits(e.target.value)})}/>}
    <div className="gap">
      {!dept&&<select className="in" style={{flex:2}} value={f.category} onChange={set('category')}>{tree.flat.map(c=><option key={c.name} value={c.name}>{'\u00A0\u00A0'.repeat(c.depth)+(c.depth?'↳ ':'')+cn(c)}</option>)}</select>}
      <select className="in" style={{flex:1}} value={f.age_min||0} onChange={set('age_min')}><option value="0">Yosh: yo'q</option><option value="16">16+</option><option value="18">18+</option><option value="20">20+</option><option value="21">21+</option></select>
    </div>
    <textarea className="in" rows={2} placeholder="Tavsif (ixtiyoriy)" value={f.description||''} onChange={set('description')}/>
    <div className="gap" style={{alignItems:'center',marginBottom:8}}>
      {f.image&&<img src={f.image} style={{width:52,height:52,borderRadius:12,objectFit:'cover'}}/>}
      <label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm tanlash<input type="file" accept="image/*" hidden onChange={onPick}/></label>
    </div>
    <div className="gap">
      <button className="btn s" style={{flex:1}} onClick={onSave}>{saveLabel||t("Saqlash")}</button>
      {onCancel&&<button className="btn s g" onClick={onCancel}>{t("Bekor")}</button>}
    </div>
  </>
}

function Products({d,act}){
  const {t,so,cn}=useLang()
  const tree=buildCatTree(d.cats)
  const dept=d.role==='worker'?d.workerDepartment:null
  const e0={name:'',name_uz:'',description:'',barcode:'',price:'',sale_price:'',sale_until:'',unit:'piece',image:'',category:dept||d.categories[0],age_min:0,min_grams:0}
  const [addOpen,setAddOpen]=useState(false),[f,setF]=useState(e0),[ed,setEd]=useState(null)
  const [q,setQ]=useState(''),[st,setSt]=useState('all'),[cat,setCat]=useState('')
  const [list,setList]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[ver,setVer]=useState(0)
  const dq=useDebounced(q)
  const go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)

  const load=useCallback((n,reset)=>api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=${st}&cat=${encodeURIComponent(cat)}&page=${n}`).then(r=>{setList(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)}).catch(()=>{}),[dq,st,cat])
  useEffect(()=>{load(0,true)},[load,ver])

  const prepPayload=obj=>({...obj,sale_price:obj.sale_price?Number(obj.sale_price):null,sale_until:obj.sale_price&&obj.sale_until?new Date(obj.sale_until).toISOString():null})
  const pickFor=setter=>async e=>{const file=e.target.files[0];if(!file)return;try{const u=await upload(file);setter(x=>({...x,image:u}))}catch(er){alert(er.message)}}
  const saveNew=()=>go(async()=>{await api('/api/products','POST',prepPayload(f));setF({...e0,category:cat||e0.category});setAddOpen(false)},dept?'Adminga tasdiqlash uchun yuborildi':'Saqlandi')
  const saveEdit=()=>act(async()=>{
    const body=prepPayload(ed)
    await api(`/api/products/${ed.id}`,'PUT',body)
    if(!dept){
      const sp=body.sale_price&&body.sale_price>0&&body.sale_price<Math.round(Number(ed.price))?body.sale_price:null
      const updated={...ed,price:Math.round(Number(ed.price)),sale_price:sp,sale_until:sp?body.sale_until:null,min_grams:Math.round(Number(ed.min_grams))||0,age_min:Math.round(Number(ed.age_min))||0,barcode:String(ed.barcode||'').trim()||null,name_uz:String(ed.name_uz||'').trim()||null}
      setList(prev=>prev.map(x=>x.id===ed.id?{...x,...updated}:x))
    }
    setEd(null)
  },dept?'Adminga tasdiqlash uchun yuborildi':'Saqlandi')

  const curCatObj=tree.byName.get(cat)
  const activeRoot=curCatObj?.parent?curCatObj.parent:cat
  const subChips=activeRoot?tree.childrenOf(activeRoot):[]

  return <>
    {d.pendingProducts.length>0&&<div className="card"><h2>⏳ Tasdiqlash kutilmoqda</h2>{d.pendingProducts.map(r=><div className="row" key={r.id}><span className="row-txt">{r.action}: {r.product.name} <span className="m">({r.worker_name})</span></span>
      <span className="row-acts"><button className="btn s k" onClick={()=>go(()=>api('/api/changes/'+r.id,'POST',{approve:true}))}>✓</button><button className="btn s g" onClick={()=>go(()=>api('/api/changes/'+r.id,'POST',{approve:false}))}>✕</button></span></div>)}</div>}

    <div className="card" style={{padding:addOpen?14:10}}>
      <div className="row" style={{margin:0}}>
        <h2 style={{margin:0}}>➕ {t("Yangi mahsulot")}</h2>
        <button className="btn s g" onClick={()=>{if(!addOpen&&cat&&!dept)setF(x=>({...x,category:cat}));setAddOpen(o=>!o)}}>{addOpen?'✕':t("Qo'shish")}</button>
      </div>
      {addOpen&&<div style={{marginTop:10}}><ProductFields f={f} setF={setF} dept={dept} tree={tree} onPick={pickFor(setF)} onSave={saveNew} onCancel={()=>setAddOpen(false)}/></div>}
    </div>

    <input className="search search-plain" placeholder="🔍 Nomi yoki shtrixkod" value={q} onChange={e=>setQ(e.target.value)}/>
    <div className="chips">{[['all','Hammasi'],['on','Faol'],['off','Nofaol'],['sale','🔥 Aksiya']].map(([k,l])=><button key={k} className={'chip'+(st===k?' on':'')} onClick={()=>setSt(k)}>{k==='sale'?'🔥 '+t('Aksiya'):t(l)}</button>)}</div>

    {!dept&&<>
      <div className="chips">
        <button className={'chip'+(!cat?' on':'')} onClick={()=>setCat('')}>{t("Hammasi")}</button>
        {tree.roots.map(c=><button key={c.name} className={'chip'+(activeRoot===c.name?' on':'')} onClick={()=>setCat(c.name)}>{(EMO[c.name]||'')+' '+cn(c)}</button>)}
      </div>
      {subChips.length>0&&<div className="chips sub">
        <button className={'chip'+(cat===activeRoot?' on':'')} onClick={()=>setCat(activeRoot)}>{t("Hammasi")}</button>
        {subChips.map(sc=><button key={sc.name} className={'chip'+(cat===sc.name?' on':'')} onClick={()=>setCat(sc.name)}>{cn(sc)}</button>)}
      </div>}
    </>}

    {list.map(p=>{
      const onS=isSale(p)
      return <div className="card" key={p.id} style={{opacity:p.active||ed?.id===p.id?1:.55}}>
        <div className="row">
          <div className="row-txt">
            <b>{p.name}</b>
            {p.name_uz&&<div className="m">{p.name_uz}</div>}
            {p.age_min>0&&<span className="age2">{p.age_min}+</span>}
            <div className="m">
              {p.category} · {onS?<><s style={{marginRight:4}}>{so(p.price)}</s><b style={{color:'var(--b)'}}>{so(p.sale_price)} 🔥</b></>:so(p.price)}{p.unit==='weight'?' / kg':''}{p.barcode?` · #${p.barcode}`:''}
            </div>
            {onS&&p.sale_until&&<div style={{marginTop:3}}><Countdown until={p.sale_until} cls="badge red"/></div>}
          </div>
          <span className="row-acts">
            {!dept&&<label className="sw"><input type="checkbox" checked={p.active} onChange={e=>{
              const active=e.target.checked
              act(async()=>{
                await api(`/api/products/${p.id}/active`,'PUT',{active})
                setList(prev=>prev.map(x=>x.id===p.id?{...x,active}:x).filter(x=>st==='all'||st==='sale'||(st==='on'?x.active:!x.active)))
              })
            }}/><i/></label>}
            <button className={'btn s '+(ed?.id===p.id?'':'g')} onClick={()=>setEd(cur=>cur?.id===p.id?null:{...p,barcode:p.barcode||'',price:String(p.price||''),sale_price:p.sale_price?String(p.sale_price):'',sale_until:toLocalInput(p.sale_until),min_grams:p.min_grams||''})}>{ed?.id===p.id?'✕':'✎'}</button>
            {dept&&<button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api('/api/products/'+p.id,'DELETE'),"So'rov yuborildi")}>🗑</button>}
          </span>
        </div>
        {ed?.id===p.id&&<div className="inline-edit">
          <ProductFields f={ed} setF={setEd} dept={dept} tree={tree} onPick={pickFor(setEd)} onSave={saveEdit} onCancel={()=>setEd(null)}/>
        </div>}
        {d.warehouseEnabled&&d.role==='superadmin'&&<input className="in" style={{marginTop:8,marginBottom:0}} type="number" placeholder="Ombor qoldig'i" defaultValue={p.stock??''} onBlur={e=>{
          const val=e.target.value===''?null:e.target.value
          act(async()=>{await api(`/api/products/${p.id}/stock`,'PUT',{stock:val});setList(prev=>prev.map(x=>x.id===p.id?{...x,stock:val}:x))})
        }}/>}
      </div>
    })}
    {!list.length&&<div className="center" style={{minHeight:140}}>{t("Hech narsa topilmadi")}</div>}
    {more&&<button className="btn g" onClick={()=>load(pg+1,false)}>{t("Yana")}</button>}
  </>
}

function Banners({act}){
  const {t}=useLang()
  const e0={image:'',title:'',subtitle:'',link:''},[list,setList]=useState([]),[ver,setVer]=useState(0),[f,setF]=useState(e0),[ed,setEd]=useState(null),go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  useEffect(()=>{api('/api/content').then(r=>setList(r.banners)).catch(()=>{})},[ver])
  const pick=setter=>async e=>{const x=e.target.files[0];if(!x)return;try{const u=await upload(x);setter(o=>({...o,image:u}))}catch(er){alert(er.message)}}
  return <><div className="card"><h2>🖼 {t("Bannerlar")}</h2><div className="gap" style={{alignItems:'center',marginBottom:8}}>{f.image&&<img src={f.image} style={{width:96,height:48,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={pick(setF)}/></label></div>
    <input className="in" placeholder="Sarlavha" value={f.title} onChange={e=>setF({...f,title:e.target.value})}/><input className="in" placeholder="Qisqa izoh" value={f.subtitle} onChange={e=>setF({...f,subtitle:e.target.value})}/><input className="in" placeholder="Havola (ixtiyoriy, YouTube ham bo'ladi)" value={f.link} onChange={e=>setF({...f,link:e.target.value})}/>
    <button className="btn s" onClick={()=>go(async()=>{await api('/api/content/banners','POST',f);setF(e0)},'Saqlandi')}>+ Banner</button></div>
    {list.map(x=><div className="card bcard" key={x.id}><div className="bimg" style={{backgroundImage:`url(${x.image})`}}><span className={'badge '+(x.active?'green':'gray')}>{x.active?t("Faol"):t("Nofaol")}</span></div><b style={{display:'block',marginTop:8}}>{x.title||'—'}</b><div className="m">{x.subtitle}</div>
      <div className="row"><span className="row-acts"><label className="sw"><input type="checkbox" checked={x.active} onChange={e=>go(()=>api(`/api/content/banners/${x.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label><button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api(`/api/content/banners/${x.id}`,'DELETE'))}>{t("O'chirish")}</button></span><button className={'btn s '+(ed?.id===x.id?'':'g')} onClick={()=>setEd(cur=>cur?.id===x.id?null:{id:x.id,image:x.image,title:x.title||'',subtitle:x.subtitle||'',link:x.link||''})}>{ed?.id===x.id?'✕':'✎ Tahrirlash'}</button></div>
      {ed?.id===x.id&&<div className="inline-edit">
        <div className="gap" style={{alignItems:'center',marginBottom:8}}>{ed.image&&<img src={ed.image} style={{width:96,height:48,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={pick(setEd)}/></label></div>
        <input className="in" placeholder="Sarlavha" value={ed.title} onChange={e=>setEd({...ed,title:e.target.value})}/>
        <input className="in" placeholder="Qisqa izoh" value={ed.subtitle} onChange={e=>setEd({...ed,subtitle:e.target.value})}/>
        <input className="in" placeholder="Havola (ixtiyoriy)" value={ed.link} onChange={e=>setEd({...ed,link:e.target.value})}/>
        <div className="gap"><button className="btn s" onClick={()=>go(async()=>{await api(`/api/content/banners/${ed.id}`,'PUT',ed);setEd(null)},'Saqlandi')}>{t("Saqlash")}</button><button className="btn s g" onClick={()=>setEd(null)}>{t("Bekor")}</button></div>
      </div>}
    </div>)}</>
}

function Cats({d,act}){
  const {t,cn}=useLang()
  const tree=buildCatTree(d.cats)
  const e0={name:'',name_ru:'',image:'',sort:0,parent:''},[f,setF]=useState(e0),[ed,setEd]=useState(null)
  const pick=setter=>async e=>{const x=e.target.files[0];if(!x)return;try{const u=await upload(x);setter(o=>({...o,image:u}))}catch(er){alert(er.message)}}
  const addParentOpts=tree.flat.filter(c=>c.depth<2)
  return <div className="card"><h2>🗂 {t("Katalog")}</h2>
    <input className="in" placeholder="Nomi (o'zbekcha)" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
    <input className="in" placeholder="Название (русский)" value={f.name_ru||''} onChange={e=>setF({...f,name_ru:e.target.value})}/>
    <select className="in" value={f.parent||''} onChange={e=>setF({...f,parent:e.target.value})}>
      <option value="">{t("Asosiy kategoriya (yo'q)")}</option>
      {addParentOpts.map(c=><option key={c.name} value={c.name}>{'\u00A0\u00A0'.repeat(c.depth)+(c.depth?'↳ ':'')+cn(c)}</option>)}
    </select>
    <div className="gap" style={{alignItems:'center',marginBottom:8}}>{f.image&&<img src={f.image} style={{width:44,height:44,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={pick(setF)}/></label><input className="in" style={{width:90,margin:0}} type="text" inputMode="numeric" placeholder="Tartib" value={f.sort||''} onChange={e=>setF({...f,sort:digits(e.target.value)})}/></div>
    <button className="btn s" style={{marginBottom:8}} onClick={()=>act(async()=>{await api('/api/cats','POST',f);setF(e0)},'Saqlandi')}>+ Kategoriya</button>

    {tree.flat.map(c=>{
      const isEd=ed?.old===c.name
      const edParentOpts=isEd?tree.flat.filter(x=>x.name!==c.name&&x.parent!==c.name&&x.depth<2):[]
      return <div className="cat-row-wrap" key={c.name}>
        <div className="row" style={{paddingLeft:c.depth*16}}>
          <span className="row-txt">{c.depth>0&&<span className="m" style={{marginRight:4}}>↳</span>}{EMO[c.name]||(c.depth?'📁':'🛒')} {c.name}{c.name_ru&&<span className="m"> · {c.name_ru}</span>}</span>
          <span className="row-acts">
            <button className={'btn s '+(isEd?'':'g')} onClick={()=>setEd(isEd?null:{old:c.name,name:c.name,name_ru:c.name_ru||'',image:c.image||'',sort:c.sort||0,parent:c.parent||''})}>{isEd?'✕':'✎'}</button>
            <button className="btn s g" onClick={()=>confirm("O'chirilsinmi? Tovarlar 'Boshqa'ga o'tadi")&&act(()=>api('/api/cats/'+encodeURIComponent(c.name),'DELETE'))}>🗑</button>
          </span>
        </div>
        {isEd&&<div className="inline-edit">
          <input className="in" placeholder="Nomi (o'zbekcha)" value={ed.name} onChange={e=>setEd({...ed,name:e.target.value})}/>
          <input className="in" placeholder="Название (русский)" value={ed.name_ru||''} onChange={e=>setEd({...ed,name_ru:e.target.value})}/>
          <select className="in" value={ed.parent||''} onChange={e=>setEd({...ed,parent:e.target.value})}>
            <option value="">{t("Asosiy kategoriya (yo'q)")}</option>
            {edParentOpts.map(x=><option key={x.name} value={x.name}>{'\u00A0\u00A0'.repeat(x.depth)+(x.depth?'↳ ':'')+cn(x)}</option>)}
          </select>
          <div className="gap" style={{alignItems:'center',marginBottom:8}}>
            {ed.image&&<img src={ed.image} style={{width:44,height:44,borderRadius:10,objectFit:'cover'}}/>}
            <label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={pick(setEd)}/></label>
            <input className="in" style={{width:90,margin:0}} type="text" inputMode="numeric" placeholder="Tartib" value={ed.sort||''} onChange={e=>setEd({...ed,sort:digits(e.target.value)})}/>
          </div>
          <div className="gap">
            <button className="btn s" onClick={()=>act(async()=>{await api('/api/cats','POST',ed);setEd(null)},'Saqlandi')}>{t("Saqlash")}</button>
            <button className="btn s g" onClick={()=>setEd(null)}>{t("Bekor")}</button>
          </div>
        </div>}
      </div>
    })}
  </div>
}

function Customers(){
  const {t,so}=useLang()
  const [q,setQ]=useState(''),[l,setL]=useState([]),dq=useDebounced(q);useEffect(()=>{api('/api/customers?q='+encodeURIComponent(dq)).then(setL).catch(()=>{})},[dq])
  return <><input className="search search-plain" placeholder="🔍 Ism, telefon yoki karta raqami" value={q} onChange={e=>setQ(e.target.value)}/><div className="card"><h2>👥 {t("Mijozlar")} · {l.length}</h2>{l.map(c=><div className="row" key={c.tg_id}><div className="row-txt"><b>{c.name||c.tg_id}</b>{c.card_number&&<span className="badge red" style={{marginLeft:6}}>💳 {c.card_number}</span>}<div className="m">+{c.phone} · {c.orders} {t("ta")} · {so(c.spent)}</div></div><span className="row-acts"><a className="btn s g" style={{textDecoration:'none'}} href={`tel:+${c.phone}`}>📞</a></span></div>)}</div></>
}

function AdminCards({act,say}){
  const {t}=useLang()
  const [data,setData]=useState({pending:[],active:[]}),[ver,setVer]=useState(0),[nums,setNums]=useState({}),[man,setMan]=useState({tgId:'',cardNumber:''}),[q,setQ]=useState('')
  const go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  useEffect(()=>{api('/api/cards').then(setData).catch(()=>{})},[ver])
  const actList=data.active.filter(c=>!q||`${c.name||''} ${c.card_full_name||''} ${c.phone||''} ${c.card_number||''}`.toLowerCase().includes(q.toLowerCase()))
  return <>
    <div className="card">
      <h2>⏳ Kutilayotgan arizalar · {data.pending.length}</h2>
      {data.pending.map(u=><div key={u.tg_id} className="cat-row-wrap" style={{padding:'10px 0'}}>
        <div className="row" style={{marginTop:0}}>
          <div className="row-txt">
            <b>{u.card_full_name||u.name}</b>
            <div className="m">📞 {u.card_phone||u.phone} · ID: {u.tg_id}</div>
            <div className="m">📍 {u.card_address}</div>
          </div>
          <span className="row-acts"><a className="btn s g" style={{textDecoration:'none'}} href={`tel:${u.card_phone||u.phone}`}>📞</a></span>
        </div>
        <div className="gap" style={{marginTop:8}}>
          <input className="in" style={{flex:1,margin:0}} placeholder="Karta raqami (ichki dasturdan)" value={nums[u.tg_id]||''} onChange={e=>setNums({...nums,[u.tg_id]:e.target.value})}/>
          <button className="btn s k" onClick={()=>go(()=>api(`/api/cards/${u.tg_id}/approve`,'POST',{cardNumber:nums[u.tg_id]}),'Karta biriktirildi ✅')}>✓</button>
          <button className="btn s g" onClick={()=>confirm('Rad etilsinmi?')&&go(()=>api(`/api/cards/${u.tg_id}/reject`,'POST',{}),'Rad etildi')}>✕</button>
        </div>
      </div>)}
      {!data.pending.length&&<div className="m">Yangi arizalar yo'q</div>}
    </div>

    <div className="card">
      <h2>➕ Qo'lda karta biriktirish</h2>
      <div className="gap">
        <input className="in" style={{flex:1}} inputMode="numeric" placeholder="Telegram ID" value={man.tgId} onChange={e=>setMan({...man,tgId:digits(e.target.value)})}/>
        <input className="in" style={{flex:1}} placeholder="Karta raqami" value={man.cardNumber} onChange={e=>setMan({...man,cardNumber:e.target.value})}/>
      </div>
      <button className="btn s" onClick={()=>go(async()=>{await api(`/api/cards/${man.tgId}`,'PUT',{cardNumber:man.cardNumber});setMan({tgId:'',cardNumber:''})},'Karta biriktirildi ✅')}>Biriktirish</button>
    </div>

    <input className="search search-plain" placeholder="🔍 Karta raqami, ism yoki telefon" value={q} onChange={e=>setQ(e.target.value)}/>
    <div className="card">
      <h2>💳 Faol diskont kartalar · {actList.length}</h2>
      {actList.map(u=><div className="row" key={u.tg_id}>
        <div className="row-txt">
          <b>{u.card_full_name||u.name||u.tg_id}</b>
          <div className="m">💳 <b>{u.card_number}</b> · +{u.phone}</div>
        </div>
        <span className="row-acts">
          <button className="btn s g" onClick={()=>copyText(u.card_number,()=>say(t("Nusxalandi ✅")))}>📋</button>
          <button className="btn s g" onClick={()=>{const n=prompt('Yangi karta raqami (o‘chirish uchun bo‘sh qoldiring):',u.card_number);if(n!==null)go(()=>api(`/api/cards/${u.tg_id}`,'PUT',{cardNumber:n}),'Saqlandi')}}>✎</button>
        </span>
      </div>)}
      {!actList.length&&<div className="m">—</div>}
    </div>
  </>
}

function Content({d,act}){
  const {t,so}=useLang()
  const [c,setC]=useState({banners:[],videos:[],bundles:[]}),[ver,setVer]=useState(0),go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  const [vd,setVd]=useState({title:'',url:''}),[bd,setBd]=useState({title:'',title_ru:'',description:'',description_ru:'',price:'',image:'',items:[]}),[bq,setBq]=useState(''),[res,setRes]=useState([]),dq=useDebounced(bq)
  useEffect(()=>{api('/api/content').then(setC).catch(()=>{})},[ver])
  useEffect(()=>{if(dq.length<2){setRes([]);return}api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=on&page=0`).then(r=>setRes(r.items.slice(0,8))).catch(()=>{})},[dq])
  const img=(setter,o)=>async e=>{const f=e.target.files[0];if(!f)return;try{setter({...o,image:await upload(f)})}catch(er){alert(er.message)}}
  const row=(k,x,label)=><div className="row" key={x.id}><span className="row-txt">{label}</span><span className="row-acts"><label className="sw"><input type="checkbox" checked={x.active} onChange={e=>go(()=>api(`/api/content/${k}/${x.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label><button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api(`/api/content/${k}/${x.id}`,'DELETE'))}>🗑</button></span></div>
  return <>
    <Banners act={act}/><Cats d={d} act={act}/>
    <div className="card"><h2>🎁 {t("Naborlar")}</h2>
      <input className="in" placeholder={t("Nabor nomi (o'zbekcha)")} value={bd.title} onChange={e=>setBd({...bd,title:e.target.value})}/>
      <input className="in" placeholder={t("Название набора (русский)")} value={bd.title_ru} onChange={e=>setBd({...bd,title_ru:e.target.value})}/>
      <textarea className="in" rows={2} placeholder={t("Nabor tavsifi (o'zbekcha)")} value={bd.description} onChange={e=>setBd({...bd,description:e.target.value})}/>
      <textarea className="in" rows={2} placeholder={t("Описание набора (русский)")} value={bd.description_ru} onChange={e=>setBd({...bd,description_ru:e.target.value})}/>
      <input className="in" type="text" inputMode="numeric" placeholder="Nabor narxi" value={bd.price} onChange={e=>setBd({...bd,price:e.target.value.replace(/\D/g,'').replace(/^0+/,'')})}/>
      <input className="in" placeholder="Mahsulot qo'shish: nomini yozing" value={bq} onChange={e=>setBq(e.target.value)}/>
      {res.map(p=><div className="row" key={p.id}><span className="row-txt">{p.name} <span className="m">{so(p.price)}</span></span><span className="row-acts"><button className="btn s g" onClick={()=>{setBd(b=>({...b,items:b.items.some(i=>i.productId===p.id)?b.items:[...b.items,{productId:p.id,name:p.name,price:p.price,qty:1}]}));setBq('')}}>+</button></span></div>)}
      {bd.items.map(i=><div className="row" key={i.productId}><span className="row-txt">{i.name}</span><span className="row-acts"><input className="in" style={{width:64,margin:0,padding:8}} type="number" min="1" value={i.qty} onChange={e=>setBd({...bd,items:bd.items.map(x=>x.productId===i.productId?{...x,qty:e.target.value}:x)})}/><button className="btn s g" onClick={()=>setBd({...bd,items:bd.items.filter(x=>x.productId!==i.productId)})}>✕</button></span></div>)}
      {bd.items.length>0&&<div className="m">Alohida narxi: {so(bd.items.reduce((s,i)=>s+i.price*i.qty,0))}</div>}
      <div className="gap" style={{alignItems:'center',margin:'8px 0'}}>{bd.image&&<img src={bd.image} style={{width:48,height:48,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={img(setBd,bd)}/></label></div>
      <button className="btn s" onClick={()=>go(async()=>{await api('/api/content/bundles','POST',bd);setBd({title:'',title_ru:'',description:'',description_ru:'',price:'',image:'',items:[]})},'Saqlandi')}>+ Nabor</button>
      {c.bundles.map(x=>row('bundles',x,x.title+(x.title_ru?' / '+x.title_ru:'')+' · '+so(x.price)))}</div>
    <div className="card"><h2>▶ {t("Videolar")}</h2><input className="in" placeholder="Sarlavha" value={vd.title} onChange={e=>setVd({...vd,title:e.target.value})}/><input className="in" placeholder="YouTube havolasi" value={vd.url} onChange={e=>setVd({...vd,url:e.target.value})}/>
      <button className="btn s" onClick={()=>go(async()=>{await api('/api/content/videos','POST',vd);setVd({title:'',url:''})},'Saqlandi')}>+ Video</button>
      {c.videos.map(x=>row('videos',x,x.title||x.yt_id))}</div></>
}

function Settings({d,act,onPreviewAnim}){
  const {t}=useLang()
  const [s,setS]=useState(d.settings.delivery),[u,setU]=useState({targetId:'',role:'worker',name:'',department:d.categories[0]})
  const [sup,setSup]=useState(()=>({username:d.settings.support?.username||'',phone:d.settings.support?.phone||''}))
  const [preset,setPreset]=useState(()=>d.settings.animation?.preset||'none')
  const cleanUser=String(sup.username||'').trim().replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i,'').replace(/^@+/,'').replace(/\/.*$/,'').trim()
  return <><div className="card"><h2>{t("🚚 Yetkazib berish")}</h2>
    <label className="row"><span>Yoqilgan</span><input type="checkbox" checked={!!s.enabled} onChange={e=>setS({...s,enabled:e.target.checked})}/></label>
    <label className="m">Minimal buyurtma summasi (so'm)<input className="in" type="text" inputMode="numeric" value={s.minTotal||''} onChange={e=>setS({...s,minTotal:digits(e.target.value)})}/></label>
    <label className="m">Mijozga izoh<input className="in" value={s.note||''} onChange={e=>setS({...s,note:e.target.value})}/></label>
    <div className="m" style={{marginBottom:8}}>Mijoz manzilni yozadi, administrator telefon orqali bog'lanib tasdiqlaydi yoki rad etadi.</div>
    <button className="btn s" onClick={()=>act(()=>api('/api/settings/delivery','PUT',s),'Saqlandi')}>{t("Saqlash")}</button></div>
    <div className="card">
      <h2>💬 {t("Qo'llab-quvvatlash")}</h2>
      <div className="m" style={{marginBottom:8}}>Mijoz profilidagi «Qo'llab-quvvatlash» bo'limida ko'rinadigan Telegram username.</div>
      <label className="m">Telegram username<input className="in" placeholder="@tegen_support" value={sup.username} onChange={e=>setSup({...sup,username:e.target.value})}/></label>
      {cleanUser&&<div className="m" style={{margin:'-4px 0 8px',color:'var(--b)',fontWeight:600}}>✈️ https://t.me/{cleanUser}</div>}
      <label className="m">{t("Telefon raqam (ixtiyoriy)")}<input className="in" type="tel" placeholder="+998 90 123 45 67" value={sup.phone} onChange={e=>setSup({...sup,phone:e.target.value})}/></label>
      <button className="btn s" onClick={()=>act(async()=>{const res=await api('/api/settings/support','PUT',sup);setSup(res)},'Saqlandi')}>{t("Saqlash")}</button>
    </div>
    {d.role==='superadmin'&&<>
      <div className="card">
        <h2>✨ {t("Bayram animatsiyasi")}</h2>
        <div className="m">Mini App orqa fonida doimiy ishlaydigan mavsumiy animatsiya (faqat Super Admin).</div>
        <div className="preset-grid">
          {ANIM_PRESETS.map(p=><button key={p.id} type="button" className={'preset-card'+(preset===p.id?' on':'')} onClick={()=>{setPreset(p.id);onPreviewAnim(p.id)}}>
            <span>{p.icon}</span><b>{t(p.label)}</b>
          </button>)}
        </div>
        <button className="btn s" onClick={()=>act(async()=>{const res=await api('/api/settings/animation','PUT',{preset});setPreset(res.preset);onPreviewAnim(res.preset)},'Saqlandi')}>{t("Saqlash")}</button>
      </div>
      <div className="card"><h2>📦 Ombor tizimi</h2><label className="row"><span>Yoqilgan (faqat Super Admin)</span><input type="checkbox" checked={d.warehouseEnabled} onChange={e=>act(()=>api('/api/settings/warehouse','PUT',{enabled:e.target.checked}),'Saqlandi')}/></label></div>
      <div className="card"><h2>👥 Rollar</h2>{(d.roles||[]).map(x=><div className="row" key={x.tg_id}><span className="row-txt">{x.name||x.tg_id} <span className="m">{x.role}{x.department?' · '+x.department:''}</span></span>{x.role!=='superadmin'&&<span className="row-acts"><button className="btn s g" onClick={()=>act(()=>api('/api/roles','POST',{targetId:x.tg_id,role:'user'}))}>Olib tashlash</button></span>}</div>)}
        <input className="in" placeholder="Telegram ID" value={u.targetId} onChange={e=>setU({...u,targetId:e.target.value})}/><input className="in" placeholder="Ism" value={u.name} onChange={e=>setU({...u,name:e.target.value})}/>
        <div className="gap"><select className="in" style={{flex:1}} value={u.role} onChange={e=>setU({...u,role:e.target.value})}><option value="worker">Bo'lim ishchisi</option><option value="operator">Operator</option><option value="admin">Admin</option></select>
        {u.role==='worker'&&<select className="in" style={{flex:1}} value={u.department} onChange={e=>setU({...u,department:e.target.value})}>{d.categories.map(c=><option key={c}>{c}</option>)}</select>}</div>
        <button className="btn" onClick={()=>act(()=>api('/api/roles','POST',u),'Saqlandi')}>Qo'shish</button></div>
    </>}</>
}

const AL={'order.create':'Buyurtma yaratildi','order.accepted':'Buyurtma qabul qilindi','order.preparing':"Buyurtma yig'ilmoqda",'order.ready':'Buyurtma tayyor','order.completed':'Buyurtma topshirildi','order.cancelled':'Buyurtma bekor qilindi','order.weighed':'Tortib bo\'lindi','order.confirm_price':'Mijoz narxni tasdiqladi','order.reject_price':'Mijoz narxni rad etdi','order.age_confirmed':'Yosh tasdiqlandi','order.age_denied':'Yosh tasdiqlanmadi','product.save':'Mahsulot saqlandi','product.add':"Mahsulot qo'shildi",'product.delete':"Mahsulot o'chirildi",'product.active':"Mahsulot holati o'zgardi",'product.stock':"Ombor qoldig'i o'zgardi",'role.set':'Rol berildi','settings.delivery':'Yetkazish sozlamasi','settings.support':"Qo'llab-quvvatlash sozlamasi",'settings.warehouse':'Ombor tizimi','settings.animation':'Bayram animatsiyasi','category.save':'Kategoriya saqlandi','category.delete':"Kategoriya o'chirildi",'card.apply':'Diskont karta arizasi','card.approve':'Diskont karta biriktirildi','card.reject':'Diskont karta rad etildi','card.bind':'Diskont karta yangilandi','card.remove':'Diskont karta olib tashlandi'}
const AG=[['all','Hammasi',null,'#6B7280'],['order','📦 Buyurtmalar',/^order\./,'#3B82F6'],['prod','🛍 Mahsulotlar',/^(product|change|category)\./,'#F59E0B'],['content','🖼 Kontent',/^content\./,'#10B981'],['user','👤 Foydalanuvchilar',/^(role|card)\./,'#8B5CF6'],['set','⚙️ Sozlamalar',/^settings\./,'#6B7280']]

function Audit(){
  const {t,so}=useLang()
  const [a,setA]=useState([]),[g,setG]=useState('all'),[per,setPer]=useState('7'),[from,setFrom]=useState(iso(7)),[to,setTo]=useState(iso(0)),[ft,setFt]=useState(fmt(iso(7))),[tt,setTt]=useState(fmt(iso(0)))
  useEffect(()=>{api(`/api/audit?from=${from}&to=${to}`).then(setA).catch(()=>{})},[from,to])
  const G=AG.find(x=>x[0]===g),list=G[2]?a.filter(x=>G[2].test(x.action)):a,col=x=>(AG.find(z=>z[2]&&z[2].test(x.action))||AG[0])[3]
  const adet=x=>{const z=x.detail||{};if(z.card)return '💳 '+z.card;if(z.username)return '@'+z.username;if(z.preset)return z.preset;if(z.active!=null)return z.active?'Yoqildi':'Faolsizlantirildi';if(z.total!=null)return so(z.total);if(z.title)return z.title;if(z.role)return z.role+(z.department?' · '+z.department:'');if(z.n)return z.n;return ''}
  return <>
    <DateRangeBar per={per} setPer={setPer} from={from} setFrom={setFrom} to={to} setTo={setTo} ft={ft} setFt={setFt} tt={tt} setTt={setTt}/>
    <div className="chips">{AG.map(([k,l])=><button key={k} className={'chip'+(g===k?' on':'')} onClick={()=>setG(k)}>{t(l)}</button>)}</div>
    <div className="card"><h2>🧾 {t("Audit")} · {list.length}</h2>{list.map(x=><div className="alog" key={x.id}><i style={{background:col(x)}}/><div style={{flex:1}}><b>{AL[x.action]||x.action}</b><div className="m">{x.entity}{adet(x)&&' · '+adet(x)}</div><div className="m">{x.actor_name||x.actor} · {new Date(x.at).toLocaleString('uz-UZ')}</div></div></div>)}{!list.length&&<div className="m">—</div>}</div>
  </>
}

function Admin({d,act,say,onPreviewAnim}){
  const {t}=useLang()
  const isW=d.role==='worker',tabs=isW?[['p','Tovarlar']]:d.role==='operator'?[['o','Buyurtmalar']]:[['d','Statistika'],['o','Buyurtmalar'],['p','Tovarlar'],['k',t('Kartalar')+(d.pendingCardsCount?` (${d.pendingCardsCount})`:'')],['m','Mijozlar'],['c','Kontent'],['s','Sozlamalar'],['a','Audit']]
  const [tb,setT]=useState(tabs[0][0])
  return <><h1>{t("Boshqaruv")}</h1><div className="seg" style={{overflowX:'auto'}}>{tabs.map(([k,l])=><button key={k} className={tb===k?'on':''} onClick={()=>setT(k)}>{k==='k'?l:t(l)}</button>)}</div>
    {tb==='d'&&<Dash/>}{tb==='o'&&<AdminOrders d={d} act={act} say={say}/>}{tb==='p'&&<Products d={d} act={act}/>}{tb==='k'&&<AdminCards act={act} say={say}/>}{tb==='m'&&<Customers/>}{tb==='c'&&<Content d={d} act={act}/>}{tb==='s'&&<Settings d={d} act={act} onPreviewAnim={onPreviewAnim}/>}{tb==='a'&&<Audit/>}</>
}

export default function App(){
  const [lang,setLang]=useState(()=>{try{return localStorage.getItem('lang')||(tg?.initDataUnsafe?.user?.language_code==='ru'?'ru':'uz')}catch{return 'uz'}})
  const [d,setD]=useState(null),[err,setErr]=useState(''),[tab,setTab]=useState('shop'),[cart,setCart]=useState({}),[toast,setToast]=useState(''),[cat,setCat]=useState('')
  const [animOverride,setAnimOverride]=useState(null)
  const syncedRef=useRef(false)
  const say=m=>{setToast(m);setTimeout(()=>setToast(''),2500)}
  const load=useCallback(()=>api('/api/init').then(res=>{
    setD(res)
    if(!syncedRef.current){
      syncedRef.current=true
      let saved=null;try{saved=localStorage.getItem('lang')}catch{}
      if(!saved&&res?.user?.lang&&(res.user.lang==='uz'||res.user.lang==='ru'))setLang(res.user.lang)
    }
  }).catch(e=>setErr(e.message)),[])

  useEffect(()=>{tg?.ready();tg?.expand();load();const h=setInterval(load,20000);return()=>clearInterval(h)},[load])

  const toggleLang=()=>{
    const next=lang==='ru'?'uz':'ru'
    setLang(next)
    try{localStorage.setItem('lang',next)}catch{}
    api('/api/user/lang','PUT',{lang:next}).catch(()=>{})
  }

  const t=s=>(lang==='ru'&&RU[s])||s
  const so=n=>Number(n||0).toLocaleString('ru-RU')+(lang==='ru'?' сум':" so'm")
  const act=async(fn,ok)=>{try{await fn();ok&&say(ok);await load()}catch(e){say(e.message)}}

  if(err)return <div className="center">⚠️ {err}<br/>Ilovani Telegram bot orqali oching.</div>
  if(!d)return <div className="center">{t("Yuklanmoqda…")}</div>
  if(!d.user.phone)return <div className="center">📱 {lang==='ru'?'Сначала нажмите /start в боте, выберите язык и отправьте номер телефона.':'Avval botda /start bosib tilni tanlang va telefon raqamingizni yuboring.'}</div>

  const entries=Object.values(cart)
  const n=entries.length
  const cartTotal=entries.reduce((s,v)=>s+lsum(v.p,v),0)
  const showBar=n>0&&(tab==='shop'||tab==='catalog'||tab==='promo')
  const tabs=[['shop',"Do'kon"],['catalog','Katalog'],['promo','Aksiya'],['cart','Savat'],['orders','Buyurtma'],['profile','Profil']]
  const activePreset=animOverride??(d.settings.animation?.preset||'none')

  return <LangCtx.Provider value={lang}>
    <FestiveOverlay preset={activePreset}/>
    <div className={'app'+(showBar?' has-bar':'')}>
      <div className="top-wrap">
        <div className="top">
          <div className="logo" onClick={()=>{setCat('');setTab('shop')}}>T</div>
          <div className="brand" onClick={()=>{setCat('');setTab('shop')}}><b>TEGEN Market</b><small>{t("Tez yetkazish va qulay xarid")}</small></div>
          <button className="lang" onClick={toggleLang}>{lang==='ru'?'🇺🇿 UZ':'🇷🇺 RU'}</button>
        </div>
      </div>

      {tab==='shop'&&<Shop d={d} cart={cart} setCart={setCart} cat={cat} setCat={setCat}/>}
      {tab==='catalog'&&<Catalog d={d} go={c=>{setCat(c);setTab('shop');scrollTo({top:0})}}/>}
      {tab==='promo'&&<Promo d={d} cart={cart} setCart={setCart}/>}
      {tab==='cart'&&<Cart d={d} cart={cart} setCart={setCart} act={act} done={()=>setTab('orders')}/>}
      {tab==='orders'&&<Orders d={d} act={act}/>}
      {tab==='profile'&&<Profile d={d} go={setTab} onToggleLang={toggleLang} cart={cart} setCart={setCart} say={say} act={act}/>}
      {tab==='admin'&&d.role!=='user'&&<Admin d={d} act={act} say={say} onPreviewAnim={p=>setAnimOverride(p)}/>}

      {showBar&&<button className="cart-bar" onClick={()=>setTab('cart')}>
        <span className="cb-l"><span className="cb-n">{n}</span><span>{t("Savatga o'tish")}</span></span>
        <span className="cb-r">{so(cartTotal)} →</span>
      </button>}

      <div className="nav">
        {tabs.map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>{if(k==='shop')setCat('');if(k!=='admin')setAnimOverride(null);setTab(k);scrollTo({top:0})}}>
          <NavIcon k={k}/><span>{t(l)}</span>{k==='cart'&&n>0&&<i>{n}</i>}{k==='promo'&&d.saleCount>0&&<i>{d.saleCount}</i>}
        </button>)}
      </div>
      {toast&&<div className="toast">{toast}</div>}
    </div>
  </LangCtx.Provider>
}
