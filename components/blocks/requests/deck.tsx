import Link from "next/link";
import { ArrowIcon } from "@/components/arrow-icon";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import type { DeckCard } from "./data";
import styles from "./requests.module.css";

/**
 * Стопка карточек «Deck». Все карточки в одной ячейке сетки, одной высоты; ход сцены (--p движка)
 * задаёт каждой карточке вход снизу и глубину, когда следом въезжает следующая. Ничего не «липнет»
 * внутри списка, поэтому карточка не может упереться в его низ и подняться (баг v2).
 * Движок отмечает переднюю карточку data-active (data-segments): только у неё ссылка доступна для Tab.
 * Уже 1024 px, при reduced motion и без JS — обычный список.
 */
export function Deck({ cards }: { cards: DeckCard[] }) {
  return (
    <ol className={styles.cards}>
      {cards.map((card, index) => (
        <li className={styles.card} key={card.work.slug} data-card data-segment data-reveal="lift" style={{ "--i": index } as Vars}>
          <div className={styles.cardText}>
            <p className={styles.cardLabel}>{card.label}</p>
            <blockquote className={styles.quote}>{card.verbatim ? `«${card.quote}»` : card.quote}</blockquote>
            <p className={styles.cardLabel}>Получилось</p>
            <p className={styles.result}>{card.result}</p>
            <Link className={`text-link ${styles.cardLink}`} href={`/works/${card.work.slug}`}>
              <h3 className={styles.cardTitle}>{card.work.title}</h3> <ArrowIcon />
            </Link>
          </div>
          <div className={`${styles.frames} ${card.square ? styles.framesSquare : ""}`}>
            {card.frames.map((frameIndex) => (
              <div className={styles.frame} key={frameIndex}>
                <Photo image={card.work.frames[frameIndex]} alt={`${card.work.title}: кадр ${frameIndex + 1}`} sizes="(max-width: 1023px) 30vw, 14vw" />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
