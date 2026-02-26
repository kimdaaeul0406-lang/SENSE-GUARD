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
1. SIREN PRIORITY: If a siren is detected, it is MANDATORY DANGER even if there is music or talking in the background.
2. VIRTUAL ENVIRONMENT: The user may be testing using YouTube or speakers. Do NOT mark as SAFE just because it sounds recorded.
3. FAIL-SAFE: If the sound resembles a siren, mark as DANGER. We prioritize life safety.
`;

        console.log("[API-ANALYZE] Calling Gemini API...");
        // Gemini REST API 호출
        const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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

        console.log(`[API-ANALYZE] Gemini Response Status: ${geminiRes.status}`);
        const rawText = await geminiRes.text();

        let geminiData;
        try {
            geminiData = JSON.parse(rawText);
        } catch {
            console.error('[API-ANALYZE] Failed to parse gemini response text:', rawText);
            return NextResponse.json({ error: 'AI Response Parsing Error' }, { status: 500 });
        }

        if (geminiData.error) {
            console.error('[API-ANALYZE] Gemini Service Error:', geminiData.error);
            return NextResponse.json({ error: geminiData.error.message }, { status: 500 });
        }

        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log("[API-ANALYZE] Raw Text from Gemini:", text);

        try {
            const parsed = JSON.parse(text);
            console.log("[API-ANALYZE] Successfully parsed JSON:", parsed);
            return NextResponse.json({
                result: JSON.stringify(parsed),
                parsed: parsed
            });
        } catch {
            console.warn("[API-ANALYZE] JSON parse failed, returning raw text as fallback.");
            return NextResponse.json({ result: text, parsed: null });
        }

    } catch (error) {
        console.error('CRITICAL ANALYSIS ERROR:', error);
        const errorMessage = (error as Error).message || String(error);
        return NextResponse.json({ error: `Failed to analyze: ${errorMessage}` }, { status: 500 });
    }
}
