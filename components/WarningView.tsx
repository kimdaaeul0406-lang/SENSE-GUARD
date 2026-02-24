import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Search, ArrowRight, MessageCircle } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { motion, AnimatePresence } from 'framer-motion';

export const WarningView: React.FC<any> = ({
    setCurrentView,
    setSidebarOpen,
    startListening,
    aiAutoResult,
    isAutoAnalyzing
}) => {
    // 실제 AI 분석 결과가 있으면 그것을 우선 사용
    const displayAnalysis = aiAutoResult?.description || "주변에서 큰 소리가 감지되었습니다. 주의가 필요합니다.";
    const displaySoundType = aiAutoResult?.riskLevel === 'WARNING' ? (aiAutoResult.description.split(' ')[0] || "감지된 소음") : "미확인 소음";
    const [isLocalAnalyzing, setIsLocalAnalyzing] = useState(true);

    useEffect(() => {
        // AI 분석 중이면 로컬 타이머와 상관없이 분석 중 표시
        if (!isAutoAnalyzing) {
            const timer = setTimeout(() => setIsLocalAnalyzing(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isAutoAnalyzing]);

    const isCurrentlyAnalyzing = isAutoAnalyzing || isLocalAnalyzing;

    return (
        <div className="min-h-screen bg-[#fffbeb] flex flex-col relative overflow-hidden transition-colors duration-500">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <AuroraBackground isActive={isCurrentlyAnalyzing} color="amber" />
            </div>

            <header className="bg-white/50 backdrop-blur-md border-b border-amber-100 px-4 py-4 pt-safe flex items-center justify-between shadow-sm z-20">
                <h1 className="text-lg font-bold text-amber-600/60 font-medium">SENSE-GUARD [주의]</h1>
                <div className="flex gap-2">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-400">
                        <Shield size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center px-6 py-8 overflow-y-auto z-10 w-full">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md flex flex-col items-center"
                >
                    <div className="relative mb-8">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-28 h-28 bg-amber-400/70 rounded-full flex items-center justify-center shadow-lg shadow-amber-200"
                        >
                            <AlertTriangle size={48} className="text-white" />
                        </motion.div>
                    </div>

                    <div className="w-full bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-md border border-amber-50 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Search size={16} className="text-amber-400" />
                            <h3 className="font-bold text-amber-800/70 text-sm">AI 분석 결과</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/30 text-center">
                                <p className="text-[10px] text-amber-600/50 mb-1 font-bold uppercase tracking-wider">감지된 소리</p>
                                <p className="text-xl font-bold text-amber-900/60">{displaySoundType}</p>
                            </div>

                            <div className="p-4 bg-white/50 rounded-2xl border border-amber-50/50">
                                <p className="text-[10px] text-amber-500/60 font-bold mb-1">상태 보고</p>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                    {isCurrentlyAnalyzing ? "정밀 분석 중..." : displayAnalysis}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-3 max-w-[320px]">
                        <button
                            onClick={startListening}
                            className="w-full bg-amber-400/80 text-white py-4 rounded-2xl text-base font-bold shadow-md hover:bg-amber-500/80 transition-all flex items-center justify-center gap-2"
                        >
                            확인했습니다
                        </button>

                        {/* 사용자님이 요청하신 2번째 사진의 깔끔한 스타일 적용 */}
                        <button
                            onClick={() => setCurrentView('ai-chat')}
                            className="w-full bg-[#f8fafc] border border-slate-200 text-slate-600 py-4 rounded-2xl text-sm font-semibold shadow-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-95"
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

                    <button
                        onClick={() => setCurrentView('manual')}
                        className="mt-8 text-amber-700/40 text-xs font-bold hover:underline"
                    >
                        안전 행동 매뉴얼 확인 <ArrowRight size={14} className="inline ml-1" />
                    </button>
                </motion.div>
            </main>
        </div>
    );
};
