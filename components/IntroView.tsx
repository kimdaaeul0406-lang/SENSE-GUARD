import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Mic, Search, Bell, AlertTriangle } from 'lucide-react';

interface IntroViewProps {
    onComplete: (isGuest: boolean) => void;
    hasSeenIntro: boolean;
}

export const IntroView: React.FC<IntroViewProps> = ({ onComplete, hasSeenIntro }) => {
    const [step, setStep] = useState<'splash' | 'guide1' | 'guide2' | 'guide3' | 'finish'>(
        hasSeenIntro ? 'splash' : 'splash'
    );
    const [page, setPage] = useState(0);

    useEffect(() => {
        if (step === 'splash') {
            const timer = setTimeout(() => {
                if (hasSeenIntro) {
                    onComplete(false); // 재방문자는 스플래시 후 메인으로
                } else {
                    setStep('guide1');
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step, hasSeenIntro, onComplete]);

    const guides = [
        {
            icon: <Mic size={80} className="text-emerald-500" />,
            title: "실시간 소리 감지",
            desc: "주변의 위험한 소리를 실시간으로 감지하고 화재, 사이렌 등을 즉시 식별합니다.",
            color: "bg-emerald-50"
        },
        {
            icon: <Search size={80} className="text-blue-500" />,
            title: "지능형 AI 분석",
            desc: "감지된 소리를 AI가 정밀 분석하여 상황에 맞는 행동 지침을 실시간으로 제공합니다.",
            color: "bg-blue-50"
        },
        {
            icon: <Bell size={80} className="text-rose-500" />,
            title: "긴급 상황 알림",
            desc: "위급 상황 시 등록된 비상 연락처로 알림을 전송하고 즉시 도움을 요청할 수 있습니다.",
            color: "bg-rose-50"
        }
    ];

    const handleNext = () => {
        if (page < guides.length - 1) {
            setPage(page + 1);
            if (page === 0) setStep('guide2');
            else if (page === 1) setStep('guide3');
        } else {
            setStep('finish');
        }
    };

    if (step === 'splash') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-200 mb-6">
                        <ShieldCheck size={56} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">SENSE-GUARD</h1>
                    <p className="text-gray-400 font-medium">세상을 듣는 눈, 센스가드</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-16"
                >
                    <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </motion.div>
            </div>
        );
    }

    if (step === 'finish') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full max-w-sm text-center"
                >
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} className="text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">시작할 준비가 되셨나요?</h2>
                    <p className="text-gray-500 mb-10 leading-relaxed">
                        더 안전한 일상을 위해 센스가드가<br />
                        당신의 곁을 지키겠습니다.
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => onComplete(false)}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                            로그인 후 시작하기
                            <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => onComplete(true)}
                            className="w-full bg-gray-50 text-gray-600 font-bold py-4 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-all"
                        >
                            비회원으로 시작하기
                        </button>
                        <p className="text-[11px] text-gray-400">
                            ※ 비회원 이용 시 비상 연락 알림 및 기록 저장 기능이 제한됩니다.
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={page}
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -50, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center text-center max-w-sm"
                    >
                        <div className={`w-40 h-40 ${guides[page].color} rounded-full flex items-center justify-center mb-8`}>
                            {guides[page].icon}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">{guides[page].title}</h2>
                        <p className="text-gray-500 leading-relaxed font-medium">
                            {guides[page].desc}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-8 pb-16 flex flex-col items-center">
                <div className="flex gap-2 mb-8">
                    {guides.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${page === i ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full max-w-xs bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    {page === guides.length - 1 ? "이해했습니다" : "다음으로"}
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};
