-- JOYI: backend/src/schema.sql  (GitHub'da shu yo'l bilan yarating)
create table if not exists users(tg_id bigint primary key,name text,phone text,role text not null default 'user',department text,created_at timestamptz default now());
create table if not exists categories(id serial primary key,name text unique not null);
create table if not exists products(id serial primary key,category text not null,name text not null,unit text not null default 'piece' check(unit in('piece','weight')),price int not null check(price>0),image text,active boolean default true,stock numeric);
create table if not exists pending_changes(id serial primary key,action text not null,product jsonb not null,worker_id bigint,worker_name text,department text,created_at timestamptz default now());
create table if not exists orders(id serial primary key,code text not null,user_id bigint not null,name text,phone text,type text not null default 'pickup',address text,lat double precision,lng double precision,delivery_fee int default 0,subtotal int not null,pending_subtotal int,total int not null,status text not null default 'new',created_at timestamptz default now());
create table if not exists order_items(id serial primary key,order_id int references orders(id) on delete cascade,product_id int,name text,unit text,unit_price int,qty numeric,ordered_sum int,actual_sum int);
create table if not exists settings(key text primary key,value jsonb not null);
create table if not exists audit(id serial primary key,at timestamptz default now(),actor bigint,action text,entity text,detail jsonb);
create table if not exists support_map(chat_id bigint,msg_id int,user_id bigint,primary key(chat_id,msg_id));
insert into settings values('warehouse','{"enabled":false}') on conflict do nothing;
insert into settings values('delivery','{"enabled":false,"store":{"lat":41.3111,"lng":69.2797},"maxKm":15,"baseFee":15000,"rules":[{"minTotal":200000,"maxKm":3,"fee":0},{"minTotal":500000,"maxKm":15,"fee":0}]}') on conflict do nothing;
insert into categories(name) values('Taom mahsulotlari'),('Ichimliklar'),('Sut mahsulotlari'),('Non mahsulotlari'),('Go''sht va kolbasa'),('Meva-sabzavot') on conflict do nothing;
create table if not exists images(id serial primary key,mime text,data bytea,created_at timestamptz default now());

alter table products add column if not exists barcode text;
alter table products add column if not exists age_min int default 0;
create index if not exists products_bc on products(barcode);
create index if not exists products_act_cat on products(active,category);
create table if not exists banners(id serial primary key,image text,title text,link text,sort int default 0,active boolean default true);
create table if not exists bundles(id serial primary key,title text not null,description text,image text,price int not null,active boolean default true,created_at timestamptz default now());
create table if not exists bundle_items(bundle_id int references bundles(id) on delete cascade,product_id int,qty numeric default 1);
create table if not exists videos(id serial primary key,title text,yt_id text not null,active boolean default true,created_at timestamptz default now());
alter table orders add column if not exists age_confirmed boolean;
insert into categories(name) values('Shirinliklar'),('Bakaleya'),('Maishiy kimyo'),('Boshqa') on conflict do nothing;
