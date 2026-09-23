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
  title: { default: "Елена Бадьина — дизайн карточек для WB и Ozon", template: "%s | Елена Бадьина" },
  description: "Портфолио дизайнера товарных воронок для одежды на Wildberries и Ozon. Нейровизуал с ручной сверкой деталей товара.",
  openGraph: { title: "Елена Бадьина — Commerce Atelier", description: "Дизайн карточек одежды для WB и Ozon.", type: "website", locale: "ru_RU" },
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
