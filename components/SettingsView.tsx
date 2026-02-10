import React from 'react';
import { Menu, User, Trash2 } from 'lucide-react';

interface NotificationTypes {
    fire: boolean;
    earthquake: boolean;
    disaster: boolean;
    other: boolean;
    [key: string]: boolean;
}

interface NotificationMethod {
    screen: boolean;
    vibration: boolean;
    sound: boolean;
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
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">설정</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentView(isListening ? 'safe' : 'main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <User size={24} className="text-blue-600" />
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Menu size={22} className="text-gray-700" />
                    </button>
                </div>
            </header>

            <main className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">마이크 권한</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">소리 감지 권한</span>
                            <button className={`px-4 py-1.5 rounded-full text-xs font-semibold ${micPermission === 'granted' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                {micPermission === 'granted' ? '허용됨' : '권한 요청'}
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">백그라운드 실행</span>
                            <button className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-full font-semibold">
                                비활성
                            </button>
                        </div>
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
                                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${notificationMethod.screen ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                화면표시
                            </button>
                            <button
                                onClick={() => setNotificationMethod({ ...notificationMethod, vibration: !notificationMethod.vibration })}
                                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${notificationMethod.vibration ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                진동
                            </button>
                            <button
                                onClick={() => setNotificationMethod({ ...notificationMethod, sound: !notificationMethod.sound })}
                                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${notificationMethod.sound ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                소리
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
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">도움 요청</h3>
                    <button className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-4 rounded-xl mb-3 text-sm font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95">
                        긴급 상황 알리기 (SOS 요청하기)
                    </button>
                    <button
                        onClick={() => setCurrentView('ai-chat')}
                        className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-4 rounded-xl text-sm font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
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
