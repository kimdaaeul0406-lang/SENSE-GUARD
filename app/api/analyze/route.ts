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
        const mimeType = audioFile.type || 'audio/webm';

        console.log(`[API-ANALYZE] Processing ${audioFile.size} bytes. MIME: ${mimeType}`);

        const prompt = `You are a specialized audio analysis engine for the 'SENSE-GUARD' safety app. Listen to the attached audio snippet (3 seconds).
Your task is to identify emergency sounds with absolute priority.

EXPECTED JSON FORMAT:
{
    "riskLevel": "SAFE" | "WARNING" | "DANGER",
    "description": "Specific sound name (in Korean)",
    "action": "Immediate action advice (in Korean)"
}

CLASSIFICATION RULES:
- DANGER: Emergency sirens (Police, Ambulance, Fire truck), Fire Alarms, Smoke Detectors, Civil defense wails, Explosions.
- WARNING: Screaming, aggressive shouting, physical crashes, glass breaking, aggressive dog barking.
- SAFE: Music, normal speech, traffic background, wind, rain, keyboard, office sounds.

CRITICAL INSTRUCTIONS:
1. SIREN DETECTION: If you hear any oscillating high-pitched sound typical of a siren (police, ambulance, fire), you MUST return "DANGER".
2. YOUTUBE/TESTING: The user is likely testing with YouTube siren sounds. Even if it sounds thin or like it's from a speaker, classify as "DANGER".
3. NO HESITATION: If it's a siren, "DANGER" is the only valid riskLevel.
4. KOREAN DESCRIPTION: Provide description and action in natural Korean.
`;

        const models = [
            'gemini-3-flash-preview',
            'gemini-2.0-flash',
            'gemini-live-2.5-flash-native-audio',
            'gemini-1.5-flash'
        ];

        let lastModelError = '';

        for (const modelName of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                console.log(`[API-ANALYZE] Attempting with model: ${modelName}`);

                const geminiRes = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: prompt },
                                { inlineData: { mimeType, data: base64Audio } }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 512,
                            responseMimeType: "application/json"
                        }
                    }),
                });

                if (!geminiRes.ok) {
                    const errText = await geminiRes.text();
                    console.warn(`[API-ANALYZE] Model ${modelName} failed (${geminiRes.status}): ${errText}`);
                    lastModelError = `${modelName}: ${geminiRes.status} - ${errText.substring(0, 100)}`; // Limit error text length
                    continue; // 다음 모델 시도
                }

                const geminiData = await geminiRes.json();
                if (geminiData.error) {
                    console.warn(`[API-ANALYZE] Gemini logic error with ${modelName}:`, geminiData.error);
                    lastModelError = geminiData.error.message;
                    continue;
                }

                const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
                console.log(`[API-ANALYZE] Raw Text from ${modelName}:`, text);

                try {
                    const parsed = JSON.parse(text);
                    console.log("[API-ANALYZE] Successfully parsed JSON:", parsed);
                    return NextResponse.json({
                        result: JSON.stringify(parsed),
                        parsed: parsed,
                        modelUsed: modelName
                    });
                } catch {
                    console.warn(`[API-ANALYZE] JSON parse failed for ${modelName}, returning raw text as fallback.`);
                    return NextResponse.json({ result: text, parsed: null, modelUsed: modelName });
                }
            } catch (err: any) {
                console.error(`[API-ANALYZE] Fetch error with ${modelName}:`, err);
                lastModelError = err.message;
            }
        }

        return NextResponse.json({ error: `All models failed. Last error: ${lastModelError}` }, { status: 500 });

    } catch (error: any) {
        console.error('[API-ANALYZE] Global Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
