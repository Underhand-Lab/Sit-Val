# Current Task

## Goal

* 3차 보완 항목인 라인업 상태 모델 단순화, 코드 스플리팅, 로딩/에러 UX 개선을 수행한다.

## Plan

* [x] 3차 대상 구조를 확인한다.
* [x] 라인업 상태 모델을 파생 상태 중심으로 단순화한다.
* [x] 페이지 라우트를 lazy loading으로 전환한다.
* [x] 로딩/에러 UX를 공통 컴포넌트 수준으로 개선한다.
* [x] 빌드 1회로 변경 결과를 검증한다.
* [x] 작업 결과와 이슈를 `working.md`에 반영한다.

## Progress

* 라인업 훅에서 `currentLineupPlayers`를 `lineupOrder` 기반 파생 상태로 단순화하고 setter는 `lineupOrder` 갱신으로 연결했다.
* 라우트를 `React.lazy`와 `Suspense`로 전환해 페이지 단위 코드 스플리팅을 적용했다.
* 목록 화면 공통 상태 메시지 컴포넌트를 추가해 로딩/에러/빈 상태 UX를 정리했다.
* `npm run build`를 1회 수행했고 빌드는 성공했다.

## Decisions

* 라인업 편집 API는 유지하되 내부에서는 `lineupOrder`를 단일 기준 상태로 사용한다.
* 코드 스플리팅은 우선 라우트 lazy loading부터 적용한다.

## Pending

* 없음

## Issues

* 현재 빌드 기준 치명적 이슈 없음

## Change Log

* 2026-06-25: Initial task created
* 2026-06-25: App analysis document added and build verification completed
* 2026-06-25: Data access layer split into repositories and facade retained
* 2026-06-25: Home page changed from full listing to recent-summary dashboard
* 2026-06-25: Second-phase cleanup completed with page model hooks and cache version/TTL
* 2026-06-25: Third-phase cleanup completed with lineup state simplification and route-level code splitting
