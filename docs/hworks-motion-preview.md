# H-Works 스크롤 연출 비교안

## 범위

사용자 시각 승인용으로 **H-Works 한 구간만** 다단계 스크롤 장면으로 교체한다. FateSpoiler/모두ERP는 아직 같은 강도의 연출로 확장하지 않았다. `preview/glass-nav` 전용이며 운영 `prod`에 병합하지 않는다.

기존 JoyHero, globals.css, GlassNav, 프로젝트 사실 데이터, 상세 페이지는 SHA-256 보존 테스트 대상으로 변경하지 않았다.

## 장면

- 거대 제목 성장 → 좌우 분리 → 붉은 면 확장.
- Architecture / Automation / Operations 타이포그래피 순차 진입 → 축소·좌측 배치.
- 실제 기여 내용·상세/서비스 링크가 읽기 구간에서 표시.
- 커튼과 다음 프로젝트 색·제목으로 이어짐.
- 네이티브 스크롤 진행값의 순수 함수로 계산하므로 역방향도 같은 구성으로 복귀.
- 가짜 서비스 화면은 사용하지 않으며 타이포그래피임을 표시.

데스크톱 이동 거리 290svh, 모바일은 160svh의 별도 연출 뒤 일반 흐름 본문. 모바일 진행 거리는 CSS의 실제 margin-top 값을 측정해 주소창 변화 때 svh/innerHeight 오차를 피한다. reduced-motion/no-JS/짧거나 내용이 넘치는 화면에서는 정적 본문으로 전환한다.

## 접근성·검토 반영

- 숨겨진 링크는 inert, 보이는 ‘기여와 링크 보기’로 읽기 장면에 진입.
- 역방향 키보드 진입은 마지막 링크로 이동.
- 버튼 내부 화살표 클릭도 처리.
- 기존 focus-within z-index 승격/blur 우회 제거: 실제 포커스가 가려진 경우에만 위치 보정.
- 정적/연출 상태의 본문 측정 폭을 동일하게 유지하여 ResizeObserver 진동 방지.
- 중첩 RAF 취소, 이벤트/observer 정리 및 아이들 RAF 종료 검증.

구현: Codex CLI `gpt-6-astra`, 부모 GPT 검증/수정. 독립 코드·아트디렉션 검토: Claude Code `claude-fable-5-1` (실행 결과 모델 ID 확인). Fable 검토는 정적 리뷰이며 브라우저 QA는 부모가 별도 실행했다.

## 확인

- `pnpm build`, `pnpm typecheck`, `pnpm test`: 통과, 단위/계약 테스트 54개.
- Chrome 실제 PC·노트북·1024px 화면, 390/320 모바일, reduced-motion/no-JS 확인.
- 정·역방향 구성, 링크 도달/상세 이동, 키보드/수동 스크롤 가림, 버튼 화살표 회귀 테스트.
- `pnpm lint`: 변경하지 않은 JoyHero의 기존 미사용 `STACKS` TS6133은 남아 있다.

브라우저 전체 검증은 오래 걸리므로 뷰포트별 분할 실행 가능:

```sh
PORTFOLIO_URL=http://127.0.0.1:3187 \
PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
PORTFOLIO_VIEWPORTS=desktop,laptop,desktop-1024 \
pnpm test:browser

# 별도 배치: mobile,small-mobile,reduced-motion
# 기본값은 전체 뷰포트. 정적 export 서버는 확장자 없는 상세 경로를 .html로 제공해야 함.
```

시각적 강도가 사용자 기대에 맞는지는 비교안 승인 후 결정한다. 테스트 통과를 디자인 승인으로 간주하지 않는다.
