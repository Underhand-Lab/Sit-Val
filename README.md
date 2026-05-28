# ⚾ Sit-Val: Sabermetrics Wiki & Analysis Tool

**Sit-Val**은 야구 기록을 누구나 등록하고 관리할 수 있는 **위키 스타일의 베이스볼 레퍼런스**이자, **흡수 마르코프 연쇄(Absorbing Markov Chain)** 모델을 통해 타격 기록의 정교한 확장 가치를 산출하는 전문 분석 도구입니다.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

---

## 🚀 핵심 목표 및 기능

### 1. 베이스볼 레퍼런스형 위키 시스템
*   **기록 아카이브:** 리그, 팀, 선수의 연도별 타격 기록을 체계적으로 저장하고 검색할 수 있습니다.
*   **포크(Fork) 및 편집:** 타인이 등록한 기록을 기반으로 자신만의 시나리오를 구성할 수 있도록 자유로운 편집 및 복제 기능을 제공합니다.
*   **타격 결과 중심:** 단순한 결과값이 아닌, 상황별 타격 결과(안타, 볼넷, 아웃 종류 등)의 분포를 상세하게 관리합니다.

### 2. 마르코프 모델 기반 확장 가치 계산
*   **흡수 마르코프 연쇄 엔진:** 야구의 모든 상황(아웃, 주자 상태)을 확률 전이 행렬로 모델링하여 기대 득점(Expected Runs)을 수학적으로 산출합니다.
*   **정밀한 Sabermetrics 지표:**
    *   **RE24 상황판:** 상황별 기대 득점 변화를 즉시 시각화합니다.
    *   **리그 가치 산출:** 해당 리그의 평균을 기반으로 한 wOBA Weights 및 Scale을 자동으로 계산합니다.
    *   **개인 가치 분석:** 특정 선수의 기록이 리그 평균 대비 어느 정도의 가치(wRAA, wRC+)를 가지는지 정량화합니다.

### 3. 유연한 시뮬레이션 및 대시보드
*   **라인업 시뮬레이션:** 타순 배치 및 주자의 주루 능력 설정에 따른 9이닝당 기대 득점 변화를 분석합니다.
*   **Visualizer Dashboard:** RE24, 9RE, 타구 가치 등 다양한 분석 도구를 사용자가 원하는 대로 배치하고 조합할 수 있습니다.

## 📂 프로젝트 구조
```text
@packages/sit-val    # 흡수 마르코프 연쇄 모델
@apps/              # Domain Applications (선수, 리그, 라인업)
@shared/            # Shared Utilities (공통 컴포넌트)
public/             # 정적 자원 (앱 아이콘, 가이드 마크다운 등)
```

## 🛠 Technology Stack

- **Frontend**: React, TypeScript, Vite
- **Backend/DB**: Supabase (RLS 기반 보안 및 소유권 관리)
- **Sabermetric Engine**: Absorbing Markov Chain Model (Custom Implementation)

## Deployment
GitHub Actions를 통해 메인 브랜치 푸시 시 GitHub Pages로 자동 빌드 및 배포됩니다.

---
© 2026 Underland Lab. All rights reserved.