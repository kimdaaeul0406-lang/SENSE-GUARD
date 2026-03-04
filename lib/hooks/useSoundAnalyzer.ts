import { useState, useEffect, useRef } from 'react';

interface UseSoundAnalyzerProps {
    sensitivity: number;
    isAnalyzing: boolean;
    isAutoAnalyzing: boolean;
    currentView: string;
    onStatusChange: (status: string) => void;
    onThresholdExceeded: (sirenScore: number, detectedType?: LocalSoundType) => void;
}

// ─────────────────────────────────────────────
// 로컬 사운드 분류 타입
// ─────────────────────────────────────────────
export type LocalSoundType =
    | 'fire_alarm'   // 화재경보 (고주파 펄스)
    | 'ambulance'    // 구급차 사이렌 (Hi-Lo 교번)
    | 'firetruck'    // 소방차 사이렌 (느린 Wail)
    | 'police'       // 경찰차 사이렌 (빠른 Yelp)
    | 'siren'        // 일반 사이렌 (분류 불가)
    | 'loud_noise'   // 단순 고음량 소음
    | 'safe';        // 안전

export interface LocalDetectionResult {
    type: LocalSoundType;
    score: number;         // 0~100 확신도
    label: string;         // 한글 라벨
    description: string;   // 상세 설명
    isDanger: boolean;
}

// ─────────────────────────────────────────────
// 주파수 대역 정의 (Hz)
// ─────────────────────────────────────────────
const FREQ_BANDS = {
    fireAlarm: { low: 2500, high: 4200 },  // 화재경보음
    sirenCore: { low: 500, high: 1600 },  // 사이렌 핵심 대역
    sirenLow: { low: 500, high: 850 },  // 구급차 Lo음
    sirenHigh: { low: 850, high: 1400 },  // 구급차 Hi음 / 경찰차
    speech: { low: 200, high: 3000 },  // 음성 대역
} as const;

// ─────────────────────────────────────────────
// 피치 히스토리 분석 유틸
// ─────────────────────────────────────────────

/** 특정 대역의 지배 주파수(피크 빈) 에너지 반환 */
function getBandEnergy(data: Uint8Array, low: number, high: number, binSize: number): { energy: number; peakHz: number } {
    const startBin = Math.floor(low / binSize);
    const endBin = Math.min(Math.floor(high / binSize), data.length - 1);
    let totalEnergy = 0;
    let peakEnergy = 0;
    let peakBin = startBin;

    for (let i = startBin; i <= endBin; i++) {
        totalEnergy += data[i];
        if (data[i] > peakEnergy) {
            peakEnergy = data[i];
            peakBin = i;
        }
    }
    const count = endBin - startBin + 1;
    return {
        energy: count > 0 ? totalEnergy / count : 0,
        peakHz: peakBin * binSize,
    };
}

/** 히스토리 배열에서 변조 주파수(Hz)를 추정 */
function estimateModulationRate(history: number[], sampleIntervalMs: number): number {
    if (history.length < 10) return 0;
    // 영교차 횟수로 대략적인 진동 주기를 측정
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    let crossings = 0;
    for (let i = 1; i < history.length; i++) {
        if ((history[i - 1] - mean) * (history[i] - mean) < 0) crossings++;
    }
    // crossings / 2 = 완전한 사이클 수
    const totalTimeS = (history.length * sampleIntervalMs) / 1000;
    return (crossings / 2) / totalTimeS; // Hz
}

/** 히스토리의 표준편차 */
function stdDev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(variance);
}

