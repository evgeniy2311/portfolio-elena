import Link from "next/link";

export default function NotFound() {
  return <main id="main" tabIndex={-1} className="not-found shell"><p className="eyebrow">404</p><h1>Такой работы нет</h1><p>Вернитесь к списку работ и выберите любую.</p><Link className="button" href="/works">Все работы</Link></main>;
}
