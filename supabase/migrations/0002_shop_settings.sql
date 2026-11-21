create table if not exists shop_settings (
  id int primary key default 1 check (id = 1),
  shop_name text not null default 'Modern Furniture',
  logo_data_url text,
  address text not null default '123 Main Street, Your City',
  phone text not null default '+00 000 000 000',
  updated_at timestamptz not null default now()
);

insert into shop_settings (id) values (1) on conflict do nothing;
