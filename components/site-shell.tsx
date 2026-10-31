import Link from "next/link";
import { ContactLink } from "@/components/ui/contact-link";

type HeaderProps = { current?: "home" | "works" };

/** Шапка всех страниц. Действие «Написать» ведёт к блоку контактов, он есть на каждой странице. */
export function SiteHeader({ current }: HeaderProps) {
  const home = current === "home" ? "" : "/";
  return (
    <header className="site-header">
      <span className="site-progress" aria-hidden="true" />
      <div className="shell site-header-row">
        {/* На главной ссылка ведёт на эту же страницу: её предзагрузка (~23 KB данных) ничего не даёт первому экрану. */}
        <Link className="wordmark" href="/" prefetch={current === "home" ? false : undefined} aria-label="Елена Бадьина, на главную">
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

/** Главная кнопка сайта «2 кадра бесплатно»: ContactLink с поводом trial. Совместимость с прежним API. */
export function TrialLink({ className = "button", compact = false, label }: { className?: string; compact?: boolean; label?: string }) {
  return (
    <ContactLink intent="trial" className={className}>
      {label ?? (compact ? "2 кадра бесплатно" : "Получить 2 кадра бесплатно")}
    </ContactLink>
  );
}

/** Совместимость: блок контактов живёт в components/blocks/contact, архив и кейсы импортируют его отсюда. */
export { ContactBlock } from "@/components/blocks/contact/contact";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer-row">
        <span className="site-footer-name">Елена Бадьина</span>
        <span>Визуал для карточек одежды и обуви: Ozon, Wildberries, Lamoda, сайты брендов</span>
      </div>
    </footer>
  );
}
