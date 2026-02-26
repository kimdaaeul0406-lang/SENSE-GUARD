/**
 * AI 테스트 API Route
 * 모델: gemini-3-flash-preview
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

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
        const prompt = body.prompt || '안녕하세요. 간단히 자기소개를 해주세요.';

        // Gemini REST API 호출
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
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
                    rawPreview: rawText.substring(0, 300),
                },
                { status: 500 }
            );
        }

        // API 에러 체크
        if (data.error) {
            return NextResponse.json(
                {
                    ok: false,
                    error: data.error.code || 'API_ERROR',
                    message: data.error.message || 'Gemini API 오류',
                },
                { status: data.error.code === 400 ? 400 : 500 }
            );
        }

        // 응답 추출
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return NextResponse.json({
            ok: true,
            model: 'gemini-3-flash-preview',
            prompt: prompt,
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

// GET 요청도 지원 (간단한 테스트용)
export async function GET() {
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
        const testPrompt = '안녕하세요. 한 문장으로 자기소개를 해주세요.';

        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: testPrompt,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 256,
                },
            }),
        });

        const data = await response.json();

        if (data.error) {
            return NextResponse.json(
                {
                    ok: false,
                    error: data.error.code || 'API_ERROR',
                    message: data.error.message || 'Gemini API 오류',
                },
                { status: 500 }
            );
        }

        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return NextResponse.json({
            ok: true,
            model: 'gemini-3-flash-preview',
            prompt: testPrompt,
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
