import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { Hero } from "@/components/blocks/hero/hero";
import { Categories } from "@/components/blocks/categories/categories";
import { About } from "@/components/blocks/about/about";
import { Pains } from "@/components/blocks/pains/pains";
import { Services } from "@/components/blocks/services/services";
import { Transform } from "@/components/blocks/transform/transform";
import { ScrollFx } from "@/components/scroll-fx";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { ContactBlock, SiteFooter, SiteHeader, TrialLink } from "@/components/site-shell";
import { formatPrice, packages } from "@/lib/site";
import { frame, getWork, source } from "@/lib/works";
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

const accuracySource = source("burgundy-coat-city", 0);

const requests: Array<{ slug: string; label: string; quote: string; verbatim: boolean; note: string; frames: number[]; square?: boolean }> = [
  {
    slug: "burgundy-coat-city",
    label: "Запрос заказчика",
    quote: "Пальто 42 размера. Сделать 48–50 размер на худой девушке, оверсайз стиль.",
    verbatim: true,
    note: "Модель и посадку меняю, крой, пуговицы, пояс и длина остаются как на исходнике.",
    frames: [0, 9, 13],
  },
  {
    slug: "burgundy-coat-interior",
    label: "Запрос заказчика",
    quote: "То же пальто, но в интерьерной студии, в минималистичном стиле.",
    verbatim: true,
    note: "Вторая серия для той же вещи: другой свет, другая сцена, тот же товар.",
    frames: [0, 4, 9],
  },
  {
    slug: "longsleeve-colors",
    label: "Запрос заказчика",
    quote: "Лонгслив в четырёх цветах. И сделать чёрный, которого нет на фото.",
    verbatim: true,
    note: "Одна модель, четыре цвета. Карточки разных цветов выглядят как одна коллекция.",
    frames: [0, 1, 5, 3],
    square: true,
  },
  {
    slug: "brown-coat-three-looks",
    label: "Задача",
    quote: "Одно пальто, три разных образа.",
    verbatim: false,
    note: "С джинсами и рубашкой, с белым жилетом, с кожаной юбкой. Каждая покупательница видит себя.",
    frames: [0, 7, 10],
  },
  {
    slug: "reversible-sheepskin",
    label: "Задача",
    quote: "Дублёнка двусторонняя. Покупатель должен понять, что это две вещи в одной.",
    verbatim: false,
    note: "В одной серии вещь показана мехом наружу и кожей наружу.",
    frames: [0, 3, 6],
  },
];

const checks = [
  { title: "Застёжка и пуговицы", text: "Два ряда пуговиц, их число и расстояние между ними.", image: frame("burgundy-coat-city", 2) },
  { title: "Пояс и шлёвки", text: "Ширина пояса, как он завязан, где проходят шлёвки.", image: frame("burgundy-coat-city", 3) },
  { title: "Карман и рукав", text: "Форма кармана, длина рукава, манжета.", image: frame("burgundy-coat-city", 4) },
  { title: "Длина и силуэт", text: "Где заканчивается пальто, как сидит в плечах.", image: frame("burgundy-coat-city", 0) },
];

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

        {/* 7. Задачи клиентов: карточки складываются стопкой */}
        <section className={styles.requests} aria-labelledby="requests-title">
          <div className="shell">
            <div className={styles.sectionHead} data-reveal>
              <p className="eyebrow">Задачи, с которыми приходят</p>
              <h2 id="requests-title">
                Не просто «сделайте красиво», <em>а конкретная задача</em>
              </h2>
            </div>
            <ol className={styles.requestStack}>
              {requests.map((request, index) => {
                const work = getWork(request.slug);
                if (!work) return null;
                return (
                  <li className={styles.requestCard} key={request.slug} style={{ "--i": index } as Vars}>
                    <div className={styles.requestText}>
                      <p className={styles.requestLabel}>{request.label}</p>
                      <blockquote>{request.verbatim ? `«${request.quote}»` : request.quote}</blockquote>
                      <p>{request.note}</p>
                      <Link className="text-link" href={`/works/${work.slug}`}>
                        {work.title} <ArrowIcon />
                      </Link>
                    </div>
                    <div className={`${styles.requestFrames} ${request.square ? styles.requestFramesSquare : ""}`}>
                      {request.frames.map((frameIndex) => {
                        const image = work.frames[frameIndex];
                        return image ? (
                          <Photo key={image.src} image={image} alt={`${work.title}: кадр ${frameIndex + 1}`} sizes="(max-width: 767px) 30vw, 16vw" />
                        ) : null;
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* 8. Точность: исходник неподвижен, детали сменяют друг друга */}
        <section className={styles.accuracy} data-pin aria-labelledby="accuracy-title">
          <div className={styles.accuracyStage}>
            <div className={`shell ${styles.accuracyGrid}`}>
              <div className={styles.accuracyCopy}>
                <p className="eyebrow eyebrow-light">Главное отличие</p>
                <h2 id="accuracy-title">
                  Вещь в кадре та же, <em>что приедет покупательнице</em>
                </h2>
                <p>Нейросеть любит «улучшать» одежду: добавить пуговицу, укоротить рукав. Я сверяю каждый кадр с оригиналом по списку и переделываю, если что-то уехало.</p>
                <ol className={styles.checkList}>
                  {checks.map((check, index) => (
                    <li key={check.title} style={{ "--i": index } as Vars}>
                      <span>{index + 1}</span>
                      <div>
                        <h3>{check.title}</h3>
                        <p>{check.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={styles.accuracyCompare}>
                <figure className={styles.accuracySource}>
                  <Photo image={accuracySource} alt="Исходник пальто: студийное фото спереди" sizes="(max-width: 1023px) 45vw, 20vw" />
                  <figcaption>Исходник</figcaption>
                </figure>
                <div className={styles.accuracyDetails}>
                  {checks.map((check, index) => (
                    <figure key={check.title} style={{ "--i": index } as Vars}>
                      <Photo image={check.image} alt={`Готовый кадр: ${check.title.toLowerCase()}`} sizes="(max-width: 1023px) 45vw, 24vw" />
                      <figcaption>Кадр: {check.title.toLowerCase()}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Бесплатная проба */}
        <section className={styles.trial} id="trial" aria-labelledby="trial-title">
          <div className={`shell ${styles.trialGrid}`} data-reveal>
            <p className="eyebrow eyebrow-light">Попробуйте без риска</p>
            <h2 id="trial-title">
              Два кадра бесплатно. <em>На вашей вещи.</em>
            </h2>
            <p className={styles.trialLead}>Пришлите 2–3 фото вещи. Я сделаю 1–2 кадра, и вы увидите результат до оплаты. Не понравится, вы ничего не должны.</p>
            <TrialLink className="button button-light" />
          </div>
        </section>

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
