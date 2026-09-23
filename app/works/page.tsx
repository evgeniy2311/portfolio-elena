import Link from "next/link";
import { connection } from "next/server";
import { ArrowIcon } from "@/components/arrow-icon";
import { WorksArchive } from "@/components/works-archive";
import { portfolioListings } from "@/lib/portfolio";

export default async function WorksPage() {
  await connection();
  return (
    <>
      <header className="site-header shell"><Link className="wordmark" href="/">ЕБ<span>·</span></Link><nav aria-label="Навигация архива"><Link href="/">Главная</Link><span aria-current="page">Все работы</span></nav><a className="header-cta" href="#archive-contact">Обсудить проект <ArrowIcon /></a></header>
      <main id="main"><section className="archive-hero shell"><p className="eyebrow">Архив товарных воронок · DEMO</p><h1>Все работы</h1><div><p>{portfolioListings.length} самостоятельных сценариев для WB и Ozon. Выберите строку для превью или сразу откройте полный кейс.</p><strong>{portfolioListings.length}<span>воронок</span></strong></div></section><WorksArchive items={portfolioListings} /></main>
      <footer className="archive-contact" id="archive-contact"><div className="shell"><p>Нужна система для вашего товара?</p><h2>Обсудить задачу</h2><button type="button" disabled className="button contact-disabled">Telegram · ссылка уточняется</button></div></footer>
    </>
  );
}