// ─────────────────────────────────────────────
// ★ 핵심 분류 로직
// ─────────────────────────────────────────────
function classifyLocalSound(
    pitchHistory: number[],        // 사이렌 대역 피크 Hz 히스토리
    fireAlarmHistory: number[],    // 화재경보 대역 에너지 히스토리
    sirenBandEnergy: number,       // 현재 사이렌 대역 평균 에너지
    fireAlarmEnergy: number,       // 현재 화재경보 대역 평균 에너지
    volume: number,                // RMS 볼륨 0~100
    sampleIntervalMs: number,
): LocalDetectionResult {

    const SIREN_ENERGY_THRESH = 40;  // 사이렌 대역 에너지 최소 임계값
    const FIRE_ALARM_THRESH = 50;  // 화재경보 에너지 최소 임계값
    const LOUD_THRESH = 70;  // 단순 고음량 임계값

    // ── 1. 화재경보 검사 ──────────────────────
    // 특징: 2500~4200 Hz 강한 에너지 + 규칙적 on/off 펄스
    if (fireAlarmHistory.length >= 15) {
        const fireStd = stdDev(fireAlarmHistory);
        const fireAvg = fireAlarmHistory.reduce((a, b) => a + b, 0) / fireAlarmHistory.length;
        const modRate = estimateModulationRate(fireAlarmHistory, sampleIntervalMs);
        const isPulsed = modRate >= 0.5 && modRate <= 5.0;  // 0.5~5 Hz 펄스
        const isHighFreq = fireAvg > FIRE_ALARM_THRESH;

        if (isHighFreq && isPulsed && fireStd > 15) {
            const score = Math.min(100, (fireAvg / 128) * 60 + (isPulsed ? 40 : 0));
            return {
                type: 'fire_alarm',
                score,
                label: '🔥 화재 경보',
                description: `화재 경보음이 감지되었습니다! (${modRate.toFixed(1)} Hz 패턴)`,
                isDanger: true,
            };
        }
    }

    // ── 2. 사이렌류 검사 ──────────────────────
    if (sirenBandEnergy < SIREN_ENERGY_THRESH || pitchHistory.length < 20) {
        // 에너지 부족 → 큰 소리인지만 확인
        if (volume > LOUD_THRESH) {
            return {
                type: 'loud_noise',
                score: Math.min(100, volume),
                label: '⚡ 큰 소음',
                description: `큰 소음이 감지되었습니다. (볼륨 ${volume.toFixed(0)}%)`,
                isDanger: false,
            };
        }
        return { type: 'safe', score: 100 - volume, label: '✅ 안전', description: '일상적인 소리입니다.', isDanger: false };
    }

    // 사이렌 대역 데이터 분석
    const pitchStd = stdDev(pitchHistory);
    const modRate = estimateModulationRate(pitchHistory, sampleIntervalMs);
    const pitchAvg = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
    const pitchRange = Math.max(...pitchHistory) - Math.min(...pitchHistory);

    // 최근 절반의 평균 vs 앞 절반 평균 (Hi-Lo 교번 확인용)
    const half = Math.floor(pitchHistory.length / 2);
    const firstHalf = pitchHistory.slice(0, half);
    const secondHalf = pitchHistory.slice(half);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const halfDiff = Math.abs(firstAvg - secondAvg);

    // ── 3. 구급차 (Hi-Lo 패턴) ───────────────
    // 특징: 650~1000 Hz 두 피치 사이 교번, 변조율 0.8~2.5 Hz
    const isHiLo = modRate >= 0.8 && modRate <= 2.5
        && pitchStd > 80
        && pitchRange > 150
        && pitchAvg >= 600 && pitchAvg <= 1100;

    if (isHiLo) {
        const score = Math.min(100, 50 + pitchStd / 5);
        return {
            type: 'ambulance',
            score,
            label: '🚑 구급차 사이렌',
            description: `구급차 사이렌이 감지되었습니다. (Hi-Lo ${modRate.toFixed(1)} Hz, 피치차 ${pitchRange.toFixed(0)}Hz)`,
            isDanger: true,
        };
    }

    // ── 4. 경찰차 (Yelp 패턴) ────────────────
    // 특징: 600~1400 Hz, 빠른 변조 3~6 Hz
    const isYelp = modRate >= 2.5 && modRate <= 7.0
        && pitchStd > 60
        && pitchRange > 200
        && pitchAvg >= 600 && pitchAvg <= 1500;

    if (isYelp) {
        const score = Math.min(100, 45 + pitchStd / 4);
        return {
            type: 'police',
            score,
            label: '🚔 경찰차 사이렌',
            description: `경찰차 사이렌이 감지되었습니다. (Yelp ${modRate.toFixed(1)} Hz)`,
            isDanger: true,
        };
    }

    // ── 5. 소방차 (Wail 패턴) ────────────────
    // 특징: 500~1200 Hz, 느린 변조 0.2~1 Hz, 큰 피치 범위
    const isWail = modRate >= 0.15 && modRate <= 1.2
        && pitchStd > 100
        && pitchRange > 300
        && pitchAvg >= 450 && pitchAvg <= 1300;

    if (isWail) {
        const score = Math.min(100, 50 + pitchRange / 15);
        return {
            type: 'firetruck',
            score,
            label: '🚒 소방차 사이렌',
            description: `소방차 사이렌이 감지되었습니다. (Wail ${modRate.toFixed(2)} Hz, 피치범위 ${pitchRange.toFixed(0)}Hz)`,
            isDanger: true,
        };
    }

    // ── 6. 일반 사이렌 (분류 불가) ───────────
    // 사이렌 에너지는 충분하나 패턴 확인 불가
    const isSirenLike = pitchStd > 40 && sirenBandEnergy > SIREN_ENERGY_THRESH + 15;
    if (isSirenLike) {
        const score = Math.min(100, (sirenBandEnergy / 128) * 80);
        return {
            type: 'siren',
            score,
            label: '🚨 사이렌 감지',
            description: `사이렌 소리가 감지되었습니다. (에너지 ${sirenBandEnergy.toFixed(0)}, 변조 ${modRate.toFixed(1)} Hz)`,
            isDanger: true,
        };
    }

    // ── 7. 큰 소음 ───────────────────────────
    if (volume > LOUD_THRESH) {
        return {
            type: 'loud_noise',
            score: Math.min(100, volume),
            label: '⚡ 큰 소음',
            description: `큰 소음이 감지되었습니다. (볼륨 ${volume.toFixed(0)}%)`,
            isDanger: false,
        };
    }

    return { type: 'safe', score: 100 - volume, label: '✅ 안전', description: '일상적인 소리입니다.', isDanger: false };
}

