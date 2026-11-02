import { ContactLink } from "@/components/ui/contact-link";
import { deckCards } from "./data";
import { Deck } from "./deck";
import styles from "./requests.module.css";

/**
 * 7. Задачи заказчиков, «Deck». От 1024×600 одна «липкая» сцена: слева заголовок и кнопка,
 * справа стопка карточек (секция 4 × 70vh + 100vh). Ниже — список с «подъёмом» карточек.
 */
export function Requests() {
  return (
    <section className={styles.requests} id="requests" data-ground="canvas" aria-labelledby="requests-title">
      <div className={styles.deck} data-pin data-deck data-segments={deckCards.length}>
        <div className={`shell ${styles.stage}`} data-stage>
          <div className={styles.head}>
            <p className="eyebrow">Задачи заказчиков</p>
            <h2 id="requests-title">
              С какой задачей приходят <em>ко&nbsp;мне</em>
            </h2>
            <p className="lede">Обычно у заказчика есть конкретная просьба. Вот пять из моих работ.</p>
          </div>
          <Deck cards={deckCards} />
          <div className={styles.cta}>
            <ContactLink intent="project" className="button button-ghost">
              Обсудить проект
            </ContactLink>
          </div>
        </div>
      </div>
    </section>
  );
}
