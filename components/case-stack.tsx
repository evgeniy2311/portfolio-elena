import Image from "next/image";
import type { PortfolioCase, PortfolioListing } from "@/lib/portfolio";

export function CaseStack({ item, priority = false, compact = false }: { item: PortfolioCase | PortfolioListing; priority?: boolean; compact?: boolean }) {
  const images = [item.listing.cover, ...item.listing.preview].slice(0, compact ? 3 : 4);
  return (
    <div className={`case-stack${compact ? " case-stack-compact" : ""}`} aria-label={`Превью воронки ${item.title}`}>
      {images.map((image, index) => (
        <div className="case-stack-card" data-stack-index={index} key={image.id} aria-hidden={index > 0}>
          <Image
            src={image.src}
            alt={index === 0 ? image.alt : ""}
            fill
            priority={priority && index === 0}
            sizes={compact ? "(max-width: 767px) 76vw, 32vw" : "(max-width: 767px) 86vw, 42vw"}
          />
          {index === 0 && <>{item.status === "demo" && <span className="demo-chip">DEMO</span>}<span className="stack-title">{item.title}</span></>}
        </div>
      ))}
    </div>
  );
}
