import React, { useState, useEffect } from 'react';
import { AlertCircle, Shield, Search, ArrowRight, Phone, MessageCircle, Flame, Siren, AlertTriangle, ArrowLeft } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { motion, AnimatePresence } from 'framer-motion';

export const DangerView: React.FC<any> = ({
    setCurrentView,
    setSidebarOpen,
    startListening,
    aiAutoResult,
    isAutoAnalyzing
}) => {
    const [showDetailed, setShowDetailed] = useState(false);
    const [isLocalAnalyzing, setIsLocalAnalyzing] = useState(true);

    useEffect(() => {
        if (!isAutoAnalyzing) {
            const timer = setTimeout(() => setIsLocalAnalyzing(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isAutoAnalyzing]);

    const isCurrentlyAnalyzing = isAutoAnalyzing || isLocalAnalyzing;

    // 위험 종류별 아이콘 및 테마 결정
    const getDangerInfo = () => {
        const desc = aiAutoResult?.description || "";
        if (desc.includes("화재") || desc.includes("불") || desc.includes("Fire")) {
            return { icon: <Flame size={120} />, label: "화재 알람 감지", color: "red" };
        }
        if (desc.includes("사이렌") || desc.includes("구급차") || desc.includes("소방차") || desc.includes("경찰차") || desc.includes("Siren")) {
            return { icon: <Siren size={120} />, label: "긴급 사이렌 감지", color: "blue-red" };
        }
        return { icon: <AlertCircle size={120} />, label: "위험 상황 발생", color: "red" };
    };

    const dangerInfo = getDangerInfo();

    // 1단계: 직관적인 거대 아이콘 화면
    if (!showDetailed) {
        const isSiren = dangerInfo.color === 'blue-red';

        return (
            <div
                className="min-h-screen bg-[#fff1f2] flex flex-col items-center justify-center p-6 relative overflow-hidden cursor-pointer"
                onClick={() => !isCurrentlyAnalyzing && setShowDetailed(true)}
            >
                {/* 긴급 상태 배경 점멸 효과 */}
                <motion.div
                    animate={isSiren ? {
                        backgroundColor: ['#ef4444', '#3b82f6', '#ef4444'],
                        opacity: [0.1, 0.2, 0.1]
                    } : {
                        backgroundColor: '#ef4444',
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ duration: isSiren ? 1 : 1.5, repeat: Infinity }}
                    className="absolute inset-0 pointer-events-none"
                />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 flex flex-col items-center text-center w-full"
                >
                    <div className="mb-6">
                        <span className="bg-rose-600 text-white px-6 py-1.5 rounded-full text-sm font-black uppercase tracking-widest shadow-lg animate-pulse">
                            {isCurrentlyAnalyzing ? "ANALYZING" : "DANGER"}
                        </span>
                    </div>

                    <h1 className="text-4xl font-black text-rose-600 mb-16 tracking-tighter">
                        {isCurrentlyAnalyzing ? "긴급 분석 중..." : dangerInfo.label}
                    </h1>

                    <motion.div
                        animate={isCurrentlyAnalyzing ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        } : {
                            scale: [1, 1.1, 1],
                            rotate: isSiren ? [0, 5, -5, 0] : [0, 2, -2, 0]
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-56 h-56 bg-white/60 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/50 mb-16"
                    >
                        {isCurrentlyAnalyzing ? (
                            <Search size={100} className="text-rose-400 animate-pulse" />
                        ) : (
                            <div className={isSiren ? "text-blue-600" : "text-rose-600"}>
                                {dangerInfo.icon}
                            </div>
                        )}
                    </motion.div>

                    <p className="text-xl font-bold text-rose-950/70 mb-12 leading-tight h-14">
                        {isCurrentlyAnalyzing ? "극심한 소음이 들려서\n원인을 분석하고 있습니다." : aiAutoResult?.description || "매우 위험한 소리가\n감지되었습니다!"}
                    </p>

                    {!isCurrentlyAnalyzing && (
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-rose-600 text-white px-10 py-5 rounded-3xl text-xl font-black shadow-xl flex items-center gap-3 active:scale-95 transition-transform"
                        >
                            터치하여 대처하기 <ArrowRight size={24} />
                        </motion.div>
                    )}
                </motion.div>

                {isCurrentlyAnalyzing && (
                    <div className="absolute bottom-20 flex flex-col items-center gap-3">
                        <div className="w-12 h-1.5 bg-rose-200 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ x: [-48, 48] }}
                                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                className="w-full h-full bg-rose-600"
                            />
                        </div>
                        <p className="text-rose-600/60 font-bold text-sm tracking-widest uppercase">Emergency System</p>
                    </div>
                )}
            </div>
        );
    }

    // 2단계: 상세 대처 화면
    const displayAnalysis = aiAutoResult?.description || "매우 위험한 소리가 감지되었습니다! 즉시 대피하십시오.";
    let displaySoundType = aiAutoResult?.description.split(' ')[0] || "🚨 긴급 위험 상황";

    return (
        <div className="min-h-screen bg-[#fff1f2] flex flex-col relative overflow-hidden transition-colors duration-500">
            <header className="bg-white/50 backdrop-blur-md border-b border-rose-100 px-4 py-4 pt-safe flex items-center justify-between shadow-sm z-20">
                <button
                    onClick={() => setShowDetailed(false)}
                    className="p-2 hover:bg-rose-50 rounded-lg text-rose-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-rose-600/60 font-medium">긴급 조치 정보</h1>
                <div className="flex gap-2">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-rose-400">
                        <Shield size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center px-6 py-8 overflow-y-auto z-10 w-full">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-md flex flex-col items-center"
                >
                    <div className="w-full bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-md border border-rose-50 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Search size={16} className="text-rose-500" />
                            <h3 className="font-bold text-rose-900/60 text-sm">긴급 AI 분석 보고</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/30 text-center">
                                <p className="text-[10px] text-rose-600/50 mb-1 font-bold uppercase tracking-widest">위험 상태</p>
                                <p className="text-xl font-bold text-rose-950/60">{displaySoundType}</p>
                            </div>

                            <div className="p-4 bg-white/50 rounded-2xl border border-rose-50/50">
                                <p className="text-[10px] text-rose-500/60 font-bold mb-1">상황 설명</p>
                                <p className="text-sm text-gray-800 leading-relaxed font-semibold">
                                    {displayAnalysis}
                                </p>
                            </div>

                            {aiAutoResult?.action && (
                                <div className="p-4 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-100">
                                    <p className="text-[10px] text-rose-100/70 font-bold mb-1">긴급 조치 요령</p>
                                    <p className="text-base font-black leading-tight">
                                        {aiAutoResult.action}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full space-y-3 max-w-[320px]">
                        <button
                            onClick={startListening}
                            className="w-full bg-rose-500 text-white py-4 rounded-2xl text-base font-bold shadow-md hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                        >
                            안전 확인 완료
                        </button>

                        <button
                            onClick={() => setCurrentView('ai-chat')}
                            className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <MessageCircle size={18} />
                            AI 도움 요청하기
                        </button>

                        <button
                            onClick={() => window.location.href = 'tel:119'}
                            className="w-full bg-rose-600/10 text-rose-600 py-4 rounded-2xl text-lg font-black shadow-sm border border-rose-200 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            <Phone size={22} />
                            119 긴급 신고
                        </button>
                    </div>

                    <button
                        onClick={() => setCurrentView('manual')}
                        className="mt-8 text-rose-700/40 text-xs font-bold hover:underline"
                    >
                        재난 행동 요령 보기 <ArrowRight size={14} className="inline ml-1" />
                    </button>
                </motion.div>
            </main>
        </div>
    );
};

