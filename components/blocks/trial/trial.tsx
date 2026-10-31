import { TrialLink } from "@/components/site-shell";
import styles from "./trial.module.css";

/** 9. Бесплатная проба. */
export function Trial() {
  return (
    <section className={styles.trial} id="trial" aria-labelledby="trial-title">
      <div className={`shell ${styles.trialGrid}`} data-reveal>
        <p className="eyebrow eyebrow-light">Попробуйте без риска</p>
        <h2 id="trial-title">
          Два кадра бесплатно. <em>На вашей вещи.</em>
        </h2>
        <p className={styles.trialLead}>Пришлите 2–3 фото вещи. Я сделаю 1–2 кадра, и вы увидите результат до оплаты. Не понравится, вы ничего не должны.</p>
        <TrialLink className="button button-light" />
      </div>
    </section>
  );
}
