import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { ScrollFx } from "@/components/scroll-fx";
import { ContactBlock, SiteFooter, SiteHeader, TrialLink } from "@/components/site-shell";
import { about, formatPrice, packages } from "@/lib/site";
import { frame, getWork, source, works, type Work, type WorkImage } from "@/lib/works";
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

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const accuracySource = source("burgundy-coat-city", 0);

// Первый экран: сразу много работ, как в портфолио студий. Три колонки, в каждой разные вещи.
const heroColumns: Array<Array<{ image: WorkImage; alt: string }>> = [
  [
    { image: frame("burgundy-coat-city", 0), alt: "Бордовое пальто на модели у городского фасада" },
    { image: frame("beige-windbreaker", 0), alt: "Бежевая ветровка на модели у тёмной стены" },
    { image: frame("pink-longsleeve", 0), alt: "Розовый лонгслив на модели в студии" },
  ],
  [
    { image: frame("yellow-trench", 0), alt: "Жёлтый тренч на модели на летней улице" },
    { image: frame("black-coat-evening", 0), alt: "Чёрное пальто в интерьере с тёплой подсветкой" },
    { image: frame("grey-shearling", 0), alt: "Дублёнка с мехом и каракулем на городском перекрёстке" },
  ],
  [
    { image: frame("brown-coat-three-looks", 7), alt: "Шоколадное пальто с белым жилетом в городе" },
    { image: frame("white-wrap-blouse", 0), alt: "Белая блузка на запах с брюками" },
    { image: frame("puffer-jacket", 0), alt: "Зимняя куртка с поясом у городского фасада" },
  ],
];

// С какими вещами работаю: бегущая лента категорий с моими кадрами.
const categories: Array<{ label: string; image: WorkImage }> = [
  { label: "Пальто", image: frame("burgundy-coat-interior", 0) },
  { label: "Тренчи", image: frame("yellow-trench", 2) },
  { label: "Куртки", image: frame("puffer-jacket", 1) },
  { label: "Дублёнки", image: frame("long-sheepskin", 0) },
  { label: "Ветровки", image: frame("mint-windbreaker", 0) },
  { label: "Полупальто", image: frame("brown-pea-coat", 0) },
  { label: "Блузки", image: frame("white-wrap-blouse", 9) },
  { label: "Лонгсливы", image: frame("grey-longsleeve", 0) },
];

const pains: Array<{ title: string; text: string; image: WorkImage; alt: string; caption: string }> = [
  {
    title: "Фото с белого фона теряется в выдаче.",
    text: "Покупательница листает сотни похожих вещей и не останавливается на плоском кадре.",
    image: source("beige-windbreaker", 0),
    alt: "Исходное фото ветровки на белом фоне",
    caption: "Обычное фото с белого фона",
  },
  {
    title: "Фотосессия долгая и дорогая.",
    text: "Студия, модель, стилист, неделя ожидания. И всё заново на каждый новый цвет.",
    image: frame("beige-windbreaker", 0),
    alt: "Та же ветровка на модели в городе",
    caption: "Этот кадр сделан без фотосессии",
  },
  {
    title: "Нейросеть рисует похожую, но другую вещь.",
    text: "Меняет пуговицы, длину, карманы. Потом приходят возвраты с причиной «не соответствует фото».",
    image: frame("burgundy-coat-city", 2),
    alt: "Крупный план двубортной застёжки пальто",
    caption: "Пуговицы как на оригинале",
  },
];

