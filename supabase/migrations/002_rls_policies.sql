-- Enable RLS
alter table public.profiles enable row level security;
alter table public.budgets enable row level security;
alter table public.expenses enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Budgets: full CRUD on own rows
create policy "Users can view own budgets" on public.budgets
  for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on public.budgets
  for update using (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets
  for delete using (auth.uid() = user_id);

-- Expenses: full CRUD on own rows
create policy "Users can view own expenses" on public.expenses
  for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on public.expenses
  for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on public.expenses
  for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
