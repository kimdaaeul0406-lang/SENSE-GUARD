/**
 * AI 안전 가이드 API Route
 * 모델: gemini-2.5-flash
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// 공공데이터 API 내부 URL (서버에서 서버로 호출)
const getBaseUrl = (request: NextRequest) => {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
};

// 프롬프트 템플릿
const PROMPT_TEMPLATE = `너는 재난·안전 상황에서 사용자가 즉시 행동할 수 있도록 안내하는 "행동 가이드 생성기"다.
아래 입력은 공공데이터(OpenAPI)에서 가져온 사실 정보다.
추측하지 말고, 입력에 근거한 안내만 작성하라.
개인정보로 보일 수 있는 내용(이름/나이 등)은 그대로 복사하지 말고, 행동요령 중심으로 요약하라.

[입력 데이터(JSON)]
{{CONTEXT_JSON}}

[출력 규칙]
- 한국어로 작성
- 형식은 정확히 아래 순서를 지켜라:

제목: (한 줄)
요약:
- (1줄)
- (1줄)
- (1줄)
체크리스트:
[ ] ...
[ ] ...
[ ] ...
[ ] ...
[ ] ...
위험도: SAFE 또는 CAUTION 또는 DANGER

[위험도 판단 가이드]
- 긴급재난문자(level 또는 내용이 긴급/대피/위험/통제 등)면 DANGER 우선
- 기상특보가 경보/주의보급이면 CAUTION~DANGER
- 정보가 부족하면 CAUTION`;

// 기상특보 데이터 추출
interface WeatherAlertItem {
    title?: string;
    tmFc?: number;
    tmSeq?: number;
    stnId?: string;
}

interface WeatherAlertResponse {
    success?: boolean;
    data?: {
        response?: {
            body?: {
                items?: {
                    item?: WeatherAlertItem[];
                };
            };
        };
    };
}

function extractWeatherAlerts(data: WeatherAlertResponse): object[] {
    try {
        const items = data?.data?.response?.body?.items?.item || [];
        return items.slice(0, 3).map((item: WeatherAlertItem) => ({
            title: item.title || '',
            tmFc: item.tmFc || null,
            tmSeq: item.tmSeq || null,
        }));
    } catch {
        return [];
    }
}

// 화재정보 데이터 추출
interface FireInfoItem {
    OCRN_YMD?: string;
    FRST_CETR_NM?: string;
    SIDO_HQ_FRST_CETR_NM?: string;
    FIRE_RCPT_MNB?: number;
    FIRE_PROG_MNB?: number;
    STN_END_MNB?: number;
}

interface FireInfoResponse {
    success?: boolean;
    data?: {
        body?: {
            items?: FireInfoItem[];
        };
        totalCount?: number;
    };
}

function extractFireInfo(data: FireInfoResponse): object {
    try {
        const items = data?.data?.body?.items || [];
        const totalCount = data?.data?.totalCount || 0;

        // 통계 요약
        let totalReceipts = 0;
        let totalProgress = 0;
        let totalEnded = 0;

        items.slice(0, 10).forEach((item: FireInfoItem) => {
            totalReceipts += item.FIRE_RCPT_MNB || 0;
            totalProgress += item.FIRE_PROG_MNB || 0;
            totalEnded += item.STN_END_MNB || 0;
        });

        return {
            date: items[0]?.OCRN_YMD || '',
            totalStations: totalCount,
            summary: {
                received: totalReceipts,
                inProgress: totalProgress,
                ended: totalEnded,
            },
            topStations: items.slice(0, 3).map((item: FireInfoItem) => ({
                name: item.FRST_CETR_NM || '',
                headquarters: item.SIDO_HQ_FRST_CETR_NM || '',
                received: item.FIRE_RCPT_MNB || 0,
            })),
        };
    } catch {
        return { error: 'Failed to extract fire info' };
    }
}

// 재난문자 데이터 추출
interface DisasterMessage {
    sentAt?: string;
    region?: string;
    type?: string;
    level?: string;
    text?: string;
}

interface DisasterMessageResponse {
    ok?: boolean;
    messages?: DisasterMessage[];
}

function extractDisasterMessages(data: DisasterMessageResponse): object[] {
    try {
        const messages = data?.messages || [];
        return messages.slice(0, 2).map((msg: DisasterMessage) => ({
            sentAt: msg.sentAt || '',
            region: msg.region || '',
            type: msg.type || '',
            level: msg.level || '',
            // 개인정보 제거: 전화번호, 이름 등 마스킹
            text: (msg.text || '').replace(/\d{2,3}-\d{3,4}-\d{4}/g, '[전화번호]'),
        }));
    } catch {
        return [];
    }
}

export async function POST(request: NextRequest) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            {
                ok: false,
                status: 500,
                error: 'API_KEY_NOT_FOUND',
                message: '환경변수 GOOGLE_API_KEY가 설정되지 않았습니다.',
            },
            { status: 500 }
        );
    }

    const baseUrl = getBaseUrl(request);
    const errors: string[] = [];

    // 1. 공공데이터 API 호출
    let weatherData: WeatherAlertResponse = {};
    let fireData: FireInfoResponse = {};
    let disasterData: DisasterMessageResponse = {};

    try {
        const weatherRes = await fetch(`${baseUrl}/api/weather-alert?numOfRows=3`);
        weatherData = await weatherRes.json();
    } catch (e) {
        errors.push(`기상특보 API 호출 실패: ${e instanceof Error ? e.message : 'Unknown'}`);
    }

    try {
        const fireRes = await fetch(`${baseUrl}/api/fire-info?numOfRows=10`);
        fireData = await fireRes.json();
    } catch (e) {
        errors.push(`화재정보 API 호출 실패: ${e instanceof Error ? e.message : 'Unknown'}`);
    }

    try {
        const disasterRes = await fetch(`${baseUrl}/api/disaster-message?numOfRows=2`);
        disasterData = await disasterRes.json();
    } catch (e) {
        errors.push(`재난문자 API 호출 실패: ${e instanceof Error ? e.message : 'Unknown'}`);
    }

    // 2. 데이터 추출 및 컨텍스트 생성
    const context = {
        weatherAlerts: extractWeatherAlerts(weatherData),
        fireInfo: extractFireInfo(fireData),
        disasterMessages: extractDisasterMessages(disasterData),
        fetchErrors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
    };

    // 3. 프롬프트 생성
    const prompt = PROMPT_TEMPLATE.replace('{{CONTEXT_JSON}}', JSON.stringify(context, null, 2));

    // 4. Gemini API 호출
    try {
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
                    temperature: 0.2,
                    maxOutputTokens: 1024,
                },
            }),
        });

        const rawText = await geminiRes.text();

        let geminiData;
        try {
            geminiData = JSON.parse(rawText);
        } catch {
            return NextResponse.json(
                {
                    ok: false,
                    status: 500,
                    error: 'PARSE_ERROR',
                    message: 'Gemini API 응답 파싱 실패',
                    context,
                },
                { status: 500 }
            );
        }

        // Gemini API 에러 체크
        if (geminiData.error) {
            return NextResponse.json(
                {
                    ok: false,
                    status: geminiData.error.code || 500,
                    error: geminiData.error.code || 'GEMINI_ERROR',
                    message: geminiData.error.message || 'Gemini API 오류',
                    context,
                },
                { status: 500 }
            );
        }

        // 응답 추출
        const guideText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return NextResponse.json({
            ok: true,
            status: 200,
            context,
            guideText,
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                status: 500,
                error: 'GEMINI_FETCH_ERROR',
                message: error instanceof Error ? error.message : '알 수 없는 오류',
                context,
            },
            { status: 500 }
        );
    }
}

// GET 요청도 지원 (테스트용)
export async function GET(request: NextRequest) {
    // POST로 리다이렉트
    return POST(request);
}
