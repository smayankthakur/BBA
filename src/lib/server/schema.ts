import "server-only";
import { sql } from "./db";

/**
 * Creates or upgrades every table on first use (idempotent). Runs once per
 * server instance; a failure is retried on the next call.
 */
let ready: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  ready ??= migrate().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

async function migrate() {
  // Orders (checkout)
  await sql`create table if not exists orders (
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
  )`;
  await sql`create index if not exists orders_status_created_idx on orders (status, created_at desc)`;
  await sql`alter table orders add column if not exists staff_notified_at timestamptz`;
  await sql`alter table orders add column if not exists fulfilment_status text not null default 'new'`;
  await sql`alter table orders add column if not exists courier text`;
  await sql`alter table orders add column if not exists tracking_number text`;
  await sql`alter table orders add column if not exists admin_notes text`;
  await sql`alter table orders add column if not exists updated_at timestamptz`;
  await sql`alter table orders add column if not exists coupon_code text`;
  await sql`alter table orders add column if not exists discount_paise integer not null default 0`;

  // Coupons (discount codes)
  await sql`create table if not exists coupons (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    description text not null default '',
    kind text not null check (kind in ('percent', 'flat')),
    value integer not null check (value > 0),
    max_discount_inr integer,
    min_order_inr integer not null default 0,
    starts_at timestamptz,
    ends_at timestamptz,
    usage_limit integer,
    per_customer_limit integer,
    products text[] not null default '{}',
    active boolean not null default true,
    created_by uuid,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;
  await sql`create index if not exists orders_coupon_idx on orders (coupon_code) where coupon_code is not null`;

  // Admin accounts
  await sql`create table if not exists admin_users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    name text not null,
    password_hash text not null,
    role text not null check (role in ('owner', 'admin', 'editor')),
    disabled boolean not null default false,
    created_at timestamptz not null default now(),
    last_login_at timestamptz
  )`;
  await sql`create table if not exists admin_sessions (
    id text primary key,
    user_id uuid not null references admin_users(id) on delete cascade,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    ip text,
    user_agent text
  )`;
  await sql`create index if not exists admin_sessions_user_idx on admin_sessions (user_id)`;
  await sql`create table if not exists admin_invites (
    id text primary key,
    email text not null,
    role text not null check (role in ('admin', 'editor')),
    created_by uuid references admin_users(id) on delete set null,
    expires_at timestamptz not null,
    used_at timestamptz,
    created_at timestamptz not null default now()
  )`;
  await sql`create table if not exists login_attempts (
    key text primary key,
    count integer not null,
    window_start timestamptz not null
  )`;
  await sql`create table if not exists admin_log (
    id bigserial primary key,
    user_id uuid references admin_users(id) on delete set null,
    action text not null,
    target text,
    at timestamptz not null default now()
  )`;

  // Catalogue
  await sql`create table if not exists products (
    id uuid primary key default gen_random_uuid(),
    kind text not null check (kind in ('bracelet', 'gift')),
    slug text not null,
    title text not null,
    blurb text not null default '',
    intro text[] not null default '{}',
    list_a text[] not null default '{}',
    list_b text[] not null default '{}',
    crystals text[] not null default '{}',
    note text,
    price_inr integer not null check (price_inr between 1 and 1000000),
    sort_order integer not null default 0,
    status text not null default 'published' check (status in ('published', 'draft', 'trash')),
    in_list boolean not null default true,
    photos text[] not null default '{}',
    photo_alt text,
    video_id text,
    video_title text,
    visual jsonb not null default '{}'::jsonb,
    seo_title text,
    seo_description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (kind, slug)
  )`;
  await sql`alter table products add column if not exists video_id text`;
  await sql`alter table products add column if not exists video_title text`;
  await sql`create table if not exists media (
    id uuid primary key default gen_random_uuid(),
    url text not null,
    pathname text,
    filename text,
    width integer,
    height integer,
    bytes integer,
    content_type text,
    alt text,
    uploaded_by uuid references admin_users(id) on delete set null,
    created_at timestamptz not null default now()
  )`;

  // Editable page text and site settings (one JSON document per page)
  await sql`create table if not exists site_content (
    id text primary key,
    data jsonb not null,
    updated_at timestamptz not null default now(),
    updated_by uuid references admin_users(id) on delete set null
  )`;
}
