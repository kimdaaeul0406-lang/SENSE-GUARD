import React, { useEffect, useState } from 'react';
import { Menu, ShieldCheck, User, Mic, Bell, Wifi } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';
import { DisasterAlertWidget } from './DisasterAlertWidget';

interface MainViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    startListening: () => void;
}

export const MainView: React.FC<MainViewProps> = ({ setCurrentView, setSidebarOpen, startListening }) => {
    const [micStatus, setMicStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
    const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'default'>('unknown');

    useEffect(() => {
        // 마이크 권한 상태 확인
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'microphone' as PermissionName })
                .then((result) => {
                    setMicStatus(result.state as 'granted' | 'denied' | 'prompt');
                    result.onchange = () => setMicStatus(result.state as any);
                })
                .catch(() => setMicStatus('unknown'));
        } else {
            // Safari 등 API 미지원 브라우저 처리
            setMicStatus('unknown');
        }
        // 알림 권한 상태 확인
        if ('Notification' in window) {
            setNotifStatus(Notification.permission as 'granted' | 'denied' | 'default');
        }
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'granted': return 'text-emerald-500';
            case 'denied': return 'text-red-500';
            default: return 'text-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'granted': return '허용됨';
            case 'denied': return '차단됨';
            case 'prompt': return '미설정';
            case 'default': return '미설정';
            default: return '확인 중';
        }
    };

    return (
        <div className="w-full min-h-[100dvh] flex flex-col bg-slate-50 relative overflow-y-auto scrollbar-hide">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm z-10">
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

            <div className="flex flex-col items-center pt-6 px-6 w-full pb-32">
                <WeatherWidget />
                <DisasterAlertWidget />
                <div className="w-full mt-4">
                    {/* 권한 상태 카드 */}
                    <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 p-4 mb-5 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">시스템 상태</p>
                        <div className="flex items-center justify-around">
                            <div className="flex flex-col items-center gap-1">
                                <Mic size={28} className={getStatusColor(micStatus)} />
                                <span className="text-[10px] text-gray-500">마이크</span>
                                <span className={`text-[10px] font-semibold ${getStatusColor(micStatus)}`}>{getStatusText(micStatus)}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex flex-col items-center gap-1">
                                <Bell size={28} className={getStatusColor(notifStatus)} />
                                <span className="text-[10px] text-gray-500">알림</span>
                                <span className={`text-[10px] font-semibold ${getStatusColor(notifStatus)}`}>{getStatusText(notifStatus)}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex flex-col items-center gap-1">
                                <Wifi size={28} className="text-emerald-500" />
                                <span className="text-[10px] text-gray-500">네트워크</span>
                                <span className="text-[10px] font-semibold text-emerald-500">연결됨</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-10">
                        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center shadow-lg">
                            <ShieldCheck size={56} className="text-gray-400" strokeWidth={1.5} />
                        </div>
                    </div>

                    {micStatus === 'denied' && (
                        <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                            <p className="text-xs font-bold text-red-600 mb-1">⚠️ 마이크 권한이 차단되었습니다</p>
                            <p className="text-[11px] text-red-700 leading-relaxed">
                                소리 감지 기능을 사용하려면 브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하여 마이크 권한을 <strong>'허용'</strong>으로 변경해 주세요.
                            </p>
                        </div>
                    )}

                    <button
                        onClick={startListening}
                        className={`w-full py-4 rounded-xl mb-3 text-sm font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${micStatus === 'denied'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                            } text-white`}
                        disabled={micStatus === 'denied'}
                    >
                        {micStatus === 'denied' ? '마이크 권한 필요' : '소리 감지 시작'}
                    </button>
                    <button
                        onClick={() => setCurrentView('ai-chat')}
                        className="w-full bg-[#f8fafc] border border-slate-200 text-slate-600 py-4 rounded-2xl mb-4 text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-slate-100 shadow-sm"
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

                    {/* 사용 안내 */}
                    <div className="w-full bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-100 p-4 mb-4">
                        <p className="text-xs font-semibold text-blue-600 mb-2">💡 이렇게 사용하세요</p>
                        <div className="space-y-1.5">
                            <p className="text-xs text-blue-700">1. <strong>소리 감지 시작</strong>을 누르면 주변 소리를 실시간 감시합니다</p>
                            <p className="text-xs text-blue-700">2. 큰 소리가 감지되면 <strong>AI가 자동으로 분석</strong>합니다</p>
                            <p className="text-xs text-blue-700">3. 위험 소리(사이렌, 경보 등)가 확인되면 <strong>즉시 알림</strong>을 보냅니다</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 mb-12">
                    <p className="text-center text-xs text-gray-400 leading-relaxed">
                        AI와 공공데이터를 활용한<br />
                        안전 보조 서비스
                    </p>
                </div>
            </div>


        </div>
    );
};
