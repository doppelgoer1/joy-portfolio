export type CaseChapter = {
  id: string;
  label: string;
  title: string;
  description: string;
  items: { title: string; description: string }[];
};

export type Project = {
  id: string;
  name: string;
  category: string;
  company: string;
  period: string;
  url: string;
  headline: string;
  summary: string;
  role: string;
  contributions: string[];
  stack: string[];
  note: string;
  focus: { label: string; value: string }[];
  caseStudy: {
    introduction: string;
    chapters: CaseChapter[];
    phases: { period: string; title: string; description: string }[];
  };
};

// 사용자 확인 경력 정정사항을 우선한다. 출처와 미확인 항목은 docs/content-sources.md 참고.
export const projects: Project[] = [
  {
    id: "h-works",
    name: "H-Works",
    category: "시스템 설계 · 업무 자동화 · 인프라",
    company: "H-Solution",
    period: "2025.12 ~ 현재",
    url: "https://h-works.cloud",
    headline: "서비스 설계·개발",
    summary: "프론트엔드·백엔드·DB를 설계하고 개발했습니다. 업무 자동화와 AWS 배포, CI/CD도 구축했습니다.",
    role: "전체 시스템 설계 및 프론트엔드·백엔드·DB 개발",
    contributions: [
      "네이버 블로그 자동화, 당근 비즈니스 자동화, 카페 댓글 관련 자동화 개발",
      "이미지 크롤링 및 정보 등록 기능 개발",
      "AWS EC2, Amplify, DB, S3, Systems Manager를 활용한 배포·운영 환경 구축",
      "Docker와 GitHub Actions를 활용한 CI/CD 배포 자동화 구축",
    ],
    stack: ["Next.js", "NestJS", "MariaDB", "AWS", "Docker", "GitHub Actions"],
    note: "초기 개발 2025.12 ~ 2026.02 · 이후 유지보수 및 신기능 추가",
    focus: [
      { label: "Architecture", value: "프론트엔드 · 백엔드 · DB" },
      { label: "Automation", value: "업무 자동화 · 정보 등록" },
      { label: "Operations", value: "AWS · Docker · CI/CD" },
    ],
    caseStudy: {
      introduction: "H-Works의 프론트엔드·백엔드·DB를 설계하고 개발했습니다. 업무 자동화 기능과 AWS 배포 환경, Docker·GitHub Actions CI/CD를 구축했습니다. 초기 개발 이후에는 유지보수와 신기능 개발을 맡고 있습니다.",
      chapters: [
        {
          id: "architecture", label: "Architecture & development", title: "프론트엔드·백엔드·DB 설계와 개발.",
          description: "Next.js, NestJS, MariaDB로 세 영역을 설계하고 개발했습니다.",
          items: [
            { title: "프론트엔드", description: "Next.js 기반 설계와 개발." },
            { title: "백엔드", description: "NestJS 기반 설계와 개발." },
            { title: "데이터베이스", description: "MariaDB 설계와 개발." },
          ],
        },
        {
          id: "automation", label: "Workflow automation", title: "업무 자동화 기능 개발.",
          description: "네이버 블로그, 당근 비즈니스, 카페 댓글 관련 자동화와 이미지 크롤링·정보 등록 기능을 개발했습니다.",
          items: [
            { title: "네이버 블로그", description: "블로그 관련 업무 자동화." },
            { title: "당근 비즈니스", description: "당근 비즈니스 관련 업무 자동화." },
            { title: "카페 댓글", description: "카페 댓글 관련 자동화." },
            { title: "이미지 · 정보 등록", description: "이미지 크롤링과 정보 등록 기능." },
          ],
        },
        {
          id: "deployment", label: "Deployment & operations", title: "AWS 배포와 CI/CD 구축.",
          description: "AWS 배포·운영 환경과 Docker·GitHub Actions 기반 CI/CD를 구축했습니다. 초기 개발 이후에는 유지보수와 신기능 개발을 맡고 있습니다.",
          items: [
            { title: "AWS 배포 · 운영", description: "EC2, Amplify, DB, S3, AWS Systems Manager 사용." },
            { title: "배포 자동화", description: "Docker와 GitHub Actions 기반 CI/CD." },
            { title: "유지보수 · 신기능", description: "2026.02 초기 개발 이후 유지보수와 신기능 개발 담당." },
          ],
        },
      ],
      phases: [
        { period: "2025.12 ~ 2026.02", title: "초기 개발", description: "전체 시스템 설계, 프론트엔드·백엔드·DB 개발." },
        { period: "초기 개발 이후 ~ 현재", title: "유지보수와 신기능", description: "서비스 유지보수와 신기능 추가." },
      ],
    },
  },
  {
    id: "fatespoiler",
    name: "FateSpoiler",
    category: "이메일 자동화 · 인증 · 앱 개발",
    company: "H-Solution",
    period: "2026.06 ~ 현재",
    url: "https://www.fatespoiler.com/home",
    headline: "이메일 자동화·앱 개발",
    summary: "이메일 자동화와 Apple 로그인을 구현했습니다. 2026.08부터 앱 개발과 등록을 혼자 맡았습니다.",
    role: "이메일 자동화·Apple 로그인·앱 개발 및 등록 단독 수행",
    contributions: [
      "이메일 자동화 시스템 개발",
      "Apple 로그인 구현",
      "2026.08부터 WebView 및 Capacitor 기반 앱 개발",
      "앱 등록 작업 수행",
    ],
    stack: ["Node.js", "Express", "Next.js", "MariaDB", "Capacitor"],
    note: "H-Solution 소속 프로젝트 · 앱 개발은 2026.08부터",
    focus: [
      { label: "Automation", value: "이메일 자동화 시스템" },
      { label: "Authentication", value: "Apple 로그인" },
      { label: "Application", value: "WebView · Capacitor · 앱 등록" },
    ],
    caseStudy: {
      introduction: "FateSpoiler에서 이메일 자동화 시스템과 Apple 로그인을 구현했습니다. 2026.08부터는 WebView·Capacitor 기반 앱 개발과 앱 등록을 맡았습니다. 세 가지 모두 단독으로 수행했습니다.",
      chapters: [
        {
          id: "automation", label: "Email automation", title: "이메일 자동화 시스템 개발.",
          description: "서비스의 이메일 자동화 시스템을 단독으로 개발했습니다.",
          items: [
            { title: "이메일 자동화", description: "단독 개발." },
            { title: "서비스 기술", description: "Node.js, Express, Next.js, MariaDB." },
          ],
        },
        {
          id: "authentication", label: "Apple sign in", title: "Apple 로그인 구현.",
          description: "서비스에 Apple 로그인을 단독으로 구현했습니다.",
          items: [
            { title: "인증 기능", description: "Apple 로그인 구현." },
          ],
        },
        {
          id: "application", label: "WebView & Capacitor", title: "앱 개발과 등록.",
          description: "2026.08부터 WebView·Capacitor 기반 앱을 개발하고 앱 등록까지 단독으로 수행했습니다.",
          items: [
            { title: "앱 개발", description: "WebView·Capacitor 기반 앱 개발." },
            { title: "앱 등록", description: "앱 등록 작업 수행." },
          ],
        },
      ],
      phases: [
        { period: "2026.06 ~ 현재", title: "프로젝트 참여", description: "이메일 자동화 시스템과 Apple 로그인 구현." },
        { period: "2026.08부터", title: "앱 개발", description: "WebView·Capacitor 기반 앱 개발과 앱 등록." },
      ],
    },
  },
  {
    id: "moduerp",
    name: "모두ERP",
    category: "프론트엔드 개발 · 서비스 유지보수",
    company: "H-Solution",
    period: "2026.02 ~ 현재",
    url: "https://mdm.club",
    headline: "프론트엔드 개발·유지보수",
    summary: "Next.js로 프론트엔드를 개발했습니다. 기본 기능 개발 이후 프론트엔드와 Spring Boot 백엔드를 유지보수하고 있습니다.",
    role: "프론트엔드 개발 → 프론트엔드·백엔드 유지보수",
    contributions: [
      "Next.js 기반 프론트엔드 개발",
      "기본 기능 개발 이후 프론트엔드 유지보수",
      "Spring Boot 기반 백엔드 유지보수",
    ],
    stack: ["Spring Boot", "Next.js", "PostgreSQL"],
    note: "H-Solution 소속 프로젝트 · 2026.02 프론트엔드 개발로 참여",
    focus: [
      { label: "Development", value: "프론트엔드 개발" },
      { label: "Maintenance", value: "프론트엔드 · 백엔드 유지보수" },
      { label: "Stack", value: "Next.js · Spring Boot · PostgreSQL" },
    ],
    caseStudy: {
      introduction: "모두ERP의 프론트엔드를 Next.js로 개발했습니다. 기본 기능 개발 이후에는 프론트엔드와 Spring Boot 백엔드 유지보수를 맡고 있습니다.",
      chapters: [
        {
          id: "frontend", label: "Frontend development", title: "Next.js 프론트엔드 개발.",
          description: "2026.02부터 프론트엔드 개발을 맡아 참여했습니다.",
          items: [
            { title: "개발 범위", description: "기본 기능 개발 단계의 프론트엔드." },
            { title: "서비스 기술", description: "Next.js, Spring Boot, PostgreSQL." },
          ],
        },
        {
          id: "maintenance", label: "Frontend & backend maintenance", title: "프론트엔드·백엔드 유지보수.",
          description: "기본 기능 개발 이후 프론트엔드와 백엔드 유지보수를 함께 맡고 있습니다.",
          items: [
            { title: "프론트엔드 유지보수", description: "Next.js 기반 프론트엔드의 유지보수." },
            { title: "백엔드 유지보수", description: "Spring Boot 기반 백엔드의 유지보수." },
          ],
        },
      ],
      phases: [
        { period: "2026.02부터", title: "프론트엔드 개발", description: "Next.js 기반 프론트엔드 개발로 참여." },
        { period: "기본 기능 개발 이후 ~ 현재", title: "프론트엔드 · 백엔드 유지보수", description: "프론트엔드와 Spring Boot 백엔드 유지보수." },
      ],
    },
  },
];

