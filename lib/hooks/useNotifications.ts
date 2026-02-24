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

    const playAlertSound = (type: 'warning' | 'danger') => {
        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = type === 'danger' ? 'square' : 'sine';
            osc.frequency.setValueAtTime(type === 'danger' ? 880 : 440, ctx.currentTime);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();

            const duration = type === 'danger' ? 0.8 : 0.4;
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.error("Audio notification failed", e);
        }
    };

    const vibrateDevice = (isUrgent: boolean = false) => {
        if ('vibrate' in navigator) {
            if (isUrgent) {
                navigator.vibrate([500, 200, 500, 200, 500]);
            } else {
                navigator.vibrate([200, 100, 200]);
            }
        }
    };

    return {
        sendSystemNotification,
        playAlertSound,
        vibrateDevice
    };
};
