import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { services } from "./data";
import styles from "./services.module.css";

/** 5. Что вы получаете: на компьютере услуги сменяют друг друга при прокрутке. */
export function Services() {
  return (
    <section className={styles.services} id="services" data-pin aria-labelledby="services-title" style={{ "--n": services.length } as Vars}>
      <div className={styles.servicesStage}>
        <div className={`shell ${styles.servicesInner}`}>
          <div className={styles.servicesHead}>
            <p className="eyebrow">Услуги</p>
            <h2 id="services-title">
              Что вы <em>получаете</em>
            </h2>
          </div>
          <ol className={styles.serviceList}>
            {services.map((service, index) => (
              <li key={service.title} style={{ "--i": index } as Vars}>
                <div className={styles.serviceText}>
                  <span className={styles.serviceNumber}>
                    {String(index + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                  </span>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
                <figure className={styles.serviceImage}>
                  <Photo image={service.image} alt={service.alt} sizes="(max-width: 1023px) 92vw, 44vw" />
                </figure>
              </li>
            ))}
          </ol>
          <ol className={styles.serviceDots} aria-hidden="true">
            {services.map((service, index) => (
              <li key={service.title} style={{ "--i": index } as Vars} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
