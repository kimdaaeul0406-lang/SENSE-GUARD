import { useState, useEffect, useRef } from 'react';

interface UseSoundAnalyzerProps {
    sensitivity: number;
    isAnalyzing: boolean;
    isAutoAnalyzing: boolean;
    currentView: string;
    onStatusChange: (status: string) => void;
    onThresholdExceeded: (sirenScore: number) => void;
}

export const useSoundAnalyzer = ({
    sensitivity,
    isAnalyzing,
    isAutoAnalyzing,
    currentView,
    onStatusChange,
    onThresholdExceeded
}: UseSoundAnalyzerProps) => {
    const [isListening, setIsListening] = useState(false);
    const [soundLevel, setSoundLevel] = useState(0);
    const [localSirenScore, setLocalSirenScore] = useState(0);
    const [isOffline, setIsOffline] = useState(false);
    const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
    const [micStream, setMicStream] = useState<MediaStream | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const lastLoudTimeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);
    const sensitivityRef = useRef(sensitivity);
    const currentViewRef = useRef(currentView);

    // 사이렌 탐지를 위한 히스토리 (주기성 분석용)
    const pitchHistoryRef = useRef<number[]>([]);

    useEffect(() => {
        sensitivityRef.current = sensitivity;
    }, [sensitivity]);

    useEffect(() => {
        currentViewRef.current = currentView;
    }, [currentView]);

    // 온라인/오프라인 상태 감지
    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        setIsOffline(!navigator.onLine);
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    const requestMicPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
            setMicPermission('granted');
            return stream;
        } catch (e) {
            console.error("Mic permission error:", e);
            setMicPermission('denied');
            return null;
        }
    };

    const startListening = async () => {
        if (isListening) return;

        let currentStream = micStream;
        if (!currentStream) {
            currentStream = await requestMicPermission();
            if (!currentStream) return;
            setMicStream(currentStream);
        }

        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(currentStream);
        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;
        source.connect(analyser);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

        setIsListening(true);
        onStatusChange('safe');
        analyzeSound();
    };

    const stopListening = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
        }
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            setMicStream(null);
        }
        setIsListening(false);
        onStatusChange('main');
        setSoundLevel(0);
        setLocalSirenScore(0);
    };

    const analyzeSound = () => {
        if (!analyserRef.current || !dataArrayRef.current) {
            animationFrameRef.current = requestAnimationFrame(analyzeSound);
            return;
        }

        analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);

        // 1. 단순 볼륨 (RMS)
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i] * dataArrayRef.current[i];
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);
        const normalizedLevel = Math.min(100, (rms / 128) * 100);
        setSoundLevel(normalizedLevel);

        // 2. 사이렌 스코어링 (Siren Detection)
        const sampleRate = audioContextRef.current?.sampleRate || 44100;
        const binSize = sampleRate / analyserRef.current.fftSize;
        const startBin = Math.floor(600 / binSize);
        const endBin = Math.floor(1600 / binSize);

        let sirenBandEnergy = 0;
        let peakEnergy = 0;
        let peakBin = 0;

        for (let i = startBin; i < endBin; i++) {
            const energy = dataArrayRef.current![i];
            sirenBandEnergy += energy;
            if (energy > peakEnergy) {
                peakEnergy = energy;
                peakBin = i;
            }
        }

        // 도미넌트 주파수(피치) 추적하여 흔들림(Modulation) 감지
        const currentPitch = peakBin * binSize;
        if (peakEnergy > 50) {
            pitchHistoryRef.current.push(currentPitch);
            if (pitchHistoryRef.current.length > 50) pitchHistoryRef.current.shift();
        }

        // 피치가 주기적으로 변하는지 분산 계산 (사이렌의 특징)
        let pitchVariance = 0;
        if (pitchHistoryRef.current.length > 20) {
            const avg = pitchHistoryRef.current.reduce((a, b) => a + b) / pitchHistoryRef.current.length;
            const variance = pitchHistoryRef.current.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b) / pitchHistoryRef.current.length;
            pitchVariance = Math.sqrt(variance);
        }

        // 로컬 정밀 분석 스코어 (0~100)
        // 1. 특정 주파수 대역의 에너지
        // 2. 주파수의 변동성 (사이렌 특유의 위잉-위잉 소리)
        const bandScore = (sirenBandEnergy / (endBin - startBin) / 2);
        const modulationScore = Math.min(50, pitchVariance / 8);
        const finalScore = Math.min(100, bandScore + modulationScore);

        setLocalSirenScore(finalScore);

        if (!isAutoAnalyzing) {
            const now = Date.now();
            const volumeThreshold = 165 - sensitivityRef.current; // 민감도 65 기준 100 (상당히 큰 소리만 허용)
            const sirenThreshold = 75; // 기기 로컬 감지 민감도 대폭 강화 (확실한 패턴만)

            if ((normalizedLevel > volumeThreshold || finalScore > sirenThreshold) && (now - lastLoudTimeRef.current > 6000)) {
                if (currentViewRef.current === 'safe') {
                    console.log(`[ANALYZER] Threshold Exceeded! Vol: ${normalizedLevel.toFixed(1)}, Score: ${finalScore.toFixed(1)}`);
                    onThresholdExceeded(finalScore);
                    lastLoudTimeRef.current = now;
                }
            }

            // 분석 중이 아닐 때만 안전 복귀 로직 작동
            if (currentViewRef.current === 'warning' && !isAutoAnalyzing) {
                // 주의 단계 진입 후 최소 8초간 유지 (AI 분석 및 사용자 확인 보장)
                if (now - lastLoudTimeRef.current > 8000 && normalizedLevel < 30) {
                    console.log("[ANALYZER] Returning to safe state...");
                    onStatusChange('safe');
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(analyzeSound);
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
        };
    }, []);

    return {
        isListening,
        soundLevel,
        localSirenScore,
        isOffline,
        micPermission,
        startListening,
        stopListening,
        micStream
    };
};
