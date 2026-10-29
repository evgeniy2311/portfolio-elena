import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { ScrollFx } from "@/components/scroll-fx";
import { ContactBlock, SiteFooter, SiteHeader, TrialLink } from "@/components/site-shell";
import { formatPrice, packages } from "@/lib/site";
import { frame, getWork, source, works, type Work, type WorkImage } from "@/lib/works";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: { absolute: "Елена Бадьина: визуал для карточек одежды на WB и Ozon" },
  description:
    "Делаю кадры для карточек одежды на Wildberries и Ozon без фотостудии: модель, город, интерьер, новый цвет. Сверяю каждую деталь с исходником. Два первых кадра бесплатно.",
  openGraph: {
    title: "Елена Бадьина: визуал для карточек одежды",
    description: "Три студийных фото. Восемнадцать кадров для карточки. Два первых кадра бесплатно.",
    type: "website",
    locale: "ru_RU",
  },
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const heroSource = source("burgundy-coat-city", 0);
const heroFrames: Array<{ image: WorkImage; alt: string }> = [
  { image: frame("burgundy-coat-city", 0), alt: "Бордовое пальто на модели у городского фасада, полный рост" },
  { image: frame("burgundy-coat-city", 2), alt: "Крупный план: двубортная застёжка пальто" },
  { image: frame("burgundy-coat-city", 9), alt: "Пальто с завязанным поясом на улице" },
  { image: frame("burgundy-coat-city", 5), alt: "Модель в пальто сидит на ступенях с белой сумкой" },
  { image: frame("burgundy-coat-city", 3), alt: "Крупный план: пояс пальто" },
  { image: frame("burgundy-coat-city", 11), alt: "Пальто в движении, модель идёт по улице" },
  { image: frame("burgundy-coat-city", 4), alt: "Крупный план: карман пальто" },
  { image: frame("burgundy-coat-city", 16), alt: "Пальто нараспашку, модель у колонны" },
];

const pains = [
  {
    title: "Фото с белого фона теряется в выдаче.",
    text: "Покупательница листает ленту из сотни похожих вещей и не останавливается на плоском кадре.",
  },
  {
    title: "Фотосессия долгая и дорогая.",
    text: "Студия, модель, стилист, неделя ожидания. И всё заново на каждый новый цвет.",
  },
  {
    title: "Нейросеть рисует похожую, но другую вещь.",
    text: "Меняет пуговицы, длину, карманы. Потом приходят возвраты с причиной «не соответствует фото».",
  },
];

const services: Array<{ title: string; text: string; image: WorkImage; alt: string }> = [
  {
    title: "Главное фото",
    text: "Обложка, на которой вещь видно с первого взгляда, даже в маленьком превью выдачи.",
    image: frame("yellow-trench", 0),
    alt: "Жёлтый тренч на модели в городе",
  },
  {
    title: "Воронка карточки",
    text: "Серия от 8 до 20 кадров: посадка, вид сзади, детали, образы. Одна вещь, одна история от обложки до последнего кадра.",
    image: frame("beige-windbreaker", 0),
    alt: "Бежевая ветровка на модели у тёмной стены",
  },
  {
    title: "Образы и сцены",
    text: "Город, интерьер, студия. Одну вещь показываю в разных стилях для разных покупательниц.",
    image: frame("brown-coat-three-looks", 7),
    alt: "Шоколадное пальто с белым жилетом в городе",
  },
  {
    title: "Новый цвет",
    text: "Та же серия в другом цвете вещи без новой съёмки. Даже если этого цвета не было на фото.",
    image: frame("longsleeve-colors", 3),
    alt: "Чёрный лонгслив на модели в студии",
  },
  {
    title: "Модель под вашу аудиторию",
    text: "Другой рост, размер и типаж. Крой вещи при этом не меняется.",
    image: frame("white-wrap-blouse", 9),
    alt: "Белая блузка на запах с чёрной юбкой",
  },
  {
    title: "Детали крупно",
    text: "Ткань, фурнитура, швы, мех. Снимаю вопросы до покупки, а не после возврата.",
    image: frame("grey-shearling", 1),
    alt: "Дублёнка с мехом и каракулем крупным планом",
  },
];

