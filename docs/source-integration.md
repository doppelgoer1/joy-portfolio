# 소스 통합 — source → target 매핑

기준: [JOY-623](/JOY/issues/JOY-623) 최종 `a5f67f7dc63fbd06c356268602ec119bc132c484` = origin, clean 확인 후 작업. 소스: https://portfolio-joy.vercel.app/ (2026-10-28 실제 Chrome/Playwright 렌더). 현재 데이터: `src/data/portfolio.ts`. 정전: `/Users/joy/Documents/Obsidian Vault/01_아이디어/Joyslabs_프로젝트허브/포트폴리오_경력_정정사항.md`.

## 수집과 해석

- `source-snapshot/home.html`, `home.json`, `home-1440.png`: 초기 렌더 전체. 소스의 프로젝트는 별도 상세 경로가 아니라 같은 문서의 Projects 카드·Experience 행이다. Live Demo는 외부 서비스 링크이며 프로젝트 상세 근거로 새 외부 서비스 주장을 수집하지 않았다.
- `expanded.html`, `expanded.json`, `expanded-1440.png`: MYRO 아코디언을 펼친 전체 경력. 각 프로젝트의 기술 아이콘은 동일 카드의 제목·설명과 연결했다.
- `tooltips.json`: 이미지의 alt는 빈 문자열, title/aria-label은 없음. hover tooltip도 없음. 파일명만을 인접 다른 프로젝트로 확대 적용하지 않았다. `expanded.json.projects[].icons`에 해당 카드와 이미지 src를 함께 보존했다.
- `row-menus.json`: 경력 표의 ⋯ 메뉴를 클릭한 **렌더 텍스트**. 아이콘에 없는 기술 이름까지 확인했다. `Typescript`→`TypeScript`, `Javascript`→`JavaScript`, `JQuery`→`jQuery`, `Rtk Query`→`RTK Query`, `Vanilla Extract` 표기는 이름 정규화만 수행했다. 메뉴의 V/A/T/W는 아이콘 대체 글자이므로 기술로 세지 않았다.
- `contact-interaction.json`: EMAIL 버튼 클릭이 `clipboard.writeText("doppelgoer1@naver.com")`을 호출하고 복사 완료 토스트를 표시했다. OS 클립보드는 바꾸지 않고 브라우저 호출 인자로 확보했다. 주소는 추측하지 않았다.
- 정정 문서는 날짜·역할의 우선 출처지만 제공사 충돌은 이 작업에서 확정하지 않았다. 기존 값 유지와 새 확인은 구분한다.

## 메인·경력·교육·연락

| 소스 항목 | 현재 데이터 키/위치 | 처리 | 근거 |
|---|---|---|---|
| Hi, I'm JoY / 6년차 개발자 | JoyHero.tsx | 유지(미수입) | 원본 히어로 보존. 근속 연수는 시점 의존 표현이므로 새로 복사하지 않음 |
| 구 사이트 9개 대상 프로젝트의 기술 아이콘·경력 기술 메뉴 | technologyGroups[0..5] | 추가 | 프론트엔드 / 상태·데이터 관리 / 백엔드 / DB·ORM / 앱 / 인증·결제 6개 범주. 구 소스에 없는 AWS·Docker·CI/CD·Capacitor·MariaDB·Express는 이 **소스 요약**에 추가하지 않음. 기존 프로젝트 기술은 보존 |
| BFAI 원문 직무명·웹/앱/백엔드 참여 | career[1].title/description | 갱신 | 직무명은 “프론트엔드 개발자” 그대로, 설명은 React·Next.js, Flutter, ENG-SPARK Spring Boot 개발을 확인. 총괄·단독·숙련도 상승·지표 주장은 추가하지 않음 |
| BFAI 2024.09 ~ 현재 | career[1].period | 보류(구 라벨), 현재 값 유지 | 정전은 2024.09 ~ 2025.12. 충돌 절 참조 |
| MYRO 주니어 → 프론트엔드, jQuery 리팩토링 및 로그인/관리자 백엔드 | career[2].title/description | 갱신 | 직무명은 “주니어 개발자 → 프론트엔드 개발자” 그대로. 회사 소개 + 펼친 업무 표. 재직 2021.09 ~ 2024.02는 유지 |
| H-Solution | career[0] | 유지 | 구 사이트에 없음. 정전 2025.12 ~ 현재 및 현 담당 범위를 보존 |
| 베이징대학교 / 중어중문과 졸업 / 2013.09 ~ 2017.07 | education[0] | 추가 | Education 렌더 원문, 졸업 표현 보존 |
| 폴리텍대학 강서캠퍼스 / 스마트금융과 이수 / 2021.03 ~ 2021.09 | education[1] | 추가 | 졸업으로 확장하지 않고 이수 유지 |
| 중국 대련 제8고등학교 / 인문계열 이과 졸업 / 2010.09 ~ 2013.07 | education[2] | 추가 | 원문 그대로. 전공·학위 추정 없음 |
| EMAIL 복사 주소 | contactEmail / #contact mailto | 추가 | 실제 클릭 결과 doppelgoer1@naver.com. 구 연락처 안내 링크를 대체 |
| GITHUB / BLOG 버튼 | githubUrl / 기존 링크 | 유지·보류 | GITHUB 클릭 원문은 github.com/doppelgoer, 현재는 github.com/doppelgoer1로 충돌. Owner 지시에 따라 현재 GitHub 링크 유지·변경 보류. BLOG 클릭 원문은 doppelgoer.tistory.com이며 지정된 4개 연락 링크 범위 밖이어서 추가 보류 |
| 거대 함께할 일을 / 기다립니다. 표제 | #contact-title | 갱신 | Owner 명시: 연락. 안내는 채용·협업 이메일 문의 1문장 |

