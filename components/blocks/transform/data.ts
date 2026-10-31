import { getWork, type Work } from "@/lib/works";

const railSlugs = ["black-coat-evening", "beige-windbreaker", "puffer-jacket", "yellow-trench", "grey-shearling", "white-wrap-blouse"] as const;
export const railWorks = railSlugs.map((slug) => getWork(slug)).filter((work): work is Work => Boolean(work));
