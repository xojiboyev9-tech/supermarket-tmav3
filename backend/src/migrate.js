// JOYI: backend/src/migrate.js  (GitHub'da shu yo'l bilan yarating)
require('dotenv').config();const fs=require('fs'),{q,pool}=require('./db');
(async()=>{await q(fs.readFileSync(__dirname+'/schema.sql','utf8'));
if(process.env.SUPER_ADMIN_ID)await q("insert into users(tg_id,role) values($1,'superadmin') on conflict(tg_id) do update set role='superadmin'",[process.env.SUPER_ADMIN_ID]);
console.log('migrate ok');await pool.end()})().catch(e=>{console.error(e);process.exit(1)});
