import { useState, useEffect } from 'react';
import { supabase, getNotificationHistory } from '../supabase';

interface NotificationTypes {
    fire: boolean;
    earthquake: boolean;
    disaster: boolean;
    other: boolean;
    [key: string]: boolean;
}

export const usePersistentSettings = () => {
    const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
    const [guardianPhone, setGuardianPhone] = useState('');
    const [sensitivity, setSensitivity] = useState(65);
    const [notifications, setNotifications] = useState(true);
    const [notificationTypes, setNotificationTypes] = useState<NotificationTypes>({
        fire: true,
        earthquake: true,
        disaster: true,
        other: false
    });
    const [notificationMethod, setNotificationMethod] = useState({
        screen: true,
        sound: true,
        vibration: true
    });
    const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isColorBlindMode, setIsColorBlindMode] = useState(false);
    const [hasSeenIntro, setHasSeenIntro] = useState(false);
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

    // Initial Load
    useEffect(() => {
        try {
            const savedSensitivity = localStorage.getItem('sensitivity');
            if (savedSensitivity) setSensitivity(Number(savedSensitivity));

            const savedNotifications = localStorage.getItem('notifications');
            if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

            const savedNotificationTypes = localStorage.getItem('notificationTypes');
            if (savedNotificationTypes) setNotificationTypes(JSON.parse(savedNotificationTypes));

            const savedNotificationMethod = localStorage.getItem('notificationMethod');
            if (savedNotificationMethod) setNotificationMethod(JSON.parse(savedNotificationMethod));

            const savedPhone = localStorage.getItem('guardianPhone');
            if (savedPhone) setGuardianPhone(savedPhone);

            const savedUser = localStorage.getItem('user');
            if (savedUser) setUser(JSON.parse(savedUser));

            const savedDarkMode = localStorage.getItem('isDarkMode');
            if (savedDarkMode) setIsDarkMode(JSON.parse(savedDarkMode));

            const savedColorBlind = localStorage.getItem('isColorBlindMode');
            if (savedColorBlind) setIsColorBlindMode(JSON.parse(savedColorBlind));

            const savedIntro = localStorage.getItem('hasSeenIntro');
            if (savedIntro) setHasSeenIntro(JSON.parse(savedIntro));
        } catch (e) {
            console.error("Failed to load settings:", e);
        } finally {
            setIsSettingsLoaded(true);
        }
    }, []);

    // Auth sync
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                const userData = {
                    id: session.user.id,
                    name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '사용자',
                    email: session.user.email || ''
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('user');
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // Load Guardian Phone from DB
    useEffect(() => {
        const loadPhone = async () => {
            if (user) {
                const { getGuardianPhone } = await import('../supabase');
                const dbPhone = await getGuardianPhone(user.id);
                if (dbPhone) {
                    setGuardianPhone(dbPhone);
                    localStorage.setItem('guardianPhone', dbPhone);
                }
            }
        };
        loadPhone();
    }, [user]);

    // Save Guardian Phone
    useEffect(() => {
        if (!guardianPhone) return;
        localStorage.setItem('guardianPhone', guardianPhone);
        const saveToDb = async () => {
            if (user) {
                const { upsertGuardianPhone } = await import('../supabase');
                await upsertGuardianPhone(user.id, guardianPhone);
            }
        };
        const timeoutId = setTimeout(saveToDb, 1000);
        return () => clearTimeout(timeoutId);
    }, [guardianPhone, user]);

    // Load Notification History
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

    // Persistence observers
    useEffect(() => {
        if (isSettingsLoaded) {
            localStorage.setItem('sensitivity', sensitivity.toString());
            localStorage.setItem('notifications', JSON.stringify(notifications));
            localStorage.setItem('notificationTypes', JSON.stringify(notificationTypes));
            localStorage.setItem('notificationMethod', JSON.stringify(notificationMethod));
            localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
            localStorage.setItem('isColorBlindMode', JSON.stringify(isColorBlindMode));
            localStorage.setItem('hasSeenIntro', JSON.stringify(hasSeenIntro));
        }
    }, [sensitivity, notifications, notificationTypes, notificationMethod, isSettingsLoaded, isDarkMode, isColorBlindMode, hasSeenIntro]);

    return {
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
    };
};
