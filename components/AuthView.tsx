import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { ShieldCheck, ArrowLeft, Mail, Lock, User as UserIcon } from 'lucide-react';

interface AuthViewProps {
    setCurrentView: (view: string) => void;
    onLoginSuccess: (user: { id: string; name: string; email: string }) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ setCurrentView, onLoginSuccess }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isLoginMode) {
            // Login Logic
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    setError('이메일 또는 비밀번호가 일치하지 않습니다.');
                    return;
                }

                if (data.user) {
                    // Success
                    const userData = {
                        id: data.user.id,
                        name: data.user.user_metadata.name || '사용자',
                        email: data.user.email || '',
                    };
                    onLoginSuccess(userData);
                    setCurrentView('main');
                }
            } catch (err) {
                // console.error(err);
                setError('로그인 처리 중 오류가 발생했습니다.');
            }
        } else {
            // Signup Logic
            if (!name || !email || !password) {
                setError('모든 필드를 입력해주세요.');
                return;
            }

            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name,
                        },
                    },
                });

                if (error) {
                    setError('회원가입에 실패했습니다. (이미 가입된 이메일일 수 있습니다.)');
                    return;
                }

                if (data.user) {
                    alert('회원가입이 완료되었습니다. 자동 로그인됩니다.');
                    const userData = {
                        id: data.user.id,
                        name: name,
                        email: email,
                    };
                    onLoginSuccess(userData);
                    setCurrentView('main');
                }
            } catch (err) {
                // console.error(err);
                setError('회원가입 처리 중 오류가 발생했습니다.');
            }
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            if (user) {
                // 1. Firebase 로그인 성공 - 즉시 화면 전환
                const userData = {
                    id: user.uid,
                    name: user.displayName || 'Google 사용자',
                    email: user.email || '',
                };

                // UI 업데이트를 최우선으로 실행
                onLoginSuccess(userData);
                setCurrentView('main');

                // 2. Supabase DB 저장은 백그라운드에서 실행 (결과 기다리지 않음)
                supabase
                    .from('profiles')
                    .upsert({
                        id: user.uid,
                        email: user.email,
                        name: user.displayName || 'Google 사용자',
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'id' })
                    .then(({ error }) => {
                        if (error) {
                            // Silent fail
                        }
                    });
            }
        } catch (err) {
            // console.error("Google Login Error:", err);
            const firebaseError = err as { code?: string; message?: string };
            if (firebaseError.code === 'auth/popup-closed-by-user') {
                // Silent fail
            } else {
                setError('로그인에 실패했습니다. 다시 시도해주세요.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => setCurrentView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">
                    {isLoginMode ? '로그인' : '회원가입'}
                </h1>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
                <div className="mb-8 text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck size={32} className="text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">SENSE-GUARD</h2>
                    <p className="text-sm text-gray-500">당신의 안전을 지키는 파트너</p>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    {!isLoginMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="홍길동"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="korea@example.com"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="******"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        {isLoginMode ? '로그인하기' : '회원가입 완료'}
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-400">또는</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-gray-700 font-bold py-3.5 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google 계정으로 시작하기
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        {isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
                        <button
                            onClick={() => {
                                setIsLoginMode(!isLoginMode);
                                setError('');
                            }}
                            className="ml-2 text-blue-600 font-bold hover:underline"
                        >
                            {isLoginMode ? '회원가입' : '로그인'}
                        </button>
                    </p>
                </div>
            </main>
        </div>
    );
};
