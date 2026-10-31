import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { getWork } from "@/lib/works";
import { requests } from "./data";
import styles from "./requests.module.css";

/** 7. Задачи клиентов: карточки складываются стопкой. */
export function Requests() {
  return (
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
  );
}
