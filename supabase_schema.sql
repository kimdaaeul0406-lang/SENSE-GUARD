-- 1. 사용자 프로필 테이블 (로그인 시 자동 저장)
-- Firebase UID는 UUID가 아닐 수 있으므로 text 타입 사용 & FK 제거
create table if not exists public.profiles (
  id text primary key, -- Firebase UID
  email text,
  name text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 보안 정책 설정 (프로필)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
-- Firebase UID를 직접 비교 (Supabase Auth를 안 쓰므로 auth.uid() 대신 커스텀 헤더나 로직이 필요할 수 있으나, 일단 public 쓰기 가능하게 설정하거나 anon 허용)
-- 주의: Firebase Auth를 쓰면 Supabase RLS에서 auth.uid()가 제대로 동작하지 않음!
-- 일단 누구나 Insert 가능하도록 열어두지만, 실무에서는 Firebase Token 검증이 필요함.
create policy "Enable insert for authenticated users" on public.profiles for insert with check (true);
create policy "Enable update for users based on ID" on public.profiles for update using (true);

-- 2. 비상 연락처 테이블 (보호자 번호 저장)
create table if not exists public.emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Firebase UID (No FK to auth.users)
  name text,
  phone text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 보안 정책 설정 (비상 연락처)
alter table public.emergency_contacts enable row level security;
create policy "Enable read access for all" on public.emergency_contacts for select using (true);
create policy "Enable insert access for all" on public.emergency_contacts for insert with check (true);
create policy "Enable update access for all" on public.emergency_contacts for update using (true);
create policy "Enable delete access for all" on public.emergency_contacts for delete using (true);

-- 3. 알림 내역 테이블 (지난 알림 저장)
create table if not exists public.notification_history (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- Firebase UID (No FK to auth.users)
  type text not null,
  message text not null,
  color text default 'amber',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS 보안 정책 설정 (알림 내역)
alter table public.notification_history enable row level security;
create policy "Enable read access for all" on public.notification_history for select using (true);
create policy "Enable insert access for all" on public.notification_history for insert with check (true);
create policy "Enable delete access for all" on public.notification_history for delete using (true);
