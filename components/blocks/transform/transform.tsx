import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { ContactLink } from "@/components/ui/contact-link";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { storyFor } from "@/lib/work-stories";
import { works } from "@/lib/works";
import { railPanels } from "./data";
import { RailDevelop } from "./rail-develop";
import { SplitComparison } from "./split-comparison";
import styles from "./transform.module.css";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * 6. До и после, «Darkroom Develop». От 1024 px вертикальная прокрутка двигает горизонтальную ленту
 * (движок: data-pin + data-rail); у каждой панели свой прогресс --pp: исходники въезжают слева,
 * готовые кадры «проявляются» из серого и размытого, строки истории открываются по очереди.
 * Уже 1024 px — карусель со снапом, проявление по панели (RailDevelop). После ленты, в обычном
 * потоке, вывод со счётчиком и основной кнопкой: он же разрывает цепочку «липких» сцен.
 */
export function Transform() {
  const frameCount = works.reduce((sum, work) => sum + work.frames.length, 0);
  return (
    <>
      <section className={styles.rail} id="transform" data-pin data-rail data-ground="surface" aria-labelledby="rail-title">
        <div className={styles.stage} data-stage>
          <div className={styles.track} data-rail-track>
            <div className={styles.intro}>
              <p className="eyebrow">До и после</p>
              <h2 id="rail-title">
                Что прислали <em>и&nbsp;что получилось</em>
              </h2>
              <p className="lede">Слева фото от заказчика и его задача. Справа готовые кадры.</p>
              <span className={styles.introArrow} aria-hidden="true">
                <ArrowIcon />
              </span>
            </div>
            <div className={styles.panels} data-rail-panels>
              {railPanels.map(({ work, frames, split }, index) => {
                const story = storyFor(work);
                const lines = [
                  { label: "Задача", text: story.task },
                  ...(story.did ? [{ label: "Что я сделала", text: story.did }] : []),
                  { label: "Получилось", text: story.result },
                ];
                const [lead, ...rest] = frames;
                return (
                  <article className={styles.panel} key={work.slug} data-panel aria-labelledby={`rail-${work.slug}`}>
                    <div className={styles.meta}>
                      <span className={`num ${styles.number}`}>
                        {pad(index + 1)} / {pad(railPanels.length)}
                      </span>
                      <h3 className={styles.title} id={`rail-${work.slug}`}>
                        {work.title}
                      </h3>
                      <dl className={styles.story}>
                        {lines.map((line, lineIndex) => (
                          <div className={styles.storyLine} key={line.label} style={{ "--l": lineIndex } as Vars}>
                            <dt className={styles.label}>{line.label}</dt>
                            <dd>{line.text}</dd>
                          </div>
                        ))}
                      </dl>
                      <Link className={`text-link ${styles.more}`} href={`/works/${work.slug}`}>
                        Все {work.frames.length} кадров <ArrowIcon />
                      </Link>
                    </div>
                    <div className={styles.sources}>
                      <p className={styles.label}>Прислали</p>
                      <div className={styles.sourceList}>
                        {work.source.slice(0, 3).map((image, sourceIndex) => (
                          <div className={styles.source} key={image.src} style={{ "--s": sourceIndex } as Vars}>
                            <Photo image={image} alt={`${work.title}: исходное фото ${sourceIndex + 1}`} sizes="(max-width: 1023px) 22vw, 8vw" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.results} data-result>
                      <div className={styles.lead} style={{ "--j": 0 } as Vars}>
                        {split ? (
                          <SplitComparison
                            source={work.source[split.source]}
                            result={work.frames[split.frame]}
                            sourceAlt={`${work.title}: исходное фото ${split.source + 1}`}
                            resultAlt={`${work.title}: кадр ${split.frame + 1} из готовой серии`}
                            sizes="(max-width: 1023px) 58vw, 30vw"
                          />
                        ) : (
                          <div className={styles.develop} data-develop>
                            <Photo image={work.frames[lead]} alt={`${work.title}: кадр ${lead + 1} из готовой серии`} sizes="(max-width: 1023px) 58vw, 30vw" />
                          </div>
                        )}
                      </div>
                      {rest.map((frameIndex, restIndex) => (
                        <div className={`${styles.small} ${styles.develop}`} key={frameIndex} data-develop style={{ "--j": restIndex + 1 } as Vars}>
                          <Photo image={work.frames[frameIndex]} alt={`${work.title}: кадр ${frameIndex + 1} из готовой серии`} sizes="(max-width: 1023px) 28vw, 15vw" />
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
        <RailDevelop sectionId="transform" />
      </section>
      <div className={styles.outro} data-rail-outro data-ground="canvas">
        <div className={`shell ${styles.outroInner}`}>
          <p className={styles.counter}>
            <span className={`num ${styles.counterNumber}`}>{works.length}</span> вещей и {frameCount} кадров в портфолио: пальто, дублёнки, ветровки, трикотаж.
          </p>
          <div className={styles.outroCta}>
            <p className={styles.outroText}>Пришлите свою вещь, и первые два кадра я сделаю бесплатно. Вы увидите результат до оплаты.</p>
            <ContactLink intent="trial" className="button">
              2 кадра бесплатно
            </ContactLink>
          </div>
        </div>
      </div>
    </>
  );
}
