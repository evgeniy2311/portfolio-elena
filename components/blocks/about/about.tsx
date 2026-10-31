import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { ContactLink } from "@/components/ui/contact-link";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { about } from "@/lib/site";
import styles from "./about.module.css";
import { aboutCollage, aboutCopy, aboutPoints } from "./data";
import { SlotWord } from "./slot-word";

/** 3. Обо мне: «Portrait Unveil» для изображения и строк заголовка, «Slot Word» в лиде (блок 13). */
export function About() {
  return (
    <section className={styles.about} id="about" data-ground="paper" aria-labelledby="about-title">
      <div className={`shell ${styles.grid}`}>
        {/* Наблюдатель появления смотрит на обёртку: у самой фигуры clip-path, и её видимая доля до раскрытия нулевая. */}
        <div className={styles.unveil} data-reveal="unveil">
        {about.photo ? (
          <figure className={styles.portrait}>
            <Image src={about.photo.src} width={about.photo.width} height={about.photo.height} alt="Елена Бадьина" sizes="(max-width: 1023px) 90vw, 36vw" />
          </figure>
        ) : (
          // TEMP: коллаж из моих кадров вместо портрета, пока нет фото Елены.
          <figure className={`${styles.portrait} ${styles.collage}`} role="img" aria-label="Кадры из моих работ" data-collage>
            {aboutCollage.map((print) => (
              <span className={styles.print} key={print.image.src} style={{ "--r": `${print.rotate}deg` } as Vars}>
                <Photo image={print.image} alt="" sizes="(max-width: 1023px) 50vw, 20vw" />
              </span>
            ))}
          </figure>
        )}
        </div>

        <div className={styles.text}>
          <p className="eyebrow">{aboutCopy.eyebrow}</p>
          <h2 id="about-title" className={styles.title} data-reveal="lines">
            <span className={styles.line} style={{ "--i": 0 } as Vars}>
              <span>Я&nbsp;Елена.</span>
            </span>{" "}
            <span className={styles.line} style={{ "--i": 1 } as Vars}>
              <span>
                <em>Делаю визуал для карточек</em>
              </span>
            </span>{" "}
            <span className={styles.line} style={{ "--i": 2 } as Vars}>
              <span>одежды и&nbsp;обуви</span>
            </span>
          </h2>
          <div className={styles.body} data-reveal="body">
            <SlotWord full={aboutCopy.full} before={aboutCopy.slotBefore} words={aboutCopy.slotWords} />
            {about.experience ? <p className={styles.experience}>{about.experience}</p> : null}
            <ul className={styles.points}>
              {aboutPoints.map((point) => (
                <li key={point.title}>
                  <h3>{point.title}</h3>
                  <p>{point.text}</p>
                </li>
              ))}
            </ul>
            <div className={styles.actions}>
              <ContactLink intent="season" className="button button-ghost">
                {aboutCopy.season}
              </ContactLink>
              <Link className="text-link" href="/works">
                {aboutCopy.works} <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