배치: T3 경력 표 위에 기존 `.section-heading` 3열과 `.detail-facts`를 재사용. 모바일 기존 단일 열 규칙을 따르며 새로운 CSS는 없다. 경력 3개 연감 스프레드와 아홉 프로젝트 무대는 동일하다. 교육은 기존 교육 영역 안에 기존 `.career-list`를 재사용했다. 근거: `after/career-1440.png`, `after/technology-1440.png`, `after/technology-390.png`, `after/career-full-390.png`.

## 프로젝트별 통합

| 대상 | 소스 항목 → 데이터 키 | 처리 | 근거/제한 |
|---|---|---|---|
| H-Works | projects[0].stack/role/contributions/caseStudy | 유지 | 구 사이트에 없음. 정전·기존 데이터의 검증된 전체 시스템/자동화/AWS 범위 유지. 소스 공백을 추정으로 채우지 않음 |
| FateSpoiler | projects[1].stack/role/contributions/caseStudy | 유지 | 구 사이트에 없음. 기능별 단독 수행·2026.08 앱 개발 및 등록 유지 |
| 모두ERP | projects[2].stack/role/contributions/caseStudy | 유지 | 구 사이트에 없음. 초기 프론트엔드와 이후 프론트·백엔드 유지보수 구분 유지 |
| ENG-SPARK | archive[0].stack | 추가 | 프로젝트 카드 + Experience 프론트/백엔드 메뉴: TypeScript, Next.js, React, Zustand, Tailwind CSS, Java. 기존 Azure OpenAI/Spring Boot/Firebase/Toss Payments 중복 추가 없음 |
| ENG-SPARK | archive[0].role/contributions/description | 유지 | 이미 담긴 프론트 개발, 친구 초대·이중 크레딧 백엔드 업무를 중복 증식하지 않음. 12가지 문제 유형 수치는 미수입 |
| WhaleAI | archive[1].stack | 추가 | TypeScript, React, Vite, Recoil, Vanilla Extract, Axios, Dart, WebView. Flutter/Firebase 유지 |
| WhaleAI | archive[1].role/contributions/description | 유지 | 웹 프론트 개발·배포 및 Flutter 웹뷰 앱 개발/각 기간 이미 반영. 서비스 기능을 담당 업무로 오인하지 않음 |
| MYRO + 마이로_Ads | archive[2].stack | 추가 | HTML, CSS, jQuery, RTK Query, Tailwind CSS, Material UI. 기존 JavaScript/TypeScript/React/Next.js/Node.js/MySQL 유지 |
| MYRO | archive[2].contributions | 갱신 | 기존 4항목을 소스 업무 표 근거의 5항목으로 정리. 로그인·댓글·블로그는 세부 작업을 합쳐 기록, 관리자 조회·에디터·이메일은 별도 항목. 리팩토링과 Ads 신규 구축 유지 |
| Bull-Finder | archive[3].stack | 추가 | TypeScript, React, Vite, TanStack Query, Zustand, Tailwind CSS. 기존 결제·Material Design 3 유지 |
| Bull-Finder | archive[3].role/contributions | 보류(빈 값 유지) | 개발 행 제목과 서비스 소개는 있으나 구체적 본인 담당 범위는 없음. 기술만으로 프론트 총괄/단독 개발을 추정하지 않음 |
| Guidy/Gaime | archive[4].stack/description | 추가·갱신 | TypeScript, Next.js, React, Zustand, Tailwind CSS. 카드에 있는 Markdown 렌더링·타이핑 애니메이션은 서비스 기능으로만 추가 |
| Guidy/Gaime | archive[4].role/contributions | 보류(빈 값 유지) | 서비스 설명 외 담당 범위 미확인. 제공사 충돌은 아래 별도 보류 |
| 온부스 | archive[5].stack | 추가 | 같은 온부스 카드의 아이콘: Next.js, Jotai, TypeScript, Tailwind CSS, NestJS, Prisma, PostgreSQL. 명함 카드 스택과 구분 |
| 온부스 | archive[5].role/company/period/contributions | 보류(빈 값 유지) | 구 사이트에 명시된 담당·소속·기간 없음. 신규 fullstack 역할 추정 금지 |

