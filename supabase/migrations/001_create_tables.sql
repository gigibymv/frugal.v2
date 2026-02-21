-- Profiles (auto-created on signup)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

-- Budgets
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  effective_from date not null,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Expenses
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  category text not null,
  description text default '',
  date date not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_budgets_user_id on public.budgets(user_id);
create index if not exists idx_expenses_user_id on public.expenses(user_id);
create index if not exists idx_expenses_date on public.expenses(user_id, date);
