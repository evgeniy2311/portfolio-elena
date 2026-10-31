import { categories, categoriesCopy } from "./data";
import { Ribbon } from "./ribbon";
import styles from "./categories.module.css";

/** 2. «С чем работаю»: заголовок и управляемая лента категорий (Silk Ribbon). */
export function Categories() {
  return (
    <section className={styles.categories} data-ground="surface" aria-labelledby="categories-title">
      <Ribbon
        tiles={categories}
        label={categoriesCopy.label}
        heading={
          <div className={styles.heading}>
            <p className="eyebrow">{categoriesCopy.eyebrow}</p>
            <h2 id="categories-title">
              Верхняя одежда, трикотаж, блузки <em>и&nbsp;обувь</em>
            </h2>
            <p className={`lede ${styles.sub}`}>{categoriesCopy.sub}</p>
          </div>
        }
      />
    </section>
  );
}
