import React from 'react';
import { Menu, ShieldCheck, User } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';
import { DisasterAlertWidget } from './DisasterAlertWidget';

interface MainViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    startListening: () => void;
}

export const MainView: React.FC<MainViewProps> = ({ setCurrentView, setSidebarOpen, startListening }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">SENSE-GUARD</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentView('mypage')} className="p-2 hover:bg-blue-50 rounded-full transition-colors">
                        <User size={24} className="text-gray-700" />
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Menu size={22} className="text-gray-700" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-start pt-8 px-6 w-full">
                <WeatherWidget />
                <DisasterAlertWidget />
                <div className="w-full mt-4">
                    <div className="mb-16">
                        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
                            <ShieldCheck size={56} className="text-gray-400" strokeWidth={1.5} />
                        </div>
                    </div>

                    <button
                        onClick={startListening}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-4 rounded-xl mb-3 text-sm font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95"
                    >
                        소리 감지 시작
                    </button>
                    <button
                        onClick={() => setCurrentView('ai-chat')}
                        className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-4 rounded-xl mb-4 text-sm font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
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
                    <p className="text-center text-sm text-gray-500 leading-relaxed">
                        버튼을 눌러서 주변 소리를 감지하거나<br />AI에게 안전 정보를 물어보세요
                    </p>
                </div>

                <div className="mt-auto mb-8">
                    <p className="text-center text-xs text-gray-400 leading-relaxed">
                        AI와 공공데이터를 활용한<br />
                        안전 보조 서비스
                    </p>
                </div>
            </main>


        </div>
    );
};
