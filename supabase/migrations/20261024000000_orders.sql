-- Orders for Bracelet By Ammit. Only the server (service role) reads/writes;
-- RLS is on with no policies, so the public/anon key has no access.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  bracelet_slug text not null,
  bracelet_title text not null,
  amount_paise integer not null check (amount_paise > 0),
  wearer_first_name text not null,
  wearer_last_name text not null default '',
  wearer_dob date not null,
  wearer_gender text not null,
  mulank smallint not null,
  bhagyank smallint not null,
  wrist text not null,
  intentions text[] not null default '{}',
  focus text,
  is_gift boolean not null default false,
  gift_note text,
  delivery_name text not null,
  mobile text not null,
  email text,
  address_line1 text not null,
  address_line2 text,
  landmark text,
  city text not null,
  state text not null,
  pincode text not null,
  marketing_opt_in boolean not null default false,
  terms_accepted_at timestamptz not null,
  utm jsonb not null default '{}'::jsonb,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_status_created_idx on public.orders (status, created_at desc);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
