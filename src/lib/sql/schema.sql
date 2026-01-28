-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Clients Table
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  phone text,
  address text,
  email text,
  notes text,
  user_id uuid default auth.uid()
);

-- 2. Products Table (Materials/Services)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  price numeric not null default 0,
  unit text default 'un',
  category text default 'other',
  type text check (type in ('service', 'product')),
  user_id uuid default auth.uid()
);

-- 3. Quotes Table
create table public.quotes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  number serial,
  client_id uuid references public.clients(id),
  client_info jsonb not null, -- Snapshot of client data at time of quote
  status text check (status in ('draft', 'sent', 'approved', 'cancelled')) default 'draft',
  total numeric not null default 0,
  valid_until timestamp with time zone,
  notes text,
  user_id uuid default auth.uid()
);

-- 4. Quote Items Table
create table public.quote_items (
  id uuid default uuid_generate_v4() primary key,
  quote_id uuid references public.quotes(id) on delete cascade not null,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total numeric not null default 0
);

-- Row Level Security (RLS)
-- For now, we enable public access for simplicity, but in production we should restrict this.
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

-- Policies (Allow everything for anon for now - development mode)
create policy "Enable all access for all users" on public.clients for all using (true) with check (true);
create policy "Enable all access for all users" on public.products for all using (true) with check (true);
create policy "Enable all access for all users" on public.quotes for all using (true) with check (true);
create policy "Enable all access for all users" on public.quote_items for all using (true) with check (true);
