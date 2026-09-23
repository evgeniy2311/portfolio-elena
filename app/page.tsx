import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { MotionObserver } from "@/components/atelier/motion-observer";
import { PhotoStoryMotion } from "@/components/atelier/photo-story-motion";
import { ScrollStory } from "@/components/atelier/scroll-story";
import { SourceScenarioToggle } from "@/components/atelier/source-scenario-toggle";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { atelierStories, colorCoatStory, comparisonImages, darkCoatStory, windbreakerStory } from "@/lib/atelier-stories";
import styles from "./atelier.module.css";

export const metadata: Metadata = {
  title: "Atelier in Motion",
  description: "Экспериментальная scroll-версия портфолио Елены Бадьиной: нейровизуал и системы карточек для одежды.",
  openGraph: {
    title: "Elena Badyina: Atelier in Motion",
    description: "Товар остаётся собой. Визуал становится сценой.",
    type: "website",
    locale: "ru_RU",
  },
};

const method = [
  ["01", "Собрать материал", "Увидеть конструкцию, фактуру и ограничения исходников."],
  ["02", "Определить главный аргумент", "Решить, что покупатель должен заметить первым."],
  ["03", "Построить сцену", "Выбрать свет, среду, образ и ритм серии."],
  ["04", "Сверить детали", "Проверить читаемые элементы товара по исходным материалам."],
  ["05", "Собрать последовательность", "Связать кадры в понятную товарную историю."],
];

