// JOYI: backend/src/bot.js  (GitHub'da shu yo'l bilan yarating)
const {Telegraf,Markup}=require('telegraf');const {q}=require('./db');const O=require('./orders');
const bot=new Telegraf(process.env.BOT_TOKEN||'0:x');
const esc=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const so=n=>Number(n).toLocaleString('ru-RU')+" so'm";
const STAFF="('operator','admin','superadmin')";
const me=async id=>(await q('select * from users where tg_id=$1',[id])).rows[0];
const isStaff=u=>u&&['operator','admin','superadmin'].includes(u.role);
const staffIds=async()=>(await q(`select tg_id from users where role in ${STAFF}`)).rows.map(r=>r.tg_id);
const send=(id,t,kb)=>bot.telegram.sendMessage(id,t,{parse_mode:'HTML',...(kb||{})}).catch(e=>console.error('send',id,e.message));
const menu=async(ctx,u)=>{await ctx.reply(`Xush kelibsiz! Rol: ${u.role}`,Markup.removeKeyboard());
 return ctx.reply("Do'konni ochish uchun tugmani bosing:",Markup.inlineKeyboard([[Markup.button.webApp("🛒 Do'konni ochish",process.env.WEBAPP_URL)]]))};
bot.start(async ctx=>{const u=await me(ctx.from.id);
 if(u?.phone)return menu(ctx,u);
 ctx.reply(`Assalomu alaykum, ${ctx.from.first_name}! Davom etish uchun telefon raqamingizni yuboring:`,Markup.keyboard([[Markup.button.contactRequest('📱 Telefon raqamni yuborish')]]).resize().oneTime())});
bot.on('contact',async ctx=>{const c=ctx.message.contact;if(c.user_id!==ctx.from.id)return ctx.reply("Faqat o'z raqamingizni yuboring.");
 const n=`${ctx.from.first_name||''} ${ctx.from.last_name||''}`.trim();
 await q("insert into users(tg_id,name,phone) values($1,$2,$3) on conflict(tg_id) do update set phone=$3,name=$2",[ctx.from.id,n,c.phone_number]);
 menu(ctx,await me(ctx.from.id))});
const guard=fn=>async ctx=>{try{await fn(ctx)}catch(e){ctx.answerCbQuery(e.message,{show_alert:true}).catch(()=>{})}};
bot.action(/^o:(accept|prep|ready|done|cancel):(\d+)$/,guard(async ctx=>{const u=await me(ctx.from.id);if(!isStaff(u))return ctx.answerCbQuery("Ruxsat yo'q");
 const st={accept:'accepted',prep:'preparing',ready:'ready',done:'completed',cancel:'cancelled'}[ctx.match[1]];
 await O.setStatus(u.tg_id,Number(ctx.match[2]),st);await ctx.answerCbQuery('✅ '+st)}));
bot.action(/^c:(yes|no):(\d+)$/,guard(async ctx=>{await O.confirm(ctx.from.id,Number(ctx.match[2]),ctx.match[1]==='yes');
 await ctx.editMessageReplyMarkup().catch(()=>{});await ctx.answerCbQuery('Javobingiz qabul qilindi')}));
bot.action(/^a:(yes|no):(\d+)$/,guard(async ctx=>{await O.ageConfirm(ctx.from.id,Number(ctx.match[2]),ctx.match[1]==='yes');await ctx.editMessageReplyMarkup().catch(()=>{});await ctx.answerCbQuery('Javobingiz qabul qilindi')}));
bot.action(/^p:(ok|no):(\d+)$/,guard(async ctx=>{const u=await me(ctx.from.id);if(!u||!['admin','superadmin'].includes(u.role))return ctx.answerCbQuery("Ruxsat yo'q");
 await O.resolveChange(u.tg_id,Number(ctx.match[2]),ctx.match[1]==='ok');await ctx.editMessageReplyMarkup().catch(()=>{});await ctx.answerCbQuery('Tayyor')}));
const LINK=/(https?:|www\.|t\.me|@\w{4,}|\.(com|uz|ru|org|net)\b)/i;
bot.on(['text','photo'],async ctx=>{const u=await me(ctx.from.id);
 if(isStaff(u)){const r=ctx.message.reply_to_message;if(!r)return;
  const m=(await q('select user_id from support_map where chat_id=$1 and msg_id=$2',[ctx.chat.id,r.message_id])).rows[0];if(!m)return;
  await bot.telegram.copyMessage(m.user_id,ctx.chat.id,ctx.message.message_id);return ctx.reply('✅ Yuborildi')}
 if(!u?.phone)return ctx.reply('Avval /start bosib telefon raqamingizni yuboring.');
 if(ctx.message.text&&LINK.test(ctx.message.text)||ctx.message.caption&&LINK.test(ctx.message.caption))return ctx.reply("Havola yuborish mumkin emas.");
 for(const id of await staffIds()){const h=await bot.telegram.sendMessage(id,`📩 <b>${esc(u.name)}</b> | ${esc(u.phone)}\n(Javob berish uchun shu xabarga reply qiling)`,{parse_mode:'HTML'}).catch(()=>null);
  const c=await bot.telegram.copyMessage(id,ctx.chat.id,ctx.message.message_id).catch(()=>null);
  for(const x of [h,c])if(x)await q('insert into support_map values($1,$2,$3) on conflict do nothing',[id,x.message_id||x.message_id,u.tg_id])}
 ctx.reply('✅ Xabaringiz adminga yuborildi.')});
