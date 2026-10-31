import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { TrialLink } from "@/components/site-shell";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { heroCallout, heroCopy, heroWall, wallSpeeds } from "./data";
import { HeroWall } from "./hero-wall";
import styles from "./hero.module.css";

/** 1. Первый экран: оффер слева, движущаяся стена работ справа и «крупный план» пуговиц бордового пальто. */
export function Hero() {
  return (
    <section className={styles.hero} data-ground="canvas" data-first-screen aria-labelledby="hero-title">
      <div className={styles.copy} data-hero-copy>
        <p className="eyebrow">{heroCopy.eyebrow}</p>
        <h1 id="hero-title">
          Ваша вещь на модели, в&nbsp;городе и&nbsp;в&nbsp;интерьере. <em>Без фотосессии.</em>
        </h1>
        <p className={`lede ${styles.lead}`}>{heroCopy.lead}</p>
        <div className={styles.actions}>
          <TrialLink compact />
          <Link className="text-link" href="/works">
            {heroCopy.works} <ArrowIcon />
          </Link>
        </div>
        <p className={`small ${styles.who}`}>{heroCopy.who}</p>
      </div>

      <HeroWall columns={heroWall} speeds={wallSpeeds} label={heroCopy.wallLabel} />

      {/* «Крупный план»: статичная фигура, не ссылка. На телефоне скрыт; кадр 320 px грузится сразу, чтобы не висеть недогруженным. */}
      <figure className={styles.callout} data-callout>
        <div className={styles.calloutLens} style={{ "--zoom": heroCallout.zoom, "--focus": heroCallout.focus } as Vars}>
          <Photo image={heroCallout.image} alt="Пуговицы бордового пальто крупно" sizes="300px" className={styles.calloutImage} eager />
          <span className={styles.calloutGuide} aria-hidden="true" />
        </div>
        <figcaption className={styles.calloutCaption}>
          <span className={styles.calloutLabel}>{heroCallout.label}</span>
          <span className="small">{heroCallout.caption}</span>
        </figcaption>
      </figure>
    </section>
  );
}
