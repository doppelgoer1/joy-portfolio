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
    headline: "설계부터 배포까지,\n하나의 서비스로.",
    summary: "프론트엔드·백엔드·DB를 함께 설계하고, 업무 자동화와 AWS 배포 환경까지 구축했습니다. 초기 개발 이후에도 유지보수와 신기능 개발을 이어가고 있습니다.",
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
      introduction: "H-Works에서는 서비스의 전체 시스템 설계와 개발을 담당했습니다. 프론트엔드·백엔드·데이터베이스를 설계하고 구현하는 일부터 업무 자동화 기능, AWS 배포 환경과 배포 자동화 구축까지 이어진 프로젝트입니다.",
      chapters: [
        {
          id: "architecture", label: "Architecture & development", title: "서비스를 구성하는 세 영역의 설계와 개발.",
          description: "프론트엔드·백엔드·DB 설계를 포함한 전체 시스템 설계와 개발을 맡았습니다. 사용 기술은 Next.js, NestJS, MariaDB입니다.",
          items: [
            { title: "프론트엔드", description: "서비스의 프론트엔드 설계와 개발을 담당했습니다." },
            { title: "백엔드", description: "전체 시스템 설계 범위에 백엔드를 포함하고, 백엔드 개발을 직접 수행했습니다." },
            { title: "데이터베이스", description: "서비스 데이터베이스의 설계와 개발을 함께 담당했습니다." },
          ],
        },
        {
          id: "automation", label: "Workflow automation", title: "업무 자동화를 서비스의 기능으로.",
          description: "플랫폼별 업무 자동화와 이미지 크롤링·정보 등록 기능을 직접 개발했습니다. 시스템 개발과 함께 담당한 구체적인 기능들입니다.",
          items: [
            { title: "네이버 블로그", description: "네이버 블로그 관련 업무 자동화 기능을 개발했습니다." },
            { title: "당근 비즈니스", description: "당근 비즈니스 관련 업무 자동화 기능을 개발했습니다." },
            { title: "카페 댓글", description: "카페 댓글 관련 자동화 기능을 개발했습니다." },
            { title: "이미지 · 정보 등록", description: "이미지 크롤링과 정보 등록 기능을 개발했습니다." },
          ],
        },
        {
          id: "deployment", label: "Deployment & operations", title: "구현한 서비스를 배포하고, 배포도 자동화하다.",
          description: "AWS 배포·운영 환경과 CI/CD 배포 자동화를 직접 구축했습니다. 초기 개발 이후에는 유지보수와 신기능 개발을 이어가고 있습니다.",
          items: [
            { title: "AWS 배포 · 운영", description: "배포·운영에 사용한 구성요소는 EC2, Amplify, DB, S3, AWS Systems Manager입니다." },
            { title: "배포 자동화", description: "Docker와 GitHub Actions를 활용한 CI/CD 배포 자동화를 구축했습니다." },
            { title: "유지보수 · 신기능", description: "2026.02 초기 개발을 마친 이후에도 서비스 유지보수와 새로운 기능 개발을 담당하고 있습니다." },
          ],
        },
      ],
      phases: [
        { period: "2025.12 ~ 2026.02", title: "초기 개발", description: "전체 시스템 설계, 프론트엔드·백엔드·DB 개발." },
        { period: "초기 개발 이후 ~ 현재", title: "운영과 확장", description: "서비스 유지보수와 신기능 추가를 이어가는 중." },
      ],
    },
  },
  {
    id: "fatespoiler",
    name: "FateSpoiler",
    category: "이메일 자동화 · 인증 · 앱 개발",
    period: "2026.06 ~ 현재",
    url: "https://www.fatespoiler.com/home",
    headline: "웹의 경험을\n앱으로 이어가다.",
    summary: "기존 서비스에 이메일 자동화와 Apple 로그인을 구현하고, WebView·Capacitor 기반 앱 개발과 앱 등록을 담당했습니다.",
    role: "이메일 자동화·Apple 로그인·앱 개발 및 등록 단독 수행",
    contributions: [
      "이메일 자동화 시스템 개발",
      "Apple 로그인 구현",
      "2026.08부터 WebView 및 Capacitor 기반 앱 개발",
      "앱 등록 작업 수행",
    ],
    stack: ["Node.js", "Express", "Next.js", "MariaDB", "Capacitor"],
    note: "H-Solution 소속 프로젝트 · 명시한 기능과 앱 개발 담당",
    focus: [
      { label: "Automation", value: "이메일 자동화 시스템" },
      { label: "Authentication", value: "Apple 로그인" },
      { label: "Application", value: "WebView · Capacitor · 앱 등록" },
    ],
    caseStudy: {
      introduction: "FateSpoiler에서는 기존 서비스의 이메일 자동화 시스템과 Apple 로그인, WebView·Capacitor 기반 앱 개발 및 앱 등록을 맡았습니다. 명시한 기능과 앱 개발·등록을 각각 단독으로 수행했습니다.",
      chapters: [
        {
          id: "automation", label: "Email automation", title: "이메일 자동화 시스템 개발.",
          description: "기존 서비스에 이메일 자동화 시스템을 개발했습니다. FateSpoiler에서 단독으로 담당한 기능 중 하나입니다.",
          items: [
            { title: "이메일 자동화", description: "이메일 자동화 시스템 개발을 단독 수행했습니다." },
            { title: "서비스 기술", description: "FateSpoiler의 웹 기술은 Node.js, Express, Next.js, MariaDB입니다." },
          ],
        },
        {
          id: "authentication", label: "Apple sign in", title: "기존 서비스에 Apple 로그인 구현.",
          description: "이메일 자동화와 함께 Apple 로그인 구현을 단독으로 담당했습니다.",
          items: [
            { title: "인증 기능", description: "FateSpoiler의 Apple 로그인 기능을 직접 구현했습니다." },
          ],
        },
        {
          id: "application", label: "WebView & Capacitor", title: "웹에서 앱 개발과 등록으로.",
          description: "2026.08부터 WebView와 Capacitor를 기반으로 앱을 개발했습니다. 앱 개발에 이어 앱 등록 작업도 단독으로 수행했습니다.",
          items: [
            { title: "앱 개발", description: "WebView 및 Capacitor 기반 앱 개발을 담당했습니다." },
            { title: "앱 등록", description: "앱 등록 작업까지 직접 수행했습니다." },
          ],
        },
      ],
      phases: [
        { period: "2026.06 ~ 현재", title: "프로젝트 참여", description: "이메일 자동화 시스템과 Apple 로그인 구현 담당." },
        { period: "2026.08부터", title: "앱 개발", description: "WebView·Capacitor 기반 앱 개발 및 앱 등록 담당." },
      ],
    },
  },
  {
    id: "moduerp",
    name: "모두ERP",
    category: "프론트엔드 개발 · 서비스 유지보수",
    period: "2026.02 ~ 현재",
    url: "https://mdm.club",
    headline: "화면을 만들고,\n운영을 이어가다.",
    summary: "모두ERP의 프론트엔드를 개발했습니다. 기본 기능 개발 이후에는 프론트엔드와 백엔드의 유지보수를 함께 담당하고 있습니다.",
    role: "프론트엔드 개발 → 프론트엔드·백엔드 유지보수",
    contributions: [
      "Next.js 기반 프론트엔드 개발",
      "기본 기능 개발 이후 프론트엔드 유지보수",
      "Spring Boot 기반 백엔드 유지보수",
    ],
    stack: ["Spring Boot", "Next.js", "PostgreSQL"],
    note: "초기 프론트엔드 개발부터 서비스 유지보수까지",
    focus: [
      { label: "Development", value: "프론트엔드 개발" },
      { label: "Maintenance", value: "프론트엔드 · 백엔드 유지보수" },
      { label: "Stack", value: "Next.js · Spring Boot · PostgreSQL" },
    ],
    caseStudy: {
      introduction: "모두ERP에서는 프론트엔드 개발을 담당했습니다. 기본 기능 개발 이후에는 프론트엔드와 백엔드의 유지보수를 함께 맡으며, 개발 단계에서 운영 단계로 역할을 이어가고 있습니다.",
      chapters: [
        {
          id: "frontend", label: "Frontend development", title: "초기 프론트엔드 개발 담당.",
          description: "프로젝트에는 프론트엔드 개발을 담당하며 참여했습니다. Next.js 기반 프론트엔드를 개발했습니다.",
          items: [
            { title: "개발 범위", description: "기본 기능 개발 단계에서 맡은 영역은 프론트엔드입니다." },
            { title: "서비스 기술", description: "모두ERP는 Next.js, Spring Boot, PostgreSQL을 사용합니다." },
          ],
        },
        {
          id: "maintenance", label: "Frontend & backend maintenance", title: "기본 기능 개발 이후, 양쪽의 유지보수.",
          description: "기본 기능 개발이 끝난 이후에는 프론트엔드뿐 아니라 백엔드 유지보수도 함께 담당했습니다.",
          items: [
            { title: "프론트엔드 유지보수", description: "Next.js 기반 프론트엔드의 유지보수를 이어가고 있습니다." },
            { title: "백엔드 유지보수", description: "Spring Boot 기반 백엔드의 유지보수를 담당하고 있습니다." },
          ],
        },
      ],
      phases: [
        { period: "2026.02부터", title: "프론트엔드 개발", description: "Next.js 기반 프론트엔드 개발로 프로젝트에 참여." },
        { period: "기본 기능 개발 이후 ~ 현재", title: "프론트엔드 · 백엔드 유지보수", description: "프론트엔드와 Spring Boot 백엔드 유지보수 담당." },
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
