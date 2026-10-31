import type { Metadata } from "next";
import { Hero } from "@/components/blocks/hero/hero";
import { Categories } from "@/components/blocks/categories/categories";
import { About } from "@/components/blocks/about/about";
import { Pains } from "@/components/blocks/pains/pains";
import { Services } from "@/components/blocks/services/services";
import { Transform } from "@/components/blocks/transform/transform";
import { Requests } from "@/components/blocks/requests/requests";
import { Accuracy } from "@/components/blocks/accuracy/accuracy";
import { Process } from "@/components/blocks/process/process";
import { Prices } from "@/components/blocks/prices/prices";
import { Faq } from "@/components/blocks/faq/faq";
import { ContactBlock } from "@/components/blocks/contact/contact";
import { ScrollFx } from "@/components/scroll-fx";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { MobileTrialBar } from "@/components/ui/mobile-trial-bar";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: { absolute: "Елена Бадьина: визуал для карточек одежды на WB и Ozon" },
  description:
    "Делаю кадры для карточек одежды и обуви на Wildberries и Ozon без фотостудии: модель, город, интерьер, новый цвет. Сверяю каждую деталь с исходником. Два первых кадра бесплатно.",
  openGraph: {
    title: "Елена Бадьина: визуал для карточек одежды",
    description: "Фото для карточек одежды и обуви на WB и Ozon без фотосессии. Два первых кадра бесплатно.",
    type: "website",
    locale: "ru_RU",
  },
};

export default function Home() {
  return (
    <div className={styles.page}>
      <ScrollFx />
      <SiteHeader current="home" />

      <main id="main" tabIndex={-1}>
        <Hero />
        <Categories />
        <About />
        <Pains />
        <Services />
        <Transform />
        <Requests />
        <Accuracy />
        <Process />
        <Prices />
        <Faq />
        <ContactBlock />
      </main>

      <SiteFooter />
      <MobileTrialBar />
    </div>
  );
}
