import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { Photo } from "@/components/ui/photo";
import { works } from "@/lib/works";
import { railWorks } from "./data";
import styles from "./transform.module.css";

/** 6. До и после: горизонтальная лента, которую двигает вертикальная прокрутка. */
export function Transform() {
  const frameCount = works.reduce((sum, work) => sum + work.frames.length, 0);
  return (
    <section className={styles.rail} id="transform" data-pin data-rail aria-labelledby="rail-title">
      <div className={styles.railStage}>
        <div className={styles.railTrack} data-rail-track>
          <div className={styles.railIntro}>
            <p className="eyebrow">До и после</p>
            <h2 id="rail-title">
              Что вы присылаете. <em>Что получаете.</em>
            </h2>
            <p className={styles.railIntroText}>Слева фото от заказчика и его задача, справа готовые кадры.</p>
            <span className={styles.railArrow} aria-hidden="true">
              <ArrowIcon />
            </span>
          </div>
          {railWorks.map((work, index) => (
            <article className={styles.railPanel} key={work.slug} aria-labelledby={`rail-${work.slug}`}>
              <div className={styles.railMeta}>
                <span className={styles.railNumber}>
                  {String(index + 1).padStart(2, "0")} / {String(railWorks.length).padStart(2, "0")}
                </span>
                <h3 id={`rail-${work.slug}`}>{work.title}</h3>
                <p className={styles.railLabel}>Прислали</p>
                <div className={styles.railSources}>
                  {work.source.slice(0, 3).map((image, sourceIndex) => (
                    <Photo key={image.src} image={image} alt={`${work.title}: исходное фото ${sourceIndex + 1}`} sizes="(max-width: 1023px) 28vw, 8vw" />
                  ))}
                </div>
                <p className={styles.railLabel}>Задача</p>
                <p className={styles.railBrief}>{work.request ? `«${work.request}»` : work.brief}</p>
                <Link className="text-link" href={`/works/${work.slug}`}>
                  Все {work.frames.length} кадров <ArrowIcon />
                </Link>
              </div>
              <div className={styles.railFrames}>
                {work.frames.slice(0, 3).map((image, frameIndex) => (
                  <Photo key={image.src} image={image} alt={`${work.title}: кадр ${frameIndex + 1} из готовой воронки`} sizes="(max-width: 1023px) 45vw, 18vw" />
                ))}
              </div>
            </article>
          ))}
          <div className={styles.railOutro}>
            <p className={styles.railOutroNumber}>{works.length}</p>
            <p>вещей и {frameCount} кадров в портфолио: пальто, дублёнки, ветровки, трикотаж.</p>
            <Link className="button" href="/works">
              Все работы <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
