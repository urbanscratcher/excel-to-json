import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excel to JSON Converter",
  description: "Excel 파일을 i18n JSON 파일로 변환",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
