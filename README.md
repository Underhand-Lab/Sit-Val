# ⚾ Sit-Val (Situation-based Value model)

**Sit-Val**은 야구 경기에서 발생하는 타격 결과를 주자, 아웃, 득점 상태를 포함한 **상황(Situation)**으로 해석하고, 각 결과가 만들어내는 **기대 득점 변화**를 정량화하는 전문 분석 도구입니다. 

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

---

## ✨ 주요 기능

- **정교한 상황 모델링 (Situation Modeling)**: 주자의 진루 능력과 타격 결과 분포를 기반으로 상태 전이 행렬(Transition Matrix)을 구축하여 기대 득점(Expected Runs)을 정밀하게 계산합니다.
- **데이터 입력 및 커스터마이징**:
  - **Batter Input**: 실시간 타격 지표(AVG, OBP, SLG, OPS) 및 기대 타석 결과 계산
  - **Runner Input**: 상황별 주자 진루 확률(추가 진루, 병살, 도루 등)의 세부 설정 지원
- **리그 분석 (League Analysis)**:
  - 실시간 RE24 상황판 및 9이닝당 기대 득점 예측
  - 리그 확장 가치 지표(wOBA Scale, R/PA) 산출
  - 개인 기록 기반의 확장 가치(wOBA, wRAA, wRC+) 자동 계산
- **라인업 시뮬레이션 (Line-Up Simulation)**:
  - 팀 구성에 따른 9이닝당 기대 득점 변화 분석
  - 타순별 선두타자 시작 확률 및 이닝별 득점 분포 시뮬레이션
- **유연한 시각화 대시보드**: `VisualizerBox` 시스템을 통해 9RE, RE24 상황판, 타구 가치 분석 등 원하는 분석 도구를 자유롭게 추가하고 배치할 수 있습니다.

## 📂 프로젝트 구조

```text
src/
├── common/             # 공용 컴포넌트(UI, Input), 유틸리티 및 핵심 엔진(Transition Engine)
├── features/           # 도메인별 독립 모듈 (Vertical Slices)
│   ├── league/         # 리그 분석 관련 API, 시각화 컴포넌트(Visualizers)
│   └── line-up/        # 라인업 분석 관련 로직 및 컴포넌트
└── pages/              # 라우팅 단위 페이지 (Layout 구성)
```

## Technology Stack & Roadmap

- **Frontend**: React (Hooks, Context API, ForwardRef)
- **State Management**: 상황별 확률 전이 행렬 모델링
- **i18n**: 향후 표준 i18n 라이브러리를 통해 다국어 지원을 재구현할 예정입니다.

## Deployment

GitHub Actions를 통해 메인 브랜치 푸시 시 GitHub Pages로 자동 빌드 및 배포됩니다.

---
© 2024 Underland Lab. All rights reserved.