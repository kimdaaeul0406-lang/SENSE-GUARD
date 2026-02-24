import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, Search, ArrowRight, MessageCircle, Mic, Skull, Bell, Zap, Volume2 } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { motion, AnimatePresence } from 'framer-motion';

export const WarningView: React.FC<any> = ({
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

    // 소리 종류에 따른 아이콘 및 정보 결정
    const getSoundInfo = () => {
        const desc = aiAutoResult?.description || "";
        if (desc.includes("비명") || desc.includes("소리") || desc.includes("Scream")) {
            return { icon: <Volume2 size={120} />, label: "비명/외침 감지", color: "amber" };
        }
        if (desc.includes("유리") || desc.includes("Glass")) {
            return { icon: <Zap size={120} />, label: "파손음 감지", color: "amber" };
        }
        if (desc.includes("개") || desc.includes("짖는")) {
            return { icon: <Bell size={120} />, label: "동물 위협 감지", color: "amber" };
        }
        return { icon: <AlertTriangle size={120} />, label: "주의 상황 발생", color: "amber" };
    };

    const soundInfo = getSoundInfo();

    // 1단계: 직관적인 거대 아이콘 화면
    if (!showDetailed) {
        return (
            <div
                className="min-h-screen bg-[#fffbeb] flex flex-col items-center justify-center p-6 relative overflow-hidden cursor-pointer"
                onClick={() => !isCurrentlyAnalyzing && setShowDetailed(true)}
            >
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <AuroraBackground isActive={true} color="amber" />
                </div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 flex flex-col items-center text-center"
                >
                    <div className="mb-6">
                        <span className="bg-amber-500 text-white px-6 py-1.5 rounded-full text-sm font-black uppercase tracking-widest shadow-lg">
                            {isCurrentlyAnalyzing ? "ANALYZING" : "CAUTION"}
                        </span>
                    </div>

                    <h1 className="text-4xl font-black text-amber-600 mb-16 tracking-tighter">
                        {isCurrentlyAnalyzing ? "소리 분석 중..." : soundInfo.label}
                    </h1>

                    <motion.div
                        animate={isCurrentlyAnalyzing ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0]
                        } : {
                            scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-56 h-56 bg-white/60 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border border-white/50 mb-16"
                    >
                        {isCurrentlyAnalyzing ? (
                            <Search size={100} className="text-amber-400 animate-pulse" />
                        ) : (
                            <div className="text-amber-500">
                                {soundInfo.icon}
                            </div>
                        )}
                    </motion.div>

                    <p className="text-xl font-bold text-amber-900/70 mb-12 leading-tight h-14">
                        {isCurrentlyAnalyzing ? "주변의 큰 소리를\n파악하고 있습니다." : aiAutoResult?.description || "주변에서 큰 소리가\n감지되었습니다."}
                    </p>

                    {!isCurrentlyAnalyzing && (
                        <motion.div
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-amber-500 text-white px-10 py-5 rounded-3xl text-xl font-black shadow-xl flex items-center gap-3"
                        >
                            터치하여 확인하기 <ArrowRight size={24} />
                        </motion.div>
                    )}
                </motion.div>

                {isCurrentlyAnalyzing && (
                    <div className="absolute bottom-20 flex flex-col items-center gap-3">
                        <div className="w-12 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ x: [-48, 48] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-full h-full bg-amber-500 rounded-full"
                            />
                        </div>
                        <p className="text-amber-600/60 font-bold text-sm tracking-widest">SENSE-GUARD AI</p>
                    </div>
                )}
            </div>
        );
    }

    // 2단계: 원래의 상세 대처 화면
    const displayAnalysis = aiAutoResult?.description || "주변에서 큰 소리가 감지되었습니다. 주의가 필요합니다.";
    let displaySoundType = aiAutoResult?.description.split(' ')[0] || "⚠️ 주의 필요 소음";

    return (
        <div className="min-h-screen bg-[#fffbeb] flex flex-col relative overflow-hidden transition-colors duration-500">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <AuroraBackground isActive={false} color="amber" />
            </div>

            <header className="bg-white/50 backdrop-blur-md border-b border-amber-100 px-4 py-4 pt-safe flex items-center justify-between shadow-sm z-20">
                <button
                    onClick={() => setShowDetailed(false)}
                    className="p-2 hover:bg-amber-50 rounded-lg text-amber-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-amber-600/60 font-medium">상세 정보</h1>
                <div className="flex gap-2">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-400">
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
                    <div className="w-full bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-md border border-amber-50 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Search size={16} className="text-amber-400" />
                            <h3 className="font-bold text-amber-800/70 text-sm">AI 정밀 분석 결과</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/30 text-center">
                                <p className="text-[10px] text-amber-600/50 mb-1 font-bold uppercase tracking-wider">감지된 소리</p>
                                <p className="text-xl font-bold text-amber-900/60">{displaySoundType}</p>
                            </div>

                            <div className="p-4 bg-white/50 rounded-2xl border border-amber-50/50">
                                <p className="text-[10px] text-amber-500/60 font-bold mb-1">상태 보고</p>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                    {displayAnalysis}
                                </p>
                            </div>

                            {aiAutoResult?.action && (
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                                    <p className="text-[10px] text-blue-500/60 font-bold mb-1">권장 행동</p>
                                    <p className="text-sm text-blue-900/70 font-bold uppercase">
                                        {aiAutoResult.action}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full space-y-3 max-w-[320px]">
                        <button
                            onClick={startListening}
                            className="w-full bg-amber-400/80 text-white py-4 rounded-2xl text-base font-bold shadow-md hover:bg-amber-500/80 transition-all flex items-center justify-center gap-2"
                        >
                            안전 확인 완료
                        </button>

                        <button
                            onClick={() => setCurrentView('ai-chat')}
                            className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <MessageCircle size={18} />
                            AI 안전 도우미 채팅
                        </button>
                    </div>

                    <button
                        onClick={() => setCurrentView('manual')}
                        className="mt-8 text-amber-700/40 text-xs font-bold hover:underline"
                    >
                        행동 매뉴얼 보기 <ArrowRight size={14} className="inline ml-1" />
                    </button>
                </motion.div>
            </main>
        </div>
    );
};

const ArrowLeft = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
);

