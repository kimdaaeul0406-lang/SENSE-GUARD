import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 읽기 (없으면 빈 문자열로 대체)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase가 설정되었는지 확인
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Supabase 클라이언트 생성 (설정이 없으면 더미 클라이언트)
export const supabase: SupabaseClient = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Supabase 설정 여부 확인 함수
export function checkSupabaseConnection(): boolean {
    if (!isSupabaseConfigured) {
        console.warn('⚠️ Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
        return false;
    }
    return true;
}

// 타입 정의
export interface Profile {
    id: string;
    email: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface EmergencyContact {
    id: string;
    user_id: string;
    name: string;
    phone: string;
    created_at: string;
    updated_at: string;
}

export interface NotificationHistoryItem {
    id: string;
    user_id: string;
    type: string;
    message: string;
    color: string;
    created_at: string;
}

// =====================================================
// 데이터베이스 API 함수들
// =====================================================

// ----- 프로필 관련 -----
export async function getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

export async function updateProfile(userId: string, name: string): Promise<boolean> {
    const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        return false;
    }
    return true;
}

// ----- 비상 연락처 관련 -----
export async function getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching contacts:', error);
        return [];
    }
    return data || [];
}

export async function addEmergencyContact(
    userId: string,
    name: string,
    phone: string
): Promise<EmergencyContact | null> {
    const { data, error } = await supabase
        .from('emergency_contacts')
        .insert({ user_id: userId, name, phone })
        .select()
        .single();

    if (error) {
        console.error('Error adding contact:', error);
        return null;
    }
    return data;
}

export async function deleteEmergencyContact(contactId: string): Promise<boolean> {
    const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

    if (error) {
        console.error('Error deleting contact:', error);
        return false;
    }
    return true;
}

// ----- 알림 히스토리 관련 -----
export async function getNotificationHistory(userId: string): Promise<NotificationHistoryItem[]> {
    const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
}

export async function addNotification(
    userId: string,
    type: string,
    message: string,
    color: string = 'amber'
): Promise<NotificationHistoryItem | null> {
    const { data, error } = await supabase
        .from('notification_history')
        .insert({ user_id: userId, type, message, color })
        .select()
        .single();

    if (error) {
        console.error('Error adding notification:', error);
        return null;
    }
    return data;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
        .from('notification_history')
        .delete()
        .eq('id', notificationId);

    if (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
    return true;
}

// ----- 회원 탈퇴 -----
export async function deleteUserAccount(): Promise<boolean> {
    // 현재 로그인된 사용자의 계정 삭제
    // 참고: RLS와 CASCADE 덕분에 관련 데이터도 자동 삭제됨
    const { error } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
    );

    if (error) {
        console.error('Error deleting account:', error);
        return false;
    }
    return true;
}
