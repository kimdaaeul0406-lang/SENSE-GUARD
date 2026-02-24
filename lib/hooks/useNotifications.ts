import { useRef } from 'react';

export const useNotifications = () => {
    const sendSystemNotification = (title: string, body: string, isUrgent: boolean = false) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const options: any = {
                body,
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                tag: 'sense-guard-alert',
                renotify: true,
                requireInteraction: isUrgent,
            };

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
                new Notification(title, options);
            }
        }
    };

    const playAlertSound = (type: 'warning' | 'danger', isColorBlindMode: boolean = false) => {
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            // 색약 모드일 때는 더 날카롭고 명확한 주파수 사용
            if (isColorBlindMode) {
                osc.type = type === 'danger' ? 'square' : 'sawtooth';
                osc.frequency.setValueAtTime(type === 'danger' ? 1000 : 500, ctx.currentTime);
            } else {
                osc.type = type === 'danger' ? 'square' : 'sine';
                osc.frequency.setValueAtTime(type === 'danger' ? 880 : 440, ctx.currentTime);
            }

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            osc.start();

            const duration = type === 'danger' ? 1.0 : 0.5;
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.error("Audio notification failed", e);
        }
    };

    const vibrateDevice = (isUrgent: boolean = false, isColorBlindMode: boolean = false) => {
        if ('vibrate' in navigator) {
            if (isUrgent) {
                // 위험 상황: 색약 모드일 때 더 길고 강한 3단 진동
                navigator.vibrate(isColorBlindMode ? [800, 100, 800, 100, 800] : [500, 200, 500, 200, 500]);
            } else {
                // 주의 상황: 색약 모드일 때 더 규칙적인 진동
                navigator.vibrate(isColorBlindMode ? [300, 150, 300] : [200, 100, 200]);
            }
        }
    };

    return {
        sendSystemNotification,
        playAlertSound,
        vibrateDevice
    };
};
