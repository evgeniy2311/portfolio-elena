import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { pains, titleAccent, titleWords } from "./data";
import styles from "./pains.module.css";

/**
 * 4. Почему так бывает. Механика «Ink Line»: линия над строкой рисуется слева (900 мс), номер и текст
 * поднимаются на 8 px через 400 мс; заголовок читается по словам вслед за прокруткой (--p заголовка).
 * Без JS и при reduced motion всё сразу видно.
 */
export function Pains() {
  const count = titleWords.length + 1;
  return (
    <section className={styles.pains} id="pains" data-ground="blush" aria-labelledby="pains-title">
      <div className="shell">
        <p className="eyebrow">Почему так бывает</p>
        <h2 id="pains-title" className={`display ${styles.title}`} data-view style={{ "--n": count } as Vars}>
          {titleWords.map((word, index) => (
            <span key={word} data-word="" style={{ "--w": index } as Vars}>
              {word}{" "}
            </span>
          ))}
          <em data-word="" style={{ "--w": count - 1 } as Vars}>
            {titleAccent}
          </em>
        </h2>
        <ol className={styles.list}>
          {pains.map((pain, index) => (
            <li key={pain.title} className={styles.row} data-reveal="ink" data-reveal-threshold="0.2">
              <span className={styles.rule} data-rule="" aria-hidden="true" />
              <span className={`num ${styles.number}`} data-pain-number="">
                0{index + 1}
              </span>
              <div className={styles.text}>
                <h3 className="h3">{pain.title}</h3>
                <p>{pain.text}</p>
              </div>
              <figure className={styles.figure}>
                <Photo image={pain.image} alt={pain.alt} sizes="(max-width: 767px) 72vw, (max-width: 1023px) 40vw, 280px" />
                <figcaption className="small">{pain.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
