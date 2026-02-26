import { useState, useRef } from 'react';

interface AIResult {
    riskLevel: string;
    description: string;
    action: string;
}

export const useAIProcessor = () => {
    const [isAutoAnalyzing, setIsAutoAnalyzing] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState<AIResult | null>(null);

    const parseAIResult = (rawText: string): AIResult => {
        try {
            // Remove markdown code blocks
            let cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

            // Find the first '{' and last '}'
            const firstOpen = cleanedText.indexOf('{');
            const lastClose = cleanedText.lastIndexOf('}');

            if (firstOpen !== -1 && lastClose !== -1) {
                cleanedText = cleanedText.substring(firstOpen, lastClose + 1);
            }

            const data = JSON.parse(cleanedText);
            const normalizedRisk = (data.riskLevel || 'UNKNOWN').toUpperCase();
            return {
                riskLevel: normalizedRisk,
                description: data.description || '분석 결과를 파싱할 수 없습니다.',
                action: data.action || '상황을 확인해 주세요.'
            };
        } catch (parseErr) {
            console.warn("AI JSON Parse failed, falling back to keyword matching", parseErr);
            const upperResult = rawText.toUpperCase();

            if (upperResult.includes('DANGER') || upperResult.includes('위험') || upperResult.includes('경보')) {
                return {
                    riskLevel: 'DANGER',
                    description: '위험 소리가 감지되었습니다.',
                    action: '즉시 상황을 확인하세요.'
                };
            } else if (upperResult.includes('WARNING') || upperResult.includes('주의')) {
                return {
                    riskLevel: 'WARNING',
                    description: '주의가 필요한 소리입니다.',
                    action: '주위를 직접 확인하세요.'
                };
            } else {
                return {
                    riskLevel: 'SAFE',
                    description: '일상적인 소리입니다.',
                    action: '안전한 상태입니다.'
                };
            }
        }
    };

    const performAutoAnalysis = async (stream: MediaStream, localScore: number, onResult: (data: AIResult, isLocal?: boolean) => void) => {
        if (!stream || isAutoAnalyzing) return;

        setAiAnalysisResult(null); // 새로운 분석 시작 전 결과 초기화
        setIsAutoAnalyzing(true);
        console.log("Starting Auto AI Analysis...");

        try {
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: mimeType });
                const formData = new FormData();
                formData.append('audio', blob);
                formData.append('state', 'checking');

                try {
                    const res = await fetch('/api/analyze', { method: 'POST', body: formData });

                    if (!res.ok) throw new Error('Network error');

                    const rawData = await res.json();
                    console.log("--- AI RAW DATA RECEIVED ---", rawData);

                    if (rawData.error) throw new Error(rawData.error);

                    const result = parseAIResult(rawData.result);
                    console.log("Parsed Result:", result);

                    setAiAnalysisResult(result);
                    onResult(result);

                    // 위험 상황(DANGER)이면 쿨타임을 1초로 단축하여 더 빠르게 다음 소리 감지 준비
                    const cooldown = result.riskLevel === 'DANGER' ? 1000 : 2000;
                    setTimeout(() => {
                        setIsAutoAnalyzing(false);
                    }, cooldown);

                } catch (err) {
                    console.error("Auto AI Analysis failed", err);

                    // --- 로컬 엔진(Local Guardian) 백업 로직 ---
                    if (localScore > 60) {
                        const localResult: AIResult = {
                            riskLevel: 'DANGER',
                            description: `[로컬 패턴 감지] 인터넷이 연결되지 않았지만, 기기 자체 분석 결과 위험한 사이렌 소리(Score: ${localScore.toFixed(0)})가 감지되었습니다.`,
                            action: '즉시 주변 상황을 확인하고 안전한 곳으로 대피하세요.'
                        };
                        setAiAnalysisResult(localResult);
                        onResult(localResult, true);
                    } else {
                        const errorResult: AIResult = {
                            riskLevel: 'WARNING',
                            description: '현재 네트워크 연결이 원활하지 않아 분석이 지연되고 있습니다.',
                            action: '주변을 직접 확인하시고 위험이 감지되면 즉시 대피하세요.'
                        };
                        setAiAnalysisResult(errorResult);
                        onResult(errorResult);
                    }

                    setTimeout(() => {
                        setIsAutoAnalyzing(false);
                    }, 4000); // 에러 시에는 좀 더 긴 쿨타임
                }
            };

            mediaRecorder.start();
            // 5초로 녹음 시간 증가 (패턴 파악을 위해)
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 5000);
        } catch (e) {
            console.error("Auto Recorder Error", e);
            setIsAutoAnalyzing(false);
        }
    };

    const performManualAnalysis = async (stream: MediaStream, currentView: string): Promise<string> => {
        if (!stream) return "마이크가 켜져있지 않습니다.";

        setIsAnalyzing(true);
        await new Promise(r => setTimeout(r, 100));

        return new Promise<string>((resolve) => {
            try {
                const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
                const mediaRecorder = new MediaRecorder(stream, { mimeType });
                const chunks: Blob[] = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                mediaRecorder.onstop = async () => {
                    const blob = new Blob(chunks, { type: mimeType });
                    const formData = new FormData();
                    formData.append('audio', blob);
                    formData.append('state', currentView);

                    try {
                        const res = await fetch('/api/analyze', { method: 'POST', body: formData });

                        if (!res.ok) {
                            throw new Error('Network response was not ok');
                        }

                        const data = await res.json();

                        if (data.error) {
                            throw new Error(data.error);
                        }

                        const result = parseAIResult(data.result);

                        const riskText = result.riskLevel === 'DANGER' ? '심각 (🚨 즉시 대피 필요)'
                            : result.riskLevel === 'WARNING' ? '주의 (⚠️ 상황 주시)'
                                : '안전 (✅ 일상 소음)';

                        resolve(`1. 🔍 소리 분석: ${result.description}\n\n2. ⚠️ 위험 판단: ${riskText}\n\n3. ✅ 행동 가이드: ${result.action}`);
                    } catch (err) {
                        console.error("Manual analysis error:", err);
                        resolve(`1. 🔍 분석 불가: 인터넷 연결이 불안정하거나 서버 오류가 발생했습니다.\n\n2. ⚠️ 위험 판단: [확인 필요]\n\n3. ✅ 행동 가이드: 현재 소리를 직접 식별하기 어렵습니다. 주변 상황을 눈으로 직접 확인하시고, 위험이 느껴진다면 즉시 안전한 곳으로 이동하세요.`);
                    }
                };

                mediaRecorder.start();
                setTimeout(() => mediaRecorder.stop(), 5000);
            } catch (e) {
                resolve("오디오 녹음을 시작할 수 없거나 기기에서 지원하지 않는 형식입니다.");
            }
        }).finally(() => {
            setIsAnalyzing(false);
        });
    };

    return {
        aiAnalysisResult,
        setAiAnalysisResult,
        isAutoAnalyzing,
        isAnalyzing,
        performAutoAnalysis,
        performManualAnalysis
    };
};
