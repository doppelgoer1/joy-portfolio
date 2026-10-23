import type { Metadata } from "next";
import "./globals.css";
import "./view-transitions.css";

export const metadata: Metadata = {
  title: "장준영 · Joy | 풀스택 개발자 포트폴리오",
  description: "풀스택 개발자 장준영. 프론트엔드·백엔드·DB 설계, 업무 자동화, 앱 개발, AWS 인프라와 CI/CD 배포 자동화까지. 아홉 프로젝트의 담당 업무와 개발 기록입니다.",
  openGraph: {
    title: "장준영 · Joy | 풀스택 개발자 포트폴리오",
    description: "풀스택 개발자 장준영. 프론트엔드·백엔드·DB 설계, 업무 자동화, 앱 개발, AWS 인프라와 CI/CD 배포 자동화까지. 아홉 프로젝트의 담당 업무와 개발 기록입니다.",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head><script src="/work-navigation.js" /></head>
      <body>{children}</body>
    </html>
  );
}
