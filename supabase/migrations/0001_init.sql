-- Modern Furniture — Gift Voucher System schema
-- Single-use, full-value vouchers. No partial redemption.

create type voucher_lifecycle_status as enum ('active', 'redeemed', 'expired');

create table if not exists voucher_batches (
  id uuid primary key default gen_random_uuid(),
  idempotency_key varchar(64) unique,
  expiry_date date not null,
  total_count int not null,
  total_value bigint not null,
  created_at timestamptz not null default now()
);

create table if not exists vouchers (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references voucher_batches(id) on delete set null,
  voucher_code varchar(32) not null unique,
  denomination_amount int not null,
  currency varchar(3) not null default 'LKR',
  status voucher_lifecycle_status not null default 'active',
  expiry_date date not null,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by varchar(64),
  redeemed_location varchar(64),
  constraint check_positive_denomination check (denomination_amount > 0)
);

create index if not exists idx_vouchers_lookup_code on vouchers (voucher_code);
create index if not exists idx_vouchers_batch on vouchers (batch_id);

create table if not exists security_events (
  id uuid primary key default gen_random_uuid(),
  event_type varchar(32) not null,
  detail varchar(255),
  source_ip varchar(64),
  created_at timestamptz not null default now()
);

-- Atomic, race-safe redemption. Returns the row only if it was active.
-- 0 rows back => already redeemed / expired / missing.
create or replace function redeem_voucher(
  p_code varchar,
  p_by varchar,
  p_location varchar
) returns setof vouchers
language sql as $$
  update vouchers
     set status = 'redeemed',
         redeemed_at = now(),
         redeemed_by = p_by,
         redeemed_location = p_location
   where voucher_code = p_code
     and status = 'active'
     and expiry_date >= current_date
  returning *;
$$;
