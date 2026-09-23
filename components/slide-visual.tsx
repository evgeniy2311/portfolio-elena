import Image from "next/image";
import type { SlideKind } from "@/lib/portfolio";

export type { SlideKind } from "@/lib/portfolio";

const imageByKind: Partial<Record<SlideKind, string>> = {
  cover: "/demo/storm-cover.png",
  fit: "/demo/storm-fit.png",
  detail: "/demo/storm-detail.png",
  lifestyle: "/demo/storm-fit.png",
};

export function SlideVisual({ kind, preload = false, src: customSrc, alt = "", demoLabel = "STORM", demo = true }: { kind: SlideKind; preload?: boolean; src?: string; alt?: string; demoLabel?: string; demo?: boolean }) {
  const src = customSrc ?? imageByKind[kind];
  return (
    <div className={`slide-visual slide-${kind}`}>
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          preload={preload}
          loading={preload ? undefined : "lazy"}
          sizes="(max-width: 767px) 82vw, (max-width: 1100px) 45vw, 34vw"
          className="slide-photo"
        />
      )}
      {demo && <><div className="demo-mark">DEMO / {demoLabel}</div>
      {kind === "cover" && <div className="slide-copy cover-copy"><b>Тепло.<br />Легко.<br />Город.</b><span>Зимняя куртка</span></div>}
      {kind === "benefit" && <div className="slide-copy benefit-copy"><span>Ключевое преимущество</span><b>Тепло<br />без объёма</b><i>Слот для одного главного аргумента</i></div>}
      {kind === "fit" && <div className="slide-copy fit-copy"><span>Посадка / образ</span><b>Свободный<br />силуэт</b></div>}
      {kind === "detail" && <div className="slide-copy detail-copy"><span>Материал / деталь</span><b>Фактура<br />крупно</b></div>}
      {kind === "function" && <div className="function-art" aria-hidden="true"><span className="weather-line" /><span className="pocket" /></div>}
      {kind === "function" && <div className="slide-copy function-copy"><span>Функция</span><b>Защита<br />в деталях</b><i>Карман · капюшон · ткань</i></div>}
      {kind === "size" && <div className="size-art"><span>Выберите привычный размер</span><div className="sizes"><b>XS</b><b>S</b><b>M</b><b>L</b><b>XL</b></div><small>Заменить реальной сеткой бренда</small></div>}
      {kind === "lifestyle" && <div className="slide-copy lifestyle-copy"><span>Финальный кадр</span><b>Готова<br />к городу</b><i>Закрытие последнего сомнения</i></div>}</>}
    </div>
  );
}
