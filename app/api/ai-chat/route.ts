/**
 * AI 채팅 API Route
 * Gemini REST API (fetch 기반) - SDK 미사용
 * 재난 안전 정보 도우미
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const SYSTEM_PROMPT = `당신은 SENSE-GUARD 앱의 AI 안전 도우미입니다.
사용자에게 재난 안전 정보, 대피 요령, 응급 상황 대처법 등을 안내합니다.

역할:
- 화재, 지진, 태풍, 홍수 등 재난 상황 대처법 안내
- 응급처치 및 구조 요청 방법 안내
- 대피소 위치 및 비상 연락처 안내
- 일상 안전 수칙 안내

응답 규칙:
- 한국어로 친절하게 답변
- 핵심 정보를 명확하게 전달
- 긴급 상황시 119, 112 등 신고 안내 포함
- 불필요한 인사말 최소화
- 답변은 간결하게 (3-5문장 내외)
`;

export async function POST(request: NextRequest) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            {
                ok: false,
                error: 'API_KEY_NOT_FOUND',
                message: '환경변수 GOOGLE_API_KEY가 설정되지 않았습니다.',
            },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const userMessage = body.message || '';
        const userLocation = body.location || '위치 정보 없음';

        if (!userMessage.trim()) {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'EMPTY_MESSAGE',
                    message: '메시지를 입력해주세요.',
                },
                { status: 400 }
            );
        }

        // 시스템 프롬프트에 위치 정보 반영
        const locationPrompt = userLocation !== '위치 정보 없음'
            ? `\n사용자 현재 위치: ${userLocation}\n(답변 시 이 위치를 고려하여 가까운 대피소나 지역 특화 정보를 제공하세요)`
            : '';

        // Gemini REST API 호출
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `${SYSTEM_PROMPT}${locationPrompt}\n\n사용자 질문: ${userMessage}`,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
            }),
        });

        const rawText = await response.text();

        // JSON 파싱
        let data;
        try {
            data = JSON.parse(rawText);
        } catch {
            return NextResponse.json(
                {
                    ok: false,
                    error: 'PARSE_ERROR',
                    message: 'API 응답을 파싱할 수 없습니다.',
                },
                { status: 500 }
            );
        }

        // API 에러 체크
        if (data.error) {
            console.error("Gemini API Error:", data.error);

            let userMessage = data.error.message || 'Gemini API 오류가 발생했습니다.';

            // 에러 메시지 번역 및 친절한 안내
            if (JSON.stringify(data.error).includes('overloaded') || data.error.code === 503) {
                userMessage = '현재 사용자가 많아 AI가 답변하기 어려운 상태입니다. 잠시 후(1분 뒤) 다시 질문해주세요.';
            } else if (JSON.stringify(data.error).includes('API_KEY')) {
                userMessage = 'API 키 설정에 문제가 있습니다. 관리자에게 문의하세요.';
            }

            return NextResponse.json(
                {
                    ok: false,
                    error: data.error.code || 'API_ERROR',
                    message: userMessage,
                },
                { status: 500 }
            );
        }

        // 응답 추출
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 생성할 수 없습니다.';

        return NextResponse.json({
            ok: true,
            response: aiResponse,
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: 'FETCH_ERROR',
                message: error instanceof Error ? error.message : '알 수 없는 오류',
            },
            { status: 500 }
        );
    }
}
