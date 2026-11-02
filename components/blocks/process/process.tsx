import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { ArrowIcon } from "@/components/arrow-icon";
import { AssemblyControls } from "./assembly-line";
import { assembly, steps } from "./data";
import styles from "./process.module.css";

const layerNames = ["source", "trial", "series", "check", "delivery"] as const;

/**
 * 10. Как это работает. Механика «Assembly Line»: карточка собирается из настоящих кадров в пять
 * состояний. От 1024 × 600 сцена «липнет» и идёт по прокрутке (--k/--t движка, шаг слева активен);
 * ниже — по времени, 1,4 с на состояние, только на экране, с точками и паузой (assembly-line.tsx).
 * Без JS и при reduced motion — пять статичных кадров со стрелками и все шаги.
 */
export function Process() {
  return (
    <section className={styles.process} id="process" data-ground="paper" data-pin data-segments={steps.length} aria-labelledby="process-title">
      <div className={styles.stage} data-stage>
        <div className={`shell ${styles.grid}`}>
          <div className={styles.head}>
            <p className="eyebrow">Как работаем</p>
            <h2 id="process-title">
              От фото вещи <em>до готовой карточки</em>
            </h2>
          </div>

          <div className={styles.visual}>
            <div className={styles.assembly} data-assembly="" data-phase="0">
              {layerNames.map((name, index) => (
                <div key={name} className={`${styles.layer} ${styles[name]}`} data-layer={name} style={{ "--i": index } as Vars}>
                  <span className={`num ${styles.layerNumber}`} aria-hidden="true">
                    0{index + 1}
                  </span>
                  {name === "source" ? (
                    <div className={styles.phone}>
                      <Photo image={assembly.source.image} alt={assembly.source.alt} sizes="(max-width: 1023px) 70vw, 340px" />
                    </div>
                  ) : null}
                  {name === "trial" ? (
                    <div className={styles.scan}>
                      {assembly.trial.map((shot, shotIndex) => (
                        <Photo key={shot.image.src} className={shotIndex === 0 ? styles.shotA : styles.shotB} image={shot.image} alt={shot.alt} sizes="(max-width: 1023px) 70vw, 340px" />
                      ))}
                      <span className={styles.scanLine} aria-hidden="true" />
                    </div>
                  ) : null}
                  {name === "series"
                    ? assembly.series.map((shot, thumb) => (
                        <div key={shot.image.src} className={styles.thumb} style={{ "--j": thumb, "--c": (thumb % 2) - 0.5, "--r": Math.floor(thumb / 2) - 1 } as Vars} aria-hidden="true">
                          <Photo image={shot.image} alt="" sizes="(max-width: 1023px) 35vw, 160px" />
                        </div>
                      ))
                    : null}
                  {name === "check" ? (
                    <div className={styles.checkFrame}>
                      <Photo image={assembly.check.image} alt={assembly.check.alt} sizes="(max-width: 1023px) 100vw, 480px" />
                      <span className={styles.corners} aria-hidden="true" />
                      {assembly.details.map((detail, dot) => (
                        <span key={detail.label} className={styles.detail} data-detail="" style={{ "--x": `${detail.x}%`, "--y": `${detail.y}%`, "--j": dot } as Vars} aria-hidden="true">
                          <span className="small">{detail.label}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {name === "delivery" ? (
                    <figure className={styles.deliveryCard}>
                      <div className={styles.device} aria-hidden="true">
                        <div className={styles.screen}>
                          <div className={styles.strip}>
                            {assembly.delivery.map((shot) => (
                              <Photo key={shot.image.src} image={shot.image} alt="" sizes="(max-width: 1023px) 40vw, 200px" />
                            ))}
                          </div>
                        </div>
                        <span className={styles.skeleton} />
                        <span className={styles.skeleton} />
                      </div>
                      <figcaption className="small">{assembly.deliveryCaption}</figcaption>
                    </figure>
                  ) : null}
                </div>
              ))}
            </div>
            <AssemblyControls count={layerNames.length} labels={steps.map((step) => step.title)} className={styles.controls} />
          </div>

          <div className={styles.stepsBlock}>
            <div className={styles.track}>
              <span className={styles.rail} aria-hidden="true" />
              <ol className={styles.steps}>
              {steps.map((step, index) => (
                <li key={step.title} className={styles.step} data-step="" data-segment="">
                  <span className={`num ${styles.stepNumber}`}>0{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p className="small">{step.text}</p>
                  </div>
                </li>
              ))}
              </ol>
            </div>
            <a className="text-link" href="#prices">
              Смотреть цены <ArrowIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
