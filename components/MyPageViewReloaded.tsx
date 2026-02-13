'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, LogOut, Shield, Pencil, Check, X } from 'lucide-react';
import { getEmergencyContacts, addEmergencyContact, deleteEmergencyContact, updateEmergencyContact, deleteUserAccount } from '../lib/supabase';


export interface MyPageViewReloadedProps {
    setCurrentView: (view: string) => void;
    user: { id: string; name: string; email: string } | null;
    onLogout: () => void;
    onBack?: () => void;
}

export const MyPageViewReloaded: React.FC<MyPageViewReloadedProps> = ({ setCurrentView, user, onLogout, onBack }) => {
    const [contacts, setContacts] = useState<{ id: string; name: string; phone: string }[]>([]);
    const [loading, setLoading] = useState(false);

    // Load contacts from DB
    useEffect(() => {
        const loadContacts = async () => {
            if (!user) return;
            setLoading(true);
            const data = await getEmergencyContacts(user.id);
            setContacts(data.map(c => ({ id: c.id, name: c.name, phone: c.phone })));
            setLoading(false);
        };
        loadContacts();
    }, [user]);

    const [isEditing, setIsEditing] = useState(false);
    const [newContactName, setNewContactName] = useState("");
    const [newContactPhone, setNewContactPhone] = useState("");

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");

    const startEditing = (contact: { id: string; name: string; phone: string }) => {
        setEditingId(contact.id);
        setEditName(contact.name);
        setEditPhone(contact.phone);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName("");
        setEditPhone("");
    };

    const saveEdit = async (id: string) => {
        if (!editName || !editPhone) return;
        const success = await updateEmergencyContact(id, editName, editPhone);
        if (success) {
            setContacts(contacts.map(c => c.id === id ? { ...c, name: editName, phone: editPhone } : c));
            setEditingId(null);
        } else {
            alert('연락처 수정에 실패했습니다.');
        }
    };

    const handleAddContact = async () => {
        if (newContactName && newContactPhone && user) {
            const newContact = await addEmergencyContact(user.id, newContactName, newContactPhone);
            if (newContact) {
                setContacts([...contacts, { id: newContact.id, name: newContact.name, phone: newContact.phone }]);
                setNewContactName("");
                setNewContactPhone("");
                setIsEditing(false);
            } else {
                alert('연락처 추가에 실패했습니다.');
            }
        }
    };

    const handleDeleteContact = async (id: string) => {
        const success = await deleteEmergencyContact(id);
        if (success) {
            setContacts(contacts.filter(c => c.id !== id));
        } else {
            alert('연락처 삭제에 실패했습니다.');
        }
    };

    // 회원 탈퇴 처리
    const handleWithdraw = async () => {
        if (!user) return;

        const confirmed = window.confirm(
            '정말 탈퇴하시겠습니까?\n\n모든 데이터가 삭제되며 복구할 수 없습니다.'
        );

        if (confirmed) {
            const success = await deleteUserAccount();
            if (success) {
                alert('탈퇴가 완료되었습니다.');
                onLogout();
            } else {
                alert('탈퇴 처리 중 오류가 발생했습니다.');
            }
        }
    };

    const handleSOS = (phone: string) => {
        if (!phone) return;
        const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
        const message = encodeURIComponent('🚨 [SENSE-GUARD 긴급 알림] 테스트 메시지입니다.');
        const link = `sms:${phone}${isMobile && navigator.userAgent.toLowerCase().includes('iphone') ? '&' : '?'}body=${message}`;

        if (!isMobile) {
            const confirmed = window.confirm(`[PC/웹 테스트]\n\n수신번호: ${phone}\n내용: ${decodeURIComponent(message)}\n\n(실제 모바일에서는 문자 앱이 열립니다)`);
            if (confirmed) window.location.href = link;
        } else {
            window.location.href = link;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
                <button onClick={() => onBack ? onBack() : setCurrentView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">마이페이지</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 p-4 w-full max-w-md mx-auto overflow-y-auto">
                {/* Profile Section */}
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
                            <button
                                onClick={() => setCurrentView('auth')}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                로그인 / 회원가입
                            </button>
                        </div>
                    )}
                </div>

                {/* Emergency Contacts Section (Only if logged in) */}
                {user && (
                    <>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Phone size={18} className="text-red-500" />
                                    비상 연락망
                                </h3>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="text-xs text-blue-600 font-bold hover:underline"
                                >
                                    {isEditing ? '취소' : '추가'}
                                </button>
                            </div>

                            {isEditing && (
                                <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <input
                                        type="text"
                                        placeholder="이름 (예: 아버지)"
                                        className="w-full text-sm p-2 mb-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                                        value={newContactName}
                                        onChange={(e) => setNewContactName(e.target.value)}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="전화번호"
                                        className="w-full text-sm p-2 mb-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500"
                                        value={newContactPhone}
                                        onChange={(e) => setNewContactPhone(e.target.value)}
                                    />
                                    <button
                                        onClick={handleAddContact}
                                        className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                                    >
                                        저장
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3">
                                {loading ? (
                                    <p className="text-center text-xs text-gray-400 py-2">로딩 중...</p>
                                ) : (
                                    <>
                                        {contacts.map(contact => (
                                            <div key={contact.id} className="p-3 bg-gray-50 rounded-xl mb-3 border border-gray-100">
                                                {editingId === contact.id ? (
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            className="w-full text-sm p-2 rounded border border-blue-200 focus:outline-none focus:border-blue-500"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            placeholder="이름"
                                                        />
                                                        <input
                                                            type="tel"
                                                            className="w-full text-sm p-2 rounded border border-blue-200 focus:outline-none focus:border-blue-500"
                                                            value={editPhone}
                                                            onChange={(e) => setEditPhone(e.target.value)}
                                                            placeholder="전화번호"
                                                        />
                                                        <div className="flex justify-end gap-2 mt-1">
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="px-3 py-1.5 bg-gray-200 rounded-lg text-gray-600 text-xs font-bold"
                                                            >
                                                                취소
                                                            </button>
                                                            <button
                                                                onClick={() => saveEdit(contact.id)}
                                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                                                            >
                                                                저장
                                                            </button>
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
                                                                <button
                                                                    onClick={() => startEditing(contact)}
                                                                    className="p-1.5 text-gray-400 hover:text-blue-500"
                                                                >
                                                                    <Pencil size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteContact(contact.id)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500"
                                                                >
                                                                    <LogOut size={18} className="rotate-180" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleSOS(contact.phone)}
                                                            className="w-full py-2 bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-200 hover:bg-red-200 flex items-center justify-center gap-1"
                                                        >
                                                            🚨 긴급문자 보내기
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {contacts.length === 0 && (
                                            <p className="text-center text-xs text-gray-400 py-2">추가 연락처가 없습니다.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Account Actions */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Shield size={18} className="text-gray-600" />
                                계정 관리
                            </h3>
                            <button onClick={onLogout} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors mb-2">
                                로그아웃
                            </button>
                            <button
                                onClick={handleWithdraw}
                                className="w-full py-3 text-gray-400 text-sm hover:text-red-500 transition-colors"
                            >
                                회원 탈퇴
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};
