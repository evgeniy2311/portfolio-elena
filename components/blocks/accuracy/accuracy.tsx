import { accuracySource, checks } from "./data";
import { Loupe } from "./loupe";
import styles from "./accuracy.module.css";

/** 8. Сверка деталей, «Лупа». От 1024×600 «липкая» сцена 4 × 80vh: один пункт на отрезок прокрутки. */
export function Accuracy() {
  return (
    <section className={styles.accuracy} id="accuracy" data-pin data-segments={checks.length} data-ground="noir" aria-labelledby="accuracy-title">
      <div className={`shell ${styles.stage}`} data-stage>
        <Loupe
          source={accuracySource}
          sourceAlt="Исходник: бордовое пальто на студийном фото"
          checks={checks}
          head={
            <div className={styles.head}>
              <p className="eyebrow eyebrow-light">Сверка деталей</p>
              <h2 id="accuracy-title">
                Покупательница получит ту же вещь, <em>что видела на&nbsp;фото</em>
              </h2>
              <p className={styles.text}>
                Нейросеть любит дорисовать лишнюю пуговицу или укоротить рукав. Я сверяю каждый кадр с вашим исходником по списку деталей. Что-то не совпало, переделываю.
              </p>
              <p className={styles.hint} data-hint>
                Сравните исходник слева и готовый кадр справа.
              </p>
            </div>
          }
        />
      </div>
    </section>
  );
}
