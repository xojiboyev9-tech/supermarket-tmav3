/* Smart grocery product classifier + Russian->Uzbek name generator + 30 000 so'm minimum for weight products.
   Matches against existing store categories/subcategories first, then canonical supermarket categories. */
const {pool,q,audit}=require('./db');

/* Word-level Russian -> Uzbek grocery dictionary for automatic name_uz generation */
const RU_UZ=[
 [/хлеб\s+формов(ой|ый)/gi,'Qolipli non'],
 [/хлеб/gi,'Non'],[/батон/gi,'Baton'],[/лепешк[аи]/gi,'Patir non'],[/лаваш/gi,'Lavash'],
 [/булочк[аи]/gi,'Bulochka'],[/сухар(и|ики)/gi,'Suxarik'],[/баранк[аи]|сушк[аи]/gi,'Kulcha'],
 [/молоко/gi,'Sut'],[/кефир/gi,'Kefir'],[/сметан[аы]/gi,'Smetana'],[/творог/gi,'Tvorog'],
 [/сливк[иа]/gi,'Qaymoq'],[/каймак/gi,'Qaymoq'],[/ряженк[аи]/gi,'Ryajenka'],[/айран/gi,'Ayron'],
 [/йогурт/gi,'Yogurt'],[/сырок|сырки/gi,'Sirok'],[/брынз[аы]/gi,'Brinza'],
 [/сыр\s+плавлен(ый|ный)/gi,'Eritilgan pishloq'],[/сыр/gi,'Pishloq'],
 [/масло\s+сливочн(ое|ый)/gi,"Saryog'"],[/маргарин/gi,'Margarin'],[/спред/gi,'Spred'],
 [/масло\s+подсолнечн(ое|ый)/gi,"Kungaboqar yog'i"],[/масло\s+растительн(ое|ый)/gi,"O'simlik yog'i"],
 [/масло\s+оливков(ое|ый)/gi,"Zaytun yog'i"],[/масло\s+хлопков(ое|ый)/gi,"Paxta yog'i"],
 [/яйц(о|а)/gi,'Tuxum'],
 [/говядин[аы]/gi,"Mol go'shti"],[/баранин[аы]/gi,"Qo'y go'shti"],[/фарш/gi,'Qiyma'],
 [/куриц[аы]|курин(ый|ое|ая|ые)|цыпл(енок|ёнок|ята)/gi,"Tovuq go'shti"],
 [/окорочк[аи]/gi,'Tovuq soni'],[/крылышк[иа]/gi,'Tovuq qanoti'],[/голень/gi,'Tovuq boldiri'],[/грудк[аи]|филе/gi,'File'],
 [/индейк[аи]/gi,"Kurka go'shti"],
 [/колбас[аы]\s+копчен(ая|ые)|п\/к|в\/к/gi,'Dudlangan kolbasa'],
 [/колбас[аы]\s+варен(ая|ые)/gi,'Qaynatilgan kolbasa'],
 [/колбас[аы]/gi,'Kolbasa'],[/сосиск[иа]/gi,'Sosiska'],[/сардельк[иа]/gi,'Sardelka'],
 [/казы/gi,'Qazi'],[/деликатес/gi,'Delikates'],[/ветчин[аы]/gi,'Vetchina'],
 [/рыб[аы]/gi,'Baliq'],[/сельд[ьи]|селедк[аи]/gi,'Seld baliq'],[/скумбри[яи]/gi,'Skumbriya'],
 [/семг[аи]|форел[ьи]|лосос[ьи]/gi,'Qizil baliq'],[/шпрот[ыа]/gi,'Shprot'],[/тунец/gi,'Tunes'],[/икр[аы]/gi,'Ikra'],
 [/пельмен[ией]/gi,'Chuchvara'],[/вареник[иов]/gi,'Vareniki'],[/манты/gi,'Manti'],
 [/котлет[ыа]/gi,'Kotlet'],[/наггетс[ыов]/gi,'Naggetslar'],[/тефтел[ией]/gi,'Teftel'],
 [/слоен(ое|ый)\s+тесто|тесто/gi,'Xamir'],[/блин(ы|чики)/gi,'Blinchik'],
 [/морожен(ое|ый)/gi,'Muzqaymoq'],
 [/яблок[иоа]/gi,'Olma'],[/банан[ыа]?/gi,'Banan'],[/апельсин[ыа]?/gi,'Apelsin'],
 [/мандарин[ыа]?/gi,'Mandarin'],[/лимон[ыа]?/gi,'Limon'],[/груш[аи]/gi,'Nok'],
 [/виноград/gi,'Uzum'],[/гранат[ыа]?/gi,'Anor'],[/персик[иа]?/gi,'Shaftoli'],
 [/абрикос[ыа]?/gi,"O'rik"],[/слив[аы]/gi,'Olxoʻri'],[/клубник[аи]/gi,'Qulupnay'],
 [/черешн[яи]/gi,'Gilos'],[/вишн[яи]/gi,'Olcha'],[/киви/gi,'Kivi'],[/ананас[ыа]?/gi,'Ananas'],
 [/манго/gi,'Mango'],[/арбуз[ыа]?/gi,'Tarvuz'],[/дын[яи]/gi,'Qovun'],[/хурм[аы]/gi,'Xurmo'],
 [/финик[иа]?/gi,'Xurmo (finik)'],[/инжир/gi,'Anjir'],
 [/картофел[ья]|картошк[аи]/gi,'Kartoshka'],[/лук/gi,'Piyoz'],[/морков[ьи]|морковь/gi,'Sabzi'],
 [/помидор[ыа]?|томат[ыа]?/gi,'Pomidor'],[/огур(ец|цы)/gi,'Bodring'],
 [/капуст[аы]/gi,'Karam'],[/чеснок/gi,'Sarimsoq'],[/свекл[аы]/gi,'Lavlagi'],
 [/редьк[аи]|редис/gi,"Turp"],[/баклажан[ыа]?/gi,'Baqlajon'],[/кабач(ок|ки)/gi,'Kabachki'],
 [/перец\s+болгарск(ий|ого)/gi,"Bulgor qalampiri"],[/перец/gi,'Qalampir'],
 [/тыкв[аы]/gi,'Qovoq'],[/кукуруз[аы]/gi,"Makkajo'xori"],[/гриб[ыов]?|шампиньон[ыов]?/gi,"Qo'ziqorin"],
 [/зелень/gi,"Ko'kat"],[/укроп/gi,'Ukrop'],[/петрушк[аи]/gi,'Petrushka'],[/кинз[аы]/gi,'Kashnich'],
 [/салат/gi,'Salat bargi'],
 [/грецк(ий|ого)\s+орех|орех[иа]?/gi,"Yong'oq"],[/миндал[ья]/gi,'Bodom'],
 [/фисташк[иа]/gi,'Pista'],[/арахис/gi,'Yeryongʻoq'],[/семечк[иа]/gi,'Pista (semechka)'],
 [/изюм/gi,'Mayiz'],[/кураг[аи]/gi,'Turshak'],[/чернослив/gi,'Quritilgan olxoʻri'],[/сухофрукт[ыов]/gi,'Quruq meva'],
 [/мук[аи]/gi,'Un'],[/сахар/gi,'Shakar'],[/соль/gi,'Tuz'],[/рис/gi,'Guruch'],
 [/гречк[аи]|гречнев(ая|ой)/gi,'Grechka'],[/горох/gi,"No'xat"],[/фасоль/gi,'Loviya'],
 [/нут/gi,"No'xat (nut)"],[/маш/gi,'Mosh'],[/чечевиц[аы]/gi,'Yasmiq'],
 [/овсян(ые|ка|ое)|геркулес/gi,'Suli yormasi'],[/манн(ая|ка)/gi,'Manniy yormasi'],[/круп[аы]/gi,'Yorma'],
 [/макарон[ыа]?|рожки|спагетти|вермишель|лапш[аи]/gi,'Makaron'],
 [/кетчуп/gi,'Ketchup'],[/майонез/gi,'Mayonez'],[/горчиц[аы]/gi,'Xantal'],
 [/томатн(ая|ой)\s+паст[аы]/gi,'Tomat pastasi'],[/соус/gi,'Sous'],[/уксус/gi,'Sirka'],
 [/приправ[аы]|специ[ия]/gi,'Ziravor'],
 [/консерв[ыа]/gi,'Konserva'],[/зелен(ый|ого)\s+горош(ек|ка)/gi,"Yashil no'xat"],
 [/оливк[иа]|маслин[ыа]/gi,'Zaytun'],[/солень[яе]|огурц[ыов]\s+маринован/gi,'Tuzlama'],
 [/мед|мёд/gi,'Asal'],[/варень[ея]|джем/gi,'Murabbo'],[/сгущен(ка|ное\s+молоко)/gi,'Quyultirilgan sut'],
 [/шоколад/gi,'Shokolad'],[/конфет[ыа]/gi,'Konfet'],[/карамель/gi,'Karamel'],
 [/печень[ея]/gi,'Pechenye'],[/вафл[ией]/gi,'Vafli'],[/пряник[иов]/gi,'Pryanik'],
 [/торт[ыа]?/gi,'Tort'],[/пирожн(ое|ые)/gi,'Pirojniy'],[/рулет/gi,'Rulet'],[/кекс[ыа]?/gi,'Keks'],
 [/круассан[ыа]?/gi,'Kruassan'],[/зефир/gi,'Zefir'],[/мармелад/gi,'Marmelad'],[/халв[аы]/gi,'Holva'],
 [/жвачк[аи]|жеват\.?\s*рез/gi,'Saqich'],[/батончик/gi,'Batonchik'],
 [/чипс[ыов]/gi,'Chips'],[/попкорн/gi,'Popkorn'],[/крекер/gi,'Kreker'],[/снек[иов]?/gi,'Snek'],
 [/вод[аы]\s+газ(ированная)?/gi,'Gazlangan suv'],[/вод[аы]\s+б\/г|вод[аы]\s+негаз/gi,'Gazsiz suv'],
 [/вод[аы]/gi,'Suv'],[/сок/gi,'Sharbat'],[/нектар/gi,'Nektar'],
 [/напиток/gi,'Ichimlik'],[/лимонад/gi,'Limonad'],[/энергетик|энерг\.\s*нап/gi,'Energetik ichimlik'],
 [/квас/gi,'Kvas'],[/холодн(ый|ого)\s+чай/gi,'Yaxna choy'],
 [/чай\s+черн(ый|ого)/gi,'Qora choy'],[/чай\s+зелен(ый|ого)/gi,"Ko'k choy"],[/чай/gi,'Choy'],
 [/кофе/gi,'Qahva'],[/какао/gi,'Kakao'],
 [/порошок\s+стиральн(ый|ого)|стир\.?\s*пор/gi,'Kir yuvish kukuni'],
 [/гель\s+для\s+стирки/gi,'Kir yuvish geli'],[/кондиционер\s+для\s+белья/gi,'Kir yumshatgich'],
 [/средство\s+для\s+мытья\s+посуды|для\s+посуды/gi,'Idish yuvish vositasi'],
 [/мыло\s+жидк(ое|ого)/gi,'Suyuq sovun'],[/мыло\s+хоз(яйственное)?/gi,'Kir sovun'],[/мыло/gi,'Sovun'],
 [/шампунь/gi,'Shampun'],[/бальзам/gi,'Balzam'],[/гель\s+для\s+душа/gi,'Dush geli'],
 [/зубн(ая|ой)\s+паст[аы]/gi,'Tish pastasi'],[/зубн(ая|ой)\s+щетк[аи]/gi,"Tish cho'tkasi"],
 [/туалетн(ая|ой)\s+бумаг[аи]/gi,"Hojatxona qog'ozi"],[/салфетк[иа]/gi,'Salfetka'],
 [/влажн(ые|ых)\s+салфетк[иа]/gi,'Nam salfetka'],[/бумажн(ые|ое)\s+полотенц[ае]/gi,"Qog'oz sochiq"],
 [/подгузник[иов]|памперс[ыов]/gi,'Taglik (pampers)'],[/прокладк[иа]/gi,'Prokladka'],
 [/дезодорант|антиперспирант/gi,'Dezodorant'],[/крем/gi,'Krem'],
 [/бритв[аы]|станок/gi,'Ustara'],[/ватн(ые|ых)\s+диск[иов]/gi,'Paxta disklari'],
 [/губк[аи]/gi,'Gubka'],[/пакет[ыов]?|мешк[иов]\s+для\s+мусора/gi,'Chiqindi paketi'],
 [/фольг[аи]/gi,'Folga'],[/пергамент/gi,'Pergament'],
 [/батарейк[иа]/gi,'Batareyka'],[/лампочк[аи]|лампа/gi,'Lampochka'],
 [/корм\s+для\s+кош(ек|ки)/gi,'Mushuklar ozuqasi'],[/корм\s+для\s+собак/gi,'Itlar ozuqasi'],
 [/сигарет[ыа]/gi,'Sigaret'],[/пиво/gi,'Pivo'],[/вино/gi,'Vino'],[/водк[аи]/gi,'Aroq'],[/коньяк/gi,'Konyak'],
 [/\bвес(ов(ой|ые|ая))?\b/gi,'(kg)'],
 [/\b(\d+(?:[.,]\d+)?)\s*гр\.?\b/gi,'$1 g'],
 [/\b(\d+(?:[.,]\d+)?)\s*кг\.?\b/gi,'$1 kg'],
 [/\b(\d+(?:[.,]\d+)?)\s*мл\.?\b/gi,'$1 ml'],
 [/\b(\d+(?:[.,]\d+)?)\s*л\.?\b/gi,'$1 l'],
 [/\b(\d+)\s*шт\.?\b/gi,'$1 dona']
];

