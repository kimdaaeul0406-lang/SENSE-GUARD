/**
 * 긴급재난문자 API Route
 * 재난안전데이터공유플랫폼(safetydata.go.kr) API
 * UI에서 사용하기 쉽도록 가공된 응답 반환
 * 최신 데이터 우선 정렬 + 지역 필터링 지원
 * ⚡ 30분 캐싱으로 API 호출 최소화
 */

import { NextRequest, NextResponse } from 'next/server';

const DISASTER_MESSAGE_API_URL = 'https://www.safetydata.go.kr/V2/api/DSSP-IF-00247';

// 캐시 설정 (30분)
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30분
let cachedData: { messages: FormattedMessage[]; totalCount: number } | null = null;
let cacheTimestamp: number = 0;

// 원본 API 메시지 타입
interface RawMessage {
    CRT_DT: string;       // 발송 시각
    RCPTN_RGN_NM: string; // 수신 지역
    DST_SE_NM: string;    // 재난 유형
    EMRG_STEP_NM: string; // 긴급 단계
    MSG_CN: string;       // 메시지 원문
}

// UI용 가공된 메시지 타입
interface FormattedMessage {
    sentAt: string;
    region: string;
    type: string;
    level: string;
    text: string;
}

// Mock Data for Fallback
const MOCK_MESSAGES: FormattedMessage[] = [
    {
        sentAt: '2024/02/11 13:55:00',
        region: '서울특별시 전체',
        type: '안전안내',
        level: '안전안내',
        text: '[행정안전부] 오늘 14:00부로 서울 전역에 호우주의보가 발령되었습니다. 하천 주변 산책을 자제하시고 안전에 유의하시기 바랍니다.'
    },
    {
        sentAt: '2024/02/11 11:30:00',
        region: '경기도 성남시',
        type: '안전안내',
        level: '안전안내',
        text: '[성남시청] 현재 관내 강설로 인한 도로 결빙 구간이 많습니다. 대중교통 이용 및 안전운전 바랍니다.'
    },
    {
        sentAt: '2024/02/10 18:00:00',
        region: '전국',
        type: '안전안내',
        level: '안전안내',
        text: '[질병관리청] 독감 유행 주의보 발령. 손씻기 생활화 및 마스크 착용 등 개인 위생 수칙을 준수해 주세요.'
    },
    {
        sentAt: '2024/02/10 09:20:00',
        region: '강원도 강릉시',
        type: '산불조심',
        level: '주의',
        text: '[산림청] 건조한 날씨로 산불 위험이 높습니다. 입산 시 인화물질 소지를 금지하고 소각 행위를 자제해 주세요.'
    },
    {
        sentAt: '2024/02/09 15:10:00',
        region: '부산광역시 해운대구',
        type: '시설물안전',
        level: '안전안내',
        text: '[해운대구청] 강풍으로 인한 간판 추락 등 낙하물 사고에 유의하시기 바라며, 해안가 접근을 자제해 주세요.'
    }
];

