// JOYI: frontend/src/App.jsx  (GitHub'da shu yo'l bilan yarating)
import {Fragment,useState,useEffect,useCallback,useRef,createContext,useContext} from 'react'
import {parseParadoxDb} from './paradox'
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
  "Telefon raqam (ixtiyoriy)":"Номер телефона (необязательно)",
  "Aksiya tugashigacha":"До конца акции","Davomiylik":"Длительность","Aniq sana":"Точная дата",
  "Kun":"Дни","Soat":"Часы","Daqiqa":"Минуты","Soniya":"Сек",
  "Bugun 23:59":"Сегодня 23:59","Ertaga 23:59":"Завтра 23:59","Vaqtsiz":"Без срока",
  "Muddatsiz aksiya":"Акция без ограничения времени","O'tgan vaqt kiritilgan":"Указано прошедшее время",
  "Telegramdan raqamni ulashish":"Поделиться номером из Telegram",
  "Bir marta kiritiladi — keyingi buyurtmalarda so'ralmaydi":"Вводится один раз — в следующих заказах запрашиваться не будет",
  "Xabarlar":"Рассылка","Xabar yuborish":"Отправить рассылку",
  "Xavfsizlik":"Безопасность","Bloklangan ID lar":"Заблокированные ID",
  "Bloklash":"Заблокировать","Blokdan chiqarish":"Разблокировать",
  "Taxminiy og'irlik":"Примерный вес","Maksimal og'irlik":"Максимальный вес",
  "Oila / Guruh":"Семейство / Группа","Sozlash kerak":"Нужна настройка",
  "Kundalik ehtiyoj":"Повседневные","Nonushta":"Завтрак","Oilaviy":"Семейные",
  "Bolalar uchun":"Для детей","Bayramona":"Праздничные",
  "Ko'rinish":"Товар","Tahlil":"Анализ",
  "Yangi rol qo'shish":"Добавить новую роль","Yangi katalog qo'shish":"Добавить новую категорию",
  "Rolni tanlang":"Выберите роль","Katalogni tanlang":"Выберите категорию",
  "Boshqa bo'limlar":"Другие разделы",
  "AI Yordamchi":"AI Помощник",
  "Buyruq yozing yoki ovoz yuboring...":"Напишите команду или отправьте голос...",
  "Suhbat tozalandi":"Чат очищен",
  "Qaynoq aksiyalar":"Горячие акции","Xit mahsulotlar":"Хиты продаж",
  "Oldingi xaridingizdan":"Из прошлых покупок","Sevimlilar":"Избранное",
  "Sevimlilar ro'yxati bo'sh":"Список избранного пуст",
  "Sevimlilarga qo'shildi ❤️":"Добавлено в избранное ❤️",
  "Sevimlilardan olib tashlandi":"Удалено из избранного",
  "Oxirgi qidiruvlar":"Недавние поиски","Tezkor qidiruv":"Быстрый поиск",
  "Standart":"Стандарт","Mashhur":"Популярные","Arzonroq":"Дешевле","Qimmatroq":"Дороже",
  "Bepul yetkazib berish!":"Бесплатная доставка!","Yetkazib berish mumkin!":"Доставка доступна!",
  "Bepul yetkazishgacha":"До бесплатной доставки","Minimal buyurtmagacha":"До минимального заказа",
  "Barcha mahsulotlar ko'rsatildi":"Показаны все товары","dona":"шт",
  "Funksiyalar":"Функции","Funksiyalar boshqaruvi":"Управление функциями",
  "Buyurtmaga izoh (ixtiyoriy)":"Комментарий к заказу (необязательно)",
  "Do'kon hozir yopiq":"Магазин сейчас закрыт","Ish vaqti":"Часы работы",
  "Ulashish":"Поделиться","Buyurtmani bekor qilish":"Отменить заказ",
  "Buyurtmani bekor qilasizmi?":"Отменить заказ?","Barchasini yoqish":"Включить все",
  "Do'kondan topish":"Найти в магазине"
}
const F=(d,k)=>d?.features?.[k]!==false

const FAM_PRESETS=['Kundalik ehtiyoj','Nonushta','Oilaviy','Bolalar uchun','Bayramona','Premium']
const parseSyncCsv=txt=>{
  const lines=String(txt||'').replace(/^\uFEFF/,'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
  if(!lines.length)return []
  const first=lines[0]
  const sep=first.includes('\t')?'\t':(first.split(';').length>=first.split(',').length?';':',')
  const splitRow=line=>{
    const out=[];let cur='',inq=false
    for(let i=0;i<line.length;i++){
      const ch=line[i]
      if(ch==='"'){inq=!inq;continue}
      if(ch===sep&&!inq){out.push(cur.trim());cur='';continue}
      cur+=ch
    }
    out.push(cur.trim());return out
  }
  const rows=lines.map(splitRow)
  const h=rows[0].map(c=>c.toLowerCase())
  const findCol=re=>h.findIndex(c=>re.test(c))
  const iBc=findCol(/(штрих|баркод|barcode|код|code|артикул)/i)
  const iNm=findCol(/(наимен|товар|назв|name|nomi|mahsulot)/i)
  const iPr=findCol(/(цена|price|narx|продаж|сумм)/i)
  const iSt=findCol(/(остат|кол|qty|stock|qoldiq|soni|наличи)/i)
  const hasHeader=iBc>=0||iNm>=0||iPr>=0||iSt>=0
  const data=hasHeader?rows.slice(1):rows
  const items=[]
  for(const r of data){
    const barcode=iBc>=0?r[iBc]:(!hasHeader&&r.length>=4?r[0]:'')
    const name=iNm>=0?r[iNm]:(!hasHeader?(r.length>=4?r[1]:r[0]):'')
    const price=iPr>=0?r[iPr]:(!hasHeader?(r.length>=4?r[2]:r[1]):'')
    const stock=iSt>=0?r[iSt]:(!hasHeader?(r.length>=4?r[3]:r[2]):'')
    const pNum=Math.round(Number(String(price||'').replace(/[^\d.]/g,''))||0)
    if((name||barcode)&&pNum>0)items.push({barcode:String(barcode||'').trim(),name:String(name||'').trim(),price:pNum,stock:stock===''||stock===undefined?null:Number(String(stock).replace(',','.').replace(/[^\d.-]/g,''))})
  }
  return items
}

const fmtPhone=p=>{const s=String(p||'').replace(/\D/g,'');return s.length===12&&s.startsWith('998')?`+998 ${s.slice(3,5)} ${s.slice(5,8)} ${s.slice(8,10)} ${s.slice(10)}`:(s?'+'+s:'')}
const fmtDt=s=>{if(!s)return '';const d=new Date(s);return d.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'})+' '+d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
const loadAddrs=()=>{try{const a=JSON.parse(localStorage.getItem('tegen_addrs')||'[]');return Array.isArray(a)?a:[]}catch{return []}}
const saveAddrs=a=>{try{localStorage.setItem('tegen_addrs',JSON.stringify(a.slice(0,10)))}catch{}}
const copyText=(txt,say)=>{if(navigator.clipboard)navigator.clipboard.writeText(String(txt)).catch(()=>{});say&&say()}
const shareTgPhone=(onGot,onReload)=>{
  if(!tg?.requestContact)return false
  try{
    tg.requestContact((ok,ev)=>{
      if(!ok)return
      const p=ev?.responseUnsafe?.contact?.phone_number
      if(p){const clean=String(p).startsWith('+')?String(p):'+'+String(p);onGot(clean);api('/api/user/phone','PUT',{phone:p}).then(()=>onReload&&onReload()).catch(()=>{})}
      else if(onReload){setTimeout(onReload,900);setTimeout(onReload,2200)}
    })
    return true
  }catch{return false}
}

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
const CAT_PASTEL={
  "Sut mahsulotlari":"linear-gradient(155deg,#D2E1FA 0%,#BED4F6 100%)",
  "Go'sht va kolbasa":"linear-gradient(155deg,#FDD4E8 0%,#FBC0DE 100%)",
  "Ichimliklar":"linear-gradient(155deg,#EBE9FC 0%,#DFDCF9 100%)",
  "Meva-sabzavot":"linear-gradient(155deg,#D8F5E5 0%,#C2EED6 100%)",
  "Meva-Sabzavot":"linear-gradient(155deg,#D8F5E5 0%,#C2EED6 100%)",
  "Barra Ko‘katlar":"linear-gradient(155deg,#DCF7E6 0%,#C4EED5 100%)",
  "Non mahsulotlari":"linear-gradient(155deg,#FDEFD1 0%,#FAE1B2 100%)",
  "Shirinliklar":"linear-gradient(155deg,#FFE4D9 0%,#FDD0BE 100%)",
  "Bakaleya":"linear-gradient(155deg,#F3ECE2 0%,#E7DCCB 100%)",
  "Maishiy kimyo":"linear-gradient(155deg,#D4F1F8 0%,#BCE6F2 100%)",
  "Taom mahsulotlari":"linear-gradient(155deg,#FDE2DC 0%,#FACAC0 100%)",
  "Kundalik Ehtiyoj":"linear-gradient(155deg,#E2F2E9 0%,#CCE7D8 100%)",
  "Boshqa":"linear-gradient(155deg,#ECEFF4 0%,#E0E6EE 100%)"
}
const PASTEL_RING=[
  "linear-gradient(155deg,#D2E1FA 0%,#BED4F6 100%)",
  "linear-gradient(155deg,#FDD4E8 0%,#FBC0DE 100%)",
  "linear-gradient(155deg,#EBE9FC 0%,#DFDCF9 100%)",
  "linear-gradient(155deg,#D8F5E5 0%,#C2EED6 100%)",
  "linear-gradient(155deg,#FDEFD1 0%,#FAE1B2 100%)",
  "linear-gradient(155deg,#FFE4D9 0%,#FDD0BE 100%)",
  "linear-gradient(155deg,#D4F1F8 0%,#BCE6F2 100%)",
  "linear-gradient(155deg,#F3ECE2 0%,#E7DCCB 100%)"
]
const catPastel=(name,i=0)=>CAT_PASTEL[name]||PASTEL_RING[Math.abs(i)%PASTEL_RING.length]
const TILE_SIZES=[
  {value:'',label:'Avto (Zik-zak)',sub:'Avtomatik muvozanatli zik-zak',icon:'✨'},
  {value:'sp4',label:'Keng (2/3)',sub:'Qatorning katta qismi',icon:'▭'},
  {value:'sp3',label:"O'rta (1/2)",sub:'Qatorning yarmi (yonma-yon 2 ta)',icon:'◻'},
  {value:'sp2',label:'Kichik (1/3)',sub:'Yonma-yon 3 ta karta',icon:'▪'},
  {value:'sp6',label:"To'liq (1/1)",sub:'Butun qator kengligi',icon:'▬'}
]
const parseSpan=sec=>sec==='sp2'?2:sec==='sp3'?3:sec==='sp4'?4:sec==='sp6'?6:0
const bentoSpans=n=>{
  if(n<=0)return []
  if(n===1)return [3]
  const out=[];let rem=n,phase=0
  while(rem>0){
    if(rem===2){out.push(phase%2===0?3:2,phase%2===0?3:4);rem=0}
    else if(rem===3){out.push(2,2,2);rem=0}
    else if(rem===4){
      if(phase%2===0)out.push(4,2,2,4)
      else out.push(2,4,4,2)
      rem=0
    }else if(rem===5){
      if(phase%2===0)out.push(4,2,2,2,2)
      else out.push(2,2,2,2,4)
      rem=0
    }else{
      const step=phase%4
      if(step===0){out.push(4,2);rem-=2}
      else if(step===1){out.push(2,4);rem-=2}
      else if(step===2){out.push(2,2,2);rem-=3}
      else{out.push(3,3);rem-=2}
      phase++
    }
  }
  return out
}

const lsum=(p,v)=>{const up=effPrice(p);return v.sum||(v.grams?Math.round(up*v.grams/1000):v.qty*up)}
const keyOf=p=>(p.bundle?'b':'p')+p.id
const digits=s=>s.replace(/\D/g,'').replace(/^0+/,'')
const haptic=(t='light')=>{try{if(t==='sel')tg?.HapticFeedback?.selectionChanged?.();else tg?.HapticFeedback?.impactOccurred?.(t)}catch{}}
const loadFavs=()=>{try{const a=JSON.parse(localStorage.getItem('tegen_favs')||'[]');return Array.isArray(a)?a.map(Number).filter(x=>x>0):[]}catch{return[]}}
const saveFavs=a=>{try{localStorage.setItem('tegen_favs',JSON.stringify(a.slice(0,100)))}catch{}}
const loadSearchHist=()=>{try{const a=JSON.parse(localStorage.getItem('tegen_qhist')||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&x.trim()).slice(0,8):[]}catch{return[]}}
const saveSearchHist=a=>{try{localStorage.setItem('tegen_qhist',JSON.stringify(a.slice(0,8)))}catch{}}
const QUICK_SEARCH_TAGS=['Non','Sut','Tuxum','Guruch','Yogʻ','Shakar','Choy','Cola','Olma','Goʻsht']
const unitBadge=(p,t)=>{
  if(p.bundle)return null
  if(p.unit==='weight')return p.min_grams>0?`${p.min_grams} g+`:'1 kg'
  if(p.weight_g>0)return p.weight_g>=1000?`${+(p.weight_g/1000).toFixed(2)} kg`:`${p.weight_g} g`
  return '1 '+t('dona')
}
const useDebounced=(v,ms=300)=>{const [x,setX]=useState(v);useEffect(()=>{const h=setTimeout(()=>setX(v),ms);return()=>clearTimeout(h)},[v,ms]);return x}
const upload=file=>new Promise((res,rej)=>{const img=new Image();img.onerror=()=>rej(new Error('Rasm ochilmadi'));img.onload=async()=>{try{const k=Math.min(1,900/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);let data=file.type==='image/png'?c.toDataURL('image/png'):c.toDataURL('image/jpeg',0.82);if(data.length>900000)data=c.toDataURL('image/jpeg',0.8);res((await api('/api/upload','POST',{data})).url)}catch(e){rej(e)}};img.src=URL.createObjectURL(file)})

const iso=n=>new Date(Date.now()+5*3600e3-n*864e5).toISOString().slice(0,10)
const fmt=s=>s?s.split('-').reverse().join('.'):''
const parseDate=s=>{const m=/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec((s||'').trim());return m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:null}

function Countdown({until,mode='card'}){
  const {t,lang}=useLang()
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
  if(mode==='blocks'){
    const units=d>0
      ?[[pad(d),lang==='ru'?'дн':'kun'],[pad(h),lang==='ru'?'час':'soat'],[pad(m),lang==='ru'?'мин':'daq'],[pad(s),lang==='ru'?'сек':'son']]
      :[[pad(h),lang==='ru'?'час':'soat'],[pad(m),lang==='ru'?'мин':'daq'],[pad(s),lang==='ru'?'сек':'son']]
    return <div className="cd-card">
      <div className="cd-head">
        <span>🔥 {t("Aksiya tugashigacha")}</span>
        <span style={{opacity:.8,fontWeight:700}}>{fmtDt(until)}</span>
      </div>
      <div className="cd-grid">
        {units.map(([v,u],i)=><div key={u} style={{display:'contents'}}>
          {i>0&&<span className="cd-sep">:</span>}
          <div className="cd-unit"><b>{v}</b><small>{u}</small></div>
        </div>)}
      </div>
    </div>
  }
  if(mode==='inline')return <span className="sale-timer-inline"><i className="st-dot"/>{txt}</span>
  return <span className="sale-timer"><i className="st-dot"/>{txt}</span>
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
function Thumb({p,cls='img',hideSale=false,fav,onFav}){
  const {t}=useLang()
  const on=!hideSale&&cls==='img'&&isSale(p)
  const pct=on?Math.max(1,Math.round((1-p.sale_price/p.price)*100)):0
  const ub=cls==='img'?unitBadge(p,t):null
  return <div className={cls} style={p.image?{backgroundImage:`url(${p.image})`}:{}}>
    {!p.image&&<span className="emo">{p.bundle?'🎁':EMO[p.category]||'🛒'}</span>}
    {p.age_min>0&&<i className="age">{p.age_min}+</i>}
    {onFav&&!p.bundle&&<button type="button" className={'fav-btn'+(fav?' on':'')} aria-label="Sevimli" onClick={e=>{e.stopPropagation();haptic('light');onFav(p.id)}}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill={fav?'currentColor':'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    </button>}
    {on&&<span className="disc">−{pct}%</span>}
    {ub&&!on&&<span className="ubadge">{ub}</span>}
    {on&&p.sale_until&&<Countdown until={p.sale_until} mode="card"/>}
  </div>
}

function SkeletonGrid({count=6}){
  return <div className="grid">
    {Array.from({length:count},(_,i)=><div className="card prod sk-card" key={i}>
      <div className="sk-img shimmer"/>
      <div className="pbody">
        <div className="sk-line w60 shimmer"/>
        <div className="sk-line w90 shimmer"/>
        <div className="sk-line w75 shimmer"/>
        <div className="sk-btn shimmer"/>
      </div>
    </div>)}
  </div>
}

function ProductCard({p,idx,canPos,onPos,fav,onFav,onOpen,actionBtn,shelf=false}){
  const {pn}=useLang()
  const thumb=<Thumb p={p} fav={fav} onFav={onFav}/>
  return <div className={'card prod'+(shelf?' shelf-card':'')} onClick={()=>onOpen(p)}>
    {canPos?<div className="pos-wrap">{thumb}<button type="button" className={'pos-badge'+(p.pos?' set':'')} onClick={e=>{e.stopPropagation();onPos({p,n:idx+1})}}>{idx+1}</button></div>:thumb}
    <div className="pbody">
      <PriceTag p={p}/>
      <div className="name">{pn(p)}</div>
      <div className="pfoot">{actionBtn(p)}</div>
    </div>
  </div>
}

function AutoMore({more,loading,onMore}){
  const {t}=useLang()
  const ref=useRef(null)
  useEffect(()=>{
    if(!more||loading||typeof IntersectionObserver==='undefined'||!ref.current)return
    const io=new IntersectionObserver(entries=>{if(entries[0]?.isIntersecting)onMore()},{rootMargin:'240px'})
    io.observe(ref.current)
    return()=>io.disconnect()
  },[more,loading,onMore])
  if(!more)return null
  return <div ref={ref} style={{marginTop:12}}>
    <button type="button" className="btn g" disabled={loading} onClick={onMore}>{loading?t("Yuklanmoqda…"):t("Yana")}</button>
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
    <button type="button" aria-label="Minus" onClick={e=>{stop(e);haptic('sel');onChange(qty>1?qty-1:0)}}>−</button>
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
    <button type="button" aria-label="Plus" onClick={e=>{stop(e);haptic('sel');onChange(Math.min(max,qty+1))}}>+</button>
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
        const left=ref.current?.children?.[n]?.offsetLeft??(n*(ref.current?.clientWidth||0))
        ref.current?.scrollTo({left,behavior:'smooth'})
        return n
      })
    },3000)
    return()=>clearInterval(id)
  },[banners.length])
  const onScroll=()=>{
    if(!ref.current)return
    const w=ref.current.clientWidth||1
    setIdx(Math.round(ref.current.scrollLeft/w))
  }
  const jump=i=>{
    pauseRef.current=Date.now()+6000
    setIdx(i)
    const left=ref.current?.children?.[i]?.offsetLeft??(i*(ref.current?.clientWidth||0))
    ref.current?.scrollTo({left,behavior:'smooth'})
  }
  return <div className="hero-wrap">
    <div className="hero-track" ref={ref} onScroll={onScroll} onTouchStart={()=>{pauseRef.current=Date.now()+6000}}>
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
    },3000)
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

const ROLE_ICONS=['🧾','📋','🚚','📦','🧑‍💼','🏷️','🛒','⭐','🛡️','🎧']
const ROLE_BASE_LBL={worker:"Bo'lim ishchisi",operator:'Operator',admin:'Admin'}

function ModernSelect({value,options,onChange,title,placeholder,style,searchable,createLabel,renderCreate,onDeleteOption}){
  const {t}=useLang()
  const [open,setOpen]=useState(false),[sq,setSq]=useState(''),[adding,setAdding]=useState(false)
  const cur=options.find(o=>String(o.value)===String(value))
  const showSearch=searchable??options.length>=6
  const filtered=sq.trim()?options.filter(o=>`${o.label} ${o.sub||''}`.toLowerCase().includes(sq.trim().toLowerCase())):options
  const close=()=>{setOpen(false);setSq('');setAdding(false)}
  return <>
    <button type="button" className="msel" style={style} onClick={()=>setOpen(true)}>
      <span className="msel-l">
        {cur?.icon&&<span className="msel-ico">{cur.icon}</span>}
        <span className={'msel-txt'+(!cur?' msel-ph':'')}>{cur?cur.label:(placeholder||t('Tanlang'))}</span>
      </span>
      <span className="msel-arr"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
    </button>
    {open&&<div className="sheet picker-sheet" onClick={close}>
      <div className="picker-box" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="pick-head">
          <h2>{title||placeholder||t('Tanlang')}</h2>
          <button type="button" className="pick-close" onClick={close}>✕</button>
        </div>
        {showSearch&&<input className="in" style={{marginBottom:8}} placeholder="🔍 Qidirish..." value={sq} onChange={e=>setSq(e.target.value)}/>}
        <div className="pick-list">
          {filtered.map(o=>{
            const sel=String(o.value)===String(value)
            return <div key={String(o.value)} className={'pick-row'+(sel?' on':'')} style={o.indent?{marginLeft:o.indent*14}:undefined} onClick={()=>{onChange(o.value,o);close()}}>
              <div className="pick-row-l">
                {o.icon&&<span className="pick-ico">{o.icon}</span>}
                <div className="pick-lbl">
                  <b>{o.label}</b>
                  {o.sub&&<small>{o.sub}</small>}
                </div>
              </div>
              <div className="pick-r">
                {o.deletable&&onDeleteOption&&<button type="button" className="pick-del" onClick={e=>{e.stopPropagation();onDeleteOption(o)}}>🗑</button>}
                <span className="pick-chk">{sel?'✓':''}</span>
              </div>
            </div>
          })}
          {!filtered.length&&<div className="m" style={{textAlign:'center',padding:'16px 0'}}>{t("Hech narsa topilmadi")}</div>}
        </div>
        {renderCreate&&(!adding
          ?<button type="button" className="pick-add-btn" onClick={()=>setAdding(true)}>➕ {createLabel||t("Qo'shish")}</button>
          :<div className="pick-create">
            {renderCreate(()=>setAdding(false),(val,opt)=>{onChange(val,opt);close()})}
          </div>)}
      </div>
    </div>}
  </>
}

function CatCamBtn({c,onReload,say}){
  const [busy,setBusy]=useState(false)
  const pick=async e=>{
    e.stopPropagation()
    const file=e.target.files?.[0];e.target.value=''
    if(!file||busy)return
    setBusy(true)
    try{
      const url=await upload(file)
      await api('/api/cats','POST',{name:c.name,name_ru:c.name_ru||'',image:url,section:c.section||'',sort:c.sort||0,parent:c.parent||''})
      if(onReload)await onReload()
      say&&say('Rasm saqlandi ✅')
    }catch(er){say?say(er.message):alert(er.message)}
    setBusy(false)
  }
  return <label className={'cat-cam'+(busy?' busy':'')} title="Rasm qo'yish" onClick={e=>e.stopPropagation()}>
    {busy?'⏳':'📷'}
    <input type="file" accept="image/*" hidden onClick={e=>e.stopPropagation()} onChange={pick}/>
  </label>
}

function CatSizeBtn({c,onReload,say}){
  const [busy,setBusy]=useState(false)
  const order=['','sp4','sp3','sp2','sp6']
  const cur=order.includes(c.section||'')?(c.section||''):''
  const cycle=async e=>{
    e.stopPropagation()
    if(busy)return
    const next=order[(order.indexOf(cur)+1)%order.length]
    const meta=TILE_SIZES.find(x=>x.value===next)
    setBusy(true)
    try{
      await api('/api/cats','POST',{name:c.name,name_ru:c.name_ru||'',image:c.image||null,section:next,sort:c.sort||0,parent:c.parent||''})
      if(onReload)await onReload()
      say&&say(`${meta.icon} ${c.name}: ${meta.label}`)
    }catch(er){say?say(er.message):alert(er.message)}
    setBusy(false)
  }
  const badge=cur==='sp4'?'⅔':cur==='sp3'?'½':cur==='sp2'?'⅓':cur==='sp6'?'1':'◧'
  return <button type="button" className={'cat-sz'+(cur?' custom':'')+(busy?' busy':'')} title="Karta kengligini o'zgartirish" onClick={cycle}>
    {busy?'⏳':badge}
  </button>
}

