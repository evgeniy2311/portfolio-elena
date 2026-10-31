import type { Metadata } from "next";
import { Hero } from "@/components/blocks/hero/hero";
import { Categories } from "@/components/blocks/categories/categories";
import { About } from "@/components/blocks/about/about";
import { Pains } from "@/components/blocks/pains/pains";
import { Services } from "@/components/blocks/services/services";
import { Transform } from "@/components/blocks/transform/transform";
import { Requests } from "@/components/blocks/requests/requests";
import { Accuracy } from "@/components/blocks/accuracy/accuracy";
import { Trial } from "@/components/blocks/trial/trial";
import { ScrollFx } from "@/components/scroll-fx";
import type { Vars } from "@/components/ui/css-vars";
import { ContactBlock, SiteFooter, SiteHeader, TrialLink } from "@/components/site-shell";
import { formatPrice, packages } from "@/lib/site";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: { absolute: "Елена Бадьина: визуал для карточек одежды на WB и Ozon" },
  description:
    "Делаю кадры для карточек одежды и обуви на Wildberries и Ozon без фотостудии: модель, город, интерьер, новый цвет. Сверяю каждую деталь с исходником. Два первых кадра бесплатно.",
  openGraph: {
    title: "Елена Бадьина: визуал для карточек одежды",
    description: "Фото для карточек одежды и обуви на WB и Ozon без фотосессии. Два первых кадра бесплатно.",
    type: "website",
    locale: "ru_RU",
  },
};

const steps = [
  { title: "Вы присылаете фото вещи", text: "2–3 фото: спереди, сзади и крупно детали. Пишете, для какой площадки и для кого вещь." },
  { title: "Два кадра бесплатно", text: "Делаю пробные кадры на вашей вещи. Вы видите качество до оплаты." },
  { title: "Договариваемся о серии", text: "Выбираем стиль, сцены и количество кадров." },
  { title: "Собираю и сверяю", text: "Делаю серию и проверяю каждый кадр с оригиналом: крой, детали, цвет." },
  { title: "Отдаю готовые файлы", text: "Кадры в формате 3:4, он подходит и для Wildberries, и для Ozon." },
];

const faq = [
  {
    q: "Это нейросеть?",
    a: "Да, кадры я создаю с помощью нейросетей. Потом вручную проверяю каждый и правлю, пока вещь не совпадёт с оригиналом. Без студии, модели и стилиста.",
  },
  {
    q: "А вдруг вещь получится не такой?",
    a: "Именно поэтому мы начинаем с двух бесплатных кадров. Вы видите результат на своей вещи до того, как платите.",
  },
  {
    q: "Что от меня нужно?",
    a: "Фото вещи спереди, сзади и крупно детали: застёжку, карманы, ткань. Чем чётче исходник, тем точнее результат. И пара слов о покупательнице: возраст и стиль.",
  },
  {
    q: "Можно поменять модель, цвет или фон?",
    a: "Да. Модель под вашу аудиторию, новый цвет вещи, город, интерьер или студия. Примеры есть выше и в разделе «Работы».",
  },
  {
    q: "Подойдёт для Ozon и других площадок?",
    a: "Да. Отдаю кадры в формате 3:4, его принимают и Wildberries, и Ozon.",
  },
  {
    q: "Какие товары вы делаете?",
    a: "Одежду и обувь. Косметику и бытовые товары не беру: хочу делать хорошо то, в чём разбираюсь.",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <ScrollFx />
      <SiteHeader current="home" />

      <main id="main" tabIndex={-1}>
        <Hero />

        <Categories />

        <About />

        <Pains />

        <Services />

        <Transform />

        <Requests />

        <Accuracy />

        <Trial />

        {/* 10. Как это работает */}
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

        {/* 11. Цены */}
        <section className={styles.prices} id="prices" aria-labelledby="prices-title">
          <div className="shell">
            <div className={styles.sectionHead} data-reveal>
              <p className="eyebrow">Цены</p>
              <h2 id="prices-title">
                Платите за кадры, <em>а не за студию</em>
              </h2>
              <p>Без аренды студии, гонорара модели и стилиста. Точную цену назову, когда увижу вещь и задачу.</p>
            </div>
            <ul className={styles.priceGrid}>
              {packages.map((item, index) => (
                <li key={item.name} className={item.featured ? styles.priceFeatured : undefined} data-reveal style={{ "--d": `${index * 70}ms` } as Vars}>
                  {item.featured ? <p className={styles.priceBadge}>Чаще всего берут</p> : null}
                  <h3>{item.name}</h3>
                  <p>{item.includes}</p>
                  {item.priceFrom !== null ? <p className={styles.priceValue}>{formatPrice(item.priceFrom)}</p> : null}
                </li>
              ))}
            </ul>
            <div className={styles.priceCta} data-reveal>
              <p>Начните с двух бесплатных кадров, а цену серии обсудим после.</p>
              <TrialLink />
            </div>
          </div>
        </section>

        {/* 12. Вопросы */}
        <section className={styles.faq} id="faq" aria-labelledby="faq-title">
          <div className={`shell ${styles.faqGrid}`}>
            <div className={styles.sectionHead} data-reveal>
              <p className="eyebrow">Вопросы</p>
              <h2 id="faq-title">
                Часто задаваемые <em>вопросы</em>
              </h2>
            </div>
            <div className={styles.faqList}>
              {faq.map((item) => (
                <details key={item.q} data-reveal>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <ContactBlock />
      </main>

      <SiteFooter />
      <div className="mobile-cta">
        <TrialLink className="button" />
      </div>
    </div>
  );
}
