import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, LogOut, Shield } from 'lucide-react';
import { getEmergencyContacts, addEmergencyContact, deleteEmergencyContact, deleteUserAccount } from '../lib/supabase';

interface MyPageViewProps {
    setCurrentView: (view: string) => void;
    user: { id: string; name: string; email: string } | null;
    onLogout: () => void;
}

export const MyPageView: React.FC<MyPageViewProps> = ({ setCurrentView, user, onLogout }) => {
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
                <button onClick={() => setCurrentView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                            <p className="text-sm text-gray-500 mb-4">{user.email}</p>
                            <button className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold rounded-full hover:bg-gray-200 transition-colors">
                                프로필 수정
                            </button>
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
                                            <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm">{contact.name}</p>
                                                    <p className="text-xs text-gray-500">{contact.phone}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteContact(contact.id)}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <LogOut size={16} className="rotate-180" />
                                                </button>
                                            </div>
                                        ))}
                                        {contacts.length === 0 && (
                                            <p className="text-center text-xs text-gray-400 py-2">등록된 비상 연락처가 없습니다.</p>
                                        )}
                                    </>
                                )}
                            </div>
                            <p className="mt-3 text-xs text-gray-400">
                                * 위급 상황 발생 시 등록된 번호로 자동 문자가 전송됩니다.
                            </p>
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
