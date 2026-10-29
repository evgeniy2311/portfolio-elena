"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Work, WorkCategory } from "@/lib/works";
import styles from "./works-grid.module.css";

type Props = {
  items: Array<Pick<Work, "slug" | "title" | "category" | "scenes" | "cover" | "source" | "frames">>;
  labels: Record<WorkCategory, string>;
};

export function WorksGrid({ items, labels }: Props) {
  const [filter, setFilter] = useState<WorkCategory | "all">("all");
  const categories = (Object.keys(labels) as WorkCategory[]).filter((key) => items.some((item) => item.category === key));
  const visible = filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <>
      <div className={styles.filters} role="group" aria-label="Фильтр по типу одежды">
        <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          Все <span>{items.length}</span>
        </button>
        {categories.map((key) => (
          <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
            {labels[key]} <span>{items.filter((item) => item.category === key).length}</span>
          </button>
        ))}
      </div>
      <p className={styles.count} aria-live="polite">
        Показано работ: {visible.length}
      </p>
      <ul className={styles.grid}>
        {visible.map((item) => (
          <li key={item.slug}>
            <Link className={styles.card} href={`/works/${item.slug}`}>
              <span className={styles.media}>
                <Image src={item.cover.src} width={item.cover.width} height={item.cover.height} alt="" sizes="(max-width: 639px) 92vw, (max-width: 1099px) 46vw, 30vw" />
                <span className={styles.source}>
                  <Image src={item.source[0].src} width={item.source[0].width} height={item.source[0].height} alt="" sizes="96px" />
                  <small>исходник</small>
                </span>
              </span>
              <span className={styles.meta}>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.facts}>
                  {item.source.length} исходн. → {item.frames.length} кадров · {item.scenes.slice(0, 2).join(", ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
