import { ArrowIcon } from "@/components/arrow-icon";
import { contact, telegramHref } from "@/lib/site";
import styles from "./contact.module.css";

/** 13. Контакты. Общий блок для главной, архива и кейсов; пока ссылки на Telegram нет, кнопка неактивна. */
export function ContactBlock() {
  const href = telegramHref();
  return (
    <section className={styles.contact} id="contact" aria-labelledby="contact-title">
      <div className={`shell ${styles.contactInner}`} data-reveal>
        <p className="eyebrow">Первый шаг</p>
        <h2 id="contact-title">
          Пришлите фото вещи. <em>Два кадра сделаю бесплатно.</em>
        </h2>
        <p className={styles.contactLead}>
          Нужны 2–3 фото: спереди, сзади и крупно детали. Можно приложить ссылку на карточку. Если результат не понравится, вы ничего не должны.
        </p>
        <div className={styles.contactActions}>
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
            <a className={styles.contactBackup} href={contact.backup.href}>
              {contact.backup.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
