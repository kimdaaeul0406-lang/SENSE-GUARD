import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';

interface ShelterViewProps {
    setCurrentView: (view: string) => void;
    setSidebarOpen: (open: boolean) => void;
    onBack?: () => void;
}

export const ShelterView: React.FC<ShelterViewProps> = ({ setCurrentView, onBack }) => {
    // Mock data for shelters (In a real app, this would come from an API based on geolocation)
    const shelters = [
        { id: 1, name: "시민 체육관", dist: "300m", status: "운영중", type: "지진/화재" },
        { id: 2, name: "중앙 초등학교 지하강당", dist: "550m", status: "운영중", type: "민방위" },
        { id: 3, name: "구민 회관", dist: "1.2km", status: "준비중", type: "임시주거" },
    ];

    const geoSupported = typeof navigator !== 'undefined' && !!navigator.geolocation;
    const [address, setAddress] = useState(geoSupported ? "위치 찾는 중..." : "위치 권한 필요");
    const [error, setError] = useState<string | null>(geoSupported ? null : "위치 정보를 사용할 수 없습니다.");

    useEffect(() => {
        if (!geoSupported) return;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Reverse Geocoding (BigDataCloud Free API)
                    const res = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`
                    );
                    const data = await res.json();

                    if (data) {
                        const city = data.principalSubdivision || data.city || '';
                        const locality = data.locality || '';
                        setAddress(`${city} ${locality}`.trim());
                    }
                } catch (err) {
                    console.error("주소 변환 실패:", err);
                    setAddress("주소를 불러올 수 없음");
                }
            },
            (err) => {
                console.warn("위치 권한 오류:", err);
                setError("위치 권한이 필요합니다.");
                setAddress("위치 권한 확인 필요");
            }
        );
    }, [geoSupported]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-10">
                <button onClick={() => onBack ? onBack() : setCurrentView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">재난 대피 시설</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 p-4 w-full max-w-md mx-auto">
                <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-lg mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={20} className="text-blue-200" />
                        <span className="text-sm font-medium text-blue-100">현재 내 위치</span>
                    </div>
                    <p className="text-xl font-bold">{error ? error : address}</p>
                    <p className="text-xs text-blue-200 mt-1">
                        {error ? '설정에서 위치 권한을 허용해주세요' : '최근 업데이트: 방금 전'}
                    </p>
                </div>

                <h2 className="font-bold text-gray-800 mb-4 px-1">가까운 대피소 (예시)</h2>

                <div className="space-y-4 mb-6">
                    {shelters.map(shelter => (
                        <div key={shelter.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-colors">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${shelter.status === '운영중' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {shelter.status}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">{shelter.type}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">{shelter.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">거리: <span className="text-blue-600 font-bold">{shelter.dist}</span></p>
                            </div>
                            <button
                                onClick={() => {
                                    const name = encodeURIComponent(shelter.name);
                                    if (window.confirm(`"${shelter.name}" 길찾기\n\n[확인] 카카오맵\n[취소] 네이버지도`)) {
                                        window.open(`https://map.kakao.com/link/search/${name}`, '_blank');
                                    } else {
                                        window.open(`https://m.map.naver.com/search2/search.naver?query=${name}`, '_blank');
                                    }
                                }}
                                className="bg-blue-50 hover:bg-blue-100 p-3 rounded-xl text-blue-500 transition-colors"
                            >
                                <MapPin size={24} />
                            </button>
                        </div>
                    ))}
                </div>

                <a
                    href={`https://map.kakao.com/link/search/대피소`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black py-4 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-transform transform hover:scale-105 active:scale-95"
                >
                    <MapPin size={20} />
                    카카오맵으로 내 주변 대피소 찾기
                </a>
                <div className="h-4"></div>
                <a
                    href={`https://m.map.naver.com/search2/search.naver?query=대피소`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 transition-transform transform hover:scale-105 active:scale-95"
                >
                    <MapPin size={20} />
                    네이버 지도로 내 주변 대피소 찾기
                </a>

                <div className="mt-8 text-center text-xs text-gray-400">
                    * 긴급 상황 시 지도 앱(네이버/카카오)을 통해<br />정확한 경로를 확인하세요.
                </div>
            </main>
        </div>
    );
};
