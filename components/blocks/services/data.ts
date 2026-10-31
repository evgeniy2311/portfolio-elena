import { frame, type WorkImage } from "@/lib/works";

/** Как кадр услуги появляется поверх предыдущего (design/brief.md, блок 5). У первого перехода нет. */
export type ServiceTransition = "none" | "curtain" | "iris" | "wipe" | "blinds" | "zoom" | "split";
/** Подложка за кадром по цвету самой вещи на фото (токены --tint-*). */
export type ServiceTint = "mustard" | "rose" | "mint" | "stone" | "blush";

export type Service = {
  title: string;
  text: string;
  image: WorkImage;
  alt: string;
  tint: ServiceTint;
  transition: ServiceTransition;
  /** Заголовок услуги ведёт к своему блоку на странице. */
  href?: string;
};

/*
 * Тексты: council/copy.md «ТЕКСТЫ» [4]. Кадры 1–6 из версии 2, седьмой — первый постер блока «Видео из фото».
 * «Новый цвет»: в серии longsleeve-colors нет двух кадров одной позы в разных цветах, поэтому вместо
 * Colour morph используется Diagonal wipe (бриф: морфинг разных поз не имитировать).
 */
export const services: Service[] = [
  {
    title: "Главное фото",
    text: "Обложка карточки, первый кадр, который видят в выдаче. Делаю её с инфографикой, чтобы на вашей вещи задержались.",
    image: frame("yellow-trench", 0),
    alt: "Жёлтый тренч на модели в городе",
    tint: "mustard",
    transition: "none",
  },
  {
    title: "Воронка карточки",
    text: "10–12 кадров одной вещи: обложка, посадка, вид сзади, детали, образы. Каждый кадр отвечает на свой вопрос покупательницы.",
    image: frame("beige-windbreaker", 3),
    alt: "Бежевая ветровка на модели у тёмной стены",
    tint: "stone",
    transition: "curtain",
  },
  {
    title: "Образы и сцены",
    text: "Город, интерьер или студия. Одну вещь показываю в разных образах для разных покупательниц.",
    image: frame("brown-coat-three-looks", 0),
    alt: "Шоколадное пальто с джинсами и рубашкой в городе",
    tint: "rose",
    transition: "iris",
  },
  {
    title: "Новый цвет",
    text: "Та же серия в другом цвете, даже если этого цвета нет на фото. Переснимать ничего не нужно.",
    image: frame("longsleeve-colors", 3),
    alt: "Чёрный лонгслив на модели в студии",
    tint: "stone",
    transition: "wipe",
  },
  {
    title: "Модель под вашу аудиторию",
    text: "Другой рост, размер и типаж. Крой вещи остаётся прежним.",
    image: frame("white-wrap-blouse", 9),
    alt: "Белая блузка на запах с чёрной юбкой",
    tint: "blush",
    transition: "blinds",
  },
  {
    title: "Детали крупно",
    text: "Ткань, фурнитура, швы, мех. Покупательница рассмотрит их ещё до заказа.",
    image: frame("grey-shearling", 1),
    alt: "Дублёнка с мехом и каракулем крупным планом",
    tint: "stone",
    transition: "zoom",
  },
  {
    title: "Видео из фото",
    text: "Оживляю готовые кадры в короткие ролики. Вещь в движении остаётся той же.",
    image: frame("yellow-trench", 1),
    alt: "Жёлтый тренч, вид сзади: пояс, хлястики и шлица",
    tint: "mustard",
    transition: "split",
    href: "#video",
  },
];
