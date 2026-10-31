import { ContactLink } from "@/components/ui/contact-link";
import { Accordion } from "./accordion";
import { faq, faqCopy } from "./data";
import styles from "./faq.module.css";

/** 14. Частые вопросы: десять безопасных ответов, «Breathing Accordion», вторичная кнопка «Задать вопрос». */
export function Faq() {
  return (
    <section className={styles.faq} id="faq" data-ground="canvas" aria-labelledby="faq-title">
      <div className={`shell ${styles.grid}`}>
        <div className={styles.head}>
          <p className="eyebrow">{faqCopy.eyebrow}</p>
          <h2 id="faq-title">
            Что обычно <em>спрашивают</em>
          </h2>
        </div>
        <div className={styles.body}>
          <Accordion items={faq} />
          <div className={styles.end}>
            <p className="lede">{faqCopy.end}</p>
            <ContactLink intent="question" className="button button-ghost">
              {faqCopy.button}
            </ContactLink>
          </div>
        </div>
      </div>
    </section>
  );
}
