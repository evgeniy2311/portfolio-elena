import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { services } from "./data";
import { ServiceStage } from "./service-stage";
import styles from "./services.module.css";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * 5. Что вы получаете. Механика «Atelier Slideshow»: от 1024 × 600 сцена «липнет», услуги сменяют
 * друг друга по прокрутке, у каждой смены свой переход фото, в текстовом слоте всегда не больше
 * одной услуги (service-stage.tsx). Ниже — список, каждый кадр раскрывается своим переходом при
 * появлении. Без JS и при reduced motion — статичный список.
 */
export function Services() {
  const total = services.length;
  return (
    <section
      className={styles.services}
      id="services"
      data-ground="canvas"
      data-pin
      data-segments={total}
      aria-labelledby="services-title"
      style={{ "--n": total } as Vars}
    >
      <ServiceStage sectionId="services" />
      <div className={styles.stage} data-stage>
        <div className={`shell ${styles.inner}`}>
          <div className={styles.head}>
            <div>
              <p className="eyebrow">Услуги</p>
              <h2 id="services-title">
                Что можно <em>заказать</em>
              </h2>
            </div>
            <div className={styles.headSide}>
              <p className={`num ${styles.counter}`} data-service-counter="" data-value="1" aria-hidden="true">
                <span className={styles.odometer}>
                  <span className={styles.odometerColumn}>
                    {services.map((service, index) => (
                      <span key={service.title}>{pad(index + 1)}</span>
                    ))}
                  </span>
                </span>
                <span> / {pad(total)}</span>
              </p>
              <Link className="text-link" href="/works">
                Смотреть работы <ArrowIcon />
              </Link>
            </div>
          </div>
          <ol className={styles.slides}>
            {services.map((service, index) => {
              const next = services[index + 1];
              return (
                <li
                  key={service.title}
                  className={styles.slide}
                  data-slide=""
                  data-segment=""
                  data-out={next?.transition ?? "none"}
                  data-reveal={service.transition === "none" ? undefined : "service"}
                  data-reveal-threshold="0.2"
                  style={{ "--i": index } as Vars}
                >
                  <span className={styles.tint} data-tint={service.tint} aria-hidden="true" />
                  <div className={styles.text} data-text-slot="">
                    <div className={styles.mask}>
                      <span className={`num ${styles.number} ${styles.lift}`} data-service-number="">
                        {pad(index + 1)} / {pad(total)}
                      </span>
                    </div>
                    <div className={styles.mask}>
                      <h3 className={`h3-lg ${styles.lift}`}>{service.href ? <a href={service.href}>{service.title}</a> : service.title}</h3>
                    </div>
                    <div className={styles.mask}>
                      <p className={styles.lift}>{service.text}</p>
                    </div>
                  </div>
                  <figure className={styles.figure} data-transition={service.transition}>
                    <Photo image={service.image} alt={service.alt} sizes="(max-width: 1023px) 92vw, 40vw" />
                  </figure>
                  {next ? (
                    <div className={styles.preview} aria-hidden="true">
                      <Photo image={next.image} alt="" sizes="200px" />
                      <span className="small">Дальше: {next.title}</span>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
