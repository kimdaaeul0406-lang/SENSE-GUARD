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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. 위치 정보 가져오기
        if (!navigator.geolocation) {
            setError('위치 정보를 사용할 수 없습니다.');
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
                    // 참고: 실제 서비스에서는 네이버/카카오 지도 API 등을 사용하는 것이 정확도가 높습니다.
                    const geoRes = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`
                    );
                    const geoJson = await geoRes.json();

                    if (geoJson) {
                        // 시/도 + 구/군 조합
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
                setError('위치 권한이 필요합니다.');
                setLoading(false);
            }
        );
    }, []);

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
            <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                위치와 날씨 정보를 불러오는 중...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                <MapPin size={14} />
                {error}
            </div>
        );
    }

    if (!weather || !location) return null;

    const { icon, text } = getWeatherInfo(weather.weatherCode);

    return (
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-white/50 w-full max-w-xs justify-between mb-4">
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
        </div>
    );
};
