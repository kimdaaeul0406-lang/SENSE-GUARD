import React, { useState } from 'react';
import { Menu, ShieldCheck, User, Moon, Sun } from 'lucide-react';

interface SafeViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    stopListening: () => void;
    soundLevel?: number; // Kept for backward compatibility, but prefer stream
    stream?: MediaStream | null; // New prop for direct visualization
}

export const SafeView: React.FC<SafeViewProps> = ({ setCurrentView, setSidebarOpen, stopListening, soundLevel = 0, stream }) => {
    const [isBlackScreen, setIsBlackScreen] = useState(false);

    // Direct DOM ref for high-performance animation
    const glowRef = React.useRef<HTMLDivElement>(null);

    // Animation Loop using local AudioContext (if stream provided)
    React.useEffect(() => {
        if (!stream) {
            return;
        }

        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);

        source.connect(analyser);
        analyser.fftSize = 256;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let animationId: number;

        const renderFrame = () => {
            analyser.getByteFrequencyData(dataArray);

            // Calculate RMS (Volume)
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            const rms = Math.sqrt(sum / dataArray.length);

            // Boost visual effect
            // Scale: 1 ~ 1.5
            const scale = 1 + (rms / 60);
            // Opacity: 0.3 ~ 0.8
            const opacity = 0.3 + (rms / 150);

            if (glowRef.current) {
                glowRef.current.style.transform = `scale(${scale})`;
                glowRef.current.style.opacity = `${opacity}`;
            }

            animationId = requestAnimationFrame(renderFrame);
        };

        renderFrame();

        return () => {
            cancelAnimationFrame(animationId);
            if (audioCtx.state !== 'closed') audioCtx.close();
        };
    }, [stream]);



    // Black Screen (Sleep Mode) Overlay
    if (isBlackScreen) {
        return (
            <div
                className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setIsBlackScreen(false)}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-20">
                    <ShieldCheck size={60} className="text-emerald-500 mb-4 animate-pulse" />
                    <p className="text-emerald-500 text-sm font-medium">SENSE-GUARD 작동 중</p>
                    <p className="text-emerald-500/60 text-xs mt-1">화면을 터치하면 해제됩니다</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex flex-col">
            <header className="bg-white/80 backdrop-blur-md border-b border-emerald-200 px-4 py-4 pt-safe flex items-center justify-between shadow-sm sticky top-0 z-20">
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">SENSE-GUARD</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-emerald-50 rounded-full transition-colors">
                        <User size={24} className="text-emerald-700" />
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
                        <Menu size={22} className="text-emerald-700" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 py-6 overflow-y-auto w-full">
                <div className="w-full max-w-md mx-auto flex flex-col items-center mt-4">
                    <div className="relative w-64 h-64 mb-4 flex items-center justify-center">
                        {/* Ambient Glow Background */}
                        <div
                            ref={glowRef}
                            className={`absolute w-48 h-48 rounded-full bg-emerald-400/40 filter blur-[60px] transition-all duration-100 ${!stream ? 'animate-pulse' : ''}`}
                            style={{
                                transform: !stream ? 'scale(1)' : undefined
                            }}
                        ></div>

                        {/* Main Shield Container - Glassmorphism Style */}
                        <div className="relative w-40 h-40 bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-xl border border-white/50 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-500/10 z-10 transition-transform duration-300">
                            {/* Inner detail for premium look */}
                            <div className="absolute inset-2 rounded-[2rem] border border-white/30 bg-gradient-to-br from-emerald-50/50 to-emerald-100/10" />

                            <ShieldCheck size={72} className="text-emerald-500 relative z-20 drop-shadow-sm" strokeWidth={1.5} />

                            {/* Status Indicator Dot */}
                            <div className="absolute bottom-4 right-4 w-3 h-3 bg-emerald-500 rounded-full animate-ping z-20 opacity-75"></div>
                            <div className="absolute bottom-4 right-4 w-3 h-3 bg-emerald-500 rounded-full z-20"></div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-emerald-600 mb-1">안전 감시 중</h2>
                    <p className="text-sm text-emerald-700 text-center mb-6">
                        주변 소리를 실시간으로 분석하고 있습니다.<br />
                        <span className="text-xs text-emerald-600/80">* 화면이 켜져 있어야 알림이 울립니다.</span>
                    </p>

                    <div className="w-full flex flex-col gap-3 mb-4">
                        <button
                            onClick={() => setIsBlackScreen(true)}
                            className="w-full bg-gray-900 text-emerald-400 py-4 rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 group border border-emerald-900/30"
                        >
                            <Moon size={18} className="group-hover:animate-pulse" />
                            화면 끄기 모드 (감지 유지)
                            <span className="text-[10px] bg-emerald-900/50 px-1.5 py-0.5 rounded text-emerald-300 ml-1">배터리 절약</span>
                        </button>

                        <button
                            onClick={stopListening}
                            className="w-full bg-white text-emerald-600 border-2 border-emerald-500 py-3 rounded-xl text-sm font-semibold shadow-lg hover:bg-emerald-50 transition-all"
                        >
                            소리 감지 중지
                        </button>

                        <button
                            onClick={() => setCurrentView('ai-chat')}
                            className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-3 rounded-xl text-sm font-semibold shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
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


                </div>
            </main>
        </div>
    );
};
