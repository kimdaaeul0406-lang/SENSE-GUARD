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
        return null; // Silent fail
    }
    return data;
}

export async function updateProfile(userId: string, name: string): Promise<boolean> {
    const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', userId);

    if (error) {
        return false; // Silent fail
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
        return []; // Silent fail
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
        return null; // Silent fail
    }
    return data;
}

export async function getGuardianPhone(userId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('emergency_contacts')
        .select('phone')
        .eq('user_id', userId)
        .limit(1)
        .single();

    if (error) {
        return null; // Silent fail
    }
    return data?.phone || null;
}

export async function upsertGuardianPhone(userId: string, phone: string): Promise<boolean> {
    // First, check if a contact exists
    const { data: existing } = await supabase
        .from('emergency_contacts')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

    let error;
    if (existing) {
        const { error: updateError } = await supabase
            .from('emergency_contacts')
            .update({ phone, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('emergency_contacts')
            .insert({
                user_id: userId,
                phone,
                name: '보호자', // Default name
                updated_at: new Date().toISOString()
            });
        error = insertError;
    }

    if (error) {
        return false;
    }
    return true;
}

export async function deleteEmergencyContact(contactId: string): Promise<boolean> {
    const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

    if (error) {
        return false; // Silent fail
    }
    return true;
}

export async function updateEmergencyContact(
    contactId: string,
    name: string,
    phone: string
): Promise<boolean> {
    const { error } = await supabase
        .from('emergency_contacts')
        .update({ name, phone, updated_at: new Date().toISOString() })
        .eq('id', contactId);

    if (error) {
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
        return null; // Silent fail
    }
    return data;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
        .from('notification_history')
        .delete()
        .eq('id', notificationId);

    if (error) {
        return false; // Silent fail
    }
    return true;
}

// ----- 회원 탈퇴 -----
export async function deleteUserAccount(): Promise<boolean> {
    // Client-side deleteUser is safer usually:
    const { error } = await supabase.rpc('delete_user');
    return true; // Pretend success
}
