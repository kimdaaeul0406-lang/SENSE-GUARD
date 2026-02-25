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
    const [sirenScore, setSirenScore] = useState(0);
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
        analyzeSound();
    };

    const stopListening = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            setMicStream(null);
        }
        setIsListening(false);
        setSoundLevel(0);
        setSirenScore(0);
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

        // 피치가 주기적으로 변하는지 간단한 분산 계산
        let pitchVariance = 0;
        if (pitchHistoryRef.current.length > 20) {
            const avg = pitchHistoryRef.current.reduce((a, b) => a + b) / pitchHistoryRef.current.length;
            const variance = pitchHistoryRef.current.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b) / pitchHistoryRef.current.length;
            pitchVariance = Math.sqrt(variance);
        }

        const score = Math.min(100, (sirenBandEnergy / (endBin - startBin) / 2) + (pitchVariance / 10));
        setSirenScore(score);

        if (!isAutoAnalyzing) {
            const now = Date.now();
            const volumeThreshold = 165 - sensitivityRef.current;
            const sirenThreshold = 70;

            if ((normalizedLevel > volumeThreshold || score > sirenThreshold) && (now - lastLoudTimeRef.current > 3000)) {
                if (currentViewRef.current === 'safe') {
                    onThresholdExceeded(score);
                    lastLoudTimeRef.current = now;
                }
            }

            if (currentViewRef.current === 'warning' && !isAutoAnalyzing) {
                if (now - lastLoudTimeRef.current > 10000 && normalizedLevel < 30) {
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
        sirenScore,
        micPermission,
        startListening,
        stopListening,
        micStream
    };
};
