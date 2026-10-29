import type { Metadata } from "next";
import { ScrollFx } from "@/components/scroll-fx";
import { ContactBlock, SiteFooter, SiteHeader, TrialLink } from "@/components/site-shell";
import { WorksGrid } from "@/components/works-grid";
import { categoryLabels, works } from "@/lib/works";
import styles from "./works.module.css";

export const metadata: Metadata = {
  title: "Работы",
  description: "Портфолио Елены Бадьиной: воронки карточек для пальто, дублёнок, ветровок и трикотажа. Исходные фото и готовые кадры для WB и Ozon.",
};

const frameTotal = works.reduce((sum, work) => sum + work.frames.length, 0);

export default function WorksPage() {
  return (
    <>
      <ScrollFx />
      <SiteHeader current="works" />
      <main id="main" tabIndex={-1}>
        <section className={`shell ${styles.archiveHead}`}>
          <p className="eyebrow">Работы</p>
          <h1>
            {works.length} вещей. <em>{frameTotal} кадров.</em>
          </h1>
          <p className={styles.archiveLead}>У каждой работы есть исходник, то, что прислал клиент. Откройте работу, чтобы увидеть всю воронку так, как её листает покупательница.</p>
          <TrialLink />
        </section>
        <section className={`shell ${styles.archiveGrid}`} aria-label="Список работ">
          <WorksGrid
            items={works.map(({ slug, title, category, scenes, cover, source, frames }) => ({ slug, title, category, scenes, cover, source, frames }))}
            labels={categoryLabels}
          />
        </section>
        <ContactBlock />
      </main>
      <SiteFooter />
      <div className="mobile-cta">
        <TrialLink className="button" />
      </div>
    </>
  );
}
