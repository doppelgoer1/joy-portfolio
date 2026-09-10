# 콘텐츠 출처와 확인 범위

2026-09-07, `feat/portfolio-career-motion-refresh` 구현 기준.

## 우선 출처
- 사용자 구현 브리프: `/tmp/joy-portfolio-implementation-brief.md`
- 사용자 확인 정정사항: `/Users/joy/Documents/Obsidian Vault/01_아이디어/Joyslabs_프로젝트허브/포트폴리오_경력_정정사항.md` 전체 확인.
- 개발 인덱스와 프로젝트 허브 인덱스 확인. 이 포트폴리오는 별도 기존 프로젝트이므로 허브의 새 모노레포 구조를 도입하지 않음.

## 반영한 확인 사실
- 풀스택 개발자 장준영. H-Solution 2025.12 ~ 현재, BFAI 2024.09 ~ 2025.12, MYRO 2021.09 ~ 2024.02.
- H-Works: 전체 시스템/프론트/백엔드/DB 설계·개발, 네이버 블로그·당근 비즈니스·카페 댓글 관련 자동화, 이미지 크롤링/정보 등록, 사용자 명시 AWS 구성요소와 Docker/GitHub Actions CI/CD. 초기 개발 2025.12 ~ 2026.02, 이후 유지보수/신기능.
- 모두ERP: 2026.02 ~ 현재, 초기 프론트 개발 및 기본 기능 개발 이후 프론트/백엔드 유지보수. Spring Boot, Next.js, PostgreSQL.
- FateSpoiler: 2026.06 ~ 현재. 이메일 자동화, Apple 로그인, 앱 개발/등록 각각 단독 담당. WebView/Capacitor 앱 개발은 2026.08부터. Node.js, Express, Next.js, MariaDB.
- Bull-Finder: 2025.03 ~ 2025.05. ENG-SPARK: Azure OpenAI. Guidy/Gaime은 이름이 바뀐 하나의 서비스로 한 행에 표기.