## 모든 프로젝트 카드의 아이콘 처리

| 소스 카드 | 아이콘 파일 이름 | 대상/처리 |
|---|---|---|
| WhaleAI | typescript, react, vite, recoil, firebase | archive[1].stack 추가·기존 유지 |
| Bull-Finder AI | typescript, react, vite, zustand, tailwind | archive[3].stack 추가·기존 유지 |
| ENG-SPARK AI | typescript, nextjs, react, zustand, tailwind, firebase | archive[0].stack 추가·기존 유지 |
| Guidy | typescript, nextjs, react, zustand, tailwind | archive[4].stack 추가·기존 유지 |
| 마이로 | nextjs, rtk_query, nodejs, mysql, typescript, html, javascript, tailwind, css | archive[2].stack 추가·기존 유지 |
| 마이로_Ads | nextjs, rtk_query, typescript, material_ui | archive[2].stack 추가·기존 유지 |
| 온부스 | nextjs, jotai, typescript, tailwind, nestjs, prisma, postgres | archive[5].stack 추가·기존 유지 |
| 온부스 명함 (joy) | svelte, tailwind | 보류: 현재 아홉 프로젝트 범위 밖. 신규 프로젝트/요약 기술로 확대하지 않음 |
| 포트폴리오 | nextjs, jotai, shadcn, typescript, tailwind | 보류: 현재 아홉 프로젝트 범위 밖. 신규 프로젝트/요약 기술로 확대하지 않음 |
| 카운트 게임 | react, css | 보류: 현재 아홉 프로젝트 범위 밖. 신규 프로젝트/요약 기술로 확대하지 않음 |
| 메모장 | react, css | 보류: 현재 아홉 프로젝트 범위 밖. 신규 프로젝트/요약 기술로 확대하지 않음 |

카드 설명의 처리: WhaleAI·Bull-Finder·ENG-SPARK·MYRO·마이로_Ads·온부스의 서비스 설명은 이미 반영된 부분 유지. Guidy의 Markdown·타이핑만 추가. 새 프로젝트(명함·포트폴리오 자체·카운트 게임·메모장)는 아홉 동등 구조 보존 때문에 보류. 명함의 접근 코드와 개인 명함 내용은 수입하지 않았다. 각 카드의 Live Demo는 기존 운영 링크 정책을 유지하며, 구 사이트 링크만으로 현재 운영을 새로 단정하지 않았다.

## 펼친 경력 표의 전 항목 처리

