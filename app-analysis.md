# Sit-Val 앱 분석 및 보완점

## 1. 현재 앱 개요

Sit-Val은 React + Vite + TypeScript 기반의 야구 세이버메트릭스 분석 앱이다. 주요 기능은 다음 세 축으로 정리된다.

* 리그 기록 관리 및 기대득점/타구가치 분석
* 선수 기록 관리 및 리그 기준 개인 가치 분석
* 라인업 구성 및 득점 기대값 시뮬레이션

구조상 `@apps`에 화면과 도메인 로직, `@packages/sit-val`에 계산 엔진, `@shared`에 공통 UI가 분리되어 있어 기능 방향은 명확하다. 특히 계산 엔진이 프론트와 분리되어 있는 점은 장기적으로 강점이다.

## 2. 잘 되어 있는 점

* 계산 엔진과 화면 계층이 물리적으로 분리되어 있어 분석 모델 고도화에 유리하다.
* Supabase 기반 CRUD와 인증 흐름이 이미 연결되어 있어 서비스형 앱으로 확장 가능한 기반이 있다.
* 리그, 선수, 라인업이 유사한 UX 패턴으로 맞춰져 있어 사용자가 흐름을 익히기 쉽다.
* 캐시를 이용해 재방문 시 초기 깜빡임을 줄이려는 시도가 들어가 있다. `@apps/services/db.ts`

## 3. 핵심 보완점

### P1. 로그인 입력 컴포넌트가 의미적으로 잘못 연결되어 있다

로그인/계정 화면에서 이메일, 비밀번호, 닉네임 입력에 `InputNumber`를 사용하고 있는데, 이 컴포넌트는 내부에서 항상 `type="number"`를 강제한다. [@apps/pages/LoginPage.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/pages/LoginPage.tsx:74), [@shared/components/ui-brick/react-web/common/input/InputNumber.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@shared/components/ui-brick/react-web/common/input/InputNumber.tsx:6)

영향:

* 모바일 키보드와 브라우저 기본 검증이 왜곡될 수 있다.
* 비밀번호/이메일 입력 UX가 브라우저마다 불안정해질 수 있다.
* 공통 입력 컴포넌트 신뢰도가 떨어진다.

권장 보완:

* 범용 `InputText` 또는 `InputField`를 분리한다.
* `InputNumber`는 숫자 입력 전용으로 제한한다.
* 로그인/계정 화면은 시맨틱한 input 타입을 그대로 사용한다.

### P1. 데이터 접근 계층이 너무 많은 책임을 한 파일에 집중하고 있다

`db.ts` 한 파일에서 인증, 캐시, 리그/선수/라인업 CRUD, 검색, 유저 설정까지 모두 처리한다. 파일 길이도 400줄을 넘는다. [@apps/services/db.ts](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/services/db.ts:1)

영향:

* 수정 범위 예측이 어렵다.
* 캐시 정책과 DB 쿼리 변경이 서로 얽힌다.
* 기능 추가 시 회귀 위험이 커진다.

권장 보완:

* `authRepository`, `leagueRepository`, `playerRepository`, `lineupRepository`, `cacheStore`로 분리한다.
* `_transformBatterStats`, `_transformRunnerStats` 같은 변환 로직은 별도 mapper 파일로 분리한다.
* `any` 기반 반환을 줄이고 도메인별 반환 타입을 명시한다.

### P1. 홈 화면이 전체 데이터를 한 번에 읽는 구조라 확장성에 불리하다

홈 화면 진입 시 리그 전체, 선수 전체, 라인업 전체를 모두 가져온 뒤 클라이언트에서 필터링한다. [@apps/pages/HomePage.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/pages/HomePage.tsx:16)

영향:

* 데이터가 늘면 첫 화면 속도가 급격히 떨어진다.
* 불필요한 네트워크 사용량과 메모리 사용이 생긴다.
* 검색 UX가 서버 데이터 규모에 직접 영향을 받는다.

권장 보완:

* 홈 화면은 최근 항목 또는 추천 항목만 요약 조회한다.
* 검색은 디바운스 + 서버 검색으로 분리한다.
* 리스트 페이지에 페이지네이션 또는 lazy loading을 도입한다.

### P2. 페이지 컴포넌트에 상태, 로딩, 계산, 편집 흐름이 과도하게 섞여 있다

`LeaguePage`, `PlayerPage`, `LineupPage`는 각각 데이터 로딩, 캐시 복구, 편집 모드, 시각화 계산, 도구 상태까지 모두 들고 있다. [@apps/pages/LeaguePage.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/pages/LeaguePage.tsx:38), [@apps/pages/PlayerPage.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/pages/PlayerPage.tsx:41), [@apps/pages/LineupPage.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/pages/LineupPage.tsx:43)

영향:

