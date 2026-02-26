/**
 * 오디오 분석 API Route
 * Gemini REST API (fetch 기반) - SDK 미사용
 * 모델: gemini-live-2.5-flash-native-audio (소리 감지에 최적화)
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-live-2.5-flash-native-audio:generateContent';

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
Listen to the attached audio snippet (3-5 seconds).

CONTEXT: The device sensor detected a loud noise. Your job is to classify WHAT made the sound.

Return the response strictly in the following JSON format (no markdown, no code blocks):
{
    "riskLevel": "SAFE" | "WARNING" | "DANGER",
    "description": "Short description of the sound (in Korean)",
    "action": "Short action advice (in Korean)"
}

=== CLASSIFICATION RULES (STRICT) ===

**DANGER** (Critical emergencies):
- Fire Alarm (continuous repeating beep at fixed interval)
- Emergency Siren (Ambulance, Fire truck, Police) - This includes rising/falling tones, two-tone "pi-po pi-po", or wailing sounds.
- Smoke Detector (high-pitched rapid beeping)
- Explosion or gunshot sound
- Civil defense siren (long steady or rising/falling wail)

**WARNING** (Potential threats):
- Screaming / aggressive shouting / crying
- Glass breaking / loud crashing
- Aggressive dog barking / growling
- Door being kicked or pounded

**SAFE** (Normal environment):
- Music, songs, melodies, beats, instruments (unless it is an official emergency siren)
- Human conversation, talking, laughing (normal volume)
- Coughing, sneezing, typing, vacuum cleaner
- Water running, wind noise
- Traffic noise (engines, tires), car horns (single or double honks)
- TV/video audio at normal volume

=== CRITICAL RULES (MUST FOLLOW) ===
1. **SIMULATION TEST MODE**: The user is currently testing the app with YouTube/Videos. DO NOT classify sounds as SAFE just because they sound like they are coming from a speaker or have background music/video noise.
2. **SIREN PRIORITY**: If you detect ANY repeating frequency modulation (Wail, Yelp, Hi-Lo, or Piercing Beeps), it is **MANDATORY DANGER**. This includes Police, Ambulance, Fire truck, and Fire Alarms.
3. **IGNORE DISTRACTIONS**: If a siren exists alongside people talking, lyrics, or background beats, the SIREN takes absolute priority. Mark it as DANGER.
4. **FAIL-SAFE**: We prioritize user life over false alarms. If the sound is at least 50% similar to an emergency signal, you MUST return DANGER.
5. **DESCRIPTION**: Keep it brief in Korean, but clearly state what specific emergency sound you identified.
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
                    temperature: 0.1,
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
            // 마크다운 코드블록 제거 및 불필요한 공백 제거
            let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

            // JSON 객체만 추출 (앞뒤 쓰레기 텍스트 제거)
            const firstOpen = cleanText.indexOf('{');
            const lastClose = cleanText.lastIndexOf('}');
            if (firstOpen !== -1 && lastClose !== -1) {
                cleanText = cleanText.substring(firstOpen, lastClose + 1);
            }

            const parsed = JSON.parse(cleanText);
            return NextResponse.json({
                result: JSON.stringify(parsed),
                parsed: parsed
            });
        } catch {
            // JSON 파싱 실패시 텍스트에서 위험 키워드 추출 시도
            const upperText = text.toUpperCase();
            let fallbackResult = {
                riskLevel: "SAFE",
                description: "분석 중입니다.",
                action: "잠시만 기다려주세요."
            };

            if (upperText.includes("DANGER") || upperText.includes("위험") || upperText.includes("FIRE") || upperText.includes("SIREN")) {
                fallbackResult.riskLevel = "DANGER";
                fallbackResult.description = text.substring(0, 50); // 앞부분이라도 표시
            }

            return NextResponse.json({
                result: JSON.stringify(fallbackResult),
                parsed: fallbackResult
            });
        }

    } catch (error) {
        console.error('CRITICAL ANALYSIS ERROR:', error);
        const errorMessage = (error as Error).message || String(error);
        return NextResponse.json({ error: `Failed to analyze: ${errorMessage}` }, { status: 500 });
    }
}