function CatPicker({value,cats,onChange,onReload,canCreate,includeNone,noneLabel,exclude,maxDepth,title,style,compact}){
  const {t,cn}=useLang()
  const tree=buildCatTree(cats||[])
  const [open,setOpen]=useState(false),[sq,setSq]=useState(''),[adding,setAdding]=useState(false)
  const [nUz,setNUz]=useState(''),[nRu,setNRu]=useState(''),[nPar,setNPar]=useState(''),[nImg,setNImg]=useState(''),[busy,setBusy]=useState(false),[err,setErr]=useState('')
  const curObj=value?tree.byName.get(value):null
  // Active root inside modal: when null -> show root categories list; when set -> show ONLY that root's inner subcategories!
  const [viewRoot,setViewRoot]=useState(null)

  const roots=tree.roots.filter(c=>!exclude||!exclude(c))
  const q=sq.trim().toLowerCase()
  const match=c=>!q||c.name.toLowerCase().includes(q)||(c.name_ru||'').toLowerCase().includes(q)||cn(c).toLowerCase().includes(q)

  const close=()=>{setOpen(false);setSq('');setAdding(false);setViewRoot(null)}
  const pick=val=>{haptic('sel');onChange(val);close()}

  const pickImg=async e=>{
    const file=e.target.files?.[0];e.target.value=''
    if(!file)return
    setBusy(true);setErr('')
    try{setNImg(await upload(file))}catch(er){setErr(er.message)}
    setBusy(false)
  }
  const createCat=async()=>{
    const nm=nUz.trim();if(!nm){setErr('Nomini kiriting');return}
    setBusy(true);setErr('')
    try{
      await api('/api/cats','POST',{name:nm,name_ru:nRu.trim(),parent:nPar||'',image:nImg||null})
      if(onReload)await onReload()
      setNUz('');setNRu('');setNPar('');setNImg('');setAdding(false)
      pick(nm)
    }catch(e){setErr(e.message)}
    setBusy(false)
  }
  const curLabel=value?(curObj?(curObj.parent?`${curObj.parent} › ${cn(curObj)}`:cn(curObj)):value):(includeNone?(noneLabel||t("Asosiy kategoriya (yo'q)")):t("Katalogni tanlang"))
  const curIcon=value?(EMO[value]||(curObj?.parent?'📁':'🛒')):(includeNone?'🗂':'📁')
  const viewRootObj=viewRoot?tree.byName.get(viewRoot):null
  const viewKids=viewRoot?tree.childrenOf(viewRoot).filter(k=>(!exclude||!exclude(k))&&match(k)):[]

  return <>
    <button type="button" className={'msel'+(compact?' compact':'')} style={style} onClick={()=>{setViewRoot(null);setOpen(true)}}>
      <span className="msel-l">
        <span className="msel-ico">{curIcon}</span>
        <span className={'msel-txt'+(!value&&!includeNone?' msel-ph':'')}>{curLabel}</span>
      </span>
      <span className="msel-arr"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
    </button>
    {open&&<div className="sheet picker-sheet" onClick={close}>
      <div className="picker-box" onClick={e=>e.stopPropagation()}>
        <div className="sheet-handle"/>
        <div className="pick-head">
          {viewRoot?<button type="button" className="btn s g" style={{padding:'6px 11px'}} onClick={()=>{haptic('sel');setViewRoot(null);setSq('')}}>← {t("Orqaga")}</button>:null}
          <h2 style={{flex:1}}>{viewRoot?(viewRootObj?cn(viewRootObj):viewRoot):(title||t("Katalogni tanlang"))}</h2>
          <button type="button" className="pick-close" onClick={close}>✕</button>
        </div>
        <input className="in" style={{marginBottom:8}} placeholder="🔍 Qidirish..." value={sq} onChange={e=>setSq(e.target.value)}/>
        <div className="pick-list">
          {viewRoot?<>
            {viewKids.map(k=>{
              const sel=value===k.name
              return <div key={k.name} className={'pick-row'+(sel?' on':'')} onClick={()=>pick(k.name)}>
                <div className="pick-row-l">
                  <span className="pick-ico">{k.image?<img src={k.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:10}}/>:'📁'}</span>
                  <div className="pick-lbl">
                    <b>{cn(k)}</b>
                    {k.name_ru&&cn(k)!==k.name_ru&&<small>{k.name_ru}</small>}
                  </div>
                </div>
                <span className="pick-chk">{sel?'✓':''}</span>
              </div>
            })}
            {!viewKids.length&&<div className="m" style={{textAlign:'center',padding:'16px 0'}}>{t("Hech narsa topilmadi")}</div>}
          </>:q?<>
            {tree.flat.filter(c=>(!exclude||!exclude(c))&&(maxDepth===undefined||c.depth<maxDepth)&&match(c)).map(c=>{
              const sel=value===c.name
              return <div key={c.name} className={'pick-row'+(sel?' on':'')} onClick={()=>pick(c.name)}>
                <div className="pick-row-l">
                  <span className="pick-ico">{EMO[c.name]||(c.depth?'📁':'🛒')}</span>
                  <div className="pick-lbl">
                    <b>{cn(c)}</b>
                    <small>{c.parent?`↳ ${c.parent}`:(c.name_ru||'')}</small>
                  </div>
                </div>
                <span className="pick-chk">{sel?'✓':''}</span>
              </div>
            })}
          </>:<>
            {includeNone&&<div className={'pick-row'+(value===''?' on':'')} onClick={()=>pick('')}>
              <div className="pick-row-l">
                <span className="pick-ico">🗂</span>
                <div className="pick-lbl"><b>{noneLabel||t("Asosiy kategoriya (yo'q)")}</b></div>
              </div>
              <span className="pick-chk">{value===''?'✓':''}</span>
            </div>}
            {roots.map(r=>{
              const kids=(maxDepth===1?[]:tree.childrenOf(r.name)).filter(k=>!exclude||!exclude(k))
              const rootSel=value===r.name
              const hasSelKid=kids.some(k=>k.name===value)
              return <div key={r.name} className={'pick-row'+((rootSel||hasSelKid)?' on':'')} onClick={()=>{
                if(kids.length>0){haptic('sel');setViewRoot(r.name)}
                else pick(r.name)
              }}>
                <div className="pick-row-l">
                  <span className="pick-ico">{EMO[r.name]||'🛒'}</span>
                  <div className="pick-lbl">
                    <b>{cn(r)}</b>
                    {r.name_ru&&cn(r)!==r.name_ru&&<small>{r.name_ru}</small>}
                  </div>
                </div>
                <div className="pick-r">
                  {kids.length>0?<><span className="badge red">{kids.length} {t("bo'lim")}</span><span style={{fontSize:18,fontWeight:800,color:'#9CA3AF'}}>›</span></>
                    :<span className="pick-chk">{rootSel?'✓':''}</span>}
                </div>
              </div>
            })}
          </>}
        </div>
        {canCreate&&(!adding
          ?<button type="button" className="pick-add-btn" onClick={()=>{setNPar(viewRoot||'');setAdding(true)}}>➕ {viewRoot?`«${viewRoot}» ichiga bo'lim qo'shish`:t("Yangi katalog qo'shish")}</button>
          :<div className="pick-create">
            <div className="pick-create-h"><span>➕ {t("Yangi katalog qo'shish")}</span><button type="button" className="sec-link" style={{fontSize:12}} onClick={()=>setAdding(false)}>✕</button></div>
            <input className="in" placeholder="Nomi (o'zbekcha)" value={nUz} onChange={e=>setNUz(e.target.value)}/>
            <input className="in" placeholder="Название (русский, ixtiyoriy)" value={nRu} onChange={e=>setNRu(e.target.value)}/>
            {nPar&&<div className="gap" style={{alignItems:'center',marginBottom:8}}>
              {nImg&&<img src={nImg} style={{width:44,height:44,borderRadius:10,objectFit:'cover'}}/>}
              <label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm tanlash<input type="file" accept="image/*" hidden onChange={pickImg}/></label>
              {nImg&&<button type="button" className="btn s g" onClick={()=>setNImg('')}>✕</button>}
            </div>}
            {tree.roots.length>0&&<div className="chips" style={{marginBottom:8}}>
              <button type="button" className={'chip'+(!nPar?' on':'')} onClick={()=>setNPar('')}>🗂 Asosiy</button>
              {tree.roots.slice(0,12).map(r=><button key={r.name} type="button" className={'chip'+(nPar===r.name?' on':'')} onClick={()=>setNPar(nPar===r.name?'':r.name)}>{(EMO[r.name]||'')+' '+cn(r)}</button>)}
            </div>}
            {err&&<div style={{color:'#BE123C',fontSize:12,fontWeight:700,marginBottom:6}}>{err}</div>}
            <button type="button" className="btn s" style={{width:'100%'}} disabled={busy} onClick={createCat}>{busy?'Saqlanmoqda…':'✓ Yaratish va tanlash'}</button>
          </div>)}
      </div>
    </div>}
  </>
}

function RolePicker({value,customRoles,onSelect,onReload,style}){
  const {t}=useLang()
  const [nm,setNm]=useState(''),[ico,setIco]=useState('🧾'),[base,setBase]=useState('operator'),[cb,setCb]=useState(false),[busy,setBusy]=useState(false),[err,setErr]=useState('')
  const builtIn=[
    {value:'worker',label:"Bo'lim ishchisi",sub:"Faqat o'z bo'limi tovarlarini boshqaradi",icon:'🧑‍🏭',base:'worker',roleTitle:'',canBroadcast:false},
    {value:'operator',label:'Operator',sub:"Buyurtmalarni qabul qiladi va yig'adi",icon:'🎧',base:'operator',roleTitle:'',canBroadcast:false},
    {value:'admin',label:'Admin',sub:"To'liq boshqaruv, tovarlar va statistika",icon:'🛡️',base:'admin',roleTitle:'',canBroadcast:false}
  ]
  const custom=(customRoles||[]).map(r=>({
    value:'custom:'+r.id,
    label:r.name,
    sub:`${ROLE_BASE_LBL[r.base]||r.base}${r.canBroadcast?' · 📣 Xabar':''}`,
    icon:r.icon||'👤',
    deletable:true,
    base:r.base,
    roleTitle:r.name,
    canBroadcast:!!r.canBroadcast,
    rawId:r.id
  }))
  const options=[...builtIn,...custom]
  const delRole=async opt=>{
    if(!confirm(`"${opt.label}" roli o'chirilsinmi?`))return
    try{await api(`/api/custom-roles/${opt.rawId}`,'DELETE');if(onReload)await onReload()}catch(e){alert(e.message)}
  }
  const createRole=async(closeForm,pick)=>{
    const name=nm.trim();if(name.length<2){setErr('Rol nomini kiriting');return}
    setBusy(true);setErr('')
    try{
      const r=await api('/api/custom-roles','POST',{name,base,icon:ico,canBroadcast:cb})
      if(onReload)await onReload()
      setNm('');setCb(false)
      const opt={value:'custom:'+r.item.id,label:r.item.name,base:r.item.base,roleTitle:r.item.name,canBroadcast:!!r.item.canBroadcast}
      closeForm();pick(opt.value,opt)
    }catch(e){setErr(e.message)}
    setBusy(false)
  }
  return <ModernSelect
    value={value}
    options={options}
    onChange={(v,opt)=>onSelect(opt||builtIn.find(x=>x.value===v))}
    onDeleteOption={delRole}
    title={t("Rolni tanlang")}
    placeholder={t("Rolni tanlang")}
    style={style}
    searchable={options.length>=7}
    createLabel={t("Yangi rol qo'shish")}
    renderCreate={(closeForm,pick)=><>
      <div className="pick-create-h"><span>➕ {t("Yangi rol qo'shish")}</span><button type="button" className="sec-link" style={{fontSize:12}} onClick={closeForm}>✕</button></div>
      <input className="in" placeholder="Rol nomi (masalan: Kassir, Menejer, Yetkazuvchi)" value={nm} onChange={e=>setNm(e.target.value)}/>
      <div className="m" style={{marginBottom:4,fontWeight:600}}>Ikonka:</div>
      <div className="ico-strip">{ROLE_ICONS.map(ic=><button key={ic} type="button" className={ico===ic?'on':''} onClick={()=>setIco(ic)}>{ic}</button>)}</div>
      <div className="m" style={{marginBottom:4,fontWeight:600}}>Huquq darajasi:</div>
      <div className="seg" style={{marginBottom:8}}>
        {[['worker',"Bo'lim"],['operator','Operator'],['admin','Admin']].map(([k,l])=>
          <button key={k} type="button" className={base===k?'on':''} onClick={()=>setBase(k)}>{l}</button>)}
      </div>
      {base==='admin'&&<label className="row" style={{margin:'0 0 8px'}}><span style={{fontSize:12.5}}>📣 Xabar yuborish ruxsati</span><input type="checkbox" checked={cb} onChange={e=>setCb(e.target.checked)}/></label>}
      {err&&<div style={{color:'#BE123C',fontSize:12,fontWeight:700,marginBottom:6}}>{err}</div>}
      <button type="button" className="btn s" style={{width:'100%'}} disabled={busy} onClick={()=>createRole(closeForm,pick)}>{busy?'Saqlanmoqda…':'✓ Rol yaratish va tanlash'}</button>
    </>}
  />
}

function WeightSheet({p,cur,close,set,onAdminOpen}){
  const {t,so,pn}=useLang()
  const up=effPrice(p)
  const g=p.min_grams>0
  const minS=Math.max(1000,Number(p.min_sum)||30000)
  const sumChips=[...new Set([minS,...[30000,50000,75000,100000,150000].filter(x=>x>=minS)])].sort((a,b)=>a-b).slice(0,4)
  const [v,setV]=useState(g?(cur?.grams||p.min_grams):(cur?.sum||Math.max(30000,minS)))
  return <div className="sheet" onClick={close}><div onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/>
    <div className="row" style={{margin:'0 0 8px'}}>
      <h2 style={{margin:0}}>{pn(p)} — {so(up)} / kg</h2>
      {onAdminOpen&&<button type="button" className="btn s g" onClick={()=>{close();onAdminOpen(p)}}>📊 / ✏️</button>}
    </div>
    {g?<><div className="qty big soft"><button onClick={()=>setV(x=>Math.max(p.min_grams,x-p.min_grams))}>−</button><b style={{fontSize:18}}>{v>=1000?v/1000+' kg':v+' g'}</b><button onClick={()=>setV(x=>Math.min(20000,x+p.min_grams))}>+</button></div>
      <div className="m" style={{margin:'10px 0'}}>≈ {so(Math.round(up*v/1000))} · {t("Minimal")}: {p.min_grams} g</div></>
    :<><div className="gap" style={{marginBottom:10}}>{sumChips.map(x=><button key={x} className={'chip'+(v===x?' on':'')} onClick={()=>setV(x)}>{so(x)}</button>)}</div>
      <input className="in" type="text" inputMode="numeric" value={v||''} onChange={e=>setV(Number(e.target.value.replace(/\D/g,''))||0)}/>
      <div className="m" style={{marginBottom:12}}>≈ {(v/up).toFixed(3)} kg · {t("Minimal")}: <b>{so(minS)}</b>. Tortilgandan so'ng summa biroz o'zgarishi mumkin — o'zgarsa sizdan tasdiq so'raymiz.</div>
      {v<minS&&<div style={{color:'#BE123C',fontSize:12.5,fontWeight:700,marginTop:-6,marginBottom:10}}>{t("Minimal")}: {so(minS)}</div>}</>}
    <div className="gap"><button className="btn" style={{flex:1}} disabled={!g&&v<minS} onClick={()=>set(g?{grams:v}:{sum:v})}>{t("Savatga")}</button>{cur&&<button className="btn g" style={{flex:'0 0 auto',width:'auto'}} onClick={()=>set(null)}>{t("O'chirish")}</button>}</div>
  </div></div>
}

