import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { pains } from "./data";
import styles from "./pains.module.css";

/** 4. Почему вещь продаётся плохо. */
export function Pains() {
  return (
    <section className={styles.pains} aria-labelledby="pains-title">
      <div className="shell">
        <p className="eyebrow" data-reveal>
          Почему так бывает
        </p>
        <h2 id="pains-title" className={styles.painsTitle} data-reveal>
          Хорошая вещь, а продаётся <em>плохо.</em>
        </h2>
        <ol className={styles.painList}>
          {pains.map((pain, index) => (
            <li key={pain.title} data-reveal style={{ "--d": `${index * 90}ms` } as Vars}>
              <figure>
                <Photo image={pain.image} alt={pain.alt} sizes="(max-width: 899px) 92vw, 30vw" />
                <figcaption>{pain.caption}</figcaption>
              </figure>
              <span>0{index + 1}</span>
              <h3>{pain.title}</h3>
              <p>{pain.text}</p>
            </li>
          ))}
        </ol>
        <p className={styles.painsAnswer} data-reveal>
          Я делаю кадры, которые останавливают взгляд на вашей карточке. Без фотосессии и без подмены вещи.
        </p>
      </div>
    </section>
  );
}
