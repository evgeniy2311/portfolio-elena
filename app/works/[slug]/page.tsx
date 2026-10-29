import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon } from "@/components/arrow-icon";
import { CardPreview } from "@/components/card-preview";
import { ScrollFx } from "@/components/scroll-fx";
import { ContactBlock, SiteFooter, SiteHeader, TrialLink } from "@/components/site-shell";
import { categoryLabels, getWork, works } from "@/lib/works";
import styles from "../works.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return works.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) return {};
  return {
    title: work.title,
    description: `${work.task} ${work.result}`,
    openGraph: { images: [{ url: work.cover.src, width: work.cover.width, height: work.cover.height }] },
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = getWork(slug);
  if (!work) notFound();

  const position = works.findIndex((item) => item.slug === work.slug);
  const next = works[(position + 1) % works.length];

  return (
    <>
      <ScrollFx />
      <SiteHeader current="works" />
      <main id="main" tabIndex={-1}>
        <article>
          <header className={`shell ${styles.caseHead}`}>
            <Link className="text-link" href="/works">
              <ArrowIcon direction="left" /> Все работы
            </Link>
            <p className="eyebrow">{categoryLabels[work.category]}</p>
            <h1>{work.title}</h1>
            <ul className={styles.tags} aria-label="Сцены и приёмы">
              {work.scenes.map((scene) => (
                <li key={scene}>{scene}</li>
              ))}
            </ul>
          </header>

          <section className={`shell ${styles.caseIntro}`} aria-label="Задача и результат">
            <div className={styles.caseText}>
              <div>
                <h2>Задача</h2>
                <p>{work.task}</p>
              </div>
              {work.request ? (
                <blockquote>
                  <p className={styles.quoteLabel}>Запрос клиента</p>«{work.request}»
                </blockquote>
              ) : null}
              <div>
                <h2>Результат</h2>
                <p>{work.result}</p>
              </div>
              <div className={styles.sources}>
                <h2>Исходники: {work.source.length}</h2>
                <ul>
                  {work.source.map((image, index) => (
                    <li key={image.src}>
                      <Image src={image.src} width={image.width} height={image.height} alt={`${work.title}: исходное фото ${index + 1}`} sizes="(max-width: 767px) 30vw, 140px" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className={styles.casePhone}>
              <p className={styles.phoneLabel}>Так воронку видит покупательница</p>
              <CardPreview frames={work.frames} title={work.title} />
            </div>
          </section>

          <section className={`shell ${styles.funnel}`} aria-labelledby="funnel-title">
            <h2 id="funnel-title">
              Все кадры воронки <span>{work.frames.length}</span>
            </h2>
            <ol>
              {work.frames.map((image, index) => (
                <li key={image.src} data-reveal style={{ "--d": `${(index % 4) * 60}ms` } as CSSProperties}>
                  <Image src={image.src} width={image.width} height={image.height} alt={`${work.title}: кадр ${index + 1} из готовой воронки`} sizes="(max-width: 639px) 46vw, (max-width: 1099px) 31vw, 23vw" />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className={`shell ${styles.caseCta}`} aria-label="Следующий шаг">
            <div>
              <h2>Хотите так же для своей вещи?</h2>
              <p>Пришлите фото, первые два кадра сделаю бесплатно.</p>
            </div>
            <TrialLink />
            <Link className={styles.nextWork} href={`/works/${next.slug}`}>
              <span>Следующая работа</span>
              <strong>
                {next.title} <ArrowIcon />
              </strong>
            </Link>
          </section>
        </article>
        <ContactBlock />
      </main>
      <SiteFooter />
      <div className="mobile-cta">
        <TrialLink className="button" />
      </div>
    </>
  );
}
