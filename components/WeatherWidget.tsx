'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, MapPin, Loader2, Wind } from 'lucide-react';

interface WeatherData {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
}

interface LocationData {
    latitude: number;
    longitude: number;
    address?: string; // 간략한 주소 (예: 서울특별시 강남구)
}

export const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'prompt' | 'unknown'>('unknown');

    useEffect(() => {
        // 권한 상태 확인 (지원하는 브라우저만)
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermissionStatus(result.state);
                result.onchange = () => setPermissionStatus(result.state);
            }).catch(() => setPermissionStatus('unknown'));
        }
    }, []);

    const fetchLocationAndWeather = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('이 브라우저는 위치 정보를 지원하지 않습니다.');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });

                try {
                    // 2. 날씨 정보 가져오기 (Open-Meteo, 무료, 키 없음)
                    const weatherRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
                    );
                    const weatherJson = await weatherRes.json();

                    if (weatherJson.current_weather) {
                        setWeather({
                            temperature: weatherJson.current_weather.temperature,
                            weatherCode: weatherJson.current_weather.weathercode,
                            windSpeed: weatherJson.current_weather.windspeed,
                        });
                    }

                    // 3. 주소 정보 가져오기 (BigDataCloud, 무료, 키 없음)
                    const geoRes = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`
                    );
                    const geoJson = await geoRes.json();

                    if (geoJson) {
                        const city = geoJson.principalSubdivision || geoJson.city || '';
                        const locality = geoJson.locality || '';
                        setLocation(prev => prev ? { ...prev, address: `${city} ${locality}`.trim() } : null);
                    }

                } catch (err) {
                    console.error("날씨/위치 정보 로드 실패:", err);
                    setError('날씨 정보를 불러올 수 없습니다.');
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.warn("위치 권한 오류:", err);
                if (err.code === 1) { // PERMISSION_DENIED
                    setError('위치 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
                } else {
                    setError('위치 정보를 가져올 수 없습니다.');
                }
                setLoading(false);
            },
            { timeout: 10000, enableHighAccuracy: false } // 타임아웃 10초
        );
    };

    // WMO 날씨 코드를 아이콘과 텍스트로 변환
    const getWeatherInfo = (code: number) => {
        if (code === 0) return { icon: <Sun className="text-orange-500" size={24} />, text: '쾌청' };
        if (code >= 1 && code <= 3) return { icon: <Cloud className="text-gray-500" size={24} />, text: '구름 조금' };
        if ([45, 48].includes(code)) return { icon: <Wind className="text-gray-400" size={24} />, text: '안개' };
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { icon: <CloudRain className="text-blue-500" size={24} />, text: '비' };
        if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: <CloudSnow className="text-sky-300" size={24} />, text: '눈' };
        if ([95, 96, 99].includes(code)) return { icon: <CloudLightning className="text-purple-500" size={24} />, text: '뇌우' };
        return { icon: <Sun className="text-orange-500" size={24} />, text: '맑음' };
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/60 p-3 rounded-2xl shadow-sm border border-white/50 w-full max-w-xs mb-4">
                <Loader2 size={16} className="animate-spin" />
                위치와 날씨 정보를 불러오는 중...
            </div>
        );
    }

    if (!weather || !location) {
        return (
            <div className="w-full max-w-xs mb-4">
                <button
                    onClick={fetchLocationAndWeather}
                    className="flex items-center justify-center gap-2 w-full bg-white/60 hover:bg-white/80 active:bg-white/90 backdrop-blur-sm px-4 py-3 rounded-2xl shadow-sm border border-white/50 text-sm font-medium text-gray-600 transition-all"
                >
                    <MapPin size={16} className="text-red-400" />
                    {error ? (
                        <span className="text-red-500 text-xs">{error} (다시 시도)</span>
                    ) : (
                        <span>내 위치 날씨 보기</span>
                    )}
                </button>
                {permissionStatus === 'denied' && (
                    <p className="text-[10px] text-gray-400 text-center mt-1">
                        * 브라우저 설정에서 위치 권한을 허용해야 합니다.
                    </p>
                )}
            </div>
        );
    }

    const { icon, text } = getWeatherInfo(weather.weatherCode);

    return (
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-white/50 w-full max-w-xs justify-between mb-4 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-full shadow-sm">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={10} />
                        {location.address || '위치 확인 중'}
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                        {weather.temperature}°C <span className="text-xs font-normal text-gray-500 ml-1">{text}</span>
                    </span>
                </div>
            </div>
            <button onClick={fetchLocationAndWeather} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors" aria-label="날씨 새로고침">
                <Loader2 size={14} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
    );
};