export const career = [
  {
    company: "H-Solution",
    period: "2025.12 ~ 현재",
    title: "풀스택 개발",
    description: "서비스·DB 설계, 프론트엔드·백엔드 개발, 업무 자동화, 앱 개발, AWS 배포·운영 및 CI/CD 구축.",
    links: [
      { label: "H-Works", href: "/projects/h-works" },
      { label: "FateSpoiler", href: "/projects/fatespoiler" },
      { label: "모두ERP", href: "/projects/moduerp" },
    ],
  },
  {
    company: "비에프에이아이",
    period: "2024.09 ~ 2025.12",
    title: "BFAI",
    description: "이전 프로젝트 기록: ENG-SPARK, WhaleAI, Bull-Finder, Guidy / Gaime.",
    links: [
      { label: "ENG-SPARK", href: "/projects/eng-spark" },
      { label: "WhaleAI", href: "/projects/whaleai" },
      { label: "Bull-Finder", href: "/projects/bull-finder" },
      { label: "Guidy / Gaime", href: "/projects/guidy-gaime" },
    ],
  },
  {
    company: "엠와이알오",
    period: "2021.09 ~ 2024.02",
    title: "MYRO",
    description: "MYRO 재직 및 프로젝트 이력.",
    links: [{ label: "MYRO", href: "/projects/myro" }],
  },
];

