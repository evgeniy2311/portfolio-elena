import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import styles from "./accuracy.module.css";
import { accuracySource, checks } from "./data";

/** 8. Точность: исходник неподвижен, детали сменяют друг друга. */
export function Accuracy() {
  return (
    <section className={styles.accuracy} data-pin aria-labelledby="accuracy-title">
      <div className={styles.accuracyStage}>
        <div className={`shell ${styles.accuracyGrid}`}>
          <div className={styles.accuracyCopy}>
            <p className="eyebrow eyebrow-light">Главное отличие</p>
            <h2 id="accuracy-title">
              Вещь в кадре та же, <em>что приедет покупательнице</em>
            </h2>
            <p>Нейросеть любит «улучшать» одежду: добавить пуговицу, укоротить рукав. Я сверяю каждый кадр с оригиналом по списку и переделываю, если что-то уехало.</p>
            <ol className={styles.checkList}>
              {checks.map((check, index) => (
                <li key={check.title} style={{ "--i": index } as Vars}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{check.title}</h3>
                    <p>{check.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className={styles.accuracyCompare}>
            <figure className={styles.accuracySource}>
              <Photo image={accuracySource} alt="Исходник пальто: студийное фото спереди" sizes="(max-width: 1023px) 45vw, 20vw" />
              <figcaption>Исходник</figcaption>
            </figure>
            <div className={styles.accuracyDetails}>
              {checks.map((check, index) => (
                <figure key={check.title} style={{ "--i": index } as Vars}>
                  <Photo image={check.image} alt={`Готовый кадр: ${check.title.toLowerCase()}`} sizes="(max-width: 1023px) 45vw, 24vw" />
                  <figcaption>Кадр: {check.title.toLowerCase()}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
