import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { telegramHref } from "@/lib/site";

type HeaderProps = { current?: "home" | "works" };

/** Шапка всех страниц. Действие «Написать» ведёт к блоку контактов, он есть на каждой странице. */
export function SiteHeader({ current }: HeaderProps) {
  const home = current === "home" ? "" : "/";
  return (
    <header className="site-header">
      <span className="site-progress" aria-hidden="true" />
      <div className="shell site-header-row">
        <Link className="wordmark" href="/" aria-label="Елена Бадьина, на главную">
          Елена Бадьина
          <small>одежда и обувь для маркетплейсов</small>
        </Link>
        <nav aria-label="Основная навигация">
          <Link href="/works" aria-current={current === "works" ? "page" : undefined}>Работы</Link>
          <Link href={`${home}#services`}>Услуги</Link>
          <Link href={`${home}#process`}>Как работаю</Link>
          <Link href={`${home}#prices`}>Цены</Link>
          <Link href={`${home}#faq`}>Вопросы</Link>
        </nav>
        <a className="button button-ghost site-header-cta" href="#contact">
          Написать
        </a>
      </div>
    </header>
  );
}

/** Главная кнопка сайта. Ведёт в Telegram с готовым текстом или к блоку контактов, пока ссылки нет. */
export function TrialLink({ className = "button", compact = false, label }: { className?: string; compact?: boolean; label?: string }) {
  const href = telegramHref();
  const text = label ?? (compact ? "2 кадра бесплатно" : "Получить 2 кадра бесплатно");
  if (href) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {text} <ArrowIcon />
      </a>
    );
  }
  return (
    <Link className={className} href="/#contact">
      {text} <ArrowIcon />
    </Link>
  );
}

/** Совместимость: блок контактов живёт в components/blocks/contact, архив и кейсы импортируют его отсюда. */
export { ContactBlock } from "@/components/blocks/contact/contact";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer-row">
        <span>Елена Бадьина</span>
        <span>Визуал для карточек одежды и обуви на Wildberries и Ozon</span>
        <span>© 2026</span>
      </div>
    </footer>
  );
}
