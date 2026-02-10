# 공공데이터 API 연동 가이드

## 개요
SENSE-GUARD 프로젝트는 다음 공공데이터 API를 사용합니다.

---

## API 엔드포인트

### 1. 기상청 기상특보 API
- **경로**: `/api/weather-alert`
- **환경변수**: `DATA_GO_KR_SERVICE_KEY`
- **출처**: 공공데이터포털 (data.go.kr)
- **상태**: ✅ 로컬/배포 모두 정상 동작

```
GET /api/weather-alert
GET /api/weather-alert?stnId=108&numOfRows=10&pageNo=1
```

### 2. 소방청 화재정보 API
- **경로**: `/api/fire-info`
- **환경변수**: `DATA_GO_KR_SERVICE_KEY`
- **출처**: 공공데이터포털 (data.go.kr)
- **상태**: ✅ 로컬/배포 모두 정상 동작

```
GET /api/fire-info
GET /api/fire-info?ocrn_ymd=20260205&numOfRows=10&pageNo=1
```

### 3. 긴급재난문자 API
- **경로**: `/api/disaster-message`
- **환경변수**: `SAFETYDATA_SERVICE_KEY`
- **출처**: 재난안전데이터공유플랫폼 (safetydata.go.kr)
- **상태**: ⚠️ **배포 후 활성화**

```
GET /api/disaster-message
GET /api/disaster-message?pageNo=1&numOfRows=10
```

#### ⚠️ IP 화이트리스트 정책 안내
`safetydata.go.kr` API는 **등록된 공인 IP에서만 호출 가능**합니다.

| 환경 | 동작 여부 | 설명 |
|------|----------|------|
| 로컬 개발 | ⚠️ 공인 IP 등록 필요 | 사설 IP(192.168.x.x) 등록 시 동작 안됨 |
| Vercel 배포 | ✅ 가능 | 배포 서버의 공인 IP 등록 후 정상 동작 |

**로컬에서 `resultCode=32 (UNREGISTERED IP ERROR)` 발생 시 → 공인 IP 미등록 상태**

#### 🔧 공인 IP 등록 절차 (로컬 개발 환경)

**1단계: 현재 PC의 공인 IP 확인**
```bash
# 방법 1: curl 사용
curl https://api.ipify.org

# 방법 2: 브라우저에서 접속
# https://api.ipify.org 또는 https://ifconfig.me
```

**2단계: safetydata.go.kr에서 IP 변경 등록**
1. https://www.safetydata.go.kr 로그인
2. 마이페이지 → 인증키 관리 → 해당 API 키 선택
3. **변경신청** 클릭
4. 유저아이피(UserIP) 항목에 **1단계에서 확인한 공인 IP** 입력
5. 신청 완료 (즉시 또는 수 분 내 반영)

**3단계: API 재호출하여 확인**
```bash
curl http://localhost:3000/api/disaster-message
```
`resultMsg: "NORMAL SERVICE"` 확인되면 정상 동작

#### ⚠️ 주의사항
- 공유기 환경에서는 공인 IP가 변경될 수 있음 (ISP 정책에 따라 다름)
- IP 변경 시 safetydata 포털에서 다시 변경신청 필요
- 배포 환경(Vercel 등)은 별도의 공인 IP 등록 필요

---

## 환경변수 설정

`.env.local` 파일에 다음 값을 설정합니다:

```env
# Google AI
GOOGLE_API_KEY=your-google-api-key

# 공공데이터포털 (기상청, 소방청)
DATA_GO_KR_SERVICE_KEY=your-data-go-kr-service-key

# 재난안전데이터공유플랫폼 (긴급재난문자)
SAFETYDATA_SERVICE_KEY=your-safetydata-service-key
```

> ⚠️ `.env.local`은 `.gitignore`에 포함되어 있어 GitHub에 업로드되지 않습니다.

---

## 키 발급 안내

| 서비스 | 발급처 | URL |
|--------|--------|-----|
| DATA_GO_KR_SERVICE_KEY | 공공데이터포털 | https://www.data.go.kr |
| SAFETYDATA_SERVICE_KEY | 재난안전데이터공유플랫폼 | https://www.safetydata.go.kr |
