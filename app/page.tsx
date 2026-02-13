'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase, getNotificationHistory } from '../lib/supabase';
import { Sidebar } from '../components/Sidebar';
import { MainView } from '../components/MainView';
import { SafeView } from '../components/SafeView';
import { WarningView } from '../components/WarningView';
import { DangerView } from '../components/DangerView';
import { SettingsView } from '../components/SettingsView';
import { AuthView } from '../components/AuthView';
import { ShelterView } from '../components/ShelterView';
import { InfoView } from '../components/InfoView';
import { ManualView } from '../components/ManualView';
import { MyPageViewReloaded } from '../components/MyPageViewReloaded';
import { AIChatView } from '../components/AIChatView';
import { DisasterInfoView } from '../components/DisasterInfoView';

interface NotificationTypes {
  fire: boolean;
  earthquake: boolean;
  disaster: boolean;
  other: boolean;
  [key: string]: boolean;
}

export default function Home() {
  const [currentView, setCurrentView] = useState('main');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // soundLevel is used for logic and visualization
  const [soundLevel, setSoundLevel] = useState(0);

  // Sensitivity: 0 (Low) ~ 100 (High), Default: 65
  const [sensitivity, setSensitivity] = useState(65);
  const sensitivityRef = useRef(65);

  // Sync ref with state
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  const [micPermission, setMicPermission] = useState('pending');
  const [notifications, setNotifications] = useState(true);
  const [notificationTypes, setNotificationTypes] = useState<NotificationTypes>({
    fire: true,
    earthquake: true,
    disaster: true,
    other: false
  });
  const [notificationMethod, setNotificationMethod] = useState({
    screen: true,
    vibration: true,
    sound: true
  });

  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // Guardian Phone Number - Sync with DB and LocalStorage
  const [guardianPhone, setGuardianPhone] = useState('');

  // 1. Initial Load: Try DB first, then LocalStorage
  useEffect(() => {
    const loadPhone = async () => {
      // 1-1. If user is logged in, try DB
      if (user) {
        // Dynamically import to avoid server-side issues if any
        const { getGuardianPhone } = await import('../lib/supabase');
        const dbPhone = await getGuardianPhone(user.id);
        if (dbPhone) {
          setGuardianPhone(dbPhone);
          localStorage.setItem('guardianPhone', dbPhone); // Sync local
          return;
        }
      }

      // 1-2. Fallback to LocalStorage
      const savedPhone = localStorage.getItem('guardianPhone');
      if (savedPhone) setGuardianPhone(savedPhone);
    };
    loadPhone();
  }, [user]); // Re-run when user logs in

  // 2. Save: Save to both DB (if user exists) and LocalStorage
  useEffect(() => {
    if (!guardianPhone) return;

    // Save to LocalStorage
    localStorage.setItem('guardianPhone', guardianPhone);

    // Save to DB if user exists (Debounced slightly to avoid too many writes)
    const saveToDb = async () => {
      if (user) {
        const { upsertGuardianPhone } = await import('../lib/supabase');
        await upsertGuardianPhone(user.id, guardianPhone);
      }
    };

    // Simple debounce via timeout
    const timeoutId = setTimeout(saveToDb, 1000);
    return () => clearTimeout(timeoutId);
  }, [guardianPhone, user]);


  // Notification History State
  const [notificationHistory, setNotificationHistory] = useState<
    { id: string; date: string; type: string; message: string; color: string }[]
  >([]);

  // Load notification history from localStorage
  // Load data from DB when user changes
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          const history = await getNotificationHistory(user.id);
          const formattedHistory = history.map(h => ({
            id: h.id,
            date: new Date(h.created_at).toLocaleString(),
            type: h.type,
            message: h.message,
            color: h.color
          }));
          setNotificationHistory(formattedHistory);
        } catch (error) {
          console.error("Failed to load history:", error);
        }
      } else {
        setNotificationHistory([]);
      }
    };
    loadData();
  }, [user]);

  // Save notification history whenever it changes


  const handleDeleteNotification = (id: string) => {
    setNotificationHistory(prev => prev.filter(item => item.id !== id));
  };

  // Flag to ensure we don't overwrite localStorage with defaults on initial render
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Load Settings from LocalStorage on mount
  useEffect(() => {
    try {
      const savedSensitivity = localStorage.getItem('sensitivity');
      if (savedSensitivity) {
        setSensitivity(Number(savedSensitivity));
      }

      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

      const savedNotificationTypes = localStorage.getItem('notificationTypes');
      if (savedNotificationTypes) setNotificationTypes(JSON.parse(savedNotificationTypes));

      const savedNotificationMethod = localStorage.getItem('notificationMethod');
      if (savedNotificationMethod) {
        setNotificationMethod(JSON.parse(savedNotificationMethod));
      }
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setIsSettingsLoaded(true);
    }
  }, []);

  // Save Settings to LocalStorage when changed (only after initial load)
  useEffect(() => {
    if (isSettingsLoaded) {
      localStorage.setItem('sensitivity', sensitivity.toString());
    }
  }, [sensitivity, isSettingsLoaded]);

  useEffect(() => {
    if (isSettingsLoaded) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications, isSettingsLoaded]);

  useEffect(() => {
    if (isSettingsLoaded) {
      localStorage.setItem('notificationTypes', JSON.stringify(notificationTypes));
    }
  }, [notificationTypes, isSettingsLoaded]);

  useEffect(() => {
    if (isSettingsLoaded) {
      localStorage.setItem('notificationMethod', JSON.stringify(notificationMethod));
    }
  }, [notificationMethod, isSettingsLoaded]);

  // Optimize session check:
  // 1. Try restoring from LocalStorage first (Instant UI).
  // 2. Then check Supabase session (Source of Truth).
  useEffect(() => {
    // 1. LocalStorage Check
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // 2. Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '사용자',
          email: session.user.email || ''
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Only clear if we really want to log out.
        // If event is 'INITIAL_SESSION' and it's null, we might still have a valid local user from Firebase login.
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('user');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (userData: { id: string; name: string; email: string }) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
    setCurrentView('main');
  };

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Service Worker Registration + Notification Permission
  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('✅ Service Worker 등록 성공:', reg.scope);
      }).catch((err) => {
        console.error('❌ Service Worker 등록 실패:', err);
      });
    }

    // 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('🔔 알림 권한:', permission);
      });
    }
  }, []);

  // 시스템 알림 보내기 (다른 앱/탭 사용 중에도 표시)
  const sendSystemNotification = (title: string, body: string, isUrgent: boolean = false) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        tag: 'sense-guard-alert',
        renotify: true,
        requireInteraction: isUrgent,
      };

      // Service Worker가 있으면 SW를 통해 알림 (PWA 앱에서 더 안정적)
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            ...options,
            vibrate: isUrgent ? [500, 200, 500, 200, 500] : [200, 100, 200],
            actions: [
              { action: 'open', title: '확인하기' },
              { action: 'dismiss', title: '닫기' }
            ]
          });
        });
      } else {
        // Fallback: 일반 Notification API
        new Notification(title, options);
      }
    }
  };

  // Wake Lock Reference
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = wakeLock;
        console.log('💡 Screen Wake Lock active');

        wakeLock.addEventListener('release', () => {
          console.log('💡 Screen Wake Lock released');
        });
      } catch (err) {
        console.error(`${err} - Wake Lock request failed`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Re-acquire wake lock on visibility change (if it was active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isListening) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isListening]);

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
      // 권한 거부 시 알림 등 처리
      alert("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.");
      return;
    }

    // Wake Lock 요청 (화면 꺼짐 방지)
    requestWakeLock();

    micStreamRef.current = stream;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    audioContextRef.current = new AudioContextClass();

    if (!audioContextRef.current) return;

    analyserRef.current = audioContextRef.current.createAnalyser();

    const source = audioContextRef.current.createMediaStreamSource(stream);
    if (analyserRef.current) {
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
    }

    setIsListening(true);
    setCurrentView('safe');
    currentViewRef.current = 'safe'; // Explicitly sync ref
    analyzeSoundLevel();
  };

  const stopListening = () => {
    // Wake Lock 해제
    releaseWakeLock();
    // 위험 진동 중단
    stopDangerVibration();

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setCurrentView('main');
    currentViewRef.current = 'main';
    setSoundLevel(0);
  };

  // References for state management
  const lastStateChangeTimeRef = useRef(0);
  const currentViewRef = useRef('main'); // Tracks current view logic-side
  const lastLoudTimeRef = useRef(0); // Tracks last time sound was loud
  const isAnalyzingRef = useRef(false); // Tracks if AI analysis is in progress

  // Notification Logic
  const triggerNotification = (view: string) => {
    if (!notifications) return;

    // Only trigger for warning or danger
    if (view !== 'warning' && view !== 'danger') return;

    // 1. Vibration
    if (notificationMethod.vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
      // Danger: 3 long pulses, Warning: 2 short pulses
      const pattern = view === 'danger' ? [500, 200, 500, 200, 500] : [200, 100, 200];
      navigator.vibrate(pattern);
    }

    // 2. Sound (Beep)
    if (notificationMethod.sound) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine'; // Sine wave for cleaner sound, square for alarm
        if (view === 'danger') {
          osc.type = 'square'; // Harsh sound for danger
          osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch
        } else {
          osc.frequency.setValueAtTime(440, ctx.currentTime); // Medium pitch
        }

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();

        const duration = view === 'danger' ? 0.8 : 0.4;
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
        osc.stop(ctx.currentTime + duration);

      } catch (e) {
        console.error("Audio notification failed", e);
      }
    }

    // 3. 시스템 알림 (다른 앱/탭에 있을 때도 알려줌)
    if (notificationMethod.screen) {
      const isDanger = view === 'danger';
      sendSystemNotification(
        isDanger ? '🚨 위험 감지!' : '⚠️ 주의 필요',
        isDanger
          ? '위험한 소리가 감지되었습니다! 즉시 확인하세요.'
          : '주변에서 큰 소리가 감지되었습니다. 확인해 보세요.',
        isDanger
      );
    }
  };

  const updateViewWithHysteresis = (newView: string) => {
    const now = Date.now();
    const current = currentViewRef.current;

    // Define priority levels for comparison
    const priority: { [key: string]: number } = {
      'main': 0, 'settings': 0,
      'safe': 1,
      'warning': 2,
      'danger': 3
    };

    const currentPriority = priority[current] || 0;
    const newPriority = priority[newView] || 0;

    // 1. Upgrade: Immediate
    if (newPriority > currentPriority) {
      setCurrentView(newView);
      currentViewRef.current = newView;
      lastStateChangeTimeRef.current = now;

      // Trigger Notification
      triggerNotification(newView);

      // 위험 상태 진입 시 반복 진동 시작
      if (newView === 'danger') {
        startDangerVibration();
      }
      return;
    }

    // 2. Downgrade: Blocked automatically (Sticky State)
    if (newPriority < currentPriority) {
      return;
    }
  };

  // 위험 상태 반복 진동
  const dangerVibrationRef = useRef<NodeJS.Timeout | null>(null);

  const startDangerVibration = () => {
    // 기존 인터벌 정리
    stopDangerVibration();
    // 5초마다 진동 반복
    dangerVibrationRef.current = setInterval(() => {
      if (notificationMethod.vibration && navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
    }, 5000);
  };

  const stopDangerVibration = () => {
    if (dangerVibrationRef.current) {
      clearInterval(dangerVibrationRef.current);
      dangerVibrationRef.current = null;
    }
    // 진동 즉시 중단
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  const handleConfirm = () => {
    // Reset to safe state and update reference so new alarms can trigger
    stopDangerVibration(); // 진동 중단
    setCurrentView('safe');
    currentViewRef.current = 'safe';
    lastStateChangeTimeRef.current = Date.now();
  };

  // State for AI Analysis
  const isAutoAnalyzingRef = useRef(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{ riskLevel: string; description: string; action: string } | null>(null);

  // Function to perform AI analysis
  const performAiAnalysis = async () => {
    if (!micStreamRef.current || isAutoAnalyzingRef.current) return;

    isAutoAnalyzingRef.current = true;
    console.log("Starting AI Sound Analysis (5s)...");

    try {
      const mediaRecorder = new MediaRecorder(micStreamRef.current!, { mimeType: 'audio/webm' });
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
          const rawText = await res.json();

          let data;
          try {
            // Clean up potential markdown code blocks
            let cleanedText = rawText.result.replace(/```json/g, '').replace(/```/g, '').trim();

            const firstOpen = cleanedText.indexOf('{');
            const lastClose = cleanedText.lastIndexOf('}');

            if (firstOpen !== -1 && lastClose !== -1) {
              cleanedText = cleanedText.substring(firstOpen, lastClose + 1);
            }

            data = JSON.parse(cleanedText);
          } catch (parseErr) {
            console.error("JSON Parse failed", parseErr, rawText);
            const rawResult = rawText?.result || '';
            const upperResult = rawResult.toUpperCase();

            if (upperResult.includes('DANGER') || upperResult.includes('위험') || upperResult.includes('경보')) {
              data = {
                riskLevel: 'DANGER',
                description: '위험 소리가 감지되었습니다.',
                action: '즉시 상황을 확인하세요.'
              };
            } else if (upperResult.includes('WARNING') || upperResult.includes('주의')) {
              data = {
                riskLevel: 'WARNING',
                description: '주의가 필요한 소리입니다.',
                action: '주위를 직접 확인하세요.'
              };
            } else {
              data = {
                riskLevel: 'SAFE',
                description: '일상적인 소리입니다.',
                action: '안전한 상태입니다.'
              };
            }
          }

          console.log("AI Result:", data);
          setAiAnalysisResult(data);

          if (data.riskLevel === 'DANGER') {
            updateViewWithHysteresis('danger');
          } else if (data.riskLevel === 'WARNING') {
            updateViewWithHysteresis('warning');
          } else {
            // SAFE: If we are in warning, maybe auto-reset or let user confirm
            // For now, let's auto-reset if safe to avoid stuck warning
            if (currentViewRef.current === 'warning') {
              setCurrentView('safe');
              currentViewRef.current = 'safe';
            }
          }

        } catch (err) {
          console.error("AI Request Failed", err);
        } finally {
          // Cooldown 2 seconds (faster re-analysis for emergencies)
          setTimeout(() => {
            isAutoAnalyzingRef.current = false;
          }, 2000);
        }
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 3000); // Record for 3 seconds (enough for siren detection)
    } catch (e) {
      console.error("Recorder Error", e);
      isAutoAnalyzingRef.current = false;
    }
  };

  // State for visual throttling
  const lastVisualUpdateTimeRef = useRef(0);

  const analyzeSoundLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((acc, val) => acc + val * val, 0);
    const rms = Math.sqrt(sum / dataArray.length);

    // Dynamic threshold based on sensitivity
    // Sensitivity 65 (default) -> threshold 85
    // Sensitivity 100 -> threshold 50 (Very Sensitive)
    // Sensitivity 0 -> threshold 150 (Insensitive)
    const baseThreshold = 150 - sensitivityRef.current;

    // Normalize based on dynamic threshold
    const normalizedLevel = Math.min(100, (rms / baseThreshold) * 100);

    // [OPTIMIZATION] Throttle React State Updates for UI
    // Update UI only every 100ms (10fps) to prevent lag, instead of 60fps
    const now = Date.now();
    if (now - lastVisualUpdateTimeRef.current > 100) {
      setSoundLevel(normalizedLevel);
      lastVisualUpdateTimeRef.current = now;
    }

    // AI 분석 중이면 소리 감지 로직 건너뜀 (화면 전환 방지)
    if (!micStreamRef.current || isAnalyzingRef.current) return;

    // 소리 감지 로직은 60fps로 계속 실행 (반응 속도 유지)
    // 소리 레벨 임계값:
    // - 50 이상: 주의 상태로 전환 (외부 사이렌 소리도 감지 가능하도록)
    // - AI 분석을 통해 실제 위험 여부 판단
    if (normalizedLevel > 50) {
      if (currentViewRef.current !== 'danger' && currentViewRef.current !== 'warning') {
        updateViewWithHysteresis('warning');
        // 주의 상태 진입 시 자동 AI 분석 실행
        performAiAnalysis();
      }
      lastLoudTimeRef.current = Date.now(); // 시끄러운 시간 기록
    }

    // 자동 복귀 로직 (Auto Reset)
    // 주의(Warning) 상태이고, 10초(10000ms) 이상 소리가 조용하면(임계값 아래) 안전(Safe)으로 복귀
    // 단, AI 분석 중에는 복귀하지 않음!
    if (currentViewRef.current === 'warning') {
      if (Date.now() - lastLoudTimeRef.current > 10000
        && !isAutoAnalyzingRef.current
        && !isAnalyzingRef.current) {
        setCurrentView('safe');
        currentViewRef.current = 'safe';
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeSoundLevel);
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  // Function to perform AI analysis for manual trigger
  const analyzeAudio = async () => {
    if (!micStreamRef.current) return "마이크가 켜져있지 않습니다.";

    // 분석 시작 플래그 설정 (자동 화면 전환 방지)
    isAnalyzingRef.current = true;

    // [UI UX Improvement] Immediate feedback via promise wrapper isn't enough, 
    // the component handles the "Analyzing..." UI state.
    // However, we want to prevent UI lockup. MediaRecorder is generally async but can be heavy.
    // We'll add a small delay to let UI update before blocking work starts.
    await new Promise(r => setTimeout(r, 100));

    return new Promise<string>((resolve) => {
      try {
        // 아이폰 Safari 호환성 체크
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        const mediaRecorder = new MediaRecorder(micStreamRef.current!, { mimeType });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: mimeType }); // 감지된 MIME 타입 사용
          const formData = new FormData();
          formData.append('audio', blob);
          formData.append('state', currentView);

          try {
            const res = await fetch('/api/analyze', { method: 'POST', body: formData });

            if (!res.ok) {
              const errText = await res.text();
              throw new Error(`Server Error: ${res.status} ${errText}`);
            }

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Restore user-friendly formatting from JSON for Manual Check
            try {
              const cleanJson = data.result.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleanJson);

              const riskText = parsed.riskLevel === 'DANGER' ? '심각 (🚨 즉시 대피 필요)'
                : parsed.riskLevel === 'WARNING' ? '주의 (⚠️ 상황 주시)'
                  : '안전 (✅ 일상 소음)';

              const formattedResult = `1. 🔍 소리 분석: ${parsed.description}\n\n2. ⚠️ 위험 판단: ${riskText}\n\n3. ✅ 행동 가이드: ${parsed.action}`;

              // 위험 상황이면 즉시 화면 전환!
              if (parsed.riskLevel === 'DANGER') {
                updateViewWithHysteresis('danger');
              }

              resolve(formattedResult);
            } catch (parseError) {
              console.warn("Manual analysis parse error", parseError);
              const fallbackText = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
              resolve(fallbackText);
            }
          } catch (err) {
            console.error("Analysis Failed:", err);
            resolve(`분석 중 오류가 발생했습니다: ${(err as Error).message}`);
          }
        };

        mediaRecorder.start();
        setTimeout(() => mediaRecorder.stop(), 5000); // 5초 동안 녹음
      } catch (e) {
        console.error(e);
        resolve("오디오 녹음을 시작할 수 없습니다. 브라우저 설정을 확인해주세요.");
      }
    }).finally(() => {
      // 분석 종료 플래그 해제
      isAnalyzingRef.current = false;
      // 분석 끝난 직후 바로 안전으로 돌아가는 것 방지 (시끄러운 시간 리셋)
      lastLoudTimeRef.current = Date.now();
    });
  };

  const handleBackFromSubView = () => {
    // If actively listening, go to safe view (watcher will upgrade to warning/danger if still loud)
    if (isListening) {
      setCurrentView('safe');
      currentViewRef.current = 'safe'; // Sync ref
    } else {
      setCurrentView('main');
      currentViewRef.current = 'main';
    }
  };

  return (
    <div className="font-sans antialiased text-black" suppressHydrationWarning>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        setCurrentView={setCurrentView}
        user={user}
        onLogout={handleLogout}
        isListening={isListening}
      />

      {currentView === 'main' && (
        <MainView
          setCurrentView={setCurrentView}
          setSidebarOpen={setSidebarOpen}
          startListening={startListening}
        />
      )}
      {currentView === 'safe' && (
        <SafeView
          setCurrentView={setCurrentView}
          setSidebarOpen={setSidebarOpen}
          stopListening={stopListening}
          soundLevel={soundLevel}
          stream={micStreamRef.current}
        />
      )}
      {currentView === 'warning' && (
        <WarningView
          setCurrentView={setCurrentView}
          setSidebarOpen={setSidebarOpen}
          stopListening={stopListening}
          onConfirm={handleConfirm}
          onAnalyze={analyzeAudio}
          aiAutoResult={aiAnalysisResult}
          isAutoAnalyzing={isAutoAnalyzingRef.current}
        />
      )}
      {currentView === 'danger' && (
        <DangerView
          setCurrentView={setCurrentView}
          setSidebarOpen={setSidebarOpen}
          stopListening={stopListening}
          onConfirm={handleConfirm}
          onAnalyze={analyzeAudio}
          aiAutoResult={aiAnalysisResult}
          guardianPhone={guardianPhone}
        />
      )}
      {currentView === 'settings' && (
        <SettingsView
          setCurrentView={setCurrentView}
          setSidebarOpen={setSidebarOpen}
          isListening={isListening}
          micPermission={micPermission}
          notifications={notifications}
          setNotifications={setNotifications}
          notificationTypes={notificationTypes}
          setNotificationTypes={setNotificationTypes}
          notificationMethod={notificationMethod}
          setNotificationMethod={setNotificationMethod}
          notificationHistory={notificationHistory}
          onDeleteNotification={handleDeleteNotification}
          sensitivity={sensitivity}
          setSensitivity={setSensitivity}
          guardianPhone={guardianPhone}
          setGuardianPhone={setGuardianPhone}
        />
      )}
      {currentView === 'auth' && (
        <AuthView
          setCurrentView={setCurrentView}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {currentView === 'shelter' && (
        <ShelterView
          setCurrentView={setCurrentView}
          setSidebarOpen={setSidebarOpen}
          onBack={handleBackFromSubView}
        />
      )}
      {(currentView === 'intro' || currentView === 'terms' || currentView === 'help' || currentView === 'how-it-works') && (
        <InfoView
          setCurrentView={setCurrentView}
          type={currentView as 'intro' | 'terms' | 'help' | 'how-it-works'}
          onBack={handleBackFromSubView}
        />
      )}
      {currentView === 'manual' && (
        <ManualView
          setCurrentView={setCurrentView}
          onBack={handleBackFromSubView}
        />
      )}
      {currentView === 'mypage' && (
        <MyPageViewReloaded
          key="mypage-v2"
          setCurrentView={setCurrentView}
          user={user}
          onLogout={handleLogout}
          onBack={handleBackFromSubView}
        />
      )}
      {currentView === 'ai-chat' && (
        <AIChatView setCurrentView={setCurrentView} onBack={handleBackFromSubView} />
      )}
      {currentView === 'disaster-info' && (
        <DisasterInfoView setCurrentView={setCurrentView} onBack={handleBackFromSubView} />
      )}

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-pulse-fast {
          animation: pulse-fast 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
