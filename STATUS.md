# Статус проекта

Обновлено: 2026-08-23

## Стадия

Структурная первая версия и cinematic scroll-версия объединены в один локальный Commerce Atelier сайт. Независимый bug, interaction, motion и responsive-аудит завершён; безопасные UX-улучшения реализованы и прошли полный regression.

## Готово

- новая главная Commerce Atelier с image-based scroll-хореографией без видео и scroll-jacking;
- единая физическая equal-step модель для `#hero`, `#dark-coat`, `#windbreaker` и `#color-coat`: при 1440×900 шаг равен 810 px, reveal 324 px, разброс соседних интервалов 0%;
- scroll progress всех четырёх историй считается по фактическому sticky travel, complete points и reveal ramps производятся одной функцией;
- reverse scroll, реальные wheel-шаги 120/240/360 px, resting rAF и отключение listeners вне видимой истории проверены;
- compact/mobile-композиции всех четырёх историй поддерживают кнопки 48×48 px, счётчик, keyboard и горизонтальный swipe без блокировки вертикального scroll;
- полноценные истории про тёмное пальто, городскую ветровку и работу с цветом;
- доступное сравнение «Исходный материал / Визуальный сценарий»;
- отдельная флагманская история `/works/atelier-in-motion`;
- 13 выбранных оригиналов из HTML Telegram-архива подготовлены как responsive WebP с безопасными именами;
- `photo_64`, thumbnails, переписка, имена участников и Telegram username не используются;
- skip-link, клавиатура, touch targets, focus, alt-тексты, reduced motion и no-JS fallback проверены;
- контрольные ширины от 320 до 1920 px, телефоны 320–430 px и низкие desktop-высоты 650 px не имеют горизонтального переполнения, обрезанных кадров или collision текста и media;
- compare-блок сохраняет минимум 16 px между bounding boxes на автоматической матрице 17 ширин × 6 высот × 2 состояния; двухколоночный режим перенесён на 1320 px;
- display-заголовки не разрывают слова; глобальный `overflow-wrap: anywhere` ограничен обычным текстом;
- все публичные маршруты, 404, redirect, sitemap, reduced motion, no-JS, reverse scroll, flick и resting rAF проверены;
- `typecheck`, `lint` и production build проходят;
- baseline до объединения: production Playwright/axe `95 passed, 57 skipped, 0 failed`;
- независимые motion и regression-аудиты дали PASS; UI/UX-аудит выявил low-height крайний случай, исправление закреплено расширенной collision-матрицей;
- сохранены 36 production-скриншотов в `artifacts/screenshots/equal-step-2026-08-22/`.
- единый global header/footer работает на главной, архиве, data-driven кейсах и флагманской истории;
- hero различает локальную прокрутку «Смотреть истории» и переход «Все кейсы»;
- selected stories явно обозначены как переходы к секциям этой страницы;
- quick view и full case различаются визуально и по accessible name;
- browser Back восстанавливает query, выбранную работу, scroll position и focus;
- исправлены compact header на 320 px, mobile CTA/swipe collision и выход hero за 1920×650 на 2.7 px;
- новый reviewer Playwright suite: 101 passed, 63 ожидаемо skipped, 0 failed;
- reviewer feature/style matrix, bug report, interaction inventory, motion inventory и UX backlog находятся в `docs/reviews/2026-08-23-unification-audit.md`;
- before/after и responsive screenshots находятся в `artifacts/screenshots/reviewer-2026-08-23/`.

## Сейчас

Unified implementation завершена. Production preview оставлен на `http://127.0.0.1:3100/`; пользовательский выбор по UX-направлению ещё не получен.

## Заблокировано

- публикация материалов, пока не подтверждены права на фотографии;
- рабочая Telegram-ссылка, пока Елена не подтвердила адрес;
- публичные коммерческие результаты, пока нет проверяемых SKU, периодов и источников;
- deploy не выполнялся и не входит в этот эксперимент.

## Следующий шаг

Пользователю просмотреть `http://127.0.0.1:3100/` и выбрать: принять unified UX, перечислить конкретные доработки или сохранить только bug fixes.

## Нужно от пользователя

- выбрать: принять unified UX, доработать конкретные пункты или оставить только bug fixes;
- отдельно подтвердить права на фотографии, рабочую Telegram-ссылку и проверяемые коммерческие данные до публикации.