* 버그가 생겼을 때 원인 추적이 어렵다.
* 공통 흐름이 반복되는데 재사용되지 않는다.
* 파일 크기가 커지고 테스트 포인트가 흐려진다.

권장 보완:

* `useLeaguePageModel`, `usePlayerPageModel`, `useLineupPageModel` 같은 커스텀 훅으로 상태를 분리한다.
* 계산 로직은 `useMemo` 또는 전용 서비스 계층으로 이동한다.
* 편집/조회 모드 전환과 저장 전 임시복구 로직은 공통 훅으로 통합한다.

### P2. 타입 안정성이 충분하지 않다

여러 곳에서 `any[]`, `(db as any)`, `any` 에러 객체를 사용하고 있다. [@apps/pages/HomePage.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/pages/HomePage.tsx:11), [@apps/pages/HomePage.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/pages/HomePage.tsx:23)

영향:

* 런타임 오류가 컴파일 단계에서 잡히지 않는다.
* 리팩터링 시 IDE 지원이 약해진다.
* 도메인 모델이 코드에 충분히 반영되지 않는다.

권장 보완:

* 홈 화면 카드 타입을 `YearlyLeague`, `YearlyPlayerWithName`, `YearlyLineup`으로 명시한다.
* `db` API는 존재 여부를 가정하는 우회 코드 대신 명시 타입으로 통일한다.
* Supabase 응답 타입을 함수 시그니처에 직접 반영한다.

### P2. 캐시 정책이 단순해서 데이터 불일치 가능성이 있다

현재 캐시는 `localStorage`와 메모리 캐시를 함께 쓰지만 TTL, 버전, 무효화 정책이 없다. [@apps/services/db.ts](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/services/db.ts:4)

영향:

* 스키마가 바뀌거나 저장 포맷이 변하면 오래된 캐시가 그대로 남을 수 있다.
* 사용자 간 전환, 권한 변경, 데이터 수정 후 화면 불일치가 생길 수 있다.

권장 보완:

* 캐시 키에 버전 정보를 포함한다.
* 항목별 TTL을 둔다.
* 로그인/로그아웃 시 사용자 관련 캐시를 정리한다.

### P3. 라인업 페이지의 동기화 로직이 복잡하고 유지보수 비용이 높다

라인업 화면은 `lineupOrder`, `currentLineupPlayers`, `availablePlayers`를 별도 상태로 들고 있고, 플레이스홀더와 `JSON.stringify` 비교로 동기화한다. [@apps/pages/LineupPage.tsx](/Users/easyh/Documents/GitHub/underland-lab/sit-val/@apps/pages/LineupPage.tsx:150)

영향:

* 작은 변경에도 무한 루프나 상태 불일치 가능성이 있다.
* 편집 도중 연도 변경 시 예상치 못한 플레이스홀더 치환이 생길 수 있다.

권장 보완:

* 단일 진실 원천을 `lineupOrder`로 두고 표시용 선수 목록은 파생값으로 계산한다.
* 플레이스홀더 생성과 실제 선수 매핑을 selector 함수로 분리한다.

### P3. 번들 크기가 커서 초기 로딩 최적화 여지가 크다

프로덕션 빌드는 성공했지만 메인 JS 청크가 704KB로 경고가 발생했다.

영향:

* 첫 로드 성능 저하
* 모바일 네트워크 환경에서 체감 속도 저하

권장 보완:

* 페이지 단위 `lazy()` + `Suspense` 적용
* 무거운 시각화 컴포넌트와 계산 도구를 동적 import로 분리
* 계산 엔진 및 UI 라이브러리의 청크 전략을 조정

## 4. 추천 우선순위 로드맵

### 1차

* [ ] 로그인/계정 입력 컴포넌트 정리
* [x] `db.ts` 책임 분리 설계 시작
* [x] 홈 화면 전체 조회 방식 축소

### 2차

* [x] 각 페이지 상태 로직을 커스텀 훅으로 분리
* [x] 타입 정리와 `any` 제거
* [x] 캐시 버전/TTL 정책 도입

### 3차

* [x] 라인업 상태 모델 단순화
* [x] 코드 스플리팅과 번들 최적화
* [x] 사용자 에러 메시지와 로딩 상태 UX 고도화

## 5. 종합 의견

현재 앱은 "도메인 목적성"은 분명하고 핵심 계산 기능도 이미 살아 있다. 다만 서비스가 커질수록 가장 먼저 부담이 될 부분은 화면 컴포넌트의 과도한 책임 집중, `db.ts` 단일 파일 의존, 그리고 홈 화면의 전체 조회 패턴이다.

즉, 지금 단계의 최우선 보완 방향은 새 기능 추가보다 "구조 안정화"에 가깝다. 이 세 부분만 먼저 정리해도 이후 선수/리그/라인업 기능 확장은 훨씬 안전해질 가능성이 높다.
