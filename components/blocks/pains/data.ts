import { frame, source, type WorkImage } from "@/lib/works";

export const pains: Array<{ title: string; text: string; image: WorkImage; alt: string; caption: string }> = [
  {
    title: "Фото с белого фона теряется в выдаче.",
    text: "Покупательница листает сотни похожих вещей и не останавливается на плоском кадре.",
    image: source("beige-windbreaker", 0),
    alt: "Исходное фото ветровки на белом фоне",
    caption: "Обычное фото с белого фона",
  },
  {
    title: "Фотосессия долгая и дорогая.",
    text: "Студия, модель, стилист, неделя ожидания. И всё заново на каждый новый цвет.",
    image: frame("beige-windbreaker", 0),
    alt: "Та же ветровка на модели в городе",
    caption: "Этот кадр сделан без фотосессии",
  },
  {
    title: "Нейросеть рисует похожую, но другую вещь.",
    text: "Меняет пуговицы, длину, карманы. Потом приходят возвраты с причиной «не соответствует фото».",
    image: frame("burgundy-coat-city", 2),
    alt: "Крупный план двубортной застёжки пальто",
    caption: "Пуговицы как на оригинале",
  },
];
