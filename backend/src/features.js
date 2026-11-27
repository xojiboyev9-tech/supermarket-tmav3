/* Feature flags registry — Super Admin can switch every marketplace feature on/off.
   Stored in settings key 'features' as {key:boolean}; unknown/missing keys fall back to defaults. */
const {getSetting,setSetting}=require('./db');

const REGISTRY=[
 // group, key, default, uz title, ru title, uz description
 ['shop','homeShelves',true,"Bosh sahifa javonlari","Витрины на главной","Aksiyalar, xitlar va 'yana olish' javonlari"],
 ['shop','banners',true,"Bannerlar","Баннеры","Bosh sahifadagi reklama bannerlari"],
 ['shop','bundles',true,"Naborlar","Наборы","Tayyor to'plamlar karuseli"],
 ['shop','videos',true,"Video / yangiliklar","Видео / новости","Bosh sahifadagi video bloklar"],
 ['shop','promoTab',true,"Aksiya bo'limi","Раздел акций","Pastki menyudagi Aksiya bo'limi"],
 ['shop','favorites',true,"Sevimlilar ❤️","Избранное ❤️","Mahsulotni sevimlilarga qo'shish"],
 ['shop','searchHints',true,"Qidiruv tarixi va teglar","История поиска и теги","Oxirgi qidiruvlar va tezkor teglar"],
 ['shop','sorting',true,"Saralash","Сортировка","Mashhur / arzon / qimmat / aksiya bo'yicha saralash"],
 ['shop','recommendations',true,"Tavsiyalar","Рекомендации","Savatda 'Yana nimadir olasizmi?' takliflari"],
 ['shop','share',true,"Mahsulotni ulashish","Поделиться товаром","Mahsulot havolasini do'stga yuborish"],
 ['shop','animation',true,"Bayram animatsiyasi","Праздничная анимация","Ekrandagi bayram effektlari"],
 ['order','delivery',true,"Yetkazib berish","Доставка","Yetkazib berish turini ko'rsatish"],
 ['order','deliveryMeter',true,"Bepul yetkazish shkalasi","Шкала бесплатной доставки","Savatdagi progress ko'rsatkichi"],
 ['order','orderComment',true,"Buyurtmaga izoh","Комментарий к заказу","Mijoz buyurtmaga izoh yozishi"],
 ['order','orderCancel',true,"Mijoz bekor qilishi","Отмена клиентом","Yangi buyurtmani mijoz o'zi bekor qilishi"],
 ['order','orderEdit',true,"Buyurtmani o'zgartirish","Изменение заказа","Mijoz o'zgartirish so'rashi va tahrirlashi"],
 ['order','reorder',true,"Qayta buyurtma","Повторить заказ","Eski buyurtmani bir bosishda savatga qo'shish"],
 ['order','orderTracker',true,"Buyurtma kuzatuvi","Отслеживание заказа","Holat bosqichlari shkalasi"],
 ['order','substitution',true,"Mahsulot almashtirish","Замена товара","Xodim o'xshash mahsulot taklif qilishi"],
 ['order','workingHours',false,"Ish vaqti cheklovi","Часы работы","Ish vaqtidan tashqari buyurtma qabul qilinmaydi"],
 ['loyalty','discountCards',true,"Diskont kartalar","Дисконтные карты","TEGEN diskont karta va keshbek"],
 ['admin','broadcast',true,"Xabar yuborish","Рассылка","Mijozlarga ommaviy xabar"],
 ['admin','ai',true,"AI yordamchi","AI помощник","Adminlar uchun Gemini yordamchi"]
];
const DEFAULTS=Object.fromEntries(REGISTRY.map(r=>[r[1],r[2]]));
const KEYS=new Set(Object.keys(DEFAULTS));

async function get(){const s=await getSetting('features').catch(()=>null);const v={...DEFAULTS};
 if(s&&typeof s==='object')for(const k of KEYS)if(typeof s[k]==='boolean')v[k]=s[k];
 const hrs=s&&s.hours&&typeof s.hours==='object'?s.hours:{};v.hours={from:/^\d\d:\d\d$/.test(hrs.from)?hrs.from:'08:00',to:/^\d\d:\d\d$/.test(hrs.to)?hrs.to:'22:00'};
 return v}
async function save(body){const cur=await get(),v={...cur};
 for(const k of KEYS)if(typeof body?.[k]==='boolean')v[k]=body[k];
 if(body?.hours){const f=String(body.hours.from||''),t=String(body.hours.to||'');if(/^\d\d:\d\d$/.test(f))v.hours.from=f;if(/^\d\d:\d\d$/.test(t))v.hours.to=t}
 await setSetting('features',v);return v}
/* Is the store open now (Asia/Tashkent)? Supports overnight ranges like 20:00–02:00. */
function isOpen(f){if(!f.workingHours)return true;
 const now=new Date(Date.now()+5*3600e3),m=now.getUTCHours()*60+now.getUTCMinutes();
 const toM=s=>{const[a,b]=s.split(':').map(Number);return a*60+b},a=toM(f.hours.from),b=toM(f.hours.to);
 return a<=b?(m>=a&&m<b):(m>=a||m<b)}
const registry=()=>REGISTRY.map(([group,key,def,uz,ru,desc])=>({group,key,def,uz,ru,desc}));
module.exports={get,save,isOpen,registry,DEFAULTS};
