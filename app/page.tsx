'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

import { usePersistentSettings } from '../lib/hooks/usePersistentSettings';
import { useSoundAnalyzer } from '../lib/hooks/useSoundAnalyzer';
import { useAIProcessor } from '../lib/hooks/useAIProcessor';
import { useNotifications } from '../lib/hooks/useNotifications';

import { IntroView } from '../components/IntroView';
import { GuardianSetupView } from '../components/GuardianSetupView';

export default function Home() {
  const [currentView, setCurrentView] = useState('intro');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastStateChangeTimeRef = useRef(0);

  const {
    user, setUser,
    guardianPhone, setGuardianPhone,
    sensitivity, setSensitivity,
    notifications, setNotifications,
    notificationTypes, setNotificationTypes,
    notificationMethod, setNotificationMethod,
    notificationHistory, setNotificationHistory,
    isDarkMode, setIsDarkMode,
    isColorBlindMode, setIsColorBlindMode,
    hasSeenIntro, setHasSeenIntro,
    isSettingsLoaded
  } = usePersistentSettings();

  const {
    aiAnalysisResult,
    setAiAnalysisResult,
    isAutoAnalyzing,
    isAnalyzing,
    aiError,
    performAutoAnalysis,
    performManualAnalysis
  } = useAIProcessor();

  const {
    sendSystemNotification,
    playAlertSound,
    vibrateDevice
  } = useNotifications();

  const triggerNotification = (view: string) => {
    if (!notifications) return;
    if (view !== 'warning' && view !== 'danger') return;

    if (notificationMethod.sound) {
      playAlertSound(view as 'warning' | 'danger', isColorBlindMode);
    }

    if (notificationMethod.vibration) {
      vibrateDevice(view === 'danger', isColorBlindMode);
    }

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
    const priority: { [key: string]: number } = {
      'main': 0, 'settings': 0, 'safe': 1, 'warning': 2, 'danger': 3
    };

    const currentPriority = priority[currentView] || 0;
    const newPriority = priority[newView] || 0;

    if (newPriority > currentPriority) {
      setCurrentView(newView);
      lastStateChangeTimeRef.current = Date.now();
      triggerNotification(newView);
    }
  };

  // 현재 뷰를 참조하기 위한 Ref 추가 (콜백 안에서 쓰기 위함)
  const currentViewRef = useRef(currentView);
  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  const lastLoudTimeRef = useRef(0);

  const {
    isListening,
    soundLevel,
    localSirenScore,
    localDetection,
    isOffline,
    micPermission,
    startListening,
    stopListening,
    micStream
  } = useSoundAnalyzer({
    sensitivity,
    isAnalyzing,
    isAutoAnalyzing,
    currentView,
    onStatusChange: (newView) => setCurrentView(newView),
    onThresholdExceeded: (score, detectedType) => {
      if (isAutoAnalyzing) {
        console.log("[SENSE-GUARD] AI analysis already in progress, ignoring threshold.");
        return;
      }

      const now = Date.now();
      lastLoudTimeRef.current = now;

      console.log(`[SENSE-GUARD] Threshold triggered! Score: ${score.toFixed(1)}, Type: ${detectedType}. Moving to Warning...`);

      // 1. 강제 전환 및 진동 (Hysteresis 적용하여 우선순위 보장)
      updateViewWithHysteresis('warning');

      // 2. 로컬 감지 결과가 이미 명확한 사이렌이면 즉시 DANGER 전환
      const localDangerTypes = ['fire_alarm', 'ambulance', 'firetruck', 'police', 'siren'];
      if (detectedType && localDangerTypes.includes(detectedType) && score >= 70) {
        console.log(`[SENSE-GUARD] Local detection confident (${detectedType}, ${score.toFixed(0)}). Jumping to DANGER.`);
        updateViewWithHysteresis('danger');
      }

      if (micStream) {
        console.log("[SENSE-GUARD] Triggering AI recording...");
        // 3. AI 분석 시작 (내부적으로 3초 녹음 수행)
        performAutoAnalysis(micStream, localSirenScore, (result) => {
          console.log("[SENSE-GUARD] AI Analysis Complete. Risk:", result.riskLevel);

          if (result.riskLevel === 'DANGER' || (localSirenScore > 75 && result.riskLevel !== 'SAFE')) {
            console.log(`[SENSE-GUARD] Moving to DANGER. AI: ${result.riskLevel}, Local: ${localSirenScore.toFixed(1)}`);
            updateViewWithHysteresis('danger');
          } else if (result.riskLevel === 'SAFE' || result.riskLevel === 'WARNING') {
            const delay = result.riskLevel === 'SAFE' ? 8000 : 12000;
            console.log(`[SENSE-GUARD] AI result is ${result.riskLevel}. Auto-reverting in ${delay / 1000}s...`);

            setTimeout(() => {
              if (currentViewRef.current === 'warning' || currentViewRef.current === 'danger') {
                if (Date.now() - lastLoudTimeRef.current > (delay - 1000)) {
                  console.log(`[SENSE-GUARD] Auto-recovery: Reverting to SafeView from ${result.riskLevel}.`);
                  setCurrentView('safe');
                }
              }
            }, delay);
          }
        });
      } else {
        console.error("[SENSE-GUARD] No mic stream available for AI analysis!");
      }
    }
  });

  // 디버그 모드 체크
  const [isDebug, setIsDebug] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsDebug(params.get('debug') === '1');
    }
  }, []);

  const handleConfirm = () => {
    setCurrentView('safe');
  };

  // 네이티브 앱용 브릿지 함수 전역 등록 (웹 로드 즉시 등록되도록 수정)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).SGAuth = {
        signInWithGoogleTokens: async (idToken: string, accessToken?: string) => {
          try {
            console.log("Bridge received tokens, loading firebase...");
            const { auth, signInWithCredential, GoogleAuthProvider } = await import('../lib/firebase');
            const credential = GoogleAuthProvider.credential(idToken, accessToken);
            const result = await signInWithCredential(auth, credential);

            if (result.user) {
              const userData = {
                id: result.user.uid,
                name: result.user.displayName || 'Google 사용자',
                email: result.user.email || '',
              };
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              if (typeof setCurrentView === 'function') {
                setCurrentView('main');
              }
            }
          } catch (err) {
            console.error("Bridge Login Error:", err);
          }
        }
      };

      // ✅ 안드로이드 웹뷰 권한 상태 강제 주입 (Shim)
      if (typeof (window as any).Notification !== 'undefined') {
        const OriginalNotification = (window as any).Notification;
        const ShimmedNotification = function (title: string, options?: any) {
          return new OriginalNotification(title, options);
        };
        ShimmedNotification.permission = 'granted';
        ShimmedNotification.requestPermission = () => Promise.resolve('granted' as NotificationPermission);
        ShimmedNotification.prototype = OriginalNotification.prototype;
        (window as any).Notification = ShimmedNotification;
      }
      if (typeof navigator.permissions !== 'undefined' && (navigator.permissions as any).query) {
        const originalQuery = navigator.permissions.query;
        (navigator.permissions as any).query = function (q: any) {
          if (['microphone', 'camera', 'notifications'].includes(q.name)) {
            return Promise.resolve({ state: 'granted', status: 'granted', onchange: null });
          }
          return originalQuery.call(navigator.permissions, q);
        };
      }

      // ✅ 웹의 에러를 플러터 디버그 콘솔로 전달하는 로거 (에러 객체 상세 출력)
      const originalError = console.error;
      console.error = function (...args) {
        const processedArgs = args.map(arg => {
          if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
          if (arg && typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch (e) { return String(arg); }
          }
          return String(arg);
        });

        if ((window as any).SGBridge) {
          (window as any).SGBridge.postMessage('WEB_ERROR: ' + processedArgs.join(' '));
        }
        originalError.apply(console, args);
      };

      console.log("✅ SenseGuard Bridge & Permission Shims Ready");
    }
  }, [setUser, setCurrentView]);

  const handleLogout = async () => {
    const { supabase } = await import('../lib/supabase');
    const { auth } = await import('../lib/firebase');
    await auth.signOut();
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
    setCurrentView('main');

    // 네이티브 앱에도 로그아웃 알림
    if (typeof window !== 'undefined' && (window as any).SGBridge) {
      (window as any).SGBridge.postMessage('logout');
    }
  };

  const handleBackFromSubView = () => {
    if (isListening) setCurrentView('safe');
    else setCurrentView('main');
  };

  if (!isSettingsLoaded) return null;

  return (
    <div className={`flex-1 flex flex-col ${currentView === 'intro' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'} ${isColorBlindMode ? 'color-blind-mode' : ''}`}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        setCurrentView={setCurrentView}
        user={user}
        onLogout={handleLogout}
        isListening={isListening}
      />

      {/* 디버그 오버레이 (Floating) */}
      {isDebug && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xs z-[9999] bg-black/80 text-white p-3 rounded-xl text-[10px] font-mono backdrop-blur-md border border-white/20">
          <div className="flex justify-between mb-1">
            <span>VIEW: <span className="text-yellow-400 font-bold uppercase">{currentView}</span></span>
            <span>NETWORK: {isOffline ? <span className="text-red-500 font-bold">OFFLINE</span> : <span className="text-emerald-500">ONLINE</span>}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-16">VOLUME:</span>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${soundLevel}%` }}></div>
              </div>
              <span className="w-6 text-right">{soundLevel.toFixed(0)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-16">LOCAL:</span>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400" style={{ width: `${localSirenScore}%` }}></div>
              </div>
              <span className="w-6 text-right">{localSirenScore.toFixed(0)}</span>
            </div>
            {localDetection && localDetection.type !== 'safe' && (
              <div className="mt-1 px-2 py-0.5 bg-rose-900/60 border border-rose-500 rounded text-rose-200 text-[9px]">
                {localDetection.label} ({localDetection.score.toFixed(0)}%)
              </div>
            )}
          </div>
          {isAutoAnalyzing && <div className="mt-2 text-center text-cyan-400 animate-pulse">● AI ANALYSIS IN PROGRESS...</div>}
          {aiError && <div className="mt-2 p-1 bg-red-900/50 text-red-100 border border-red-500 rounded whitespace-pre-wrap break-all">ERR: {aiError}</div>}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-1 flex flex-col"
        >
          {currentView === 'intro' && (
            <IntroView
              hasSeenIntro={hasSeenIntro}
              onComplete={(isGuest) => {
                setHasSeenIntro(true);
                if (isGuest) setCurrentView('main');
                else if (user) setCurrentView('main');
                else setCurrentView('auth');
              }}
            />
          )}

          {currentView === 'guardian-setup' && (
            <GuardianSetupView
              userName={user?.name || ""}
              onComplete={(phone) => {
                if (phone) setGuardianPhone(phone);
                setCurrentView('main');
              }}
            />
          )}

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
              stream={micStream}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              isColorBlindMode={isColorBlindMode}
              isAutoAnalyzing={isAutoAnalyzing}
              isOffline={isOffline}
              localDetection={localDetection}
            />
          )}
          {currentView === 'warning' && (
            <WarningView
              setCurrentView={setCurrentView}
              setSidebarOpen={setSidebarOpen}
              stopListening={stopListening}
              startListening={handleConfirm}
              onAnalyze={() => micStream ? performManualAnalysis(micStream, currentView) : Promise.resolve("마이크 꺼짐")}
              aiAutoResult={aiAnalysisResult}
              isAutoAnalyzing={isAutoAnalyzing}
              isColorBlindMode={isColorBlindMode}
            />
          )}
          {currentView === 'danger' && (
            <DangerView
              setCurrentView={setCurrentView}
              setSidebarOpen={setSidebarOpen}
              stopListening={stopListening}
              startListening={handleConfirm}
              onAnalyze={() => micStream ? performManualAnalysis(micStream, currentView) : Promise.resolve("마이크 꺼짐")}
              aiAutoResult={aiAnalysisResult}
              isAutoAnalyzing={isAutoAnalyzing}
              guardianPhone={guardianPhone}
              isColorBlindMode={isColorBlindMode}
              localDetection={localDetection}
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
              onDeleteNotification={(id) => setNotificationHistory(prev => prev.filter(item => item.id !== id))}
              sensitivity={sensitivity}
              setSensitivity={setSensitivity}
              guardianPhone={guardianPhone}
              setGuardianPhone={setGuardianPhone}
              isColorBlindMode={isColorBlindMode}
              setIsColorBlindMode={setIsColorBlindMode}
            />
          )}
          {currentView === 'auth' && (
            <AuthView
              setCurrentView={setCurrentView}
              onLoginSuccess={(userData) => {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                if (!guardianPhone) setCurrentView('guardian-setup');
                else setCurrentView('main');
              }}
            />
          )}
          {currentView === 'shelter' && (
            <ShelterView
              setCurrentView={setCurrentView}
              setSidebarOpen={setSidebarOpen}
              onBack={handleBackFromSubView}
            />
          )}
          {['intro', 'terms', 'help', 'how-it-works'].includes(currentView) && (
            <InfoView
              setCurrentView={setCurrentView}
              type={currentView as any}
              onBack={handleBackFromSubView}
            />
          )}
          {currentView === 'manual' && (
            <ManualView
              setCurrentView={setCurrentView}
              onBack={handleBackFromSubView}
              isColorBlindMode={isColorBlindMode}
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
        </motion.div>
      </AnimatePresence>

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
              
              .color-blind-mode {
                  --cb-text-scale: 1.1;
                  --cb-border-width: 2px;
              }
              
              .color-blind-mode p, 
              .color-blind-mode span:not(.lucide), 
              .color-blind-mode h1, 
              .color-blind-mode h2, 
              .color-blind-mode h3 {
                  letter-spacing: -0.02em;
                  text-shadow: none !important;
              }

              .color-blind-mode button {
                  border-width: var(--cb-border-width) !important;
                  font-size: calc(100% * var(--cb-text-scale)) !important;
              }

              .color-blind-mode .text-sm { font-size: 0.95rem !important; }
              .color-blind-mode .text-xs { font-size: 0.85rem !important; }
              .color-blind-mode .text-base { font-size: 1.1rem !important; }
              .color-blind-mode .text-lg { font-size: 1.25rem !important; }
              .color-blind-mode .text-xl { font-size: 1.4rem !important; }
              .color-blind-mode .text-4xl { font-size: 2.5rem !important; font-weight: 900 !important; }
          `}</style>
    </div>
  );
}
