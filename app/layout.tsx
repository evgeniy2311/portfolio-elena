import type { Metadata } from "next";
import { display, displayItalic, ui } from "./fonts";
import "./globals.css";

// Срабатывает до гидрации, поэтому ловит и ошибки первых кадров. Узлы не удаляет: только атрибуты.
const imageFailureScript = `document.addEventListener("error",function(e){var i=e.target;if(!(i instanceof HTMLImageElement)||i.hasAttribute("data-failed"))return;i.setAttribute("data-failed","");var w=i.getAttribute("width"),h=i.getAttribute("height");if(w&&h)i.style.aspectRatio=w+" / "+h;var p=i.parentElement;if(p&&p.tagName==="PICTURE"){p.querySelectorAll("source").forEach(function(s){s.removeAttribute("srcset")})}i.removeAttribute("srcset");i.src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%271%27 height=%271%27/%3E"},true);`;

export const metadata: Metadata = {
  metadataBase: new URL("https://elena-badyina.example"),
  title: { default: "Елена Бадьина: карточки одежды для WB и Ozon", template: "%s | Елена Бадьина" },
  description: "Кадры для карточек одежды на Wildberries и Ozon без фотостудии. Ручная сверка каждой детали. Два первых кадра бесплатно.",
  // Превью на GitHub Pages не должно попадать в поиск раньше настоящего сайта.
  ...(process.env.NEXT_PUBLIC_BASE_PATH ? { robots: { index: false, follow: false } } : {}),
  openGraph: { title: "Елена Бадьина: визуал для карточек одежды", description: "Кадры для карточек одежды на WB и Ozon. Два первых кадра бесплатно.", type: "website", locale: "ru_RU" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${display.variable} ${displayItalic.variable} ${ui.variable}`}>
      <body>
        {/* Неудачная загрузка кадра: вместо значка битой картинки остаётся плитка --surface того же размера. */}
        <script dangerouslySetInnerHTML={{ __html: imageFailureScript }} />
        <a className="skip-link" href="#main">К основному содержанию</a>
        {children}
      </body>
    </html>
  );
}
