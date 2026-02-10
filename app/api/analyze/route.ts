/**
 * 오디오 분석 API Route
 * Gemini REST API (fetch 기반) - SDK 미사용
 * 모델: gemini-2.5-flash
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(req: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('API Key not found');
            return NextResponse.json({ error: 'Server configuration error: API Key missing' }, { status: 500 });
        }

        const formData = await req.formData();
        const audioFile = formData.get('audio') as Blob | null;
        const state = formData.get('state') as string;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio provided' }, { status: 400 });
        }

        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        // Default to proper mime type
        const mimeType = audioFile.type || 'audio/webm';

        console.log("--- STARTING AI ANALYSIS ---");
        console.log("State:", state);
        console.log("Audio Size:", audioFile.size);

        const prompt = `You are the AI engine for 'SENSE-GUARD', a disaster prevention app.
Listen to the attached audio snippet (3 seconds).

CONTEXT: The specific device sensor has ALREADY detected a VERY LOUD NOISE (> 90dB). 
However, the recorded audio might sound quieter due to distance or mobile microphone limitations.
Trust the sensor: A loud event DID occur. Your job is to identify WHAT it was.

Return the response strictly in the following JSON format (no markdown, no code blocks):
{
    "riskLevel": "SAFE" | "WARNING" | "DANGER",
    "description": "Short description of the sound (in Korean)",
    "action": "Short action advice (in Korean)"
}

Criteria:
- DANGER: **Fire Alarm**, **Siren**, **Emergency Bell**, **Smoke Detector Beep**, **Explosion**.
  (RULE: If you hear ANY siren-like or alarm-like sound, classify as DANGER immediately. Do not hesitate.)
- WARNING: Screaming, aggressive shouting, glass breaking, dog barking aggressively.
- SAFE: Coughing, sneezing, typing, object dropping (thud), door closing, talking, music, clapping, traffic noise.

**IMPORTANT decision rules**: 
1. **Fire Alarm / Siren** -> **DANGER** (High Priority). Even if it sounds faint or distant.
2. **Coughing / Sneezing / Typing** -> **SAFE**. (Ignore these common sounds).
3. **Screaming** -> **WARNING** (or DANGER if it sounds like a real emergency).
4. If the sound is clearly an alarm or siren, return "DANGER".
5. If it is just a loud bang or noise but NOT an alarm, return "WARNING".
6. If it is human conversation or cough, return "SAFE".
`;

        // Gemini REST API 호출
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Audio
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 512,
                }
            }),
        });

        const rawText = await geminiRes.text();
        console.log("--- GEMINI RAW RESPONSE ---", rawText);

        let geminiData;
        try {
            geminiData = JSON.parse(rawText);
        } catch {
            console.error('Failed to parse Gemini response');
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }

        // Gemini API 에러 체크
        if (geminiData.error) {
            console.error('Gemini API Error:', geminiData.error);
            return NextResponse.json({
                error: geminiData.error.message || 'AI analysis failed'
            }, { status: 500 });
        }

        // 응답 추출
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log("Raw AI Response:", text);

        // JSON 파싱 시도
        try {
            // 마크다운 코드블록 제거
            const cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleanText);
            return NextResponse.json({
                result: JSON.stringify(parsed),
                parsed: parsed
            });
        } catch {
            // JSON 파싱 실패시 원본 텍스트 반환
            return NextResponse.json({ result: text });
        }

    } catch (error) {
        console.error('CRITICAL ANALYSIS ERROR:', error);
        const errorMessage = (error as Error).message || String(error);
        return NextResponse.json({ error: `Failed to analyze: ${errorMessage}` }, { status: 500 });
    }
}