## 공개 링크
- [H-Works](https://h-works.cloud)
- [FateSpoiler](https://www.fatespoiler.com/home)
- [모두ERP](https://mdm.club)
- [기존 포트폴리오](https://portfolio-joy.vercel.app): 브리프의 원본 URL. 2026-09-07 시점에는 원문 HTML 수집에 실패했으나, 2026-09-10에 원문 텍스트 추출본(`/tmp/old-joy-portfolio-text.txt`)과 스크린샷을 확보했다. 아래 "이전 프로젝트 상세 페이지" 절 참고.
- [GitHub](https://github.com/doppelgoer1): 브리프에 명시한 저장소 소유자. 기존 사이트에서 추출한 연락처로 주장하지 않음.
- [모션 참고 글](https://brunch.co.kr/@0f2edcfe3d1d4c6/49): 시네마틱 프로젝트 장면과 스크롤에 연결된 전환만 선택 적용.

## 수집 제한과 남은 콘텐츠 (2026-09-07 기준, 이후 일부 해소)
아래는 2026-09-07 구현 시점의 기록이다. 기존 포트폴리오 원문과 이전 프로젝트 화면은 2026-09-10에 확보했으므로 "미확보" 서술은 그 시점에만 해당한다. 학력·교육과 연락처는 여전히 사이트에 옮기지 않았다.

외부 DNS 조회가 제한되어 curl이 `Could not resolve host`로 실패했다. 웹 도구에서도 기존 포트폴리오, H-Works와 FateSpoiler `/home` 원문을 확보하지 못했다. 모두ERP는 공개 응답에 본문 텍스트가 없었고 FateSpoiler 루트는 일부 공개 텍스트만 반환했다. 로그인이나 사내 비공개 화면 접근을 시도하지 않았다.

따라서 프로젝트 비주얼은 서비스 화면이 아니라고 표시한 CSS 타이포그래피다. 생성형 이미지나 가짜 대시보드를 사용하지 않았다. 공개 서비스 스크린샷은 아직 확보하지 못했다.

이전 프로젝트의 세부 기여·기술·설명, 전체 아카이브 목록, 학교·교육 과정과 실제 연락처는 원문을 확인하지 못했다. 확인된 프로젝트 이름·정정 사실만 옮기고 기존 사이트로 연결했다. 이것은 원문 콘텐츠 이전을 완료한 상태가 아니다. 원본 수집이 가능해지면 기존 URL과 실제 이력으로 교체해야 한다.

인프라 연결 구조, RDS 여부, 무중단·롤백·운영 지표, 플랫폼 공식 API·정책 준수, 전체 FateSpoiler 단독 개발, 스토어 승인·출시는 주장하지 않는다.

## 상세 페이지 추가 확인

이번 추가 구현은 `src/data/portfolio.ts`에 확인된 사실을 담당 범위·참여 흐름으로 정리하고 `/projects/h-works`, `/projects/fatespoiler`, `/projects/moduerp`에 정적으로 제공합니다. H-Works의 AWS 항목은 사용 구성요소 목록이며 네트워크 구성도나 서비스 간 연결을 의미하지 않습니다. FateSpoiler의 단독 수행은 명시한 기능과 앱 개발·등록으로 한정하고, 모두ERP의 초기 개발 범위는 프론트엔드로 구분했습니다.

이전 포트폴리오 재확인 결과: 웹 도구는 `URL https://portfolio-joy.vercel.app/ is not safe to open (non-retryable error)`, curl은 `curl: (6) Could not resolve host: portfolio-joy.vercel.app`를 반환했습니다. 추가 재시도 없이 기존 확인 사실과 원본 링크를 유지했습니다. 이전 프로젝트의 상세 기여·교육·연락처 및 실제 화면 이미지는 여전히 미확보입니다.

[브런치 참고 글](https://brunch.co.kr/@0f2edcfe3d1d4c6/49)은 본문 수집에 성공했습니다. 카드의 스크롤 반응에서 착안한 약한 원근 진입만 신규 프로젝트 타이포그래피에 적용합니다. 기존 `JoyHero.tsx`, `globals.css` 전체, 원래 모션 테스트는 추가 구현 시작 시점과 바이트 단위로 동일합니다.

## 아카이브 스크린샷 반영 (2026-09-10, `feat/archive-project-images`)

변경 범위는 아카이브 영역(`src/data/portfolio.ts`의 `archive`, `page.tsx`의 archive 섹션, `portfolio-editorial.css`의 archive 규칙)으로 한정했고, `JoyHero.tsx`, `globals.css`, `WorkStage.tsx`와 주요 프로젝트 3건은 수정하지 않았습니다.

- 사용자 확인 사항: 운영 중인 서비스 URL은 [WhaleAI](https://whaleai.ai), [ENG-SPARK](https://eng-spark.com) 두 건. Bull-Finder, Gaime(구 Guidy), MYRO는 현재 사이트 접속 불가. 이 두 건에만 외부 링크를 둡니다.
- 온부스를 아카이브 항목으로 추가했습니다. 설명 "기업에 다양한 워크샵 프로그램을 제공하는 서비스"는 기존 포트폴리오 원문에 근거하며, 역할·기간·소속 회사는 확인되지 않아 적지 않았습니다. 명함·연락처 등 개인 정보는 옮기지 않았습니다.
- 서비스 한 줄 설명(WhaleAI B2B 프로젝트 매칭, Bull-Finder B2B 영업 리드 발굴, Gaime 게임 가이드 AI 챗봇, MYRO 여행 일정 플래너, 온부스 워크샵 프로그램)은 기존 포트폴리오 원문에서 짧게 옮긴 것입니다. 사용자 확인 사항은 ENG-SPARK·Gaime의 Azure OpenAI, Bull-Finder 기간, Guidy=Gaime 동일 서비스, 접속 불가 여부입니다. (이전 판의 "모두 사용자 확인 사항" 서술을 정정)
- 이미지 6장은 `public/images/projects/{whaleai,engspark,bullfinder,guidy,myro,onbooth}.png`에 두었고 기존 포트폴리오에서 내려받은 실제 화면입니다. 생성형 이미지나 가공한 화면은 없습니다. 온부스 화면에는 원본 포트폴리오에 있던 설명 주석이 그대로 포함되어 있습니다.
- 기존 확인 사실(Bull-Finder 2025.03 ~ 2025.05, ENG-SPARK Azure OpenAI, Guidy/Gaime 동일 서비스 단일 행)은 유지했습니다. 학력·교육과 연락처는 계속 기존 포트폴리오 링크로 연결합니다.

## 이전 프로젝트 상세 페이지 (2026-09-10, 같은 브랜치)

사용자 승인에 따라 이전 프로젝트 6건도 `/projects/{id}` 상세 페이지를 갖습니다. 홈의 카드는 외부 URL이나 이미지 대신 내부 상세 페이지로 연결하고, 하단 섹션 제목은 "이전 프로젝트"입니다. 주요 프로젝트 3건의 상단 무대와 본문·데이터는 그대로이며, 다음 프로젝트 이동은 아홉 건을 순환합니다.

출처 우선순위: 사용자 정정 문서(`포트폴리오_경력_정정사항.md`) > 기존 포트폴리오 원문 추출본(`/tmp/old-joy-portfolio-text.txt`). 원문 표현은 짧은 한국어로 옮기되 수치·성과·기간을 새로 만들지 않았습니다.

- ENG-SPARK: 서비스 설명, 프론트엔드 개발 시작 2025.08, Spring Boot 백엔드 프로모션 시스템(친구 초대·이중 크레딧) 2025.10 ~ 2025.11은 원문. 원문의 "Anthropic Claude API"는 사용자 정정에 따라 Azure OpenAI로 표기. 원문의 "12가지 유형"은 옮기지 않음.
- WhaleAI: 서비스 설명, 웹 프론트엔드 개발·배포 2024.09 ~ 2024.11, Flutter 웹뷰 하이브리드 앱 2024.12 ~ 2025.01은 원문. 원문의 "실시간"은 옮기지 않음.
- MYRO: 서비스 설명과 마이로_Ads, 2021.09 ~ 2024.02, 주니어 개발자 → 프론트엔드 개발자, jQuery → Next.js 리팩토링, 드래그 앤 드롭 정렬, 로그인·댓글·블로그·관리자 페이지 풀스택 개발, 회사 기술 목록은 원문. "7개 프로젝트", "로딩 속도 개선", "기업 고객 유치 채널 확보"는 옮기지 않음.
- Bull-Finder: 서비스 설명은 원문("300개 이상"은 제외), 기간 2025.03 ~ 2025.05는 사용자 정정. 프로젝트별 담당 범위는 원문에 없어 비움.
- Gaime(구 Guidy): 서비스 설명은 원문. 원문의 "Google Gemini API"(Guidy)와 "Azure Open AI API"(Gaime)는 사용자 정정에 따라 Azure OpenAI 하나로 표기. 참여 시작 2025.06은 원문. 담당 범위는 비움.
- 온부스: 서비스 설명만 원문에서 옮김. 소속·기간·역할·운영 상태는 미확인이라 아무것도 표시하지 않음. 원문의 "온부스 명함" 항목과 그 안의 코드(네 자리 숫자)는 별개 항목이며 옮기지 않음.
- BFAI 재직은 2025.12 종료(사용자 정정)이므로 원문의 "~ 현재"(Gaime, ENG-SPARK, BFAI 재직)는 옮기지 않고 시작 시점만 적음. 원문의 회사 단위 서술("프론트엔드 총괄", "7개 프로젝트", "Lighthouse 최적화")은 프로젝트별로 귀속할 수 없어 사용하지 않음.
- 접속 불가 3건은 "현재 사이트 접속 불가"로만 표기하고 영구 종료로 단정하지 않음.
- 학력(베이징대학교 등)과 연락처는 원문에 있으나 이번 범위가 아니므로 옮기지 않음.
