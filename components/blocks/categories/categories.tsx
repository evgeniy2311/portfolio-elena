import { Photo } from "@/components/ui/photo";
import styles from "./categories.module.css";
import { categories } from "./data";

/** 2. С какими вещами работаю: бегущая лента категорий. */
export function Categories() {
  return (
    <section className={styles.categories} aria-labelledby="categories-title">
      <h2 id="categories-title" className={`shell ${styles.categoriesTitle}`}>
        С чем работаю
      </h2>
      <div className={styles.marquee}>
        {[0, 1].map((copy) => (
          <ul className={styles.marqueeTrack} key={copy} aria-hidden={copy === 1 ? true : undefined}>
            {categories.map((item) => (
              <li key={item.label}>
                <Photo image={item.image} alt="" sizes="200px" eager />
                <span>{item.label}</span>
              </li>
            ))}
            <li className={styles.marqueeText}>
              <span>и обувь</span>
            </li>
          </ul>
        ))}
      </div>
    </section>
  );
}