| 소스 업무 행 (기간) | 렌더 메뉴 기술 | 대상/처리 |
|---|---|---|
| WhaleAI 웹 서비스 개발 (2024.09 ~ 2024.11) | Typescript, React, Vite, Recoil, Vanilla Extract, Firebase, Axios | archive[1].role/contributions: 기존 유지; stack 추가 |
| WhaleAI 앱 개발 (2024.12 ~ 2025.01) | Flutter, Dart, WebView | archive[1].contributions: 기존 유지; stack Dart/WebView 추가 |
| Bull-Finder AI 개발 (2025.03 ~ 2024.05) | Typescript, React, Vite, TanStack Query, Zustand, Tailwind CSS | archive[3].stack: 추가; 역순 기간·역할 보류 |
| Gaime AI 챗봇 서비스 (2025.06 ~ 현재) | Typescript, Next.js, React, Zustand, Tailwind CSS | archive[4].stack: 추가; 현재 라벨·제공사 충돌 보류 |
| ENG-SPARK AI 영어 학습 플랫폼 프론트엔드 개발 (2025.08 ~ 현재) | Typescript, Next.js, React, Zustand, Tailwind CSS, Firebase, Spring Boot | archive[0].role/contributions: 유지; stack 추가 |
| ENG-SPARK AI 영어 학습 플랫폼 백엔드 개발 (2025.10 ~ 2025.11) | Java, Spring Boot, Firebase | archive[0].contributions: 유지; stack Java 추가 |
| 로그인 구축 (2021.09 ~ 2021.10) | HTML, Javascript, JQuery, MySQL, Node.js | archive[2].contributions/stack: 구체적 기능 통합, 기존 역할 유지 |
| 장소 댓글기능 (2021.10 ~ 2021.12) | HTML, JQuery, Javascript, Node.js, MySQL | archive[2].contributions/stack: 구체적 기능 통합, 기존 역할 유지 |
| 블로그 (2022.01 ~ 2022.02) | HTML, Javascript, JQuery | archive[2].contributions/stack: 구체적 기능 통합, 기존 역할 유지 |
| 소터블 리팩토링 (2022.02 ~ 2022.05) | HTML, Javascript, JQuery | archive[2].contributions/stack: 구체적 기능 통합, 기존 역할 유지 |
| 관리자 페이지 (2022.05 ~ 2022.08) | Typescript, React, Node.js, MySQL | archive[2].contributions/stack: 구체적 기능 통합, 기존 역할 유지 |
| 마이로 리팩토링 (2022.09 ~ 2023.11) | Typescript, Next.js, Rtk Query, Tailwind CSS | archive[2].contributions/stack: 구체적 기능 통합, 기존 역할 유지 |
| 마이로 biz (2023.11 ~ 2024.02) | Typescript, Next.js, Rtk Query, Material UI | archive[2].contributions/stack: 구체적 기능 통합, 기존 역할 유지 |

MYRO 개별 행의 월별 기간은 위 근거 표에 보존하되 화면에서는 기존 회사/프로젝트 기간 2021.09 ~ 2024.02를 유지했다. 세부 작업을 모두 별도 챕터로 늘리지 않았다. 회사 단위의 '7개 프로젝트', '초기 로딩 속도 개선', 'Lighthouse', '기업 고객 유치 채널 확보', '프론트엔드 총괄'은 개별 프로젝트 귀속/측정 근거 미확인으로 보류했다. Flutter·Spring Boot의 원문 '(초급)'은 과거 자기평가이며 숙련 등급을 새로 주장하지 않고 사용 기술로만 표시한다.

## 충돌 — 양쪽 원문과 위치

| 항목 | 구 사이트 원문·위치 | 현재 데이터 / 정정본 원문·위치 | 처리 |
|---|---|---|---|
| ENG-SPARK 제공사 | Projects ENG-SPARK 카드: “Anthropic Claude API 기반”; Experience ENG-SPARK 프론트 행: “Azure Open AI API 기반” (`expanded.json`) | archive[0].detail/description/stack: “Azure OpenAI”; 정정본 확정 정정: “ENG-SPARK AI: Azure OpenAI 사용.” | **보류**. 소스 내부도 충돌. 현재 Azure 값 유지, 새 검증 완료로 주장하지 않음. main 요약에 제공사 추가 안 함 |
| Guidy/Gaime 제공사·변경 이력 | Projects Guidy: “Google Gemini API 기반”; Experience Gaime: “Azure Open AI API 기반” | archive[4].description/stack: “Azure OpenAI”; 정정본: “같은 서비스의 이름 변경. 최종 표기명과 제공사 변경 이력은 별도 확인.” | **보류**. 현 데이터 유지. Claude/Gemini/Azure 어느 쪽으로도 변경하거나 시기 추정 안 함 |
| BFAI current 라벨 | Experience 비에프에이아이: “2024.09 ~ 현재” | career[1].period “2024.09 ~ 2025.12”; 정정본 “종료 2025.12” | 구 current **보류/미수입**. 정전 종료 유지 |
| ENG-SPARK·Gaime current 라벨 | Experience: “2025.08 ~ 현재”, “2025.06 ~ 현재” | archive[0].period “2025.08부터”, archive[4].period “2025.06부터” | 구 current **보류/미수입**. BFAI 퇴사 이후 참여로 연장하지 않음 |
| Bull-Finder 역순 기간 | Experience: “2025.03 ~ 2024.05” | archive[3].period “2025.03 ~ 2025.05”; 정정본 확정 정정 동일 | 원문은 **무효·보류**. 정정본과 일치하는 현 기간 유지, 임의 교정 수입 아님 |
| H-Solution 현 재직 | 구 사이트에 없음 | career[0].period 및 정정본 “2025.12 ~ 현재” | 사용자 정정 유지. BFAI의 구 current 라벨로 덮지 않음 |
| GitHub 계정 링크 | Contact GITHUB 클릭: “https://github.com/doppelgoer” (`link-interactions.json`) | githubUrl: “https://github.com/doppelgoer1” | **보류**. 연락의 기존 GitHub 유지 지시를 따름. 두 계정의 소유 관계 추정 안 함 |

