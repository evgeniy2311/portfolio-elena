"use client";

import { useState } from "react";

export function MetricsBlock() {
  const [period, setPeriod] = useState<"before" | "after">("after");
  const label = period === "before" ? "До обновления" : "После обновления";
  return (
    <section className="metrics-panel" aria-labelledby="metrics-heading">
      <div className="metrics-head">
        <div><p className="eyebrow light">Демо-структура · числа не загружены</p><h2 id="metrics-heading">Обложка<br />в выдаче</h2></div>
        <div className="segmented" aria-label="Период сравнения">
          <button type="button" aria-pressed={period === "before"} onClick={() => setPeriod("before")}>До</button>
          <button type="button" aria-pressed={period === "after"} onClick={() => setPeriod("after")}>После</button>
        </div>
      </div>
      <p className="period-label">{label} · сопоставимый период: <strong>14 дней</strong></p>
      <div className="metric-grid">
        {["Показы", "Переходы", "CTR"].map((item) => <article key={item}><span>{item}</span><strong>—</strong><small>Ожидаются данные</small></article>)}
      </div>
      <div className="formula"><span>Формула</span><b>CTR = переходы / показы × 100%</b></div>
      <dl className="source-list">
        <div><dt>Площадка / SKU</dt><dd>Wildberries или Ozon / [артикул]</dd></div>
        <div><dt>Источник</dt><dd>[название отчёта кабинета продавца]</dd></div>
        <div><dt>Период / выгрузка</dt><dd>[даты] / [дата получения файла]</dd></div>
      </dl>
      <p className="method-note">CTR прежде всего помогает оценивать обложку. На него также влияют цена, реклама, позиция, рейтинг, отзывы, наличие и окружение. Остальные слайды корректнее сопоставлять с корзиной, заказами и конверсией.</p>
    </section>
  );
}
