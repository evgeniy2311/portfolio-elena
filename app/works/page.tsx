import { connection } from "next/server";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { WorksArchive } from "@/components/works-archive";
import { portfolioListings } from "@/lib/portfolio";

export default async function WorksPage() {
  await connection();
  return (
    <>
      <SiteHeader current="works" />
      <main id="main" tabIndex={-1}><section className="archive-hero shell"><p className="eyebrow">Архив товарных воронок · DEMO</p><h1>Все работы</h1><div><p>{portfolioListings.length} самостоятельных сценариев для WB и Ozon. Выберите строку для превью или сразу откройте полный кейс.</p><strong>{portfolioListings.length}<span>воронок</span></strong></div></section><WorksArchive items={portfolioListings} /></main>
      <SiteFooter kicker="Нужна система для вашего товара?" heading="Обсудить задачу" />
    </>
  );
}
