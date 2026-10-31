import { TrialLink } from "@/components/site-shell";
import type { Vars } from "@/components/ui/css-vars";
import { formatPrice, packages } from "@/lib/site";
import styles from "./prices.module.css";

/** 11. Цены. Пакеты берутся из lib/site.ts. */
export function Prices() {
  return (
    <section className={styles.prices} id="prices" aria-labelledby="prices-title">
      <div className="shell">
        <div className={styles.sectionHead} data-reveal>
          <p className="eyebrow">Цены</p>
          <h2 id="prices-title">
            Платите за кадры, <em>а не за студию</em>
          </h2>
          <p>Без аренды студии, гонорара модели и стилиста. Точную цену назову, когда увижу вещь и задачу.</p>
        </div>
        <ul className={styles.priceGrid}>
          {packages.map((item, index) => (
            <li key={item.name} className={item.featured ? styles.priceFeatured : undefined} data-reveal style={{ "--d": `${index * 70}ms` } as Vars}>
              {item.featured ? <p className={styles.priceBadge}>Чаще всего берут</p> : null}
              <h3>{item.name}</h3>
              <p>{item.includes}</p>
              {item.priceFrom !== null ? <p className={styles.priceValue}>{formatPrice(item.priceFrom)}</p> : null}
            </li>
          ))}
        </ul>
        <div className={styles.priceCta} data-reveal>
          <p>Начните с двух бесплатных кадров, а цену серии обсудим после.</p>
          <TrialLink />
        </div>
      </div>
    </section>
  );
}
