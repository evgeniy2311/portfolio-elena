"use client";

import { useState } from "react";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import type { WorkImage } from "@/lib/works";
import styles from "./transform.module.css";

type Props = { source: WorkImage; result: WorkImage; sourceAlt: string; resultAlt: string; sizes: string };

/**
 * Шторка «исходник / результат» для пары в одной позе. Слева исходник, справа готовый кадр;
 * граница — значение ползунка (стрелки двигают на 5 %). Ползунок — обычный input range: работает
 * с клавиатуры, мышью и касанием, ловит только ручку 44 px, поэтому свайп по карусели не перехватывает.
 * Без JavaScript видна половина на половину.
 */
export function SplitComparison({ source, result, sourceAlt, resultAlt, sizes }: Props) {
  const [split, setSplit] = useState(50);
  return (
    <div className={styles.split} style={{ "--split": `${split}%` } as Vars}>
      <Photo image={source} alt={sourceAlt} sizes={sizes} />
      <div className={styles.splitResult} data-split-result data-develop style={{ clipPath: `inset(0 0 0 ${split}%)` }}>
        <Photo image={result} alt={resultAlt} sizes={sizes} />
      </div>
      <span className={styles.splitTag} aria-hidden="true">
        Исходник
      </span>
      <span className={`${styles.splitTag} ${styles.splitTagEnd}`} aria-hidden="true">
        Результат
      </span>
      <span className={styles.splitHandle} aria-hidden="true" />
      <input
        className={styles.splitRange}
        type="range"
        min={0}
        max={100}
        step={5}
        value={split}
        aria-label="Сравнить исходник и результат"
        aria-valuetext={`Исходник ${split} %, результат ${100 - split} %`}
        onChange={(event) => setSplit(Number(event.currentTarget.value))}
      />
    </div>
  );
}
