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

/** Bump when the statements below change, so existing databases upgrade once. */
const SCHEMA_VERSION = 7;

async function migrate() {
  // Fast path: an up-to-date database needs one query, not dozens.
  try {
    const v = await sql<{ v: number }>`select v from schema_version limit 1`;
    if ((v[0]?.v ?? 0) >= SCHEMA_VERSION) return;
  } catch {
    // table doesn't exist yet
  }
  await createAll();
  await sql`create table if not exists schema_version (v integer not null)`;
  await sql`delete from schema_version`;
  await sql`insert into schema_version (v) values (${SCHEMA_VERSION})`;
}

async function createAll() {
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

  // Purposes and top-ups (Oct 2026)
  await sql`alter table orders add column if not exists purposes text[] not null default '{}'`;
  await sql`alter table orders add column if not exists upgrade_paise integer not null default 0`;
  await sql`create table if not exists order_upgrades (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references orders(id) on delete cascade,
    razorpay_order_id text not null unique,
    razorpay_payment_id text,
    add_slugs text[] not null,
    add_titles text[] not null,
    amount_paise integer not null,
    status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
    created_at timestamptz not null default now(),
    paid_at timestamptz
  )`;

  // Quick order (Oct 2026): reading details can be added after payment
  await sql`alter table orders add column if not exists order_source text not null default 'reading'`;
  await sql`alter table orders add column if not exists details_at timestamptz`;
  await sql`alter table orders add column if not exists wearer_note text`;
  // Quick order (v7): birth date and numbers can arrive after payment
  await sql`alter table orders alter column wearer_dob drop not null`;
  await sql`alter table orders alter column mulank drop not null`;
  await sql`alter table orders alter column bhagyank drop not null`;

  // Partner programme
  await sql`alter table orders add column if not exists partner_code text`;
  await sql`alter table orders add column if not exists partner_kind text`;
  await sql`alter table orders add column if not exists partner_rate integer`;
  await sql`alter table orders add column if not exists commission_paise integer not null default 0`;
  await sql`create table if not exists partners (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    phone text not null default '',
    email text not null default '',
    kind text not null check (kind in ('percent', 'flat')),
    rate integer not null check (rate >= 0),
    notes text not null default '',
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;
  await sql`create table if not exists partner_clicks (
    id bigserial primary key,
    partner_code text not null,
    visitor text not null,
    day date not null default (now() at time zone 'Asia/Kolkata')::date,
    landing text,
    at timestamptz not null default now(),
    unique (partner_code, visitor, day)
  )`;
  await sql`create table if not exists partner_payouts (
    id uuid primary key default gen_random_uuid(),
    partner_id uuid not null references partners(id) on delete cascade,
    amount_paise integer not null check (amount_paise > 0),
    paid_on date not null,
    reference text not null default '',
    note text not null default '',
    created_by uuid,
    created_at timestamptz not null default now()
  )`;
  await sql`create index if not exists orders_partner_idx on orders (partner_code) where partner_code is not null`;

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
  await sql`alter table products add column if not exists i18n jsonb not null default '{}'::jsonb`;
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
