// JOYI: backend/src/bot.js  (GitHub'da shu yo'l bilan yarating)
const {Telegraf,Markup}=require('telegraf');const {q,audit}=require('./db');const O=require('./orders');const {checkBotFlood}=require('./security');const AI=require('./ai');
const bot=new Telegraf(process.env.BOT_TOKEN||'0:x');
const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const so=(n,l='uz')=>Number(n).toLocaleString('ru-RU')+(l==='ru'?' сум':" so'm");
const STAFF="('operator','admin','superadmin')";
const me=async id=>(await q('select * from users where tg_id=$1',[id])).rows[0];
const userLang=async id=>((await q('select lang from users where tg_id=$1',[id])).rows[0]?.lang==='ru'?'ru':'uz');
const isStaff=u=>u&&['operator','admin','superadmin'].includes(u.role);
const isAdmin=u=>u&&['admin','superadmin'].includes(u.role);
const canBroadcast=u=>Boolean(u&&(u.role==='superadmin'||(u.role==='admin'&&u.can_broadcast)));
const staffIds=async()=>(await q(`select tg_id from users where role in ${STAFF}`)).rows.map(r=>r.tg_id);
const send=(id,t,kb)=>bot.telegram.sendMessage(id,t,{parse_mode:'HTML',...(kb||{})}).catch(e=>console.error('send',id,e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
bot.use(async(ctx,next)=>{
 if(!ctx.from?.id)return next();
 const u=await me(ctx.from.id).catch(()=>null);
 const chk=checkBotFlood(ctx.from,u?.role||'user');
 if(!chk.ok)return;
 return next();
});
const T={
 uz:{
  welcome:r=>`Xush kelibsiz!${r&&r!=='user'?` Rol: ${r}`:''}`,
  openPrompt:"Do'konni ochish uchun tugmani bosing:",
  openBtn:"🛒 Do'konni ochish",
  phoneSaved:'✅ Telefon raqamingiz saqlandi.',
  onlyOwn:"Faqat o'z raqamingizni yuboring.",
  langSet:"✅ O'zbek tili tanlandi",
  needStart:'Avval /start bosib tilni tanlang.',
  noLinks:'Havola yuborish mumkin emas.',
  msgSent:'✅ Xabaringiz adminga yuborildi.',
  ansSaved:'Javobingiz qabul qilindi',
  status:{accepted:'qabul qilindi',preparing:"yig'ilmoqda",ready:'TAYYOR — olib ketishingiz mumkin',completed:'topshirildi',cancelled:'bekor qilindi'},
  statusMsg:(id,m,code)=>`Buyurtma #${id} ${m}.${code?` Kod: <b>${code}</b>`:''}`,
  weighMsg:(id,lines,sub)=>`⚖️ Buyurtma #${id}: tortishda narx o'zgardi.\n${lines}\n\nYangi mahsulotlar jami: <b>${sub}</b>\nRozimisiz?`,
  agree:'✅ Roziman',
  cancel:'❌ Bekor qilish',
  ageMsg:(id,age)=>`🔞 Buyurtma #${id} tarkibida ${age} yoshdan oshganlarga sotiladigan mahsulot bor.\nSiz ${age} yoshdan oshganingizni tasdiqlaysizmi?`,
  ageYes:age=>`✅ Ha, ${age} dan oshganman`,
  ageNo:"❌ Yo'q",
  subMsg:(id,lines)=>`🔁 Buyurtma #${id}: ba'zi mahsulot qolmagan, almashtirishni taklif qilamiz:\n${lines}\n\nRozimisiz?`,
  subNo:'➖ Shunsiz davom etish',
  editOk:id=>`✏️ Buyurtma #${id}: o'zgartirishga ruxsat berildi. Ilovada tahrirlang.`,
  editNo:id=>`Buyurtma #${id}: o'zgartirishga ruxsat berilmadi.`
 },
 ru:{
  welcome:r=>`Добро пожаловать!${r&&r!=='user'?` Роль: ${r}`:''}`,
  openPrompt:'Нажмите кнопку, чтобы открыть магазин:',
  openBtn:'🛒 Открыть магазин',
  phoneSaved:'✅ Ваш номер телефона сохранён.',
  onlyOwn:'Пожалуйста, отправьте только свой номер телефона.',
  langSet:'✅ Выбран русский язык',
  needStart:'Сначала нажмите /start и выберите язык.',
  noLinks:'Отправка ссылок запрещена.',
  msgSent:'✅ Ваше сообщение отправлено администратору.',
  ansSaved:'Ваш ответ принят',
  status:{accepted:'принят',preparing:'собирается',ready:'ГОТОВ — можно забирать',completed:'выдан',cancelled:'отменён'},
  statusMsg:(id,m,code)=>`Заказ #${id} ${m}.${code?` Код получения: <b>${code}</b>`:''}`,
  weighMsg:(id,lines,sub)=>`⚖️ Заказ #${id}: после взвешивания цена изменилась.\n${lines}\n\nНовая сумма товаров: <b>${sub}</b>\nСогласны?`,
  agree:'✅ Согласен',
  cancel:'❌ Отменить',
  ageMsg:(id,age)=>`🔞 В заказе #${id} есть товар с возрастным ограничением ${age}+.\nПодтверждаете, что вам больше ${age} лет?`,
  ageYes:age=>`✅ Да, мне больше ${age}`,
  ageNo:'❌ Нет',
  subMsg:(id,lines)=>`🔁 Заказ #${id}: некоторых товаров нет в наличии, предлагаем замену:\n${lines}\n\nСогласны?`,
  subNo:'➖ Продолжить без них',
  editOk:id=>`✏️ Заказ #${id}: редактирование разрешено. Измените заказ в приложении.`,
  editNo:id=>`Заказ #${id}: в редактировании отказано.`
 }
};
const tr=l=>T[l==='ru'?'ru':'uz'];
const askLang=ctx=>ctx.reply("🇺🇿 Assalomu alaykum! Tilni tanlang:\n🇷🇺 Здравствуйте! Выберите язык:",Markup.inlineKeyboard([[Markup.button.callback("🇺🇿 O'zbekcha",'lang:uz'),Markup.button.callback('🇷🇺 Русский','lang:ru')]]));
const menu=async(ctx,u)=>{
 const l=tr(u?.lang);
 const rows=[];
 if(process.env.WEBAPP_URL)rows.push([Markup.button.webApp(l.openBtn,process.env.WEBAPP_URL)]);
 if(isAdmin(u))rows.push([Markup.button.callback('🤖 AI Yordamchi','ai:help')]);
 else if(AI.isReady()&&(await AI.getConfig()).customerEnabled)rows.push([Markup.button.callback(u?.lang==='ru'?'🤖 AI Консультант':'🤖 AI Maslahatchi','ai:on')]);
 if(canBroadcast(u))rows.push([Markup.button.callback('📣 Yangilik / Xabar yuborish','bc:start')]);
 await ctx.reply(l.welcome(u?.role),Markup.removeKeyboard());
 return ctx.reply(l.openPrompt,rows.length?Markup.inlineKeyboard(rows):undefined);
};

/* Broadcast state & delivery engine */
const bcDraft=new Map();
const bcSent=new Set();
const bk=id=>String(id);
const KMAP={t:'text',p:'photo',v:'video'};
const bcCounts=async()=>(await q("select count(*)::int all_c,count(*) filter(where coalesce(lang,'uz')<>'ru')::int uz_c,count(*) filter(where lang='ru')::int ru_c from users")).rows[0];
const bcConfirmKb=(cnt,withBtn,msgId,kind='text')=>{
 const wb=withBtn?1:0,kc=kind==='video'?'v':kind==='photo'?'p':'t';
 return Markup.inlineKeyboard([
  [Markup.button.callback(`✅ Barchaga yuborish (${cnt.all_c})`,`bc:go:all:${msgId}:${wb}:${kc}`)],
  [Markup.button.callback(`🇺🇿 O'zbekcha (${cnt.uz_c})`,`bc:go:uz:${msgId}:${wb}:${kc}`),Markup.button.callback(`🇷🇺 Ruscha (${cnt.ru_c})`,`bc:go:ru:${msgId}:${wb}:${kc}`)],
  [Markup.button.callback(`🛒 Do'kon tugmasi: ${withBtn?'✅ Ha':"❌ Yo'q"}`,`bc:btn:${msgId}:${wb}:${kc}`)],
  [Markup.button.callback('❌ Bekor qilish','bc:cancel')]
 ]);
};
async function runBroadcast({sender,target='all',kind='text',text='',mediaUrl='',preview='',withBtn=true,fromChatId=null,fromMsgId=null}){
 const tClean=['all','uz','ru'].includes(target)?target:'all';
 const where=tClean==='ru'?"where lang='ru'":tClean==='uz'?"where coalesce(lang,'uz')<>'ru'":'';
 const users=(await q(`select tg_id,coalesce(lang,'uz') lang from users ${where} order by tg_id`)).rows;
 const summary=String(preview||text||'').trim().slice(0,240);
 const rec=(await q("insert into broadcasts(sender_id,sender_name,kind,text,target,total,status) values($1,$2,$3,$4,$5,$6,'sending') returning id",[sender.tg_id,sender.name||String(sender.tg_id),kind,summary||null,tClean,users.length])).rows[0];
 const bid=rec.id;
 await audit(sender.tg_id,'broadcast.send','broadcast:'+bid,{kind,target:tClean,total:users.length});

 let mediaBuf=null;
 if(!fromChatId&&mediaUrl&&mediaUrl.startsWith('/img/')){
  const imgId=Number(mediaUrl.slice(5));
  if(imgId){const r=(await q('select data from images where id=$1',[imgId])).rows[0];if(r)mediaBuf=r.data}
 }

 (async()=>{
  let sent=0,failed=0,cachedFileId=null;
  const makeKb=lg=>(withBtn&&process.env.WEBAPP_URL)?{inline_keyboard:[[{text:tr(lg).openBtn,web_app:{url:process.env.WEBAPP_URL}}]]}:undefined;
  const deliver=async u=>{
   const reply_markup=makeKb(u.lang);
   if(fromChatId&&fromMsgId){
    return bot.telegram.copyMessage(u.tg_id,fromChatId,fromMsgId,reply_markup?{reply_markup}:{});
   }
   if(kind==='photo'){
    const src=cachedFileId||(mediaBuf?{source:mediaBuf}:mediaUrl);
    const res=await bot.telegram.sendPhoto(u.tg_id,src,{caption:text?esc(text):undefined,parse_mode:'HTML',...(reply_markup?{reply_markup}:{})});
    if(!cachedFileId&&res?.photo?.length)cachedFileId=res.photo[res.photo.length-1].file_id;
    return res;
   }
   if(kind==='video'){
    const src=cachedFileId||mediaUrl;
    const res=await bot.telegram.sendVideo(u.tg_id,src,{caption:text?esc(text):undefined,parse_mode:'HTML',...(reply_markup?{reply_markup}:{})});
    if(!cachedFileId&&res?.video?.file_id)cachedFileId=res.video.file_id;
    return res;
   }
   return bot.telegram.sendMessage(u.tg_id,esc(text),{parse_mode:'HTML',...(reply_markup?{reply_markup}:{})});
  };

  for(let i=0;i<users.length;i++){
   try{await deliver(users[i]);sent++}
   catch(e){
    const wait=e?.parameters?.retry_after;
    if(wait){
     await sleep((Number(wait)+1)*1000);
     try{await deliver(users[i]);sent++}catch{failed++}
    }else failed++;
   }
   if((i+1)%25===0)await q('update broadcasts set sent=$1,failed=$2 where id=$3',[sent,failed,bid]).catch(()=>{});
   if(i+1<users.length)await sleep(45);
  }
  await q("update broadcasts set sent=$1,failed=$2,status='done',finished_at=now() where id=$3",[sent,failed,bid]).catch(()=>{});
  send(sender.tg_id,`✅ <b>Xabar yuborish yakunlandi!</b> (#${bid})\n👥 Jami: <b>${users.length}</b>\n📨 Yetib bordi: <b>${sent}</b>\n🚫 Yetib bormadi: <b>${failed}</b>`);
 })().catch(e=>console.error('broadcast',bid,e));

 return{id:bid,total:users.length};
}

bot.start(async ctx=>askLang(ctx));
bot.command('lang',async ctx=>askLang(ctx));
const startBcPrompt=async ctx=>{
 const u=await me(ctx.from.id);
 if(!canBroadcast(u))return ctx.reply("🚫 Sizda xabar yuborish ruxsati yo'q.");
 bcDraft.set(bk(ctx.from.id),{step:'await',withBtn:true});
 return ctx.reply("📣 <b>Xabar yuborish (Yangiliklar)</b>\n\nBarcha foydalanuvchilarga yuboriladigan xabarni hozir yuboring:\n• 📝 Matn\n• 🖼 Rasm (+ matn)\n• 🎬 Video (+ matn) yoki GIF\n\nBekor qilish: /cancel",{parse_mode:'HTML',...Markup.inlineKeyboard([[Markup.button.callback('❌ Bekor qilish','bc:cancel')]])});
};
bot.command('broadcast',startBcPrompt);
bot.command('cancel',async ctx=>{if(bcDraft.delete(bk(ctx.from.id)))return ctx.reply('❌ Xabar yuborish bekor qilindi.')});

const guard=fn=>async ctx=>{try{await fn(ctx)}catch(e){ctx.answerCbQuery(e.message,{show_alert:true}).catch(()=>{})}};
bot.action(/^lang:(uz|ru)$/,guard(async ctx=>{
 const lang=ctx.match[1],n=`${ctx.from.first_name||''} ${ctx.from.last_name||''}`.trim();
 await q("insert into users(tg_id,name,lang) values($1,$2,$3) on conflict(tg_id) do update set lang=$3,name=coalesce(nullif($2,''),users.name)",[ctx.from.id,n,lang]);
 const l=tr(lang);
 await ctx.answerCbQuery(l.langSet).catch(()=>{});
 await ctx.editMessageReplyMarkup().catch(()=>{});
 const u=await me(ctx.from.id);
 return menu(ctx,u);
}));
bot.action('bc:start',guard(async ctx=>{
 const u=await me(ctx.from.id);
 if(!canBroadcast(u))return ctx.answerCbQuery("Ruxsat yo'q",{show_alert:true});
 await ctx.answerCbQuery().catch(()=>{});
 return startBcPrompt(ctx);
}));
bot.action('bc:cancel',guard(async ctx=>{
 bcDraft.delete(bk(ctx.from.id));
 await ctx.answerCbQuery('Bekor qilindi').catch(()=>{});
 await ctx.editMessageText('❌ Xabar yuborish bekor qilindi.').catch(()=>{});
}));
bot.action(/^bc:btn(?::(\d+):([01]):([tpv]))?$/,guard(async ctx=>{
 const u=await me(ctx.from.id);
 if(!canBroadcast(u))return ctx.answerCbQuery("Ruxsat yo'q",{show_alert:true});
 const d=bcDraft.get(bk(ctx.from.id));
 const msgId=ctx.match[1]?Number(ctx.match[1]):d?.msgId;
 if(!msgId)return ctx.answerCbQuery("Xabar topilmadi",{show_alert:true});
 const curBtn=ctx.match[2]!=null?ctx.match[2]==='1':Boolean(d?.withBtn);
 const nextBtn=!curBtn;
 const kind=KMAP[ctx.match[3]]||d?.kind||'text';
 if(d)d.withBtn=nextBtn;
 const cnt=await bcCounts();
 await ctx.editMessageReplyMarkup(bcConfirmKb(cnt,nextBtn,msgId,kind).reply_markup).catch(()=>{});
 await ctx.answerCbQuery(nextBtn?"Do'kon tugmasi yoqildi":"Do'kon tugmasi o'chirildi").catch(()=>{});
}));
bot.action(/^bc:go:(all|uz|ru)(?::(\d+):([01]):([tpv]))?$/,guard(async ctx=>{
 const u=await me(ctx.from.id);
 if(!canBroadcast(u))return ctx.answerCbQuery("Ruxsat yo'q",{show_alert:true});
 const key=bk(ctx.from.id),d=bcDraft.get(key);
 const target=ctx.match[1];
 const msgId=ctx.match[2]?Number(ctx.match[2]):d?.msgId;
 const chatId=ctx.chat?.id||d?.chatId;
 if(!msgId||!chatId)return ctx.answerCbQuery("Avval /broadcast bosib xabarni yuboring",{show_alert:true});
 const sentKey=`${chatId}:${msgId}`;
 if(bcSent.has(sentKey))return ctx.answerCbQuery("Bu xabar allaqachon yuborilgan",{show_alert:true});
 bcSent.add(sentKey);
 if(bcSent.size>200)bcSent.delete(bcSent.values().next().value);
 const withBtn=ctx.match[3]!=null?ctx.match[3]==='1':(d?d.withBtn:true);
 const kind=KMAP[ctx.match[4]]||d?.kind||'text';
 const preview=d?.preview||'';
 bcDraft.delete(key);
 await ctx.answerCbQuery('🚀 Yuborish boshlandi!').catch(()=>{});
 const r=await runBroadcast({sender:u,target,kind,preview,withBtn,fromChatId:chatId,fromMsgId:msgId});
 await ctx.editMessageText(`🚀 <b>Xabar yuborish boshlandi!</b> (#${r.id})\n👥 Qabul qiluvchilar: <b>${r.total}</b> ta\nYakunlangach hisobot yuboriladi.`,{parse_mode:'HTML'}).catch(()=>{});
}));

bot.on('contact',async ctx=>{const c=ctx.message.contact,u0=await me(ctx.from.id),l=tr(u0?.lang);
 if(c.user_id!==ctx.from.id)return ctx.reply(l.onlyOwn);
 const n=`${ctx.from.first_name||''} ${ctx.from.last_name||''}`.trim();
 const ph=O.normPhone(c.phone_number)||String(c.phone_number||'').replace(/\D/g,'');
 await q("insert into users(tg_id,name,phone) values($1,$2,$3) on conflict(tg_id) do update set phone=$3,name=coalesce(nullif($2,''),users.name)",[ctx.from.id,n,ph]);
 return ctx.reply(l.phoneSaved,Markup.removeKeyboard());
});
bot.action(/^o:(accept|prep|ready|done|cancel):(\d+)$/,guard(async ctx=>{const u=await me(ctx.from.id);if(!isStaff(u))return ctx.answerCbQuery("Ruxsat yo'q");
 const st={accept:'accepted',prep:'preparing',ready:'ready',done:'completed',cancel:'cancelled'}[ctx.match[1]];
 await O.setStatus(u.tg_id,Number(ctx.match[2]),st);await ctx.answerCbQuery('✅ '+st)}));
bot.action(/^c:(yes|no):(\d+)$/,guard(async ctx=>{await O.confirm(ctx.from.id,Number(ctx.match[2]),ctx.match[1]==='yes');
 await ctx.editMessageReplyMarkup().catch(()=>{});await ctx.answerCbQuery(tr(await userLang(ctx.from.id)).ansSaved)}));
bot.action(/^a:(yes|no):(\d+)$/,guard(async ctx=>{await O.ageConfirm(ctx.from.id,Number(ctx.match[2]),ctx.match[1]==='yes');await ctx.editMessageReplyMarkup().catch(()=>{});await ctx.answerCbQuery(tr(await userLang(ctx.from.id)).ansSaved)}));
bot.action(/^s:(yes|no):(\d+)$/,guard(async ctx=>{await O.subAnswer(ctx.from.id,Number(ctx.match[2]),ctx.match[1]==='yes');await ctx.editMessageReplyMarkup().catch(()=>{});await ctx.answerCbQuery(tr(await userLang(ctx.from.id)).ansSaved)}));
bot.action(/^e:(ok|no):(\d+)$/,guard(async ctx=>{const u=await me(ctx.from.id);if(!isStaff(u))return ctx.answerCbQuery("Ruxsat yo'q");await O.editDecide(u.tg_id,Number(ctx.match[2]),ctx.match[1]==='ok');await ctx.editMessageReplyMarkup().catch(()=>{});await ctx.answerCbQuery('Tayyor')}));
bot.action(/^p:(ok|no):(\d+)$/,guard(async ctx=>{const u=await me(ctx.from.id);if(!u||!['admin','superadmin'].includes(u.role))return ctx.answerCbQuery("Ruxsat yo'q");
 await O.resolveChange(u.tg_id,Number(ctx.match[2]),ctx.match[1]==='ok');await ctx.editMessageReplyMarkup().catch(()=>{});await ctx.answerCbQuery('Tayyor')}));
/* AI Assistant in Bot (Admin: always on for plain text/voice; Customer: opt-in toggle so support chat stays intact) */
const aiCustMode=new Set();
const AI_ADMIN_HELP="🤖 <b>Admin AI Yordamchi</b>\n\nMenga oddiy matn yoki 🎤 <b>ovozli xabar</b> yuboring, masalan:\n• <i>Bugungi savdo qancha, top mahsulotlar?</i>\n• <i>Olmani Meva katalogida 3-o'ringa qo'y</i>\n• <i>Bananga ertagacha 15% aksiya qil</i>\n• <i>Coca-Cola 1.5 L ni o'chir</i>\n• <i>Oxirgi buyurtmalarni ko'rsat</i>\n• <i>Barchaga: Ertaga 9:00 da ochilamiz deb xabar yubor</i>\n\nHar bir o'zgartirishdan oldin <b>Tasdiqlash</b> so'rayman. Suhbatni tozalash: /ai_reset";
const aiCustHelp=lg=>lg==='ru'
 ?"🤖 <b>AI Консультант TEGEN Market</b>\n\nНапишите или отправьте 🎤 <b>голосовое</b>, например:\n• <i>Что нужно для плова на 4 человек?</i>\n• <i>Какие сегодня акции?</i>\n• <i>Где мой заказ?</i>\n\nЧтобы написать администратору, нажмите кнопку ниже."
 :"🤖 <b>AI Maslahatchi (TEGEN Market)</b>\n\nSavolingizni yozing yoki 🎤 <b>ovozli xabar</b> yuboring, masalan:\n• <i>4 kishiga palov uchun nima kerak?</i>\n• <i>Bugungi aksiyalar qaysilar?</i>\n• <i>Buyurtmam qayerda qoldi?</i>\n\nAdminga yozish uchun pastdagi tugmani bosing.";

async function downloadTgAudio(ctx,fileObj){
 if(!fileObj?.file_id)return null;
 if(fileObj.file_size&&fileObj.file_size>2000000)throw O.bad('Ovozli xabar juda katta (max 2 MB)');
 const link=await ctx.telegram.getFileLink(fileObj.file_id);
 const res=await fetch(link.href,{signal:AbortSignal.timeout(15000)});
 if(!res.ok)throw O.bad("Ovozli xabarni yuklab bo'lmadi");
 const buf=Buffer.from(await res.arrayBuffer());
 if(buf.length>2000000)throw O.bad('Ovozli xabar juda katta');
 return{audioBase64:buf.toString('base64'),audioMime:fileObj.mime_type||'audio/ogg'};
}
async function runAdminAi(ctx,u,payload){
 await ctx.sendChatAction('typing').catch(()=>{});
 try{
  const r=await AI.chatAdmin(u,payload);
  if(r.pending){
   const msg=`🤖 ${esc(r.reply)}\n\n<b>${esc(r.pending.summary)}</b>`;
   return ctx.reply(msg,{parse_mode:'HTML',...Markup.inlineKeyboard([[Markup.button.callback('✅ Tasdiqlash',`ai:ok:${r.pending.id}`),Markup.button.callback('❌ Bekor qilish',`ai:no:${r.pending.id}`)]])});
  }
  return ctx.reply(esc(r.reply).slice(0,4000),{parse_mode:'HTML'});
 }catch(e){return ctx.reply('⚠️ '+esc(e.message||'AI xatosi'),{parse_mode:'HTML'})}
}
async function runCustAi(ctx,u,payload){
 await ctx.sendChatAction('typing').catch(()=>{});
 const lg=u?.lang==='ru'?'ru':'uz';
 try{
  const r=await AI.chatCustomer(u,payload);
  let msg=esc(r.reply);
  if(r.recommendations?.length){
   const lines=r.recommendations.map(it=>{
    const p=it.product,nm=lg==='uz'?(p.name_uz||p.name):p.name;
    const ep=(p.sale_price&&p.sale_price>0&&p.sale_price<p.price&&(!p.sale_until||new Date(p.sale_until)>new Date()))?p.sale_price:p.price;
    const qLbl=p.unit==='weight'?(it.grams>=1000?(it.grams/1000)+' kg':it.grams+' g'):(it.qty+' dona');
    return`• ${esc(nm)} (${qLbl}) — <b>${so(ep,lg)}</b>`;
   });
   msg+=`\n\n🛒 <b>${lg==='ru'?'Найдено в магазине':'Doʻkonda topildi'}:</b>\n${lines.join('\n')}`;
  }
  const rows=[];
  if(process.env.WEBAPP_URL)rows.push([Markup.button.webApp(tr(lg).openBtn,process.env.WEBAPP_URL)]);
  rows.push([Markup.button.callback(lg==='ru'?'📩 Написать админу':'📩 Adminga yozish','ai:off')]);
  return ctx.reply(msg.slice(0,4000),{parse_mode:'HTML',...Markup.inlineKeyboard(rows)});
 }catch(e){return ctx.reply('⚠️ '+esc(e.message||'AI xatosi'),{parse_mode:'HTML'})}
}

bot.command('ai',async ctx=>{
 const u=await me(ctx.from.id);
 if(!u)return ctx.reply(tr().needStart);
 if(isAdmin(u))return ctx.reply(AI_ADMIN_HELP,{parse_mode:'HTML'});
 if(!AI.isReady()||!(await AI.getConfig()).customerEnabled)return ctx.reply(u.lang==='ru'?'🤖 AI консультант сейчас отключён.':"🤖 AI maslahatchi hozircha o'chirilgan.");
 aiCustMode.add(bk(ctx.from.id));
 return ctx.reply(aiCustHelp(u.lang),{parse_mode:'HTML',...Markup.inlineKeyboard([[Markup.button.callback(u.lang==='ru'?'📩 Написать админу':'📩 Adminga yozish','ai:off')]])});
});
bot.command('ai_reset',async ctx=>{
 AI.clearHistory(ctx.from.id);
 return ctx.reply('🧹 AI suhbat tarixi tozalandi.');
});
bot.action('ai:help',guard(async ctx=>{
 await ctx.answerCbQuery().catch(()=>{});
 return ctx.reply(AI_ADMIN_HELP,{parse_mode:'HTML'});
}));
bot.action('ai:on',guard(async ctx=>{
 const u=await me(ctx.from.id);
 if(!u)return ctx.answerCbQuery(tr().needStart,{show_alert:true});
 if(!AI.isReady()||!(await AI.getConfig()).customerEnabled)return ctx.answerCbQuery("AI hozircha o'chirilgan",{show_alert:true});
 aiCustMode.add(bk(ctx.from.id));
 await ctx.answerCbQuery('🤖 AI yoqildi').catch(()=>{});
 return ctx.reply(aiCustHelp(u.lang),{parse_mode:'HTML',...Markup.inlineKeyboard([[Markup.button.callback(u.lang==='ru'?'📩 Написать админу':'📩 Adminga yozish','ai:off')]])});
}));
bot.action('ai:off',guard(async ctx=>{
 const u=await me(ctx.from.id);
 aiCustMode.delete(bk(ctx.from.id));
 await ctx.answerCbQuery('OK').catch(()=>{});
 return ctx.reply(u?.lang==='ru'?'📩 Режим связи с админом включён — напишите ваш вопрос.':'📩 Adminga yozish rejimi yoqildi — xabaringizni yozing.');
}));
bot.action(/^ai:ok:([a-f0-9]+)$/,guard(async ctx=>{
 const u=await me(ctx.from.id);
 if(!isAdmin(u))return ctx.answerCbQuery("Ruxsat yo'q",{show_alert:true});
 await ctx.answerCbQuery('⏳ Bajarilmoqda...').catch(()=>{});
 const r=await AI.confirmAction(u,ctx.match[1]);
 await ctx.editMessageText(`✅ <b>Bajarildi:</b>\n${esc(r.message)}`,{parse_mode:'HTML'}).catch(()=>{});
}));
bot.action(/^ai:no:([a-f0-9]+)$/,guard(async ctx=>{
 const u=await me(ctx.from.id);
 AI.cancelAction(u||{tg_id:ctx.from.id},ctx.match[1]);
 await ctx.answerCbQuery('Bekor qilindi').catch(()=>{});
 await ctx.editMessageText('❌ Amal bekor qilindi.').catch(()=>{});
}));

bot.on(['voice','audio'],async ctx=>{
 const u=await me(ctx.from.id);if(!u)return;
 const key=bk(ctx.from.id);
 const fileObj=ctx.message.voice||ctx.message.audio;
 if(isAdmin(u)&&bcDraft.get(key)?.step!=='await'){
  try{const aud=await downloadTgAudio(ctx,fileObj);if(aud)return runAdminAi(ctx,u,aud)}
  catch(e){return ctx.reply('⚠️ '+esc(e.message||'Ovoz xatosi'),{parse_mode:'HTML'})}
 }
 if(!isStaff(u)&&aiCustMode.has(key)){
  try{const aud=await downloadTgAudio(ctx,fileObj);if(aud)return runCustAi(ctx,u,aud)}
  catch(e){return ctx.reply('⚠️ '+esc(e.message||'Ovoz xatosi'),{parse_mode:'HTML'})}
 }
});

const LINK=/(https?:|www\.|t\.me|@\w{4,}|\.(com|uz|ru|org|net)\b)/i;
bot.on(['text','photo','video','animation','video_note','document'],async ctx=>{const u=await me(ctx.from.id);
 const key=bk(ctx.from.id);
 if(canBroadcast(u)&&bcDraft.get(key)?.step==='await'){
  if(ctx.message.text&&ctx.message.text.trim()==='/cancel'){bcDraft.delete(key);return ctx.reply('❌ Xabar yuborish bekor qilindi.')}
  const kind=(ctx.message.video||ctx.message.animation||ctx.message.video_note)?'video':ctx.message.photo?'photo':'text';
  const preview=(ctx.message.text||ctx.message.caption||'').trim().slice(0,120);
  const msgId=ctx.message.message_id;
  bcDraft.set(key,{step:'confirm',chatId:ctx.chat.id,msgId,kind,preview,withBtn:true});
  const cnt=await bcCounts();
  const kLabel=kind==='video'?'🎬 Video':kind==='photo'?'🖼 Rasm':'📝 Matn';
  return ctx.reply(`📣 <b>Xabar tayyor!</b>\nFormat: <b>${kLabel}</b>\nKimlarga yuborilsin?`,{parse_mode:'HTML',...bcConfirmKb(cnt,true,msgId,kind)});
 }
 if(isStaff(u)){
  const r=ctx.message.reply_to_message;
  if(r){
   const m=(await q('select user_id from support_map where chat_id=$1 and msg_id=$2',[ctx.chat.id,r.message_id])).rows[0];
   if(m){await bot.telegram.copyMessage(m.user_id,ctx.chat.id,ctx.message.message_id);return ctx.reply('✅ Yuborildi')}
  }
  if(isAdmin(u)&&ctx.message.text&&!ctx.message.text.trim().startsWith('/')){
   return runAdminAi(ctx,u,{text:ctx.message.text});
  }
  return;
 }
 if(!ctx.message.text&&!ctx.message.photo)return;
 const l=tr(u?.lang);
 if(!u)return ctx.reply(l.needStart);
 if(ctx.message.text&&LINK.test(ctx.message.text)||ctx.message.caption&&LINK.test(ctx.message.caption))return ctx.reply(l.noLinks);
 if(aiCustMode.has(key)&&ctx.message.text&&!ctx.message.text.trim().startsWith('/')){
  return runCustAi(ctx,u,{text:ctx.message.text});
 }
 for(const id of await staffIds()){const h=await bot.telegram.sendMessage(id,`📩 <b>${esc(u.name)}</b> | ${esc(u.phone||'—')}\n(Javob berish uchun shu xabarga reply qiling)`,{parse_mode:'HTML'}).catch(()=>null);
  const c=await bot.telegram.copyMessage(id,ctx.chat.id,ctx.message.message_id).catch(()=>null);
  for(const x of [h,c])if(x)await q('insert into support_map values($1,$2,$3) on conflict do nothing',[id,x.message_id,u.tg_id])}
 ctx.reply(l.msgSent)});
const orderKb=o=>Markup.inlineKeyboard([[Markup.button.callback('✅ Qabul',`o:accept:${o.id}`),Markup.button.callback('⚙️ Yig‘ilmoqda',`o:prep:${o.id}`)],[Markup.button.callback('🛍 Tayyor',`o:ready:${o.id}`),Markup.button.callback('✔️ Topshirildi',`o:done:${o.id}`)],[Markup.button.callback('❌ Bekor',`o:cancel:${o.id}`)]]);
O.setNotifier({
 async subRequest(o,items){const lg=await userLang(o.user_id),l=tr(lg);const lines=items.map(i=>`• ${esc(i.name)} → <b>${esc(i.sub_name)}</b> (${so(i.sub_price,lg)})`).join('\n');send(o.user_id,l.subMsg(o.id,lines),Markup.inlineKeyboard([[Markup.button.callback(l.agree,`s:yes:${o.id}`),Markup.button.callback(l.subNo,`s:no:${o.id}`)]]))},
 async subDone(o,yes){for(const id of await staffIds())send(id,`Buyurtma #${o.id}: mijoz almashtirishga ${yes?'ROZI ✅':'rozi emas, mahsulot olib tashlandi ➖'}`)},
 async editRequested(o){for(const id of await staffIds())send(id,`✏️ Buyurtma #${o.id}: mijoz o'zgartirish so'radi`,Markup.inlineKeyboard([[Markup.button.callback('✅ Ruxsat',`e:ok:${o.id}`),Markup.button.callback('❌ Rad',`e:no:${o.id}`)]]))},
 async editDecided(o,ok){const l=tr(await userLang(o.user_id));send(o.user_id,ok?l.editOk(o.id):l.editNo(o.id))},
 async ageCheck(o,age){const l=tr(await userLang(o.user_id));send(o.user_id,l.ageMsg(o.id,age),Markup.inlineKeyboard([[Markup.button.callback(l.ageYes(age),`a:yes:${o.id}`),Markup.button.callback(l.ageNo,`a:no:${o.id}`)]]))},
 async newOrder(o,lines){const cardLine=o.card_number?`\n💳 Diskont karta: <code>${esc(o.card_number)}</code> (2% keshbek)`:'';const t=`🆕 <b>Buyurtma #${o.id}</b> (kod ${o.code})\n👤 ${esc(o.name)} ${esc(o.phone)}${cardLine}\n${o.type==='delivery'?"🚚 "+esc(o.address)+" — 📞 mijozga qo'ng'iroq qilib tasdiqlang":'🏃 Olib ketish'}\n\n`+lines.map(l=>`• ${esc(l.name)} — ${l.unit==='weight'?l.qty+' kg':l.qty+' dona'} = ${so(l.sum)}`).join('\n')+`\n\n💰 <b>${so(o.total)}</b>`;
  for(const id of await staffIds())send(id,t,orderKb(o))},
 async statusChanged(o){const l=tr(await userLang(o.user_id)),m=l.status[o.status];if(!m)return;
  send(o.user_id,l.statusMsg(o.id,m,o.status==='ready'?o.code:null))},
 async confirmRequest(o,items,sub){const lg=await userLang(o.user_id),l=tr(lg);const t=items.filter(i=>i.unit==='weight'&&i.actual_sum!==i.ordered_sum&&i.actual_sum!=null).map(i=>`• ${esc(i.name)}: ${so(i.ordered_sum,lg)} → <b>${so(i.actual_sum,lg)}</b>`).join('\n');
  send(o.user_id,l.weighMsg(o.id,t,so(sub,lg)),Markup.inlineKeyboard([[Markup.button.callback(l.agree,`c:yes:${o.id}`),Markup.button.callback(l.cancel,`c:no:${o.id}`)]]))},
 async confirmDone(o,yes){for(const id of await staffIds())send(id,`Buyurtma #${o.id}: mijoz yangi narxga ${yes?'ROZI bo‘ldi ✅':'ROZI BO‘LMADI ❌ (bekor)'}`)},
 async pending(r){const p=r.product;for(const id of (await q("select tg_id from users where role in ('admin','superadmin')")).rows.map(x=>x.tg_id))
  send(id,`⏳ <b>${esc(r.action)}</b> — ${esc(r.department)} / ${esc(r.worker_name)}\n${esc(p.name)} — ${so(p.price||0)}`,Markup.inlineKeyboard([[Markup.button.callback('✅ Tasdiqlash',`p:ok:${r.id}`),Markup.button.callback('❌ Rad',`p:no:${r.id}`)]]))},
 async changeResolved(r,ok){send(r.worker_id,`${ok?'✅ Tasdiqlandi':'❌ Rad etildi'}: ${esc(r.product.name)}`)}
});
const notifyCardApplied=async u=>{for(const id of (await q("select tg_id from users where role in ('admin','superadmin')")).rows.map(x=>x.tg_id))
 send(id,`💳 <b>Yangi diskont karta arizasi</b>\n👤 ${esc(u.fullName)}\n📞 ${esc(u.phone)}\n📍 ${esc(u.address)}\n🆔 <code>${u.tg_id}</code>\n\nAdmin panel → Kartalar bo'limidan karta raqamini biriktiring.`)};
const notifyCardApproved=async(userId,num)=>{const lg=await userLang(userId);
 send(userId,lg==='ru'?`🎉 <b>Поздравляем!</b> Ваша дисконтная карта TEGEN готова.\n💳 Номер карты: <code>${esc(num)}</code>\n💰 Кешбэк <b>2%</b> будет автоматически начисляться при каждом заказе!`:`🎉 <b>Tabriklaymiz!</b> TEGEN Diskont kartangiz tayyor.\n💳 Karta raqami: <code>${esc(num)}</code>\n💰 Har buyurtmangizda karta raqamingiz yuboriladi va <b>2% keshbek</b> qo'shiladi!`)};
const notifyCardRejected=async userId=>{const lg=await userLang(userId);
 send(userId,lg==='ru'?'❌ Ваша заявка на дисконтную карту отклонена. Вы можете подать заявку повторно в профиле.':'❌ Diskont karta arizangiz rad etildi. Profildan qayta ariza yuborishingiz mumkin.')};
const notifyAutoBlock=async rec=>{for(const id of (await q("select tg_id from users where role in ('admin','superadmin')")).rows.map(x=>x.tg_id))
 send(id,`🛡️ <b>DDoS himoyasi — ID bloklandi!</b>\n👤 ${esc(rec.name||'Noma\'lum')} (<code>${rec.tg_id}</code>)\n⚡ Sabab: ${esc(rec.reason)}\n🌐 IP: ${esc(rec.ip||'—')}\n\nAdmin panel → 🛡️ Xavfsizlik bo'limidan boshqaring.`)};
bot.catch(e=>console.error('bot',e));
if(process.env.BOT_TOKEN&&process.env.WEBAPP_URL)bot.telegram.setChatMenuButton({menuButton:{type:'web_app',text:"🛒 Do'kon",web_app:{url:process.env.WEBAPP_URL}}}).catch(e=>console.error('menu',e.message));
module.exports={bot,notifyCardApplied,notifyCardApproved,notifyCardRejected,notifyAutoBlock,runBroadcast};