export default function Home() {
  return (
    <div className={styles.page}>
      <MotionObserver />
      <SiteHeader current="home" sticky />

      <main id="main" tabIndex={-1}>
        <ScrollStory images={darkCoatStory} />

        <section className={`${styles.section} ${styles.selected}`} id="selected" data-atelier-reveal>
          <div className={styles.shell}>
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.eyebrow}>Избранные истории</p>
                <h2>Одна вещь. <em>Несколько способов</em> рассказать о ней.</h2>
              </div>
              <p>Три серии показывают, как исходный материал превращается в последовательный визуальный сценарий. Без заявлений о продажах и без подмены исходника строгим before/after.</p>
            </div>
            <div className={styles.storyIndex}>
              {atelierStories.map((story, index) => (
                <a href={`#${story.id}`} className={styles.indexCard} key={story.id}>
                  <div className={styles.indexImage}>
                    <Image
                      src={story.images[index === 0 ? 3 : 1].src}
                      alt=""
                      fill
                      sizes="(max-width: 767px) 92vw, 30vw"
                    />
                  </div>
                  <span>{story.number}</span>
                  <h3>{story.eyebrow}</h3>
                  <span className={styles.sectionMarker} aria-hidden="true">↓</span>
                  <small>К фотоистории на этой странице</small>
                </a>
              ))}
            </div>
            <Link className={styles.archiveLink} href="/works">
              Открыть архив полноценных кейсов <ArrowIcon />
            </Link>
          </div>
        </section>

        <PhotoStoryMotion
          id="dark-coat"
          className={`${styles.section} ${styles.darkStory}`}
          frameCount={darkCoatStory.length}
          captions={darkCoatStory.map((item) => item.caption)}
          progressProperty="--dark-progress"
          controlsClassName={`${styles.shell} ${styles.storyControls}`}
          readoutClassName={`${styles.shell} ${styles.storyReadout} ${styles.storyReadoutLight}`}
          legacyKind="dark"
        >
          <div className={`${styles.shell} ${styles.darkGrid}`} data-motion-stage data-dark-stage>
            <div className={styles.storyCopy}>
              <p className={`${styles.eyebrow} ${styles.light}`}>01 · От исходника к fashion-сцене</p>
              <h2>От нейтрального кадра к <em>сцене с характером.</em></h2>
              <p>Сначала читаются силуэт, длина и пояс. Затем появляется среда: тёплое дерево, направленный свет, более собранная стилизация. Модель и композиция меняются, поэтому это визуальный сценарий, а не прямое сравнение до и после.</p>
              <Link className={`${styles.button} ${styles.buttonLight}`} href="/works/atelier-in-motion">
                Открыть полный кейс о пальто <ArrowIcon />
              </Link>
            </div>
            <div className={styles.darkCollage} data-photo-strip tabIndex={0} aria-label="Серия визуальных сценариев тёмного пальто">
              {darkCoatStory.map((item, index) => (
                <figure key={item.id} data-photo={index + 1} data-photo-frame>
                  <div><Image src={item.src} alt={item.alt} fill sizes="(max-width: 1023px) 72vw, 22vw" /></div>
                  <figcaption><span>0{index + 1}</span>{item.caption}</figcaption>
                </figure>
              ))}
              <span className={styles.collageLine} aria-hidden="true" />
            </div>
          </div>
        </PhotoStoryMotion>

        <PhotoStoryMotion
          id="windbreaker"
          className={`${styles.section} ${styles.windStory}`}
          frameCount={windbreakerStory.length}
          captions={windbreakerStory.map((item) => item.caption)}
          progressProperty="--wind-progress"
          controlsClassName={`${styles.shell} ${styles.storyControls}`}
          readoutClassName={`${styles.shell} ${styles.storyReadout}`}
        >
          <div className={styles.shell} data-motion-stage>
            <div className={styles.windHeading}>
              <p className={styles.sceneNumber}>02</p>
              <div>
                <p className={styles.eyebrow}>Один товар, несколько сценариев</p>
                <h2>Конструкция остаётся узнаваемой. <em>Контекст меняет настроение.</em></h2>
              </div>
              <p>Светлая ветровка проходит через нейтральный кадр, городской фронт, бронзовую стену и полный образ. Капюшон, контрастные молнии и длина остаются точками сверки.</p>
            </div>
            <div className={styles.windFrames} data-photo-strip tabIndex={0} aria-label="Серия городских сценариев светлой ветровки">
              {windbreakerStory.map((item, index) => (
                <figure key={item.id} data-photo-frame>
                  <div><Image src={item.src} alt={item.alt} fill sizes="(max-width: 1023px) 72vw, 18vw" /></div>
                  <figcaption><span>0{index + 1}</span>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </PhotoStoryMotion>

        <PhotoStoryMotion
          id="color-coat"
          className={`${styles.section} ${styles.colorStory}`}
          frameCount={colorCoatStory.length}
          captions={colorCoatStory.map((item) => item.caption)}
          progressProperty="--color-progress"
          controlsClassName={`${styles.shell} ${styles.storyControls} ${styles.storyControlsLight}`}
          readoutClassName={`${styles.shell} ${styles.storyReadout} ${styles.storyReadoutLight}`}
        >
          <div className={`${styles.shell} ${styles.colorGrid}`} data-motion-stage>
            <div className={styles.colorCopy}>
              <p className={`${styles.eyebrow} ${styles.light}`}>03 · Цвет как система</p>
              <h2>Цвет задаёт новую главу, <em>а не случайный фильтр.</em></h2>
              <p>Чёрное пальто становится коричневым и получает несколько городских направлений. Здесь важны повторяемость оттенка, читаемые лацканы, пояс и длина.</p>
            </div>
            <div className={styles.colorFrames} data-photo-strip tabIndex={0} aria-label="Серия цветовых сценариев пальто">
              {colorCoatStory.map((item, index) => (
                <figure key={item.id} data-color-frame={index + 1} data-photo-frame>
                  <div><Image src={item.src} alt={item.alt} fill sizes="(max-width: 1023px) 72vw, 20vw" /></div>
                  <figcaption>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </PhotoStoryMotion>

        <section className={`${styles.section} ${styles.compareSection}`} id="compare" data-atelier-reveal>
          <div className={`${styles.shell} ${styles.compareGrid}`}>
            <div>
              <p className={styles.eyebrow}>Посмотреть ближе</p>
              <h2>Исходный материал. <em>Визуальный сценарий.</em></h2>
              <p>Это не строгий before/after. Переключатель показывает, как меняются модель, композиция, свет и среда, пока товар остаётся центром истории.</p>
            </div>
            <SourceScenarioToggle source={comparisonImages.source} scenario={comparisonImages.scenario} />
          </div>
        </section>

        <section className={`${styles.section} ${styles.approach}`} id="approach" data-atelier-reveal>
          <div className={`${styles.shell} ${styles.approachGrid}`}>
            <div className={styles.approachTitle}>
              <p className={`${styles.eyebrow} ${styles.light}`}>Подход Елены</p>
              <h2>Пять точек <em>точной сборки.</em></h2>
            </div>
            <ol>
              {method.map(([number, title, text]) => (
                <li key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={`${styles.section} ${styles.accuracy}`} data-atelier-reveal>
          <div className={`${styles.shell} ${styles.accuracyGrid}`}>
            <div>
              <p className={styles.eyebrow}>Точность товара</p>
              <h2>Точность начинается с <em>хорошего исходного материала.</em></h2>
              <p>В локальном прототипе показан принцип сверки. Публичные обещания точности появятся только вместе с подтверждённым процессом и разрешёнными материалами.</p>
            </div>
            <ul aria-label="Что можно сверять по исходным материалам">
              <li><span>01</span>Силуэт и длина</li>
              <li><span>02</span>Пояс и лацканы</li>
              <li><span>03</span>Капюшон и молнии</li>
              <li><span>04</span>Цвет и материал</li>
              <li><span>05</span>Посадка в кадре</li>
            </ul>
          </div>
        </section>

        <section className={`${styles.section} ${styles.about}`} id="about" data-atelier-reveal>
          <div className={`${styles.shell} ${styles.aboutGrid}`}>
            <p className={styles.aboutMark} aria-hidden="true">ЕБ</p>
            <div>
              <p className={styles.eyebrow}>О Елене</p>
              <h2>Елена проектирует не один кадр, <em>а логику всей серии.</em></h2>
              <p>Фокус портфолио: одежда, fashion-сценарии и карточки для Wildberries и Ozon. В этой версии главные герои страницы, сами работы.</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
