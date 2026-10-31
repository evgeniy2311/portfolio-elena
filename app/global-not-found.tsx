import type { Metadata } from "next";
import Link from "next/link";
import { display, displayItalic, ui } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Работа не найдена | Елена Бадьина",
  robots: { index: false, follow: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="ru" className={`${display.variable} ${displayItalic.variable} ${ui.variable}`}>
      <body>
        <a className="skip-link" href="#main">К основному содержанию</a>
        <main id="main" tabIndex={-1} className="not-found shell">
          <p className="eyebrow">404</p>
          <h1>Такой работы нет</h1>
          <p>Вернитесь к списку работ и выберите любую.</p>
          <Link className="button" href="/works">Все работы</Link>
        </main>
      </body>
    </html>
  );
}
