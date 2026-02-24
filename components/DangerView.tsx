import React, { useState, useEffect } from 'react';
import { AlertCircle, Shield, Search, ArrowRight, Phone, MessageCircle } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { motion, AnimatePresence } from 'framer-motion';

export const DangerView: React.FC<any> = ({
    setCurrentView,
    setSidebarOpen,
    startListening,
    aiAutoResult,
    isAutoAnalyzing
}) => {
    // 실제 AI 분석 결과가 있으면 그것을 우선 사용
    const displayAnalysis = aiAutoResult?.description || "매우 위험한 소리가 감지되었습니다! 즉시 대피하십시오.";

    let displaySoundType = "위험 상황 발생";
    if (aiAutoResult) {
        if (aiAutoResult.riskLevel === 'DANGER') displaySoundType = aiAutoResult.description.split(' ')[0] || "🚨 긴급 위험 상황";
        else if (aiAutoResult.riskLevel === 'WARNING') displaySoundType = "⚠️ 주의 수준 소음";
        else displaySoundType = "✅ 상황 종료";
    }

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
        <div className="min-h-screen bg-[#fff1f2] flex flex-col relative overflow-hidden transition-colors duration-500">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <AuroraBackground isActive={isCurrentlyAnalyzing} color="red" />
            </div>

            <header className="bg-white/50 backdrop-blur-md border-b border-rose-100 px-4 py-4 pt-safe flex items-center justify-between shadow-sm z-20">
                <h1 className="text-lg font-bold text-rose-600/60 font-medium">SENSE-GUARD [위험]</h1>
                <div className="flex gap-2">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-rose-400">
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
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-28 h-28 bg-rose-500/70 rounded-full flex items-center justify-center shadow-lg shadow-rose-200"
                        >
                            <AlertCircle size={48} className="text-white" />
                        </motion.div>
                    </div>

                    <div className="w-full bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-md border border-rose-50 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Search size={16} className="text-rose-500" />
                            <h3 className="font-bold text-rose-900/60 text-sm">긴급 분석 보고서</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/30 text-center">
                                <p className="text-[10px] text-rose-600/50 mb-1 font-bold italic tracking-tighter">DANGER LEVEL: HIGH</p>
                                <p className="text-xl font-bold text-rose-950/60">{displaySoundType}</p>
                            </div>

                            <div className="p-4 bg-white/50 rounded-2xl border border-rose-50/50">
                                <p className="text-[10px] text-rose-500/60 font-bold mb-1">긴급 지침</p>
                                <p className="text-sm text-gray-800 leading-relaxed font-bold opacity-70">
                                    {isCurrentlyAnalyzing ? "위험 요소 식별 중..." : displayAnalysis}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-3 max-w-[320px]">
                        <button
                            onClick={startListening}
                            className="w-full bg-rose-500/80 text-white py-4 rounded-2xl text-base font-bold shadow-md hover:bg-rose-600/80 transition-all flex items-center justify-center gap-2"
                        >
                            확인했습니다
                        </button>

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

                        <button
                            onClick={() => window.location.href = 'tel:119'}
                            className="w-full bg-rose-600/20 text-rose-600 py-4 rounded-2xl text-lg font-bold shadow-sm border border-rose-200 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            <Phone size={22} />
                            119 긴급 신고
                        </button>
                    </div>

                    <p
                        onClick={() => setCurrentView('manual')}
                        className="mt-8 text-rose-700/40 text-xs font-bold border-b border-rose-700/20 cursor-pointer"
                    >
                        재난 행동 요령 보기
                    </p>
                </motion.div>
            </main>
        </div>
    );
};
