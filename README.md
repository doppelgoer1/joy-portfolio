# Joy · 장준영 포트폴리오

Next.js App Router / React / TypeScript 기반 정적 포트폴리오입니다. 흑백·레드 풀스크린 타이포그래피와 네이티브 스크롤을 유지하며 프로젝트, 담당 범위, 기술, 경력과 아카이브를 제공합니다.

## 실행

Node.js 24 기준:

```bash
npm ci
npm run dev
```

기본 주소는 `http://127.0.0.1:3000`입니다. 루트 프로토타입 `index.html`은 최신 prod(`9a4ec88`)에서 삭제되어 그대로 제거했습니다. 실제 진입점은 `src/app/page.tsx`입니다.

## 검증

```bash
npm run build
npm run lint
npm run typecheck
npm test
```

`lint`는 TypeScript의 미사용 지역 변수·매개변수 검사입니다. 기존 `next lint`는 Next.js 16에서 사용할 수 없어 교체했습니다. ESLint 설치는 포함하지 않습니다. `test`는 `9a4ec88`과 히어로 전체(풀스택 사실 문구 두 곳 제외)·모션 코드·CSS 원문 접두부를 비교하고 프로토타입 삭제 여부, CSS1 문 열림·텍스트 분할·기존 스택 퇴장 및 생성된 홈·프로젝트 상세 HTML과 경력 데이터를 함께 검사하므로 먼저 빌드해야 합니다. 복원된 히어로 전체의 SHA-256, 신규 CSS의 범위, 내부 경로·앵커·복귀 링크도 검사합니다.

브라우저 검증은 설치된 Playwright와 Chrome을 사용합니다. 로컬 서버를 실행한 뒤:

```bash
PLAYWRIGHT_MODULE=/absolute/path/to/playwright npm run test:browser
```

프로젝트에서 `playwright`를 해석할 수 있으면 환경변수를 생략할 수 있습니다. `PORTFOLIO_URL`로 검증할 로컬 주소를 지정할 수 있습니다. 데스크톱, 짧은 노트북, 태블릿, 모바일, 작은 모바일에서 원본 모션과 CSS를 비교하고 모션 감소, JS 비활성화, 키보드 포커스와 본문을 검사하여 `artifacts/motion-restoration/browser/`에 PNG와 JSON을 저장합니다. 브라우저가 실행되지 않으면 실패로 기록합니다.

## 주요 파일

- `src/data/portfolio.ts`: 확인된 기여·기술·기간과 출처 링크
- `src/components/JoyHero.tsx`: 최신 prod의 7개 카드 확장·커튼·CSS1 문과 텍스트 분할·스택 도킹 및 퇴장·0.12 스크롤 보간·`?p=0.34` 디버그 모션
- `src/components/ProjectCase.tsx`, `src/components/ProjectPlate.tsx`: 홈 프로젝트 요약과 담당 범위 타이포그래피
- `src/app/projects/[slug]/page.tsx`: H-Works·FateSpoiler·모두ERP 정적 상세 페이지, 목차·담당 범위·참여 흐름·다음 프로젝트
- `src/app/portfolio-editorial.css`: `.portfolio-content`에 한정한 추가 디자인과 상세 페이지 스타일
- `src/app/page.tsx`, `src/app/globals.css`: 페이지 구조와 반응형 스타일
- `docs/content-sources.md`: 사실 출처와 원본 수집 제한
- `PRODUCT.md`, `DESIGN.md`: 제품·디자인 기준
- `artifacts/motion-restoration/REPORT.md`: 원본 모션 복원 내역과 실제 검증 결과

## 정적 산출물

`next.config.ts`의 기존 `output: "export"` 설정을 유지합니다. `npm run build`는 `out/`에 HTML/CSS/JS를 생성하며 서버 런타임은 필요하지 않습니다.

상세 경로는 `/projects/h-works`, `/projects/fatespoiler`, `/projects/moduerp`입니다. 홈 요약에서 상세로 진입하고 `/#프로젝트ID`로 해당 위치에 복귀합니다. 기존 `trailingSlash: false` 설정에 따라 산출물은 `out/projects/슬러그.html`이며, 정적 서버에서는 확장자 없는 경로를 해당 HTML에 연결해야 합니다. `next dev`에서도 동일한 경로로 검토할 수 있습니다.

```bash
node scripts/package-preview.mjs
```

이 명령은 자체 포함 정적 미리보기와 export SHA-256 목록을 만듭니다. `preview.html`은 JS를 제외한 정적 참고 파일이며 원본 스크롤 모션 검증용으로 사용하지 않습니다. 기존 `artifacts/portfolio-upgrade/`의 미리보기는 복원 전 기록입니다. 실제 앱 모션은 `out/`을 HTTP로 제공할 때 검증합니다.
