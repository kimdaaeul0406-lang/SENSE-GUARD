import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Siren, ChevronRight } from 'lucide-react';

interface ManualViewProps {
    setCurrentView: (view: string) => void;
    onBack?: () => void;
}

export const ManualView: React.FC<ManualViewProps> = ({ setCurrentView, onBack }) => {
    const [activeTab, setActiveTab] = useState<'safe' | 'warning' | 'danger'>('safe');

    const tabs = [
        { id: 'safe', label: '평시 (안전)', color: 'text-green-600', icon: <CheckCircle size={18} /> },
        { id: 'warning', label: '의심 (주의)', color: 'text-yellow-500', icon: <AlertTriangle size={18} /> },
        { id: 'danger', label: '위급 (위험)', color: 'text-red-500', icon: <Siren size={18} /> },
    ];

    const content = {
        'safe': {
            title: "평소 안전 수칙",
            color: "bg-green-50",
            iconColor: "text-green-600",
            borderColor: "border-green-100",
            description: "평소에 미리 준비하면 재난 시 큰 도움이 됩니다.",
            checklists: [
                "비상구 위치를 미리 확인하세요.",
                "소화기 사용법을 익혀두세요.",
                "가족과 비상 연락망을 공유하세요.",
                "앱의 마이크 권한이 켜져 있는지 확인하세요."
            ]
        },
        'warning': {
            title: "이상 징후 감지 시 행동 요령",
            color: "bg-yellow-50",
            iconColor: "text-yellow-600",
            borderColor: "border-yellow-200",
            description: "타는 냄새나거나, 웅성거림이 들릴 때 확인하는 방법입니다.",
            checklists: [
                "하던 일을 멈추고 주위를 둘러보세요.",
                "창문이나 문을 열어 외부 소리를 확인하세요.",
                "앱의 'AI 정밀 분석' 버튼을 눌러 소리를 판단하세요.",
                "보호자에게 현재 상황을 메시지로 알리세요."
            ]
        },
        'danger': {
            title: "재난/화재 발생 시 긴급 대피",
            color: "bg-red-50",
            iconColor: "text-red-600",
            borderColor: "border-red-200",
            description: "화재 경보가 울리거나 실제 불을 발견했을 때입니다.",
            checklists: [
                "젖은 수건으로 코와 입을 막고 낮은 자세로 이동하세요.",
                "엘리베이터는 절대 탑승하지 마세요 (계단 이용).",
                "비상벨을 누르고 '불이야!'라고 크게 외치세요.",
                "안전한 곳(대피소)으로 이동 후 119에 신고하세요."
            ]
        }
    };

    const currentData = content[activeTab];

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="px-4 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
                <button onClick={() => onBack ? onBack() : setCurrentView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">재난 행동 요령</h1>
                <div className="w-10"></div>
            </header>

            <div className="px-4 pt-4 pb-2">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'safe' | 'warning' | 'danger')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                                : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <span className={activeTab === tab.id ? tab.color : ''}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-1 p-6 w-full max-w-md mx-auto overflow-y-auto">
                <div className={`p-6 rounded-3xl ${currentData.color} border ${currentData.borderColor} mb-6 transition-colors duration-300`}>
                    <h2 className={`text-xl font-bold ${currentData.iconColor} mb-2`}>{currentData.title}</h2>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium opacity-80">{currentData.description}</p>
                </div>

                <div className="space-y-3">
                    {currentData.checklists.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                            <div className={`mt-0.5 min-w-[20px] h-[20px] rounded-full flex items-center justify-center ${currentData.color}`}>
                                <span className={`text-xs font-bold ${currentData.iconColor}`}>{idx + 1}</span>
                            </div>
                            <p className="text-gray-700 text-sm font-medium leading-relaxed">{item}</p>
                        </div>
                    ))}
                </div>

                {activeTab === 'danger' && (
                    <div className="mt-8 p-4 bg-red-100 rounded-xl flex items-center justify-between cursor-pointer hover:bg-red-200 transition-colors" onClick={() => setCurrentView('shelter')}>
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-full text-red-500">
                                <Siren size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-700 text-sm">대피소 찾기</h3>
                                <p className="text-xs text-red-500">가까운 대피 시설 지도 보기</p>
                            </div>
                        </div>
                        <ChevronRight className="text-red-400" />
                    </div>
                )}
            </main>
        </div>
    );
};
