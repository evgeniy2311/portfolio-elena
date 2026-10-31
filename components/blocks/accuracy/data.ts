import { frame, source } from "@/lib/works";

export const accuracySource = source("burgundy-coat-city", 0);

export const checks = [
  { title: "Застёжка и пуговицы", text: "Два ряда пуговиц, их число и расстояние между ними.", image: frame("burgundy-coat-city", 2) },
  { title: "Пояс и шлёвки", text: "Ширина пояса, как он завязан, где проходят шлёвки.", image: frame("burgundy-coat-city", 3) },
  { title: "Карман и рукав", text: "Форма кармана, длина рукава, манжета.", image: frame("burgundy-coat-city", 4) },
  { title: "Длина и силуэт", text: "Где заканчивается пальто, как сидит в плечах.", image: frame("burgundy-coat-city", 0) },
];
