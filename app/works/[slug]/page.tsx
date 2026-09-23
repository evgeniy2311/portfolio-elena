import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon } from "@/components/arrow-icon";
import { CaseStack } from "@/components/case-stack";
import { SlideVisual } from "@/components/slide-visual";
import { WorkCarousel } from "@/components/work-carousel";
import { getAdjacentCases, getCaseBySlug, publicCases } from "@/lib/portfolio";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string }> };

export function generateStaticParams() { return publicCases.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = getCaseBySlug(slug);
  return item ? { title: `${item.title}${item.status === "demo" ? " — DEMO-кейс" : " — кейс"}`, description: `${item.product}: ${item.status === "demo" ? "демонстрационная структура" : "товарная воронка"} из ${item.finalSlides.length} слайдов.`, alternates: { canonical: `/works/${item.slug}` } } : {};
}

export default async function WorkCasePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { from } = await searchParams;
  const item = getCaseBySlug(slug);
  if (!item) notFound();
  const adjacent = getAdjacentCases(slug)!;
  const isDemo = item.status === "demo";
  const casePosition = publicCases.findIndex((caseItem) => caseItem.slug === item.slug) + 1;
  const returnHref = from ? `/works?${from}` : "/works";
  const contextQuery = from ? `?from=${encodeURIComponent(from)}` : "";
  const showSources = item.sourceMaterials?.items.some((source) => source.publishable) === true;
  const showFidelity = showSources && item.fidelity?.checks.some((check) => check.verified) === true;
  const showBeforeAfter = item.previousDesign?.publishable === true;
  const visibleMetrics = item.metrics?.filter((metric) => metric.verified && metric.publishable) ?? [];
  const showMetrics = visibleMetrics.length > 0;
  const sources = item.sourceMaterials?.items.filter((source) => source.publishable) ?? [];

  return (
    <>
      <header className="case-header shell">
        <Link className="back-link" href={returnHref}><ArrowIcon direction="left" /> Все работы</Link>
        <nav aria-label="Соседние кейсы"><Link href={`/works/${adjacent.previous.slug}${contextQuery}`} aria-label={`Предыдущий кейс: ${adjacent.previous.title}`}><ArrowIcon direction="left" /> Предыдущий</Link><span>Кейс {String(casePosition).padStart(2, "0")} / {publicCases.length}</span><Link href={`/works/${adjacent.next.slug}${contextQuery}`} aria-label={`Следующий кейс: ${adjacent.next.title}`}>Следующий <ArrowIcon /></Link></nav>
        <button type="button" disabled>Telegram</button>
      </header>
      <main id="main">
        <section className="case-hero shell">
          <div className="case-hero-copy"><p className="eyebrow">{isDemo && "DEMO · "}{item.platform} · {item.category}</p><h1 className={item.title.length > 8 ? "long-title" : undefined}>{item.title}</h1><p className="case-subtitle">{item.product}<br />{item.taskType}</p>{isDemo && <p className="case-disclaimer">Демонстрационная запись проверяет масштабируемый шаблон. Это не клиентская работа Елены и не опубликованный результат.</p>}</div>
          <div className="case-cover"><SlideVisual kind={item.finalSlides[0].kind} src={item.finalSlides[0].src} alt={item.finalSlides[0].alt} priority demoLabel={item.title} demo={isDemo} /></div>
          <dl className="case-facts"><div><dt>Площадка</dt><dd>{item.platform}</dd></div><div><dt>Категория</dt><dd>{item.category}</dd></div><div><dt>Серия</dt><dd>{item.finalSlides.length} слайдов</dd></div><div><dt>Статус</dt><dd>{isDemo ? "DEMO" : "Опубликовано"}</dd></div></dl>
        </section>

        <section className="case-context shell section"><p className="eyebrow">Контекст</p><div><h2>От первого кадра<br /><em>до выбора</em></h2><p>{item.context}</p><blockquote>{item.challenge}</blockquote></div></section>

        {showSources && <section className="sources section" id="sources"><div className="shell sources-head"><div><p className="eyebrow">Исходные материалы клиента</p><h2>Что получила Елена</h2></div><p>{item.sourceMaterials!.intro}</p></div><div className="source-stack shell">{sources.map((source, index) => <figure key={source.id} data-source-index={index}><div><Image src={source.src} alt={source.alt} fill sizes="(max-width: 767px) 100vw, 28vw" /></div><figcaption>{String(index + 1).padStart(2, "0")} · {source.caption}</figcaption></figure>)}</div><div className="shell preserve-list"><p>Требовалось сохранить</p><ul>{item.sourceMaterials!.preserve.map((detail) => <li key={detail}>{detail}</li>)}</ul><a href="#final-funnel">Из исходников — в готовую воронку ↓</a></div></section>}

        {showFidelity && <section className="fidelity shell section" id="fidelity"><div className="fidelity-head"><div><p className="eyebrow">Карта точности{isDemo && " · DEMO"}</p><h2>Деталь за деталью</h2></div><p>Каждая значимая деталь сверяется с исходными материалами перед финальной выдачей.</p></div><p className="fidelity-note">{item.fidelity!.note}</p><div className="fidelity-grid">{item.fidelity!.checks.filter((check) => check.verified).map((check) => { const source = sources.find((sourceItem) => sourceItem.id === check.sourceId)!; const final = item.finalSlides.find((slide) => slide.id === check.finalSlideId)!; return <article key={check.id} data-check={check.id}><div className="fidelity-pair"><div><Image src={source.src} alt={`Исходный ${isDemo ? "DEMO-" : ""}фрагмент: ${check.label}`} fill sizes="(max-width: 767px) 44vw, 17vw" /><span>Исходник</span></div><div><Image src={final.src} alt={`Финальный ${isDemo ? "DEMO-" : ""}фрагмент: ${check.label}`} fill sizes="(max-width: 767px) 44vw, 17vw" /><span>Финал</span></div></div><h3>{check.label}</h3><p>{check.note}</p></article>; })}</div><ul className="fidelity-checklist">{item.sourceMaterials!.preserve.map((detail) => <li key={detail}><span aria-hidden="true">✓</span>{detail}</li>)}</ul><a className="text-link" href="#final-funnel">Перейти к готовой серии <ArrowIcon /></a></section>}

        <section className="hypothesis shell section"><p className="eyebrow">Задача и гипотеза</p><div><h2>Один вопрос —<br /><em>один слайд</em></h2><p>{item.hypothesis}</p></div></section>

        <section className="final-funnel section" id="final-funnel"><div className="shell final-head"><div><p className="eyebrow light">Финальная воронка{isDemo && " · DEMO"}</p><h2>Серия из {item.finalSlides.length}<br />слайдов</h2></div><p>Реальный порядок, явные роли, стрелки, клавиатура и осторожный swipe, который не перехватывает вертикальную прокрутку.</p></div><div className="shell"><WorkCarousel slides={item.finalSlides} title={item.title} demo={isDemo} /></div></section>

        <section className="decisions shell section"><div><p className="eyebrow">Система решений</p><h2>Не декор.<br /><em>Сценарий выбора.</em></h2></div><div>{item.decisions.map((decision, index) => <article key={decision.title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{decision.title}</h3><p>{decision.text}</p></article>)}</div></section>

        {showBeforeAfter && <section className="before-after shell section"><div><p className="eyebrow">Предыдущий дизайн / после{isDemo && " · DEMO"}</p><h2>Редизайн без подмены</h2><p>Предыдущий опубликованный дизайн хранится отдельно от исходных фото товара.</p></div><div className="before-after-grid"><figure><div><Image src={item.previousDesign!.src} alt={item.previousDesign!.alt} fill sizes="(max-width: 767px) 46vw, 25vw" /></div><figcaption>До · {item.previousDesign!.caption}</figcaption></figure><figure><div><Image src={item.listing.cover.src} alt={item.listing.cover.alt} fill sizes="(max-width: 767px) 46vw, 25vw" /></div><figcaption>После{isDemo && " · DEMO-финал"}</figcaption></figure></div></section>}

        {showMetrics && <section className="case-metrics section"><div className="shell"><div><p className="eyebrow light">Проверяемые данные</p><h2>Результат<br />с контекстом</h2></div><div className="case-metric-grid">{visibleMetrics.map((metric) => <article key={metric.id}><span>{metric.label}</span><strong>{metric.value}</strong><p>{metric.note}</p><dl><div><dt>Площадка / SKU</dt><dd>{metric.platform} / {metric.sku}</dd></div><div><dt>Период</dt><dd>{metric.period.from} — {metric.period.to}</dd></div><div><dt>Источник</dt><dd>{metric.source}</dd></div><div><dt>Выгрузка</dt><dd>{metric.exportedAt}</dd></div></dl></article>)}</div></div></section>}

        <section className="contribution shell section"><div><p className="eyebrow">Вклад и ограничения</p><h2>Что здесь<br /><em>проверяется</em></h2></div><div><h3>Вклад</h3><ul>{item.contribution.map((value) => <li key={value}>{value}</li>)}</ul><h3>Ограничения</h3><ul>{item.constraints.map((value) => <li key={value}>{value}</li>)}</ul></div></section>

        <section className="case-next"><div className="shell case-next-grid"><div><p>Следующий кейс · {String(adjacent.next.order).padStart(2, "0")}</p><h2 className={adjacent.next.title.length > 8 ? "long-title" : undefined}>{adjacent.next.title}</h2><p>{adjacent.next.product} · {adjacent.next.finalSlides.length} слайдов</p><Link className="button light-button" href={`/works/${adjacent.next.slug}${contextQuery}`}>Открыть следующий кейс <ArrowIcon /></Link></div><CaseStack item={adjacent.next} compact /></div><div className="shell case-bottom-nav"><Link href={returnHref}><ArrowIcon direction="left" /> Все работы</Link><button type="button" disabled>Telegram · ссылка уточняется</button></div></section>
      </main>
    </>
  );
}
