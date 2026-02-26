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

  const {
    isListening,
    soundLevel,
    localSirenScore,
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
    onThresholdExceeded: (score) => {
      if (isAutoAnalyzing) return;

      console.log(`[SENSE-GUARD] Siren score ${score.toFixed(1)} detected! Entering analysis mode...`);
      updateViewWithHysteresis('warning');

      if (micStream) {
        performAutoAnalysis(micStream, localSirenScore, (result) => {
          console.log("[SENSE-GUARD] AI Decision:", result.riskLevel);

          if (result.riskLevel === 'DANGER') {
            updateViewWithHysteresis('danger');
          } else if (result.riskLevel === 'SAFE') {
            // AI가 안전하다고 판단하면 2.5초 뒤 안전화면으로 복원
            setTimeout(() => {
              setCurrentView(prev => (prev === 'warning' || prev === 'danger') ? prev : prev); // Prevents overriding manual changes
              if (currentViewRef.current === 'warning') {
                setCurrentView('safe');
              }
            }, 2500);
          }
          // WARNING일 경우 현재 노란 화면 유지
        });
      } else {
        // 스트림이 없는데 호출된 경우 안전을 위해 safe로 복구
        console.warn("No mic stream available for analysis. Falling back to Safe.");
        setCurrentView('safe');
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
              // safe 또는 main으로 이동
              if (typeof setCurrentView === 'function') {
                setCurrentView('main');
              }
            }
          } catch (err) {
            console.error("Bridge Login Error:", err);
          }
        }
      };
      console.log("✅ SenseGuard Bridge Ready (Immediate)");
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
    <main className={`min-h-screen relative overflow-hidden bg-slate-50 ${isColorBlindMode ? 'color-blind-mode' : ''}`} suppressHydrationWarning>
      <div className="max-w-md mx-auto h-screen relative flex flex-col">
        {/* 디버그 오버레이 */}
        {isDebug && (
          <div className="fixed bottom-24 left-4 right-4 z-[9999] bg-black/80 text-white p-3 rounded-xl text-[10px] font-mono backdrop-blur-md border border-white/20">
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
                <span className="w-16">LOCAL-AI:</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400" style={{ width: `${localSirenScore}%` }}></div>
                </div>
                <span className="w-6 text-right">{localSirenScore.toFixed(0)}</span>
              </div>
            </div>
            {isAutoAnalyzing && <div className="mt-2 text-center text-cyan-400 animate-pulse">● AI ANALYSIS IN PROGRESS...</div>}
          </div>
        )}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          setCurrentView={setCurrentView}
          user={user}
          onLogout={handleLogout}
          isListening={isListening}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="min-h-screen"
          >
            {currentView === 'intro' && (
              <IntroView
                hasSeenIntro={hasSeenIntro}
                onComplete={(isGuest) => {
                  setHasSeenIntro(true);
                  if (isGuest) {
                    setCurrentView('main');
                  } else if (user) {
                    setCurrentView('main');
                  } else {
                    setCurrentView('auth');
                  }
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
                  // 로그인 성공 시 보호자 번호가 없으면 설정 화면으로, 있으면 메인으로
                  if (!guardianPhone) {
                    setCurrentView('guardian-setup');
                  } else {
                    setCurrentView('main');
                  }
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
                
                /* 색약 보정 모드 전용 고대비 및 폰트 확대 스타일 */
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
    </main>
  );
}
