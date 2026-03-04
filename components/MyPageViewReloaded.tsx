'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, LogOut, Shield, Pencil } from 'lucide-react';

// ───────────────────────────────────────────────────
// localStorage 기반 연락처 (Supabase 인증 불필요)
// Firebase 로그인만 해도 연락처 저장/조회/삭제 작동
// ───────────────────────────────────────────────────
const CONTACTS_KEY = 'sg_emergency_contacts';

interface LocalContact { id: string; name: string; phone: string; }

function loadLocalContacts(): LocalContact[] {
    try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]'); }
    catch { return []; }
}

function saveLocalContacts(list: LocalContact[]) {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(list));
    // 첫 번째 연락처를 guardianPhone으로 자동 설정
    if (list.length > 0) {
        localStorage.setItem('guardianPhone', list[0].phone);
    } else {
        localStorage.removeItem('guardianPhone');
    }
}

export interface MyPageViewReloadedProps {
    setCurrentView: (view: string) => void;
    user: { id: string; name: string; email: string } | null;
    onLogout: () => void;
    onBack?: () => void;
}

export const MyPageViewReloaded: React.FC<MyPageViewReloadedProps> = ({ setCurrentView, user, onLogout, onBack }) => {
    const [contacts, setContacts] = useState<LocalContact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setContacts(loadLocalContacts());
        setLoading(false);
    }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    const validatePhone = (v: string) => /^[0-9+]{7,15}$/.test(v.replace(/[\s\-]/g, ''));

    // ── 추가 ──
    const handleAdd = () => {
        if (!newName.trim()) { alert('이름을 입력해 주세요.'); return; }
        if (!validatePhone(newPhone)) { alert('유효한 전화번호를 입력해 주세요.\n(예: 010-1234-5678)'); return; }
        const next: LocalContact[] = [...contacts, { id: Date.now().toString(), name: newName.trim(), phone: newPhone.trim() }];
        setContacts(next);
        saveLocalContacts(next);
        setNewName(''); setNewPhone(''); setIsEditing(false);
    };

    // ── 수정 저장 ──
    const handleSaveEdit = (id: string) => {
        if (!editName.trim()) { alert('이름을 입력해 주세요.'); return; }
        if (!validatePhone(editPhone)) { alert('유효한 전화번호를 입력해 주세요.\n(예: 010-1234-5678)'); return; }
        const next = contacts.map(c => c.id === id ? { ...c, name: editName.trim(), phone: editPhone.trim() } : c);
        setContacts(next);
        saveLocalContacts(next);
        setEditingId(null);
    };

    // ── 삭제 ──
    const handleDelete = (id: string) => {
        if (!window.confirm('이 연락처를 삭제하시겠습니까?')) return;
        const next = contacts.filter(c => c.id !== id);
        setContacts(next);
        saveLocalContacts(next);
    };

    // ── 긴급문자 ──
    const handleSOS = (phone: string) => {
        const ua = navigator.userAgent.toLowerCase();
        const isMobile = /iphone|ipad|ipod|android/i.test(ua);
        const isIos = /iphone|ipad|ipod/i.test(ua);
        const text = '🚨 [SENSE-GUARD 긴급 알림] 위급한 상황입니다. 제 위치를 확인해주세요!';
        const sep = isIos ? '&' : '?';
        const link = `sms:${phone}${sep}body=${encodeURIComponent(text)}`;

        if (!isMobile) {
            if (window.confirm(`[PC 테스트]\n수신: ${phone}\n내용: ${text}\n\n(모바일에서는 문자 앱이 열립니다)`)) {
                window.location.href = link;
            }
        } else {
            window.location.href = link;
        }
    };

    // ── 회원 탈퇴 ──
    const handleWithdraw = async () => {
        if (!window.confirm('정말 탈퇴하시겠습니까?\n\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return;
        try {
            const { supabase } = await import('../lib/supabase');
            await supabase.rpc('delete_user');
        } catch { /* ignore */ }
        onLogout();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
                <button onClick={() => onBack ? onBack() : setCurrentView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">마이페이지</h1>
                <div className="w-10" />
            </header>

            <main className="flex-1 p-4 w-full max-w-md mx-auto overflow-y-auto">

                {/* 프로필 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4 flex flex-col items-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                        <User size={40} />
                    </div>
                    {user ? (
                        <>
                            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                        </>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
                            <button onClick={() => setCurrentView('auth')} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                                로그인 / 회원가입
                            </button>
                        </div>
                    )}
                </div>

                {/* 비상 연락망 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Phone size={18} className="text-red-500" />
                            비상 연락망
                        </h3>
                        <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-blue-600 font-bold hover:underline">
                            {isEditing ? '취소' : '+ 추가'}
                        </button>
                    </div>

                    {isEditing && (
                        <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <input
                                type="text"
                                placeholder="이름 (예: 아버지)"
                                className="w-full text-sm p-2 mb-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                            <input
                                type="tel"
                                placeholder="전화번호 (예: 010-1234-5678)"
                                className="w-full text-sm p-2 mb-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                                value={newPhone}
                                onChange={e => setNewPhone(e.target.value)}
                            />
                            <button onClick={handleAdd} className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">
                                저장
                            </button>
                        </div>
                    )}

                    <div className="space-y-3">
                        {loading ? (
                            <p className="text-center text-xs text-gray-400 py-2">로딩 중...</p>
                        ) : contacts.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-4">
                                📭 등록된 연락처가 없습니다.<br />
                                <span className="text-blue-500 font-bold">+ 추가</span>를 눌러 긴급 연락처를 등록하세요.
                            </p>
                        ) : contacts.map(contact => (
                            <div key={contact.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                {editingId === contact.id ? (
                                    <div className="flex flex-col gap-2">
                                        <input autoFocus type="text" className="w-full text-sm p-2 rounded border border-blue-200 focus:outline-none" value={editName} onChange={e => setEditName(e.target.value)} placeholder="이름" />
                                        <input type="tel" className="w-full text-sm p-2 rounded border border-blue-200 focus:outline-none" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="전화번호" />
                                        <div className="flex justify-end gap-2 mt-1">
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-200 rounded-lg text-gray-600 text-xs font-bold">취소</button>
                                            <button onClick={() => handleSaveEdit(contact.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">저장</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{contact.name}</p>
                                                <p className="text-xs text-gray-400 mt-1">{contact.phone}</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => { setEditingId(contact.id); setEditName(contact.name); setEditPhone(contact.phone); }} className="p-1.5 text-gray-400 hover:text-blue-500">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(contact.id)} className="p-1.5 text-gray-400 hover:text-red-500">
                                                    <LogOut size={16} className="rotate-180" />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSOS(contact.phone)}
                                            className="w-full py-2 bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-200 active:scale-95 transition-all flex items-center justify-center gap-1"
                                        >
                                            🚨 긴급문자 보내기
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 계정 관리 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Shield size={18} className="text-gray-600" />
                        계정 관리
                    </h3>
                    <button onClick={onLogout} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors mb-2">
                        로그아웃
                    </button>
                    <button onClick={handleWithdraw} className="w-full py-3 text-gray-400 text-sm hover:text-red-500 transition-colors">
                        회원 탈퇴
                    </button>
                </div>
            </main>
        </div>
    );
};
