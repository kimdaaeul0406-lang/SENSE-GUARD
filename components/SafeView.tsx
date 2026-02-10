import React from 'react';
import { Menu, ShieldCheck, User } from 'lucide-react';

interface SafeViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    stopListening: () => void;
}

export const SafeView: React.FC<SafeViewProps> = ({ setCurrentView, setSidebarOpen, stopListening }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex flex-col">
            <header className="bg-white/80 backdrop-blur-md border-b border-emerald-200 px-4 py-4 flex items-center justify-between shadow-sm">
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">SENSE-GUARD</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-emerald-50 rounded-full transition-colors">
                        <User size={24} className="text-emerald-700" />
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
                        <Menu size={22} className="text-emerald-700" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 py-6 overflow-y-auto w-full">
                <div className="w-full max-w-md mx-auto flex flex-col items-center mt-4">
                    <div className="w-40 h-40 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full mb-4 flex items-center justify-center shadow-2xl animate-pulse-slow">
                        <ShieldCheck size={80} className="text-white" strokeWidth={2} />
                    </div>

                    <h2 className="text-2xl font-bold text-emerald-600 mb-1">안전</h2>
                    <p className="text-sm text-emerald-700 text-center mb-4">
                        주변 소리가 안정적인 상태입니다
                    </p>

                    <div className="w-full flex flex-col gap-2 mb-4">
                        <button
                            onClick={stopListening}
                            className="w-full bg-white text-emerald-600 border-2 border-emerald-500 py-3 rounded-xl text-sm font-semibold shadow-lg hover:bg-emerald-50 transition-all"
                        >
                            소리 감지 중지
                        </button>

                        <button
                            onClick={() => setCurrentView('ai-chat')}
                            className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 8V4H8" />
                                <rect width="16" height="12" x="4" y="8" rx="2" />
                                <path d="M2 14h2" />
                                <path d="M20 14h2" />
                                <path d="M15 13v2" />
                                <path d="M9 13v2" />
                            </svg>
                            AI 안전 도우미
                        </button>
                    </div>

                    <p className="text-sm text-emerald-600 text-center leading-relaxed">
                        버튼을 눌러 소리 감지를 중지하거나<br />AI에게 안전 정보를 물어보세요
                    </p>
                </div>
            </main>
        </div>
    );
};
