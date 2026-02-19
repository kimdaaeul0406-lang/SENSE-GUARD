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

// Helper to get date string YYYYMMDD relative to today
function getRelativeDateStr(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

const MOCK_FIRE_DATA = [
    {
        ocrnDt: getRelativeDateStr(0),
        sido_nm: '경기도',
        sggNm: '수원시',
        fire_grd_nm: '화재',
        fire_caush_nm: '전기적 요인',
        siDoNm: '경기도',
        ocrn_ymd: getRelativeDateStr(0)
    },
    {
        ocrnDt: getRelativeDateStr(0),
        sido_nm: '서울특별시',
        sggNm: '강남구',
        fire_grd_nm: '구조',
        fire_caush_nm: '교통사고',
        siDoNm: '서울특별시',
        ocrn_ymd: getRelativeDateStr(0)
    },
    {
        ocrnDt: getRelativeDateStr(0),
        sido_nm: '부산광역시',
        sggNm: '해운대구',
        fire_grd_nm: '화재',
        fire_caush_nm: '부주의',
        siDoNm: '부산광역시',
        ocrn_ymd: getRelativeDateStr(1)
    },
    {
        ocrnDt: getRelativeDateStr(1),
        sido_nm: '강원도',
        sggNm: '속초시',
        fire_grd_nm: '산불',
        fire_caush_nm: '담배꽁초',
        siDoNm: '강원도',
        ocrn_ymd: getRelativeDateStr(1)
    },
    {
        ocrnDt: getRelativeDateStr(1),
        sido_nm: '인천광역시',
        sggNm: '부평구',
        fire_grd_nm: '구급',
        fire_caush_nm: '복통 호소',
        siDoNm: '인천광역시',
        ocrn_ymd: getRelativeDateStr(1)
    }
];

export async function GET(request: NextRequest) {
    const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;

    // Use Mock if no key (Local dev environment)
    if (!serviceKey) {
        return NextResponse.json({
            success: true,
            status: 200,
            isJson: true,
            data: {
                response: {
                    body: {
                        items: {
                            item: MOCK_FIRE_DATA
                        }
                    }
                }
            },
            mock: true
        });
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

        // Return Mock if API fails or returns non-JSON (often XML service errors)
        if (!response.ok || !isJson || !parsedData.response || !parsedData.response.body) {
            console.warn("Fire API Failed, using Mock", rawText.substring(0, 100));
            return NextResponse.json({
                success: true,
                status: 200,
                isJson: true,
                data: {
                    response: {
                        body: {
                            items: {
                                item: MOCK_FIRE_DATA
                            }
                        }
                    }
                },
                mock: true,
                originalError: isJson ? parsedData : rawText.substring(0, 100)
            });
        }

        return NextResponse.json({
            success: response.ok && isJson,
            status: response.status,
            isJson,
            requestedDate: ocrnYmd,
            data: parsedData,
        });
    } catch (error) {
        console.error("Fire API Exception", error);
        return NextResponse.json({
            success: true,
            status: 200,
            isJson: true,
            data: {
                response: {
                    body: {
                        items: {
                            item: MOCK_FIRE_DATA
                        }
                    }
                }
            },
            mock: true,
            originalError: error instanceof Error ? error.message : 'UNKNOWN_EXCEPTION'
        });
    }
}
