-- Add type and metadata columns to quote_items
alter table public.quote_items 
add column type text check (type in ('material', 'service')) default 'material',
add column metadata jsonb default '{}'::jsonb;
