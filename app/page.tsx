import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import { CaseStack } from "@/components/case-stack";
import { HeroCarousel } from "@/components/hero-carousel";
import { featuredCases, publicCases } from "@/lib/portfolio";

const heroCase = featuredCases[0];
const methods = [
  ["01", "Собрать", "Товар, исходники, аудиторию и контекст выдачи."],
  ["02", "Выстроить", "Главный аргумент и роль каждого слайда в серии."],
  ["03", "Сверить", "Конструкцию, детали, фактуру, цвет и пропорции."],
  ["04", "Передать", "Готовую воронку и адаптации в нужных форматах."],
];

export default function Home() {
  return (
    <>
      <header className="site-header shell">
        <Link className="wordmark" href="/" aria-label="Елена Бадьина — главная">ЕБ<span>·</span></Link>
        <nav aria-label="Основная навигация"><a href="#selected">Избранное</a><Link href="/works">Все работы</Link><a href="#method">Подход</a></nav>
        <a className="header-cta" href="#contact">Обсудить проект <ArrowIcon /></a>
      </header>
      <main id="main">
        <section className="hero shell">
          <div className="hero-copy">
            <p className="eyebrow">Одежда · Wildberries · Ozon</p>
            <h1><span>Елена</span><span>Бадьина</span></h1>
            <p className="hero-kicker">Нейровизуал с ручной сверкой деталей товара.</p>
            <p className="hero-lead">AI помогает построить кадр. Елена вручную сохраняет правду о товаре — от кармана и молнии до фактуры и пропорций.</p>
            <div className="hero-actions"><Link className="button primary" href={`/works/${heroCase.slug}`}>Смотреть работу <ArrowIcon /></Link><Link className="text-link" href="/works">Все {publicCases.length} работ <ArrowIcon /></Link></div>
          </div>
          <HeroCarousel slides={heroCase.finalSlides} title={heroCase.title} demo={heroCase.status === "demo"} />
          <div className="hero-index"><span>PORTFOLIO / DEMO</span><span>COMMERCE ATELIER</span></div>
        </section>

        <section className="selected shell section" id="selected">
          <div className="section-heading"><div><p className="eyebrow">Избранные воронки</p><h2>Сначала впечатление.<br /><em>Затем — аргументы.</em></h2></div><p>Главная оставляет только пять сильных сценариев. Полный архив показывает, как система выдерживает 6, 10 и 15 слайдов.</p></div>
          <div className="featured-grid">
            {featuredCases.map((item) => <article className="featured-card" key={item.slug}><Link href={`/works/${item.slug}`} aria-label={`Открыть кейс ${item.title}`}><CaseStack item={item} compact /></Link><div className="featured-card-meta"><p><span>{String(item.order).padStart(2, "0")}</span>{item.platform} · {item.taskType}</p><h3>{item.title}</h3><p>{item.product} · {item.finalSlides.length} слайдов</p><Link className="text-link" href={`/works/${item.slug}`}>Смотреть работу <ArrowIcon /></Link></div></article>)}
          </div>
          <Link className="all-works-link" href="/works"><span>Смотреть все работы</span><strong>{String(publicCases.length).padStart(2, "0")}</strong><ArrowIcon /></Link>
        </section>

        <section className="accuracy section" id="accuracy">
          <div className="shell accuracy-head"><p className="eyebrow light">Точность товара</p><h2>Вещь остаётся<br /><em>собой</em></h2><p>Каждая значимая деталь сверяется с исходными материалами перед финальной выдачей. Точность зависит от полноты и качества исходников.</p></div>
          <div className="shell accuracy-grid">
            {[{ label: "Карманы", a: "/demo/storm-detail.png", b: "/demo/storm-detail.png" }, { label: "Фактура", a: "/demo/storm-detail.png", b: "/demo/storm-detail.png" }, { label: "Пропорции", a: "/demo/storm-fit.png", b: "/demo/storm-fit.png" }].map((pair) => <article key={pair.label}><div className="accuracy-pair"><div><Image src={pair.a} alt={`DEMO-исходник: ${pair.label.toLowerCase()}`} fill sizes="(max-width: 767px) 45vw, 15vw" /><span>Исходник</span></div><div><Image src={pair.b} alt={`DEMO-финальный кадр: ${pair.label.toLowerCase()}`} fill sizes="(max-width: 767px) 45vw, 15vw" /><span>Финал</span></div></div><h3>{pair.label}</h3><p>DEMO-пара показывает формат будущей ручной проверки.</p></article>)}
          </div>
          <div className="shell"><Link className="button light-button" href="/works/storm#fidelity">Сравнить детали <ArrowIcon /></Link></div>
        </section>

        <section className="method section" id="method"><div className="shell method-layout"><div className="method-title"><p className="eyebrow light">Подход</p><h2>Материал.<br /><em>Сверка.</em><br />Решение.</h2></div><ol>{methods.map(([num, title, text]) => <li key={num}><span>{num}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>

        <section className="proof shell section"><div><p className="eyebrow">Подтверждённые результаты</p><h2>Цифры — только<br /><em>с паспортом</em></h2></div><div className="proof-card"><p>Показы, переходы и CTR появятся только вместе с артикулом, площадкой, периодом, источником и датой выгрузки.</p><div className="proof-values"><span><b>SKU</b> Артикул</span><span><b>14D</b> Период</span><span><b>CSV</b> Источник</span></div><small>В DEMO-реестре коммерческие результаты намеренно не заявлены.</small></div></section>

        <section className="services-about shell section"><div><p className="eyebrow">Форматы работы · уточняются</p><ul><li>Новая система слайдов</li><li>Редизайн карточки</li><li>Адаптация серии SKU</li></ul></div><div id="about"><p className="eyebrow">О Елене</p><h2>Fashion-вкус.<br />Коммерческая ясность.</h2><p>Елена Бадьина проектирует визуальные системы карточек для Wildberries и Ozon. Здесь одна красивая обложка становится последовательной историей о товаре.</p></div></section>
      </main>
      <footer className="contact" id="contact"><div className="shell"><p className="eyebrow light">Новый проект</p><h2>Покажите товар —<br /><em>начнём с задачи</em></h2><p>Можно прислать ссылку на карточку, текущие слайды и коротко описать, что нужно изменить.</p><button className="button contact-disabled" type="button" disabled>Telegram · ссылка уточняется</button><small>Контакт намеренно не ведёт на случайный аккаунт.</small><div className="footer-line"><span>Елена Бадьина</span><span>WB · OZON · FASHION</span><span>© 2026</span></div></div></footer>
    </>
  );
}
