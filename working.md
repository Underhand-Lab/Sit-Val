# Current Task

## Goal

* `Modal.tsx`에서 발생하는 `t is not defined` 런타임 오류를 제거한다.

## Plan

* [x] `Modal.tsx`의 오류 지점을 확인한다.
* [x] 현재 프로젝트 구조에 맞는 최소 수정으로 잘못된 참조를 제거한다.
* [x] 빌드 1회로 결과를 검증하고 `working.md`에 반영한다.

## Progress

* `Modal.tsx`의 닫기 버튼이 `t("common.close")`를 호출하지만 `t` import나 정의가 없다.
* 현재 코드 검색 기준으로 `t(` 사용처는 `Modal.tsx` 한 곳뿐이라, 전체 i18n 연결 문제라기보다 단일 잘못된 참조에 가깝다.
* `Modal.tsx`의 닫기 버튼 문구를 직접 문자열로 바꿔 런타임 `ReferenceError`를 제거했다.
* `npm run build` 1회 실행 결과 성공했다.

## Decisions

* 이번 수정은 런타임 오류 제거가 목적이므로, `Modal.tsx` 버튼 문구는 직접 문자열로 처리한다.

## Pending

* 없음

## Issues

* 없음

## Change Log

* 2026-06-25: Initial task created
* 2026-06-25: App analysis document added and build verification completed
* 2026-06-25: Data access layer split into repositories and facade retained
* 2026-06-25: Home page changed from full listing to recent-summary dashboard
* 2026-06-25: Second-phase cleanup completed with page model hooks and cache version/TTL
* 2026-06-25: Third-phase cleanup completed with lineup state simplification and route-level code splitting
* 2026-06-25: Started migration from separate edit pages to inline VisualizerList editing
* 2026-06-25: Completed inline editing migration and removed standalone edit pages
* 2026-06-25: Re-scoped editing flow to add-sheet-based editor tools
* 2026-06-25: Completed add-sheet-based editor tool migration and removed inline edit controls
* 2026-06-25: Enabled immediate lineup stat reflection before save
* 2026-06-25: Fixed stale player editor tool state so changes reflect immediately
* 2026-06-25: Fixed stale common visualizer props so player stat panels update immediately
* 2026-06-25: Split lineup editor into lineup info and player info flows
* 2026-06-25: Added initial Supabase seed migration for league/team/player data
* 2026-06-25: Rebuilt Supabase schema, security, and seed SQL from frontend-driven ERD
* 2026-06-25: Converted ERD document to Mermaid for VS Code preview
* 2026-06-25: Moved runner values into league/team seasons with explicit fallback design
* 2026-06-26: Updated app DB compatibility layer for redesigned Supabase schema
* 2026-06-26: Removed standalone login page route and kept modal-only login flow
* 2026-06-26: Removed duplicated title and nested box from login modal
* 2026-06-26: Added my analysis lists to account page with per-section limit
* 2026-06-26: Reordered account page so my analysis sections appear before account settings
* 2026-06-26: Split account page into analysis/settings subtabs
* 2026-06-26: Restyled account subtabs and content panel to align with VisualizerList branding
* 2026-06-26: Removed outer account page box so the page uses the full analysis-style width
* 2026-06-26: Removed account page header so the tab panel occupies the page body directly
* 2026-06-26: Matched account page flow to player analysis layout and expanded settings panel to full body height
* 2026-06-26: Switched account analysis tab to VisualizerList + panel-add flow for my-analysis lists
* 2026-06-26: Seeded default account analysis panel so VisualizerList add button is always accessible
* 2026-06-26: Stabilized account analysis panel definitions to match other VisualizerList-based analysis pages
* 2026-06-26: Unified the entire account page under VisualizerList panels including account settings
* 2026-06-26: Stabilized account panel option references to prevent VisualizerList empty-layout warnings and update loops
* 2026-06-26: Locked account settings panel removal while keeping it inside VisualizerList
* 2026-06-26: Unified global font declarations to Giants to remove nav/content font mismatch
* 2026-06-26: Synced LeaguePage tool initialization and runner stats persistence with current page architecture
* 2026-06-26: Removed legacy BottomSheet editing from league personal visualizer and wired it to panel-based editing
* 2026-06-26: Fixed LeagueSearchPage using outdated league code instead of current league id
* 2026-06-26: Applied fixed-choice SearchableSelect to player league linking and lineup player selection flows
* 2026-06-26: Fixed Modal runtime error caused by undefined translation helper
