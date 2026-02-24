import React from 'react';
import { Menu, User, Trash2, ArrowLeft } from 'lucide-react';

interface NotificationTypes {
    fire: boolean;
    earthquake: boolean;
    disaster: boolean;
    other: boolean;
    [key: string]: boolean;
}

interface NotificationMethod {
    screen: boolean;
    sound: boolean;
    vibration: boolean;
}

interface SettingsViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    isListening: boolean;
    micPermission: string;
    notifications: boolean;
    setNotifications: (enabled: boolean) => void;
    notificationTypes: NotificationTypes;
    setNotificationTypes: (types: NotificationTypes) => void;
    notificationMethod: NotificationMethod;
    setNotificationMethod: (method: NotificationMethod) => void;
    notificationHistory: { id: string; date: string; type: string; message: string; color: string; }[];
    onDeleteNotification: (id: string) => void;
    sensitivity: number;
    setSensitivity: (val: number) => void;
    guardianPhone: string;
    setGuardianPhone: (phone: string) => void;
    isColorBlindMode: boolean;
    setIsColorBlindMode: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    setCurrentView,
    setSidebarOpen,
    isListening,
    micPermission,
    notifications,
    setNotifications,
    notificationTypes,
    setNotificationTypes,
    notificationMethod,
    setNotificationMethod,
    notificationHistory = [],
    onDeleteNotification,
    sensitivity = 50,
    setSensitivity = () => { },
    guardianPhone = '',
    setGuardianPhone = () => { },
    isColorBlindMode = false,
    setIsColorBlindMode = () => { },
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <h1
                    onClick={() => setCurrentView(isListening ? 'safe' : 'main')}
                    className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent cursor-pointer ml-[1.5px]"
                >
                    설정
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentView('mypage')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="마이페이지"
                    >
                        <User size={24} className="text-blue-600" />
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Menu size={22} className="text-gray-700" />
                    </button>
                </div>
            </header>

            <main className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">소리 감지 설정</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">마이크 권한</span>
                            <button className={`px-4 py-1.5 rounded-full text-xs font-semibold ${micPermission === 'granted' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                {micPermission === 'granted' ? '허용됨' : '권한 요청'}
                            </button>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-600">감지 민감도</span>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                    {sensitivity < 30 ? '둔감' : sensitivity > 70 ? '민감' : '보통'} ({sensitivity})
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="10"
                                value={sensitivity}
                                onChange={(e) => setSensitivity(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                                <span>둔감 (큰 소리만)</span>
                                <span>민감 (작은 소리도)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">접근성 및 테마 설정</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-sm text-gray-600 block transition-colors">색약 보정 모드 (고대비)</span>
                            <p className="text-[10px] text-gray-400">색상 구분이 어려운 분들을 위한 모드</p>
                        </div>
                        <button
                            onClick={() => setIsColorBlindMode(!isColorBlindMode)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${isColorBlindMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isColorBlindMode ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">알림 설정</h3>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">알림 전송 여부</span>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-blue-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${notifications ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                    </div>

                    <div className="space-y-2 mb-5 bg-gray-50 rounded-xl p-4">
                        {[
                            { key: 'fire', label: '화재', color: 'red' },
                            { key: 'earthquake', label: '지진', color: 'orange' },
                            { key: 'disaster', label: '재난', color: 'amber' },
                            { key: 'other', label: '기타', color: 'gray' }
                        ].map(({ key, label }) => (
                            <label key={key} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/50 p-2 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={notificationTypes[key]}
                                    onChange={(e) => setNotificationTypes({ ...notificationTypes, [key]: e.target.checked })}
                                    className="w-4 h-4 rounded accent-blue-500"
                                />
                                <span className="text-gray-700 font-medium">{label}</span>
                            </label>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-3 font-semibold">알림 받을 방식 (다중 선택 가능)</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNotificationMethod({ ...notificationMethod, screen: !notificationMethod.screen })}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${notificationMethod.screen ? (isColorBlindMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white shadow-md') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                화면표시
                            </button>
                            <button
                                onClick={() => setNotificationMethod({ ...notificationMethod, sound: !notificationMethod.sound })}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${notificationMethod.sound ? (isColorBlindMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white shadow-md') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                소리
                            </button>
                            <button
                                onClick={() => setNotificationMethod({ ...notificationMethod, vibration: !notificationMethod.vibration })}
                                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${notificationMethod.vibration ? (isColorBlindMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white shadow-md') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                진동
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">최근 알림 내역</h3>
                    <div className="space-y-2">
                        {notificationHistory.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-4">최근 알림이 없습니다.</p>
                        ) : (
                            notificationHistory.map((alert) => (
                                <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${alert.color === 'red' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                            <p className="text-sm font-medium text-gray-800">{alert.date}</p>
                                        </div>
                                        <p className="text-xs text-gray-500 font-medium ml-4">{alert.type}: {alert.message}</p>
                                    </div>
                                    <button
                                        onClick={() => onDeleteNotification(alert.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">보호자 연락처 설정</h3>
                    <div className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 mb-3">
                            비상 연락처는 마이페이지에서 통합 관리됩니다.<br />
                            (등록된 첫 번째 연락처로 SOS 문자가 발송됩니다)
                        </p>
                        <button
                            onClick={() => setCurrentView('mypage')}
                            className="w-full py-3 bg-white border border-blue-200 text-blue-600 font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <User size={16} />
                            비상 연락처 관리하기
                        </button>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-800 mb-4 pt-2 border-t border-gray-100">도움 요청</h3>
                    <button
                        onClick={async () => {
                            if (!guardianPhone) {
                                if (window.confirm('비상 연락처가 설정되지 않았습니다.\n마이페이지에서 연락처를 등록하시겠습니까?')) {
                                    setCurrentView('mypage');
                                }
                                return;
                            }

                            // 1. 위치 정보 가져오기 시도
                            let locationLink = "";
                            try {
                                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                                        timeout: 5000,
                                        enableHighAccuracy: true
                                    });
                                });
                                const lat = position.coords.latitude;
                                const lng = position.coords.longitude;
                                locationLink = `\n📍 현재 위치 확인: https://www.google.com/maps?q=${lat},${lng}`;
                            } catch (error) {
                                console.warn("Failed to get location:", error);
                                // 위치 정보를 가져오지 못해도 문자는 발송 진행
                            }

                            // Mobile Check
                            const userAgent = navigator.userAgent.toLowerCase();
                            const isMobile = /iphone|ipad|ipod|android/i.test(userAgent);
                            const isIos = /iphone|ipad|ipod/i.test(userAgent);

                            const messageText = `🚨 [SENSE-GUARD 긴급 알림] \n지금 위급한 상황인 것 같습니다. 제 위치를 확인해주세요!${locationLink}\n(SENSE-GUARD 자동 발신)`;
                            const message = encodeURIComponent(messageText);

                            // iOS uses '&', Android/Others use '?'
                            const separator = isIos ? '&' : '?';
                            const link = `sms:${guardianPhone}${separator}body=${message}`;

                            // PC/Desktop Feedback
                            if (!isMobile) {
                                const confirmed = window.confirm(
                                    `[PC/웹 환경 시뮬레이션]\n\n실제 모바일 환경에서는 메시지 앱이 실행됩니다.\n\n수신번호: ${guardianPhone}\n내용: ${messageText}\n\n(확인을 누르면 SMS 프로토콜 실행을 시도합니다)`
                                );
                                if (confirmed) {
                                    window.location.href = link;
                                }
                            } else {
                                // Mobile - Execute immediately
                                window.location.href = link;
                            }
                        }}
                        className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-4 rounded-xl mb-3 text-sm font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="animate-pulse">🆘</span> 보호자에게 긴급 SOS 문자 보내기
                    </button>
                    <button
                        onClick={() => setCurrentView('ai-chat')}
                        className="w-full bg-[#f8fafc] border border-slate-200 text-slate-600 py-4 rounded-2xl text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2 hover:bg-slate-100 shadow-sm"
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
            </main>
        </div>
    );
};
