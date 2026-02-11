-- 1. Profiles Table (Automatically managed by Supabase Auth Trigger usually, but here we create manually)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Emergency Contacts Table
create table if not exists public.emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone
);

-- RLS for Emergency Contacts
alter table public.emergency_contacts enable row level security;
create policy "Users can view own contacts" on public.emergency_contacts for select using (auth.uid() = user_id);
create policy "Users can insert own contacts" on public.emergency_contacts for insert with check (auth.uid() = user_id);
create policy "Users can update own contacts" on public.emergency_contacts for update using (auth.uid() = user_id);
create policy "Users can delete own contacts" on public.emergency_contacts for delete using (auth.uid() = user_id);

-- 3. Notification History Table
create table if not exists public.notification_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  message text not null,
  color text default 'amber',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Notification History
alter table public.notification_history enable row level security;
create policy "Users can view own history" on public.notification_history for select using (auth.uid() = user_id);
create policy "Users can insert own history" on public.notification_history for insert with check (auth.uid() = user_id);
create policy "Users can delete own history" on public.notification_history for delete using (auth.uid() = user_id);

-- Function to handle new user signup (Optional: automatically creates profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
