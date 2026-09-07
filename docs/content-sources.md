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
- [기존 포트폴리오](https://portfolio-joy.vercel.app): 브리프의 원본 URL. 이번 환경에서 원문 HTML 수집 실패.
- [GitHub](https://github.com/doppelgoer1): 브리프에 명시한 저장소 소유자. 기존 사이트에서 추출한 연락처로 주장하지 않음.
- [모션 참고 글](https://brunch.co.kr/@0f2edcfe3d1d4c6/49): 시네마틱 프로젝트 장면과 스크롤에 연결된 전환만 선택 적용.

## 수집 제한과 남은 콘텐츠
외부 DNS 조회가 제한되어 curl이 `Could not resolve host`로 실패했다. 웹 도구에서도 기존 포트폴리오, H-Works와 FateSpoiler `/home` 원문을 확보하지 못했다. 모두ERP는 공개 응답에 본문 텍스트가 없었고 FateSpoiler 루트는 일부 공개 텍스트만 반환했다. 로그인이나 사내 비공개 화면 접근을 시도하지 않았다.

따라서 프로젝트 비주얼은 서비스 화면이 아니라고 표시한 CSS 타이포그래피다. 생성형 이미지나 가짜 대시보드를 사용하지 않았다. 공개 서비스 스크린샷은 아직 확보하지 못했다.

이전 프로젝트의 세부 기여·기술·설명, 전체 아카이브 목록, 학교·교육 과정과 실제 연락처는 원문을 확인하지 못했다. 확인된 프로젝트 이름·정정 사실만 옮기고 기존 사이트로 연결했다. 이것은 원문 콘텐츠 이전을 완료한 상태가 아니다. 원본 수집이 가능해지면 기존 URL과 실제 이력으로 교체해야 한다.

인프라 연결 구조, RDS 여부, 무중단·롤백·운영 지표, 플랫폼 공식 API·정책 준수, 전체 FateSpoiler 단독 개발, 스토어 승인·출시는 주장하지 않는다.

## 상세 페이지 추가 확인

이번 추가 구현은 `src/data/portfolio.ts`에 확인된 사실을 담당 범위·참여 흐름으로 정리하고 `/projects/h-works`, `/projects/fatespoiler`, `/projects/moduerp`에 정적으로 제공합니다. H-Works의 AWS 항목은 사용 구성요소 목록이며 네트워크 구성도나 서비스 간 연결을 의미하지 않습니다. FateSpoiler의 단독 수행은 명시한 기능과 앱 개발·등록으로 한정하고, 모두ERP의 초기 개발 범위는 프론트엔드로 구분했습니다.

이전 포트폴리오 재확인 결과: 웹 도구는 `URL https://portfolio-joy.vercel.app/ is not safe to open (non-retryable error)`, curl은 `curl: (6) Could not resolve host: portfolio-joy.vercel.app`를 반환했습니다. 추가 재시도 없이 기존 확인 사실과 원본 링크를 유지했습니다. 이전 프로젝트의 상세 기여·교육·연락처 및 실제 화면 이미지는 여전히 미확보입니다.

[브런치 참고 글](https://brunch.co.kr/@0f2edcfe3d1d4c6/49)은 본문 수집에 성공했습니다. 카드의 스크롤 반응에서 착안한 약한 원근 진입만 신규 프로젝트 타이포그래피에 적용합니다. 기존 `JoyHero.tsx`, `globals.css` 전체, 원래 모션 테스트는 추가 구현 시작 시점과 바이트 단위로 동일합니다.
