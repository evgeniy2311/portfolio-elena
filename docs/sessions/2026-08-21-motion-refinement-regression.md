# Сессия: motion refinement и полный regression audit

Дата: 2026-08-21

## Цель

Исправить desktop hero после пользовательской обратной связи, добавить внутреннюю хореографию `#dark-coat` и доказать отсутствие регрессий во всех существующих страницах и маршрутах тестовой копии.

## Выполнено

- hero progress переведён с viewport-зависимого знаменателя на фактический sticky travel;
- добавлены terminal snap `0.000/1.000`, явная band map, длительный plateau сцены 02, финальная пауза и живой `Scene / 01–04`;
- добавлены real-wheel flick-проверки 120/240/360 и reverse scroll;
- `#dark-coat` получил отдельный reversible scroll-driver и последовательный сбор четырёх фотографий;
- breakpoint композиции `#dark-coat` установлен на 1100 px, ниже остаётся статичный contact sheet;
- display-заголовки защищены от разрыва слов; исправлено переполнение hero на 900/901 px и обрезание CTA при 1440/1920×650;
- исправлены 768 px grid-регрессия, отсутствующий footer landmark на DEMO-кейсах, skip-link во всех route families и лишняя eager-загрузка нижней карусели;
- для неизвестной работы добавлена полноценная server-rendered 404 без JavaScript через registry-aware Proxy и global not-found;
- обновлены автоматические проверки всех публичных маршрутов, 404, redirect, sitemap, images, external requests, axe, CLS, reduced motion и no-JS;
- сохранены 13 production-скриншотов.

## Проверка

- `npm run typecheck` — PASS;
- `npm run lint` — PASS;
- `npm run build` — PASS;
- production Playwright/axe — 93 passed, 51 skipped, 0 failed, включая финальную no-JS route-проверку;
- независимый motion audit — PASS;
- независимый UI/UX audit — PASS;
- независимый regression audit — PASS после исправления no-JS unknown route.

## Ограничения

- права на фотографии не подтверждены для публикации;
- Telegram-ссылка не подтверждена;
- проверяемых публичных SKU/периодов/метрик нет;
- deploy, commit и push не выполнялись;
- Lighthouse локально не установлен, поэтому использованы Playwright, axe и PerformanceObserver CLS.

## Следующий шаг

Пользователю открыть `http://127.0.0.1:3100/`, проверить исправленные сцены и выбрать `принять`, `доработать` или `отказаться`.