// ─────────────────────────────────────────────
// 메인 훅
// ─────────────────────────────────────────────
export const useSoundAnalyzer = ({
    sensitivity,
    isAnalyzing,
    isAutoAnalyzing,
    currentView,
    onStatusChange,
    onThresholdExceeded,
}: UseSoundAnalyzerProps) => {
    const [isListening, setIsListening] = useState(false);
    const [soundLevel, setSoundLevel] = useState(0);
    const [localSirenScore, setLocalSirenScore] = useState(0);
    const [localDetection, setLocalDetection] = useState<LocalDetectionResult | null>(null);
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
    const frameCountRef = useRef(0);  // 분석 프레임 카운터

    // 사이렌 피치 히스토리 (최근 60프레임 ≈ 1초)
    const pitchHistoryRef = useRef<number[]>([]);
    // 화재경보 에너지 히스토리
    const fireAlarmHistoryRef = useRef<number[]>([]);

    // 샘플 간격 (requestAnimationFrame ≈ 60fps → ~16ms, 2프레임마다 처리)
    const SAMPLE_INTERVAL_MS = 32;
    const HISTORY_SIZE = 60;  // 약 2초 분량

    useEffect(() => { sensitivityRef.current = sensitivity; }, [sensitivity]);
    useEffect(() => { currentViewRef.current = currentView; }, [currentView]);

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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicPermission('granted');
            return stream;
        } catch (e: any) {
            console.warn('Standard mic request failed:', e.name);
            try {
                const finalStream = await (navigator.mediaDevices as any).getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true },
                });
                setMicPermission('granted');
                return finalStream;
            } catch (finalError: any) {
                console.error('Mic permission denied:', finalError.name);
                setMicPermission('denied');
                if (typeof window !== 'undefined' && (window as any).SGBridge) {
                    (window as any).SGBridge.postMessage('checkMicPermission');
                }
                return null;
            }
        }
    };

    const startListening = async () => {
        if (isListening) return;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) { console.error('AudioContext not supported'); return; }

        const audioContext = new AudioContextClass();

        try {
            let currentStream = micStream;
            if (!currentStream) {
                currentStream = await requestMicPermission();
                if (!currentStream) { audioContext.close(); return; }
                setMicStream(currentStream);
            }

            if (audioContext.state === 'suspended') await audioContext.resume();

            const source = audioContext.createMediaStreamSource(currentStream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 4096;  // 고해상도 FFT (주파수 정밀도 향상)
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
            pitchHistoryRef.current = [];
            fireAlarmHistoryRef.current = [];
            frameCountRef.current = 0;

            setIsListening(true);
            onStatusChange('safe');

            if ('wakeLock' in navigator) {
                try { await (navigator as any).wakeLock.request('screen'); } catch { /* 무시 */ }
            }

            analyzeSound();
        } catch (err) {
            console.error('Failed to start listening:', err);
            audioContext.close();
            setIsListening(false);
        }
    };

    const stopListening = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close().catch(() => { });
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            setMicStream(null);
        }
        setIsListening(false);
        setLocalDetection(null);
        onStatusChange('main');
        setSoundLevel(0);
        setLocalSirenScore(0);
    };

    const analyzeSound = () => {
        if (!analyserRef.current || !dataArrayRef.current) {
            animationFrameRef.current = requestAnimationFrame(analyzeSound);
            return;
        }

        frameCountRef.current++;

        // 2프레임마다 한 번씩 처리 (CPU 절약)
        if (frameCountRef.current % 2 !== 0) {
            animationFrameRef.current = requestAnimationFrame(analyzeSound);
            return;
        }

        analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);

        const sampleRate = audioContextRef.current?.sampleRate || 44100;
        const binSize = sampleRate / analyserRef.current.fftSize;

        // ── 볼륨(RMS) ──
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i] * dataArrayRef.current[i];
        }
        const rms = Math.sqrt(sum / dataArrayRef.current.length);
        const normalizedLevel = Math.min(100, (rms / 128) * 100);
        setSoundLevel(normalizedLevel);

        // ── 주파수 대역 에너지 추출 ──
        const sirenBand = getBandEnergy(dataArrayRef.current, FREQ_BANDS.sirenCore.low, FREQ_BANDS.sirenCore.high, binSize);
        const fireAlarmBand = getBandEnergy(dataArrayRef.current, FREQ_BANDS.fireAlarm.low, FREQ_BANDS.fireAlarm.high, binSize);

        // ── 히스토리 갱신 ──
        if (sirenBand.energy > 30) {
            pitchHistoryRef.current.push(sirenBand.peakHz);
            if (pitchHistoryRef.current.length > HISTORY_SIZE) pitchHistoryRef.current.shift();
        } else {
            // 에너지 없으면 히스토리 서서히 감소
            if (pitchHistoryRef.current.length > 0) pitchHistoryRef.current.shift();
        }

        fireAlarmHistoryRef.current.push(fireAlarmBand.energy);
        if (fireAlarmHistoryRef.current.length > HISTORY_SIZE) fireAlarmHistoryRef.current.shift();

        // ── 로컬 분류 실행 ──
        const result = classifyLocalSound(
            pitchHistoryRef.current,
            fireAlarmHistoryRef.current,
            sirenBand.energy,
            fireAlarmBand.energy,
            normalizedLevel,
            SAMPLE_INTERVAL_MS,
        );

        setLocalSirenScore(result.score);
        setLocalDetection(result);

        // ── 임계값 초과 시 상위 컴포넌트에 알림 ──
        if (!isAutoAnalyzing) {
            const now = Date.now();
            const volumeThreshold = 185 - sensitivityRef.current;
            const DANGER_SCORE = 65;   // 위험 판정 최소 점수
            const COOLDOWN_MS = 6000; // 재알림 쿨다운

            const isDangerDetected =
                result.isDanger && result.score >= DANGER_SCORE
                || normalizedLevel > volumeThreshold;

            if (isDangerDetected && (now - lastLoudTimeRef.current > COOLDOWN_MS)) {
                if (currentViewRef.current === 'safe') {
                    console.log(`[LOCAL] 위험 감지! 종류: ${result.type}, 점수: ${result.score.toFixed(1)}, 볼륨: ${normalizedLevel.toFixed(1)}`);
                    onThresholdExceeded(result.score, result.type);
                    lastLoudTimeRef.current = now;
                }
            }

            // 주의 단계에서 안전 복귀
            if (currentViewRef.current === 'warning' && !isAutoAnalyzing) {
                if (now - lastLoudTimeRef.current > 8000 && normalizedLevel < 30) {
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
        localDetection,     // ★ 새로 추가: 상세 분류 결과
        isOffline,
        micPermission,
        startListening,
        stopListening,
        micStream,
    };
};
