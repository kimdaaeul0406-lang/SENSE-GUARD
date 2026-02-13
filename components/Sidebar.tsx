import React from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    setCurrentView: (view: string) => void;
    user?: { name: string; email: string } | null;
    onLogout?: () => void;
    isListening?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, setCurrentView, user, onLogout, isListening }) => {
    const handleNavigation = (view: string) => {
        setCurrentView(view);
        onClose();
    };

    return (
        <>
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 z-40 ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            <div className={`absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-6 h-full overflow-y-auto">
                    <div className="mb-8 border-b border-gray-100 pb-6">
                        <h1
                            onClick={() => handleNavigation(isListening ? 'safe' : 'main')}
                            className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2 cursor-pointer hover:opacity-80 transition-opacity inline-block"
                        >
                            SENSE-GUARD
                        </h1>
                        {user ? (
                            <div>
                                <p className="text-lg font-bold text-gray-800">{user.name}님</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                        ) : (
                            <button
                                onClick={() => handleNavigation('auth')}
                                className="text-blue-600 font-bold hover:underline"
                            >
                                로그인 / 회원가입 &gt;
                            </button>
                        )}
                    </div>

                    <div className="space-y-6 text-sm">

                        {/* 서비스 정보 */}
                        <div>
                            <p className="font-semibold text-gray-800 mb-2">[ 서비스 정보 ]</p>
                            <div className="ml-3 space-y-1.5 text-gray-600">
                                <button onClick={() => handleNavigation('intro')} className="block hover:text-blue-600 transition-colors">• 서비스 소개</button>
                                <button onClick={() => handleNavigation('how-it-works')} className="block hover:text-blue-600 transition-colors">• 작동 방식</button>
                            </div>
                        </div>

                        {/* 안전 알림 */}
                        <div>
                            <p className="font-semibold text-gray-800 mb-2">[ 안전 알림 ]</p>
                            <div className="ml-3 space-y-1.5 text-gray-600">
                                <button onClick={() => handleNavigation('disaster-info')} className="block hover:text-orange-500 transition-colors text-left font-medium">• 재난 정보 센터 🔔</button>
                                <button onClick={() => handleNavigation('manual')} className="block hover:text-red-500 transition-colors text-left">• 재난 행동 요령 (보기)</button>
                                <button onClick={() => handleNavigation('shelter')} className="block hover:text-blue-600 transition-colors text-left">• 재난 대피 시설</button>
                            </div>
                        </div>

                        {/* 설정 */}
                        <div>
                            <p className="font-semibold text-gray-800 mb-2">[ 설정 ]</p>
                            <div className="ml-3 space-y-1.5 text-gray-600">
                                <button onClick={() => handleNavigation('settings')} className="block hover:text-blue-600 transition-colors text-left">• 알림 및 권한 설정</button>
                                {user && (
                                    <button onClick={onLogout} className="block hover:text-red-600 transition-colors text-left text-gray-500 mt-2 pt-2 border-t border-gray-100 w-full">
                                        • 로그아웃
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 안내 */}
                        <div>
                            <p className="font-semibold text-gray-800 mb-2">[ 안내 ]</p>
                            <div className="ml-3 space-y-1.5 text-gray-600">
                                <button onClick={() => handleNavigation('terms')} className="block hover:text-blue-600 transition-colors text-left">• 서비스 약관</button>
                                <button onClick={() => handleNavigation('help')} className="block hover:text-blue-600 transition-colors text-left">• 도움말</button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-400 leading-relaxed">
                            AI와 공공데이터를 활용한<br />
                            안전 보조 서비스
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
