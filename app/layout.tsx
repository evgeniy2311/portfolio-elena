import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const ui = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://elena-badyina.example"),
  title: { default: "Елена Бадьина: карточки одежды для WB и Ozon", template: "%s | Елена Бадьина" },
  description: "Кадры для карточек одежды на Wildberries и Ozon без фотостудии. Ручная сверка каждой детали. Два первых кадра бесплатно.",
  openGraph: { title: "Елена Бадьина: визуал для карточек одежды", description: "Кадры для карточек одежды на WB и Ozon. Два первых кадра бесплатно.", type: "website", locale: "ru_RU" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${display.variable} ${ui.variable}`}>
      <body>
        <a className="skip-link" href="#main">К основному содержанию</a>
        {children}
      </body>
    </html>
  );
}
