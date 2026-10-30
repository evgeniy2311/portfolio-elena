import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { contact, telegramHref } from "@/lib/site";

type HeaderProps = { current?: "home" | "works" };

export function SiteHeader({ current }: HeaderProps) {
  const home = current === "home" ? "" : "/";
  return (
    <header className="site-header">
      <span className="site-progress" aria-hidden="true" />
      <div className="shell site-header-row">
        <Link className="wordmark" href="/" aria-label="Елена Бадьина, на главную">
          Елена Бадьина
          <small>одежда и обувь · WB и Ozon</small>
        </Link>
        <nav aria-label="Основная навигация">
          <Link href="/works" aria-current={current === "works" ? "page" : undefined}>Работы</Link>
          <Link href={`${home}#services`}>Услуги</Link>
          <Link href={`${home}#process`}>Как работаю</Link>
          <Link href={`${home}#prices`}>Цены</Link>
          <Link href={`${home}#faq`}>Вопросы</Link>
        </nav>
        <TrialLink className="button button-small" compact />
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

export function ContactBlock() {
  const href = telegramHref();
  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="shell contact-inner" data-reveal>
        <p className="eyebrow">Первый шаг</p>
        <h2 id="contact-title">
          Пришлите фото вещи. <em>Два кадра сделаю бесплатно.</em>
        </h2>
        <p className="contact-lead">
          Нужны 2–3 фото: спереди, сзади и крупно детали. Можно приложить ссылку на карточку. Если результат не понравится, вы ничего не должны.
        </p>
        <div className="contact-actions">
          {href ? (
            <a className="button button-light" href={href} target="_blank" rel="noopener noreferrer">
              Написать в Telegram <ArrowIcon />
            </a>
          ) : (
            <>
              <button className="button button-light" type="button" disabled aria-describedby="contact-pending">
                Telegram: ссылка скоро появится
              </button>
              <small id="contact-pending">Адрес Telegram ещё уточняется. Кнопка заработает после подтверждения.</small>
            </>
          )}
          {contact.backup ? (
            <a className="contact-backup" href={contact.backup.href}>
              {contact.backup.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

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
