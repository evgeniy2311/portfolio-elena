import { ContactLink } from "@/components/ui/contact-link";
import type { Vars } from "@/components/ui/css-vars";
import { Photo } from "@/components/ui/photo";
import { videos } from "@/lib/site";
import { videoCopy, videoPosters } from "./data";
import { SnapDots, VideoPlayers } from "./video-player";
import styles from "./video.module.css";

/**
 * 12. Видео из фото. Механика «Letterbox»: две noir-полосы закрывают плитку и раскрываются от середины
 * (900 мс, шаг 120 мс). Пока настоящих роликов нет (lib/site.ts `videos` пуст), плитки — четыре постера
 * с плашкой «Ролики скоро», без значков воспроизведения. Ролики со стенда состояний играют в
 * VideoPlayers: только видимые, не больше 1 на телефоне и 2 на компьютере, с кнопкой паузы.
 */
export function Video() {
  const hasVideos = videos.length > 0;
  return (
    <section className={styles.video} id="video" data-ground="surface" aria-labelledby="video-title">
      <div className="shell">
        <div className={styles.panel} data-video-panel="">
          <div className={styles.copy}>
            <p className="eyebrow eyebrow-light">{videoCopy.eyebrow}</p>
            <h2 id="video-title">
              {videoCopy.title} <em>{videoCopy.accent}</em>
            </h2>
            <p className={styles.text}>{videoCopy.text}</p>
            {hasVideos ? <p className={`small ${styles.caption}`}>{videoCopy.caption}</p> : null}
            <ContactLink intent="video" className={`button button-ghost-light ${styles.cta}`}>
              {videoCopy.button}
            </ContactLink>
          </div>
          <div className={styles.gallery}>
            {hasVideos ? (
              <VideoPlayers clips={videos} rowClassName={styles.row} tileClassName={styles.tile} barClassName={styles.bar} toggleClassName={styles.toggle} />
            ) : (
              <ul className={styles.row} data-video-row="" aria-label="Постеры будущих роликов">
                {videoPosters.map((poster, index) => (
                  <li key={poster.image.src} className={styles.tile} data-video-tile="" data-reveal="letterbox" style={{ "--d": `${index * 120}ms` } as Vars}>
                    <Photo image={poster.image} alt={poster.alt} sizes="(max-width: 767px) 80vw, (max-width: 1023px) 40vw, 300px" />
                    <span className={styles.badge}>{videoCopy.soon}</span>
                    <span className={styles.bar} data-bar="top" aria-hidden="true" />
                    <span className={styles.bar} data-bar="bottom" aria-hidden="true" />
                  </li>
                ))}
              </ul>
            )}
            <SnapDots count={hasVideos ? videos.length : videoPosters.length} className={styles.dots} />
          </div>
        </div>
      </div>
    </section>
  );
}
