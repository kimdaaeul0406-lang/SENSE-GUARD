import { useState, useEffect, useRef } from 'react';

interface UseSoundAnalyzerProps {
    sensitivity: number;
    isAnalyzing: boolean;
    isAutoAnalyzing: boolean;
    currentView: string;
    onStatusChange: (newView: string) => void;
    onThresholdExceeded: () => void;
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
    const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending');

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const micStreamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastVisualUpdateTimeRef = useRef(0);
    const lastLoudTimeRef = useRef(0);
    const currentViewRef = useRef(currentView);
    const sensitivityRef = useRef(sensitivity);

    // Sync refs
    useEffect(() => {
        currentViewRef.current = currentView;
    }, [currentView]);

    useEffect(() => {
        sensitivityRef.current = sensitivity;
    }, [sensitivity]);

    const requestMicPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicPermission('granted');
            return stream;
        } catch {
            setMicPermission('denied');
            return null;
        }
    };

    const startListening = async () => {
        const stream = await requestMicPermission();
        if (!stream) {
            alert("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.");
            return;
        }

        micStreamRef.current = stream;
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        audioContextRef.current = new AudioContextClass();

        if (!audioContextRef.current) return;

        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);

        setIsListening(true);
        onStatusChange('safe');
        analyzeSoundLevel();
    };

    const stopListening = () => {
        console.log("--- STOPPING SOUND ANALYSIS ---");
        if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log("Track stopped:", track.label);
            });
            micStreamRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().then(() => {
                console.log("AudioContext closed successfully");
            });
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setIsListening(false);
        setSoundLevel(0);
        onStatusChange('main');
    };

    const analyzeSoundLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const sum = dataArray.reduce((acc, val) => acc + val * val, 0);
        const rms = Math.sqrt(sum / dataArray.length);

        const baseThreshold = 165 - sensitivityRef.current;
        const normalizedLevel = Math.min(100, (rms / baseThreshold) * 100);

        const now = Date.now();
        if (now - lastVisualUpdateTimeRef.current > 100) {
            setSoundLevel(normalizedLevel);
            lastVisualUpdateTimeRef.current = now;
        }

        if (!isAnalyzing) {
            if (normalizedLevel > 65) {
                const nowLoud = Date.now();
                // 2초 쿨다운 추가 및 중복 호출 방지
                if (currentViewRef.current !== 'danger' && currentViewRef.current !== 'warning' && (nowLoud - lastLoudTimeRef.current > 2000)) {
                    onThresholdExceeded();
                    lastLoudTimeRef.current = nowLoud;
                }
            }

            // Auto reset logic
            if (currentViewRef.current === 'warning') {
                if (Date.now() - lastLoudTimeRef.current > 10000 && !isAutoAnalyzing) {
                    onStatusChange('safe');
                }
            }
        }

        animationFrameRef.current = requestAnimationFrame(analyzeSoundLevel);
    };

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    return {
        isListening,
        soundLevel,
        micPermission,
        startListening,
        stopListening,
        micStream: micStreamRef.current
    };
};
