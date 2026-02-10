'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface WeatherItem {
    tmFc?: string;
    areaName?: string;
    warnVar?: string;
    title?: string;
}

interface DisasterMessage {
    sentAt: string;
    region: string;
    type: string;
    level: string;
    text: string;
}

interface AlertData {
    ok: boolean;
    count: number;
    messages: DisasterMessage[];
    error?: string;
    message?: string;
}

export const DisasterAlertWidget: React.FC = () => {
    const [alerts, setAlerts] = useState<DisasterMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchWeatherAlerts = useCallback(async () => {
        try {
            const res = await fetch('/api/weather-alert?numOfRows=5');
            const data = await res.json();

            if (data.success && data.data?.response?.body?.items?.item) {
                const items = data.data.response.body.items.item;
                const itemsArray = Array.isArray(items) ? items : [items];
                const formatted: DisasterMessage[] = itemsArray.map((item: WeatherItem) => ({
                    sentAt: String(item.tmFc || ''),
                    region: item.areaName || '전국',
                    type: '기상특보',
                    level: item.warnVar || '',
                    text: item.title || '기상 정보',
                }));
                setAlerts(formatted);
                setLastUpdated(new Date());
            } else {
                setAlerts([]);
                setError('현재 발령된 재난/기상 특보가 없습니다.');
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error("기상특보 API 호출 실패:", err);
            setError('재난 정보를 불러올 수 없습니다.');
        }
    }, []);

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/disaster-message?numOfRows=5');
            const data: AlertData = await res.json();

            if (data.ok && data.messages && data.messages.length > 0) {
                setAlerts(data.messages);
                setLastUpdated(new Date());
            } else if (data.error === 'UNREGISTERED IP ERROR' || data.message?.includes('IP')) {
                console.warn("재난문자 API IP 미등록, 기상특보로 대체");
                await fetchWeatherAlerts();
            } else {
                setAlerts([]);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error("재난문자 API 호출 실패:", err);
            await fetchWeatherAlerts();
        } finally {
            setLoading(false);
        }
    }, [fetchWeatherAlerts]);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    // 로딩 중 - 한 줄 스켈레톤
    if (loading) {
        return (
            <div className="w-full max-w-md mx-auto mb-3">
                <div className="bg-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 animate-pulse">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    // 에러 또는 알림 없음 → 숨김
    if (error || alerts.length === 0) {
        return null;
    }

    const latestAlert = alerts[0];
    const isUrgent = latestAlert.level?.includes('긴급') || latestAlert.type?.includes('긴급');



    return (
        <div className="w-full max-w-md mx-auto mb-3">
            {/* 한 줄 컴팩트 바 */}
            <div
                className={`rounded-xl shadow-sm border cursor-pointer transition-all ${isUrgent
                    ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                    : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                    }`}
                onClick={() => setExpanded(!expanded)}
            >
                {/* 접힌 상태 - 한 줄 */}
                <div className="px-4 py-3 flex items-center gap-3">
                    <AlertTriangle
                        size={18}
                        className={isUrgent ? 'text-red-500 flex-shrink-0' : 'text-yellow-500 flex-shrink-0'}
                    />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isUrgent ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                        }`}>
                        {latestAlert.type || '재난'}
                    </span>
                    <p className={`text-sm font-medium truncate flex-1 ${isUrgent ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                        {latestAlert.text.length > 25 ? latestAlert.text.substring(0, 25) + '...' : latestAlert.text}
                    </p>
                    {expanded ? (
                        <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
                    ) : (
                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                    )}
                </div>

                {/* 펼친 상태 - 최신 1개만 표시 */}
                {expanded && (
                    <div className="px-4 pb-4 border-t border-gray-200/50">
                        <div className="mt-3">
                            <div className="bg-white/60 rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isUrgent
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {latestAlert.type}
                                    </span>
                                    <span className="text-xs text-gray-500">{latestAlert.region}</span>
                                </div>
                                <p className="text-sm text-gray-800 leading-relaxed">
                                    {latestAlert.text}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">{latestAlert.sentAt}</p>
                            </div>
                        </div>

                        {/* 하단 액션 */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/50">
                            <p className="text-xs text-gray-400">
                                {lastUpdated?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 업데이트
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchAlerts();
                                }}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                <RefreshCw size={12} />
                                새로고침
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
