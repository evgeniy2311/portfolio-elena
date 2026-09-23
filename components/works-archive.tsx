"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowIcon } from "@/components/arrow-icon";
import { CaseStack } from "@/components/case-stack";
import type { PortfolioListing } from "@/lib/portfolio";

const filterGroups = [
  { key: "platform", label: "Площадка", values: ["WB", "Ozon"] },
  { key: "task", label: "Тип задачи", values: ["Новая система", "Редизайн", "Серия SKU"] },
] as const;

function listingQuery(item: PortfolioListing, query: string) {
  const params = new URLSearchParams(query);
  params.set("selected", item.slug);
  return params.toString();
}

function caseHref(item: PortfolioListing, query: string) {
  return `/works/${item.slug}?from=${encodeURIComponent(listingQuery(item, query))}`;
}

function workLabel(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) return "работа";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return "работы";
  return "работ";
}

export function WorksArchive({ items }: { items: PortfolioListing[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const query = searchParams.toString();
  const [transientSelection, setTransientSelection] = useState<{ slug: string; query: string } | null>(null);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  const [quickIndex, setQuickIndex] = useState(0);
  const quickTouch = useRef<{ x: number; y: number } | null>(null);

  const filtered = useMemo(() => items.filter((item) => {
    const platform = searchParams.get("platform");
    const task = searchParams.get("task");
    const category = searchParams.get("category");
    const sources = searchParams.get("sources") === "1";
    const data = searchParams.get("data") === "1";
    return (!platform || item.platform === platform)
      && (!task || item.taskType === task)
      && (!category || item.category === category)
      && (!sources || item.hasSources)
      && (!data || item.hasVerifiedData);
  }), [items, searchParams]);

  const selectedFromUrl = searchParams.get("selected");
  const activeSlug = transientSelection?.query === query ? transientSelection.slug : selectedFromUrl;
  const active = filtered.find((item) => item.slug === activeSlug) ?? filtered[0];
  const quick = items.find((item) => item.slug === quickSlug);
  const quickMedia = quick ? [quick.listing.cover, ...quick.listing.preview] : [];
  const categories = Array.from(new Set(items.map((item) => item.category))).sort();
  const hasFilters = ["platform", "task", "category", "sources", "data"].some((key) => searchParams.has(key));

  useEffect(() => {
    const saved = sessionStorage.getItem(`works-scroll:${query}`);
    if (saved) {
      requestAnimationFrame(() => window.scrollTo({ top: Number(saved), behavior: "instant" }));
      sessionStorage.removeItem(`works-scroll:${query}`);
    }
  }, [query]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (quickSlug && !dialog.open) dialog.showModal();
    if (!quickSlug && dialog.open) dialog.close();
  }, [quickSlug]);

  function updateParam(key: string, value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || params.get(key) === value) params.delete(key);
    else params.set(key, value);
    params.delete("selected");
    router.push(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  function select(item: PortfolioListing) {
    setTransientSelection({ slug: item.slug, query });
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", item.slug);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  function openCase(event: MouseEvent<HTMLAnchorElement>, item: PortfolioListing) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const nextQuery = listingQuery(item, query);
    sessionStorage.setItem(`works-scroll:${nextQuery}`, String(window.scrollY));
    window.history.replaceState(window.history.state, "", `${pathname}?${nextQuery}`);
    router.push(caseHref(item, query));
  }

  function openQuick(item: PortfolioListing, opener: HTMLElement) {
    openerRef.current = opener;
    setQuickIndex(0);
    setQuickSlug(item.slug);
  }

  function closeQuick() {
    setQuickSlug(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  return (
    <>
      <section className="archive-filters shell" aria-label="Фильтры работ">
        {filterGroups.map((group) => (
          <fieldset key={group.key}><legend>{group.label}</legend><div>
            {group.values.map((value) => <button type="button" key={value} aria-pressed={searchParams.get(group.key) === value} onClick={() => updateParam(group.key, value)}>{value}</button>)}
          </div></fieldset>
        ))}
        <fieldset><legend>Категория</legend><select aria-label="Категория" value={searchParams.get("category") ?? ""} onChange={(event) => updateParam("category", event.target.value)}><option value="">Все категории</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></fieldset>
        <fieldset><legend>Материалы</legend><div><button type="button" aria-pressed={searchParams.get("sources") === "1"} onClick={() => updateParam("sources", "1")}>С исходниками</button><button type="button" aria-pressed={searchParams.get("data") === "1"} onClick={() => updateParam("data", "1")}>С подтверждёнными данными</button></div></fieldset>
        <div className="filter-summary"><p aria-live="polite"><strong>{filtered.length}</strong> {workLabel(filtered.length)}</p>{hasFilters && <button type="button" className="reset-filter" onClick={() => router.push(pathname, { scroll: false })}>Сбросить фильтры ×</button>}</div>
      </section>

      <section className="archive-desktop shell" aria-label="Индекс работ">
        <div className="archive-index">
          {filtered.map((item) => (
            <article className="archive-row" data-selected={item.slug === active?.slug} key={item.slug}>
              <button type="button" className="archive-select" aria-pressed={item.slug === active?.slug} onFocus={() => setTransientSelection({ slug: item.slug, query })} onMouseEnter={() => setTransientSelection({ slug: item.slug, query })} onClick={() => select(item)}>
                <span>{String(item.order).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.product}<br />{item.platform} · {item.taskType}</small><span>{item.slideCount} слайдов</span>
              </button>
              <Link prefetch={false} href={caseHref(item, query)} onClick={(event) => openCase(event, item)}>Открыть кейс <ArrowIcon /></Link>
            </article>
          ))}
          {filtered.length === 0 && <div className="empty-results"><h2>Нет совпадений</h2><p>Измените сочетание фильтров или сбросьте их.</p><button type="button" className="button primary" onClick={() => router.push(pathname)}>Сбросить фильтры</button></div>}
        </div>
        {active && <aside className="archive-preview" aria-live="polite"><p className="eyebrow">Активная работа{active.status === "demo" && " · DEMO"}</p><CaseStack item={active} compact /><div><p>{active.category} · {active.platform}</p><h2>{active.title}</h2><p>{active.product} · {active.taskType} · {active.slideCount} слайдов</p><Link prefetch={false} className="button primary" href={caseHref(active, query)} onClick={(event) => openCase(event, active)}>Открыть кейс <ArrowIcon /></Link></div></aside>}
      </section>

      <section className="archive-mobile shell" aria-label="Все работы">
        {filtered.map((item) => (
          <article className="archive-card" key={item.slug}>
            <CaseStack item={item} compact />
            <div className="archive-card-head"><span>{String(item.order).padStart(2, "0")}{item.status === "demo" && " / DEMO"}</span><span>{item.platform} · {item.slideCount} слайдов</span></div>
            <h2>{item.title}</h2><p>{item.product} · {item.taskType}</p>
            <div className="archive-card-actions">
              <button type="button" className="secondary-button" onClick={(event) => openQuick(item, event.currentTarget)}>Быстрый просмотр +</button>
              <Link prefetch={false} className="button primary" href={caseHref(item, query)} onClick={(event) => openCase(event, item)}>Открыть кейс <ArrowIcon /></Link>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="empty-results"><h2>Нет совпадений</h2><p>Измените сочетание фильтров или сбросьте их.</p><button type="button" className="button primary" onClick={() => router.push(pathname)}>Сбросить фильтры</button></div>}
      </section>

      <dialog ref={dialogRef} className="quick-dialog" onCancel={(event) => { event.preventDefault(); closeQuick(); }} onClose={() => { if (quickSlug) closeQuick(); }} aria-labelledby="quick-title">
        {quick && <div className="quick-dialog-inner"><div className="quick-dialog-head"><div><span>Быстрый просмотр{quick.status === "demo" && " · DEMO"}</span><h2 id="quick-title">{quick.title}</h2></div><button type="button" onClick={closeQuick} aria-label="Закрыть быстрый просмотр">×</button></div><div className="quick-stage" onTouchStart={(event) => { const touch = event.touches[0]; quickTouch.current = touch ? { x: touch.clientX, y: touch.clientY } : null; }} onTouchEnd={(event) => { const start = quickTouch.current; const touch = event.changedTouches[0]; if (!start || !touch) return; const dx = touch.clientX - start.x; const dy = touch.clientY - start.y; if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) setQuickIndex((quickIndex + (dx < 0 ? 1 : -1) + quickMedia.length) % quickMedia.length); quickTouch.current = null; }}><Image src={quickMedia[quickIndex].src} alt={quickMedia[quickIndex].alt} fill sizes="80vw" /></div><div className="quick-controls"><button type="button" onClick={() => setQuickIndex((quickIndex - 1 + quickMedia.length) % quickMedia.length)} aria-label="Предыдущий превью-слайд"><ArrowIcon direction="left" /></button><p aria-live="polite">{String(quickIndex + 1).padStart(2, "0")} / {String(quickMedia.length).padStart(2, "0")}</p><button type="button" onClick={() => setQuickIndex((quickIndex + 1) % quickMedia.length)} aria-label="Следующий превью-слайд"><ArrowIcon /></button></div><p>{quick.product} · {quick.platform} · {quick.slideCount} слайдов</p><Link prefetch={false} className="button primary" href={caseHref(quick, query)} onClick={(event) => openCase(event, quick)}>Открыть кейс <ArrowIcon /></Link></div>}
      </dialog>
    </>
  );
}
