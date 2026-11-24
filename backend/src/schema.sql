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

alter table products add column if not exists name_uz text;
alter table products add column if not exists description text;
alter table products add column if not exists min_grams int default 0;
alter table categories add column if not exists name_ru text;
alter table categories add column if not exists image text;
alter table categories add column if not exists section text;
alter table categories add column if not exists sort int default 0;
alter table banners add column if not exists subtitle text;

alter table order_items add column if not exists sub_product_id int;
alter table order_items add column if not exists sub_name text;
alter table order_items add column if not exists sub_price int;
alter table order_items add column if not exists sub_unit text;
alter table order_items add column if not exists sub_status text;
alter table orders add column if not exists edit_state text;
alter table users add column if not exists lang text default 'uz';
alter table categories add column if not exists parent text;
insert into settings values('animation','{"preset":"none","duration":10}') on conflict do nothing;
alter table bundles add column if not exists title_ru text;
alter table bundles add column if not exists description_ru text;
alter table products add column if not exists sale_price int;
alter table products add column if not exists sale_until timestamptz;
alter table users add column if not exists card_number text;
alter table users add column if not exists card_status text;
alter table users add column if not exists card_full_name text;
alter table users add column if not exists card_phone text;
alter table users add column if not exists card_address text;
alter table users add column if not exists card_applied_at timestamptz;
alter table orders add column if not exists card_number text;
insert into settings values('support','{"username":"","phone":""}') on conflict do nothing;
alter table users add column if not exists can_broadcast boolean default false;
create table if not exists broadcasts(
  id serial primary key,
  sender_id bigint not null,
  sender_name text,
  kind text not null default 'text',
  text text,
  target text not null default 'all',
  total int not null default 0,
  sent int not null default 0,
  failed int not null default 0,
  status text not null default 'sending',
  created_at timestamptz default now(),
  finished_at timestamptz
);

create table if not exists blocked_users(
  tg_id bigint primary key,
  name text,
  reason text not null default 'ddos',
  hits int not null default 0,
  ip text,
  auto boolean not null default true,
  blocked_by bigint,
  blocked_at timestamptz default now(),
  expires_at timestamptz
);
create index if not exists blocked_users_at_idx on blocked_users(blocked_at desc);
create index if not exists orders_user_id_idx on orders(user_id,id desc);
create index if not exists orders_status_idx on orders(status,id desc);
create index if not exists orders_created_idx on orders(created_at desc);
create index if not exists order_items_order_idx on order_items(order_id);
create index if not exists bundle_items_bundle_idx on bundle_items(bundle_id);
create index if not exists audit_at_idx on audit(at desc);
create index if not exists users_card_status_idx on users(card_status) where card_status is not null;
create index if not exists categories_parent_idx on categories(parent);
create index if not exists products_sale_idx on products(sale_until) where active and sale_price is not null;

alter table products add column if not exists min_sum int default 0;
alter table products add column if not exists weight_g int default 0;
alter table products add column if not exists priority smallint default 3;
alter table products add column if not exists family text;
alter table products add column if not exists sales_count int default 0;
alter table products add column if not exists needs_setup boolean default false;
create index if not exists products_rank_idx on products(active,priority asc,sales_count desc,name asc);
create index if not exists products_family_idx on products(family) where family is not null;
create index if not exists products_setup_idx on products(needs_setup) where needs_setup;




