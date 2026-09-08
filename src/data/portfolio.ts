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
      { label: "ENG-SPARK", href: "#archive-eng-spark" },
      { label: "WhaleAI", href: "#archive-whaleai" },
      { label: "Bull-Finder", href: "#archive-bull-finder" },
      { label: "Guidy / Gaime", href: "#archive-guidy-gaime" },
    ],
  },
  {
    company: "엠와이알오",
    period: "2021.09 ~ 2024.02",
    title: "MYRO",
    description: "MYRO 재직 및 프로젝트 이력.",
    links: [{ label: "MYRO", href: "#archive-myro" }],
  },
];

// 세부 담당 범위와 기술이 확인되지 않은 이전 프로젝트는 임의로 보충하지 않는다.
export const archive = [
  { id: "eng-spark", name: "ENG-SPARK", detail: "Azure OpenAI 활용 프로젝트", meta: "BFAI · Azure OpenAI" },
  { id: "whaleai", name: "WhaleAI", detail: "이전 프로젝트 기록", meta: "BFAI" },
  { id: "myro", name: "MYRO", detail: "엠와이알오 재직 기간의 프로젝트 기록", meta: "2021.09 ~ 2024.02" },
  { id: "bull-finder", name: "Bull-Finder", detail: "Bull-Finder AI 프로젝트", meta: "2025.03 ~ 2025.05" },
  { id: "guidy-gaime", name: "Guidy / Gaime", detail: "이름이 변경된 하나의 서비스", meta: "BFAI · 동일 서비스" },
];

export const previousPortfolio = "https://portfolio-joy.vercel.app";
export const githubUrl = "https://github.com/doppelgoer1";
