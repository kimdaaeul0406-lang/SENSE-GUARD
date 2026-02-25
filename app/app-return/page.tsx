'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AppReturnContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // 1. 모든 쿼리 파라미터를 가져옵니다 (토큰 등)
        const queryString = searchParams.toString();

        // 2. 앱의 커스텀 스킴 주소를 생성합니다.
        // 만약 App Links(HTTPS)가 작동하지 않을 경우를 대비해 스킴 방식으로도 호출을 시도합니다.
        const appSchemeUrl = `senseguard://auth?${queryString}`;

        // 3. 사용자에게 안내 메시지를 보여주거나 자동으로 앱 이동을 시도합니다.
        console.log('앱으로 복귀 시도 중:', appSchemeUrl);

        // 앱이 설치되어 있다면 이 페이지가 열리는 것 자체가 이미 App Link를 통한 것일 수 있습니다.
        // 하지만 브라우저에 남아있는 경우를 위해 링크를 한 번 더 클릭하게 하거나 자동 이동을 시도합니다.
        window.location.href = appSchemeUrl;

        // 잠시 후 메인 페이지로 돌아가게 설정 (앱 이동 실패 시)
        const timer = setTimeout(() => {
            router.push('/');
        }, 5000);

        return () => clearTimeout(timer);
    }, [searchParams, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">로그인 완료!</h1>
                <p className="text-slate-600 mb-6">앱으로 자동으로 돌아갑니다. 이동하지 않는다면 아래 버튼을 눌러주세요.</p>

                <a
                    href={`senseguard://auth?${searchParams.toString()}`}
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-4"
                >
                    앱으로 돌아가기
                </a>

                <div className="text-sm text-slate-400">
                    5초 후 메인 화면으로 이동합니다.
                </div>
            </div>
        </div>
    );
}

export default function AppReturnPage() {
    return (
        <Suspense fallback={<div>로딩 중...</div>}>
            <AppReturnContent />
        </Suspense>
    );
}
