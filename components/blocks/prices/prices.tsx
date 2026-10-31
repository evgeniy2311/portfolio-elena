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
        <ul className={styles.grid} data-reveal="fan" data-reveal-threshold="0.15">
          {packages.map((item, index) => {
            const preview = previews[item.id];
            const classes = [styles.card, item.featured ? styles.featured : "", item.id === "season" ? styles.season : ""].join(" ");
            return (
              <li key={item.id} className={classes} data-card data-package={item.id} style={{ "--i": index } as Vars}>
                {preview ? <FramePreview preview={preview} dark={item.featured} /> : null}
                {item.featured ? <p className={styles.badge}>{pricesCopy.badge}</p> : null}
                <h3 className={item.id === "season" ? "h3-lg" : "h3"}>{item.name}</h3>
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
