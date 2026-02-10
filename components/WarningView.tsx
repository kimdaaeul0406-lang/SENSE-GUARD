import React from 'react';
import { Menu, AlertCircle, User } from 'lucide-react';

interface WarningViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    stopListening: () => void;
    onConfirm: () => void;
    onAnalyze: () => Promise<string>;
    aiAutoResult?: { riskLevel: string; description: string; action: string } | null;
}

export const WarningView: React.FC<WarningViewProps> = ({ setCurrentView, setSidebarOpen, stopListening, onConfirm, onAnalyze, aiAutoResult }) => {
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [analysisResult, setAnalysisResult] = React.useState<string | null>(null);

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

    return (
        <div className="h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col relative" suppressHydrationWarning>
            <header className="bg-white/80 backdrop-blur-md border-b border-amber-200 px-4 py-4 flex items-center justify-between shadow-sm flex-none">
                <h1 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">SENSE-GUARD</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-amber-50 rounded-full transition-colors">
                        <User size={24} className="text-amber-700" />
                    </button>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-amber-100 rounded-lg transition-colors">
                        <Menu size={22} className="text-amber-700" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center px-4 py-6 overflow-y-auto w-full">
                <div className="w-full max-w-md mx-auto flex flex-col items-center">
                    <div className="w-40 h-40 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full mb-4 flex items-center justify-center shadow-2xl animate-pulse-slow flex-shrink-0">
                        <AlertCircle size={80} className="text-white" strokeWidth={2} />
                    </div>

                    <h2 className="text-2xl font-bold text-amber-600 mb-1">주의</h2>
                    <p className="text-sm text-amber-700 text-center mb-4">
                        {aiAutoResult ? aiAutoResult.description : "주변 소리와 환경을 주의깊게 확인하세요"}
                    </p>

                    {/* AI 자동 분석 결과 카드 */}
                    {aiAutoResult && (
                        <div className="w-full bg-white rounded-xl shadow-lg border border-amber-200 p-4 mb-4">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-100">
                                <span className={`px-2 py-0.5 rounded-full text-white text-xs font-bold ${aiAutoResult.riskLevel === 'SAFE' ? 'bg-green-500' :
                                    aiAutoResult.riskLevel === 'DANGER' ? 'bg-red-500' : 'bg-amber-500'
                                    }`}>
                                    {aiAutoResult.riskLevel === 'SAFE' ? '안전' : aiAutoResult.riskLevel === 'DANGER' ? '위험' : '주의'}
                                </span>
                                <h3 className="text-sm font-bold text-gray-800">AI 자동 분석 결과</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 mb-1">감지된 소리</p>
                                    <p className="text-sm text-gray-800">{aiAutoResult.description}</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-lg">
                                    <p className="text-xs font-bold text-amber-700 mb-1">💡 행동 요령</p>
                                    <p className="text-sm text-amber-900 leading-snug">{aiAutoResult.action}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="w-full flex flex-col gap-2 mb-4">
                        <button
                            onClick={handleAnalyzeClick}
                            disabled={isAnalyzing}
                            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 rounded-xl text-sm font-semibold shadow-lg hover:from-amber-600 hover:to-yellow-600 transition-all disabled:opacity-50"
                        >
                            {isAnalyzing ? "소리 듣는 중..." : "AI에게 물어보기"}
                        </button>

                        <button
                            onClick={onConfirm}
                            className="w-full bg-white text-amber-600 border-2 border-amber-500 py-3 rounded-xl text-sm font-semibold shadow-lg hover:bg-amber-50 transition-all"
                        >
                            상황 확인 완료 (다시 감지)
                        </button>
                    </div>

                    {/* 자동 분석 결과 표시 영역 제거됨 */}
                    {isAnalyzing && (
                        <div className="text-xs text-amber-700 text-center w-full leading-relaxed mb-4 bg-white/60 backdrop-blur-sm p-3 rounded-xl animate-pulse">
                            AI가 소리를 듣고 분석 중입니다... (5초)
                        </div>
                    )}

                    {/* AI Analysis Result Inline */}
                    {analysisResult && !isAnalyzing && (() => {
                        let parsed = null;
                        try {
                            const cleanText = analysisResult.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
                            parsed = JSON.parse(cleanText);
                        } catch { }

                        if (parsed) {
                            return (
                                <div className="w-full bg-white rounded-xl shadow-lg border border-amber-200 p-4 mb-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
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
                                        <div className="bg-amber-50 p-3 rounded-lg">
                                            <p className="text-xs font-bold text-amber-700 mb-1">💡 행동 요령</p>
                                            <p className="text-sm text-amber-900 leading-snug">{parsed.action}</p>
                                        </div>
                                        {(parsed.riskLevel === 'SAFE' || analysisResult.includes('안전')) && (
                                            <button
                                                onClick={() => {
                                                    setAnalysisResult(null);
                                                    setCurrentView('safe');
                                                }}
                                                className="w-full mt-2 bg-green-600 text-white py-2 rounded-lg text-xs font-bold"
                                            >
                                                안전 화면으로 복귀
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        } else {
                            // Text fallback
                            return (
                                <div className="w-full bg-white rounded-xl shadow-lg border border-amber-200 p-4 mb-4">
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
                        onClick={stopListening}
                        className="text-amber-600 underline text-sm hover:text-amber-800 transition-colors"
                    >
                        소리 감지 완전히 끄기
                    </button>
                </div>
            </main>




        </div>
    );
};
