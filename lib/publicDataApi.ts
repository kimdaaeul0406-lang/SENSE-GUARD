/**
 * 공공데이터 API 클라이언트
 * 프론트엔드에서 사용하는 API 호출 함수
 * 
 * 중요: 이 파일은 serviceKey를 직접 사용하지 않음
 * 모든 API 호출은 Next.js API Route를 통해 수행됨
 */

// 기상특보 조회 파라미터
interface WeatherAlertParams {
    stnId?: string;      // 지점번호 (기본값: 108 - 서울)
    numOfRows?: number;  // 한 페이지 결과 수
    pageNo?: number;     // 페이지 번호
}

// 화재정보 조회 파라미터
interface FireInfoParams {
    sidoNm?: string;     // 시도명 (예: 서울특별시)
    numOfRows?: number;  // 한 페이지 결과 수
    pageNo?: number;     // 페이지 번호
}

// API 응답 타입
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * 기상청 기상특보 조회
 * serviceKey는 서버측 API Route에서 처리됨
 */
export async function getWeatherAlerts(params: WeatherAlertParams = {}): Promise<ApiResponse<Record<string, unknown>>> {
    try {
        const searchParams = new URLSearchParams();

        if (params.stnId) searchParams.append('stnId', params.stnId);
        if (params.numOfRows) searchParams.append('numOfRows', params.numOfRows.toString());
        if (params.pageNo) searchParams.append('pageNo', params.pageNo.toString());

        const queryString = searchParams.toString();
        const url = `/api/weather-alert${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);
        const data = await response.json();

        return data;
    } catch (error) {
        return {
            success: false,
            error: 'FETCH_ERROR',
            message: error instanceof Error ? error.message : '기상특보 정보를 가져오는데 실패했습니다.',
        };
    }
}

/**
 * 소방청 화재정보 조회
 * serviceKey는 서버측 API Route에서 처리됨
 */
export async function getFireInfo(params: FireInfoParams = {}): Promise<ApiResponse<Record<string, unknown>>> {
    try {
        const searchParams = new URLSearchParams();

        if (params.sidoNm) searchParams.append('sidoNm', params.sidoNm);
        if (params.numOfRows) searchParams.append('numOfRows', params.numOfRows.toString());
        if (params.pageNo) searchParams.append('pageNo', params.pageNo.toString());

        const queryString = searchParams.toString();
        const url = `/api/fire-info${queryString ? `?${queryString}` : ''}`;

        const response = await fetch(url);
        const data = await response.json();

        return data;
    } catch (error) {
        return {
            success: false,
            error: 'FETCH_ERROR',
            message: error instanceof Error ? error.message : '화재정보를 가져오는데 실패했습니다.',
        };
    }
}

/**
 * 지역 코드 매핑 (기상청 지점번호)
 */
export const WEATHER_STATION_CODES: Record<string, string> = {
    '서울': '108',
    '부산': '159',
    '대구': '143',
    '인천': '112',
    '광주': '156',
    '대전': '133',
    '울산': '152',
    '세종': '239',
    '경기': '119',
    '강원': '105',
    '충북': '131',
    '충남': '129',
    '전북': '146',
    '전남': '165',
    '경북': '138',
    '경남': '155',
    '제주': '184',
};

/**
 * 시도명 목록 (소방청 API용)
 */
export const SIDO_NAMES = [
    '서울특별시',
    '부산광역시',
    '대구광역시',
    '인천광역시',
    '광주광역시',
    '대전광역시',
    '울산광역시',
    '세종특별자치시',
    '경기도',
    '강원도',
    '충청북도',
    '충청남도',
    '전라북도',
    '전라남도',
    '경상북도',
    '경상남도',
    '제주특별자치도',
];
