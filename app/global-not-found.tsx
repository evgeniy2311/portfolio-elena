import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Link from "next/link";
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
  title: "Работа не найдена | Елена Бадьина",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ru" className={`${display.variable} ${ui.variable}`}>
      <body>
        <a className="skip-link" href="#main">К основному содержанию</a>
        <main id="main" tabIndex={-1} className="not-found shell">
          <p className="eyebrow">404</p>
          <h1>Такой работы нет</h1>
          <p>Вернитесь в архив и выберите одну из демонстрационных воронок.</p>
          <Link className="button primary" href="/works">Смотреть все работы →</Link>
        </main>
      </body>
    </html>
  );
}