const services: Array<{ title: string; text: string; image: WorkImage; alt: string }> = [
  {
    title: "Главное фото",
    text: "Обложка с инфографикой, которая выделяет вашу карточку среди сотен похожих в выдаче.",
    image: frame("yellow-trench", 0),
    alt: "Жёлтый тренч на модели в городе",
  },
  {
    title: "Воронка карточки",
    text: "Серия от 8 до 20 кадров: посадка, вид сзади, детали, образы. Одна вещь, одна история от обложки до последнего кадра.",
    image: frame("beige-windbreaker", 3),
    alt: "Бежевая ветровка на модели у тёмной стены",
  },
  {
    title: "Образы и сцены",
    text: "Город, интерьер, студия. Одну вещь показываю в разных стилях для разных покупательниц.",
    image: frame("brown-coat-three-looks", 0),
    alt: "Шоколадное пальто с джинсами и рубашкой в городе",
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

const aboutPoints = [
  { title: "Одежда и обувь", text: "Беру только то, в чём разбираюсь. Косметику и бытовые товары не делаю." },
  { title: "Насмотренность", text: "Каждый день слежу за модой. Знаю, с какого ракурса показать вещь и какой образ собрать на модели." },
  { title: "Ручная сверка", text: "Сравниваю каждый кадр с оригиналом и переделываю, если что-то уехало." },
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

function Photo({ image, alt, sizes, className, priority = false, eager = false }: { image: WorkImage; alt: string; sizes: string; className?: string; priority?: boolean; eager?: boolean }) {
  return (
    <Image
      loading={eager && !priority ? "eager" : undefined}
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
  const frameCount = works.reduce((sum, work) => sum + work.frames.length, 0);
  return (
    <div className={styles.page}>
      <ScrollFx />
      <SiteHeader current="home" />

      <main id="main" tabIndex={-1}>
        {/* 1. Первый экран: оффер и сразу много работ */}
        <section className={styles.hero} data-view aria-labelledby="hero-title">
          <div className={`shell ${styles.heroGrid}`}>
            <div className={styles.heroCopy}>
              <p className="eyebrow">Елена Бадьина · фото одежды и обуви для WB и Ozon</p>
              <h1 id="hero-title">
                Фото, которые поднимут вашу карточку <em>над сотнями похожих</em>
              </h1>
              <p className={styles.heroLead}>Ставлю вашу вещь на модель, в город или в интерьер без фотосессии. И сверяю каждую деталь с оригиналом.</p>
              <div className={styles.heroActions}>
                <TrialLink />
                <Link className="button button-ghost" href="#transform">
                  Смотреть работы
                </Link>
              </div>
              <p className={styles.heroNote}>Первые два кадра делаю бесплатно на вашей вещи.</p>
            </div>

            <div className={styles.wall} aria-label="Мои работы: кадры для карточек одежды">
              {heroColumns.map((column, columnIndex) => (
                <div className={styles.wallColumn} key={columnIndex} style={{ "--c": columnIndex } as Vars}>
                  {column.map((item, index) => (
                    <figure key={item.image.src}>
                      <Photo image={item.image} alt={item.alt} sizes="(max-width: 1023px) 32vw, 18vw" priority={index === 0} eager />
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. С какими вещами работаю: бегущая лента категорий */}
        <section className={styles.categories} aria-labelledby="categories-title">
          <h2 id="categories-title" className={`shell ${styles.categoriesTitle}`}>
            С чем работаю
          </h2>
          <div className={styles.marquee}>
            {[0, 1].map((copy) => (
              <ul className={styles.marqueeTrack} key={copy} aria-hidden={copy === 1 ? true : undefined}>
                {categories.map((item) => (
                  <li key={item.label}>
                    <Photo image={item.image} alt="" sizes="200px" eager />
                    <span>{item.label}</span>
                  </li>
                ))}
                <li className={styles.marqueeText}>
                  <span>и обувь</span>
                </li>
              </ul>
            ))}
          </div>
        </section>

        {/* 3. Обо мне */}
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

        {/* 4. Почему вещь продаётся плохо */}
        <section className={styles.pains} aria-labelledby="pains-title">
          <div className="shell">
            <p className="eyebrow eyebrow-light" data-reveal>
              Почему так бывает
            </p>
            <h2 id="pains-title" className={styles.painsTitle} data-reveal>
              Хорошая вещь, а продаётся <em>плохо.</em>
            </h2>
            <ol className={styles.painList}>
              {pains.map((pain, index) => (
                <li key={pain.title} data-reveal style={{ "--d": `${index * 90}ms` } as Vars}>
                  <figure>
                    <Photo image={pain.image} alt={pain.alt} sizes="(max-width: 899px) 92vw, 30vw" />
                    <figcaption>{pain.caption}</figcaption>
                  </figure>
                  <span>0{index + 1}</span>
                  <h3>{pain.title}</h3>
                  <p>{pain.text}</p>
                </li>
              ))}
            </ol>
            <p className={styles.painsAnswer} data-reveal>
              Я делаю кадры, которые останавливают взгляд на вашей карточке. Без фотосессии и без подмены вещи.
            </p>
          </div>
        </section>

        {/* 5. Что вы получаете: услуги сменяют друг друга при прокрутке */}
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

        {/* 6. До и после: горизонтальная лента, которую двигает вертикальная прокрутка */}
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