## 보류 목록

1. 제공사 2건(ENG-SPARK, Guidy/Gaime), 최종 명칭/제공사 변경 이력. 현재 데이터 유지.
2. BFAI·ENG-SPARK·Gaime 구 current 라벨 및 Bull-Finder 역순 기간. 정전 유지.
3. Bull-Finder·Guidy/Gaime·온부스의 구체적 담당 업무, 온부스 회사·기간. 빈 필드 유지.
4. 출처의 과장/성과 문구·수치(6년차, 300개 이상, 12가지 유형, 7개 프로젝트, Lighthouse 속도/고객 유치 성과, 총괄)와 MYRO 세부 일정의 화면 확대.
5. 구/현 GitHub 계정 링크 충돌(현재 유지), 현재 9건 범위 밖 프로젝트 4개(온부스 명함, 포트폴리오, 카운트 게임, 메모장), BLOG 링크. 해당 독립 기술 Svelte·shadcn도 메인으로 승격하지 않음.
6. 소스에 없는 인프라/배포·AI 제공사 카테고리. 기존 H-Solution 상세의 검증된 기술은 유지.

이 보류는 이슈가 지정한 처리 방식이다. 이메일·소스 접근은 확보되어 구현 블로커가 아니다. 새로운 역할/성과를 채우지 않는 것은 누락 완료 주장과 다르며 독립 검수 대상이다.

## 연락 축소와 보존

- h2: 기존 120px(1440)/52px(390), 2행·레드 span → 64px/42px의 “연락”, ink 색. 기존 경력 h2 크기 체계 사용.
- 섹션 min-height: 160dvh/130dvh → 85dvh. 데스크톱 링크 행 112px → 80px; 모바일 72px 유지. 이메일은 확인된 mailto 링크, 기존 GitHub·이전 포트폴리오·처음으로 유지.
- sticky 표제와 행 도킹 유지: 기존 스크롤 연속성을 보존하며 거대 활자와 불필요한 체류 길이만 줄였다. reduced-motion의 static 표제 유지.
- CSS 수정 파일은 `src/app/full-motion.css`의 `.contact-*` 선택자뿐. `contact-css.diff`에 전체 diff. 다른 CSS·JoyHero.tsx·WorkTransition.tsx diff 0.
- 스크린샷: `before/contact-{1440,390}.png`와 `after/contact-{1440,390}.png`. 상세 9개×2너비는 `after/detail-*.png`. 기술/업무 개수는 `project-counts.json`; 개수가 다른 것은 원문 정보량 차이이며 같은 무대·같은 상세 구조·나머지 여덟 링크를 유지.

## 독립 검수 반영 — [JOY-625](/JOY/issues/JOY-625)

필수 7항목 GO-WITH-NOTES. 권장 A·B는 BFAI/MYRO 부제를 원문 역할명으로 변경해 동일 위치에 역할 정보를 표시했다. C는 기술 요약 주석에 카드 본문을 추가해 Toss Payments 출처를 정확하게 반영했다. 기술 요약은 대표 기술을 범주별로 요약한 것으로, 상세의 모든 항목을 반복하지 않으며 Material Design 3는 Bull-Finder 상세에 유지한다.

선택 D는 원문 소터블 업무를 구체화한 현 문구를 유지했다. 회사 단위 성능 이슈 표현을 다시 합치지 않았다. 선택 E는 승인 범위 내 선택인 sticky/행 도킹과 85dvh를 유지한다. 선택 F의 div 라벨/메일 아이콘은 이번 사실·카피 교정 범위를 추가로 넓히지 않았다. 모두 검수자가 비차단으로 판정한 선택 사항이다.
