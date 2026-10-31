import { steps } from "./data";
import styles from "./process.module.css";

/** 10. Как это работает. */
export function Process() {
  return (
    <section className={styles.process} id="process" aria-labelledby="process-title">
      <div className={`shell ${styles.processGrid}`}>
        <div className={styles.sectionHead} data-reveal>
          <p className="eyebrow">Пять шагов</p>
          <h2 id="process-title">
            Как это <em>работает</em>
          </h2>
        </div>
        <ol className={styles.processList} data-view>
          <span className={styles.processLine} aria-hidden="true" />
          {steps.map((step, index) => (
            <li key={step.title} data-reveal>
              <span>{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
