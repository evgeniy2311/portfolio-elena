import Link from "next/link";
import { TrialLink } from "@/components/site-shell";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { heroColumns } from "./data";
import styles from "./hero.module.css";

/** 1. Первый экран: оффер и сразу много работ. */
export function Hero() {
  return (
    <section className={styles.hero} data-view aria-labelledby="hero-title">
      <div className={`shell ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <p className="eyebrow">Елена Бадьина · фото одежды и обуви для WB и Ozon</p>
          <h1 id="hero-title">
            Фото, которые поднимут вашу карточку <em>над сотнями похожих</em>
          </h1>
          <p className={styles.heroLead}>Ставлю вашу вещь на модель, в город или в интерьер без фотосессии. И сверяю каждую деталь с оригиналом.</p>
          <div className={styles.heroActions}>
            <TrialLink />
            <Link className="button button-ghost" href="#transform">
              Смотреть работы
            </Link>
          </div>
          <p className={styles.heroNote}>Первые два кадра делаю бесплатно на вашей вещи.</p>
        </div>

        <div className={styles.wall} aria-label="Мои работы: кадры для карточек одежды">
          {heroColumns.map((column, columnIndex) => (
            <div className={styles.wallColumn} key={columnIndex} style={{ "--c": columnIndex } as Vars}>
              {column.map((item, index) => (
                <figure key={item.image.src}>
                  <Photo image={item.image} alt={item.alt} sizes="(max-width: 1023px) 32vw, 18vw" priority={index === 0} eager />
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
