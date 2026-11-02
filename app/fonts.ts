import { Cormorant_Garamond, Manrope } from "next/font/google";

/*
 * Шрифты сайта в одном месте: их берут app/layout.tsx и app/global-not-found.tsx. Раньше 404 объявляла
 * свой набор (с курсивом и предзагрузкой), и его @font-face и preload попадали на главную вторым комплектом.
 */
// Шрифты версии 3 (design/brief.md): Cormorant Garamond 500/600 и курсив 500, Manrope 400/500/600.
export const display = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600"],
  style: ["normal"],
  variable: "--font-display",
  display: "swap",
});

// Курсив только 500 и отдельным файлом без preload: акценты в заголовках не стоят предзагрузки всех начертаний.
export const displayItalic = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  weight: ["500"],
  style: ["italic"],
  variable: "--font-display-italic",
  display: "swap",
  preload: false,
});

export const ui = Manrope({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});
