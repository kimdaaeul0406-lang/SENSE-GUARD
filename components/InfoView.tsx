import React from 'react';
import { ArrowLeft, Mic, Cpu, Bell, Shield } from 'lucide-react';

interface InfoViewProps {
    setCurrentView: (view: string) => void;
    type: 'intro' | 'how-it-works' | 'terms' | 'help';
    onBack?: () => void;
}

// Content 타입 정의
interface ContentSection {
    title: string;
    text: string;
}

interface ContentStep {
    icon: React.ReactElement;
    title: string;
    text: string;
}

interface ContentData {
    title: string;
    icon: React.ReactElement;
    description: string;
    sections?: ContentSection[];
    steps?: ContentStep[];
    text?: string;
}

export const InfoView: React.FC<InfoViewProps> = ({ setCurrentView, type, onBack }) => {

    // Content Data
    const content: Record<string, ContentData> = {
        'intro': {
            title: "서비스 소개",
            icon: <Shield size={32} className="text-blue-600" />,
            description: "SENSE-GUARD는 청각 장애인 및 난청 어르신, 그리고 이어폰을 자주 사용하는 현대인을 위해 개발된 AI 기반 재난 소리 감지 도우미입니다.",
            sections: [
                { title: "누구를 위한 서비스인가요?", text: "화재 경보기 소리를 못 듣거나, 이어폰 때문에 위험 상황을 인지하지 못하는 모든 분들을 위해 24시간 귀가 되어드립니다." },
                { title: "무엇이 특별한가요?", text: "단순히 소리 크기만 보는 것이 아니라, 구글의 최신 AI(Gemini 1.5 Pro)가 소리의 종류를 정확히 분석하여 '비명'인지 '노래'인지 구별해냅니다." }
            ]
        },
        'how-it-works': {
            title: "작동 방식",
            icon: <Cpu size={32} className="text-purple-600" />,
            description: "스마트폰의 마이크와 최첨단 AI 기술이 결합하여 당신의 안전을 지킵니다.",
            steps: [
                { icon: <Mic size={20} />, title: "1. 소리 감지", text: "마이크가 주변의 소리 크기(데시벨)를 실시간으로 모니터링합니다." },
                { icon: <Cpu size={20} />, title: "2. AI 정밀 분석", text: "큰 소리가 나면 즉시 녹음하여 AI에게 전송하고, 이것이 위험한 소리인지 분석합니다." },
                { icon: <Bell size={20} />, title: "3. 즉각 알림", text: "위험(사이렌, 비명 등)이 확인되면 화면 점멸, 진동, 경고음으로 강력하게 알려줍니다." }
            ]
        },
        'terms': {
            title: "서비스 약관",
            icon: <Shield size={32} className="text-gray-600" />,
            description: "SENSE-GUARD 서비스 이용 약관입니다.",
            text: "본 서비스는 보조 수단이며, 실제 재난 상황에서의 모든 책임을 지지는 않습니다. 긴급 상황 시에는 반드시 119에 신고하시기 바랍니다..."
        },
        'help': {
            title: "도움말",
            icon: <Shield size={32} className="text-green-600" />,
            description: "앱 사용 중 궁금한 점이 있으신가요?",
            sections: [
                { title: "소리가 감지되지 않아요", text: "설정 메뉴에서 마이크 권한이 켜져 있는지 확인해주세요." },
                { title: "알림이 너무 자주 울려요", text: "설정에서 감도 조절은 현재 AI가 자동으로 최적화하고 있습니다." }
            ]
        }
    };

    const data = content[type];

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="px-4 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10">
                <button onClick={() => onBack ? onBack() : setCurrentView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-800">{data.title}</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-1 p-6 w-full max-w-md mx-auto overflow-y-auto">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                        {data.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{data.title}</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">{data.description}</p>
                </div>

                <div className="space-y-6">
                    {/* Intro / Help Sections */}
                    {data.sections && data.sections.map((sec, idx) => (
                        <div key={idx} className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-2">{sec.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{sec.text}</p>
                        </div>
                    ))}

                    {/* How it works Steps */}
                    {data.steps && data.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                                    {step.icon}
                                </div>
                                {idx < (data.steps?.length ?? 0) - 1 && <div className="w-0.5 h-full bg-blue-100 mt-2"></div>}
                            </div>
                            <div className="pb-8">
                                <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{step.text}</p>
                            </div>
                        </div>
                    ))}

                    {/* Simple Text */}
                    {data.text && (
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {data.text}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
