import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보처리방침 | SENSE-GUARD",
    description: "SENSE-GUARD 앱의 개인정보처리방침",
};

export default function PrivacyPolicyPage() {
    return (
        <div className="flex-1 overflow-y-auto bg-white">
            <div className="px-6 py-10 max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    개인정보처리방침
                </h1>
                <p className="text-sm text-gray-500 mb-8">
                    최종 수정일: 2026년 3월 3일
                </p>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        1. 소개
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                        SENSE-GUARD(이하 &quot;앱&quot;)는 청각장애인을 위한 AI 기반 소리
                        감지 서비스입니다. 본 개인정보처리방침은 앱이 수집하는 정보, 사용
                        방법, 이용자의 권리에 대해 설명합니다.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        2. 수집하는 정보
                    </h2>

                    <h3 className="text-base font-medium text-gray-700 mt-4 mb-2">
                        2.1 마이크 오디오 데이터
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        앱은 주변 소리를 분석하기 위해 기기의 마이크에 접근합니다. 마이크를
                        통해 수집된 오디오 데이터는 <strong>위험 소리(사이렌, 경보음 등)를
                            실시간으로 감지</strong>하는 용도로만 사용되며, 녹음되거나 외부
                        서버에 영구적으로 저장되지 않습니다.
                    </p>

                    <h3 className="text-base font-medium text-gray-700 mt-4 mb-2">
                        2.2 계정 정보
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        Google 로그인을 통해 인증할 경우, 이메일 주소와 프로필 이름이
                        수집됩니다. 이 정보는 사용자 식별 및 서비스 제공 목적으로만
                        사용됩니다.
                    </p>

                    <h3 className="text-base font-medium text-gray-700 mt-4 mb-2">
                        2.3 알림 권한
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                        위험 소리가 감지되었을 때 사용자에게 즉시 알림을 보내기 위해 알림
                        권한을 요청합니다.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        3. 정보의 사용 목적
                    </h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                        <li>위험 소리(사이렌, 경보음, 화재 경보 등)의 실시간 감지 및 알림</li>
                        <li>AI 기반 소리 분석을 통한 위험 상황 판단</li>
                        <li>재난 정보 및 긴급 알림 제공</li>
                        <li>사용자 인증 및 맞춤형 서비스 제공</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        4. 데이터 저장 및 전송
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                        마이크를 통해 수집된 오디오 데이터는 기기 내에서 실시간으로
                        처리되며, AI 분석을 위해 일시적으로 서버에 전송될 수 있습니다.
                        분석이 완료된 후 해당 데이터는 즉시 삭제되며, 영구적으로 저장되지
                        않습니다.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        5. 제3자 제공
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                        앱은 수집한 개인정보를 제3자에게 판매, 공유하지 않습니다. 다만,
                        다음의 서비스 제공을 위해 제한적으로 데이터가 처리될 수 있습니다:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2 leading-relaxed">
                        <li>
                            <strong>Google Firebase</strong>: 사용자 인증
                        </li>
                        <li>
                            <strong>Google Gemini AI</strong>: 소리 분석
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        6. 이용자의 권리
                    </h2>
                    <ul className="list-disc list-inside text-gray-700 space-y-2 leading-relaxed">
                        <li>언제든지 마이크 및 알림 권한을 기기 설정에서 해제할 수 있습니다.</li>
                        <li>Google 계정 연동을 해제하여 로그아웃할 수 있습니다.</li>
                        <li>개인정보 삭제를 요청할 수 있습니다.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        7. 아동의 개인정보 보호
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                        본 앱은 만 13세 미만 아동을 대상으로 하지 않으며, 의도적으로 아동의
                        개인정보를 수집하지 않습니다.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        8. 개인정보처리방침의 변경
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                        본 방침은 법령 또는 서비스 변경 사항을 반영하기 위해 수정될 수
                        있으며, 변경 시 앱 내 또는 본 페이지를 통해 공지합니다.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                        9. 문의
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                        개인정보 관련 문의 사항이 있으신 경우 아래로 연락해 주시기 바랍니다.
                    </p>
                    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">
                            <strong>앱 이름:</strong> SENSE-GUARD
                        </p>
                        <p className="text-gray-700">
                            <strong>이메일:</strong> senseguard.app@gmail.com
                        </p>
                    </div>
                </section>

                <hr className="my-8 border-gray-200" />
                <p className="text-xs text-gray-400 text-center">
                    © 2026 SENSE-GUARD. All rights reserved.
                </p>
            </div>
        </div>
    );
}
