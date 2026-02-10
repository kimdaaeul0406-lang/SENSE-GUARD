import React, { useState } from 'react';
import { Menu, AlertTriangle, User, X, ChevronRight, FileText, Shield, MapPin, XCircle } from 'lucide-react';
import { safetyManuals } from '../data/safetyManuals';

interface DangerViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    stopListening: () => void;
    onConfirm: () => void;
    onAnalyze: () => Promise<string>;
    aiAutoResult?: { riskLevel: string; description: string; action: string } | null;
    guardianPhone?: string;
}

export const DangerView: React.FC<DangerViewProps> = ({ setCurrentView, setSidebarOpen, stopListening, onConfirm, onAnalyze, aiAutoResult, guardianPhone }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [showManual, setShowManual] = useState(false);
    const [selectedManualId, setSelectedManualId] = useState<string>('general');

    const handleAnalyzeClick = async () => {
        setIsAnalyzing(true);
        try {
            const result = await onAnalyze();
            setAnalysisResult(result || "소리 분석 결과를 받을 수 없습니다.");
        } catch {
            setAnalysisResult("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const currentManual = safetyManuals[selectedManualId] || safetyManuals['general'];

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex flex-col relative" suppressHydrationWarning>
            <header className="bg-white/80 backdrop-blur-md border-b border-red-200 px-4 py-4 flex items-center justify-between shadow-sm flex-none">
                <h1 className="text-lg font-bold bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">SENSE-GUARD</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-red-50 rounded-full transition-colors">
                        <User size={24} className="text-red-700" />
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                        <Menu size={22} className="text-red-700" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 py-6 overflow-y-auto w-full">
                <div className="w-full max-w-md mx-auto flex flex-col items-center">
                    <div className="w-40 h-40 bg-gradient-to-br from-red-500 to-rose-600 rounded-full mb-4 flex items-center justify-center shadow-2xl animate-pulse-fast">
                        <AlertTriangle size={80} className="text-white" strokeWidth={2} />
                    </div>

                    <h2 className="text-2xl font-bold text-red-600 mb-1">위험</h2>
                    <p className="text-sm text-red-700 text-center mb-4">
                        {aiAutoResult ? aiAutoResult.description : "위험한 상황이 감지되었습니다"}
                    </p>

                    <div className="w-full flex flex-col gap-2 mb-4">
                        {/* AI Analysis Result Inline */}
                        {analysisResult && !isAnalyzing && (() => {
                            let parsed = null;
                            try {
                                const cleanText = analysisResult.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                                parsed = JSON.parse(cleanText);
                            } catch { }

                            if (parsed) {
                                return (
                                    <div className="w-full bg-white rounded-xl shadow-lg border border-red-200 p-4 mb-2 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-100">
                                            <span className={`px-2 py-0.5 rounded-full text-white text-xs font-bold ${parsed.riskLevel === 'SAFE' ? 'bg-green-500' :
                                                parsed.riskLevel === 'DANGER' ? 'bg-red-500' : 'bg-amber-500'
                                                }`}>
                                                {parsed.riskLevel === 'SAFE' ? '안전' : parsed.riskLevel === 'DANGER' ? '위험' : '주의'}
                                            </span>
                                            <h3 className="text-sm font-bold text-gray-800">AI 분석 결과</h3>
                                            <button onClick={() => setAnalysisResult(null)} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 mb-1">감지된 소리</p>
                                                <p className="text-sm text-gray-800">{parsed.description}</p>
                                            </div>
                                            <div className="bg-red-50 p-3 rounded-lg">
                                                <p className="text-xs font-bold text-red-700 mb-1">💡 행동 요령</p>
                                                <p className="text-sm text-red-900 leading-snug">{parsed.action}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                // Text fallback
                                return (
                                    <div className="w-full bg-white rounded-xl shadow-lg border border-red-200 p-4 mb-2">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-sm font-bold text-gray-800">분석 결과</h3>
                                            <button onClick={() => setAnalysisResult(null)} className="text-gray-400">✕</button>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisResult}</p>
                                    </div>
                                );
                            }
                        })()}

                        <button
                            onClick={handleAnalyzeClick}
                            disabled={isAnalyzing}
                            className="w-full bg-gradient-to-r from-red-500 to-rose-500 text-white py-3 rounded-xl text-sm font-semibold shadow-lg hover:from-red-600 hover:to-rose-600 transition-all disabled:opacity-50"
                        >
                            {isAnalyzing ? "소리 듣는 중..." : "AI에게 물어보기"}
                        </button>

                        <button
                            onClick={onConfirm}
                            className="w-full bg-white text-red-600 border-2 border-red-500 py-3 rounded-xl text-sm font-semibold shadow-lg hover:bg-red-50 transition-all"
                        >
                            상황 확인 완료 (다시 감지)
                        </button>
                    </div>

                    {/* 매뉴얼 미리보기 카드 */}
                    <div className="w-full bg-white rounded-2xl p-4 mb-4 shadow-xl border-2 border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{currentManual.icon}</span>
                            <h3 className="font-bold text-gray-900 text-sm">{currentManual.title}</h3>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">
                            {currentManual.summary}
                        </p>
                        <button
                            onClick={() => setShowManual(true)}
                            className="w-full bg-gray-50 text-gray-800 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
                        >
                            <FileText size={14} />
                            자세한 대처 매뉴얼 보기
                            <ChevronRight size={14} />
                        </button>
                    </div>

                    {/* 빠른 액션 버튼들 */}
                    <div className="grid grid-cols-2 gap-2 mb-4 w-full">
                        <button
                            onClick={() => setCurrentView('manual')}
                            className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-800 py-3 rounded-xl font-bold hover:bg-red-500/30 transition-colors flex flex-col items-center justify-center gap-1"
                        >
                            <Shield size={20} />
                            <span className="text-xs">행동 요령</span>
                        </button>
                        <button
                            onClick={() => setCurrentView('shelter')}
                            className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-800 py-3 rounded-xl font-bold hover:bg-red-500/30 transition-colors flex flex-col items-center justify-center gap-1"
                        >
                            <MapPin size={20} />
                            <span className="text-xs">대피소 위치</span>
                        </button>
                    </div>

                    <div className="space-y-2 w-full">
                        <button
                            onClick={stopListening}
                            className="w-full bg-white text-red-600 border-2 border-transparent hover:border-red-100 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <XCircle size={18} />
                            오경보 알림 (중지)
                        </button>

                        <a
                            href="tel:119"
                            onClick={(e) => {
                                const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
                                if (!isMobile) {
                                    e.preventDefault();
                                    alert("[PC/웹 환경 알림]\n\n실제 모바일 기기에서는 119 전화 앱이 실행됩니다.");
                                } else {
                                    // Mobile Safety Check
                                    if (!window.confirm("⚠️ 정말로 119로 연결하시겠습니까?\n\n(연결 후 통화 버튼을 눌러야 신고가 접수됩니다)")) {
                                        e.preventDefault();
                                    }
                                }
                            }}
                            className="block w-full text-center bg-red-800 hover:bg-red-900 text-white/90 py-3 rounded-xl text-sm font-medium transition-colors"
                        >
                            119 신고 전화
                        </a>

                        {/* Guardian SOS Button */}
                        <button
                            onClick={() => {
                                if (!guardianPhone) {
                                    if (window.confirm('보호자 연락처가 설정되지 않았습니다.\n설정 화면으로 이동하시겠습니까?')) {
                                        setCurrentView('settings');
                                    }
                                    return;
                                }

                                // Mobile Check
                                const userAgent = navigator.userAgent.toLowerCase();
                                const isMobile = /iphone|ipad|ipod|android/i.test(userAgent);
                                const isIos = /iphone|ipad|ipod/i.test(userAgent);

                                const message = encodeURIComponent('🚨 [SENSE-GUARD 긴급 알림] \n지금 위험한 상황인 것 같습니다. 제 위치를 확인해주세요! \n(이 메시지는 청각장애인 안전 앱 SENSE-GUARD에서 발송되었습니다.)');

                                // iOS uses '&', Android/Others use '?'
                                const separator = isIos ? '&' : '?';
                                const link = `sms:${guardianPhone}${separator}body=${message}`;

                                // PC Logic
                                if (!isMobile) {
                                    const confirmed = window.confirm(
                                        `[PC/웹 환경 시뮬레이션]\n\n실제 모바일 환경에서는 보호자에게 문자를 보낼 수 있는 화면이 실행됩니다.\n\n수신번호: ${guardianPhone}\n내용: ${decodeURIComponent(message)}\n\n(확인을 누르면 SMS 프로토콜 실행을 시도합니다)`
                                    );
                                    if (confirmed) {
                                        window.location.href = link;
                                    }
                                } else {
                                    // Mobile Logic - Confirm before sending to prevent accidents? 
                                    // Since it just opens the SMS app, accidental clicks are less destructive than calls.
                                    // But let's add a simple confirm for safety.
                                    if (window.confirm(`보호자(${guardianPhone})에게 긴급 문자를 보내시겠습니까?`)) {
                                        window.location.href = link;
                                    }
                                }
                            }}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            🆘 보호자에게 연락하기 (문자)
                        </button>
                    </div>
                </div>
            </main>





            {/* Manual Modal */}
            {showManual && (
                <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl h-[85vh] sm:h-[80vh] flex flex-col">
                        <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between flex-shrink-0">
                            <h3 className="font-bold text-lg text-gray-900">비상 대처 매뉴얼</h3>
                            <button onClick={() => setShowManual(false)} className="bg-gray-100 p-1 rounded-full text-gray-500 hover:bg-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex overflow-x-auto p-2 gap-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                            {Object.values(safetyManuals).map((manual) => (
                                <button
                                    key={manual.id}
                                    onClick={() => setSelectedManualId(manual.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedManualId === manual.id
                                        ? 'bg-red-500 text-white shadow-md'
                                        : 'bg-white text-gray-600 border border-gray-200'
                                        }`}
                                >
                                    {manual.icon} {manual.title.split(' ')[0]}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto flex-1 bg-white">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-2xl">
                                    {currentManual.icon}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{currentManual.title}</h2>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <h4 className="text-sm font-bold text-red-500 mb-3 uppercase tracking-wider">핵심 행동 요령</h4>
                                    <ul className="space-y-3">
                                        {currentManual.steps.map((step, idx) => (
                                            <li key={idx} className="flex items-start gap-3 bg-red-50 p-3 rounded-xl">
                                                <span className="bg-white text-red-600 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-sm text-gray-800 font-medium leading-relaxed">{step}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section>
                                    <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">상세 정보</h4>
                                    <p className="text-sm text-gray-600 leading-7 whitespace-pre-line bg-gray-50 p-4 rounded-xl">
                                        {currentManual.details.trim()}
                                    </p>
                                </section>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                            <a
                                href="tel:119"
                                onClick={(e) => {
                                    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
                                    if (!isMobile) {
                                        e.preventDefault();
                                        alert("[PC/웹 환경 알림]\n\n실제 모바일 기기에서는 119 전화 앱이 실행됩니다.");
                                    } else {
                                        if (!window.confirm("⚠️ 정말로 119로 연결하시겠습니까?\n\n(연결 후 통화 버튼을 눌러야 신고가 접수됩니다)")) {
                                            e.preventDefault();
                                        }
                                    }
                                }}
                                className="block w-full bg-red-600 text-white py-4 rounded-xl font-bold text-center text-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                            >
                                🚨 119 긴급 신고하기
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
