import { TrialLink } from "@/components/site-shell";
import { ContactLink } from "@/components/ui/contact-link";
import type { Vars } from "@/components/ui/css-vars";
import { packages, priceLabel } from "@/lib/site";
import { pricesCopy, previews } from "./data";
import { FramePreview } from "./previews";
import styles from "./prices.module.css";

/** 11. Цены: шесть пакетов с живыми примерами работ («Fan + Live Preview»), под сеткой основной оффер. */
export function Prices() {
  return (
    <section className={styles.prices} id="prices" data-ground="surface" aria-labelledby="prices-title">
      <div className="shell">
        <div className={styles.head}>
          <p className="eyebrow">{pricesCopy.eyebrow}</p>
          <h2 id="prices-title">
            Вы платите <em>только за&nbsp;кадры</em>
          </h2>
          <p className="lede">{pricesCopy.sub}</p>
        </div>
        {/* Порог почти ноль: сетка на телефоне высотой в несколько экранов, и доля 0,15 (или 0,08 по умолчанию)
            держала карточки невидимыми ещё 300–400 px прокрутки (D6). «0» движок читает как «по умолчанию». */}
        <ul className={styles.grid} data-reveal="fan" data-reveal-threshold="0.001">
          {packages.map((item, index) => {
            const preview = previews[item.id];
            const classes = [styles.card, item.featured ? styles.featured : "", item.id === "season" ? styles.season : ""].join(" ");
            return (
              <li key={item.id} className={classes} data-card data-package={item.id} style={{ "--i": index } as Vars}>
                {preview ? <FramePreview preview={preview} dark={item.featured} /> : null}
                {item.id === "season" ? (
                  <div className={styles.seasonCover} aria-hidden="true">
                    <span className={styles.seasonWord}>{pricesCopy.seasonCover}</span>
                    <span className={styles.seasonLabel}>{pricesCopy.seasonLabel}</span>
                  </div>
                ) : null}
                {item.featured ? <p className={styles.badge}>{pricesCopy.badge}</p> : null}
                <h3 className="h3">{item.name}</h3>
                <p className={styles.includes}>{item.includes}</p>
                <p className={`num ${styles.price}`} data-price>
                  {priceLabel(item)}
                </p>
                {item.id === "season" ? (
                  <ContactLink intent="season" className={`button button-ghost ${styles.seasonButton}`}>
                    {pricesCopy.season}
                  </ContactLink>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className={styles.cta}>
          <p className="lede">{pricesCopy.cta}</p>
          <TrialLink compact />
        </div>
      </div>
    </section>
  );
}
