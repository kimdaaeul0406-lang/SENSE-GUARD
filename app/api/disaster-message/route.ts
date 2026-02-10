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

export async function GET(request: NextRequest) {
    const serviceKey = process.env.SAFETYDATA_SERVICE_KEY;

    if (!serviceKey) {
        return NextResponse.json(
            {
                ok: false,
                error: 'SERVICE_KEY_NOT_FOUND',
                message: '환경변수 SAFETYDATA_SERVICE_KEY가 설정되지 않았습니다.',
            },
            { status: 500 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const numOfRows = parseInt(searchParams.get('numOfRows') || '20');
        const regionFilter = searchParams.get('region') || ''; // 지역 필터 (예: "서울", "경기")
        const latest = searchParams.get('latest') !== 'false'; // 기본값: 최신순
        const forceRefresh = searchParams.get('force') === 'true'; // 강제 새로고침

        // ⚡ 캐시 확인 (30분 이내면 캐시된 데이터 반환, force=true면 무시)
        const now = Date.now();
        if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION_MS) {
            console.log('📦 캐시된 재난문자 데이터 반환');
            let messages = cachedData.messages;

            // 지역 필터 적용
            if (regionFilter) {
                messages = messages.filter(msg => msg.region.includes(regionFilter));
            }

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

        // 1단계: totalCount 확인을 위한 첫 번째 요청
        const countUrl = new URL(DISASTER_MESSAGE_API_URL);
        countUrl.searchParams.append('serviceKey', serviceKey);
        countUrl.searchParams.append('pageNo', '1');
        countUrl.searchParams.append('numOfRows', '1');

        const countResponse = await fetch(countUrl.toString());
        const countText = await countResponse.text();

        let countData;
        try {
            countData = JSON.parse(countText);
        } catch {
            return NextResponse.json({
                ok: false,
                error: 'PARSE_ERROR',
                message: 'API 응답을 파싱할 수 없습니다.',
            }, { status: 500 });
        }

        // API 에러 체크
        if (countData.header?.resultCode !== '00') {
            return NextResponse.json({
                ok: false,
                error: countData.header?.resultCode || 'UNKNOWN_ERROR',
                message: countData.header?.resultMsg || '알 수 없는 오류',
            }, { status: 500 });
        }

        const totalCount = countData.totalCount || 0;

        if (totalCount === 0) {
            return NextResponse.json({
                ok: true,
                count: 0,
                totalCount: 0,
                messages: [],
            });
        }

        // 2단계: 최신 데이터를 가져오기 위해 마지막 페이지 계산
        // 더 많은 데이터를 가져와서 필터링 후 원하는 개수만큼 반환
        const fetchCount = regionFilter ? numOfRows * 5 : numOfRows; // 필터 있으면 더 많이 가져옴
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
        } catch {
            return NextResponse.json({
                ok: false,
                error: 'PARSE_ERROR',
                message: 'API 응답을 파싱할 수 없습니다.',
            }, { status: 500 });
        }

        // 메시지 가공
        const rawMessages: RawMessage[] = parsedData.body || [];
        let messages: FormattedMessage[] = rawMessages.map((msg) => ({
            sentAt: msg.CRT_DT || '',
            region: msg.RCPTN_RGN_NM?.trim() || '',
            type: msg.DST_SE_NM || '',
            level: msg.EMRG_STEP_NM || '',
            text: msg.MSG_CN || '',
        }));

        // 최신순 정렬 (날짜 내림차순)
        if (latest) {
            messages = messages.sort((a, b) => {
                const dateA = new Date(a.sentAt.replace(/\//g, '-'));
                const dateB = new Date(b.sentAt.replace(/\//g, '-'));
                return dateB.getTime() - dateA.getTime();
            });
        }

        // ⚡ 캐시에 저장 (필터 적용 전 전체 데이터)
        cachedData = { messages: [...messages], totalCount };
        cacheTimestamp = Date.now();
        console.log('💾 재난문자 데이터 캐시 저장 완료');

        // 지역 필터 적용
        if (regionFilter) {
            messages = messages.filter(msg =>
                msg.region.includes(regionFilter)
            );
        }

        // 요청한 개수만큼 자르기
        messages = messages.slice(0, numOfRows);

        return NextResponse.json({
            ok: true,
            count: messages.length,
            totalCount,
            messages,
            filters: {
                region: regionFilter || null,
                latest,
            }
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