export async function GET(request: NextRequest) {
    const serviceKey = process.env.SAFETYDATA_SERVICE_KEY;

    try {
        const { searchParams } = new URL(request.url);
        const numOfRows = parseInt(searchParams.get('numOfRows') || '20');
        const regionFilter = searchParams.get('region') || '';
        const latest = searchParams.get('latest') !== 'false';
        const forceRefresh = searchParams.get('force') === 'true';
        const useMock = searchParams.get('mock') === 'true';

        // 🟢 If mock requested or service key missing, return mock data
        if (useMock || !serviceKey) {
            console.log('⚠️ Using Mock Data (Explicit or No Key)');
            return NextResponse.json({
                ok: true,
                count: MOCK_MESSAGES.length,
                totalCount: MOCK_MESSAGES.length,
                messages: MOCK_MESSAGES,
                mock: true
            });
        }

        // ⚡ Cache Check
        const now = Date.now();
        if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION_MS) {
            console.log('📦 캐시된 재난문자 데이터 반환');
            let messages = cachedData.messages;
            if (regionFilter) messages = messages.filter(msg => msg.region.includes(regionFilter));
            return NextResponse.json({
                ok: true,
                count: messages.slice(0, numOfRows).length,
                totalCount: cachedData.totalCount,
                messages: messages.slice(0, numOfRows),
                filters: { region: regionFilter || null, latest },
                cached: true,
                cacheAge: Math.round((now - cacheTimestamp) / 1000) + '초'
            });
        }

        // 1. Get Total Count
        const countUrl = new URL(DISASTER_MESSAGE_API_URL);
        countUrl.searchParams.append('serviceKey', serviceKey);
        countUrl.searchParams.append('pageNo', '1');
        countUrl.searchParams.append('numOfRows', '1');

        const countResponse = await fetch(countUrl.toString());
        const countText = await countResponse.text();

        let countData;
        try {
            countData = JSON.parse(countText);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            console.error("JSON Parse Error (Count):", countText.substring(0, 100));
            // Return Mock on Parse Error (likely HTML error page)
            return NextResponse.json({
                ok: true,
                count: MOCK_MESSAGES.length,
                totalCount: MOCK_MESSAGES.length,
                messages: MOCK_MESSAGES,
                mock: true,
                originalError: 'JSON_PARSE_ERROR'
            });
        }

        // API Error Check (e.g. Unregistered IP)
        if (countData.header?.resultCode !== '00') {
            console.warn(`API Error: ${countData.header?.resultCode} - ${countData.header?.resultMsg}`);
            // Return Mock on API Error
            return NextResponse.json({
                ok: true,
                count: MOCK_MESSAGES.length,
                totalCount: MOCK_MESSAGES.length,
                messages: MOCK_MESSAGES,
                mock: true,
                originalError: countData.header?.resultMsg
            });
        }

        const totalCount = countData.totalCount || 0;

        if (totalCount === 0) {
            return NextResponse.json({ ok: true, count: 0, totalCount: 0, messages: [] });
        }

        // 2. Fetch Data
        const fetchCount = regionFilter ? numOfRows * 5 : numOfRows;
        const lastPageNo = latest ? Math.max(1, Math.ceil(totalCount / fetchCount)) : 1;

        const dataUrl = new URL(DISASTER_MESSAGE_API_URL);
        dataUrl.searchParams.append('serviceKey', serviceKey);
        dataUrl.searchParams.append('pageNo', lastPageNo.toString());
        dataUrl.searchParams.append('numOfRows', fetchCount.toString());

        const dataResponse = await fetch(dataUrl.toString());
        const dataText = await dataResponse.text();

        let parsedData;
        try {
            parsedData = JSON.parse(dataText);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            console.error("JSON Parse Error (Data):", dataText.substring(0, 100));
            return NextResponse.json({
                ok: true,
                count: MOCK_MESSAGES.length,
                totalCount: MOCK_MESSAGES.length,
                messages: MOCK_MESSAGES,
                mock: true,
                originalError: 'JSON_PARSE_ERROR_DATA'
            });
        }

        const rawMessages: RawMessage[] = parsedData.body || [];
        let messages: FormattedMessage[] = rawMessages.map((msg) => ({
            sentAt: msg.CRT_DT || '',
            region: msg.RCPTN_RGN_NM?.trim() || '',
            type: msg.DST_SE_NM || '',
            level: msg.EMRG_STEP_NM || '',
            text: msg.MSG_CN || '',
        }));

        if (latest) {
            messages = messages.sort((a, b) => {
                const dateA = new Date(a.sentAt.replace(/\//g, '-'));
                const dateB = new Date(b.sentAt.replace(/\//g, '-'));
                return dateB.getTime() - dateA.getTime();
            });
        }

        cachedData = { messages: [...messages], totalCount };
        cacheTimestamp = Date.now();

        if (regionFilter) {
            messages = messages.filter(msg => msg.region.includes(regionFilter));
        }

        messages = messages.slice(0, numOfRows);

        return NextResponse.json({
            ok: true,
            count: messages.length,
            totalCount,
            messages,
            filters: { region: regionFilter || null, latest }
        });

    } catch (error) {
        console.error("API Route Exception:", error);
        // Return Mock on Exception
        return NextResponse.json({
            ok: true,
            count: MOCK_MESSAGES.length,
            totalCount: MOCK_MESSAGES.length,
            messages: MOCK_MESSAGES,
            mock: true,
            originalError: error instanceof Error ? error.message : 'UNKNOWN_EXCEPTION'
        });
    }
}