const orderKb=o=>Markup.inlineKeyboard([[Markup.button.callback('✅ Qabul',`o:accept:${o.id}`),Markup.button.callback('⚙️ Yig‘ilmoqda',`o:prep:${o.id}`)],[Markup.button.callback('🛍 Tayyor',`o:ready:${o.id}`),Markup.button.callback('✔️ Topshirildi',`o:done:${o.id}`)],[Markup.button.callback('❌ Bekor',`o:cancel:${o.id}`)]]);
O.setNotifier({
 async ageCheck(o,age){send(o.user_id,`🔞 Buyurtma #${o.id} tarkibida ${age} yoshdan oshganlarga sotiladigan mahsulot bor.\nSiz ${age} yoshdan oshganingizni tasdiqlaysizmi?`,Markup.inlineKeyboard([[Markup.button.callback(`✅ Ha, ${age} dan oshganman`,`a:yes:${o.id}`),Markup.button.callback("❌ Yo'q",`a:no:${o.id}`)]]))},
 async newOrder(o,lines){const t=`🆕 <b>Buyurtma #${o.id}</b> (kod ${o.code})\n👤 ${esc(o.name)} ${esc(o.phone)}\n${o.type==='delivery'?'🚚 '+esc(o.address):'🏃 Olib ketish'}\n\n`+lines.map(l=>`• ${esc(l.name)} — ${l.unit==='weight'?l.qty+' kg':l.qty+' dona'} = ${so(l.sum)}`).join('\n')+`\n\n💰 <b>${so(o.total)}</b>`;
  for(const id of await staffIds())send(id,t,orderKb(o))},
 async statusChanged(o){const m={accepted:'qabul qilindi',preparing:"yig'ilmoqda",ready:'TAYYOR — olib ketishingiz mumkin',completed:'topshirildi',cancelled:'bekor qilindi'}[o.status];
  send(o.user_id,`Buyurtma #${o.id} ${m}.${o.status==='ready'?` Kod: <b>${o.code}</b>`:''}`)},
 async confirmRequest(o,items,sub){const t=items.filter(i=>i.unit==='weight'&&i.actual_sum!==i.ordered_sum&&i.actual_sum!=null).map(i=>`• ${esc(i.name)}: ${so(i.ordered_sum)} → <b>${so(i.actual_sum)}</b>`).join('\n');
  send(o.user_id,`⚖️ Buyurtma #${o.id}: tortishda narx o'zgardi.\n${t}\n\nYangi mahsulotlar jami: <b>${so(sub)}</b>\nRozimisiz?`,Markup.inlineKeyboard([[Markup.button.callback('✅ Roziman',`c:yes:${o.id}`),Markup.button.callback('❌ Bekor qilish',`c:no:${o.id}`)]]))},
 async confirmDone(o,yes){for(const id of await staffIds())send(id,`Buyurtma #${o.id}: mijoz yangi narxga ${yes?'ROZI bo‘ldi ✅':'ROZI BO‘LMADI ❌ (bekor)'}`)},
 async pending(r){const p=r.product;for(const id of (await q("select tg_id from users where role in ('admin','superadmin')")).rows.map(x=>x.tg_id))
  send(id,`⏳ <b>${esc(r.action)}</b> — ${esc(r.department)} / ${esc(r.worker_name)}\n${esc(p.name)} — ${so(p.price||0)}`,Markup.inlineKeyboard([[Markup.button.callback('✅ Tasdiqlash',`p:ok:${r.id}`),Markup.button.callback('❌ Rad',`p:no:${r.id}`)]]))},
 async changeResolved(r,ok){send(r.worker_id,`${ok?'✅ Tasdiqlandi':'❌ Rad etildi'}: ${esc(r.product.name)}`)}
});
bot.catch(e=>console.error('bot',e));
if(process.env.BOT_TOKEN&&process.env.WEBAPP_URL)bot.telegram.setChatMenuButton({menuButton:{type:'web_app',text:"🛒 Do'kon",web_app:{url:process.env.WEBAPP_URL}}}).catch(e=>console.error('menu',e.message));
module.exports={bot};
                   
