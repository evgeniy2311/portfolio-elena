import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { TrialLink } from "@/components/site-shell";
import type { Vars } from "@/components/ui/css-vars";
import { about } from "@/lib/site";
import styles from "./about.module.css";
import { aboutPoints } from "./data";

/** 3. Обо мне. Пока нет фото Елены, вместо него монограмма. */
export function About() {
  return (
    <section className={styles.about} id="about" aria-labelledby="about-title">
      <div className={`shell ${styles.aboutGrid}`}>
        <figure className={`${styles.aboutPhoto} ${about.photo ? "" : styles.aboutPhotoEmpty}`} data-reveal>
          {about.photo ? (
            <Image src={about.photo.src} width={about.photo.width} height={about.photo.height} alt="Елена Бадьина" sizes="(max-width: 899px) 80vw, 34vw" />
          ) : (
            <span className={styles.aboutMonogram} aria-hidden="true">
              ЕБ
            </span>
          )}
        </figure>
        <div className={styles.aboutText}>
          <p className="eyebrow" data-reveal>
            Обо мне
          </p>
          <h2 id="about-title" data-reveal>
            Я Елена. <em>Делаю визуал для карточек</em> одежды и обуви.
          </h2>
          <p className={styles.aboutLead} data-reveal>
            Помогаю продавцам на Wildberries и Ozon показать вещь так, чтобы её захотели купить: на модели, в городе, в интерьере. Без студии и без подмены товара.
            {about.experience ? ` ${about.experience}` : ""}
          </p>
          <ul className={styles.aboutPoints}>
            {aboutPoints.map((point, index) => (
              <li key={point.title} data-reveal style={{ "--d": `${index * 80}ms` } as Vars}>
                <h3>{point.title}</h3>
                <p>{point.text}</p>
              </li>
            ))}
          </ul>
          <div className={styles.aboutActions} data-reveal>
            <TrialLink />
            <Link className="text-link" href="#contact">
              Мои контакты <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
