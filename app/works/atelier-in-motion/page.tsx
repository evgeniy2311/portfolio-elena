import type { Metadata } from "next";
import Image from "next/image";
import { MotionObserver } from "@/components/atelier/motion-observer";
import { SourceScenarioToggle } from "@/components/atelier/source-scenario-toggle";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { darkCoatStory } from "@/lib/atelier-stories";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Пальто: свет и среда",
  description: "Флагманская история локального scroll-эксперимента Atelier in Motion.",
};

const decisions = [
  ["01", "Силуэт", "В первом кадре пальто показано почти целиком. Длина, линия плеч и пояс задают опорную форму."],
  ["02", "Ракурс", "Вид со спины добавляет конструктивную точку зрения и не повторяет фронтальный кадр."],
  ["03", "Среда", "Тёплое дерево и направленный свет создают hotel-сцену без тяжёлых декоративных эффектов."],
  ["04", "Финал", "Полный вертикальный образ собирает серию в журнальный лист и возвращает внимание к вещи."],
];

export default function AtelierCasePage() {
  return (
    <div className={styles.page}>
      <MotionObserver />
      <SiteHeader contactHref="#contact" />
      <main id="main" tabIndex={-1}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p>Флагманская история · локальный прототип</p>
            <h1>Пальто: <em>свет и среда</em></h1>
            <p>От спокойного исходного материала к тёмной hotel-сцене. Без коммерческих метрик и без заявления строгого before/after.</p>
            <a href="#story">Смотреть ход истории <span aria-hidden="true">↓</span></a>
          </div>
          <div className={styles.heroImages}>
            <figure>
              <div><Image src={darkCoatStory[0].src} alt={darkCoatStory[0].alt} fill sizes="(max-width: 767px) 56vw, 28vw" /></div>
              <figcaption>Исходный материал</figcaption>
            </figure>
            <figure>
              <div><Image src={darkCoatStory[3].src} alt={darkCoatStory[3].alt} fill sizes="(max-width: 767px) 62vw, 34vw" preload /></div>
              <figcaption>Финальный образ</figcaption>
            </figure>
          </div>
        </section>

        <section className={styles.context} id="story" data-atelier-reveal>
          <div className={styles.shell}>
            <p className={styles.eyebrow}>Контекст</p>
            <div className={styles.contextGrid}>
              <h2>Товар остаётся центром, даже когда вокруг него появляется сцена.</h2>
              <div>
                <p>История построена на четырёх вертикальных кадрах. Сначала читается сам предмет, затем ракурс, свет, среда и финальный образ.</p>
                <dl>
                  <div><dt>Категория</dt><dd>Верхняя одежда</dd></div>
                  <div><dt>Формат</dt><dd>Визуальный сценарий</dd></div>
                  <div><dt>Статус</dt><dd>Локальный прототип</dd></div>
                  <div><dt>Права</dt><dd>Уточняются</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.contactSheet} data-atelier-reveal>
          <div className={styles.shell}>
            <div className={styles.sheetHead}>
              <p className={styles.eyebrow}>Четыре точки истории</p>
              <h2>Материал. Ракурс. Свет. Финал.</h2>
            </div>
            <div className={styles.sheetGrid}>
              {darkCoatStory.map((item, index) => (
                <figure key={item.id}>
                  <div><Image src={item.src} alt={item.alt} fill sizes="(max-width: 767px) 46vw, 24vw" /></div>
                  <figcaption><span>0{index + 1}</span>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.decisions} data-atelier-reveal>
          <div className={styles.shell}>
            <div className={styles.decisionHead}>
              <p className={styles.eyebrow}>Режиссура серии</p>
              <h2>Каждый кадр получает одну ясную роль.</h2>
            </div>
            <ol>
              {decisions.map(([number, title, text]) => (
                <li key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.compare} data-atelier-reveal>
          <div className={styles.shell}>
            <div>
              <p className={styles.eyebrow}>Интерактивная проверка</p>
              <h2>Сравнить не результат, а выбранное направление.</h2>
              <p>Модель и композиция различаются. Поэтому интерфейс честно называет кадры исходным материалом и визуальным сценарием.</p>
            </div>
            <SourceScenarioToggle source={darkCoatStory[0]} scenario={darkCoatStory[2]} />
          </div>
        </section>

        <section className={styles.limitations} data-atelier-reveal>
          <div className={styles.shell}>
            <p className={styles.eyebrow}>Границы прототипа</p>
            <h2>Красивый кадр не заменяет проверку фактов.</h2>
            <ul>
              <li>Площадка, артикул и клиент не заявляются.</li>
              <li>Продажи, CTR и конверсия не заявляются.</li>
              <li>Публикационные разрешения на фотографии пока не подтверждены.</li>
              <li>Строгое before/after не используется.</li>
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
