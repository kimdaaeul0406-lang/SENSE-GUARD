import { supabase } from './supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// =====================================================
// Supabase 인증 API
// =====================================================

export interface AuthUser {
    id: string;
    email: string;
    name: string;
}

// 현재 로그인된 사용자 가져오기
export async function getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // 프로필에서 이름 가져오기
    const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

    return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.email?.split('@')[0] || 'User'
    };
}

// 이메일/비밀번호로 회원가입
export async function signUp(
    email: string,
    password: string,
    name: string
): Promise<{ user: AuthUser | null; error: string | null }> {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name } // 메타데이터에 이름 저장 (트리거에서 사용)
        }
    });

    if (error) {
        return { user: null, error: error.message };
    }

    if (!data.user) {
        return { user: null, error: '회원가입에 실패했습니다.' };
    }

    return {
        user: {
            id: data.user.id,
            email: data.user.email || '',
            name: name
        },
        error: null
    };
}

// 이메일/비밀번호로 로그인
export async function signIn(
    email: string,
    password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return { user: null, error: error.message };
    }

    if (!data.user) {
        return { user: null, error: '로그인에 실패했습니다.' };
    }

    // 프로필에서 이름 가져오기
    const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', data.user.id)
        .single();

    return {
        user: {
            id: data.user.id,
            email: data.user.email || '',
            name: profile?.name || email.split('@')[0]
        },
        error: null
    };
}

// 로그아웃
export async function signOut(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
}

// Google OAuth 로그인
export async function signInWithGoogle(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined
        }
    });
    return { error: error?.message || null };
}

// 회원 탈퇴
export async function deleteAccount(): Promise<{ error: string | null }> {
    // 사용자가 직접 계정을 삭제할 수 없으므로, 
    // Edge Function이나 서버 API를 통해 처리해야 합니다.
    // 여기서는 로그아웃 처리만 합니다.
    // 실제 삭제는 Supabase Dashboard에서 하거나 Edge Function 필요

    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
}

// 인증 상태 변화 구독
export function onAuthStateChange(
    callback: (user: AuthUser | null) => void
) {
    return supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', session.user.id)
                .single();

            callback({
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.email?.split('@')[0] || 'User'
            });
        } else {
            callback(null);
        }
    });
}
