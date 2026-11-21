require('dotenv').config();const fs=require('fs'),path=require('path'),{q,pool}=require('./db');
async function seed(){const f=path.join(__dirname,'../data/products_seed.csv');if(!fs.existsSync(f))return;
 if(+(await q('select count(*) from products where barcode is not null')).rows[0].count>0)return;
 const rows=fs.readFileSync(f,'utf8').split('\n').slice(1).filter(Boolean).map(l=>l.split(';'));
 for(let i=0;i<rows.length;i+=2000){const b=rows.slice(i,i+2000);
  await q('insert into products(barcode,name,unit,price,stock,category,active) select * from unnest($1::text[],$2::text[],$3::text[],$4::int[],$5::numeric[],$6::text[],$7::boolean[])',[0,1,2,3,4,5,6].map(k=>b.map(r=>k===6?r[6]==='1':r[k])))}
 console.log('seed',rows.length)}
(async()=>{await q(fs.readFileSync(__dirname+'/schema.sql','utf8'));
if(process.env.SUPER_ADMIN_ID)await q("insert into users(tg_id,role) values($1,'superadmin') on conflict(tg_id) do update set role='superadmin'",[process.env.SUPER_ADMIN_ID]);
await seed();console.log('migrate ok');await pool.end()})().catch(e=>{console.error(e);process.exit(1)});