const railSlugs = ["black-coat-evening", "beige-windbreaker", "puffer-jacket", "yellow-trench", "grey-shearling", "white-wrap-blouse"] as const;
const railWorks = railSlugs.map((slug) => getWork(slug)).filter((work): work is Work => Boolean(work));

const requests: Array<{ slug: string; label: string; quote: string; note: string; frames: number[]; square?: boolean }> = [
  {
    slug: "burgundy-coat-city",
    label: "Запрос клиента",
    quote: "Пальто 42 размера. Сделать 48–50 размер на худой девушке, оверсайз стиль.",
    note: "Модель и посадку меняю, крой, пуговицы, пояс и длина остаются как на исходнике.",
    frames: [0, 9, 13],
  },
  {
    slug: "burgundy-coat-interior",
    label: "Запрос клиента",
    quote: "То же пальто, но в интерьерной студии, в минималистичном стиле.",
    note: "Вторая серия для той же вещи: другой свет, другая сцена, тот же товар.",
    frames: [0, 4, 9],
  },
  {
    slug: "longsleeve-colors",
    label: "Запрос клиента",
    quote: "Лонгслив в четырёх цветах. И сделать чёрный, которого нет на фото.",
    note: "Одна модель, четыре цвета. Карточки разных цветов выглядят как одна коллекция.",
    frames: [0, 1, 5, 3],
    square: true,
  },
  {
    slug: "brown-coat-three-looks",
    label: "Задача",
    quote: "Одно пальто показать трём разным покупательницам.",
    note: "Три образа: с джинсами и рубашкой, с белым жилетом, с кожаной юбкой.",
    frames: [0, 7, 10],
  },
  {
    slug: "reversible-sheepskin",
    label: "Задача",
    quote: "Дублёнка двусторонняя. Покупатель должен понять, что это две вещи в одной.",
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

const reasons = [
  {
    title: "Только одежда",
    text: "Другие категории не беру. Одежда сложнее всего для нейросетей, и специалистов по ней мало. Я выбрала именно её.",
  },
  {
    title: "Насмотренность",
    text: "Каждый день слежу за модой. Знаю, с какого ракурса показать вещь, какую позу выбрать и какой образ собрать на модели.",
  },
  {
    title: "Ручная сверка",
    text: "Сравниваю каждый кадр с исходником и переделываю, если что-то уехало. Вещь на всех кадрах одна и та же.",
  },
];

const steps = [
  { title: "Пишете мне", text: "Присылаете 2–3 фото вещи и рассказываете, для какой площадки и для кого она." },
  { title: "Два кадра бесплатно", text: "Делаю пробные кадры на вашей вещи. Вы видите качество до оплаты." },
  { title: "Договариваемся о серии", text: "Выбираем стиль, сцены и количество кадров." },
  { title: "Собираю и сверяю", text: "Делаю серию и проверяю каждый кадр с исходником: крой, детали, цвет." },
  { title: "Отдаю готовые файлы", text: "Кадры в формате 3:4, он подходит и для Wildberries, и для Ozon." },
];

const faq = [
  {
    q: "Это нейросеть?",
    a: "Да, кадры я создаю с помощью нейросетей. Потом вручную проверяю каждый и правлю, пока вещь не совпадёт с исходником. Без студии, модели и стилиста.",
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
    q: "Вы делаете обувь, сумки, косметику?",
    a: "Нет, только одежду. Это сложная категория, и я хочу делать её хорошо.",
  },
];

function Photo({ image, alt, sizes, className, priority = false }: { image: WorkImage; alt: string; sizes: string; className?: string; priority?: boolean }) {
  return (
    <Image
      className={className}
      src={image.src}
      width={image.width}
      height={image.height}
      alt={alt}
      sizes={sizes}
      priority={priority}
    />
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <ScrollFx />
      <SiteHeader current="home" />

      <main id="main" tabIndex={-1}>
        {/* 1. Hero: исходник уменьшается, вокруг собирается серия кадров */}
        <section className={styles.hero} data-pin aria-labelledby="hero-title">
          <div className={styles.heroStage}>
            <div className={`shell ${styles.heroGrid}`}>
              <div className={styles.heroCopy}>
                <p className="eyebrow">Елена Бадьина · карточки одежды для WB и Ozon</p>
                <h1 id="hero-title">
                  Три студийных фото. <em>Восемнадцать кадров</em> для карточки.
                </h1>
                <p className={styles.heroLead}>
                  Я Елена. Работаю только с одеждой: ставлю вашу вещь на модель, в город или в интерьер и сверяю каждую пуговицу, чтобы покупательница получила то, что видела на фото.
                </p>
                <div className={styles.heroActions}>
                  <TrialLink />
                  <Link className="button button-ghost" href="#transform">
                    Смотреть работы
                  </Link>
                </div>
                <p className={styles.heroNote}>Пробные кадры делаю на вашей вещи. Не понравится, вы ничего не должны.</p>
              </div>

              <div className={styles.collage} aria-label="Пример: исходное фото пальто и кадры готовой воронки">
                <figure className={styles.collageSource}>
                  <Photo image={heroSource} alt="Исходник: бордовое пальто на модели на светлом студийном фоне" sizes="(max-width: 1023px) 33vw, 22vw" priority />
                  <figcaption>Исходник</figcaption>
                </figure>
                {heroFrames.map((item, index) => (
                  <figure className={styles.collageFrame} key={item.image.src} style={{ "--i": index } as Vars}>
                    <Photo image={item.image} alt={item.alt} sizes="(max-width: 1023px) 33vw, 22vw" priority={index < 2} />
                  </figure>
                ))}
                <p className={styles.collageCaption}>3 исходника → 18 кадров: город, детали, посадка</p>
              </div>
            </div>
            <p className={styles.scrollHint} aria-hidden="true">Прокрутите вниз</p>
          </div>
        </section>

        {/* 2. Боль покупателя */}
        <section className={styles.pains} aria-labelledby="pains-title">
          <div className="shell">
            <p className="eyebrow eyebrow-light" data-reveal>Почему так бывает</p>
            <h2 id="pains-title" className={styles.painsTitle} data-reveal>
              Хорошая вещь, а продаётся <em>плохо.</em>
            </h2>
            <ol className={styles.painList}>
              {pains.map((pain, index) => (
                <li key={pain.title} data-reveal style={{ "--d": `${index * 90}ms` } as Vars}>
                  <span>0{index + 1}</span>
                  <h3>{pain.title}</h3>
                  <p>{pain.text}</p>
                </li>
              ))}
            </ol>
            <p className={styles.painsAnswer} data-reveal>
              Я делаю кадры, которые останавливают ленту, без фотосессии и без подмены вещи.
            </p>
          </div>
        </section>

        {/* 3. Что получает клиент */}
        <section className={styles.services} id="services" aria-labelledby="services-title">
          <div className="shell">
            <div className={styles.sectionHead} data-reveal>
              <p className="eyebrow">Услуги</p>
              <h2 id="services-title">
                Что вы <em>получаете</em>
              </h2>
              <p>Вы присылаете фото вещи. Я возвращаю готовые кадры для карточки: от одной обложки до полной воронки в нескольких цветах.</p>
            </div>
            <ul className={styles.serviceGrid}>
              {services.map((service, index) => (
                <li key={service.title} data-reveal style={{ "--d": `${(index % 3) * 80}ms` } as Vars}>
                  <div className={styles.serviceImage}>
                    <Photo image={service.image} alt={service.alt} sizes="(max-width: 767px) 92vw, (max-width: 1199px) 46vw, 30vw" />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. Исходник → карточка: горизонтальная лента, которую двигает вертикальная прокрутка */}
        <section className={styles.rail} id="transform" data-pin data-rail aria-labelledby="rail-title">
          <div className={styles.railStage}>
            <div className={styles.railTrack} data-rail-track>
              <div className={styles.railIntro}>
                <p className="eyebrow">Исходник → карточка</p>
                <h2 id="rail-title">
                  Что прислал клиент. <em>Что он получил.</em>
                </h2>
                <p className={styles.railIntroText}>Слева исходные фото, справа кадры из готовой воронки. Прокручивайте, лента едет сама.</p>
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
                    <p className={styles.railLabel}>Было</p>
                    <div className={styles.railSources}>
                      {work.source.slice(0, 3).map((image, sourceIndex) => (
                        <Photo key={image.src} image={image} alt={`${work.title}: исходное фото ${sourceIndex + 1}`} sizes="(max-width: 1023px) 28vw, 8vw" />
                      ))}
                    </div>
                    <p className={styles.railLabel}>Стало</p>
                    <p className={styles.railResult}>{work.result}</p>
                    <Link className="text-link" href={`/works/${work.slug}`}>
                      Вся воронка <ArrowIcon />
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
                <p>работ в портфолио: пальто, дублёнки, ветровки, трикотаж.</p>
                <Link className="button" href="/works">
                  Все работы <ArrowIcon />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Задачи клиентов: карточки складываются стопкой */}
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
                      <blockquote>«{request.quote}»</blockquote>
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

        {/* 6. Точность: исходник неподвижен, детали сменяют друг друга */}
        <section className={styles.accuracy} data-pin aria-labelledby="accuracy-title">
          <div className={styles.accuracyStage}>
            <div className={`shell ${styles.accuracyGrid}`}>
              <div className={styles.accuracyCopy}>
                <p className="eyebrow eyebrow-light">Главное отличие</p>
                <h2 id="accuracy-title">
                  Вещь в кадре та же, <em>что приедет покупательнице</em>
                </h2>
                <p>Нейросеть любит «улучшать» одежду: добавить пуговицу, укоротить рукав. Я сверяю каждый кадр с исходником по списку и переделываю, если что-то уехало.</p>
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
                  <Photo image={heroSource} alt="Исходник пальто: студийное фото спереди" sizes="(max-width: 1023px) 45vw, 20vw" />
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

        {/* 7. Почему я */}
        <section className={styles.reasons} aria-labelledby="reasons-title">
          <div className="shell">
            <div className={styles.sectionHead} data-reveal>
              <p className="eyebrow">Почему со мной</p>
              <h2 id="reasons-title">
                Дизайнер одежды, <em>а не генератор картинок</em>
              </h2>
            </div>
            <ul className={styles.reasonGrid}>
              {reasons.map((reason, index) => (
                <li key={reason.title} data-reveal style={{ "--d": `${index * 90}ms` } as Vars}>
                  <span>0{index + 1}</span>
                  <h3>{reason.title}</h3>
                  <p>{reason.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 8. Бесплатная проба */}
        <section className={styles.trial} id="trial" aria-labelledby="trial-title">
          <div className={`shell ${styles.trialGrid}`}>
            <div data-reveal>
              <p className="eyebrow eyebrow-light">Попробуйте без риска</p>
              <h2 id="trial-title">
                Два кадра бесплатно. <em>На вашей вещи.</em>
              </h2>
              <p className={styles.trialLead}>Не нужно верить на слово. Пришлите фото, и вы увидите результат на своём товаре до оплаты.</p>
              <TrialLink className="button button-light" />
            </div>
            <ol className={styles.trialSteps}>
              <li data-reveal style={{ "--d": "0ms" } as Vars}>
                <span>1</span>
                <p>Пришлите 2–3 фото вещи: спереди, сзади и крупно детали. Можно ссылку на карточку.</p>
              </li>
              <li data-reveal style={{ "--d": "90ms" } as Vars}>
                <span>2</span>
                <p>Я сделаю 1–2 кадра и пришлю вам.</p>
              </li>
              <li data-reveal style={{ "--d": "180ms" } as Vars}>
                <span>3</span>
                <p>Понравилось, обсуждаем серию. Нет, вы ничего не должны.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* 9. Как работаю */}
        <section className={styles.process} id="process" aria-labelledby="process-title">
          <div className={`shell ${styles.processGrid}`}>
            <div className={styles.sectionHead} data-reveal>
              <p className="eyebrow">Как работаю</p>
              <h2 id="process-title">
                Пять шагов <em>от фото до карточки</em>
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

        {/* 10. Цены */}
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

        {/* 11. Вопросы */}
        <section className={styles.faq} id="faq" aria-labelledby="faq-title">
          <div className={`shell ${styles.faqGrid}`}>
            <div className={styles.sectionHead} data-reveal>
              <p className="eyebrow">Вопросы</p>
              <h2 id="faq-title">
                Что обычно <em>спрашивают</em>
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
