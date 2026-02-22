-- Recurring Expenses
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  category text not null,
  description text default '',
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly')),
  start_date date not null,
  last_generated date,
  active boolean default true,
  created_at timestamptz default now()
);

-- One-off Expenses
create table if not exists public.oneoff_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  category text not null,
  description text default '',
  date date not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_recurring_expenses_user_id on public.recurring_expenses(user_id);
create index if not exists idx_oneoff_expenses_user_id on public.oneoff_expenses(user_id);

-- Enable RLS
alter table public.recurring_expenses enable row level security;
alter table public.oneoff_expenses enable row level security;

-- Recurring Expenses: full CRUD on own rows
create policy "Users can view own recurring expenses" on public.recurring_expenses
  for select using (auth.uid() = user_id);
create policy "Users can insert own recurring expenses" on public.recurring_expenses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own recurring expenses" on public.recurring_expenses
  for update using (auth.uid() = user_id);
create policy "Users can delete own recurring expenses" on public.recurring_expenses
  for delete using (auth.uid() = user_id);

-- One-off Expenses: full CRUD on own rows
create policy "Users can view own oneoff expenses" on public.oneoff_expenses
  for select using (auth.uid() = user_id);
create policy "Users can insert own oneoff expenses" on public.oneoff_expenses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own oneoff expenses" on public.oneoff_expenses
  for update using (auth.uid() = user_id);
create policy "Users can delete own oneoff expenses" on public.oneoff_expenses
  for delete using (auth.uid() = user_id);
