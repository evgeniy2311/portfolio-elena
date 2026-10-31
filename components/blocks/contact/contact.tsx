import { ArrowIcon } from "@/components/arrow-icon";
import { contactLinks } from "@/lib/site";
import styles from "./contact.module.css";

const pendingId = "contact-pending";

/**
 * 15. Контакты, механика «Final Flood». Общий блок для главной, архива и кейсов.
 * Неподтверждённый адрес: фокусируемая кнопка с aria-disabled, без ссылки, с пояснением через aria-describedby.
 */
export function ContactBlock() {
  const links = contactLinks();
  const pending = !links.telegram || !links.whatsapp;
  return (
    <section className={styles.contact} id="contact" aria-labelledby="contact-title" data-ground="wine-deep" data-view>
      <div className={`shell ${styles.contactInner}`}>
        <p className="eyebrow eyebrow-light">Связаться</p>
        <h2 id="contact-title" className={`display ${styles.contactTitle}`} data-reveal>
          <span className={styles.line}>
            <span>Расскажите о своей вещи,</span>
          </span>{" "}
          <span className={styles.line}>
            <em>а я предложу, как её показать</em>
          </span>
        </h2>
        <p className={styles.contactLead}>
          Пишите в Telegram или WhatsApp, как удобнее. Пришлите фото вещи или ссылку на карточку, я посмотрю и скажу, с чего лучше начать.
        </p>
        <div className={styles.contactActions}>
          {links.telegram ? (
            <a className="button button-light" href={links.telegram} target="_blank" rel="noopener noreferrer">
              Написать в Telegram <ArrowIcon />
            </a>
          ) : (
            <button className="button button-light" type="button" aria-disabled="true" aria-describedby={pendingId}>
              Telegram: адрес скоро появится
            </button>
          )}
          {links.whatsapp ? (
            <a className="button button-ghost-light" href={links.whatsapp} target="_blank" rel="noopener noreferrer">
              Написать в WhatsApp <ArrowIcon />
            </a>
          ) : (
            <button className="button button-ghost-light" type="button" aria-disabled="true" aria-describedby={pendingId}>
              WhatsApp: ссылка скоро появится
            </button>
          )}
        </div>
        {pending ? (
          <p className={styles.contactPending} id={pendingId}>
            Контакты уточняются. Кнопки заработают после подтверждения.
          </p>
        ) : null}
        {links.email ? (
          <p className={styles.contactEmail}>
            Или на почту: <a href={`mailto:${links.email}`}>{links.email}</a>
          </p>
        ) : null}
      </div>
    </section>
  );
}
