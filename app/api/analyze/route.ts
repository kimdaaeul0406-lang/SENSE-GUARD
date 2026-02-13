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
Listen to the attached audio snippet (3-5 seconds).

CONTEXT: The device sensor detected a loud noise. Your job is to classify WHAT made the sound.

Return the response strictly in the following JSON format (no markdown, no code blocks):
{
    "riskLevel": "SAFE" | "WARNING" | "DANGER",
    "description": "Short description of the sound (in Korean)",
    "action": "Short action advice (in Korean)"
}

=== CLASSIFICATION RULES (STRICT) ===

**DANGER** (only these):
- Fire Alarm (continuous repeating beep at fixed interval)
- Emergency Siren (rising and falling single tone, NO melody)
- Smoke Detector (high-pitched rapid beeping)
- Explosion sound

**WARNING**:
- Screaming / aggressive shouting
- Glass breaking
- Aggressive dog barking

**SAFE** (these are NEVER dangerous):
- Music, songs, melodies, beats, instruments (ANY music = SAFE, even if loud)
- Human conversation, talking, laughing
- Coughing, sneezing, typing
- Object dropping, door closing
- Traffic noise, car horns
- TV/video audio
- Clapping, cheering

=== CRITICAL RULES (MUST FOLLOW) ===
1. **MUSIC vs SIREN**: If the sound has melody, rhythm, harmony, lyrics, or beat → it is MUSIC → return SAFE. Sirens have NO melody - they are a single repeating tone.
2. **When unsure**: Return SAFE. False alarms are worse than missed detections.
3. **Default to SAFE**: Unless you are 90%+ confident it is a real emergency sound, return SAFE.
4. Horn honking or car sounds → SAFE (traffic noise).
5. Any sound with words/lyrics → SAFE (it is media or conversation).
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
