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
            return {
                riskLevel: data.riskLevel || 'UNKNOWN',
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

    const performAutoAnalysis = async (stream: MediaStream, onResult: (data: AIResult) => void) => {
        if (!stream || isAutoAnalyzing) return;

        setIsAutoAnalyzing(true);
        console.log("Starting Auto AI Analysis...");

        try {
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', blob);
                formData.append('state', 'checking');

                try {
                    const res = await fetch('/api/analyze', { method: 'POST', body: formData });
                    const rawData = await res.json();
                    const result = parseAIResult(rawData.result);
                    setAiAnalysisResult(result);
                    onResult(result);
                } catch (err) {
                    console.error("Auto AI Analysis failed", err);
                } finally {
                    setTimeout(() => {
                        setIsAutoAnalyzing(false);
                    }, 2000);
                }
            };

            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), 3000);
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
                        const data = await res.json();
                        const result = parseAIResult(data.result);

                        const riskText = result.riskLevel === 'DANGER' ? '심각 (🚨 즉시 대피 필요)'
                            : result.riskLevel === 'WARNING' ? '주의 (⚠️ 상황 주시)'
                                : '안전 (✅ 일상 소음)';

                        resolve(`1. 🔍 소리 분석: ${result.description}\n\n2. ⚠️ 위험 판단: ${riskText}\n\n3. ✅ 행동 가이드: ${result.action}`);
                    } catch (err) {
                        resolve(`분석 중 오류가 발생했습니다: ${(err as Error).message}`);
                    }
                };

                mediaRecorder.start();
                setTimeout(() => mediaRecorder.stop(), 5000);
            } catch (e) {
                resolve("오디오 녹음을 시작할 수 없습니다.");
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
