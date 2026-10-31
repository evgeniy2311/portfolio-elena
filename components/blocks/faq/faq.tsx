import { faq } from "./data";
import styles from "./faq.module.css";

/** 12. Частые вопросы на нативных details. */
export function Faq() {
  return (
    <section className={styles.faq} id="faq" aria-labelledby="faq-title">
      <div className={`shell ${styles.faqGrid}`}>
        <div className={styles.sectionHead} data-reveal>
          <p className="eyebrow">Вопросы</p>
          <h2 id="faq-title">
            Часто задаваемые <em>вопросы</em>
          </h2>
        </div>
        <div className={styles.faqList}>
          {faq.map((item) => (
            <details key={item.q} data-reveal>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
