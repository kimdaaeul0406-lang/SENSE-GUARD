import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface GuardianSetupViewProps {
    onComplete: (phone: string) => void;
    userName: string;
}

export const GuardianSetupView: React.FC<GuardianSetupViewProps> = ({ onComplete, userName }) => {
    const [phone, setPhone] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const phoneRegex = /^[0-9+\-\s]{8,15}$/;
        if (!phoneRegex.test(phone)) {
            setError("유효한 전화번호 형식이 아닙니다.");
            return;
        }

        onComplete(phone);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col p-8">
            <header className="py-6 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <ShieldCheck size={28} className="text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    {userName}님, 반갑습니다!<br />
                    보호자 연락처를 등록할까요?
                </h1>
                <p className="text-gray-500 mt-2 text-sm">
                    위험한 소리가 감지되면 등록된 번호로<br />
                    즉시 긴급 알림 문자를 발송합니다.
                </p>
            </header>

            <main className="flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">보호자 전화번호</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-4 text-gray-400" size={20} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    setError("");
                                }}
                                placeholder="010-1234-5678"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-4 flex gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 font-bold text-xs">!</span>
                        </div>
                        <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                            전화번호는 수집되지 않으며, 긴급 상황 시<br />
                            사용자의 기기에서 문자를 발송하는 용도로만 사용됩니다.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={!phone}
                        className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${phone ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-gray-100 text-gray-400'
                            }`}
                    >
                        등록하고 시작하기
                        <ArrowRight size={20} />
                    </button>

                    <button
                        type="button"
                        onClick={() => onComplete("")}
                        className="w-full py-4 text-gray-400 text-sm font-medium hover:text-gray-600"
                    >
                        나중에 등록할게요
                    </button>
                </form>
            </main>
        </div>
    );
};
