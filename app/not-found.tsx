import Link from "next/link";

export default function NotFound() {
  return <main id="main" className="not-found shell"><p className="eyebrow">404</p><h1>Такой работы нет</h1><p>Вернитесь в архив и выберите одну из демонстрационных воронок.</p><Link className="button primary" href="/works">Смотреть все работы →</Link></main>;
}