const hasCyr=s=>/[А-Яа-яЁё]/.test(String(s||''));

function toUzName(name){
 const raw=String(name||'').trim();
 if(!raw||!hasCyr(raw))return null;
 let s=raw;
 for(const [rx,rep] of RU_UZ)s=s.replace(rx,rep);
 s=s.replace(/\s{2,}/g,' ').trim();
 if(s===raw)return null;
 return s.charAt(0).toUpperCase()+s.slice(1);
}

/* Classification rules ordered from most specific to general.
   Each rule: { rootCandidates, subCandidates, rx, unitHint } */
const RULES=[
 // Meat & Sausages
 {roots:["Go'sht va kolbasa","Go'sht, parranda va baliq"],subs:["Kolbasa va sosiskalar","Kolbasa","Sosiska","Kolbasa mahsulotlari"],rx:/(\bколбас|\bсосиск|\bсардель|\bветчин|\bсалями|\bсервелат|\bказы|\bбастурм|\bкопчен|\bделикатес\s+мяс|\bsherdor\b|\brozmetov\b|\basl\s+baraka\b|\bto'xtaniyoz|\bpromeat\b)/i},
 {roots:["Go'sht va kolbasa","Go'sht, parranda va baliq"],subs:["Baliq va dengiz mahsulotlari","Baliq","Baliqli gazaklar"],rx:/(\bрыб[аы]|\bсельд|\bселедк|\bскумбри|\bсемг|\bфорел|\bлосос|\bшпрот|\bтунец|\bкильк|\bсард|\bкраб|\bкреветк|\bикр[аы]|\bbaliq\b)/i},
 {roots:["Go'sht va kolbasa","Go'sht, parranda va baliq"],subs:["Go'sht va parranda","Go'sht","Tovuq va parranda","Parranda"],rx:/(\bговядин|\bбаранин|\bфарш|\bкуриц|\bкурин|\bцыпл|\bокорочк|\bкрылышк|\bголень|\bгрудк|\bиндейк|\bмясо\b|\bgo'sht|\btovuq|\bqiyma)/i},

 // Dairy & Eggs
 {roots:["Sut mahsulotlari"],subs:["Pishloq","Pishloqlar","Сыры"],rx:/(\bсыр\b|\bсыр\s+(?!ок)|\bбрынз|\bмоцарелл|\bгауда|\bчеддер|\bпармезан|\bфета|\bсулугуни|\bpishloq\b|\bhochland\b|\bпрезидент\b.*сыр)/i},
 {roots:["Sut mahsulotlari"],subs:["Yogurt va siroklar","Yogurt","Siroklar","Йогурт и сыр"],rx:/(\bйогурт|\bсырок|\bсырки|\bданиссимо|\bактивиа|\bрастишк|\bчудо\b.*(йогурт|творож|десерт)|\byogurt\b|\bsirok\b)/i},
 {roots:["Sut mahsulotlari"],subs:["Tvorog, smetana va kefir","Kefir va smetana","Tvorog","Smetana","Kefir","Творог, сметана и кефир"],rx:/(\bтворог|\bсметан|\bкефир|\bряженк|\bайран|\bкатык|\bсузьм|\btvorog|\bsmetana|\bkefir|\bayron|\bqatiq|\bsuzma)/i},
 {roots:["Sut mahsulotlari"],subs:["Sut, saryog' va tuxum","Sut","Saryog'","Tuxum","Молоко, масло и яйца"],rx:/(\bмолок|\bсливк|\bкаймак|\bмасло\s+сливоч|\bмаргарин|\bспред|\bяйц|\bсгущен|\bsut\b|\bqaymoq|\bsaryog|\btuxum)/i},

 // Fruits, Vegetables, Greens, Nuts
 {roots:["Meva-Sabzavot","Meva-sabzavot","Barra Ko‘katlar"],subs:["Mevalar","Meva","Ho'l mevalar","Фрукты"],rx:/(\bяблок|\bбанан|\bапельсин|\bмандарин|\bлимон|\bгруш[аи]|\bвиноград|\bгранат|\bперсик|\bабрикос|\bслив[аы]|\bклубник|\bчерешн|\bвишн|\bкиви|\bананас|\bманго|\bарбуз|\bдын[яи]|\bхурм[аы]|\bгрейпфрут|\bавокадо|\bolma\b|\bbanan\b|\bnok\b|\buzum\b|\banor\b|\bshaftoli|\bapelsin|\bmandarin|\blimon\b|\btarvuz|\bqovun)/i},
 {roots:["Meva-Sabzavot","Meva-sabzavot","Barra Ko‘katlar"],subs:["Quruq mevalar va yong'oqlar","Quruq mevalar","Yong'oqlar"],rx:/(\bизюм|\bкураг|\bчернослив|\bфиник|\bинжир|\bсухофрукт|\bорех|\bминдал|\bфисташк|\bкешью|\bфундук|\bарахис\s+вес|\bmayiz\b|\bturshak|\byong'oq|\bbodom\b|\bpista\b)/i},
 {roots:["Barra Ko‘katlar","Meva-Sabzavot","Meva-sabzavot"],subs:["Ko'katlar","Barra ko'katlar","Зелень"],rx:/(\bзелень|\bукроп|\bпетрушк|\bкинз|\bбазилик|\bшпинат|\bсалат\s+лист|\bруккол|\bko'kat|\bukrop|\bkashnich|\brayhon)/i},
 {roots:["Meva-Sabzavot","Meva-sabzavot"],subs:["Sabzavotlar","Sabzavot","Овощи"],rx:/(\bкартофел|\bкартошк|\bлук\b|\bморков|\bпомидор|\bтомат(?!.*паст|\s*сок)|\bогур(ец|цы)(?!.*марин|\s*конс)|\bкапуст|\bчеснок|\bсвекл|\bредьк|\bредис|\bбаклажан|\bкабач|\bперец\s+(болгар|сладк|остр|чили)|\bтыкв|\bгриб|\bшампиньон|\bkartoshka|\bpiyoz\b|\bsabzi\b|\bpomidor|\bbodring|\bkaram\b|\bsarimsoq|\blavlagi|\bbaqlajon|\bqalampir)/i},

 // Bakery & Pastry
 {roots:["Non mahsulotlari"],subs:["Pishiriqlar","Десерты","Bulochka va pishiriqlar"],rx:/(\bбулочк|\bкруассан|\bслойк|\bпирожк|\bсамса|\bкекс|\bрулет\s+бисквит|\bpishiriq|\bbulochka|\bkruassan)/i},
 {roots:["Non mahsulotlari"],subs:["Non Maxsulotlari","Non","Хлебобулочные изделия"],rx:/(\bхлеб|\bбатон|\bлепешк|\bлаваш|\bсухар|\bбаранк|\bсушк[аи]|\bлаваш|\bnon\b|\bpatir\b|\blavash)/i},

 // Frozen & Semi-finished & Ice cream
 {roots:["Yarim tayyor mahsulotlar","Muzqaymoqlar","Taom mahsulotlari"],subs:["Muzqaymoqlar","Muzqaymoq"],rx:/(\bморожен|\bпломбир|\bэскимо|\bmuzqaymoq|\bimkon\s+ice|\bice\s*cream)/i},
 {roots:["Yarim tayyor mahsulotlar","Taom mahsulotlari"],subs:["Yarim tayyor mahsulotlar","Chuchvara va manti","Muzlatilgan mahsulotlar"],rx:/(\bпельмен|\bвареник|\bманты|\bкотлет|\bнаггетс|\bтефтел|\bслоен.*тесто|\bтесто\s+слоен|\bблинчик|\bchuchvara|\bmanti\b)/i},

 // Sweets & Snacks
 {roots:["Yoqimli sneklar","Shirinliklar"],subs:["Chips va suxariklar","Sneklar","Chips va sneklar"],rx:/(\bчипс|\blays\b|\bpringles\b|\bчестер|\bкириешк|\bфлинт|\bпопкорн|\bсемечк|\bкурут|\bкрэкер|\bкрекер|\bchips|\bsnek|\bsemechka|\bqurut)/i},
 {roots:["Shirinliklar"],subs:["Shokolad va batonchiklar","Shokolad"],rx:/(\bшоколад|\bбатончик|\bsnickers|\bmars\b|\btwix\b|\bbounty\b|\bmilka\b|\balpen\s*gold|\bkit\s*kat|\bкиндер|\bkinder\b|\bnutella\b|\bshokolad)/i},
 {roots:["Shirinliklar"],subs:["Pechenye va vafli","Pechenye","Tort va pirojniy"],rx:/(\bпечень|\bвафл|\bпряник|\bпирожн|\bторт|\bбисквит|\bчоко\s*пай|\bchoco\s*pie|\boreo\b|\bбарни|\bpechenye|\bvafli)/i},
 {roots:["Shirinliklar"],subs:["Konfet va shirinliklar","Konfetlar","Shirinliklar"],rx:/(\bконфет|\bкарамел|\bледенц|\bмармелад|\bзефир|\bхалв[аы]|\bпастил|\bрахат|\bжвачк|\bжеват|\borbit\b|\bdirol\b|\bmentos\b|\bskittles\b|\bharibo\b|\bkonfet|\bholva|\bsaqich)/i},

 // Drinks, Tea & Coffee
 {roots:["Ichimliklar"],subs:["Choy va qahva","Choy","Qahva"],rx:/(\bчай\b|\bкофе\b|\bкакао\b|\bnescafe\b|\bjacobs\b|\bmaccoffee\b|\blipton\b|\bahmad\b|\bgreenfield\b|\btess\b|\bпиала|\bchoy\b|\bqahva)/i},
 {roots:["Ichimliklar"],subs:["Suv","Mineral suv"],rx:/(\bвод[аы]\b|\bhydrolife\b|\bnestle\s+water|\bbon\s*aqua|\bаква\s*минерале|\bборжоми|\bessentuki|\bchortoq|\bsuv\b)/i},
 {roots:["Ichimliklar"],subs:["Sharbat va nektarlar","Sharbatlar"],rx:/(\bсок\b|\bнектар|\bсочн(ая|ый)\s+долин|\bdiko\b|\bdena\b|\bbliss\b|\bдобрый\b|\brich\b|\bsharbat)/i},
 {roots:["Ichimliklar"],subs:["Gazli ichimliklar","Salqin ichimliklar","Energetiklar"],rx:/(\bнапиток|\bлимонад|\bкола\b|\bcoca[\s-]*cola|\bpepsi\b|\bfanta\b|\bsprite\b|\b7\s*up|\bmirinda\b|\brc\s*cola|\bэнергет|\bflash\b|\badrenaline\b|\bred\s*bull|\bgorilla\b|\bквас|\bмохито|\bichimlik)/i},

 // Grocery / Bakaleya / Taom mahsulotlari
 {roots:["Bakaleya","Taom mahsulotlari"],subs:["Yog'lar","O'simlik yog'i"],rx:/(\bмасло\s+(подсолн|растит|оливк|хлопк|кукуруз)|\bолейна|\bзолотая\s+семечка|\bслобода|\byog'|\byogʻ)/i},
 {roots:["Bakaleya","Taom mahsulotlari"],subs:["Makaron va lapsha","Makaron"],rx:/(\bмакарон|\bспагетти|\bрожки|\bвермишел|\bлапш[аи]|\bролтон|\brollton|\bдоширак|\bбиг\s*бон|\bmakfa\b|\bmakaron)/i},
 {roots:["Bakaleya","Taom mahsulotlari"],subs:["Un, shakar va yormalar","Yormalar","Don mahsulotlari"],rx:/(\bмук[аи]\b|\bсахар|\bрис\b|\bгречк|\bгречнев|\bгорох(?!.*конс|\s*зелен)|\bфасоль(?!.*конс)|\bнут\b|\bмаш\b|\bчечевиц|\bовсян|\bгеркулес|\bманн(ая|ка)|\bкруп[аы]|\bun\b|\bshakar|\bguruch|\bgrechka|\byorma)/i},
 {roots:["Bakaleya","Taom mahsulotlari"],subs:["Sous, ketchup va ziravorlar","Sous va ziravorlar","Konservalar"],rx:/(\bкетчуп|\bмайонез|\bгорчиц|\bтоматн.*паст|\bсоус|\bуксус|\bсоль\b|\bприправ|\bспеци|\bконсерв|\bгорош(ек|ка)|\bкукуруз.*конс|\bоливк|\bмаслин|\bварень|\bджем|\bмед\b|\bмёд\b|\bketchup|\bmayonez|\bsous\b|\btuz\b|\bziravor)/i},

 // Household & Personal care
 {roots:["Maishiy kimyo","Kundalik Ehtiyoj"],subs:["Shaxsiy gigiyena","Gigiyena"],rx:/(\bшампун|\bбальзам|\bгель\s+для\s+душ|\bмыло(?!\s*хоз)|\bзубн(ая|ой)|\bпаст[аы]\s+зуб|\b2080\b|\bcolgate\b|\bblend[\s-]*a[\s-]*med|\bдезодорант|\bантиперспирант|\brexona\b|\bnivea\b|\bdove\b|\bкрем\b|\bбритв|\bgillette\b|\bпрокладк|\balways\b|\bkotex\b|\bподгузник|\bпамперс|\bpampers\b|\bhuggies\b|\bватн|\bshampun|\bsovun|\btish\s+pasta)/i},
 {roots:["Maishiy kimyo","Kundalik Ehtiyoj"],subs:["Qog'oz va salfetkalar","Xo'jalik mollari"],rx:/(\bтуалетн.*бумаг|\bсалфетк|\bбумажн.*полотен|\bфольг|\bпергамент|\bпакет|\bмешк.*мусор|\bгубк|\bбатарейк|\bлампочк|\bsalfetka)/i},
 {roots:["Maishiy kimyo","Kundalik Ehtiyoj"],subs:["Kir va idish yuvish","Maishiy kimyo"],rx:/(\bпорошок|\bариэль|\bariel\b|\btide\b|\bперсил|\bpersil\b|\bмиф\b|\bгель\s+для\s+стирк|\bкондиционер\s+для\s+белья|\bvernel\b|\blenor\b|\bдля\s+(мытья\s+)?посуд|\bfairy\b|\bфейри|\baos\b|\bмыло\s+хоз|\bбелизн|\bдоместос|\bdomestos\b|\bчистящ|\bkir\s+yuvish)/i}
];

/* Resolve the best matching category name that actually exists in the store DB (or return a clean category to create). */
function pickCategory(name,cats){
 const s=String(name||'').trim();
 if(!s)return null;
 const byLower=new Map();
 const subsByParent=new Map();
 for(const c of cats){
  byLower.set(c.name.toLowerCase(),c);
  if(c.name_ru)byLower.set(c.name_ru.toLowerCase(),c);
  if(c.parent){
   if(!subsByParent.has(c.parent))subsByParent.set(c.parent,[]);
   subsByParent.get(c.parent).push(c);
  }
 }
 for(const rule of RULES){
  if(!rule.rx.test(s))continue;
  // 1) Look for an exact existing subcategory name
  for(const sub of rule.subs){
   const hit=byLower.get(sub.toLowerCase());
   if(hit)return {category:hit.name,parent:hit.parent||null,created:false};
  }
  // 2) Find matching existing root category
  let rootCat=null;
  for(const r of rule.roots){
   const hit=byLower.get(r.toLowerCase());
   if(hit){rootCat=hit;break}
  }
  if(rootCat){
   const kids=subsByParent.get(rootCat.name)||[];
   // Try fuzzy match among existing children of this root
   for(const sub of rule.subs){
    const w=sub.toLowerCase().split(/\s+/)[0];
    const kHit=kids.find(k=>k.name.toLowerCase().includes(w)||(k.name_ru||'').toLowerCase().includes(w));
    if(kHit)return {category:kHit.name,parent:rootCat.name,created:false};
   }
   // If root has a single child or we can create the canonical first subcategory under this root:
   return {category:rule.subs[0],parent:rootCat.name,createSub:true};
  }
  return {category:rule.subs[0],parent:rule.roots[0],createRoot:true,createSub:true};
 }
 return null;
}

/* Detect if a product is sold by weight (kg) from its unit or name */
function isWeightProduct(p){
 if(p.unit==='weight')return true;
 const n=String(p.name||'');
 return /(^|[\s.,(\/])(вес|весов|весовой|кг|kg)\.?$/i.test(n)||/\bвес(ов(ой|ые|ая))?\b/i.test(n);
}

/* Run smart classification + UZ translation + 30 000 so'm minimum for weight products across active & needs_setup products */
async function autoOrganize(actorId,opts={}){
 const minWeightSum=Math.max(1000,Math.round(Number(opts.minWeightSum)||30000));
 const onlyUnassigned=opts.onlyUnassigned===true; // false = re-check all active + needs_setup products
 const activateSetup=opts.activateSetup===true;
 const cats=(await q('select * from categories order by sort,id')).rows;
 const catNames=new Set(cats.map(c=>c.name));
 const rootSet=new Set(cats.filter(c=>!c.parent).map(c=>c.name));
 const prods=(await q('select id,name,name_uz,unit,price,category,min_sum,min_grams,active,needs_setup from products where active or needs_setup order by id')).rows;

 let catMoved=0,uzFilled=0,weightUpdated=0,subCreated=0,setupCleared=0;
 const byCatCount={};
 const cl=await pool.connect();
 try{
  await cl.query('begin');
  const ensureCat=async(name,parent)=>{
   if(catNames.has(name))return;
   const mx=(await cl.query("select coalesce(max(sort),0)::int m from categories where coalesce(parent,'')=coalesce($1,'')",[parent||null])).rows[0].m;
   await cl.query('insert into categories(name,parent,sort) values($1,$2,$3) on conflict(name) do nothing',[name,parent||null,mx+1]);
   catNames.add(name);
   cats.push({name,parent:parent||null,sort:mx+1});
   subCreated++;
  };

  for(const p of prods){
   let nextCat=p.category;
   let nextUz=p.name_uz;
   let nextUnit=p.unit;
   let nextMinSum=Number(p.min_sum)||0;
   let nextSetup=p.needs_setup;
   let nextActive=p.active;

   // 1) Category classification
   const curIsGeneric=!p.category||p.category==='Boshqa'||rootSet.has(p.category)||p.needs_setup;
   if(!onlyUnassigned||curIsGeneric){
    const match=pickCategory(p.name,cats);
    if(match){
     if(match.createRoot&&match.parent&&!catNames.has(match.parent))await ensureCat(match.parent,null);
     if(match.createSub&&!catNames.has(match.category))await ensureCat(match.category,match.parent||null);
     if(match.category&&match.category!==p.category){
      nextCat=match.category;
      catMoved++;
     }
     if(p.needs_setup){
      nextSetup=false;
      if(activateSetup)nextActive=true;
      setupCleared++;
     }
    }
   }

   // 2) Russian -> Uzbek product name
   if(!nextUz||!String(nextUz).trim()){
    const uz=toUzName(p.name);
    if(uz){nextUz=uz;uzFilled++}
   }

   // 3) Weight products -> unit='weight' and min_sum = 30000 (unless min_grams is set)
   if(isWeightProduct(p)){
    if(nextUnit!=='weight')nextUnit='weight';
    if(!(Number(p.min_grams)>0)&&nextMinSum!==minWeightSum){
     nextMinSum=minWeightSum;
     weightUpdated++;
    }
   }

   if(nextCat!==p.category||nextUz!==p.name_uz||nextUnit!==p.unit||nextMinSum!==(Number(p.min_sum)||0)||nextSetup!==p.needs_setup||nextActive!==p.active){
    await cl.query(
     'update products set category=$1,name_uz=$2,unit=$3,min_sum=$4,needs_setup=$5,active=$6 where id=$7',
     [nextCat,nextUz,nextUnit,nextMinSum,nextSetup,nextActive,p.id]
    );
   }
   byCatCount[nextCat]=(byCatCount[nextCat]||0)+1;
  }

  // Also ensure any inactive weight products have min_sum=minWeightSum so when activated later they already have 30 000 so'm
  const wRes=await cl.query("update products set min_sum=$1 where unit='weight' and coalesce(min_grams,0)=0 and coalesce(min_sum,0)<>$1",[minWeightSum]);
  if(wRes.rowCount>0)weightUpdated+=wRes.rowCount;

  await cl.query('commit');
 }catch(e){await cl.query('rollback');throw e}finally{cl.release()}

 await audit(actorId,'products.auto_organize','products',{scanned:prods.length,catMoved,uzFilled,weightUpdated,subCreated,setupCleared,minWeightSum});
 return {scanned:prods.length,catMoved,uzFilled,weightUpdated,subCreated,setupCleared,minWeightSum,byCatCount};
}

module.exports={autoOrganize,toUzName,pickCategory,isWeightProduct};
