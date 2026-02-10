/**
 * 소방청 화재정보 API Route
 * 공공데이터포털 API 정상 호출 확인용
 */

import { NextRequest, NextResponse } from 'next/server';

// 소방청 화재정보 API (FireInformationService)
const FIRE_INFO_API_URL = 'http://apis.data.go.kr/1661000/FireInformationService/getOcByfrstFireSmrzPcnd';

// 기본 날짜: 어제 (YYYYMMDD 형식)
function getDefaultDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

export async function GET(request: NextRequest) {
    const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

    if (!serviceKey) {
        return NextResponse.json(
            {
                success: false,
                error: 'SERVICE_KEY_NOT_FOUND',
                message: '환경변수 DATA_GO_KR_SERVICE_KEY가 설정되지 않았습니다.',
            },
            { status: 500 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const ocrnYmd = searchParams.get('ocrn_ymd') || getDefaultDate();
        const numOfRows = searchParams.get('numOfRows') || '10';
        const pageNo = searchParams.get('pageNo') || '1';

        const apiUrl = new URL(FIRE_INFO_API_URL);
        apiUrl.searchParams.append('serviceKey', serviceKey);
        apiUrl.searchParams.append('numOfRows', numOfRows);
        apiUrl.searchParams.append('pageNo', pageNo);
        apiUrl.searchParams.append('resultType', 'JSON');
        apiUrl.searchParams.append('ocrn_ymd', ocrnYmd);

        const response = await fetch(apiUrl.toString());
        const rawText = await response.text();

        // XML 에러 또는 JSON 파싱 가능 여부 확인
        let parsedData = null;
        let isJson = false;

        try {
            parsedData = JSON.parse(rawText);
            isJson = true;
        } catch {
            isJson = false;
        }

        return NextResponse.json({
            success: response.ok && isJson,
            status: response.status,
            isJson,
            requestedDate: ocrnYmd,
            rawPreview: rawText.substring(0, 500),
            data: parsedData,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: 'FETCH_ERROR',
                message: error instanceof Error ? error.message : '알 수 없는 오류',
            },
            { status: 500 }
        );
    }
}
