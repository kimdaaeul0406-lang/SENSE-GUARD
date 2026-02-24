'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Cloud, Flame, RefreshCw, MapPin } from 'lucide-react';

interface WeatherApiItem {
    tmFc?: string | number;
    areaName?: string;
    warnVar?: string;
    title?: string;
}

interface FireApiItem {
    ocrnDt?: string;
    ocrn_ymd?: string;
    siDoNm?: string;
    sggNm?: string;
    sido_nm?: string;
    fireGrdNm?: string;
    fire_grd_nm?: string;
    fireCaushNm?: string;
    fire_caush_nm?: string;
}

interface DisasterInfoViewProps {
    setCurrentView: (view: string) => void;
    onBack?: () => void;
}

interface DisasterMessage {
    sentAt: string;
    region: string;
    type: string;
    level: string;
    text: string;
}

interface WeatherAlert {
    title: string;
    region: string;
    time: string;
}

interface FireInfo {
    date: string;
    location: string;
    type: string;
    cause: string;
}

export const DisasterInfoView: React.FC<DisasterInfoViewProps> = ({ setCurrentView, onBack }) => {
    const [activeTab, setActiveTab] = useState<'disaster' | 'weather' | 'fire'>('disaster');
    const [loading, setLoading] = useState(false);

    // 지역 필터
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const regions = [
        { value: '', label: '전체 지역' },
        { value: '서울', label: '서울특별시' },
        { value: '부산', label: '부산광역시' },
        { value: '대구', label: '대구광역시' },
        { value: '인천', label: '인천광역시' },
        { value: '광주', label: '광주광역시' },
        { value: '대전', label: '대전광역시' },
        { value: '울산', label: '울산광역시' },
        { value: '세종', label: '세종특별자치시' },
        { value: '경기', label: '경기도' },
        { value: '강원', label: '강원도' },
        { value: '충북', label: '충청북도' },
        { value: '충남', label: '충청남도' },
        { value: '전북', label: '전라북도' },
        { value: '전남', label: '전라남도' },
        { value: '경북', label: '경상북도' },
        { value: '경남', label: '경상남도' },
        { value: '제주', label: '제주특별자치도' },
    ];

    // 재난문자 데이터
    const [disasterMessages, setDisasterMessages] = useState<DisasterMessage[]>([]);
    const [disasterError, setDisasterError] = useState<string | null>(null);

    // 기상특보 데이터
    const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
    const [weatherError, setWeatherError] = useState<string | null>(null);

    // 화재정보 데이터
    const [fireInfos, setFireInfos] = useState<FireInfo[]>([]);
    const [fireError, setFireError] = useState<string | null>(null);

    // 위치 기반 지역 탐지
    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // OpenStreetMap Nominatim API 활용 (무료 역지오코딩)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
                        headers: { 'Accept-Language': 'ko' }
                    });
                    const data = await res.json();

                    const city = data.address?.city || data.address?.province || data.address?.state || '';
                    console.log("Detected Location:", city);

                    // 매핑 시도
                    const found = regions.find(r => r.value !== '' && (city.includes(r.value) || r.label.includes(city)));
                    if (found) {
                        setSelectedRegion(found.value);
                        alert(`내 위치("${found.label}")를 감지했습니다.`);
                    } else {
                        alert("현재 위치를 지원되는 지역으로 매핑할 수 없습니다.");
                    }
                } catch (err) {
                    console.error("Location detection failed", err);
                    alert("위치 정보를 가져오는데 실패했습니다.");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                console.error(err);
                alert("위치 권한을 허용해주세요.");
                setLoading(false);
            }
        );
    };

    // 재난문자 API 호출
    const fetchDisasterMessages = async (region: string = '', force: boolean = false) => {
        setLoading(true);
        setDisasterError(null);
        try {
            const url = `/api/disaster-message?numOfRows=20${region ? `&region=${encodeURIComponent(region)}` : ''}${force ? '&force=true' : ''}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.ok && data.messages) {
                setDisasterMessages(data.messages);
                if (data.messages.length === 0 && region) {
                    setDisasterError(`"${region}" 지역의 최근 재난문자가 없습니다.`);
                }
            } else {
                setDisasterError(data.message || 'IP 미등록 또는 API 오류');
            }
        } catch {
            setDisasterError('네트워크 오류');
        } finally {
            setLoading(false);
        }
    };

    // 날짜 포맷 헬퍼 함수 (202602091000 → 2026.02.09 10:00)
    // 날짜 포맷 헬퍼 함수
    // 날짜 포맷 헬퍼 함수 통합 (YYYY.MM.DD HH:mm)
    const formatDateTime = (dateInput: string | number): string => {
        let dateStr = String(dateInput || '').trim();
        if (!dateStr) return '';

        // 1. 단순 숫자만 있는 경우 (YYYYMMDD, YYYYMMDDHHmm 등)
        const plainNumber = dateStr.replace(/[^0-9]/g, '');

        // 원본이 구분자가 섞여있었지만, 정리해서 처리
        if (dateStr.includes('/') || dateStr.includes('-') || dateStr.includes('.')) {
            // 구분자 통일
            dateStr = dateStr.replace(/\//g, '.').replace(/-/g, '.');

            // 초 단위(:ss) 제거 로직
            const parts = dateStr.split(' ');
            if (parts.length > 1) {
                const timePart = parts[1];
                const timeSubParts = timePart.split(':');
                // HH:mm:ss 형태라면 HH:mm으로 자름
                if (timeSubParts.length >= 3) {
                    return `${parts[0]} ${timeSubParts[0]}:${timeSubParts[1]}`;
                }
            }
            return dateStr;
        }

        // 2. 숫자로만 된 문자열 포맷팅
        if (plainNumber.length === 8) {
            // YYYYMMDD -> YYYY.MM.DD
            return `${plainNumber.substring(0, 4)}.${plainNumber.substring(4, 6)}.${plainNumber.substring(6, 8)}`;
        }
        if (plainNumber.length >= 12) {
            // YYYYMMDDHHmm -> YYYY.MM.DD HH:mm
            return `${plainNumber.substring(0, 4)}.${plainNumber.substring(4, 6)}.${plainNumber.substring(6, 8)} ${plainNumber.substring(8, 10)}:${plainNumber.substring(10, 12)}`;
        }

        return dateStr;
    };

    // 기상특보 API 호출
    const fetchWeatherAlerts = async () => {
        setLoading(true);
        setWeatherError(null);
        try {
            const res = await fetch('/api/weather-alert?numOfRows=20');
            const data = await res.json();
            if (data.success && data.data?.response?.body?.items?.item) {
                const items = data.data.response.body.items.item;
                const itemsArray = Array.isArray(items) ? items : [items];
                const formatted: WeatherAlert[] = itemsArray.map((item: WeatherApiItem) => ({
                    title: item.title || '기상 정보',
                    region: item.areaName || '전국',
                    time: formatDateTime(item.tmFc ?? ''),
                }));
                // 최신순 정렬
                formatted.sort((a, b) => b.time.localeCompare(a.time));
                setWeatherAlerts(formatted);
            } else {
                setWeatherError('현재 발령된 기상특보가 없습니다.');
            }
        } catch (weatherErr) {
            console.error('기상특보 API 오류:', weatherErr);
            setWeatherError('네트워크 오류');
        } finally {
            setLoading(false);
        }
    };

    // 화재정보 API 호출
    const fetchFireInfo = async () => {
        setLoading(true);
        setFireError(null);
        try {
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const res = await fetch(`/api/fire-info?ocrn_ymd=${dateStr}&numOfRows=20`);
            const data = await res.json();

            if (data.success && data.data?.response?.body?.items?.item) {
                const items = data.data.response.body.items.item;
                const formatted: FireInfo[] = (Array.isArray(items) ? items : [items]).map((item: FireApiItem) => ({
                    date: formatDateTime(item.ocrnDt || item.ocrn_ymd || ''),
                    location: item.siDoNm && item.sggNm ? `${item.siDoNm} ${item.sggNm}` : (item.sido_nm || ''),
                    type: item.fireGrdNm || item.fire_grd_nm || '화재',
                    cause: item.fireCaushNm || item.fire_caush_nm || '조사중',
                }));
                setFireInfos(formatted);
            } else {
                setFireError('오늘 발생한 화재 정보가 없습니다.');
            }
        } catch {
            setFireError('네트워크 오류');
        } finally {
            setLoading(false);
        }
    };

    // 탭 변경 시 데이터 로드
    useEffect(() => {
        if (activeTab === 'disaster') fetchDisasterMessages(selectedRegion);
        else if (activeTab === 'weather') fetchWeatherAlerts();
        else if (activeTab === 'fire') fetchFireInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedRegion]);

    const handleRefresh = () => {
        if (activeTab === 'disaster') fetchDisasterMessages(selectedRegion, true); // 강제 새로고침
        else if (activeTab === 'weather') fetchWeatherAlerts();
        else if (activeTab === 'fire') fetchFireInfo();
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
                <button onClick={() => onBack ? onBack() : setCurrentView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">재난 정보 센터</h1>
                <button onClick={handleRefresh} className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw size={20} className="text-gray-600" />
                </button>
            </header>

            {/* 탭 버튼 */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2">
                <button
                    onClick={() => setActiveTab('disaster')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'disaster'
                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                        : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    <AlertTriangle size={16} />
                    재난문자
                </button>
                <button
                    onClick={() => setActiveTab('weather')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'weather'
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    <Cloud size={16} />
                    기상특보
                </button>
                <button
                    onClick={() => setActiveTab('fire')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeTab === 'fire'
                        ? 'bg-red-100 text-red-800 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-600'
                        }`}
                >
                    <Flame size={16} />
                    화재현황
                </button>
            </div>

            {/* 지역 필터 (재난문자 탭에서만 표시) */}
            {activeTab === 'disaster' && (
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex gap-2">
                    <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                        {regions.map((region) => (
                            <option key={region.value} value={region.value}>
                                {region.label}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={detectLocation}
                        className="px-4 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl flex items-center justify-center hover:bg-blue-100 transition-colors"
                        title="내 위치 감지"
                    >
                        <MapPin size={20} />
                    </button>
                </div>
            )}

            <main className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* 재난문자 탭 */}
                        {activeTab === 'disaster' && (
                            <div className="space-y-3">
                                {disasterError ? (
                                    <div className="bg-gray-100 rounded-2xl p-6 text-center">
                                        <AlertTriangle size={40} className="text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-600 font-medium">{disasterError}</p>
                                        <p className="text-xs text-gray-400 mt-2">재난안전데이터 API는 등록된 IP에서만 조회 가능합니다.</p>
                                    </div>
                                ) : disasterMessages.length === 0 ? (
                                    <div className="bg-green-50 rounded-2xl p-6 text-center">
                                        <p className="text-green-700 font-bold">현재 발령된 재난문자가 없습니다</p>
                                        <p className="text-xs text-green-600 mt-1">안전한 상태입니다 ✓</p>
                                    </div>
                                ) : (
                                    disasterMessages.map((msg, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-bold">{msg.type}</span>
                                                <span className="text-xs text-gray-500">{msg.region}</span>
                                            </div>
                                            <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                                            <p className="text-xs text-gray-400 mt-2">{formatDateTime(msg.sentAt)}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 기상특보 탭 */}
                        {activeTab === 'weather' && (
                            <div className="space-y-3">
                                {weatherError ? (
                                    <div className="bg-blue-50 rounded-2xl p-6 text-center">
                                        <Cloud size={40} className="text-blue-300 mx-auto mb-3" />
                                        <p className="text-blue-700 font-medium">{weatherError}</p>
                                    </div>
                                ) : weatherAlerts.length === 0 ? (
                                    <div className="bg-green-50 rounded-2xl p-6 text-center">
                                        <p className="text-green-700 font-bold">현재 발령된 기상특보가 없습니다</p>
                                        <p className="text-xs text-green-600 mt-1">날씨가 좋습니다 ☀️</p>
                                    </div>
                                ) : (
                                    weatherAlerts.map((alert, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Cloud size={16} className="text-blue-500" />
                                                <span className="text-xs text-gray-500">{alert.region}</span>
                                            </div>
                                            <p className="text-sm text-gray-800 font-medium">{alert.title}</p>
                                            <p className="text-xs text-gray-400 mt-2">{alert.time}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* 화재현황 탭 */}
                        {activeTab === 'fire' && (
                            <div className="space-y-3">
                                {fireError ? (
                                    <div className="bg-green-50 rounded-2xl p-6 text-center">
                                        <Flame size={40} className="text-green-400 mx-auto mb-3" />
                                        <p className="text-green-700 font-medium">{fireError}</p>
                                        <p className="text-xs text-green-600 mt-1">좋은 소식입니다! 🎉</p>
                                    </div>
                                ) : fireInfos.length === 0 ? (
                                    <div className="bg-green-50 rounded-2xl p-6 text-center">
                                        <p className="text-green-700 font-bold">오늘 발생한 화재가 없습니다</p>
                                        <p className="text-xs text-green-600 mt-1">안전한 하루입니다 ✓</p>
                                    </div>
                                ) : (
                                    fireInfos.map((fire, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl p-4 border border-red-100 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Flame size={16} className="text-red-500" />
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">{fire.type}</span>
                                            </div>
                                            <p className="text-sm text-gray-800 font-medium">{fire.location}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-500">원인: {fire.cause}</span>
                                                <span className="text-xs text-gray-400">{fire.date}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* 하단 안내 */}
            <div className="bg-white border-t border-gray-200 p-4">
                <p className="text-xs text-gray-400 text-center">
                    공공데이터포털 및 재난안전데이터공유플랫폼 API 활용
                </p>
            </div>
        </div>
    );
};
