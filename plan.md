# Ramic Studio 기능·디자인 구현 계획

## 범위
- FAQ 공개 페이지(`/faq`)를 추가한다.
- 관리자 콘솔에 FAQ 관리 탭을 추가한다. 질문/답변/분류/순서/공개 여부를 생성·수정·삭제할 수 있어야 한다.
- 공개 FAQ 상단에 “더 궁금하신 사항이 있으시나요?”와 카카오톡 문의 CTA를 제공한다.
- 홈의 첫 화면은 라믹 스튜디오의 브랜드 선언을 유지하고, 스크롤 이후 게임 콘텐츠가 카드/선택형 탐색 UI로 이어지도록 FAQ 진입점을 추가한다.

## 기존 작업 분류
- Mode: Redesign · Preserve + bounded extension
- Preserve: 기존 라우트, 관리자 인증, 게임/공지/팀 CMS, 로고와 어두운 스튜디오 톤
- Improve: 홈의 콘텐츠 탐색 동선, FAQ 발견성, 관리자 콘텐츠 운영성
- Remove: 없음
- Protected contracts: `/`, `/news`, `/admin`, `/admin/login`, 기존 API 입력과 관리자 인증
- Rollback: 기능별 독립 커밋으로 되돌릴 수 있도록 단계별 커밋

## Design Read
- artifact: 게임 스튜디오 랜딩 + CMS 콘텐츠 페이지
- audience: 라믹 스튜디오 게임에 관심 있는 방문자와 운영 관리자
- visual-language: editorial game-studio / dark signal interface
- mode: preserve with extension
- visual-variance: 7/10
- motion-intensity: 5/10
- information-density: 6/10
- asset-dependence: 5/10
- brand-fidelity: 9/10

## Design Decisions
- Palette: ink `#08090d`, paper `#e9e7df`, lime `#cbff4d`, coral `#ff694d`, violet은 기존 보조 효과로만 유지
- Typography: 기존 Unbounded display + Space Grotesk body + DM Mono metadata 유지
- Spacing: 기존 clamp 기반 섹션 패딩과 8px 단위 컨트롤 리듬 유지
- Radius: CTA는 pill, 콘텐츠 패널은 거의 sharp한 editorial edge 유지
- Motion: reveal/hover/ambient orbit를 유지하되 FAQ는 accordion height보다 읽기와 focus 상태를 우선
- Signature: lime signal line, mono metadata, oversized display headline
- Voice: 짧고 호기심을 자극하는 한국어 문장. CTA 예: “질문을 남겨주세요”, “카카오톡으로 문의하기”

## Project structure
- `client/src/pages/Home.tsx`: 브랜드 랜딩과 게임 탐색
- `client/src/pages/Faq.tsx`: 공개 FAQ 목록과 카카오 문의 CTA
- `client/src/pages/Admin.tsx`: 관리자 콘텐츠 탭 및 FAQ CRUD
- `server/db.ts`: MongoDB FAQ 문서 정규화/CRUD
- `server/routers.ts`: public/admin FAQ tRPC 계약
- `shared/types.ts`: FAQ 공용 타입
- `client/public/manus-routes.json`: 공개 라우트 선언
