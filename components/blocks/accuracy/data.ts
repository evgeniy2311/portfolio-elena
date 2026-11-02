import { frame, source } from "@/lib/works";

/*
 * Сверка деталей (copy.md [7]). Исходник — студийное фото бордового пальто в три четверти
 * (source-2): на нём видны все четыре детали. focus — точка детали на исходнике в процентах
 * ширины и высоты, проверено по самому фото: пуговица, пояс у бока, карман, низ пальто.
 * image — готовый кадр серии с той же деталью крупно (frame-03 застёжка, frame-04 пояс,
 * frame-05 карман и манжета, frame-18 пальто в полный рост).
 */
export const accuracySource = source("burgundy-coat-city", 1);

export type Check = { title: string; text: string; image: ReturnType<typeof frame>; focus: { x: number; y: number } };

export const checks: Check[] = [
  { title: "Застёжка и пуговицы", text: "Два ряда пуговиц, сколько их и на каком расстоянии.", image: frame("burgundy-coat-city", 2), focus: { x: 51, y: 37 } },
  { title: "Пояс и шлёвки", text: "Ширина пояса, как он завязан, где шлёвки.", image: frame("burgundy-coat-city", 3), focus: { x: 40, y: 41 } },
  { title: "Карман и рукав", text: "Форма кармана, длина рукава, манжета.", image: frame("burgundy-coat-city", 4), focus: { x: 42, y: 46 } },
  { title: "Длина и силуэт", text: "Где заканчивается пальто и как оно сидит в плечах.", image: frame("burgundy-coat-city", 17), focus: { x: 48, y: 77 } },
];
