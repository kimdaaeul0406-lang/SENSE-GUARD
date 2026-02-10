# Supabase 데이터베이스 설정 가이드

## 📋 테이블 자동 생성 방법

### 방법 1: Supabase Dashboard에서 직접 실행

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New Query** 버튼 클릭
5. `supabase/schema.sql` 파일 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭

### 방법 2: Supabase CLI 사용

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref your-project-id

# 마이그레이션 실행
supabase db push
```

## 🔑 환경 변수 설정

1. `.env.example` 파일을 `.env.local`로 복사
2. Supabase Dashboard > Settings > API에서 값 복사
3. 환경 변수 채우기:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 생성되는 테이블

| 테이블 | 설명 |
|--------|------|
| `profiles` | 사용자 프로필 (Auth와 연동) |
| `emergency_contacts` | 비상 연락처 |
| `notification_history` | 알림 히스토리 |

## 🔒 보안 기능

- **Row Level Security (RLS)**: 사용자는 자신의 데이터만 접근 가능
- **자동 프로필 생성**: 회원가입 시 트리거로 자동 생성
- **CASCADE 삭제**: 회원 탈퇴 시 관련 데이터 자동 삭제

## 🚀 로컬에서 테스트

현재는 localStorage로 동작합니다. Supabase 연결 후:

1. `lib/supabase.ts`의 함수들을 컴포넌트에서 import
2. localStorage 호출을 Supabase API 호출로 교체
3. 인증은 `lib/auth.ts` 함수 사용

## 📝 예시: 컴포넌트에서 사용하기

```tsx
// Before (localStorage)
const stored = localStorage.getItem('sense_guard_contacts');

// After (Supabase)
import { getEmergencyContacts } from '@/lib/supabase';
const contacts = await getEmergencyContacts(userId);
```
