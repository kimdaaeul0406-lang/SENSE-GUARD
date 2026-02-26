import React, { useState } from 'react';
import { ShieldCheck, Menu, Settings, Moon, Sun, MonitorOff } from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { motion, AnimatePresence } from 'framer-motion';

interface SafeViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    stopListening: () => void;
    soundLevel?: number;
    stream?: MediaStream | null;
    isDarkMode: boolean;
    setIsDarkMode: (val: boolean) => void;
    isColorBlindMode: boolean;
    isAutoAnalyzing: boolean;
    isOffline: boolean;
}

export const SafeView: React.FC<SafeViewProps> = ({
    setCurrentView,
    setSidebarOpen,
    stopListening,
    soundLevel = 0,
    stream,
    isDarkMode,
    setIsDarkMode,
    isColorBlindMode,
    isAutoAnalyzing,
    isOffline
}) => {
    const [isSleeping, setIsSleeping] = useState(false);

    const safeColor = isColorBlindMode ? '#1e40af' : '#059669'; // Blue-800 vs Emerald-600
    const safeBg = isColorBlindMode ? '#eff6ff' : '#f7fdf9'; // Blue-50 vs Emerald-50
    const safeAccent = isColorBlindMode ? '#2563eb' : '#10b981'; // Blue-600 vs Emerald-500
    const safeBorder = isColorBlindMode ? 'border-blue-100' : 'border-emerald-50';

    return (
        <div className={`w-full min-h-screen relative transition-colors duration-500 ${isDarkMode ? 'bg-slate-950' : (isColorBlindMode ? 'bg-blue-50/30' : 'bg-[#f7fdf9]')}`}>

            <header className={`${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-white' : `bg-white/50 ${safeBorder} text-gray-500`} backdrop-blur-md border-b px-4 py-4 pt-safe flex items-center justify-between shadow-sm flex-none sticky top-0 z-20`}>
                <button
                    onClick={() => {
                        if (window.confirm('소리 감지를 중단하고 홈으로 돌아가시겠습니까?')) {
                            stopListening();
                        }
                    }}
                    className="hover:opacity-70 transition-opacity"
                >
                    <h1 className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : (isColorBlindMode ? 'text-blue-700' : 'text-[#059669]')}`}>SENSE-GUARD</h1>
                </button>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-yellow-400' : `hover:${isColorBlindMode ? 'bg-blue-50' : 'bg-emerald-50'} ${isColorBlindMode ? 'text-blue-600' : 'text-emerald-500'}`}`}
                    >
                        {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
                    </button>
                    <button onClick={() => setCurrentView('settings')} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : `hover:${isColorBlindMode ? 'bg-blue-50' : 'bg-emerald-50'} ${isColorBlindMode ? 'text-blue-600' : 'text-emerald-500'}`}`}>
                        <Settings size={22} />
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : `hover:${isColorBlindMode ? 'bg-blue-50' : 'bg-emerald-50'} ${isColorBlindMode ? 'text-blue-600' : 'text-emerald-500'}`}`}>
                        <Menu size={22} />
                    </button>
                </div>
            </header>

            <div className="flex flex-col items-center px-4 py-6 w-full z-10 pb-32">
                <div className="w-full max-w-md mx-auto flex flex-col items-center mt-4 mb-auto">
                    <div className="relative w-64 h-64 mb-4 flex items-center justify-center">
                        <motion.div
                            animate={{
                                scale: 1 + (soundLevel / 500),
                                boxShadow: `0 0 ${soundLevel / 2}px ${isColorBlindMode ? 'rgba(37, 99, 235, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            className={`relative w-40 h-40 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${isDarkMode
                                ? 'bg-slate-800/40'
                                : `bg-white`
                                }`}
                        >
                            <ShieldCheck size={72} className={`${isDarkMode ? 'text-emerald-500/60' : (isColorBlindMode ? 'text-blue-600' : 'text-[#10b981]')} relative z-20`} strokeWidth={1.5} />
                            <div className={`absolute bottom-3 right-3 w-3 h-3 ${isColorBlindMode ? 'bg-blue-600' : 'bg-[#10b981]'} rounded-full animate-ping z-20 opacity-40`}></div>
                            <div className={`absolute bottom-3 right-3 w-3 h-3 ${isColorBlindMode ? 'bg-blue-600' : 'bg-[#10b981]'} rounded-full z-20`}></div>
                        </motion.div>
                    </div>

                    <div className="w-full max-w-[160px] mb-8 opacity-40">
                        <WaveformVisualizer stream={stream || null} isActive={true} color={isDarkMode ? "#059669" : (isColorBlindMode ? "#2563eb" : "#10b981")} />
                    </div>

                    <p className={`text-sm text-center mb-1 ${isDarkMode ? 'text-slate-400' : (isColorBlindMode ? 'text-blue-800' : 'text-[#059669]')} font-bold text-base`}>
                        {isAutoAnalyzing ? (
                            <span className="flex flex-col items-center gap-2">
                                <span className="inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></span>
                                AI가 소리를 정밀 분석 중입니다...
                            </span>
                        ) : (
                            <>
                                {isColorBlindMode ? '✓ 안전 상태 실시간 감시 중' : '안전 감시 중'}
                            </>
                        )}
                    </p>

                    {isOffline && (
                        <div className="mb-8 px-3 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200 animate-pulse">
                            오프라인: 로컬 가디언 가동 중
                        </div>
                    )}

                    {!isOffline && !isAutoAnalyzing && (
                        <span className="text-xs font-medium opacity-80 mb-8 block tracking-tight text-center">주변 소리를 실시간으로 분석하고 있습니다.</span>
                    )}

                    <div className="w-full flex flex-col gap-3">
                        <button
                            onClick={stopListening}
                            className={`w-full py-4 rounded-2xl text-base font-bold shadow-sm transition-all border-2 ${isDarkMode
                                ? 'bg-slate-900 text-emerald-400 border-slate-700 hover:bg-slate-800'
                                : `bg-white ${isColorBlindMode ? 'text-blue-700 border-blue-400 hover:bg-blue-50' : 'text-[#059669] border-[#10b981] hover:bg-emerald-50'}`
                                }`}
                        >
                            소리 감지 중지
                        </button>

                        <button
                            onClick={() => setIsSleeping(true)}
                            className={`w-full ${isColorBlindMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-[#059669] hover:bg-[#047857]'} text-white py-4 rounded-2xl text-base font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
                        >
                            <Moon size={20} />
                            수면/절전 모드 (화면 끄기)
                        </button>


                        <button
                            onClick={() => setCurrentView('ai-chat')}
                            className={`w-full py-4 rounded-2xl text-sm font-semibold shadow-sm transition-all border flex items-center justify-center gap-2 active:scale-95 mt-1 ${isDarkMode
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                                : 'bg-[#f8fafc] border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                </div>
            </div>

            <AnimatePresence>
                {isSleeping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSleeping(false)}
                        className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center cursor-pointer"
                    >
                        <motion.div
                            animate={{ opacity: [0.1, 0.2, 0.1] }}
                            transition={{ duration: 5, repeat: Infinity }}
                            className="flex flex-col items-center gap-4"
                        >
                            <Moon size={40} className="text-emerald-950" />
                            <p className="text-emerald-950 text-xs font-medium">감지 중...</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