function Detail({p,d,cart,put,close,onWeight,initMode='view',onReload,onProductUpdated,say}){
  const {t,so,pn}=useLang()
  const isAdm=!p.bundle&&(d?.role==='admin'||d?.role==='superadmin')
  const [mode,setMode]=useState(isAdm?initMode:'view')
  const [an,setAn]=useState(null),[anLoad,setAnLoad]=useState(false),[ed,setEd]=useState(null),[saving,setSaving]=useState(false)
  const tree=buildCatTree(d?.cats||[])

  const curP=an?.product?{...p,...an.product}:p
  const it=cart[keyOf(curP)],max=curP.bundle?20:500,on=isSale(curP)
  const pct=on?Math.max(1,Math.round((1-curP.sale_price/curP.price)*100)):0

  useEffect(()=>{
    if(!isAdm||(mode!=='stats'&&mode!=='edit'))return
    if(an&&an.product?.id===p.id)return
    setAnLoad(true)
    api(`/api/admin/products/${p.id}/analytics`).then(res=>{
      setAn(res)
      const x=res.product
      setEd({...x,barcode:x.barcode||'',price:String(x.price||''),sale_price:x.sale_price?String(x.sale_price):'',sale_until:toLocalInput(x.sale_until),min_grams:x.min_grams||'',min_sum:x.min_sum||'',weight_g:x.weight_g||'',priority:x.priority||3,family:x.family||'',activate:!!x.needs_setup})
    }).catch(e=>say&&say(e.message)).finally(()=>setAnLoad(false))
  },[isAdm,mode,p.id,an])

  const pickImg=async e=>{
    const file=e.target.files[0];if(!file)return
    try{const u=await upload(file);setEd(x=>({...x,image:u}))}catch(er){say?say(er.message):alert(er.message)}
  }

  const toggleActive=async nextActive=>{
    try{
      await api(`/api/products/${p.id}/active`,'PUT',{active:nextActive})
      setAn(a=>a?{...a,product:{...a.product,active:nextActive}}:a)
      setEd(e=>e?{...e,active:nextActive}:e)
      onProductUpdated&&onProductUpdated({...curP,active:nextActive})
      onReload&&onReload()
      say&&say(nextActive?'Faollashtirildi ✅':'Faolsizlantirildi')
    }catch(er){say&&say(er.message)}
  }

  const saveEdit=async()=>{
    if(!ed||saving)return
    setSaving(true)
    try{
      const dt=ed.sale_until?new Date(ed.sale_until):null
      const body={...ed,sale_price:ed.sale_price?Number(ed.sale_price):null,sale_until:ed.sale_price&&dt&&!Number.isNaN(dt.getTime())?dt.toISOString():null,min_grams:Number(ed.min_grams)||0,min_sum:Number(ed.min_sum)||0,weight_g:Number(ed.weight_g)||0,priority:Number(ed.priority)||3,family:String(ed.family||'').trim()||null}
      await api(`/api/products/${p.id}`,'PUT',body)
      const sp=body.sale_price&&body.sale_price>0&&body.sale_price<Math.round(Number(ed.price))?body.sale_price:null
      const nextP={...curP,...ed,price:Math.round(Number(ed.price)),sale_price:sp,sale_until:sp?body.sale_until:null,min_grams:body.min_grams,min_sum:body.min_sum,weight_g:body.weight_g,priority:body.priority,family:body.family,age_min:Math.round(Number(ed.age_min))||0,barcode:String(ed.barcode||'').trim()||null,name_uz:String(ed.name_uz||'').trim()||null,needs_setup:false,active:ed.activate?true:ed.active}
      setAn(a=>a?{...a,product:nextP}:a)
      onProductUpdated&&onProductUpdated(nextP)
      onReload&&onReload()
      say&&say('Saqlandi ✅')
      setMode('view')
    }catch(er){say&&say(er.message)}
    setSaving(false)
  }

  const days=an?.days||[],mx=Math.max(1,...days.map(x=>x.sum)),W=280,H=76
  const pts=days.map((x,i)=>[days.length>1?8+i*((W-16)/(days.length-1)):W/2,H-10-(x.sum/mx)*(H-22)])
  const line=pts.map(pt=>pt.join(',')).join(' ')
  const area=pts.length>1?`${pts[0][0]},${H-10} ${line} ${pts[pts.length-1][0]},${H-10}`:''
  const qFmt=n=>curP.unit==='weight'?`${Number(n||0).toFixed(2)} kg`:`${Math.round(Number(n||0))} ${t('ta')}`

  return <div className="sheet" onClick={close}><div className="det" onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/>
    {isAdm&&<div className="det-adm-bar">
      <button type="button" className={mode==='view'?'on':''} onClick={()=>setMode('view')}>🛍 {t("Ko'rinish")}</button>
      <button type="button" className={mode==='stats'?'on':''} onClick={()=>setMode('stats')}>📊 {t("Tahlil")}</button>
      <button type="button" className={mode==='edit'?'on':''} onClick={()=>setMode('edit')}>✏️ {t("Tahrirlash")}</button>
    </div>}

    {mode==='view'&&<>
      <div style={{position:'relative'}}><Thumb p={curP} cls="dimg" hideSale/>{on&&<span className="disc" style={{fontSize:13,padding:'4px 10px'}}>−{pct}%</span>}</div>
      <div className="row" style={{marginTop:12,alignItems:'flex-start',gap:8}}><h2 style={{margin:0,fontSize:18,flex:1}}>{pn(curP)}</h2>{F(d,'share')&&<button type="button" className="btn s g" onClick={()=>{const txt=`🛍 ${pn(curP)} — ${so(effPrice(curP))}${curP.unit==='weight'?' / kg':''} (TEGEN Market)`;const u=`https://t.me/share/url?url=${encodeURIComponent(location.origin)}&text=${encodeURIComponent(txt)}`;if(tg?.openTelegramLink)tg.openTelegramLink(u);else if(navigator.share)navigator.share({text:txt}).catch(()=>{});else copyText(txt,()=>say&&say(t("Nusxalandi ✅")))}}>📤 {t("Ulashish")}</button>}</div>
      <PriceTag p={curP} big/>
      {on&&curP.sale_until&&<Countdown until={curP.sale_until} mode="blocks"/>}
      <div className="gap" style={{margin:'8px 0'}}>
        <span className="badge gray">{t(curP.category||'Boshqa')}</span>
        {curP.family&&<span className="badge blue">⭐ {t(curP.family)}</span>}
        {curP.age_min>0&&<span className="badge red">{curP.age_min}+</span>}
        {curP.min_grams>0&&<span className="badge amber">{t("Minimal")}: {curP.min_grams} g</span>}
        {curP.unit==='weight'&&curP.min_sum>0&&!(curP.min_grams>0)&&<span className="badge amber">{t("Minimal")}: {so(curP.min_sum)}</span>}
      </div>
      {curP.description&&<p className="m" style={{fontSize:13.5,margin:'6px 0 12px'}}>{curP.description}</p>}
      {curP.unit==='weight'?<button className="btn" onClick={()=>{close();onWeight(curP)}}>{it?so(lsum(curP,it)):t("Savatga")}</button>
      :<>
        <div className="quick-qty">{[1,5,10,20,50].filter(n=>n<=max).map(n=><button key={n} type="button" className={it?.qty===n?'on':''} onClick={()=>put(curP,{qty:n})}>{n} {t("ta")}</button>)}</div>
        {it?<>
          <div className="gap"><div style={{flex:1}}><QtyControl qty={it.qty} max={max} variant="big" stopProp={false} onChange={n=>put(curP,n>0?{qty:n}:null)}/></div><button className="btn" style={{flex:'0 0 auto',width:'auto',padding:'0 22px'}} onClick={close}>OK</button></div>
          <div className="m" style={{marginTop:8,textAlign:'center'}}>{t("Raqamni bosib sonini klaviaturada yozishingiz mumkin")}</div>
        </>:<button className="btn" onClick={()=>put(curP,{qty:1})}>{t("Savatga")}</button>}
      </>}
    </>}

    {mode==='stats'&&<>
      <div className="row" style={{margin:'0 0 10px'}}>
        <div style={{minWidth:0,flex:1}}>
          <b style={{fontSize:16,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{pn(curP)}</b>
          <div className="m">{so(effPrice(curP))}{curP.unit==='weight'?' / kg':''} · {curP.category}</div>
        </div>
        <label className="sw" title="Faol / Nofaol"><input type="checkbox" checked={curP.active!==false} onChange={e=>toggleActive(e.target.checked)}/><i/></label>
      </div>
      {anLoad||!an?<div className="center" style={{minHeight:160}}>{t("Yuklanmoqda…")}</div>:<>
        <div className="pa-grid">
          <div className="pa-kpi hi"><span>💰 Jami tushum</span><b>{so(an.totals.revenue)}</b><small>30 kun: {so(an.recent.rev30)}</small></div>
          <div className="pa-kpi"><span>📦 Jami sotildi</span><b>{qFmt(an.totals.qty)}</b><small>7 kun: {qFmt(an.recent.qty7)}</small></div>
          <div className="pa-kpi"><span>🛍 Buyurtmalar</span><b>{an.totals.orders} ta</b><small>👥 {an.totals.buyers} xaridor</small></div>
          <div className="pa-kpi"><span>🏆 O'rin va reyting</span><b>#{an.product.priority||3} ustuvorlik</b><small>{an.rank.inCat?`Katalogda: #${an.rank.inCat} / ${an.rank.totalInCat}`:'Nofaol'}</small></div>
        </div>

        <div className="pa-chart">
          <div className="row" style={{margin:'0 0 6px'}}>
            <b style={{fontSize:13}}>📈 So'nggi 14 kunlik savdo</b>
            <span className="m">7 kun: {so(an.recent.rev7)}</span>
          </div>
          {days.length>0?<>
            <svg viewBox={`0 0 ${W} ${H}`} className="chart" style={{height:76}}>
              {area&&<polygon points={area} fill="#E11D4818"/>}
              {pts.length>1&&<polyline points={line} fill="none" stroke="#E11D48" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"/>}
              {pts.map((pt,i)=><circle key={i} cx={pt[0]} cy={pt[1]} r={pts.length===1?4.5:2.8} fill="#E11D48"/>)}
            </svg>
            <div className="chart-axis">
              <span>{fmt(days[0].d)}</span>
              {days.length>1&&<span>{fmt(days[days.length-1].d)}</span>}
            </div>
          </>:<div className="m" style={{textAlign:'center',padding:'14px 0'}}>So'nggi 14 kunda sotuv yo'q</div>}
        </div>

        <div className="pa-meta">
          <div className="pa-meta-row"><span>Holat</span><b style={{color:an.product.active?'#059669':'#BE123C'}}>{an.product.active?'✅ Faol':'⛔ Nofaol'}</b></div>
          <div className="pa-meta-row"><span>Oila / Guruh</span><b>{an.product.family||'—'}</b></div>
          <div className="pa-meta-row"><span>Shtrixkod</span><b>{an.product.barcode||'—'}</b></div>
          {an.product.stock!=null&&<div className="pa-meta-row"><span>Ombor qoldig'i</span><b>{an.product.stock}</b></div>}
          <div className="pa-meta-row"><span>Oxirgi buyurtma</span><b>{an.totals.lastOrder?fmtDt(an.totals.lastOrder):'Hali yo\'q'}</b></div>
        </div>

        <button type="button" className="btn" onClick={()=>setMode('edit')}>✏️ {t("Tahrirlash")}</button>
      </>}
    </>}

    {mode==='edit'&&<>
      {anLoad||!ed?<div className="center" style={{minHeight:160}}>{t("Yuklanmoqda…")}</div>:<>
        <label className="row" style={{margin:'0 0 10px',padding:'8px 12px',background:'#F8F9FC',borderRadius:14,border:'1px solid #EEF0F5'}}>
          <span style={{fontSize:13.5,fontWeight:700}}>{ed.active?'✅ Sotuvda faol':'⛔ Nofaol (yashirin)'}</span>
          <label className="sw"><input type="checkbox" checked={!!ed.active} onChange={e=>toggleActive(e.target.checked)}/><i/></label>
        </label>
        <ProductFields f={ed} setF={setEd} dept={null} tree={tree} cats={d.cats} families={d.families} onReload={onReload} onPick={pickImg} onSave={saveEdit} onCancel={()=>setMode('view')} saveLabel={saving?'Saqlanmoqda…':t("Saqlash")}/>
      </>}
    </>}
  </div></div>
}

function BundleDetail({b,d,cart,put,close,onOpenProduct,onReload,say}){
  const isAdm=d?.role==='admin'||d?.role==='superadmin'
  const [imgOverride,setImgOverride]=useState({})
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
      {list.length>0?list.map(x=>{
        const curImg=imgOverride[x.id]??x.image
        const prod={...x,image:curImg,category:x.category||'Boshqa'}
        const pickPImg=async e=>{
          e.stopPropagation()
          const f=e.target.files?.[0];e.target.value='';if(!f)return
          try{
            const u=await upload(f)
            await api(`/api/products/${x.id}/image`,'PUT',{image:u})
            setImgOverride(m=>({...m,[x.id]:u}))
            onReload&&onReload()
            say&&say('Rasm saqlandi ✅')
          }catch(er){say&&say(er.message)}
        }
        return <div className="bitem clickable" key={x.id} onClick={()=>{if(onOpenProduct){haptic('sel');onOpenProduct(prod)}}}>
          <div className="bitem-l">
            <div style={{position:'relative',flex:'none'}}>
              <Thumb p={prod} cls="ci sm"/>
              {isAdm&&<label className="bitem-cam" title="Rasm qo'yish" onClick={e=>e.stopPropagation()}>📷<input type="file" accept="image/*" hidden onChange={pickPImg}/></label>}
            </div>
            <div style={{minWidth:0}}>
              <b>{pn(x)}</b>
              <span className="m">{so(effPrice(prod))}{x.unit==='weight'?' / kg':''}</span>
            </div>
          </div>
          <div className="bitem-r">
            <span className="bitem-qty">× {Number(x.qty)}</span>
            <div className="m" style={{marginTop:2}}>{so(Math.round(effPrice(prod)*Number(x.qty)))}</div>
          </div>
          <span className="bitem-arr">›</span>
        </div>
      }):(b.parts||[]).map((pt,i)=><div className="bitem" key={i}><b>• {pt}</b></div>)}
    </div>

    <div className="quick-qty">{[1,2,3,5].map(n=><button key={n} type="button" className={it?.qty===n?'on':''} onClick={()=>put(p,{qty:n})}>{n} {t("ta")}</button>)}</div>
    {it?<div className="gap"><div style={{flex:1}}><QtyControl qty={it.qty} max={20} variant="big" stopProp={false} onChange={n=>put(p,n>0?{qty:n}:null)}/></div><button className="btn" style={{flex:'0 0 auto',width:'auto',padding:'0 22px'}} onClick={close}>OK</button></div>
      :<button className="btn" onClick={()=>put(p,{qty:1})}>{t("Savatga")}</button>}
  </div></div>
}

function Shop({d,cart,setCart,cat,setCat,favs,toggleFav,goTab,onReload,say}){
  const {t,so,pn,cn}=useLang()
  const [q,setQ]=useState(''),[fam,setFam]=useState(''),[sort,setSort]=useState(''),[favView,setFavView]=useState(false),[qFocus,setQFocus]=useState(false),[qHist,setQHist]=useState(()=>loadSearchHist())
  const [items,setItems]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[loading,setLoading]=useState(false),[sh,setSh]=useState(null),[vid,setVid]=useState(null),[det,setDet]=useState(null),[detMode,setDetMode]=useState('view'),[bdet,setBdet]=useState(null),[subAdd,setSubAdd]=useState(false)
  const dq=useDebounced(q)
  const home=!dq&&!cat&&!fam&&!favView
  const tree=buildCatTree(d.cats)
  const fams=d.families||[]
  const isAdm=d.role==='admin'||d.role==='superadmin'
  const [posP,setPosP]=useState(null)
  const canPos=isAdm&&!!cat&&!dq&&!fam&&!sort&&!favView
  const favSet=new Set(favs)

  useEffect(()=>{if(cat||dq)setFavView(false)},[cat,dq])
  useEffect(()=>{
    const s=dq.trim()
    if(s.length>=2){
      setQHist(prev=>{const next=[s,...prev.filter(x=>x.toLowerCase()!==s.toLowerCase())].slice(0,8);saveSearchHist(next);return next})
    }
  },[dq])

  const load=useCallback((n,reset)=>{
    if(!dq&&!cat&&!fam&&!favView){setItems([]);setMore(false);return}
    if(favView&&!favs.length){setItems([]);setMore(false);return}
    setLoading(true)
    const url=favView
      ?`/api/products?ids=${favs.join(',')}&sort=${encodeURIComponent(sort)}&page=${n}`
      :`/api/products?q=${encodeURIComponent(dq)}&cat=${encodeURIComponent(cat)}&family=${encodeURIComponent(fam)}&sort=${encodeURIComponent(sort)}&page=${n}`
    api(url)
      .then(r=>{setItems(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)})
      .catch(()=>{}).finally(()=>setLoading(false))
  },[dq,cat,fam,sort,favView,favs.join(',')])

  useEffect(()=>{load(0,true)},[load])
  useEffect(()=>{setSubAdd(false);setSort('')},[cat])

  const put=(p,v)=>{haptic('light');setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})}
  const st=e=>e.stopPropagation()

  const actionBtn=p=>{
    const it=cart[keyOf(p)]
    if(p.unit==='weight')return <button className={'add-full'+(it?' weight-in':'')} onClick={e=>{st(e);haptic('light');setSh(p)}}>{it?so(lsum(p,it)):'+ '+t("Savatga")}</button>
    if(it)return <QtyControl qty={it.qty} max={p.bundle?20:500} onChange={n=>put(p,n>0?{qty:n}:null)}/>
    return <button className="add-full" onClick={e=>{st(e);put(p,{qty:1})}}>+ {t("Savatga")}</button>
  }

  const openLink=l=>{const m=/(?:v=|youtu\.be\/|shorts\/)([\w-]{11})/.exec(l||'');if(m)setVid(m[1]);else if(l)tg?.openLink?tg.openLink(l):window.open(l)}
  const curCatObj=tree.byName.get(cat)
  const parentObj=curCatObj?.parent?tree.byName.get(curCatObj.parent):null
  const subCats=cat&&!dq&&!favView?tree.childrenOf(cat):[]
  const chipList=parentObj?tree.childrenOf(parentObj.name):(subCats.length?subCats:tree.roots)
  const onProdUpd=upd=>{
    setDet(upd)
    setItems(prev=>upd.active===false?prev.filter(x=>x.id!==upd.id):prev.map(x=>x.id===upd.id?{...x,...upd}:x))
  }
  const openDetail=p=>{haptic('sel');setDetMode('view');setDet(p)}

  const homeSales=d.homeSales||[]
  const homeHits=d.homeHits||[]

  return <>
    <div className="search-row">
      <div className="search-box" style={{flex:1,marginTop:0}}>
        <span className="search-ico"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
        <input className="search" placeholder={t("Mahsulot qidirish...")} value={q} onFocus={()=>setQFocus(true)} onBlur={()=>setTimeout(()=>setQFocus(false),160)} onChange={e=>setQ(e.target.value)}/>
        {q&&<button className="search-clr" onClick={()=>setQ('')}>✕</button>}
      </div>
      {F(d,'favorites')&&<button type="button" className={'fav-pill'+(favView?' on':'')} onClick={()=>{haptic('light');setQ('');setCat('');setFam('');setSort('');setFavView(v=>!v)}} title={t("Sevimlilar")}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill={favView||favs.length?'currentColor':'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        {favs.length>0&&<span>{favs.length}</span>}
      </button>}
    </div>

    {F(d,'searchHints')&&qFocus&&!q&&<div className="q-suggest" onMouseDown={e=>e.preventDefault()}>
      {qHist.length>0&&<div className="qs-sec">
        <div className="qs-head"><span>🕒 {t("Oxirgi qidiruvlar")}</span><button type="button" onClick={()=>{setQHist([]);saveSearchHist([])}}>{t("Tozalash")}</button></div>
        <div className="qs-chips">{qHist.map(h=><button key={h} type="button" className="qs-chip" onClick={()=>{setQ(h);setQFocus(false)}}>{h}</button>)}</div>
      </div>}
      <div className="qs-sec">
        <div className="qs-head"><span>🔥 {t("Tezkor qidiruv")}</span></div>
        <div className="qs-chips">{QUICK_SEARCH_TAGS.map(tgName=><button key={tgName} type="button" className="qs-chip" onClick={()=>{setQ(tgName);setQFocus(false)}}>{tgName}</button>)}</div>
      </div>
    </div>}

    {d.features?.workingHours&&d.features?.storeOpen===false&&<div className="card closed-banner">🌙 <b>{t("Do'kon hozir yopiq")}</b> · {t("Ish vaqti")}: {d.features?.hours?.from||'08:00'}–{d.features?.hours?.to||'22:00'}</div>}
    {home?<>
      {F(d,'banners')&&d.banners.length>0&&<HeroBanners banners={d.banners} onOpen={openLink}/>}

      {fams.length>0&&<div className="chips" style={{paddingTop:4}}>
        {fams.map(fm=><button key={fm} className="chip" onClick={()=>{setFam(fm);scrollTo({top:0,behavior:'smooth'})}}>⭐ {t(fm)}</button>)}
      </div>}

      {F(d,'homeShelves')&&homeSales.length>0&&<>
        <div className="sec-head">
          <h2 className="sec">🔥 {t("Qaynoq aksiyalar")}</h2>
          {goTab&&<button type="button" className="sec-link" onClick={()=>{goTab('promo');scrollTo({top:0,behavior:'smooth'})}}>{t("Hammasi")} →</button>}
        </div>
        <div className="hrow shelf-row">
          {homeSales.map(p=><ProductCard key={'hs:'+p.id} p={p} fav={favSet.has(p.id)} onFav={F(d,'favorites')?toggleFav:null} onOpen={openDetail} actionBtn={actionBtn} shelf/>)}
        </div>
      </>}

      {F(d,'videos')&&d.videos.length>0&&<>
        <div className="sec-head"><h2 className="sec">▶ {t("Yangiliklar")}</h2></div>
        <div className="hrow">{d.videos.map(v=><div className="vid" key={v.id} onClick={()=>setVid(v.yt_id)} style={{backgroundImage:`url(https://img.youtube.com/vi/${v.yt_id}/hqdefault.jpg)`}}><b>▶</b><span>{v.title}</span></div>)}</div>
      </>}

      {F(d,'bundles')&&d.bundles.length>0&&<>
        <div className="sec-head"><h2 className="sec">🎁 {t("Naborlar")}</h2></div>
        <BundleCarousel bundles={d.bundles} onOpen={setBdet} actionBtn={actionBtn}/>
      </>}

      <CategoryBentoCatalog tree={tree} isAdm={isAdm} onPick={name=>{setCat(name);scrollTo({top:0,behavior:'smooth'})}} onReload={onReload} say={say}/>
    </>:<>
      <div className="cat-bar">
        <button className="back-btn" aria-label="Back" onClick={()=>{if(favView){setFavView(false)}else if(dq){setQ('')}else if(fam&&!cat){setFam('')}else if(parentObj){setCat(parentObj.name)}else{setCat('');setFam('')}}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1>{favView?'❤️ '+t("Sevimlilar"):dq?t("Qidiruv natijalari"):(parentObj?cn(parentObj):(curCatObj?cn(curCatObj):(fam?t(fam):cat)))}</h1>
        {isAdm&&cat&&!dq&&!favView&&(!curCatObj?.parent)&&<button type="button" className="btn s g" style={{flex:'none'}} onClick={()=>setSubAdd(o=>!o)}>{subAdd?'✕':"+ Bo'lim"}</button>}
      </div>

      {isAdm&&subAdd&&cat&&!dq&&!favView&&<QuickSubCatBox parent={cat} onReload={onReload} say={say} close={()=>setSubAdd(false)}/>}

      {subCats.length>0&&<BentoTileGrid items={subCats} parentName={cat} tree={tree} isAdm={isAdm} onPick={name=>{setCat(name);scrollTo({top:0,behavior:'smooth'})}} onReload={onReload} say={say}/>}

      {parentObj&&!dq&&!favView&&<>
        <div className="sub-tabs">
          <button type="button" className={'sub-tab'+(cat===parentObj.name?' on':'')} onClick={()=>setCat(parentObj.name)}>{t("Hammasi")}</button>
          {chipList.map(c=><button key={c.name} type="button" className={'sub-tab'+(cat===c.name?' on':'')} onClick={()=>setCat(c.name)}>{cn(c)}</button>)}
        </div>
        <h2 className="sub-sec-title">{curCatObj?cn(curCatObj):cat}</h2>
      </>}

      {!parentObj&&!subCats.length&&!favView&&<div className="chips">
        <button className={'chip'+(!cat&&!fam?' on':'')} onClick={()=>{setCat('');setFam('')}}>{dq?t("Hammasi"):'🏠 '+t("Bosh sahifa")}</button>
        {chipList.map(c=><button key={c.name} className={'chip'+(cat===c.name?' on':'')} onClick={()=>setCat(c.name)}>{(EMO[c.name]||'')+' '+cn(c)}</button>)}
      </div>}

      {fams.length>0&&!favView&&<div className="chips sub">
        <button className={'chip'+(!fam?' on':'')} onClick={()=>setFam('')}>{t("Hammasi")}</button>
        {fams.map(fm=><button key={fm} className={'chip'+(fam===fm?' on':'')} onClick={()=>setFam(fm)}>⭐ {t(fm)}</button>)}
      </div>}

      {F(d,'sorting')&&<div className="sort-bar">
        {[['','✨ '+t("Standart")],['pop','🔥 '+t("Mashhur")],['cheap','💰 '+t("Arzonroq")],['exp','💎 '+t("Qimmatroq")],['sale','🏷 '+t("Aksiya")]].map(([k,l])=>
          <button key={k} type="button" className={'sort-chip'+(sort===k?' on':'')} onClick={()=>{haptic('sel');setSort(k)}}>{l}</button>
        )}
      </div>}

      {loading&&!items.length?<SkeletonGrid count={6}/>:<div className="grid">
        {items.map((p,i)=><ProductCard key={p.id} p={p} idx={i} canPos={canPos} onPos={setPosP} fav={favSet.has(p.id)} onFav={F(d,'favorites')?toggleFav:null} onOpen={openDetail} actionBtn={actionBtn}/>)}
      </div>}
      {!loading&&!items.length&&<div className="empty-box">
        <span>{favView?'❤️':'🔍'}</span>
        <b>{favView?t("Sevimlilar ro'yxati bo'sh"):t("Hech narsa topilmadi")}</b>
      </div>}
      <AutoMore more={more} loading={loading} onMore={()=>load(pg+1,false)}/>
    </>}

    {sh&&<WeightSheet p={sh} cur={cart[keyOf(sh)]} close={()=>setSh(null)} set={v=>{put(sh,v);setSh(null)}} onAdminOpen={isAdm?p=>{setDetMode('stats');setDet(p)}:undefined}/>}
    {det&&<Detail key={det.id+':'+detMode} p={det} d={d} cart={cart} put={put} close={()=>setDet(null)} onWeight={setSh} initMode={detMode} onReload={onReload} onProductUpdated={onProdUpd} say={say}/>}
    {bdet&&<BundleDetail b={bdet} d={d} cart={cart} put={put} close={()=>setBdet(null)} onReload={onReload} say={say} onOpenProduct={prod=>{setBdet(null);openDetail(prod)}}/>}
    {posP&&<PosSheet p={posP.p} cur={posP.n} total={items.length+(more?'+':'')} cat={cat} close={()=>setPosP(null)} done={()=>{setPosP(null);load(0,true)}} say={say}/>}
    {vid&&<div className="sheet" onClick={()=>setVid(null)}><div onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><div className="yt"><iframe src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&origin=${encodeURIComponent(location.origin)}`} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen/></div><a className="btn g" style={{marginTop:10,display:'block',textAlign:'center',textDecoration:'none'}} href={`https://youtu.be/${vid}`} target="_blank" rel="noreferrer">YouTube ↗</a><button className="btn g" style={{marginTop:8}} onClick={()=>setVid(null)}>✕</button></div></div>}
  </>
}

function PosSheet({p,cur,total,cat,close,done,say}){
  const {pn}=useLang()
  const [v,setV]=useState(String(cur)),[busy,setBusy]=useState(false)
  const send=async pos=>{if(busy)return;setBusy(true);try{await api('/api/products/'+p.id+'/position','PUT',{pos,cat});say?.(pos>0?`✅ ${pos}-o'ringa ko'chirildi`:'✅ Avtomatik tartib tiklandi');done()}catch(e){say?.(e.message||'Xato');setBusy(false)}}
  const n=Math.round(+v)
  return <div className="sheet" onClick={close}><div onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/>
    <div className="pos-head"><b>{pn(p)}</b><span>Hozir: {cur}-o'rin · jami {total}</span></div>
    <label className="pos-lbl">Yangi tartib raqami</label>
    <div className="pos-row">
      <button type="button" className="btn g" onClick={()=>setV(x=>String(Math.max(1,(+x||1)-1)))}>−</button>
      <input className="in pos-inp" type="number" inputMode="numeric" min="1" value={v} onChange={e=>setV(e.target.value.replace(/\D/g,'').slice(0,5))} onKeyDown={e=>{if(e.key==='Enter'&&n>=1)send(n)}} autoFocus/>
      <button type="button" className="btn g" onClick={()=>setV(x=>String((+x||0)+1))}>+</button>
    </div>
    <div className="pos-quick">
      <button type="button" className="btn s g" onClick={()=>send(1)} disabled={busy}>⬆ Eng boshiga</button>
      {cur>1&&<button type="button" className="btn s g" onClick={()=>send(cur-1)} disabled={busy}>↑ 1 ta oldinga</button>}
      <button type="button" className="btn s g" onClick={()=>send(cur+1)} disabled={busy}>↓ 1 ta orqaga</button>
    </div>
    <button type="button" className="btn" style={{marginTop:12}} disabled={busy||!(n>=1)||n===cur} onClick={()=>send(n)}>{busy?'…':`${n>=1?n:'?'}-o'ringa qo'yish`}</button>
    <button type="button" className="btn g" style={{marginTop:8}} disabled={busy} onClick={()=>confirm("Bu katalogdagi barcha qo'lda qo'yilgan tartib o'chirilib, avtomatik (prioritet + sotuv) tartibga qaytarilsinmi?")&&send(0)}>↺ Katalogni avtomatik tartibga qaytarish</button>
  </div></div>
}

function QuickSubCatBox({parent,onReload,say,close}){
  const [name,setName]=useState(''),[nameRu,setNameRu]=useState(''),[img,setImg]=useState(''),[sec,setSec]=useState(''),[sort,setSort]=useState(''),[busy,setBusy]=useState(false)
  const pick=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;setBusy(true);try{setImg(await upload(f))}catch(er){say&&say(er.message)}setBusy(false)}
  const save=async()=>{
    const n=name.trim();if(!n){say&&say("Bo'lim nomini kiriting");return}
    setBusy(true)
    try{
      await api('/api/cats','POST',{name:n,name_ru:nameRu.trim(),image:img||null,section:sec,sort:Number(sort)||0,parent})
      if(onReload)await onReload()
      say&&say(`✅ "${n}" qo'shildi`)
      setName('');setNameRu('');setImg('');setSec('');setSort('')
      close&&close()
    }catch(er){say&&say(er.message)}
    setBusy(false)
  }
  return <div className="card" style={{background:'#F8FAFC',borderColor:'#FECDD3',marginBottom:12}}>
    <div className="row" style={{margin:'0 0 8px'}}>
      <b style={{fontSize:14}}>➕ «{parent}» ichiga yangi bo'lim</b>
      <button type="button" className="sec-link" onClick={close}>✕</button>
    </div>
    <input className="in" placeholder="Bo'lim nomi (masalan: Pishloq, Yogurt va siroklar)" value={name} onChange={e=>setName(e.target.value)}/>
    <input className="in" placeholder="Название (русский, ixtiyoriy)" value={nameRu} onChange={e=>setNameRu(e.target.value)}/>
    <div className="gap">
      <ModernSelect style={{flex:1.6}} value={sec} options={TILE_SIZES} onChange={setSec} title="Karta kengligi (Zik-zak)"/>
      <input className="in" style={{flex:1}} type="text" inputMode="numeric" placeholder="Tartib (1 = 1-o'rin)" value={sort} onChange={e=>setSort(digits(e.target.value))}/>
    </div>
    <div className="gap" style={{alignItems:'center',marginBottom:8}}>
      {img&&<img src={img} style={{width:44,height:44,borderRadius:10,objectFit:'cover'}}/>}
      <label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm tanlash<input type="file" accept="image/*" hidden onChange={pick}/></label>
      {img&&<button type="button" className="btn s g" onClick={()=>setImg('')}>✕</button>}
    </div>
    <button type="button" className="btn s" style={{width:'100%'}} disabled={busy} onClick={save}>{busy?'Saqlanmoqda…':"✓ Bo'lim qo'shish"}</button>
  </div>
}

function CatPosSheet({c,cur,sibs,close,onReload,say}){
  const [val,setVal]=useState(String(cur)),[busy,setBusy]=useState(false)
  const n=Math.max(1,Math.min(sibs.length,Number(String(val||'').replace(/\D/g,''))||cur))
  const move=async pos=>{
    if(busy)return;setBusy(true)
    try{
      const names=sibs.map(x=>x.name).filter(x=>x!==c.name)
      names.splice(Math.max(0,Math.min(names.length,pos-1)),0,c.name)
      await api('/api/cats/reorder','PUT',{names})
      if(onReload)await onReload()
      say&&say(`✅ "${c.name}" #${pos}-o'ringa qo'yildi`)
      close()
    }catch(e){say&&say(e.message)}
    setBusy(false)
  }
  return <div className="sheet" onClick={close}><div className="wsh" onClick={e=>e.stopPropagation()}>
    <div className="sheet-handle"/>
    <h3 style={{margin:'4px 0'}}>🔢 Bo'lim tartib raqami</h3>
    <div className="m" style={{marginBottom:10}}><b>{c.name}</b> · hozirgi o'rni: <b>#{cur}</b> / {sibs.length}</div>
    <input className="in" autoFocus type="text" inputMode="numeric" value={val} onChange={e=>setVal(digits(e.target.value))}/>
    <div className="pos-quick">
      <button type="button" className="btn s g" onClick={()=>move(1)} disabled={busy||cur===1}>⬆ 1-o'ringa</button>
      {cur>1&&<button type="button" className="btn s g" onClick={()=>move(cur-1)} disabled={busy}>↑ Oldinga</button>}
      {cur<sibs.length&&<button type="button" className="btn s g" onClick={()=>move(cur+1)} disabled={busy}>↓ Orqaga</button>}
    </div>
    <button type="button" className="btn" style={{marginTop:12}} disabled={busy||n===cur} onClick={()=>move(n)}>{busy?'…':`#${n}-o'ringa qo'yish`}</button>
  </div></div>
}

function BentoTileGrid({items,parentName,tree,isAdm,onPick,onReload,say,colorIdx=0,onAddSub}){
  const [posC,setPosC]=useState(null)
  const {t,cn}=useLang()
  const autoSpans=bentoSpans(items.length)
  return <div className="bento-grid">
    {items.map((c,i)=>{
      const manual=parseSpan(c.section)
      const sp=manual||autoSpans[i]||3
      const bg=parentName?catPastel(parentName,colorIdx):catPastel(c.name,i+colorIdx)
      const subCount=tree?tree.childrenOf(c.name).length:0
      return <div
        key={c.name}
        className={`bento-tile sp-${sp}${c.image?" has-img":""}`}
        style={{background:bg}}
        onClick={()=>onPick(c.name)}
      >
        <div className="bento-title">{cn(c)}</div>
        {c.image
          ?<div className="bento-pic"><img src={c.image} alt={cn(c)} loading="lazy"/></div>
          :<span className="bento-emo">{EMO[c.name]||(parentName&&EMO[parentName])||'🛒'}</span>}
        {subCount>0&&<span className="bento-sub-pill">{subCount} {t("bo'lim")}</span>}
        {isAdm&&<div className="bento-adm-acts">
          <button type="button" className={'cat-sz'+(c.sort>0?' custom':'')} title="Tartib raqami" onClick={e=>{e.stopPropagation();setPosC({c,n:i+1})}}>#{i+1}</button>
          {onAddSub&&!c.parent&&<button type="button" className="cat-sz" title="Ichki bo'lim qo'shish" onClick={e=>{e.stopPropagation();onAddSub(c.name)}}>＋</button>}
          <CatSizeBtn c={c} onReload={onReload} say={say}/>
          <CatCamBtn c={c} onReload={onReload} say={say}/>
        </div>}
      </div>
    })}
    {posC&&<CatPosSheet c={posC.c} cur={posC.n} sibs={items} close={()=>setPosC(null)} onReload={onReload} say={say}/>}
  </div>
}

function CategoryBentoCatalog({tree,isAdm,onPick,onReload,say,filter='',beforeLast=null}){
  const {t,cn}=useLang()
  const [addFor,setAddFor]=useState(null)
  const q=filter.trim().toLowerCase()
  const match=c=>!q||c.name.toLowerCase().includes(q)||(c.name_ru||'').toLowerCase().includes(q)||cn(c).toLowerCase().includes(q)
  const sections=[],emptyRoots=[]
  tree.roots.forEach((r,idx)=>{
    const kids=tree.childrenOf(r.name)
    if(kids.length>0){
      const vis=q?(match(r)?kids:kids.filter(match)):kids
      if(vis.length>0)sections.push({root:r,kids:vis,idx})
    }else if(isAdm&&match(r))emptyRoots.push({root:r,idx})
  })
  return <>
    {sections.map(({root,kids,idx},sIdx)=><Fragment key={root.name}>
      {beforeLast&&sections.length>=2&&sIdx===sections.length-1&&beforeLast}
      <div className="bento-sec kz-sec">
        <div className="bento-sec-head">
          <h2 style={{cursor:'default'}}>{cn(root)}</h2>
          {isAdm&&<button type="button" className="bento-sec-more" onClick={()=>setAddFor(addFor===root.name?null:root.name)}>{addFor===root.name?'✕':"+ Bo'lim"}</button>}
        </div>
        {isAdm&&addFor===root.name&&<QuickSubCatBox parent={root.name} onReload={onReload} say={say} close={()=>setAddFor(null)}/>}
        <BentoTileGrid items={kids} parentName={root.name} tree={tree} isAdm={isAdm} onPick={onPick} onReload={onReload} say={say} colorIdx={idx}/>
      </div>
    </Fragment>)}
    {beforeLast&&sections.length<2&&beforeLast}
    {isAdm&&emptyRoots.length>0&&<div className="card" style={{background:'#F8FAFC',borderStyle:'dashed'}}>
      <div className="m" style={{marginBottom:8}}>📁 Ichki katalogi hali qo'shilmagan asosiy kataloglar (faqat adminga ko'rinadi — <b>+ Bo'lim</b> bosib ichki katalog qo'shing):</div>
      <div className="chips" style={{paddingBottom:0}}>
        {emptyRoots.map(({root})=><button key={root.name} type="button" className={'chip'+(addFor===root.name?' on':'')} onClick={()=>setAddFor(addFor===root.name?null:root.name)}>＋ {cn(root)}</button>)}
      </div>
      {addFor&&emptyRoots.some(x=>x.root.name===addFor)&&<div style={{marginTop:10}}><QuickSubCatBox parent={addFor} onReload={onReload} say={say} close={()=>setAddFor(null)}/></div>}
    </div>}
    {!sections.length&&!emptyRoots.length&&<div className="empty-box"><span>🗂</span><b>{t("Hech narsa topilmadi")}</b></div>}
  </>
}

function ScrollTopBtn(){
  const [vis,setVis]=useState(false)
  useEffect(()=>{
    const onS=()=>setVis(window.scrollY>360)
    window.addEventListener('scroll',onS,{passive:true})
    return()=>window.removeEventListener('scroll',onS)
  },[])
  if(!vis)return null
  return <button type="button" className="to-top-btn" aria-label="Yuqoriga" onClick={()=>scrollTo({top:0,behavior:'smooth'})}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
  </button>
}

function Promo({d,cart,setCart,favs,toggleFav,onReload,say}){
  const {t,so,cn}=useLang()
  const tree=buildCatTree(d.cats)
  const isAdm=d.role==='admin'||d.role==='superadmin'
  const [cat,setCat]=useState(''),[sort,setSort]=useState(''),[items,setItems]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[loading,setLoading]=useState(true),[sh,setSh]=useState(null),[det,setDet]=useState(null),[detMode,setDetMode]=useState('view')
  const favSet=new Set(favs||[])
  const load=useCallback((n,reset)=>{
    setLoading(true)
    api(`/api/products?sale=1&cat=${encodeURIComponent(cat)}&sort=${encodeURIComponent(sort)}&page=${n}`)
      .then(r=>{setItems(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)})
      .catch(()=>{}).finally(()=>setLoading(false))
  },[cat,sort])
  useEffect(()=>{load(0,true)},[load])
  const put=(p,v)=>{haptic('light');setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})}
  const st=e=>e.stopPropagation()
  const actionBtn=p=>{
    const it=cart[keyOf(p)]
    if(p.unit==='weight')return <button className={'add-full'+(it?' weight-in':'')} onClick={e=>{st(e);haptic('light');setSh(p)}}>{it?so(lsum(p,it)):'+ '+t("Savatga")}</button>
    if(it)return <QtyControl qty={it.qty} max={500} onChange={n=>put(p,n>0?{qty:n}:null)}/>
    return <button className="add-full" onClick={e=>{st(e);put(p,{qty:1})}}>+ {t("Savatga")}</button>
  }
  const onProdUpd=upd=>{
    setDet(upd)
    setItems(prev=>upd.active===false?prev.filter(x=>x.id!==upd.id):prev.map(x=>x.id===upd.id?{...x,...upd}:x))
  }
  const openDetail=p=>{haptic('sel');setDetMode('view');setDet(p)}
  return <>
    <div className="sale-hero">
      <h1>🔥 {t("Aksiya va chegirmalar")}</h1>
      <p>{t("Chegirmali mahsulotlar — vaqt tugaguncha ulguring!")}</p>
    </div>
    <div className="chips">
      <button className={'chip'+(!cat?' on':'')} onClick={()=>setCat('')}>{t("Hammasi")}</button>
      {tree.roots.map(c=><button key={c.name} className={'chip'+(cat===c.name?' on':'')} onClick={()=>setCat(c.name)}>{(EMO[c.name]||'')+' '+cn(c)}</button>)}
    </div>
    <div className="sort-bar">
      {[['','✨ '+t("Standart")],['pop','🔥 '+t("Mashhur")],['cheap','💰 '+t("Arzonroq")],['exp','💎 '+t("Qimmatroq")]].map(([k,l])=>
        <button key={k} type="button" className={'sort-chip'+(sort===k?' on':'')} onClick={()=>{haptic('sel');setSort(k)}}>{l}</button>
      )}
    </div>
    {loading&&!items.length?<SkeletonGrid count={6}/>:<div className="grid">
      {items.map((p,i)=><ProductCard key={p.id} p={p} idx={i} fav={favSet.has(p.id)} onFav={F(d,'favorites')?toggleFav:null} onOpen={openDetail} actionBtn={actionBtn}/>)}
    </div>}
    {!loading&&!items.length&&<div className="empty-box"><span>🏷</span><b>{t("Hozircha aksiya mahsulotlari yo'q")}</b></div>}
    <AutoMore more={more} loading={loading} onMore={()=>load(pg+1,false)}/>
    {sh&&<WeightSheet p={sh} cur={cart[keyOf(sh)]} close={()=>setSh(null)} set={v=>{put(sh,v);setSh(null)}} onAdminOpen={isAdm?p=>{setDetMode('stats');setDet(p)}:undefined}/>}
    {det&&<Detail key={det.id+':'+detMode} p={det} d={d} cart={cart} put={put} close={()=>setDet(null)} onWeight={setSh} initMode={detMode} onReload={onReload} onProductUpdated={onProdUpd} say={say}/>}
  </>
}

function Catalog({d,go,onReload,say}){
  const {t}=useLang()
  const [q,setQ]=useState('')
  const tree=buildCatTree(d.cats)
  const isAdm=d.role==='admin'||d.role==='superadmin'
  return <>
    <div className="search-row" style={{marginBottom:10}}>
      <div className="search-box" style={{flex:1,marginTop:0}}>
        <span className="search-ico"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
        <input className="search" placeholder={t("Do'kondan topish")} value={q} onChange={e=>setQ(e.target.value)}/>
        {q&&<button className="search-clr" onClick={()=>setQ('')}>✕</button>}
      </div>
    </div>
    <CategoryBentoCatalog tree={tree} isAdm={isAdm} onPick={go} onReload={onReload} say={say} hideTitle filter={q}/>
  </>
}

function DeliveryMeter({d,sub}){
  const {t,so}=useLang()
  const dl=d.settings?.delivery
  if(!dl?.enabled||!F(d,'delivery')||!F(d,'deliveryMeter'))return null
  const minT=Number(dl.minTotal)||0
  const freeT=Number(d.settings?.freeDeliveryThreshold)
  const useMin=minT>0
  const target=useMin?minT:(Number.isFinite(freeT)&&freeT>0?freeT:0)
  if(!(target>0))return null
  const pct=Math.min(100,Math.round((sub/target)*100))
  const rem=Math.max(0,target-sub)
  const done=rem<=0
  const lbl=useMin
    ?(done?'✅ '+t("Yetkazib berish mumkin!"):`🚚 ${t("Minimal buyurtmagacha")}: ${so(rem)}`)
    :(done?'🎉 '+t("Bepul yetkazib berish!"):`🚚 ${t("Bepul yetkazishgacha")}: ${so(rem)}`)
  return <div className={'dl-meter'+(done?' ok':'')}>
    <div className="dl-meter-top"><span>{lbl}</span><b>{pct}%</b></div>
    <div className="dl-meter-bar"><i style={{width:pct+'%'}}/></div>
  </div>
}

function Cart({d,cart,setCart,act,done,onReload}){
  const {t,so,pn}=useLang()
  const [type,setType]=useState('pickup'),[addr,setAddr]=useState(''),[phone,setPhone]=useState(''),[comment,setComment]=useState(''),[rec,setRec]=useState([]),[sh,setSh]=useState(null)
  const lines=Object.entries(cart).map(([k,v])=>({k,p:v.p,v})),dl=d.settings.delivery
  const sub=lines.reduce((s,{p,v})=>s+lsum(p,v),0),age=Math.max(0,...lines.map(l=>l.p.age_min||0))
  const estKg=lines.reduce((w,{p,v})=>{
    if(p.bundle)return w
    if(p.unit==='weight'){
      if(v.grams)return w+v.grams/1000
      if(v.sum){const up=effPrice(p);return w+(up>0?v.sum/up:0)}
      return w+(Number(v.qty)||0)
    }
    return w+((Number(p.weight_g)||0)*(Number(v.qty)||1))/1000
  },0)
  const prods=lines.filter(l=>!l.p.bundle),cats=[...new Set(prods.map(l=>l.p.category))].join('|'),ex=prods.map(l=>l.p.id).join(',')
  useEffect(()=>{if(!cats){setRec([]);return}api(`/api/recommend?cats=${encodeURIComponent(cats)}&ex=${ex}`).then(setRec).catch(()=>{})},[cats,ex])
  const put=(p,v)=>{haptic('light');setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})}
  if(!lines.length)return <div className="empty-box" style={{minHeight:300}}><span>🛒</span><b>{t("🛒 Savat bo'sh")}</b></div>
  const needPhone=!d.user.phone
  const phoneOk=!needPhone||phone.replace(/\D/g,'').length>=9
  const minT=dl.minTotal||0,maxKg=Number(dl.maxKg)||0,overKg=type==='delivery'&&maxKg>0&&estKg>maxKg
  const addrOk=addr.trim().length>=2
  const closed=d.features?.workingHours&&d.features?.storeOpen===false
  const ok=!closed&&phoneOk&&(type==='pickup'||(sub>=minT&&!overKg&&addrOk))
  return <>
    <h1>{t("Savat")}</h1>
    <DeliveryMeter d={d} sub={sub}/>
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

    {F(d,'recommendations')&&rec.length>0&&<>
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
      {dl.enabled&&F(d,'delivery')&&<button className={type==='delivery'?'on':''} onClick={()=>setType('delivery')}>{t("🚚 Yetkazib berish")}</button>}</div>
    {type==='delivery'&&<div className="card">
      {(()=>{const past=[...new Set([...loadAddrs(),...d.orders.filter(o=>o.user_id==d.user.telegramId&&o.type==='delivery'&&o.address).map(o=>o.address.trim())])].filter(Boolean).slice(0,5);return past.length>0&&<div className="addr-pick">{past.map(a=><button key={a} type="button" className={'chip'+(addr===a?' on':'')} onClick={()=>setAddr(a)}>📍 {a.length>26?a.slice(0,26)+'…':a}</button>)}</div>})()}
      <textarea className="in" rows={2} placeholder={t("Manzil (ko'cha, uy, mo'ljal)")} value={addr} onChange={e=>setAddr(e.target.value)}/>
      <div className="m">📞 Buyurtmadan keyin administrator telefon orqali bog'lanib tasdiqlaydi.{minT>0&&` Minimal summa: ${so(minT)}.`}{maxKg>0&&` ${t("Maksimal og'irlik")}: ${maxKg} kg.`} {dl.note}</div>
      {sub<minT&&<div style={{color:'#BE123C',fontSize:13,marginTop:4,fontWeight:600}}>Yana {so(minT-sub)} kerak</div>}
      {!addrOk&&<div style={{color:'#BE123C',fontSize:13,marginTop:4,fontWeight:600}}>📍 {t("Manzil (ko'cha, uy, mo'ljal)")}ni kiriting</div>}
      {overKg&&<div style={{color:'#BE123C',fontSize:13,marginTop:4,fontWeight:600}}>⚖️ Yetkazib berish limiti {maxKg} kg (hozir ~{estKg.toFixed(2)} kg). Ba'zi tovarlarni kamaytiring yoki olib ketishni tanlang.</div>}
    </div>}

    {F(d,'orderComment')&&<div className="card"><input className="in" style={{marginBottom:0}} maxLength={300} placeholder={'💬 '+t("Buyurtmaga izoh (ixtiyoriy)")} value={comment} onChange={e=>setComment(e.target.value)}/></div>}
    {closed&&<div className="card closed-banner">🌙 <b>{t("Do'kon hozir yopiq")}</b> · {t("Ish vaqti")}: {d.features?.hours?.from||'08:00'}–{d.features?.hours?.to||'22:00'}</div>}
    {needPhone&&<div className="card" style={{background:'#FFF7F8',borderColor:'#FECDD3'}}>
      <h2 style={{marginBottom:4}}>📱 {t("Telefon raqam")}</h2>
      <div className="m" style={{marginBottom:8}}>{t("Bir marta kiritiladi — keyingi buyurtmalarda so'ralmaydi")}</div>
      {tg?.requestContact&&<button type="button" className="btn s" style={{width:'100%',marginBottom:8}} onClick={()=>shareTgPhone(setPhone,onReload)}>📱 {t("Telegramdan raqamni ulashish")}</button>}
      <input className="in" style={{marginBottom:0}} type="tel" placeholder="+998 90 123 45 67" value={phone} onChange={e=>setPhone(e.target.value)}/>
    </div>}

    <div className="card"><div className="row"><span>{t("Mahsulotlar")}</span><b>{so(sub)}</b></div>
      {estKg>0&&<div className="row"><span>⚖️ {t("Taxminiy og'irlik")}</span><b style={overKg?{color:'#BE123C'}:undefined}>{estKg.toFixed(2)} kg{type==='delivery'&&maxKg>0?` / max ${maxKg} kg`:''}</b></div>}
      <div className="row" style={{fontSize:17}}><b>{t("Jami")}</b><b style={{color:'#E11D48'}}>{so(sub)}</b></div>
      {d.user.cardStatus==='active'&&d.user.cardNumber&&<div className="m" style={{color:'#B91C1C',fontWeight:600}}>💳 {t("Diskont karta")}: {d.user.cardNumber} (2% {t("keshbek")})</div>}
      {lines.some(l=>l.v.sum)&&<div className="m">⚖️ Og'irlikli tovarlar tortilgach narx o'zgarsa, tasdiqlashingiz so'raladi.</div>}
      {age>0&&<div className="m">{t("🔞 Yosh tasdig'i botda so'raladi.")}</div>}</div>
    <button className="btn" disabled={!ok} onClick={()=>act(async()=>{
      if(type==='delivery'&&addr.trim().length>=2){const cur=loadAddrs();if(!cur.includes(addr.trim()))saveAddrs([addr.trim(),...cur])}
      await api('/api/orders','POST',{items:lines.map(({p,v})=>p.bundle?{bundleId:p.id,qty:v.qty}:{productId:p.id,...(v.sum?{sum:v.sum}:v.grams?{grams:v.grams}:{qty:v.qty})}),type,address:addr,comment:comment.trim()||undefined,...(needPhone?{phone}:{})});setCart({});setComment('');done()
    },'Buyurtma yuborildi ✅')}>{t("Buyurtma berish")}</button>
    {sh&&<WeightSheet p={sh} cur={cart[keyOf(sh)]} close={()=>setSh(null)} set={v=>{put(sh,v);setSh(null)}}/>}
  </>
}

function OrderTracker({status}){
  const {t}=useLang()
  if(status==='cancelled')return null
  const steps=[['accepted','✓',t("Qabul")],['preparing','⚙️',t("Yig'ilmoqda")],['ready','🛍',t("Tayyor")],['completed','🎉',t("Yakunlandi")]]
  const idx=status==='completed'?3:status==='ready'?2:(['preparing','awaiting_confirm','sub_pending'].includes(status)?1:status==='accepted'?0:-1)
  return <div className="ord-track">
    {steps.map(([k,ico,lbl],i)=>{
      const done=i<=idx,cur=i===idx||(idx===-1&&i===0)
      return <div key={k} className={'ot-step'+(done?' done':'')+(cur?' cur':'')}>
        <div className="ot-node">{done?'✓':ico}</div>
        <span>{lbl}</span>
        {i<steps.length-1&&<i className={'ot-line'+(i<idx?' done':'')}/>}
      </div>
    })}
  </div>
}

function Orders({d,act,onReorder,cart={},setCart,favs=[],toggleFav,onReload,say}){
  const {t,so}=useLang()
  const [ed,setEd]=useState(null),[wsh,setWsh]=useState(null),[sh,setSh]=useState(null),[det,setDet]=useState(null)
  const mine=d.orders.filter(o=>o.user_id==d.user.telegramId),post=(o,p,b,m)=>act(()=>api(`/api/orders/${o.id}/${p}`,'POST',b),m)
  const homeHits=d.homeHits||[],favSet=new Set(favs)
  const put=(p,v)=>{if(!setCart)return;haptic('light');setCart(c=>{const n={...c},k=keyOf(p);v?n[k]={p,...v}:delete n[k];return n})}
  const actionBtn=p=>{
    const it=cart[keyOf(p)],st=e=>e.stopPropagation()
    if(p.unit==='weight')return <button className={'add-full'+(it?' weight-in':'')} onClick={e=>{st(e);haptic('light');setSh(p)}}>{it?so(lsum(p,it)):'+ '+t("Savatga")}</button>
    if(it)return <QtyControl qty={it.qty} max={500} onChange={n=>put(p,n>0?{qty:n}:null)}/>
    return <button className="add-full" onClick={e=>{st(e);put(p,{qty:1})}}>+ {t("Savatga")}</button>
  }
  const hitsBlock=F(d,'homeShelves')&&homeHits.length>0&&<>
    <div className="sec-head" style={{marginTop:14}}><h2 className="sec">⭐ {t("Xit mahsulotlar")}</h2></div>
    <div className="hrow shelf-row">
      {homeHits.map(p=><ProductCard key={'ohh:'+p.id} p={p} fav={favSet.has(p.id)} onFav={F(d,'favorites')?toggleFav:null} onOpen={prod=>{haptic('sel');setDet(prod)}} actionBtn={actionBtn} shelf/>)}
    </div>
    {sh&&<WeightSheet p={sh} cur={cart[keyOf(sh)]} close={()=>setSh(null)} set={v=>{put(sh,v);setSh(null)}}/>}
    {det&&<Detail key={det.id} p={det} d={d} cart={cart} put={put} close={()=>setDet(null)} onWeight={setSh} onReload={onReload} say={say}/>}
  </>
  if(!mine.length)return <><div className="empty-box" style={{minHeight:220}}><span>📦</span><b>{t("Buyurtmalar yo'q")}</b></div>{hitsBlock}</>

  const startEdit=o=>{
    const ch={}
    for(const i of (o.items||[])){
      if(i.unit==='weight'){
        if(i.min_grams>0)ch[i.id]={grams:Math.max(i.min_grams,Math.round(Number(i.qty||0)*1000))}
        else ch[i.id]={sum:Math.round(Number(i.actual_sum??i.ordered_sum)||1000)}
      }else ch[i.id]={qty:Math.max(1,Math.round(Number(i.qty)||1))}
    }
    setEd({id:o.id,ch})
  }
  const setItemVal=(itemId,val)=>setEd(prev=>prev?{...prev,ch:{...prev.ch,[itemId]:val}}:prev)

  return <><h1>{t("Buyurtmalarim")}</h1>{mine.map(o=>{
    const isEd=ed?.id===o.id
    return <div className="card ord-card" key={o.id}>
      <div className="row" style={{marginTop:0}}><b>#{o.id}</b><Badge s={o.status}/></div>
      {o.created_at&&<div className="m" style={{marginBottom:6}}>{fmtDt(o.created_at)}</div>}
      {F(d,'orderTracker')&&<OrderTracker status={o.status}/>}
      {o.status==='ready'&&o.code&&<div className="ready-code-box">
        <span>{t("Olib ketish kodi")}</span>
        <b>{o.code}</b>
      </div>}
      {o.items.map(i=>{
        const c=isEd?(ed.ch[i.id]||{}):null
        const removed=isEd&&(c.remove||(i.unit==='piece'&&!(c.qty>0)))
        const curSum=isEd
          ?(removed?0:(i.unit==='weight'?(c.grams?Math.round((Number(i.unit_price)||0)*c.grams/1000):(c.sum||0)):((Number(i.unit_price)||0)*(c.qty||0))))
          :(i.actual_sum??i.ordered_sum)
        return <div className="row" key={i.id} style={removed?{opacity:.45,textDecoration:'line-through'}:undefined}>
          <span className="gap" style={{alignItems:'center',flexWrap:'nowrap',minWidth:0,flex:1}}>
            <Thumb p={{image:i.image,category:'Boshqa'}} cls="ci sm"/>
            <span style={{fontSize:13,minWidth:0,overflow:'hidden',textOverflow:'ellipsis'}}>
              {i.name}{i.sub_status==='proposed'&&<b> → {i.sub_name}</b>}
              {isEd&&<div className="m">{removed?t("O'chirish"):(i.unit==='weight'?(c.grams?`${c.grams} g · ${so(curSum)}`:so(curSum)):`${c.qty} × ${so(i.unit_price)}`)}</div>}
            </span>
          </span>
          {isEd?(i.unit==='piece'
            ?<QtyControl qty={c.qty||0} max={500} variant="soft compact" onChange={n=>setItemVal(i.id,{qty:n})}/>
            :<span className="gap" style={{flexWrap:'nowrap',gap:6}}>
              <button type="button" className="btn s g" onClick={()=>setWsh({item:i,cur:c})}>✎ {removed?t("Tiklash"):so(curSum)}</button>
              {!removed&&<button type="button" className="btn s g" style={{color:'#BE123C'}} onClick={()=>setItemVal(i.id,{remove:true})}>🗑</button>}
            </span>
          ):<span className="m">{so(curSum)}</span>}
        </div>
      })}
      {o.comment&&<div className="m" style={{marginTop:4}}>💬 {o.comment}</div>}
      <div className="row"><span>{o.type==='delivery'?'🚚 '+t("Yetkazib berish"):t("🏃 Olib ketish")}</span><b>{so(o.total)}</b></div>
      {o.type==='delivery'&&o.status==='new'&&<div className="m">📞 Administrator siz bilan bog'lanadi</div>}
      {o.status==='awaiting_confirm'&&<><div className="card" style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>⚖️ Tortgandan so'ng narx o'zgardi. Yangi mahsulotlar jami: <b>{so(o.pending_subtotal)}</b></div>
        <div className="gap"><button className="btn k" style={{flex:1}} onClick={()=>post(o,'confirm',{accept:true},'Tasdiqlandi')}>{t("Roziman")}</button><button className="btn g" style={{flex:1}} onClick={()=>post(o,'confirm',{accept:false},'Bekor qilindi')}>{t("Bekor qilish")}</button></div></>}
      {o.status==='sub_pending'&&<><div className="card" style={{background:'#FFFBEB',borderColor:'#FDE68A'}}>🔁 Almashtirish taklifi:{o.items.filter(i=>i.sub_status==='proposed').map(i=><div key={i.id}>{i.name} → <b>{i.sub_name}</b> ({so(i.sub_price)})</div>)}</div>
        <div className="gap"><button className="btn k" style={{flex:1}} onClick={()=>post(o,'sub-answer',{accept:true},'Tasdiqlandi')}>{t("Roziman")}</button><button className="btn g" style={{flex:1}} onClick={()=>post(o,'sub-answer',{accept:false},'Shunsiz davom etamiz')}>Shunsiz davom</button></div></>}
      <div className="gap" style={{marginTop:6}}>
        {F(d,'orderEdit')&&['new','accepted','preparing'].includes(o.status)&&!o.edit_state&&<button className="btn s g" onClick={()=>post(o,'edit-request',{},"So'rov yuborildi")}>✏️ O'zgartirishni so'rash</button>}
        {F(d,'orderCancel')&&['new','age_check','confirm_pending','sub_pending'].includes(o.status)&&<button className="btn s g" style={{color:'#BE123C'}} onClick={()=>{if(confirm(t("Buyurtmani bekor qilasizmi?")))post(o,'cancel',{},'Bekor qilindi')}}>✕ {t("Buyurtmani bekor qilish")}</button>}
        {F(d,'reorder')&&onReorder&&['completed','cancelled'].includes(o.status)&&<button className="btn s g" onClick={()=>onReorder(o)}>🔁 {t("Qayta buyurtma")}</button>}
      </div>
      {o.edit_state==='requested'&&<div className="m">⏳ Administrator ruxsatini kutyapmiz</div>}
      {o.edit_state==='allowed'&&(isEd
        ?<div className="gap" style={{marginTop:8}}>
          <button className="btn s" style={{flex:1}} onClick={()=>post(o,'edit-apply',{changes:Object.entries(ed.ch).map(([itemId,v])=>({itemId,...v}))},'Saqlandi').then(()=>setEd(null))}>✓ {t("Saqlash")}</button>
          <button className="btn s g" onClick={()=>setEd(null)}>{t("Bekor")}</button>
        </div>
        :<button className="btn s" onClick={()=>startEdit(o)}>✏️ Tahrirlash (ruxsat berilgan)</button>)}
    </div>
  })}
  {hitsBlock}
  {wsh&&<WeightSheet
    p={{id:wsh.item.product_id,name:wsh.item.name,name_uz:wsh.item.name_uz,price:Number(wsh.item.unit_price)||Number(wsh.item.cur_price)||1000,unit:'weight',min_grams:Number(wsh.item.min_grams)||0,min_sum:Number(wsh.item.min_sum)||0}}
    cur={wsh.cur?.remove?null:wsh.cur}
    close={()=>setWsh(null)}
    set={v=>{setItemVal(wsh.item.id,v||{remove:true});setWsh(null)}}
  />}
  </>
}

function DiscountCardSection({d,act,say,onReload}){
  const {t}=useLang()
  const u=d.user
  const [open,setOpen]=useState(false)
  const [fullName,setFullName]=useState(u.cardFullName||u.name||'')
  const [phone,setPhone]=useState(u.cardPhone||(u.phone?'+'+u.phone:''))
  const [address,setAddress]=useState(u.cardAddress||loadAddrs()[0]||'')
  useEffect(()=>{if(u.phone&&!phone)setPhone('+'+u.phone)},[u.phone])

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
      {!u.phone&&tg?.requestContact&&<button type="button" className="btn s g" style={{width:'100%',marginBottom:8}} onClick={()=>shareTgPhone(setPhone,onReload)}>📱 {t("Telegramdan raqamni ulashish")}</button>}
      <input className="in" type="tel" placeholder={t("Telefon raqam")} value={phone} onChange={e=>setPhone(e.target.value)}/>
      <input className="in" placeholder={t("Yashash manzili")} value={address} onChange={e=>setAddress(e.target.value)}/>
      <div className="gap">
        <button className="btn s" style={{flex:1}} onClick={()=>act(async()=>{await api('/api/card/apply','POST',{fullName,phone,address});setOpen(false)},t("Ariza yuborildi ✅"))}>{t("Ariza yuborish")}</button>
        <button className="btn s g" onClick={()=>setOpen(false)}>{t("Bekor")}</button>
      </div>
    </div>}
  </div>
}

function Profile({d,go,onToggleLang,cart,setCart,say,act,onReload}){
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
      const cur=freqMap.get(i.product_id)||{cnt:0,p:{id:i.product_id,name:i.name,name_uz:i.name_uz,price:i.cur_price||i.unit_price,sale_price:i.sale_price,sale_until:i.sale_until,unit:i.unit,image:i.image,category:i.category||'Boshqa',age_min:i.age_min||0,min_grams:i.min_grams||0,min_sum:i.min_sum||0,weight_g:i.weight_g||0}}
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
      const p={id:i.product_id,name:i.name,name_uz:i.name_uz,price:i.cur_price||i.unit_price,sale_price:i.sale_price,sale_until:i.sale_until,unit:i.unit,image:i.image,category:i.category||'Boshqa',age_min:i.age_min||0,min_grams:i.min_grams||0,min_sum:i.min_sum||0,weight_g:i.weight_g||0}
      if(!p.price)continue
      if(p.unit==='piece'){
        const qty=Math.max(1,Math.min(500,Math.round(Number(i.qty)||1)))
        next[keyOf(p)]={p,qty};added++
      }else if(p.unit==='weight'&&!(p.min_grams>0)){
        const minS=Math.max(1000,Number(p.min_sum)||30000)
        const sum=Math.max(minS,Math.round(Number(i.ordered_sum)||minS))
        next[keyOf(p)]={p,sum};added++
      }
    }
    if(!added){say(t("Bu buyurtmada faol mahsulot topilmadi"));return}
    setCart(next);say(t("Savatga qo'shildi ✅"));go('cart')
  }

  const pastAddrs=[...new Set([...addrs,...mine.filter(o=>o.type==='delivery'&&o.address).map(o=>o.address.trim())])].filter(Boolean)
  const addAddress=()=>{
    const a=newAddr.trim();if(a.length<2)return
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

    {F(d,'discountCards')&&<DiscountCardSection d={d} act={act} say={say} onReload={onReload}/>}

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
              {F(d,'reorder')&&<button className="btn s" style={{flex:1}} onClick={()=>reorder(o)}>🔁 {t("Qayta buyurtma")}</button>}
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

function Dash({onNav}){
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
  const nav=(tb,opts)=>onNav&&onNav(tb,opts)

  return <>
    <DateRangeBar per={per} setPer={setPer} from={from} setFrom={setFrom} to={to} setTo={setTo} ft={ft} setFt={setFt} tt={tt} setTt={setTt}/>
    {!s?<div className="center" style={{minHeight:180}}>{t("Yuklanmoqda…")}</div>:<div style={{opacity:loading?.6:1,transition:'opacity .15s'}}>
      <div className="kpi">
        <div className="card kp click" onClick={()=>nav('o',{orderFilter:'completed'})}>
          <span className="kp-go">›</span>
          <span className="ico">💰</span><span className="m">{t("Jami tushum")}</span><b>{so(s.totals.revenue)}</b>
          <em className="muted">{t("O'rtacha chek")}: {so(s.totals.avg_check)}</em>
        </div>
        <div className="card kp click" onClick={()=>nav('o',{orderFilter:'all'})}>
          <span className="kp-go">›</span>
          <span className="ico">🛍</span><span className="m">{t("Buyurtmalar")}</span><b>{s.totals.valid_orders??s.totals.orders} {t("ta")}</b>
          <em onClick={e=>{e.stopPropagation();nav('o',{orderFilter:s.totals.pending?'new':'cancelled'})}}>{s.totals.pending?`${s.totals.pending} ${t("kutilmoqda")}`:`${s.totals.cancelled||0} ${t("bekor")}`}</em>
        </div>
        <div className="card kp click" onClick={()=>nav('m')}>
          <span className="kp-go">›</span>
          <span className="ico">👥</span><span className="m">{t("Mijozlar")}</span><b>{s.customers}</b>
          <em>+{s.newCustomers||0} {t("yangi")}</em>
        </div>
        <div className="card kp click" onClick={()=>nav('p',{prodState:'on',prodCat:''})}>
          <span className="kp-go">›</span>
          <span className="ico">📦</span><span className="m">{t("Mahsulotlar")}</span><b>{s.products.total}</b>
          {s.products.setup>0?<em onClick={e=>{e.stopPropagation();nav('p',{prodState:'setup',prodCat:''})}} style={{color:'#E11D48'}}>{s.products.active} {t("faol")} · 🆕 {s.products.setup}</em>
            :<em className="muted">{s.products.active} {t("faol")}</em>}
        </div>
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
            {s.byCat.map((x,i)=><div className="row cat-click-row" key={i} style={{margin:'3px 0'}} onClick={()=>x.c==='Nabor'?nav('c'):nav('p',{prodCat:x.c,prodState:'all'})}>
              <span style={{fontSize:12.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}><i className="dot" style={{background:COL[i%6]}}/>{t(x.c)}</span>
              <span style={{textAlign:'right',flex:'none'}}><b style={{fontSize:12.5}}>{Math.round(Number(x.s)/tot*100)}% ›</b><span className="m" style={{display:'block',fontSize:10.5}}>{so(x.s)}</span></span>
            </div>)}
          </div>
        </div>
      </div>}
    </div>}
  </>
}

function AdminOrders({d,act,say,initFilter}){
  const {t,so}=useLang()
  const [w,setW]=useState({}),[fee,setFee]=useState({}),[f,setF]=useState(initFilter||'all'),[sub,setSub]=useState(null),[sq,setSq]=useState(''),[res,setRes]=useState([]),dq=useDebounced(sq),list=d.orders.filter(o=>f==='all'||o.status===f),post=(o,p,b,m)=>act(()=>api(`/api/orders/${o.id}/${p}`,'POST',b),m)
  useEffect(()=>{if(initFilter)setF(initFilter)},[initFilter])
  useEffect(()=>{if(!sub||dq.length<2){setRes([]);return}api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=on&page=0`).then(r=>setRes(r.items.slice(0,6))).catch(()=>{})},[dq,sub])
  return <><div className="chips">{['all','new','accepted','preparing','sub_pending','ready','completed','cancelled'].map(k=><button key={k} className={'chip'+(f===k?' on':'')} onClick={()=>setF(k)}>{k==='all'?t("Hammasi"):t(ST[k][0])}</button>)}</div>
  {list.map(o=><div className="card" key={o.id}>
    <div className="row"><b>#{o.id} · {o.code}</b><Badge s={o.status}/></div><div className="m">{o.name} · {o.type==='delivery'?'🚚 '+o.address:'🏃 olib ketish'}</div>
    {o.comment&&<div className="m" style={{color:'#92400E',background:'#FFFBEB',padding:'4px 8px',borderRadius:8,marginTop:4}}>💬 {o.comment}</div>}
    <div className="gap" style={{alignItems:'center',margin:'6px 0'}}>
      <a className="btn s g" style={{textDecoration:'none'}} href={`tel:+${o.phone}`}>📞 +{o.phone}</a>
      {o.card_number&&<button type="button" className="order-card-pill" onClick={()=>copyText(o.card_number,()=>say(t("Nusxalandi ✅")))}>💳 {o.card_number} (2%) 📋</button>}
    </div>
    {o.items.map(i=><div key={i.id}><div className="row"><span className="gap" style={{alignItems:'center',flexWrap:'nowrap'}}><Thumb p={{image:i.image,category:'Boshqa'}} cls="ci sm"/><span style={{fontSize:13}}>{i.name}{i.unit==='weight'?` (${Number(i.qty).toFixed(3)} kg)`:` × ${Number(i.qty)}`}{i.sub_status==='proposed'&&<b style={{color:'#B45309'}}> → {i.sub_name}</b>}</span></span>
      {i.unit==='weight'&&['accepted','preparing'].includes(o.status)?<input className="in" style={{width:100,margin:0,padding:8}} type="number" placeholder={i.ordered_sum} value={w[i.id]??''} onChange={e=>setW({...w,[i.id]:e.target.value})}/>:<b>{so(i.actual_sum??i.ordered_sum)}</b>}
      {F(d,'substitution')&&['accepted','preparing'].includes(o.status)&&<button className="btn s g" title="Almashtirish" onClick={()=>{setSub({o:o.id,i:i.id});setSq('')}}>🔁</button>}</div>
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

function SaleTimePicker({value,onChange}){
  const {t}=useLang()
  const pad=n=>String(n).padStart(2,'0')
  const parseExact=v=>{
    const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v||'')
    if(m)return {yy:m[1],mm:m[2],dd:m[3],hh:m[4],mi:m[5]}
    const d=new Date(Date.now()+864e5)
    return {yy:String(d.getFullYear()),mm:pad(d.getMonth()+1),dd:pad(d.getDate()),hh:'23',mi:'59'}
  }
  const parseDur=v=>{
    if(!v)return {d:'0',h:'0',m:'0'}
    const diff=Math.max(0,Math.round((new Date(v).getTime()-Date.now())/60000))
    if(!diff)return {d:'0',h:'0',m:'0'}
    return {d:String(Math.floor(diff/1440)),h:String(Math.floor((diff%1440)/60)),m:String(diff%60)}
  }
  const [mode,setMode]=useState('dur')
  const [dur,setDur]=useState(()=>parseDur(value))
  const [ex,setEx]=useState(()=>parseExact(value))
  const [presetKey,setPresetKey]=useState('')
  const selfRef=useRef(false)

  useEffect(()=>{
    if(selfRef.current){selfRef.current=false;return}
    setDur(parseDur(value))
    if(value)setEx(parseExact(value))
    setPresetKey('')
  },[value])

  const emit=localStr=>{
    selfRef.current=true
    onChange(localStr)
    if(localStr)setEx(parseExact(localStr))
  }

  const applyDur=(next,pk='')=>{
    setDur(next);setPresetKey(pk)
    const dn=Math.min(365,Number(next.d)||0),hn=Math.min(999,Number(next.h)||0),mn=Math.min(5999,Number(next.m)||0)
    const total=dn*1440+hn*60+mn
    if(total>0)emit(toLocalInput(new Date(Date.now()+total*60000).toISOString()))
    else emit('')
  }
  const stepDur=(k,delta,max)=>{
    const cur=Number(dur[k])||0
    const nv=Math.max(0,Math.min(max,cur+delta))
    applyDur({...dur,[k]:String(nv)})
  }
  const typeDur=(k,raw,max)=>{
    const c=raw.replace(/\D/g,'').slice(0,3)
    const num=c?Math.min(max,Number(c)):0
    applyDur({...dur,[k]:c===''?'':String(num)})
  }

  const commitExact=(next,clamp=false)=>{
    let {yy,mm,dd,hh,mi}=next
    if(clamp){
      const y=Math.max(2024,Math.min(2035,Number(yy)||new Date().getFullYear()))
      const mo=Math.max(1,Math.min(12,Number(mm)||1))
      const maxD=new Date(y,mo,0).getDate()
      const da=Math.max(1,Math.min(maxD,Number(dd)||1))
      const hr=Math.max(0,Math.min(23,Number(hh)||0))
      const mn=Math.max(0,Math.min(59,Number(mi)||0))
      next={yy:String(y),mm:pad(mo),dd:pad(da),hh:pad(hr),mi:pad(mn)}
    }
    setEx(next);setPresetKey('')
    const y=Number(next.yy),mo=Number(next.mm),da=Number(next.dd),hr=Number(next.hh),mn=Number(next.mi)
    if(next.yy.length===4&&mo>=1&&mo<=12&&da>=1&&da<=31&&hr>=0&&hr<=23&&mn>=0&&mn<=59){
      const dt=new Date(y,mo-1,da,hr,mn)
      if(!Number.isNaN(dt.getTime())&&dt.getMonth()===mo-1&&dt.getDate()===da){
        selfRef.current=true
        const loc=toLocalInput(dt.toISOString())
        onChange(loc)
        setDur(parseDur(loc))
      }
    }
  }
  const setEndOfDay=addDays=>{
    const dt=new Date();dt.setDate(dt.getDate()+addDays);dt.setHours(23,59,0,0)
    const loc=toLocalInput(dt.toISOString())
    emit(loc);setDur(parseDur(loc));setPresetKey('eod'+addDays)
  }

  const parsed=value?new Date(value):null
  const validFuture=parsed&&!Number.isNaN(parsed.getTime())&&parsed.getTime()>Date.now()
  const isPast=parsed&&!Number.isNaN(parsed.getTime())&&parsed.getTime()<=Date.now()

  return <>
    <div className="tp-tabs">
      <button type="button" className={mode==='dur'?'on':''} onClick={()=>{setMode('dur');setDur(parseDur(value))}}>⏱ {t("Davomiylik")}</button>
      <button type="button" className={mode==='exact'?'on':''} onClick={()=>{setMode('exact');setEx(parseExact(value))}}>📅 {t("Aniq sana")}</button>
    </div>

    {mode==='dur'?<>
      <div className="tp-dur-grid">
        {[['d',t("Kun"),365],['h',t("Soat"),23],['m',t("Daqiqa"),59]].map(([k,lbl,mx])=><div className="tp-box" key={k}>
          <label>{lbl}</label>
          <div className="tp-ctrl">
            <button type="button" onClick={()=>stepDur(k,-1,mx)}>−</button>
            <input type="text" inputMode="numeric" pattern="[0-9]*" value={dur[k]} onFocus={e=>e.target.select()} onChange={e=>typeDur(k,e.target.value,mx)} onBlur={()=>{if(dur[k]==='')setDur(x=>({...x,[k]:'0'}))}}/>
            <button type="button" onClick={()=>stepDur(k,1,mx)}>+</button>
          </div>
        </div>)}
      </div>
      <div className="tp-presets">
        {[['3h','3 soat',{d:'0',h:'3',m:'0'}],['12h','12 soat',{d:'0',h:'12',m:'0'}],['1d','1 kun',{d:'1',h:'0',m:'0'}],['3d','3 kun',{d:'3',h:'0',m:'0'}],['7d','7 kun',{d:'7',h:'0',m:'0'}],['30d','30 kun',{d:'30',h:'0',m:'0'}]].map(([k,lbl,val])=>
          <button key={k} type="button" className={presetKey===k?'on':''} onClick={()=>applyDur(val,k)}>+{lbl}</button>)}
        {value&&<button type="button" onClick={()=>{applyDur({d:'0',h:'0',m:'0'},'')}}>✕ {t("Vaqtsiz")}</button>}
      </div>
    </>:<>
      <div className="tp-exact">
        <div className="tp-group">
          <span>📅 {t("Sana")} (KK.OO.YYYY)</span>
          <div className="tp-parts">
            <input type="text" inputMode="numeric" maxLength={2} placeholder="KK" value={ex.dd} onFocus={e=>e.target.select()} onChange={e=>commitExact({...ex,dd:e.target.value.replace(/\D/g,'').slice(0,2)})} onBlur={()=>commitExact(ex,true)}/>
            <i>.</i>
            <input type="text" inputMode="numeric" maxLength={2} placeholder="OO" value={ex.mm} onFocus={e=>e.target.select()} onChange={e=>commitExact({...ex,mm:e.target.value.replace(/\D/g,'').slice(0,2)})} onBlur={()=>commitExact(ex,true)}/>
            <i>.</i>
            <input style={{flex:'1.5'}} type="text" inputMode="numeric" maxLength={4} placeholder="YYYY" value={ex.yy} onFocus={e=>e.target.select()} onChange={e=>commitExact({...ex,yy:e.target.value.replace(/\D/g,'').slice(0,4)})} onBlur={()=>commitExact(ex,true)}/>
          </div>
        </div>
        <div className="tp-group">
          <span>🕐 {t("Soat")} (SS:DD)</span>
          <div className="tp-parts">
            <input type="text" inputMode="numeric" maxLength={2} placeholder="23" value={ex.hh} onFocus={e=>e.target.select()} onChange={e=>commitExact({...ex,hh:e.target.value.replace(/\D/g,'').slice(0,2)})} onBlur={()=>commitExact(ex,true)}/>
            <i>:</i>
            <input type="text" inputMode="numeric" maxLength={2} placeholder="59" value={ex.mi} onFocus={e=>e.target.select()} onChange={e=>commitExact({...ex,mi:e.target.value.replace(/\D/g,'').slice(0,2)})} onBlur={()=>commitExact(ex,true)}/>
          </div>
        </div>
      </div>
      <div className="tp-presets">
        <button type="button" className={presetKey==='eod0'?'on':''} onClick={()=>setEndOfDay(0)}>{t("Bugun 23:59")}</button>
        <button type="button" className={presetKey==='eod1'?'on':''} onClick={()=>setEndOfDay(1)}>{t("Ertaga 23:59")}</button>
        {value&&<button type="button" onClick={()=>{emit('');setDur({d:'0',h:'0',m:'0'});setPresetKey('')}}>✕ {t("Vaqtsiz")}</button>}
      </div>
    </>}

    {validFuture?<div className="tp-preview">
      <span>📅 <b>{fmtDt(value)}</b></span>
      <Countdown until={value} mode="inline"/>
    </div>:isPast?<div className="tp-preview warn">
      <span>⚠️ {t("O'tgan vaqt kiritilgan")}</span>
    </div>:<div className="tp-preview" style={{color:'var(--m)'}}>
      <span>∞ {t("Muddatsiz aksiya")}</span>
    </div>}
  </>
}

function ProductFields({f,setF,dept,tree,cats,families,onReload,onPick,onSave,onCancel,saveLabel}){
  const {t,so}=useLang()
  const set=k=>e=>setF({...f,[k]:e.target.value})
  const pr=Number(f.price)||0,sp=Number(f.sale_price)||0
  const pct=pr>0&&sp>0&&sp<pr?Math.max(1,Math.round((1-sp/pr)*100)):0
  const prio=Number(f.priority)||3
  const famOpts=[...new Set([...FAM_PRESETS,...(families||[])])]
  const unitOpts=[{value:'piece',label:'Dona',sub:'Donalab sotiladi',icon:'📦'},{value:'weight',label:"Og'irlik (kg)",sub:'Kilogramm / summa bilan',icon:'⚖️'}]
  const ageOpts=[{value:'0',label:"Yosh: yo'q",icon:'✅'},{value:'16',label:'16+',icon:'🔞'},{value:'18',label:'18+',icon:'🔞'},{value:'20',label:'20+',icon:'🔞'},{value:'21',label:'21+',icon:'🔞'}]
  const catList=cats||tree?.flat||[]
  return <>
    <input className="in" placeholder="Название (русский)" value={f.name} onChange={set('name')}/>
    <input className="in" placeholder="Nomi (o'zbekcha)" value={f.name_uz||''} onChange={set('name_uz')}/>
    <input className="in" inputMode="numeric" placeholder={t("Shtrixkod (ixtiyoriy)")} value={f.barcode||''} onChange={set('barcode')}/>
    <div className="gap">
      <input className="in" style={{flex:1}} type="text" inputMode="numeric" placeholder={t("Narx (dona yoki kg uchun)")} value={f.price} onChange={e=>setF({...f,price:digits(e.target.value)})}/>
      <ModernSelect style={{flex:1}} value={f.unit} options={unitOpts} onChange={v=>setF({...f,unit:v})} title="O'lchov birligi"/>
    </div>
    {f.unit==='weight'?<div className="gap">
      <input className="in" style={{flex:1}} type="text" inputMode="numeric" placeholder="Min. summa (so'm, standart 30000)" value={f.min_sum||''} onChange={e=>setF({...f,min_sum:digits(e.target.value)})}/>
      <input className="in" style={{flex:1}} type="text" inputMode="numeric" placeholder="Min. gramm (ixtiyoriy)" value={f.min_grams||''} onChange={e=>setF({...f,min_grams:digits(e.target.value)})}/>
    </div>:<input className="in" type="text" inputMode="numeric" placeholder="Og'irligi (gramm, yetkazish limiti uchun — ixtiyoriy)" value={f.weight_g||''} onChange={e=>setF({...f,weight_g:digits(e.target.value)})}/>}
    <div className="gap" style={{marginBottom:6}}>
      {!dept&&<CatPicker style={{flex:1.7}} value={f.category} cats={catList} canCreate onReload={onReload} onChange={v=>setF({...f,category:v})}/>}
      <ModernSelect style={{flex:1}} value={String(f.age_min||0)} options={ageOpts} onChange={v=>setF({...f,age_min:Number(v)||0})} title="Yosh cheklovi"/>
    </div>
    {!dept&&(()=>{
      const t2=tree||buildCatTree(catList)
      const curC=f.category?t2.byName.get(f.category):null
      const rootName=curC?(curC.parent||curC.name):''
      const subs=rootName?t2.childrenOf(rootName):[]
      if(!subs.length)return null
      return <div className="chips" style={{marginBottom:8,paddingTop:0}}>
        {subs.map(sc=><button key={sc.name} type="button" className={'chip'+(f.category===sc.name?' on':'')} onClick={()=>{haptic('sel');setF({...f,category:sc.name})}}>📁 {sc.name}</button>)}
      </div>
    })()}
    <div className="row" style={{margin:'2px 0 8px'}}>
      <span className="m" style={{fontWeight:700}}>🏆 O'rin:</span>
      <div className="prio-bar compact" style={{flex:1}}>
        {[[1,'1 🔥'],[2,'2 ⭐'],[3,'3'],[4,'4'],[5,'5']].map(([n,lbl])=>
          <button key={n} type="button" className={prio===n?'on':''} onClick={()=>setF({...f,priority:n})}>{lbl}</button>)}
      </div>
    </div>
    <details className="ios-fold" open={Boolean(f.sale_price||f.family||f.description)}>
      <summary>🔥 Aksiya · 👨‍👩‍👧‍👦 Guruh · 📝 Tavsif {sp>0?`(${so(sp)})`:''}</summary>
      <div style={{marginTop:8}}>
        <div className="sale-box" style={{marginBottom:8}}>
          <div className="sale-box-t">
            <span>🔥 {t("Aksiya")} (ixtiyoriy)</span>
            {(f.sale_price||f.sale_until)&&<button type="button" className="sec-link" style={{fontSize:11.5}} onClick={()=>setF({...f,sale_price:'',sale_until:''})}>{t("Tozalash")}</button>}
          </div>
          <input className="in" type="text" inputMode="numeric" placeholder={`${t("Aksiya narxi")} (masalan: 15000)`} value={f.sale_price||''} onChange={e=>setF({...f,sale_price:digits(e.target.value)})}/>
          {pct>0&&<div className="sale-save-pill">🏷️ <s>{so(pr)}</s> → <b>{so(sp)}</b> <span>(−{pct}%)</span></div>}
          {sp>0&&<SaleTimePicker value={f.sale_until||''} onChange={v=>setF({...f,sale_until:v})}/>}
        </div>
        <div style={{marginBottom:6}}>
          <input className="in" style={{marginBottom:6}} placeholder={`👨‍👩‍👧‍👦 ${t("Oila / Guruh")} (masalan: Kundalik ehtiyoj)`} value={f.family||''} onChange={set('family')}/>
          <div className="chips" style={{marginBottom:2}}>
            {famOpts.map(fm=><button key={fm} type="button" className={'chip'+(f.family===fm?' on':'')} onClick={()=>setF({...f,family:f.family===fm?'':fm})}>{t(fm)}</button>)}
          </div>
        </div>
        <textarea className="in" rows={2} placeholder="Tavsif (ixtiyoriy)" value={f.description||''} onChange={set('description')}/>
      </div>
    </details>
    <div className="gap" style={{alignItems:'center',marginBottom:8}}>
      {f.image&&<img src={f.image} style={{width:52,height:52,borderRadius:12,objectFit:'cover'}}/>}
      <label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm tanlash<input type="file" accept="image/*" hidden onChange={onPick}/></label>
    </div>
    {f.needs_setup&&!dept&&<label className="row" style={{margin:'4px 0 10px',padding:'8px 10px',background:'#ECFDF5',borderRadius:12,border:'1px solid #A7F3D0'}}>
      <span style={{fontSize:13,fontWeight:600,color:'#065F46'}}>✅ Saqlash bilan sotuvga faol qilish</span>
      <input type="checkbox" checked={!!f.activate} onChange={e=>setF({...f,activate:e.target.checked})}/>
    </label>}
    <div className="gap">
      <button className="btn s" style={{flex:1}} onClick={onSave}>{saveLabel||t("Saqlash")}</button>
      {onCancel&&<button className="btn s g" onClick={onCancel}>{t("Bekor")}</button>}
    </div>
  </>
}

function Products({d,act,say,onReload,initState,initCat}){
  const {t,so,cn}=useLang()
  const tree=buildCatTree(d.cats)
  const dept=d.role==='worker'?d.workerDepartment:null
  const e0={name:'',name_uz:'',description:'',barcode:'',price:'',sale_price:'',sale_until:'',unit:'piece',image:'',category:dept||d.categories[0],age_min:0,min_grams:'',min_sum:'',weight_g:'',priority:3,family:''}
  const [addOpen,setAddOpen]=useState(false),[f,setF]=useState(e0),[ed,setEd]=useState(null),[anP,setAnP]=useState(null)
  const [q,setQ]=useState(''),[st,setSt]=useState(initState||'all'),[cat,setCat]=useState(initCat||''),[prio,setPrio]=useState(''),[fam,setFam]=useState('')
  const [list,setList]=useState([]),[more,setMore]=useState(false),[pg,setPg]=useState(0),[ver,setVer]=useState(0)
  const [orgBusy,setOrgBusy]=useState(false),[orgRes,setOrgRes]=useState(null),[orgActSetup,setOrgActSetup]=useState(false)
  const [syncOpen,setSyncOpen]=useState(false),[syncRows,setSyncRows]=useState([]),[syncFile,setSyncFile]=useState(''),[syncSrc,setSyncSrc]=useState('csv'),[syncMeta,setSyncMeta]=useState(null),[syncProg,setSyncProg]=useState(''),[syncAct,setSyncAct]=useState(true),[syncDeact,setSyncDeact]=useState(true),[syncOnlyInStock,setSyncOnlyInStock]=useState(true),[syncActNew,setSyncActNew]=useState(false),[syncRes,setSyncRes]=useState(null),[syncBusy,setSyncBusy]=useState(false)
  const dq=useDebounced(q)
  const go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)

  useEffect(()=>{if(initState)setSt(initState)},[initState])
  useEffect(()=>{if(initCat!==undefined)setCat(initCat)},[initCat])

  const load=useCallback((n,reset)=>api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=${st}&cat=${encodeURIComponent(cat)}&prio=${prio}&family=${encodeURIComponent(fam)}&page=${n}`).then(r=>{setList(x=>reset?r.items:[...x,...r.items]);setMore(r.more);setPg(n)}).catch(()=>{}),[dq,st,cat,prio,fam])
  useEffect(()=>{load(0,true)},[load,ver])

  const prepPayload=obj=>{const dt=obj.sale_until?new Date(obj.sale_until):null;return {...obj,sale_price:obj.sale_price?Number(obj.sale_price):null,sale_until:obj.sale_price&&dt&&!Number.isNaN(dt.getTime())?dt.toISOString():null,min_grams:Number(obj.min_grams)||0,min_sum:Number(obj.min_sum)||0,weight_g:Number(obj.weight_g)||0,priority:Number(obj.priority)||3,family:String(obj.family||'').trim()||null}}
  const pickFor=setter=>async e=>{const file=e.target.files[0];if(!file)return;try{const u=await upload(file);setter(x=>({...x,image:u}))}catch(er){alert(er.message)}}
  const saveNew=()=>go(async()=>{await api('/api/products','POST',prepPayload(f));setF({...e0,category:cat||e0.category});setAddOpen(false)},dept?'Adminga tasdiqlash uchun yuborildi':'Saqlandi')
  const saveEdit=()=>act(async()=>{
    const body=prepPayload(ed)
    await api(`/api/products/${ed.id}`,'PUT',body)
    if(!dept){
      const sp=body.sale_price&&body.sale_price>0&&body.sale_price<Math.round(Number(ed.price))?body.sale_price:null
      const nextActive=ed.activate?true:ed.active
      const updated={...ed,price:Math.round(Number(ed.price)),sale_price:sp,sale_until:sp?body.sale_until:null,min_grams:body.min_grams,min_sum:body.min_sum,weight_g:body.weight_g,priority:body.priority,family:body.family,age_min:Math.round(Number(ed.age_min))||0,barcode:String(ed.barcode||'').trim()||null,name_uz:String(ed.name_uz||'').trim()||null,needs_setup:false,active:nextActive}
      setList(prev=>prev.map(x=>x.id===ed.id?{...x,...updated}:x).filter(x=>st!=='setup'||x.needs_setup))
    }
    setEd(null)
  },dept?'Adminga tasdiqlash uchun yuborildi':'Saqlandi')

  const pickSyncFile=async e=>{
    const file=e.target.files[0];if(!file)return
    setSyncRes(null);setSyncMeta(null);setSyncRows([]);setSyncFile(file.name)
    try{
      if(/\.db$/i.test(file.name)){
        setSyncProg(`${file.name} o'qilmoqda… 0%`)
        const {items,meta}=await parseParadoxDb(file,pct=>setSyncProg(`${file.name} o'qilmoqda… ${pct}%`))
        setSyncProg('')
        setSyncSrc(file.name.slice(0,28))
        setSyncMeta(meta)
        setSyncRows(items)
        if(!items.length&&say)say("Faylda mos mahsulotlar topilmadi")
      }else{
        const txt=await file.text()
        const rows=parseSyncCsv(txt)
        setSyncSrc('csv')
        setSyncRows(rows)
        if(!rows.length&&say)say("Faylda mos mahsulotlar topilmadi")
      }
    }catch(er){setSyncProg('');if(say)say(er.message)}
    e.target.value=''
  }

  const runSync=async()=>{
    if(!syncRows.length||syncBusy)return
    setSyncBusy(true)
    try{
      const batchSize=3000
      const batches=Math.ceil(syncRows.length/batchSize)
      const runId=batches>1?('ui_'+Date.now().toString(36)):null
      const agg={total:0,updated:0,activated:0,deactivated:0,created:0,skipped:0,source:syncSrc,at:new Date().toISOString(),activeNow:null,setupNow:null}
      for(let i=0;i<batches;i++){
        if(batches>1)setSyncProg(`Sinxronlanmoqda… ${i+1}/${batches}`)
        const chunk=syncRows.slice(i*batchSize,(i+1)*batchSize)
        const res=await api('/api/admin/products/sync','POST',{items:chunk,autoActivate:syncAct,autoDeactivate:syncDeact,onlyInStockNew:syncOnlyInStock,activateNew:syncActNew,source:syncSrc,runId})
        agg.total+=res.total||0;agg.updated+=res.updated||0;agg.activated+=res.activated||0
        agg.deactivated+=res.deactivated||0;agg.created+=res.created||0;agg.skipped+=res.skipped||0
        agg.activeNow=res.activeNow??agg.activeNow;agg.setupNow=res.setupNow??agg.setupNow
        agg.at=res.at||agg.at;agg.source=res.source||agg.source
      }
      setSyncProg('')
      setSyncRes(agg)
      setSyncRows([])
      setVer(v=>v+1)
      if(say)say(`✅ Sinxronlandi: ${agg.updated} yangilandi, ${agg.created} yangi`)
      await act(async()=>{})
    }catch(er){setSyncProg('');if(say)say(er.message)}
    setSyncBusy(false)
  }

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
      {addOpen&&<div style={{marginTop:10}}><ProductFields f={f} setF={setF} dept={dept} tree={tree} cats={d.cats} families={d.families} onReload={onReload} onPick={pickFor(setF)} onSave={saveNew} onCancel={()=>setAddOpen(false)}/></div>}
    </div>

    {!dept&&(()=>{
      const ls=syncRes||d.lastSync
      const ageMin=ls?.at?Math.round((Date.now()-new Date(ls.at).getTime())/60000):null
      const isFresh=ageMin!==null&&ageMin<=60
      const srcLabel=ls?.source==='csv'?'📄 CSV':(/\.db$/i.test(ls?.source||'')?`🗄️ ${ls.source}`:(ls?.source&&ls.source!=='pos'?`🖥️ ${ls.source}`:'🖥️ POS Avto'))
      const baseOrigin=(API&&API.startsWith('http'))?API:(typeof window!=='undefined'?window.location.origin:'')
      const syncUrl=`${baseOrigin}/api/sync/products`
      return <div className="card" style={{padding:syncOpen?14:10}}>
        <div className="row" style={{margin:0}}>
          <h2 style={{margin:0}}>📥 POS / DB / CSV sinxronlash</h2>
          <button className="btn s g" onClick={()=>setSyncOpen(o=>!o)}>{syncOpen?'✕':'Ochish'}</button>
        </div>
        {ls?<div className={'sync-status'+(isFresh?' ok':'')}>
          <div className="sync-st-top">
            <span className="sync-st-l">
              <span className={'sync-dot '+(isFresh?'live':(ageMin!==null&&ageMin>1440?'warn':''))}/>
              <span>Oxirgi: {fmtDt(ls.at)}</span>
            </span>
            <span className="sync-src">{srcLabel}</span>
          </div>
          <div className="sync-pills">
            {ls.activeNow!=null&&<span className="sync-pill g">✅ {Number(ls.activeNow).toLocaleString('ru-RU')} faol</span>}
            <span className="sync-pill">🔄 {ls.updated||0} yangilandi</span>
            {(ls.activated||0)>0&&<span className="sync-pill g">+{ls.activated} yoqildi</span>}
            {(ls.deactivated||0)>0&&<span className="sync-pill r">−{ls.deactivated} tugadi</span>}
            {(ls.created||0)>0&&<button type="button" className="sync-pill a" onClick={()=>{setSt('setup');setCat('');setSyncOpen(false)}}>🆕 {ls.created} yangi →</button>}
          </div>
        </div>:<div className={'sync-status '+(d.syncKeySet?'ok':'warn')}>
          <div className="sync-st-top">
            <span className="sync-st-l">
              <span className={'sync-dot '+(d.syncKeySet?'live':'warn')}/>
              <span>{d.syncKeySet?"POS API tayyor · Ulanish kutilmoqda":"pokupka.DB yoki CSV fayl yuklash tayyor"}</span>
            </span>
            <span className="sync-src">{d.syncKeySet?'🟢 POS API':'🗄️ DB / CSV'}</span>
          </div>
        </div>}
        {syncOpen&&<div className="sync-box" style={{marginTop:10}}>
          <div className="m" style={{color:'var(--t2)',marginBottom:8}}>
            Do'kon kompyuteridan <b><code>pokupka.DB</code></b> (Copy qilingan) yoki <b>CSV / TSV</b> faylni to'g'ridan-to'g'ri tanlang.<br/>
            • <b>Faqat bir tomonlama</b> — do'kon bazasiga tegilmaydi.<br/>
            • Mavjud tovarlarning narxi va faolligi yangilanadi (rasm, kategoriya va o'rin saqlanib qoladi).<br/>
            • Yangi tovarlar <b>«🆕 Sozlash kerak»</b> bo'limiga tushadi — rasm, kategoriya va 1–5 o'rin qo'yib faollashtirasiz.
          </div>
          <div className="gap" style={{alignItems:'center',marginBottom:8,flexWrap:'wrap'}}>
            <label className="btn s g" style={{cursor:'pointer'}}>🗄️ pokupka.DB / CSV tanlash<input type="file" accept=".db,.DB,.csv,.tsv,.txt,text/csv,text/plain,application/octet-stream" hidden onChange={pickSyncFile}/></label>
            {syncFile&&<span className="m">{syncFile} {syncRows.length>0?`(${syncRows.length.toLocaleString('ru-RU')} ta)`:''}</span>}
          </div>
          {syncProg&&<div className="m" style={{marginBottom:8,fontWeight:700,color:'var(--b)'}}>⏳ {syncProg}</div>}
          {syncMeta&&<div className="m" style={{marginBottom:6,fontSize:11.5,color:'#065F46',background:'#ECFDF5',padding:'6px 8px',borderRadius:10}}>
            🗄️ {syncMeta.rawRows.toLocaleString('ru-RU')} qatordan → <b>{syncMeta.uniqueCount.toLocaleString('ru-RU')} ta</b> mahsulot (qoldiq &gt; 0: <b>{syncMeta.inStockCount.toLocaleString('ru-RU')}</b>) · Narx: <code>{syncMeta.priceCol}</code>
          </div>}
          {syncRows.length>0&&<>
            <div style={{background:'#fff',borderRadius:12,padding:8,marginBottom:8,border:'1px solid var(--bd)'}}>
              {syncRows.slice(0,4).map((r,i)=><div key={i} className="m" style={{margin:'2px 0'}}>
                <b>{r.name||r.barcode}</b> · {so(r.price)}{r.stock!=null?` · qoldiq: ${r.stock}`:''}
              </div>)}
              {syncRows.length>4&&<div className="m">… va yana {(syncRows.length-4).toLocaleString('ru-RU')} ta mahsulot</div>}
            </div>
            <div style={{background:'#fff',borderRadius:12,padding:'6px 10px',marginBottom:8,border:'1px solid var(--bd)'}}>
              <label className="row" style={{margin:'4px 0'}}>
                <span style={{fontSize:12.5}}>✅ Qoldig'i &gt; 0 → Faol qilish</span>
                <input type="checkbox" checked={syncAct} onChange={e=>setSyncAct(e.target.checked)}/>
              </label>
              <label className="row" style={{margin:'4px 0'}}>
                <span style={{fontSize:12.5}}>⛔ Qoldig'i = 0 → Nofaol qilish</span>
                <input type="checkbox" checked={syncDeact} onChange={e=>setSyncDeact(e.target.checked)}/>
              </label>
              <label className="row" style={{margin:'4px 0'}}>
                <span style={{fontSize:12.5}}>📦 Yangi tovarlarda faqat qoldig'i &gt; 0 larini olish</span>
                <input type="checkbox" checked={syncOnlyInStock} onChange={e=>setSyncOnlyInStock(e.target.checked)}/>
              </label>
              <label className="row" style={{margin:'4px 0'}}>
                <span style={{fontSize:12.5}}>🚀 Yangi tovarlarni darhol Faol chiqarish</span>
                <input type="checkbox" checked={syncActNew} onChange={e=>setSyncActNew(e.target.checked)}/>
              </label>
            </div>
            <button className="btn s" style={{width:'100%'}} disabled={syncBusy} onClick={runSync}>
              {syncBusy?(syncProg||'Sinxronlanmoqda…'):`🔄 Sinxronlash (${syncRows.length.toLocaleString('ru-RU')} ta)`}
            </button>
          </>}
          {syncRes&&<div style={{marginTop:8,padding:8,borderRadius:12,background:'#ECFDF5',color:'#065F46',fontSize:12.5,fontWeight:600}}>
            ✅ Yangilandi: {syncRes.updated} · Faollashdi: {syncRes.activated} · Nofaol: {syncRes.deactivated} · 🆕 Yangi (sozlash kerak): {syncRes.created}
            {syncRes.created>0&&<button type="button" className="btn s" style={{marginTop:6,width:'100%'}} onClick={()=>{setSt('setup');setCat('');setSyncOpen(false)}}>🆕 Yangilarni sozlash ({syncRes.created})</button>}
          </div>}
          <div className="sync-api-card">
            <div className="sync-api-h">
              <span>🖥️ Avtomatik POS ulanish (keyinroq uchun)</span>
              <span className={'sync-pill '+(d.syncKeySet?'g':'a')} style={{cursor:'default'}}>{d.syncKeySet?'SYNC_API_KEY ✅':'Ixtiyoriy'}</span>
            </div>
            <div className="sync-url-row">
              <code>{syncUrl}</code>
              <button type="button" className="sync-copy-btn" onClick={()=>copyText(syncUrl,()=>say&&say('API manzil nusxalandi ✅'))}>📋</button>
            </div>
          </div>
        </div>}
      </div>
    })()}

    {!dept&&<div className="card" style={{background:'linear-gradient(135deg,#FFF1F2,#F0FDF4)',borderColor:'#FECDD3',padding:12}}>
      <div className="row" style={{margin:'0 0 6px'}}>
        <b style={{fontSize:14}}>🪄 Tovarlarni avtomatik bo'limlarga ajratish</b>
        <span className="badge green">30 000 so'm / kg</span>
      </div>
      <div className="m" style={{marginBottom:8}}>
        • Barcha <b>Faol</b>, <b>Nofaol</b> va <b>🆕 Sozlash kerak</b> tovarlarni nomiga qarab o'z ichki bo'limlariga (Non — 3 ta, Sut — 4 ta, Go'sht/Kolbasa, Meva/Sabzavot, Ichimlik, Shirinlik va h.k.) ajratadi;<br/>
        • Ruscha nomli tovarlarga <b>o'zbekcha muqobil nom</b> yozadi;<br/>
        • Barcha kiloli (og'irlikli) tovarlarga <b>minimal 30 000 so'm</b> belgilaydi.
      </div>
      <label className="row" style={{margin:'0 0 8px',fontSize:12.5}}>
        <span>🚀 «🆕 Sozlash kerak» tovarlarni ham bo'limga tushgach Faol qilish</span>
        <input type="checkbox" checked={orgActSetup} onChange={e=>setOrgActSetup(e.target.checked)}/>
      </label>
      <button type="button" className="btn s" style={{width:'100%'}} disabled={orgBusy} onClick={async()=>{
        setOrgBusy(true);setOrgRes(null)
        try{
          const r=await api('/api/admin/products/auto-organize','POST',{minWeightSum:30000,activateSetup:orgActSetup})
          setOrgRes(r);setVer(v=>v+1);onReload&&onReload()
          say&&say(`✅ ${r.catMoved} ta bo'limga ajratildi, ${r.uzFilled} ta o'zbekcha nom, ${r.weightUpdated} ta kiloli (30 000 so'm)`)
        }catch(e){say&&say(e.message)}
        setOrgBusy(false)
      }}>{orgBusy?'⏳ Ajratilmoqda…':"🪄 Bo'limlarga ajratish + O'zbekcha nom + Kiloga 30 000 so'm"}</button>
      {orgRes&&<div style={{marginTop:8,padding:8,borderRadius:10,background:'#ECFDF5',color:'#065F46',fontSize:12.5,fontWeight:600}}>
        ✅ Jami tekshirildi: <b>{orgRes.scanned}</b> ta (Faol: {orgRes.activeCnt||0} · Nofaol: {orgRes.inactiveCnt||0}) · Bo'limga joylandi: <b>{orgRes.catMoved}</b> ta · Sozlashdan chiqdi: <b>{orgRes.setupCleared||0}</b> ta · O'zbekcha nom: <b>{orgRes.uzFilled}</b> ta · Kiloli 30 000 so'm: <b>{orgRes.weightUpdated}</b> ta{orgRes.subCreated>0?` · Yangi ichki bo'lim: ${orgRes.subCreated} ta`:''}
        {orgRes.byCatCount&&<div className="chips" style={{marginTop:6,paddingBottom:0}}>
          {Object.entries(orgRes.byCatCount).sort((a,b)=>b[1]-a[1]).map(([cnm,cnt])=><button key={cnm} type="button" className="chip" style={{fontSize:11.5,padding:'4px 9px'}} onClick={()=>setCat(cnm)}>📁 {cnm}: <b>{cnt}</b></button>)}
        </div>}
      </div>}
    </div>}

    <input className="search search-plain" placeholder="🔍 Nomi yoki shtrixkod" value={q} onChange={e=>setQ(e.target.value)}/>
    <div className="chips">
      {[['all','Hammasi'],['on','Faol'],['off','Nofaol'],['setup',`🆕 ${t("Sozlash kerak")}${d.setupCount?` (${d.setupCount})`:''}`],['sale','🔥 '+t('Aksiya')]].map(([k,l])=>
        <button key={k} className={'chip'+(st===k?' on':'')} onClick={()=>setSt(k)}>{(k==='setup'||k==='sale')?l:t(l)}</button>)}
    </div>

    <div className="chips">
      {[['','🏆 Barcha o\'rin'],['1','1 🔥'],['2','2 ⭐'],['3','3'],['4','4'],['5','5']].map(([k,l])=>
        <button key={k||'all'} className={'chip'+(prio===k?' on':'')} onClick={()=>setPrio(k)}>{l}</button>)}
    </div>

    {(d.families||[]).length>0&&<div className="chips">
      <button className={'chip'+(!fam?' on':'')} onClick={()=>setFam('')}>👨‍👩‍👧‍👦 {t("Hammasi")}</button>
      {d.families.map(fm=><button key={fm} className={'chip'+(fam===fm?' on':'')} onClick={()=>setFam(fam===fm?'':fm)}>{t(fm)}</button>)}
    </div>}

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
      return <div className="card" key={p.id} style={{opacity:p.active||ed?.id===p.id||p.needs_setup?1:.55,borderColor:p.needs_setup?'#FDE68A':undefined}}>
        <div className="row">
          <div className="row-txt">
            <b>{p.name}</b>
            {p.needs_setup&&<span className="badge amber" style={{marginLeft:6}}>🆕 {t("Sozlash kerak")}</span>}
            {p.priority&&p.priority<=2&&<span className="badge red" style={{marginLeft:6}}>🏆 #{p.priority}</span>}
            {p.family&&<span className="badge gray" style={{marginLeft:6}}>{t(p.family)}</span>}
            {p.name_uz&&<div className="m">{p.name_uz}</div>}
            {p.age_min>0&&<span className="age2">{p.age_min}+</span>}
            <div className="m" style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginTop:2}}>
              {!dept?<CatPicker compact value={p.category} cats={d.cats} canCreate onReload={onReload} onChange={newCat=>act(async()=>{
                await api(`/api/products/${p.id}/category`,'PUT',{category:newCat,activate:!!p.needs_setup})
                setList(prev=>prev.map(x=>x.id===p.id?{...x,category:newCat,needs_setup:false,active:p.needs_setup?true:x.active}:x).filter(x=>st!=='setup'||x.needs_setup))
                say&&say(`✅ "${newCat}" bo'limiga o'tkazildi`)
              })}/>:<span>{p.category}</span>}
              <span>· {onS?<><s style={{marginRight:4}}>{so(p.price)}</s><b style={{color:'var(--b)'}}>{so(p.sale_price)} 🔥</b></>:so(p.price)}{p.unit==='weight'?' / kg':''}</span>
              {p.unit==='weight'&&p.min_sum>0?` · min ${so(p.min_sum)}`:''}
              {p.unit==='piece'&&p.weight_g>0?` · ${p.weight_g} g`:''}
              {p.sales_count>0?` · ⭐ ${p.sales_count}`:''}
              {p.barcode?` · #${p.barcode}`:''}
            </div>
            {onS&&p.sale_until&&<div style={{marginTop:3}}><Countdown until={p.sale_until} mode="inline"/></div>}
          </div>
          <span className="row-acts">
            {!dept&&<label className="sw"><input type="checkbox" checked={p.active} onChange={e=>{
              const active=e.target.checked
              act(async()=>{
                await api(`/api/products/${p.id}/active`,'PUT',{active})
                setList(prev=>prev.map(x=>x.id===p.id?{...x,active}:x).filter(x=>st==='all'||st==='sale'||st==='setup'||(st==='on'?x.active:!x.active)))
              })
            }}/><i/></label>}
            {!dept&&<button className="btn s g" title={t("Tahlil")} onClick={()=>setAnP(p)}>📊</button>}
            <button className={'btn s '+(ed?.id===p.id?'':'g')} onClick={()=>setEd(cur=>cur?.id===p.id?null:{...p,barcode:p.barcode||'',price:String(p.price||''),sale_price:p.sale_price?String(p.sale_price):'',sale_until:toLocalInput(p.sale_until),min_grams:p.min_grams||'',min_sum:p.min_sum||'',weight_g:p.weight_g||'',priority:p.priority||3,family:p.family||'',activate:!!p.needs_setup})}>{ed?.id===p.id?'✕':'✎'}</button>
            {dept&&<button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api('/api/products/'+p.id,'DELETE'),"So'rov yuborildi")}>🗑</button>}
          </span>
        </div>
        {ed?.id===p.id&&<div className="inline-edit">
          <ProductFields f={ed} setF={setEd} dept={dept} tree={tree} cats={d.cats} families={d.families} onReload={onReload} onPick={pickFor(setEd)} onSave={saveEdit} onCancel={()=>setEd(null)} saveLabel={ed.needs_setup&&ed.activate?"Saqlash va faollashtirish":undefined}/>
        </div>}
        {d.warehouseEnabled&&d.role==='superadmin'&&<input className="in" style={{marginTop:8,marginBottom:0}} type="number" placeholder="Ombor qoldig'i" defaultValue={p.stock??''} onBlur={e=>{
          const val=e.target.value===''?null:e.target.value
          act(async()=>{await api(`/api/products/${p.id}/stock`,'PUT',{stock:val});setList(prev=>prev.map(x=>x.id===p.id?{...x,stock:val}:x))})
        }}/>}
      </div>
    })}
    {!list.length&&<div className="center" style={{minHeight:140}}>{t("Hech narsa topilmadi")}</div>}
    {more&&<button className="btn g" onClick={()=>load(pg+1,false)}>{t("Yana")}</button>}
    {anP&&<Detail key={anP.id+':stats'} p={anP} d={d} cart={{}} put={()=>{}} close={()=>setAnP(null)} onWeight={()=>{}} initMode="stats" onReload={onReload} say={say} onProductUpdated={upd=>{setAnP(upd);setList(prev=>prev.map(x=>x.id===upd.id?{...x,...upd}:x))}}/>}
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

function Cats({d,act,onReload}){
  const {t}=useLang()
  const tree=buildCatTree(d.cats)
  const e0={name:'',name_ru:'',image:'',section:'',sort:'',parent:''},[f,setF]=useState(e0),[ed,setEd]=useState(null)
  const pick=setter=>async e=>{const x=e.target.files[0];if(!x)return;try{const u=await upload(x);setter(o=>({...o,image:u}))}catch(er){alert(er.message)}}
  const szLbl=sec=>TILE_SIZES.find(x=>x.value===(sec||''))
  const moveCat=(c,delta)=>{
    const sibs=c.parent?tree.childrenOf(c.parent):tree.roots
    const idx=sibs.findIndex(x=>x.name===c.name)
    const to=idx+delta
    if(idx<0||to<0||to>=sibs.length)return
    const next=sibs.map(x=>x.name)
    const [m]=next.splice(idx,1)
    next.splice(to,0,m)
    act(()=>api('/api/cats/reorder','PUT',{names:next}))
  }
  return <div className="card"><h2>🗂 {t("Katalog")}</h2>
    <div className="m" style={{marginBottom:8}}>Tartib yuqoridan hisoblanadi: <b>1</b> = eng birinchi, <b>2</b> = ikkinchi… (yoki ↑ / ↓ bilan suring)</div>
    <input className="in" placeholder="Nomi (o'zbekcha)" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
    <input className="in" placeholder="Название (русский)" value={f.name_ru||''} onChange={e=>setF({...f,name_ru:e.target.value})}/>
    <CatPicker value={f.parent||''} cats={d.cats} includeNone noneLabel={t("Asosiy kategoriya (yo'q)")} maxDepth={2} title="Ota kategoriya" onReload={onReload} onChange={v=>setF({...f,parent:v})}/>
    {f.parent&&<ModernSelect value={f.section||''} options={TILE_SIZES} onChange={v=>setF({...f,section:v})} title="Karta kengligi (Zik-zak)"/>}
    <div className="gap" style={{alignItems:'center',marginBottom:8}}>{f.parent&&<>{f.image&&<img src={f.image} style={{width:44,height:44,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={pick(setF)}/></label></>}<input className="in" style={{width:140,margin:0}} type="text" inputMode="numeric" placeholder="Tartib (1=birinchi)" value={f.sort||''} onChange={e=>setF({...f,sort:digits(e.target.value)})}/></div>
    <button className="btn s" style={{marginBottom:8}} onClick={()=>act(async()=>{await api('/api/cats','POST',f);setF(e0)},'Saqlandi')}>+ Kategoriya</button>

    {tree.flat.map(c=>{
      const isEd=ed?.old===c.name
      const sz=c.section?szLbl(c.section):null
      const sibs=c.parent?tree.childrenOf(c.parent):tree.roots
      const idx=sibs.findIndex(x=>x.name===c.name)
      return <div className="cat-row-wrap" key={c.name}>
        <div className="row" style={{paddingLeft:c.depth*16}}>
          <span className="row-txt">
            {c.depth>0&&<span className="m" style={{marginRight:4}}>↳</span>}
            <span className={'badge '+(c.depth?'amber':'red')} style={{marginRight:5}}>#{c.sort>0?c.sort:(idx+1)}</span>
            {EMO[c.name]||(c.depth?'📁':'🛒')} {c.name}{c.name_ru&&<span className="m"> · {c.name_ru}</span>}
            {sz&&sz.value&&<span className="badge gray" style={{marginLeft:6}}>{sz.icon} {sz.label}</span>}
          </span>
          <span className="row-acts">
            <button type="button" className="btn s g" style={{padding:'6px 8px'}} disabled={idx<=0} onClick={()=>moveCat(c,-1)}>↑</button>
            <button type="button" className="btn s g" style={{padding:'6px 8px'}} disabled={idx<0||idx>=sibs.length-1} onClick={()=>moveCat(c,1)}>↓</button>
            <button className={'btn s '+(isEd?'':'g')} onClick={()=>setEd(isEd?null:{old:c.name,name:c.name,name_ru:c.name_ru||'',image:c.image||'',section:c.section||'',sort:c.sort>0?String(c.sort):'',parent:c.parent||''})}>{isEd?'✕':'✎'}</button>
            <button className="btn s g" onClick={()=>confirm("O'chirilsinmi? Tovarlar 'Boshqa'ga o'tadi")&&act(()=>api('/api/cats/'+encodeURIComponent(c.name),'DELETE'))}>🗑</button>
          </span>
        </div>
        {isEd&&<div className="inline-edit">
          <input className="in" placeholder="Nomi (o'zbekcha)" value={ed.name} onChange={e=>setEd({...ed,name:e.target.value})}/>
          <input className="in" placeholder="Название (русский)" value={ed.name_ru||''} onChange={e=>setEd({...ed,name_ru:e.target.value})}/>
          <CatPicker value={ed.parent||''} cats={d.cats} includeNone noneLabel={t("Asosiy kategoriya (yo'q)")} maxDepth={2} exclude={x=>x.name===c.name||x.parent===c.name} title="Ota kategoriya" onReload={onReload} onChange={v=>setEd({...ed,parent:v})}/>
          {ed.parent&&<ModernSelect value={ed.section||''} options={TILE_SIZES} onChange={v=>setEd({...ed,section:v})} title="Karta kengligi (Zik-zak)"/>}
          <div className="gap" style={{alignItems:'center',marginBottom:8}}>
            {ed.parent&&<>{ed.image&&<img src={ed.image} style={{width:44,height:44,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={pick(setEd)}/></label>{ed.image&&<button type="button" className="btn s g" onClick={()=>setEd({...ed,image:''})}>✕</button>}</>}
            <input className="in" style={{width:140,margin:0}} type="text" inputMode="numeric" placeholder="Tartib (1=birinchi)" value={ed.sort||''} onChange={e=>setEd({...ed,sort:digits(e.target.value)})}/>
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

function Customers({act}){
  const {t,so}=useLang()
  const [q,setQ]=useState(''),[l,setL]=useState([]),[ver,setVer]=useState(0),dq=useDebounced(q)
  useEffect(()=>{api('/api/customers?q='+encodeURIComponent(dq)).then(setL).catch(()=>{})},[dq,ver])
  const toggleBlk=c=>{
    if(c.blocked){
      if(!confirm(`${c.name||c.tg_id} blokdan chiqarilsinmi?`))return
      act(async()=>{await api(`/api/security/blocked/${c.tg_id}`,'DELETE');setVer(v=>v+1)},'Blokdan chiqarildi ✅')
    }else{
      const r=prompt(`${c.name||c.tg_id} ni bloklash sababi:`,'Spam / qoidabuzarlik')
      if(r===null)return
      act(async()=>{await api('/api/security/block','POST',{tgId:c.tg_id,name:c.name,reason:r||"Admin tomonidan bloklandi"});setVer(v=>v+1)},'Bloklandi 🚫')
    }
  }
  return <><input className="search search-plain" placeholder="🔍 Ism, telefon, ID yoki karta raqami" value={q} onChange={e=>setQ(e.target.value)}/><div className="card"><h2>👥 {t("Mijozlar")} · {l.length}</h2>{l.map(c=><div className="row" key={c.tg_id}><div className="row-txt"><b>{c.name||c.tg_id}</b>{c.card_number&&<span className="badge red" style={{marginLeft:6}}>💳 {c.card_number}</span>}{c.blocked&&<span className="badge red" style={{marginLeft:6}}>🚫 Blok</span>}<div className="m">{c.phone?`+${c.phone} · `:''}ID: {c.tg_id} · {c.orders} {t("ta")} · {so(c.spent)}</div></div><span className="row-acts">{c.phone&&<a className="btn s g" style={{textDecoration:'none'}} href={`tel:+${c.phone}`}>📞</a>}{c.role!=='superadmin'&&<button type="button" className={'btn s '+(c.blocked?'k':'g')} title={c.blocked?t("Blokdan chiqarish"):t("Bloklash")} onClick={()=>toggleBlk(c)}>{c.blocked?'🔓':'🚫'}</button>}</span></div>)}</div></>
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

function Content({d,act,onReload}){
  const {t,so}=useLang()
  const [c,setC]=useState({banners:[],videos:[],bundles:[]}),[ver,setVer]=useState(0),go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  const [vd,setVd]=useState({title:'',url:''}),[bd,setBd]=useState({title:'',title_ru:'',description:'',description_ru:'',price:'',image:'',items:[]}),[bq,setBq]=useState(''),[res,setRes]=useState([]),dq=useDebounced(bq)
  useEffect(()=>{api('/api/content').then(setC).catch(()=>{})},[ver])
  useEffect(()=>{if(dq.length<2){setRes([]);return}api(`/api/admin/products?q=${encodeURIComponent(dq)}&state=on&page=0`).then(r=>setRes(r.items.slice(0,8))).catch(()=>{})},[dq])
  const img=(setter,o)=>async e=>{const f=e.target.files[0];if(!f)return;try{setter({...o,image:await upload(f)})}catch(er){alert(er.message)}}
  const row=(k,x,label)=><div className="row" key={x.id}><span className="row-txt">{label}</span><span className="row-acts"><label className="sw"><input type="checkbox" checked={x.active} onChange={e=>go(()=>api(`/api/content/${k}/${x.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label><button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api(`/api/content/${k}/${x.id}`,'DELETE'))}>🗑</button></span></div>
  return <>
    <Banners act={act}/><Cats d={d} act={act} onReload={onReload}/>
    <div className="card"><h2>🎁 {t("Naborlar")}</h2>
      <input className="in" placeholder={t("Nabor nomi (o'zbekcha)")} value={bd.title} onChange={e=>setBd({...bd,title:e.target.value})}/>
      <input className="in" placeholder={t("Название набора (русский)")} value={bd.title_ru} onChange={e=>setBd({...bd,title_ru:e.target.value})}/>
      <textarea className="in" rows={2} placeholder={t("Nabor tavsifi (o'zbekcha)")} value={bd.description} onChange={e=>setBd({...bd,description:e.target.value})}/>
      <textarea className="in" rows={2} placeholder={t("Описание набора (русский)")} value={bd.description_ru} onChange={e=>setBd({...bd,description_ru:e.target.value})}/>
      <input className="in" type="text" inputMode="numeric" placeholder="Nabor narxi" value={bd.price} onChange={e=>setBd({...bd,price:e.target.value.replace(/\D/g,'').replace(/^0+/,'')})}/>
      <input className="in" placeholder="Mahsulot qo'shish: nomini yozing" value={bq} onChange={e=>setBq(e.target.value)}/>
      {res.map(p=><div className="row" key={p.id}><span className="gap" style={{alignItems:'center',flex:1,minWidth:0,flexWrap:'nowrap'}}><Thumb p={p} cls="ci sm"/><span className="row-txt">{p.name} <span className="m">{so(p.price)}</span></span></span><span className="row-acts"><button className="btn s g" onClick={()=>{setBd(b=>({...b,items:b.items.some(i=>i.productId===p.id)?b.items:[...b.items,{productId:p.id,name:p.name,price:p.price,image:p.image,category:p.category,qty:1}]}));setBq('')}}>+</button></span></div>)}
      {bd.items.map(i=><div className="row" key={i.productId}><span className="gap" style={{alignItems:'center',flex:1,minWidth:0,flexWrap:'nowrap'}}><Thumb p={{image:i.image,category:i.category||'Boshqa'}} cls="ci sm"/><span className="row-txt">{i.name} <span className="m">{so(i.price)}</span></span></span><span className="row-acts"><input className="in" style={{width:64,margin:0,padding:8}} type="number" min="1" value={i.qty} onChange={e=>setBd({...bd,items:bd.items.map(x=>x.productId===i.productId?{...x,qty:e.target.value}:x)})}/><button className="btn s g" onClick={()=>setBd({...bd,items:bd.items.filter(x=>x.productId!==i.productId)})}>✕</button></span></div>)}
      {bd.items.length>0&&<div className="m">Alohida narxi: {so(bd.items.reduce((s,i)=>s+i.price*i.qty,0))}</div>}
      <div className="gap" style={{alignItems:'center',margin:'8px 0'}}>{bd.image&&<img src={bd.image} style={{width:48,height:48,borderRadius:10,objectFit:'cover'}}/>}<label className="btn s g" style={{cursor:'pointer'}}>📷 Rasm<input type="file" accept="image/*" hidden onChange={img(setBd,bd)}/></label></div>
      <div className="gap" style={{marginBottom:8}}>
        <button className="btn s" onClick={()=>go(async()=>{if(bd.id)await api(`/api/content/bundles/${bd.id}`,'PUT',bd);else await api('/api/content/bundles','POST',bd);setBd({title:'',title_ru:'',description:'',description_ru:'',price:'',image:'',items:[]})},'Saqlandi')}>{bd.id?'✓ Nabor saqlash':'+ Nabor'}</button>
        {bd.id&&<button className="btn s g" onClick={()=>setBd({title:'',title_ru:'',description:'',description_ru:'',price:'',image:'',items:[]})}>{t("Bekor")}</button>}
      </div>
      {c.bundles.map(x=><div className="cat-row-wrap" key={x.id}>
        <div className="row">
          <span className="gap" style={{alignItems:'center',flex:1,minWidth:0,flexWrap:'nowrap'}}>
            <Thumb p={{image:x.image,category:'Boshqa'}} cls="ci sm"/>
            <span className="row-txt"><b>{x.title}</b>{x.title_ru&&<span className="m"> / {x.title_ru}</span>}<div className="m">{so(x.price)} · {(x.items||[]).length} ta tovar</div></span>
          </span>
          <span className="row-acts">
            <label className="sw"><input type="checkbox" checked={x.active} onChange={e=>go(()=>api(`/api/content/bundles/${x.id}/active`,'PUT',{active:e.target.checked}))}/><i/></label>
            <button className="btn s g" onClick={()=>{setBd({id:x.id,title:x.title||'',title_ru:x.title_ru||'',description:x.description||'',description_ru:x.description_ru||'',price:String(x.price||''),image:x.image||'',items:(x.items||[]).map(it=>({...it,qty:Number(it.qty)||1}))});scrollTo({top:0,behavior:'smooth'})}}>✎</button>
            <button className="btn s g" onClick={()=>confirm("O'chirilsinmi?")&&go(()=>api(`/api/content/bundles/${x.id}`,'DELETE'))}>🗑</button>
          </span>
        </div>
      </div>)}</div>
    <div className="card"><h2>▶ {t("Videolar")}</h2><input className="in" placeholder="Sarlavha" value={vd.title} onChange={e=>setVd({...vd,title:e.target.value})}/><input className="in" placeholder="YouTube havolasi" value={vd.url} onChange={e=>setVd({...vd,url:e.target.value})}/>
      <button className="btn s" onClick={()=>go(async()=>{await api('/api/content/videos','POST',vd);setVd({title:'',url:''})},'Saqlandi')}>+ Video</button>
      {c.videos.map(x=>row('videos',x,x.title||x.yt_id))}</div></>
}

function AdminBroadcast({act,say}){
  const {t}=useLang()
  const [st,setSt]=useState({counts:{all:0,uz:0,ru:0},history:[]})
  const [kind,setKind]=useState('photo')
  const [target,setTarget]=useState('all')
  const [text,setText]=useState('')
  const [mediaUrl,setMediaUrl]=useState('')
  const [withBtn,setWithBtn]=useState(true)
  const [busy,setBusy]=useState(false)

  const load=useCallback(()=>api('/api/broadcast').then(setSt).catch(()=>{}),[])
  useEffect(()=>{load()},[load])
  useEffect(()=>{
    if(!st.history.some(x=>x.status==='sending'))return
    const h=setInterval(load,4000)
    return()=>clearInterval(h)
  },[st.history,load])

  const pickImg=async e=>{
    const f=e.target.files[0];if(!f)return
    setBusy(true)
    try{setMediaUrl(await upload(f))}catch(er){say(er.message)}
    setBusy(false)
  }

  const targetCount=target==='uz'?st.counts.uz:target==='ru'?st.counts.ru:st.counts.all
  const canSend=!busy&&targetCount>0&&(kind==='text'?text.trim().length>0:mediaUrl.trim().length>0)

  const sendNow=()=>{
    if(!confirm(`${targetCount} ta foydalanuvchiga xabar yuborilsinmi?`))return
    act(async()=>{
      const r=await api('/api/broadcast','POST',{kind,target,text,mediaUrl,withBtn})
      setText('');setMediaUrl('')
      await load()
      say(`🚀 Yuborish boshlandi (${r.total} ta)`)
    })
  }

  return <>
    <div className="card" style={{background:'linear-gradient(135deg,#FFF1F2 0%,#FFE4E6 100%)',borderColor:'#FECDD3'}}>
      <h2 style={{color:'var(--b7)',marginBottom:4}}>🎬 Telegram bot orqali Video / Rasm yuborish</h2>
      <div className="m" style={{color:'var(--t2)',marginBottom:8}}>
        Katta hajmli HD video, GIF yoki formatlangan yangiliklarni to'g'ridan-to'g'ri bot chatida <b>/broadcast</b> buyrug'i (yoki bot menyusidagi <b>📣 Yangilik / Xabar yuborish</b> tugmasi) orqali yuborish eng qulay va cheklovsiz!
      </div>
      {tg?.close&&<button className="btn s" onClick={()=>tg.close()}>✈️ Bot chatiga o'tish (/broadcast)</button>}
    </div>

    <div className="prof-stats" style={{marginTop:0,marginBottom:12,paddingTop:0,borderTop:0}}>
      <div className="pstat hi"><span>Jami foydalanuvchi</span><b>{st.counts.all}</b></div>
      <div className="pstat"><span>🇺🇿 O'zbekcha</span><b>{st.counts.uz}</b></div>
      <div className="pstat"><span>🇷🇺 Ruscha</span><b>{st.counts.ru}</b></div>
    </div>

    <div className="card">
      <h2>📣 {t("Xabar yuborish")}</h2>
      <div className="chips">
        {[['all',`👥 Hammasi (${st.counts.all})`],['uz',`🇺🇿 O'zbekcha (${st.counts.uz})`],['ru',`🇷🇺 Ruscha (${st.counts.ru})`]].map(([k,l])=>
          <button key={k} type="button" className={'chip'+(target===k?' on':'')} onClick={()=>setTarget(k)}>{l}</button>)}
      </div>
      <div className="seg" style={{marginBottom:10}}>
        {[['photo','🖼 Rasm'],['text','📝 Matn'],['video','🎬 Video URL']].map(([k,l])=>
          <button key={k} type="button" className={kind===k?'on':''} onClick={()=>{setKind(k);setMediaUrl('')}}>{l}</button>)}
      </div>

      {kind==='photo'&&<div className="gap" style={{alignItems:'center',marginBottom:8}}>
        {mediaUrl&&<img src={mediaUrl} style={{width:64,height:64,borderRadius:12,objectFit:'cover'}}/>}
        <label className="btn s g" style={{cursor:'pointer'}}>📷 {busy?'Yuklanmoqda…':'Rasm tanlash'}<input type="file" accept="image/*" hidden onChange={pickImg}/></label>
        {mediaUrl&&<button type="button" className="btn s g" onClick={()=>setMediaUrl('')}>✕</button>}
      </div>}

      {kind==='video'&&<>
        <input className="in" placeholder="Video havolasi (https://...mp4)" value={mediaUrl} onChange={e=>setMediaUrl(e.target.value)}/>
        <div className="m" style={{margin:'-4px 0 8px'}}>💡 Telefon galereyasidan to'g'ridan-to'g'ri video yuborish uchun bot chatida <b>/broadcast</b> yozing.</div>
      </>}

      <textarea className="in" rows={4} placeholder={kind==='text'?'Yangilik yoki e\'lon matnini yozing…':'Rasm/video ostidagi izoh (ixtiyoriy)…'} value={text} onChange={e=>setText(e.target.value)}/>
      <label className="row" style={{marginBottom:10}}>
        <span>🛒 «Do'konni ochish» tugmasini qo'shish</span>
        <input type="checkbox" checked={withBtn} onChange={e=>setWithBtn(e.target.checked)}/>
      </label>
      <button className="btn" disabled={!canSend} onClick={sendNow}>📣 {t("Xabar yuborish")} ({targetCount} ta)</button>
    </div>

    <div className="card">
      <h2>📜 Yuborilgan xabarlar · {st.history.length}</h2>
      {st.history.map(b=><div className="alog" key={b.id}>
        <i style={{background:b.status==='done'?'#10B981':'#F59E0B'}}/>
        <div style={{flex:1,minWidth:0}}>
          <div className="row" style={{margin:0}}>
            <b>{b.kind==='video'?'🎬 Video':b.kind==='photo'?'🖼 Rasm':'📝 Matn'} · #{b.id}</b>
            <span className={'badge '+(b.status==='done'?'green':'amber')}>{b.status==='done'?`✅ ${b.sent}/${b.total}`:`⏳ ${b.sent}/${b.total}`}</span>
          </div>
          {b.text&&<div className="m" style={{marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.text}</div>}
          <div className="m">{b.sender_name} · {b.target==='uz'?'🇺🇿 UZ':b.target==='ru'?'🇷🇺 RU':'👥 Hammasi'}{b.failed>0?` · 🚫 ${b.failed}`:''} · {fmtDt(b.created_at)}</div>
        </div>
      </div>)}
      {!st.history.length&&<div className="m">Hali xabar yuborilmagan</div>}
    </div>
  </>
}

function Settings({d,act,onReload,onPreviewAnim}){
  const {t}=useLang()
  const [s,setS]=useState(d.settings.delivery),[u,setU]=useState({targetId:'',roleKey:'worker',role:'worker',roleTitle:'',name:'',department:d.categories[0],canBroadcast:false,canAi:false})
  const [sup,setSup]=useState(()=>({username:d.settings.support?.username||'',phone:d.settings.support?.phone||''}))
  const [preset,setPreset]=useState(()=>d.settings.animation?.preset||'none')
  const cleanUser=String(sup.username||'').trim().replace(/^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i,'').replace(/^@+/,'').replace(/\/.*$/,'').trim()
  return <><div className="card"><h2>{t("🚚 Yetkazib berish")}</h2>
    <label className="row"><span>Yoqilgan</span><input type="checkbox" checked={!!s.enabled} onChange={e=>setS({...s,enabled:e.target.checked})}/></label>
    <label className="m">Minimal buyurtma summasi (so'm)<input className="in" type="text" inputMode="numeric" value={s.minTotal||''} onChange={e=>setS({...s,minTotal:digits(e.target.value)})}/></label>
    <label className="m">Maksimal og'irlik (kg, 0 = cheklovsiz)<input className="in" type="text" inputMode="decimal" placeholder="Masalan: 15" value={s.maxKg??''} onChange={e=>setS({...s,maxKg:e.target.value.replace(/[^0-9.,]/g,'').replace(',','.')})}/></label>
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
        <h2>🤖 Sun'iy intellekt (AI)</h2>
        <div className="row" style={{margin:'4px 0 8px'}}>
          <span className="m">Gemini holati</span>
          <span className={'badge '+(d.ai?.ready?'green':'amber')}>{d.ai?.ready?`✅ Ulangan (${d.ai.model||'gemini'})`:'⚠️ GEMINI_API_KEY yoʻq'}</span>
        </div>
        {d.ai?.today&&<div className="m" style={{marginBottom:6}}>Bugungi so'rovlar: <b>{d.ai.today.requests||0}</b> ta</div>}
        {!d.ai?.ready?<div className="m" style={{color:'#B45309'}}>Railway → Variables bo'limiga <b>GEMINI_API_KEY</b> qo'shing, shunda AI botda va ilovada ishga tushadi.</div>
          :<div className="m">Super Admin va pastdagi «👥 Rollar» bo'limida 🤖 ruxsati berilgan adminlar ishlata oladi.</div>}
      </div>
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
      <div className="card"><h2>👥 Rollar</h2>
        <div className="m" style={{marginBottom:8}}>Super Admin va ruxsat berilgan adminlar: 📣 Yangilik yuborish · 🤖 AI yordamchi.</div>
        {(d.roles||[]).map(x=><div className="row" key={x.tg_id}>
          <span className="row-txt"><b>{x.name||x.tg_id}</b> <span className="m">{x.role_title?`${x.role_title} (${ROLE_BASE_LBL[x.role]||x.role})`:(ROLE_BASE_LBL[x.role]||x.role)}{x.department?' · '+x.department:''}{x.role==='superadmin'||x.can_broadcast?' · 📣':''}{x.role==='superadmin'||x.can_ai?' · 🤖':''}</span></span>
          {x.role!=='superadmin'&&<span className="row-acts">
            {x.role==='admin'&&<button type="button" className={'btn s '+(x.can_ai?'k':'g')} title="AI yordamchi ruxsati" onClick={()=>act(()=>api(`/api/roles/${x.tg_id}/ai`,'PUT',{canAi:!x.can_ai}),x.can_ai?'AI ruxsati olindi':'AI ruxsati berildi ✅')}>🤖</button>}
            {x.role==='admin'&&<button type="button" className={'btn s '+(x.can_broadcast?'k':'g')} title="Xabar yuborish ruxsati" onClick={()=>act(()=>api(`/api/roles/${x.tg_id}/broadcast`,'PUT',{canBroadcast:!x.can_broadcast}),x.can_broadcast?'Xabar ruxsati olindi':'Xabar ruxsati berildi ✅')}>📣</button>}
            <button className="btn s g" onClick={()=>act(()=>api('/api/roles','POST',{targetId:x.tg_id,role:'user'}))}>Olib tashlash</button>
          </span>}
        </div>)}
        <input className="in" placeholder="Telegram ID" value={u.targetId} onChange={e=>setU({...u,targetId:e.target.value})}/><input className="in" placeholder="Ism" value={u.name} onChange={e=>setU({...u,name:e.target.value})}/>
        <div className="gap">
          <RolePicker style={{flex:1}} value={u.roleKey} customRoles={d.customRoles} onReload={onReload} onSelect={opt=>{if(opt)setU({...u,roleKey:opt.value,role:opt.base,roleTitle:opt.roleTitle||'',canBroadcast:opt.base==='admin'?!!opt.canBroadcast:false})}}/>
          {u.role==='worker'&&<CatPicker style={{flex:1}} value={u.department} cats={d.cats} canCreate onReload={onReload} title="Bo'limni tanlang" onChange={v=>setU({...u,department:v})}/>}
        </div>
        {u.role==='admin'&&<>
          <label className="row" style={{marginBottom:6}}><span>📣 Xabar yuborish ruxsati (Yangiliklar)</span><input type="checkbox" checked={!!u.canBroadcast} onChange={e=>setU({...u,canBroadcast:e.target.checked})}/></label>
          <label className="row" style={{marginBottom:8}}><span>🤖 AI yordamchi ruxsati</span><input type="checkbox" checked={!!u.canAi} onChange={e=>setU({...u,canAi:e.target.checked})}/></label>
        </>}
        <button className="btn" onClick={()=>act(async()=>{await api('/api/roles','POST',{targetId:u.targetId,role:u.role,roleTitle:u.roleTitle,name:u.name,department:u.department,canBroadcast:u.canBroadcast,canAi:u.canAi});setU({targetId:'',roleKey:'worker',role:'worker',roleTitle:'',name:'',department:d.categories[0],canBroadcast:false,canAi:false})},'Saqlandi')}>Qo'shish</button></div>
    </>}</>
}

function AdminSecurity({act,say}){
  const {t}=useLang()
  const [data,setData]=useState({items:[],stats:{total:0,auto:0,manual:0,dropped:0},thresholds:{burstSoft:35,burstBlock:60,minBlock:220,botBurstBlock:20}})
  const [ver,setVer]=useState(0),[q,setQ]=useState(''),[tgId,setTgId]=useState(''),[reason,setReason]=useState('')
  const go=(fn,m)=>act(async()=>{await fn();setVer(v=>v+1)},m)
  useEffect(()=>{api('/api/security/blocked').then(setData).catch(()=>{})},[ver])

  const filtered=data.items.filter(x=>!q||`${x.tg_id} ${x.display_name||''} ${x.reason||''} ${x.ip||''} ${x.phone||''}`.toLowerCase().includes(q.toLowerCase()))

  return <>
    <div className="prof-stats" style={{marginTop:0,marginBottom:12,paddingTop:0,borderTop:0}}>
      <div className="pstat hi"><span>🚫 Bloklangan</span><b>{data.stats.total}</b></div>
      <div className="pstat"><span>🤖 Avto-DDoS</span><b>{data.stats.auto}</b></div>
      <div className="pstat"><span>🛡️ To'silgan</span><b>{data.stats.dropped}</b></div>
    </div>

    <div className="card" style={{background:'linear-gradient(135deg,#FFF1F2 0%,#FFE4E6 100%)',borderColor:'#FECDD3'}}>
      <h2 style={{color:'var(--b7)',marginBottom:4}}>🛡️ Avtomatik DDoS himoya faol</h2>
      <div className="m" style={{color:'var(--t2)'}}>
        • Mini App: 10 soniyada <b>{data.thresholds.burstBlock}+</b> yoki 1 daqiqada <b>{data.thresholds.minBlock}+</b> so'rov yuborgan ID avtomatik bloklanadi.<br/>
        • Telegram Bot: 10 soniyada <b>{data.thresholds.botBurstBlock}+</b> xabar yuborgan ID avtomatik bloklanadi.<br/>
        • Buyurtma (5/daqiqa) va karta arizasi (3/10 daqiqa) spamlari ham cheklangan. Super Admin va Adminlar avtomatik bloklanmaydi.
      </div>
    </div>

    <div className="card">
      <h2>🚫 Qo'lda Telegram ID bloklash</h2>
      <div className="gap">
        <input className="in" style={{flex:1}} inputMode="numeric" placeholder="Telegram ID" value={tgId} onChange={e=>setTgId(digits(e.target.value))}/>
        <input className="in" style={{flex:1.4}} placeholder="Sabab (ixtiyoriy)" value={reason} onChange={e=>setReason(e.target.value)}/>
      </div>
      <button className="btn s" disabled={!tgId} onClick={()=>go(async()=>{await api('/api/security/block','POST',{tgId,reason:reason||'Admin tomonidan bloklandi'});setTgId('');setReason('')},'ID bloklandi 🚫')}>{t("Bloklash")}</button>
    </div>

    <input className="search search-plain" placeholder="🔍 ID, ism, sabab yoki IP bo'yicha qidirish" value={q} onChange={e=>setQ(e.target.value)}/>
    <div className="card">
      <h2>📋 {t("Bloklangan ID lar")} · {filtered.length}</h2>
      {filtered.map(x=><div key={x.tg_id} className="cat-row-wrap" style={{padding:'10px 0'}}>
        <div className="row" style={{margin:0}}>
          <div className="row-txt">
            <b>{x.display_name||x.tg_id}</b>
            <span className={'badge '+(x.auto?'red':'amber')} style={{marginLeft:6}}>{x.auto?'🤖 Avto-DDoS':"✋ Qo'lda"}</span>
            <div className="m">🆔 <b>{x.tg_id}</b>{x.phone?` · +${x.phone}`:''}{x.hits>0?` · ⚡ ${x.hits} so'rov`:''}</div>
            <div className="m">⚡ {x.reason}{x.ip?` · 🌐 ${x.ip}`:''}</div>
            <div className="m">🕒 {fmtDt(x.blocked_at)}</div>
          </div>
          <span className="row-acts">
            <button type="button" className="btn s g" onClick={()=>copyText(x.tg_id,()=>say(t("Nusxalandi ✅")))}>📋</button>
            <button type="button" className="btn s k" onClick={()=>confirm(`${x.display_name||x.tg_id} blokdan chiqarilsinmi?`)&&go(()=>api(`/api/security/blocked/${x.tg_id}`,'DELETE'),'Blokdan chiqarildi ✅')}>🔓</button>
          </span>
        </div>
      </div>)}
      {!filtered.length&&<div className="m">Bloklangan ID lar yo'q ✅</div>}
    </div>
  </>
}

const AL={'order.create':'Buyurtma yaratildi','order.accepted':'Buyurtma qabul qilindi','order.preparing':"Buyurtma yig'ilmoqda",'order.ready':'Buyurtma tayyor','order.completed':'Buyurtma topshirildi','order.cancelled':'Buyurtma bekor qilindi','order.cancelled_by_user':'Mijoz bekor qildi','order.edited':"Mijoz buyurtmani o'zgartirdi",'order.edit_requested':"O'zgartirish so'raldi",'order.edit_allowed':"O'zgartirishga ruxsat",'order.edit_denied':"O'zgartirish rad etildi",'settings.features':'🧩 Funksiyalar boshqaruvi','order.weighed':'Tortib bo\'lindi','order.confirm_price':'Mijoz narxni tasdiqladi','order.reject_price':'Mijoz narxni rad etdi','order.age_confirmed':'Yosh tasdiqlandi','order.age_denied':'Yosh tasdiqlanmadi','product.save':'Mahsulot saqlandi','product.add':"Mahsulot qo'shildi",'product.delete':"Mahsulot o'chirildi",'product.active':"Mahsulot holati o'zgardi",'product.stock':"Ombor qoldig'i o'zgardi",'product.pos':"Tartib raqami o'zgardi",'product.pos.reset':'Tartib avtomatikka qaytdi','products.sync':'📥 POS / CSV sinxronizatsiya','products.auto_organize':"🪄 Tovarlar bo'limlarga ajratildi",'ai.product_update':'🤖 AI: mahsulot yangilandi','ai.bulk_update':'🤖 AI: ommaviy yangilash','role.set':'Rol berildi','role.custom_add':"Yangi rol qo'shildi",'role.custom_delete':"Rol o'chirildi",'role.broadcast':'Xabar yuborish ruxsati','role.ai':'🤖 AI yordamchi ruxsati','broadcast.send':'Botda xabar yuborildi','security.autoblock':'🛡️ DDoS avto-blok','security.block':'🚫 ID bloklandi','security.unblock':'🔓 ID blokdan chiqarildi','settings.delivery':'Yetkazish sozlamasi','settings.support':"Qo'llab-quvvatlash sozlamasi",'settings.warehouse':'Ombor tizimi','settings.animation':'Bayram animatsiyasi','category.save':'Kategoriya saqlandi','category.delete':"Kategoriya o'chirildi",'card.apply':'Diskont karta arizasi','card.approve':'Diskont karta biriktirildi','card.reject':'Diskont karta rad etildi','card.bind':'Diskont karta yangilandi','card.remove':'Diskont karta olib tashlandi'}
const AG=[['all','Hammasi',null,'#6B7280'],['order','📦 Buyurtmalar',/^order\./,'#3B82F6'],['prod','🛍 Mahsulotlar',/^(products?|change|category|ai)\./,'#F59E0B'],['content','🖼 Kontent',/^(content|broadcast)\./,'#10B981'],['user','👤 Foydalanuvchilar',/^(role|card)\./,'#8B5CF6'],['sec','🛡️ Xavfsizlik',/^security\./,'#E11D48'],['set','⚙️ Sozlamalar',/^settings\./,'#6B7280']]

function Audit(){
  const {t,so}=useLang()
  const [a,setA]=useState([]),[g,setG]=useState('all'),[per,setPer]=useState('7'),[from,setFrom]=useState(iso(7)),[to,setTo]=useState(iso(0)),[ft,setFt]=useState(fmt(iso(7))),[tt,setTt]=useState(fmt(iso(0)))
  useEffect(()=>{api(`/api/audit?from=${from}&to=${to}`).then(setA).catch(()=>{})},[from,to])
  const G=AG.find(x=>x[0]===g),list=G[2]?a.filter(x=>G[2].test(x.action)):a,col=x=>(AG.find(z=>z[2]&&z[2].test(x.action))||AG[0])[3]
  const adet=x=>{const z=x.detail||{};if(z.updated!=null&&z.created!=null)return `🔄 ${z.updated} yangilandi · 🆕 ${z.created} yangi`;if(z.reason)return z.reason+(z.ip?' · '+z.ip:'');if(z.card)return '💳 '+z.card;if(z.kind&&z.total!=null)return `📣 ${z.kind} (${z.total} ta)`;if(z.canBroadcast!=null)return z.canBroadcast?'📣 Yoqildi':"📣 O'chirildi";if(z.canAi!=null)return z.canAi?'🤖 Yoqildi':"🤖 O'chirildi";if(z.username)return '@'+z.username;if(z.preset)return z.preset;if(z.active!=null)return z.active?'Yoqildi':'Faolsizlantirildi';if(z.total!=null)return so(z.total);if(z.title)return z.title;if(z.role)return (z.roleTitle?`${z.roleTitle} (${z.role})`:z.role)+(z.department?' · '+z.department:'');if(z.name&&z.base)return `${z.name} (${z.base})`;if(z.n)return z.n;return ''}
  return <>
    <DateRangeBar per={per} setPer={setPer} from={from} setFrom={setFrom} to={to} setTo={setTo} ft={ft} setFt={setFt} tt={tt} setTt={setTt}/>
    <div className="chips">{AG.map(([k,l])=><button key={k} className={'chip'+(g===k?' on':'')} onClick={()=>setG(k)}>{t(l)}</button>)}</div>
    <div className="card"><h2>🧾 {t("Audit")} · {list.length}</h2>{list.map(x=><div className="alog" key={x.id}><i style={{background:col(x)}}/><div style={{flex:1}}><b>{AL[x.action]||x.action}</b><div className="m">{x.entity}{adet(x)&&' · '+adet(x)}</div><div className="m">{x.actor_name||x.actor} · {new Date(x.at).toLocaleString('uz-UZ')}</div></div></div>)}{!list.length&&<div className="m">—</div>}</div>
  </>
}

const FGROUP_LBL={shop:['🛍',"Do'kon va vitrina"],order:['📦','Buyurtma va yetkazish'],loyalty:['💳','Sodiqlik va aksiya'],admin:['⚙️','Admin vositalari']}
function AdminFeatures({d,act,say,onReload}){
  const {lang,t}=useLang()
  const reg=d.featureRegistry||[]
  const [f,setF]=useState(()=>d.features||{})
  const [hrs,setHrs]=useState(()=>d.features?.hours||{from:'08:00',to:'22:00'})
  const [busyKey,setBusyKey]=useState('')
  useEffect(()=>{if(d.features){setF(d.features);if(d.features.hours)setHrs(d.features.hours)}},[d.features])
  const toggle=async(k,val)=>{
    const next={...f,[k]:val,hours:hrs};setF(next);setBusyKey(k)
    try{const r=await api('/api/settings/features','PUT',{[k]:val});setF(r.features);onReload&&onReload();say(val?'Yoqildi ✅':"O'chirildi")}
    catch(e){say(e.message)}
    setBusyKey('')
  }
  const saveHours=()=>act(async()=>{const r=await api('/api/settings/features','PUT',{hours:hrs});setF(r.features)},'Ish vaqti saqlandi ✅')
  const enableAll=()=>act(async()=>{const patch=Object.fromEntries(reg.map(r=>[r.key,r.key==='workingHours'?false:true]));const r=await api('/api/settings/features','PUT',patch);setF(r.features)},'Barchasi yoqildi ✅')
  const groups=['shop','order','loyalty','admin']
  const total=reg.length,onCnt=reg.filter(r=>f[r.key]!==false).length
  return <>
    <div className="card feat-hero">
      <div className="row" style={{margin:0}}>
        <div><h2 style={{margin:0}}>🧩 {t("Funksiyalar boshqaruvi")}</h2><div className="m">Faol: <b>{onCnt}</b> / {total} ta modul</div></div>
        <button type="button" className="btn s g" onClick={enableAll}>✓ {t("Barchasini yoqish")}</button>
      </div>
    </div>
    {groups.map(gk=>{
      const items=reg.filter(r=>r.group===gk);if(!items.length)return null
      const [ico,gl]=FGROUP_LBL[gk]||['🧩',gk]
      return <div className="card" key={gk}>
        <h2 style={{marginBottom:8}}>{ico} {t(gl)}</h2>
        {items.map(r=>{
          const on=f[r.key]!==false
          return <div className="feat-row" key={r.key}>
            <div className="feat-meta">
              <b>{lang==='ru'?r.ru:r.uz} <span className={'badge '+(on?'green':'gray')}>{on?'Faol':'Nofaol'}</span></b>
              <div className="m">{r.desc}</div>
            </div>
            <label className="sw"><input type="checkbox" disabled={busyKey===r.key} checked={on} onChange={e=>toggle(r.key,e.target.checked)}/><i/></label>
          </div>
        })}
        {gk==='order'&&f.workingHours&&<div className="feat-hours">
          <div className="gap" style={{alignItems:'center'}}>
            <label className="m" style={{flex:1}}>Ochilish<input className="in" style={{marginBottom:0}} type="time" value={hrs.from} onChange={e=>setHrs({...hrs,from:e.target.value})}/></label>
            <label className="m" style={{flex:1}}>Yopilish<input className="in" style={{marginBottom:0}} type="time" value={hrs.to} onChange={e=>setHrs({...hrs,to:e.target.value})}/></label>
            <button type="button" className="btn s" style={{marginTop:14}} onClick={saveHours}>{t("Saqlash")}</button>
          </div>
        </div>}
      </div>
    })}
  </>
}

function Admin({d,act,say,onReload,onPreviewAnim}){
  const {t}=useLang()
  const isW=d.role==='worker',isSA=d.role==='superadmin',canBc=F(d,'broadcast')&&(isSA||!!d.user.canBroadcast)
  const prodLbl=t('Tovarlar')+(d.setupCount?` (🆕 ${d.setupCount})`:'')
  const tabs=isW?[['p',prodLbl]]:d.role==='operator'?[['o','Buyurtmalar']]:[['d','Statistika'],['o','Buyurtmalar'],['p',prodLbl],['k',t('Kartalar')+(d.pendingCardsCount?` (${d.pendingCardsCount})`:'')],...(canBc?[['b','Xabarlar']]:[]),['m','Mijozlar'],['x',t('Xavfsizlik')+(d.blockedCount?` (${d.blockedCount})`:'')],['c','Kontent'],...(isSA?[['f','🧩 Funksiyalar']]:[]),['s','Sozlamalar'],['a','Audit']]
  const [tb,setT]=useState(tabs[0][0])
  const [navOpts,setNavOpts]=useState({})
  const navTo=(target,opts={})=>{setNavOpts(opts);setT(target);scrollTo({top:0})}
  return <><h1>{t("Boshqaruv")}</h1><div className="seg" style={{overflowX:'auto'}}>{tabs.map(([k,l])=><button key={k} className={tb===k?'on':''} onClick={()=>{setNavOpts({});setT(k)}}>{(k==='p'||k==='k'||k==='x')?l:t(l)}</button>)}</div>
    {tb==='d'&&<Dash onNav={navTo}/>}{tb==='o'&&<AdminOrders d={d} act={act} say={say} initFilter={navOpts.orderFilter}/>}{tb==='p'&&<Products d={d} act={act} say={say} onReload={onReload} initState={navOpts.prodState} initCat={navOpts.prodCat}/>}{tb==='k'&&<AdminCards act={act} say={say}/>}{tb==='b'&&canBc&&<AdminBroadcast act={act} say={say}/>}{tb==='m'&&<Customers act={act}/>}{tb==='x'&&<AdminSecurity act={act} say={say}/>}{tb==='c'&&<Content d={d} act={act} onReload={onReload}/>}{tb==='f'&&isSA&&<AdminFeatures d={d} act={act} say={say} onReload={onReload}/>}{tb==='s'&&<Settings d={d} act={act} onReload={onReload} onPreviewAnim={onPreviewAnim}/>}{tb==='a'&&<Audit/>}</>
}

function AiSheet({d,msgs,setMsgs,onReload,say,close}){
  const {t}=useLang()
  const [inp,setInp]=useState(''),[busy,setBusy]=useState(false),[rec,setRec]=useState(false),[recSec,setRecSec]=useState(0)
  const listRef=useRef(null),mrRef=useRef(null),timerRef=useRef(null)

  useEffect(()=>{if(listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight},[msgs.length,busy])
  useEffect(()=>()=>{
    clearInterval(timerRef.current)
    try{mrRef.current?.stream?.getTracks().forEach(tr=>tr.stop())}catch{}
  },[])

  const send=async payload=>{
    if(busy)return
    const userLabel=payload.text||(payload.audioBase64?'🎤 Ovozli xabar':'')
    if(!userLabel)return
    const uid=Date.now()+Math.random()
    setMsgs(prev=>[...prev,{id:uid,role:'user',text:userLabel}])
    setInp('')
    setBusy(true)
    try{
      const r=await api('/api/ai/chat','POST',payload)
      setMsgs(prev=>[...prev,{
        id:uid+1,role:'ai',text:r.reply,
        pending:r.pending?{...r.pending,state:'waiting'}:null
      }])
    }catch(e){
      setMsgs(prev=>[...prev,{id:uid+1,role:'err',text:e.message||'Xato'}])
    }finally{setBusy(false)}
  }

  const doConfirm=async(msgId,actionId,yes)=>{
    setMsgs(prev=>prev.map(m=>m.id===msgId&&m.pending?{...m,pending:{...m.pending,state:'busy'}}:m))
    try{
      if(yes){
        const r=await api('/api/ai/confirm','POST',{actionId})
        setMsgs(prev=>prev.map(m=>m.id===msgId&&m.pending?{...m,pending:{...m.pending,state:'done',result:r.message}}:m))
        say('✅ Bajarildi')
        onReload()
      }else{
        await api('/api/ai/cancel','POST',{actionId}).catch(()=>{})
        setMsgs(prev=>prev.map(m=>m.id===msgId&&m.pending?{...m,pending:{...m.pending,state:'cancelled'}}:m))
      }
    }catch(e){
      setMsgs(prev=>prev.map(m=>m.id===msgId&&m.pending?{...m,pending:{...m.pending,state:'error',result:e.message}}:m))
      say(e.message||'Xato')
    }
  }

  const toggleVoice=async()=>{
    if(rec){
      try{mrRef.current?.stop()}catch{}
      return
    }
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
      say("Ovozli xabar uchun Telegram botni ishlating 🎤")
      return
    }
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true})
      const mime=MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?'audio/webm;codecs=opus':(MediaRecorder.isTypeSupported('audio/mp4')?'audio/mp4':'')
      const mr=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)
      const chunks=[]
      mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)}
      mr.onstop=()=>{
        clearInterval(timerRef.current)
        stream.getTracks().forEach(tr=>tr.stop())
        setRec(false);setRecSec(0);mrRef.current=null
        const blob=new Blob(chunks,{type:mr.mimeType||'audio/webm'})
        if(blob.size<400)return
        const fr=new FileReader()
        fr.onload=()=>{
          const s=String(fr.result||'')
          const b64=s.includes(',')?s.split(',')[1]:''
          if(b64)send({audioBase64:b64,audioMime:(mr.mimeType||'audio/webm').split(';')[0]})
        }
        fr.readAsDataURL(blob)
      }
      mrRef.current=mr
      mr.start()
      setRec(true);setRecSec(0)
      timerRef.current=setInterval(()=>setRecSec(x=>{
        if(x>=29){try{mr.stop()}catch{};return 30}
        return x+1
      }),1000)
    }catch{
      say("Mikrofon ruxsati yo'q — Telegram botda ovoz yuboring 🎤")
    }
  }

  const resetChat=async()=>{
    await api('/api/ai/reset','POST',{}).catch(()=>{})
    setMsgs([])
    say(t("Suhbat tozalandi"))
  }

  const quickChips=['Bugungi savdo va top mahsulotlar?','Oxirgi buyurtmalarni koʻrsat','Aksiyadagi mahsulotlar qaysilar?','Olmani Meva katalogida 3-oʻringa qoʻy']

  return <div className="sheet ai-sheet" onClick={close}>
    <div className="ai-box" onClick={e=>e.stopPropagation()}>
      <div className="sheet-handle"/>
      <div className="ai-top">
        <b>✨ {t("AI Yordamchi")}</b>
        <div className="ai-top-acts">
          {msgs.length>0&&<button type="button" className="ai-ico-btn" title="Tozalash" onClick={resetChat}>🗑</button>}
          <button type="button" className="ai-ico-btn" onClick={close}>✕</button>
        </div>
      </div>

      {!d.ai?.ready&&<div className="ai-warn">⚠️ <b>GEMINI_API_KEY</b> kiritilmagan. Railway → Variables bo'limiga qo'shing.</div>}

      <div className="ai-list" ref={listRef}>
        {!msgs.length&&<div className="ai-empty">
          <div className="ai-empty-ico">🤖</div>
          <p>Narx, aksiya, tartib raqami, statistika, buyurtma yoki xabar yuborishni oddiy tilda yozing yoki 🎤 gapiring. Har bir o'zgarishdan oldin tasdiqlash so'raladi.</p>
          <div className="ai-chips">
            {quickChips.map(c=><button key={c} type="button" className="ai-chip" onClick={()=>send({text:c})}>{c}</button>)}
          </div>
        </div>}

        {msgs.map(m=><div key={m.id} className={'ai-msg '+m.role}>
          <div className="ai-bub">{m.text}</div>

          {m.pending&&<div className="ai-conf">
            <div className="ai-conf-sum">{m.pending.summary}</div>
            {m.pending.state==='waiting'&&<div className="ai-conf-btns">
              <button type="button" className="btn s" onClick={()=>doConfirm(m.id,m.pending.id,true)}>✅ Tasdiqlash</button>
              <button type="button" className="btn s g" onClick={()=>doConfirm(m.id,m.pending.id,false)}>❌ Bekor qilish</button>
            </div>}
            {m.pending.state==='busy'&&<div className="m">⏳ Bajarilmoqda…</div>}
            {m.pending.state==='done'&&<div className="ai-conf-ok">{m.pending.result||'✅ Bajarildi'}</div>}
            {m.pending.state==='cancelled'&&<div className="m">❌ Bekor qilindi</div>}
            {m.pending.state==='error'&&<div className="ai-conf-err">⚠️ {m.pending.result}</div>}
          </div>}
        </div>)}

        {busy&&<div className="ai-msg ai"><div className="ai-bub ai-typing">✨ …</div></div>}
      </div>

      <div className="ai-bar">
        <button type="button" className={'ai-mic'+(rec?' rec':'')} onClick={toggleVoice} disabled={busy} title="Ovozli xabar">{rec?`⏹ ${recSec}s`:'🎤'}</button>
        <input className="in ai-inp" value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&inp.trim())send({text:inp.trim()})}} placeholder={t("Buyruq yozing yoki ovoz yuboring...")} disabled={busy||rec}/>
        <button type="button" className="ai-send" onClick={()=>inp.trim()&&send({text:inp.trim()})} disabled={busy||rec||!inp.trim()}>➤</button>
      </div>
    </div>
  </div>
}

export default function App(){
  const [lang,setLang]=useState(()=>{try{return localStorage.getItem('lang')||(tg?.initDataUnsafe?.user?.language_code==='ru'?'ru':'uz')}catch{return 'uz'}})
  const [d,setD]=useState(null),[err,setErr]=useState(''),[tab,setTab]=useState('shop'),[cart,setCart]=useState({}),[toast,setToast]=useState(''),[cat,setCat]=useState('')
  const [favs,setFavs]=useState(()=>loadFavs())
  const [animOverride,setAnimOverride]=useState(null)
  const [aiOpen,setAiOpen]=useState(false),[aiMsgs,setAiMsgs]=useState([])
  const syncedRef=useRef(false)
  const say=m=>{setToast(m);setTimeout(()=>setToast(''),2500)}
  const toggleFav=id=>setFavs(prev=>{
    const has=prev.includes(id)
    const next=has?prev.filter(x=>x!==id):[id,...prev]
    saveFavs(next)
    say((lang==='ru'&&RU[has?"Sevimlilardan olib tashlandi":"Sevimlilarga qo'shildi ❤️"])||(has?"Sevimlilardan olib tashlandi":"Sevimlilarga qo'shildi ❤️"))
    return next
  })
  const load=useCallback(()=>api('/api/init').then(res=>{
    setD(res)
    if(!syncedRef.current){
      syncedRef.current=true
      let saved=null;try{saved=localStorage.getItem('lang')}catch{}
      if(!saved&&res?.user?.lang&&(res.user.lang==='uz'||res.user.lang==='ru'))setLang(res.user.lang)
    }
  }).catch(e=>setErr(e.message)),[])

  useEffect(()=>{
    tg?.ready();tg?.expand();load()
    const h=setInterval(()=>{if(!document.hidden)load()},30000)
    const onVis=()=>{if(!document.hidden)load()}
    document.addEventListener('visibilitychange',onVis)
    return()=>{clearInterval(h);document.removeEventListener('visibilitychange',onVis)}
  },[load])

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
  if(!d)return <div className="app"><div className="top-wrap"><div className="top"><div className="logo">T</div><div className="brand"><b>TEGEN Market</b><small>{t("Yuklanmoqda…")}</small></div></div></div><SkeletonGrid count={6}/></div>

  const entries=Object.values(cart)
  const n=entries.length
  const cartTotal=entries.reduce((s,v)=>s+lsum(v.p,v),0)
  const showBar=n>0&&(tab==='shop'||tab==='catalog'||tab==='promo'||tab==='orders')
  const tabs=[['shop',"Do'kon"],['catalog','Katalog'],...(F(d,'promoTab')?[['promo','Aksiya']]:[]),['cart','Savat'],['orders','Buyurtma'],['profile','Profil']]
  const activePreset=F(d,'animation')?(animOverride??(d.settings.animation?.preset||'none')):'none'
  const showAiBtn=F(d,'ai')&&(d.role==='superadmin'||(d.role==='admin'&&!!d.user?.canAi))
  const dl=d.settings?.delivery
  const minT=dl?.enabled?(Number(dl.minTotal)||0):0
  const freeT=Number(d.settings?.freeDeliveryThreshold)
  const useMin=minT>0
  const barTarget=(F(d,'delivery')&&F(d,'deliveryMeter'))?(useMin?minT:(dl?.enabled&&Number.isFinite(freeT)&&freeT>0?freeT:0)):0
  const barRem=barTarget>0?Math.max(0,barTarget-cartTotal):0
  const barPct=barTarget>0?Math.min(100,Math.round((cartTotal/barTarget)*100)):0

  return <LangCtx.Provider value={lang}>
    <FestiveOverlay preset={activePreset}/>
    <div className={'app'+(showBar?' has-bar':'')}>
      <div className="top-wrap">
        <div className="top">
          <div className="logo" onClick={()=>{setCat('');setTab('shop')}}>T</div>
          <div className="brand" onClick={()=>{setCat('');setTab('shop')}}><b>TEGEN Market</b><small>{t("Tez yetkazish va qulay xarid")}</small></div>
          {showAiBtn&&<button type="button" className="ai-top-btn" onClick={()=>setAiOpen(true)}>✨ AI</button>}
          <button className="lang" onClick={toggleLang}>{lang==='ru'?'🇺🇿 UZ':'🇷🇺 RU'}</button>
        </div>
      </div>

      {tab==='shop'&&<Shop d={d} cart={cart} setCart={setCart} cat={cat} setCat={setCat} favs={favs} toggleFav={toggleFav} goTab={setTab} onReload={load} say={say}/>}
      {tab==='catalog'&&<Catalog d={d} go={c=>{setCat(c);setTab('shop');scrollTo({top:0})}} onReload={load} say={say}/>}
      {tab==='promo'&&<Promo d={d} cart={cart} setCart={setCart} favs={favs} toggleFav={toggleFav} onReload={load} say={say}/>}
      {tab==='cart'&&<Cart d={d} cart={cart} setCart={setCart} act={act} done={()=>setTab('orders')} onReload={load}/>}
      {tab==='orders'&&<Orders d={d} act={act} cart={cart} setCart={setCart} favs={favs} toggleFav={toggleFav} onReload={load} say={say} onReorder={o=>{const next={...cart};let added=0;for(const i of (o.items||[])){if(!i.product_id||i.active===false)continue;const p={id:i.product_id,name:i.name,name_uz:i.name_uz,price:i.cur_price||i.unit_price,sale_price:i.sale_price,sale_until:i.sale_until,unit:i.unit,image:i.image,category:i.category||'Boshqa',age_min:i.age_min||0,min_grams:i.min_grams||0,min_sum:i.min_sum||0,weight_g:i.weight_g||0};if(!p.price)continue;if(p.unit==='piece'){next[keyOf(p)]={p,qty:Math.max(1,Math.min(500,Math.round(Number(i.qty)||1)))};added++}else if(p.unit==='weight'&&!(p.min_grams>0)){const ms=Math.max(1000,Number(p.min_sum)||30000);next[keyOf(p)]={p,sum:Math.max(ms,Math.round(Number(i.ordered_sum)||ms))};added++}}if(!added){say(t("Bu buyurtmada faol mahsulot topilmadi"));return}setCart(next);say(t("Savatga qo'shildi ✅"));setTab('cart')}}/>}
      {tab==='profile'&&<Profile d={d} go={setTab} onToggleLang={toggleLang} cart={cart} setCart={setCart} say={say} act={act} onReload={load}/>}
      {tab==='admin'&&d.role!=='user'&&<Admin d={d} act={act} say={say} onReload={load} onPreviewAnim={p=>setAnimOverride(p)}/>}

      {(tab==='shop'||tab==='catalog'||tab==='promo')&&<ScrollTopBtn/>}

      {showBar&&<button className="cart-bar" onClick={()=>{haptic('light');setTab('cart')}}>
        {barTarget>0&&<div className="cb-prog"><span className="cb-prog-txt">{barRem>0?(useMin?`🚚 ${t("Minimal buyurtmagacha")}: ${so(barRem)}`:`🚚 ${t("Bepul yetkazishgacha")}: ${so(barRem)}`):(useMin?'✅ '+t("Yetkazib berish mumkin!"):'🎉 '+t("Bepul yetkazib berish!"))}</span><i style={{width:barPct+'%'}}/></div>}
        <div className="cb-main">
          <span className="cb-l"><span className="cb-n">{n}</span><span>{t("Savatga o'tish")}</span></span>
          <span className="cb-r">{so(cartTotal)} →</span>
        </div>
      </button>}

      <div className="nav">
        {tabs.map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>{haptic('sel');if(k==='shop')setCat('');if(k!=='admin')setAnimOverride(null);setTab(k);scrollTo({top:0})}}>
          <NavIcon k={k}/><span>{t(l)}</span>{k==='cart'&&n>0&&<i>{n}</i>}{k==='promo'&&d.saleCount>0&&<i>{d.saleCount}</i>}
        </button>)}
      </div>
      {aiOpen&&<AiSheet d={d} msgs={aiMsgs} setMsgs={setAiMsgs} onReload={load} say={say} close={()=>setAiOpen(false)}/>}
      {toast&&<div className="toast">{toast}</div>}
    </div>
  </LangCtx.Provider>
}
