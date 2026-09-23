import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";

type HeaderProps = {
  current?: "home" | "works";
  contactHref?: string;
  sticky?: boolean;
};

export function SiteHeader({ current, contactHref = "#contact", sticky = false }: HeaderProps) {
  return (
    <header className={`site-header shell${sticky ? " site-header--sticky" : ""}`}>
      <Link className="wordmark" href="/" aria-label="Елена Бадьина, главная">
        ЕБ<span>·</span>
      </Link>
      <nav aria-label="Основная навигация">
        {current === "home" ? <span aria-current="page">Главная</span> : <Link href="/">Главная</Link>}
        {current === "works" ? <span aria-current="page">Все работы</span> : <Link href="/works">Все работы</Link>}
        <Link href="/#approach">Подход</Link>
        <Link href="/#about">О Елене</Link>
      </nav>
      <a className="header-cta" href={contactHref}>Обсудить проект <ArrowIcon /></a>
    </header>
  );
}

type FooterProps = {
  children?: React.ReactNode;
  id?: string;
  kicker?: string;
  heading?: string;
  body?: string;
};

export function SiteFooter({
  children,
  id = "contact",
  kicker = "Новый проект",
  heading = "Есть товар. Найдём для него сцену.",
  body = "Можно начать со ссылки на карточку и исходных материалов. Контакт будет активирован после подтверждения Telegram-ссылки.",
}: FooterProps) {
  const descriptionId = `${id}-telegram-note`;
  return (
    <footer className="site-footer" id={id}>
      {children}
      <div className="shell site-footer-contact">
        <p className="eyebrow light">{kicker}</p>
        <h2>{heading}</h2>
        <p>{body}</p>
        <button type="button" disabled aria-describedby={descriptionId}>Telegram · ссылка уточняется</button>
        <small id={descriptionId}>Кнопка станет внешней ссылкой после подтверждения адреса. Сейчас она не отправляет данные.</small>
        <div className="site-footer-line">
          <span>Elena Badyina</span>
          <span>Commerce Atelier · Local prototype</span>
          <span>2026</span>
        </div>
      </div>
    </footer>
  );
}