// 이전 프로젝트. 홈 카드와 /projects/{id} 상세 페이지가 같은 데이터를 쓴다.
// 확인되지 않은 항목은 비워 두고, 페이지는 있는 항목만 보여준다.
export type ArchiveProject = {
  id: string;
  name: string;
  // 한 줄 소개(카드·표지)와 짧은 서비스 설명(상세 본문).
  detail: string;
  description: string;
  // 기존 포트폴리오에서 내려받은 실제 서비스 화면. 정적 export의 public 경로.
  image: { src: string; alt: string; width: number; height: number };
  // 현재 접속 가능한 서비스만 url을 둔다. offline은 사용자가 확인한 접속 불가 상태.
  // 둘 다 없으면 운영 상태를 알 수 없는 것이므로 아무 상태도 표시하지 않는다.
  url?: string;
  offline?: boolean;
  company?: string;
  period?: string;
  role?: string;
  contributions?: string[];
  stack?: string[];
};

// 사용자 확인 사항: Bull-Finder 기간, ENG-SPARK·Gaime의 Azure OpenAI, Guidy=Gaime 동일 서비스,
// BFAI 재직 종료 2025.12, 운영 중 URL 두 건, 나머지 세 건의 접속 불가.
// 서비스 설명·참여 시작 시점·담당 내역은 기존 포트폴리오 원문을 짧게 옮긴 것이다.
// 기존 포트폴리오의 "~ 현재"는 BFAI 재직 종료 이전 기록이므로 시작 시점만 적는다.
export const archive: ArchiveProject[] = [
  {
    id: "eng-spark", name: "ENG-SPARK", detail: "Azure OpenAI로 영어 문제를 생성하는 영어 학습 플랫폼",
    description: "Azure OpenAI로 수능 영어 유형에 맞는 문제를 자동 생성하는 영어 학습 플랫폼입니다. 소셜 로그인과 구독 결제, 크레딧 시스템을 제공합니다.",
    url: "https://eng-spark.com",
    company: "BFAI", period: "2025.08부터",
    role: "프론트엔드 개발 · 백엔드 프로모션 시스템 개발",
    contributions: [
      "영어 학습 플랫폼 프론트엔드 개발 (2025.08부터)",
      "Spring Boot 기반 백엔드 프로모션 시스템 개발: 친구 초대 기능과 이중 크레딧 시스템 (2025.10 ~ 2025.11)",
    ],
    stack: ["Azure OpenAI", "Spring Boot", "Firebase", "Toss Payments"],
    image: { src: "/images/projects/engspark.png", alt: "ENG-SPARK 화면: 영어 아티클을 시험 지문에 맞게 변경하는 입력 화면과 난이도·길이 옵션", width: 1917, height: 896 },
  },
  {
    id: "whaleai", name: "WhaleAI", detail: "Buyer와 Seller를 연결하는 B2B 프로젝트 매칭 서비스",
    description: "AI 기술 기반 프로젝트 매칭 플랫폼입니다. Buyer와 Seller를 연결하는 B2B 매칭 서비스로, 소셜 로그인, 프로젝트 등록·관리, 지원자 관리와 매칭 기능을 제공합니다.",
    url: "https://whaleai.ai",
    company: "BFAI", period: "2024.09 ~ 2025.01",
    role: "웹 서비스 프론트엔드 개발·배포 · Flutter 앱 개발",
    contributions: [
      "웹 서비스 프론트엔드 개발 및 배포 (2024.09 ~ 2024.11)",
      "웹뷰를 활용한 Flutter 기반 하이브리드 모바일 앱 개발 (2024.12 ~ 2025.01)",
    ],
    stack: ["Flutter", "Firebase"],
    image: { src: "/images/projects/whaleai.png", alt: "WhaleAI 홈 화면: 소개 문구와 Explore 버튼, Featured Projects 목록", width: 1902, height: 950 },
  },
  {
    id: "myro", name: "MYRO", detail: "여행 일정을 자동으로 만들어 주는 여행 플래너",
    description: "여행할 도시의 장소, 시간, 선호 활동을 입력하면 AI가 여행 일정을 자동으로 만들어 주는 여행 플래너입니다. 장소 광고를 등록하는 B2B 관리자 서비스 마이로_Ads를 함께 운영했습니다.",
    offline: true,
    company: "MYRO", period: "2021.09 ~ 2024.02",
    role: "주니어 개발자 → 프론트엔드 개발자",
    contributions: [
      "레거시 jQuery 서비스를 Next.js로 전면 리팩토링",
      "장소 카드 드래그 앤 드롭 정렬 기능 구현과 레거시 성능 이슈 해결",
      "로그인, 댓글, 블로그, 관리자 페이지 등 풀스택 개발",
      "장소 광고 관리자 페이지 마이로_Ads 신규 구축",
    ],
    stack: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "MySQL"],
    image: { src: "/images/projects/myro.png", alt: "MYRO 홈 화면: 새로운 여행 플래너 소개 문구와 제주 일정·지도 화면", width: 1554, height: 685 },
  },
  {
    id: "bull-finder", name: "Bull-Finder", detail: "AI 기반 B2B 영업 리드 발굴 서비스",
    description: "대한민국 B2B 영업을 위한 AI 기반 리드 발굴 플랫폼입니다. 세부 산업 분류로 잠재 고객을 찾고, 구독 결제를 제공합니다.",
    offline: true,
    company: "BFAI", period: "2025.03 ~ 2025.05",
    stack: ["Toss Payments", "Material Design 3"],
    image: { src: "/images/projects/bullfinder.png", alt: "Bull-Finder 홈 화면: 초기 고객 발굴 소개 문구와 AI 리드 탐색 버튼", width: 1902, height: 948 },
  },
  {
    id: "guidy-gaime", name: "Gaime (구 Guidy)", detail: "게임 가이드 AI 챗봇 · Guidy에서 이름이 바뀐 하나의 서비스",
    description: "게임 공략, 보스 전략, 빌드, 숨은 팁을 대화로 안내하는 게임 가이드 AI 챗봇입니다. Guidy라는 이름으로 시작해 Gaime으로 이름을 바꾼 하나의 서비스이며, Azure OpenAI를 사용합니다.",
    offline: true,
    company: "BFAI", period: "2025.06부터",
    stack: ["Azure OpenAI"],
    image: { src: "/images/projects/guidy.png", alt: "Gaime 로그인 화면: 게임 가이드 소개 문구와 Google 로그인 버튼", width: 1476, height: 809 },
  },
  {
    id: "onbooth", name: "온부스", detail: "기업에 다양한 워크샵 프로그램을 제공하는 서비스",
    description: "기업에 다양한 워크샵 프로그램을 제공하는 서비스입니다.",
    image: { src: "/images/projects/onbooth.png", alt: "온부스 홈 화면: 워크샵 프로그램 안내 배너와 교육 담당자 고민을 담은 소개 화면", width: 946, height: 546 },
  },
];

// 상세 페이지 순서: 주요 프로젝트 3건 다음에 이전 프로젝트 6건. 다음 프로젝트 이동은 이 아홉을 순환한다.
export type ProjectEntry = { kind: "featured"; project: Project } | { kind: "archive"; project: ArchiveProject };
export const projectEntries: ProjectEntry[] = [
  ...projects.map((project) => ({ kind: "featured" as const, project })),
  ...archive.map((project) => ({ kind: "archive" as const, project })),
];
export const returnAnchor = (entry: ProjectEntry) => (entry.kind === "featured" ? `/#${entry.project.id}` : `/#archive-${entry.project.id}`);

export const previousPortfolio = "https://portfolio-joy.vercel.app";
export const githubUrl = "https://github.com/doppelgoer1";
