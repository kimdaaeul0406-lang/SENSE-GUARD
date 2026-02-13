'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User, Loader2 } from 'lucide-react';

// 간단한 마크다운 → HTML 변환 함수
function renderMarkdown(text: string): string {
    let html = text
        // 코드 블록 (```...```)
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded-lg p-2 my-1 text-xs overflow-x-auto"><code>$1</code></pre>')
        // 인라인 코드 (`...`)
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs">$1</code>')
        // 볼드 (**...** 또는 __...__)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // 이탤릭 (*...* 또는 _..._)
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        // 번호 리스트 (1. 2. 3. ...)
        .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
        // 불릿 리스트 (- ...)
        .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
        // 줄바꿈
        .replace(/\n/g, '<br/>');

    // 연속된 <li>를 <ul>로 감싸기
    html = html.replace(/((?:<li[^>]*>.*?<\/li>(?:<br\/>)?)+)/g, (match) => {
        const cleaned = match.replace(/<br\/>/g, '');
        if (cleaned.includes('list-decimal')) {
            return '<ol class="space-y-1 my-1">' + cleaned + '</ol>';
        }
        return '<ul class="space-y-1 my-1">' + cleaned + '</ul>';
    });

    return html;
}

interface AIChatViewProps {
    setCurrentView: (view: string) => void;
    onBack?: () => void;
}

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export const AIChatView: React.FC<AIChatViewProps> = ({ setCurrentView, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 0,
            role: 'assistant',
            content: '안녕하세요! SENSE-GUARD AI 어시스턴트입니다. 재난 안전, 대피 요령, 응급 상황 등에 대해 질문해주세요.',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const [location, setLocation] = useState<string | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const res = await fetch(
                            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`
                        );
                        const data = await res.json();
                        if (data) {
                            const city = data.principalSubdivision || data.city || '';
                            const locality = data.locality || '';
                            setLocation(`${city} ${locality}`.trim());
                        }
                    } catch (e) {
                        console.warn("위치 정보 로드 실패", e);
                    }
                },
                () => console.warn("위치 권한 없음")
            );
        }
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    location: location // 위치 정보 함께 전송
                }),
            });

            const data = await response.json();

            const assistantMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: data.ok ? data.response : `오류: ${data.message || '응답을 받지 못했습니다.'}`,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch {
            const errorMessage: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-4 flex items-center gap-4 shadow-sm">
                <button
                    onClick={() => onBack ? onBack() : setCurrentView('main')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={22} className="text-gray-700" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <Bot size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-800">AI 안전 도우미</h1>
                        <p className="text-xs text-gray-500">재난 안전 정보를 물어보세요</p>
                    </div>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                : 'bg-gradient-to-br from-gray-600 to-gray-700'
                                }`}
                        >
                            {msg.role === 'user' ? (
                                <User size={16} className="text-white" />
                            ) : (
                                <Bot size={16} className="text-white" />
                            )}
                        </div>
                        <div
                            className={`max-w-[75%] p-3 rounded-2xl ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-br-md'
                                : 'bg-white shadow-md text-gray-800 rounded-bl-md'
                                }`}
                        >
                            {msg.role === 'user' ? (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                                <div
                                    className="text-sm leading-relaxed prose-sm"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                />
                            )}
                            <p
                                className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                                    }`}
                            >
                                {msg.timestamp.toLocaleTimeString('ko-KR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className="bg-white shadow-md p-3 rounded-2xl rounded-bl-md">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">응답 중...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-cyan-600 transition-all"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">
                    AI 응답은 참고용입니다. 긴급 상황시 119에 연락하세요.
                </p>
            </div>
        </div>
    );
};
