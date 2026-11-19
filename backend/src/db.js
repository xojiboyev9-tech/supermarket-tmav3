// JOYI: backend/src/db.js  (GitHub'da shu yo'l bilan yarating)
const {Pool}=require('pg');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:10});
const q=(t,p)=>pool.query(t,p);
const audit=(actor,action,entity,detail={})=>q('insert into audit(actor,action,entity,detail) values($1,$2,$3,$4)',[actor,action,entity,detail]).catch(console.error);
const getSetting=async k=>(await q('select value from settings where key=$1',[k])).rows[0].value;
const setSetting=(k,v)=>q('insert into settings values($1,$2) on conflict(key) do update set value=$2',[k,v]);
module.exports={pool,q,audit,getSetting,setSetting};
