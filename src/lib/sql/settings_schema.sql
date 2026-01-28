-- 1. Company Settings Table
create table public.company_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text,
  document text,
  phone text,
  address text,
  logo text, -- Base64 string for MVP (or URL if bucket used later)
  footer_text text,
  copper_price_per_kg numeric default 75.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id) -- One profile per user
);

-- 2. RLS Policies
-- Enable RLS on all tables
alter table public.company_settings enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

-- Drop existing "allow all" policies if they exist (cleanup)
drop policy if exists "Enable all access for all users" on public.clients;
drop policy if exists "Enable all access for all users" on public.products;
drop policy if exists "Enable all access for all users" on public.quotes;
drop policy if exists "Enable all access for all users" on public.quote_items;

-- Create stricter policies (Users see only their own data)

-- Company Settings
create policy "Users can view own settings" on public.company_settings
  for select using (auth.uid() = user_id);

create policy "Users can insert own settings" on public.company_settings
  for insert with check (auth.uid() = user_id);

create policy "Users can update own settings" on public.company_settings
  for update using (auth.uid() = user_id);

-- Clients
create policy "Users can view own clients" on public.clients
  for select using (auth.uid() = user_id);

create policy "Users can insert own clients" on public.clients
  for insert with check (auth.uid() = user_id);

create policy "Users can update own clients" on public.clients
  for update using (auth.uid() = user_id);

create policy "Users can delete own clients" on public.clients
  for delete using (auth.uid() = user_id);

-- Products
create policy "Users can view own products" on public.products
  for select using (auth.uid() = user_id);

create policy "Users can insert own products" on public.products
  for insert with check (auth.uid() = user_id);

create policy "Users can update own products" on public.products
  for update using (auth.uid() = user_id);

create policy "Users can delete own products" on public.products
  for delete using (auth.uid() = user_id);

-- Quotes
create policy "Users can view own quotes" on public.quotes
  for select using (auth.uid() = user_id);

create policy "Users can insert own quotes" on public.quotes
  for insert with check (auth.uid() = user_id);

create policy "Users can update own quotes" on public.quotes
  for update using (auth.uid() = user_id);

create policy "Users can delete own quotes" on public.quotes
  for delete using (auth.uid() = user_id);

-- Quote Items (Inherit access via quote_id? Or direct ownership?)
-- Simpler to enforce direct ownership check or join.
-- For simplicity in Supabase RLS with joins:
create policy "Users can view own quote items" on public.quote_items
  for select using (
    exists (
      select 1 from public.quotes
      where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
    )
  );

create policy "Users can insert own quote items" on public.quote_items
  for insert with check (
    exists (
      select 1 from public.quotes
      where quotes.id = quote_id
      and quotes.user_id = auth.uid()
    )
  );

create policy "Users can delete own quote items" on public.quote_items
  for delete using (
    exists (
      select 1 from public.quotes
      where quotes.id = quote_items.quote_id
      and quotes.user_id = auth.uid()
    )
  );
