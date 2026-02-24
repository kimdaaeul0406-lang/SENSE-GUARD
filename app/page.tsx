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

export default function Home() {
  const [currentView, setCurrentView] = useState('main');
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
      playAlertSound(view as 'warning' | 'danger');
    }

    if (notificationMethod.vibration) {
      vibrateDevice(view === 'danger');
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

  const {
    isListening,
    soundLevel,
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
    onThresholdExceeded: () => {
      updateViewWithHysteresis('warning');
      if (micStream) {
        performAutoAnalysis(micStream, (result) => {
          if (result.riskLevel === 'DANGER') updateViewWithHysteresis('danger');
          else if (result.riskLevel === 'WARNING') updateViewWithHysteresis('warning');
          else if (currentView === 'warning') setCurrentView('safe');
        });
      }
    }
  });

  const handleConfirm = () => {
    setCurrentView('safe');
  };

  const handleLogout = async () => {
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('user');
    setCurrentView('main');
  };

  const handleBackFromSubView = () => {
    if (isListening) setCurrentView('safe');
    else setCurrentView('main');
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

      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="min-h-screen"
        >
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
            />
          )}
          {currentView === 'auth' && (
            <AuthView
              setCurrentView={setCurrentView}
              onLoginSuccess={(userData) => {
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
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
            `}</style>
    </div>
  );
}
