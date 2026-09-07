import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "장준영 · Joy | 풀스택 개발자 포트폴리오",
  description: "서비스·DB 설계부터 프론트엔드·백엔드 개발, 업무 자동화, 앱 개발, AWS 배포·운영까지. 장준영의 프로젝트와 경력 기록입니다.",
  openGraph: {
    title: "장준영 · Joy | 풀스택 개발자 포트폴리오",
    description: "만들고, 운영합니다. H-Works, FateSpoiler, 모두ERP 프로젝트와 경력 기록.",
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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
