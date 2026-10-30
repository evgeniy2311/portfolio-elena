# История изменений

Все существенные изменения проекта фиксируются здесь. Формат основан на Keep a Changelog, но адаптирован под раннюю стадию проекта.

## [Unreleased]

### 2026-10-31 - Первый круг правок Елены

#### Changed

- первый экран: новый оффер «Фото, которые поднимут вашу карточку над сотнями похожих» и стена из 9 работ вместо сборки одной воронки (было «перегружено», подпись закрывала лицо);
- новые блоки: бегущая лента «С чем работаю» с категориями и «Обо мне» (место под фото и опыт, пока монограмма); блок «Почему со мной» влит в «Обо мне»;
- к трём проблемам добавлены фото с подписями; фраза «останавливают ленту» заменена на «останавливают взгляд на вашей карточке»;
- услуги на компьютере сменяют друг друга при прокрутке (картинка открывается поверх предыдущей), на телефоне карточки;
- «Что прислал клиент» → «Что вы присылаете. Что получаете.», убрано «лента едет сама»; в каждой работе показана задача заказчика (`brief` в `lib/works.ts`, черновики на проверке у Елены);
- «Одно пальто, три разных образа»; Елена делает и обувь (FAQ, шапка, тексты), косметику и бытовые товары не делает;
- сцена сверки деталей больше не вылезает за экран невысокого ноутбука: описание раскрывается только у активного пункта;
- блок пробы без дублирующих шагов; «Как работаю» → «Как это работает», «Вопросы» → «Часто задаваемые вопросы»;
- тесты: стена работ, смена услуг, сцена сверки на 1280×680; 58 passed, 6 skipped.

### 2026-10-30 - Превью на GitHub Pages

#### Added

- `.github/workflows/preview.yml`: после каждого push в main сайт собирается статично и выкладывается на https://evgeniy2311.github.io/portfolio-elena/;
- `next.config.ts`: при `NEXT_PUBLIC_BASE_PATH` статичная сборка (export, basePath, без оптимизации картинок и редиректов); `lib/works.ts` добавляет basePath к путям кадров; превью закрыто от поисковиков (`robots: noindex`); `app/sitemap.ts` помечен `force-static`.

### 2026-10-29 - Продающая главная на реальных работах

#### Added

- README: пошаговый запуск сайта на ноутбуке (для Елены); `docs/business/` и заметка 2026-10-12 добавлены в `.gitignore`, в публичный репозиторий не идут;
- 17 реальных работ из выгрузки чата 2026-10-28: `lib/works.ts`, `lib/works-media.json`, `public/works/*`, импорт `scripts/import-works.mjs` + `scripts/works-import.json`;
- новая главная (`app/page.tsx`, `app/home.module.css`) с оффером «2 кадра бесплатно» и сценами прокрутки; драйвер `components/scroll-fx.tsx`;
- архив с фильтром (`components/works-grid.tsx`), страница работы с телефоном-каруселью (`components/card-preview.tsx`);
- `lib/site.ts`: контакты, текст для Telegram, пакеты услуг; пока данные не подтверждены, сайт показывает честную заглушку;
- новый набор Playwright-тестов (`tests/portfolio.spec.ts`).

#### Changed

- палитра тёплее (бордо, шоколад, кэмел из работ), подписи не мельче 13 px, две гарнитуры;
- редиректы со старых DEMO-адресов, sitemap и proxy по новым работам, `images.qualities` для Next 16.

#### Removed

- DEMO-кейсы STORM, `lib/portfolio.ts`, atelier-истории и их компоненты, `public/atelier`, `public/demo`.

### 2026-10-12 - Где брать заказы: площадки, тексты объявлений, платежи

#### Added

- `docs/business/2026-10-12-orders-plan.pdf` (91 стр.): площадки РФ и мира с вердиктами, план на 4 недели, цены рынка, цепочки вывода денег, схема автоматизации заявок, готовые тексты объявлений RU/EN, вопросы к Елене, 9 полных отчётов исследователей;
- `docs/business/listings.md` — тексты объявлений (Kwork, Авито, Profi/FL/hh, Telegram, Fiverr, Upwork, Contra, LinkedIn, Behance, cold outreach);
- `docs/business/plan-summary.md` и `docs/business/research/*.md`.

### 2026-10-10 - Исследование направления сайта

#### Added

- PDF-отчёт `docs/research/2026-10-10-site-direction-research.pdf` (34 страницы): дизайн-ревью текущего сайта по ui-ux-pro-max, позиционирование, новый каркас главной, три тональности текстов, 7 палитр, 6 шрифтовых пар с кириллицей, ~110 референсов со скриншотами и ссылками, цены рынка, список данных от Елены;
- позиционирование Елены её словами в `docs/PRODUCT_BRIEF.md`.

### 2026-08-23 - Unified site integration and independent UX audit

#### Added

- общий `SiteHeader` и `SiteFooter` для главной, архива, data-driven кейсов и флагманской истории;
- явные local-scroll и route CTA в hero, подписи результата действия у selected stories;
- различимые quick-view/full-case accessible names и focus restoration после browser Back;
- regression-тесты unified shell, CTA vocabulary, nested links, focus return и reviewer responsive matrix;
- reviewer feature/style matrix, bug report, interaction inventory, task scenarios, motion inventory и приоритизированный UX backlog;
- before/after и viewport-state screenshots в `artifacts/screenshots/reviewer-2026-08-23/`.

#### Fixed

- три конфликтующих header/footer и разное контактное поведение между route families;
- неоднозначность anchor-to-section, full-case route и local quick view;
- потеря focus после возврата из кейса в архив;
- сжатые mobile nav targets на 320 px;
- перенос двух hero CTA, мешавший mobile swipe;
- выход hero artwork на 2.7 px за viewport 1920×650.

#### Verified

- typecheck, lint и Next.js webpack production build проходят;
- Playwright: 101 passed, 63 ожидаемо skipped, 0 failed;
- equal-step baseline сохранён: 810 px photo step, 324 px reveal и 0% spread complete intervals;
- route crawl, axe, keyboard, touch, reverse, reduced motion, no-JS и low-height matrices проходят.

### 2026-08-23 - Independent reviewer and interaction clarity prompt

#### Added

- новый `docs/NEXT_SESSION_PROMPT.md` для независимой проверки предыдущей equal-step реализации;
- обязательная feature/style matrix первой структурной версии и cinematic scroll-версии;
- этап объединения обеих версий в единый сайт внутри тестовой копии;
- отдельные этапы для bug review и discoverability/UX-аудита;
- interaction inventory всех ссылок, карточек, toggles, carousel controls, quick view и contact CTA;
- motion inventory четырёх уровней: hero, story, section и micro interactions;
- task-based сценарии «главная → работа → кейс → возврат → контакт»;
- формат приоритизации 8–12 улучшений по impact, effort, риску и потребности в новых данных;
- правило реализовывать только 2–4 безопасных high-value улучшения после чистого regression PASS.

#### Documented

- пользовательская проблема: местами неочевидно, что можно нажать и какой результат откроется;
- пользовательское решение: сохранить структуру, архив и кейсы первой версии, объединить их с scroll-хореографией второй версии;
- unified-сайт не должен ощущаться как две визуально и поведенчески разные части;
- Commerce Atelier, equal-step motion и текущая палитра/типографика остаются неизменным baseline;
- generic portfolio grid, blue accent, glassmorphism и обучающие overlay-подсказки исключены;
- следующий агент должен раздельно передать bug fixes, реализованные UX-улучшения и идеи, требующие решения пользователя.

### 2026-08-22 - Equal-step motion implementation and regression audit

#### Added

- общий helper и React hook для физически равных scroll-шагов четырёх фотоисторий;
- scroll-хореография windbreaker и color coat, доступные compact/mobile controls для всех историй;
- автоматические проверки real-wheel 120/240/360 px, reverse, resting rAF, reduced motion, no-JS и physical-step tolerance;
- collision-матрица compare-блока и состояний фотоисторий, включая 1440×650 и 1920×650;
- 36 production-скриншотов в `artifacts/screenshots/equal-step-2026-08-22/`.

#### Changed

- hero и dark coat переведены с независимых процентных карт на одну pixel-based timing-модель;
- motion breakpoint унифицирован на 1024 px при высоте не менее 560 px;
- двухколоночный compare-layout перенесён на 1320 px, между text и media закреплён зазор не менее 16 px;
- low-height hero, windbreaker и color coat уменьшены так, чтобы видимые кадры оставались внутри viewport;
- responsive image `sizes` синхронизированы с compact/motion breakpoint.

#### Verified

- `typecheck`, `lint` и production build проходят;
- production Playwright/axe: 95 passed, 57 ожидаемо skipped, 0 failed;
- независимый motion-аудит подтвердил 810 px photo step, 324 px reveal и 0% разброс при 1440×900;
- полный route crawl не нашёл console errors, missing assets, serious/critical axe violations, overflow или внешних runtime-запросов.

### 2026-08-22 - Uniform motion prompt after second user review

#### Added

- новый `docs/NEXT_SESSION_PROMPT.md` для общей equal-step scroll-модели hero, dark coat, windbreaker и color coat;
- измеримые acceptance criteria для физических complete points, одинаковых reveal ramps и real-wheel шагов 120/240/360 px;
- обязательная collision-матрица для блока «Исходный материал. Визуальный сценарий»;
- проверки half-window, low-height desktop, mobile, compact carousel, reverse scroll, reduced motion и no-JS;
- диагностический скриншот пользователя зарегистрирован в content inventory.

#### Documented

- текущая hero band map воспринимается неравномерной из-за большого разрыва между frame 02 и frame 03;
- dark coat может оставаться статичным на ноутбуке из-за breakpoint 1100 px;
- windbreaker и color coat пока не имеют внутренней scroll-хореографии;
- на промежуточной ширине compare headline пересекается с правой media-колонкой;
- код сайта в этой сессии не изменялся.

### 2026-08-21 - Motion refinement and full regression audit

#### Changed

- hero progress переведён на фактический sticky travel и теперь достигает точных крайних значений `0.000` и `1.000`;
- сцена `02 · Сценарий` получила отдельный полный plateau `0.20–0.60`, сцена 04 удерживается в финальном состоянии `0.86–1.00`, а `Scene / 04` стал живым счётчиком;
- `#dark-coat` получил отдельную reversible-хореографию фотографий, текста, CTA и editorial-линии;
- desktop hero исправлен для 900/901 px и высоты 650 px; breakpoint `#dark-coat` осознанно установлен на 1100 px;
- display-заголовки защищены от `overflow-wrap: anywhere`, а двухколоночный подход начинается с 900 px;
- skip-link теперь фокусирует `<main>` во всех route families; неизвестная работа получает полноценную server-rendered 404 даже без JavaScript;
- нижняя карусель кейса снова lazy, а LCP использует единственный Next.js `preload`.

#### Verified

- `typecheck`, `lint` и production build проходят;
- production Playwright/axe: 93 passed, 51 skipped, 0 failed;
- проверены real-wheel flick 120/240/360, reverse scroll, exact endpoints, resting rAF, reduced motion, no-JS и CLS;
- пройдены независимые motion, UI/UX и regression-аудиты;
- сохранены 13 production-скриншотов в `artifacts/screenshots/motion-refinement-2026-08-21/`.

### 2026-08-21 - Motion refinement prompt after user review

#### Added

- новый `docs/NEXT_SESSION_PROMPT.md` для полноценной доработки scroll-сцен и regression audit всех существующих routes;
- точные acceptance criteria для hero scene `02 · Сценарий`, band map, flick test и финального plateau;
- сценарий внутренней image-based choreography блока «От нейтрального кадра к сцене с характером»;
- обязательные проверки display-типографики, motion-breakpoint 899/900/901 px, reverse scroll, resting rAF и полного route crawl.

#### Documented

- подтверждено, что текущий hero progress не достигает 1.0 до выхода sticky-stage;
- подтверждено, что сцена 02 имеет слишком короткое полностью собранное состояние;
- подтверждено, что `#dark-coat` сейчас анимируется только как единая секция, без внутренней режиссуры;
- зафиксирован выбор пользователя: `доработать`.

### 2026-08-21 — Elena Badyina: Atelier in Motion

#### Added

- отдельная экспериментальная главная с image-based desktop scroll-сценой и mobile swipe-композицией;
- три реальные визуальные истории из локального Telegram-архива: тёмное пальто, городская ветровка и цветовое направление;
- доступное интерактивное сравнение исходного материала и визуального сценария;
- флагманская история `/works/atelier-in-motion`;
- 13 оптимизированных WebP-файлов с безопасными публичными именами;
- reduced-motion, no-JS, keyboard и touch состояния;
- четыре финальных скриншота в `artifacts/screenshots/atelier-final/`.

#### Changed

- главная тестовой копии полностью переведена в режиссёрское направление Commerce Atelier;
- сигнал-акцент уточнён до контрастного `#a93628` после axe-проверки;
- 768 px композиция сравнения и блока точности переведена в читаемую одну колонку по итогам независимого UI/UX-аудита;
- единственный image preload флагманской истории перенесён на фактический LCP-кадр;
- Playwright-набор расширен проверками scroll, swipe, сравнения, live reduced motion, no-JS, touch targets и крайних ширин.

#### Verified

- `npm run typecheck`, `npm run lint` и `npm run build` проходят;
- production e2e: 88 passed, 24 skipped по неприменимым viewport-условиям;
- отсутствие console errors, 404 ресурсов, серьёзных axe-нарушений и горизонтального переполнения;
- финальные кадры визуально проверены на 375 px, 768 px, 1440 px, reduced motion и странице флагманской истории.

### 2026-08-21 — Scalable portfolio implementation

#### Added

- data-driven реестр 12 DEMO-воронок и валидатор публичной модели;
- архив `/works` с URL-фильтрами, быстрым просмотром и сохранением контекста возврата;
- динамический маршрут `/works/[slug]` с условными исходниками, fidelity map, previous design и metrics;
- адаптивные состояния для 320, 375, 768, 1024, 1440 и 1920 px;
- metadata, Open Graph, sitemap, 404 и постоянный redirect со старого маршрута;
- 72 сценария Playwright/axe, матрица скриншотов и production Lighthouse-отчёты.

#### Changed

- главная перестроена в отобранную витрину пяти работ;
- вся публичная DEMO-маркировка стала зависеть от статуса записи;
- публичные метрики и клиентские материалы защищены явными флагами проверки и разрешения;
- README, статус и архитектурная документация приведены к реализованному состоянию.

#### Verified

- typecheck, lint и production build проходят;
- 63 теста проходят, 9 viewport-зависимых сценариев пропускаются по условию;
- Lighthouse: Performance 96–97, Accessibility/Best Practices/SEO — 100, CLS — 0;
- на всех контрольных ширинах отсутствует горизонтальное переполнение.

### 2026-08-21 — Multi-funnel architecture handoff

#### Added

- новая версия `docs/NEXT_SESSION_PROMPT.md` для реализации архива из 10–15 воронок;
- архитектурная спецификация `docs/architecture/PORTFOLIO_ARCHITECTURE.md`;
- требования к трём субагентам и трём циклам самопроверки;
- условная source-секция, fidelity map и отдельная модель previous design;
- правила интуитивных CTA, стрелок, счётчиков и quick view;
- свежие референсы больших архивов, premium fashion кейсов и garment fidelity.

#### Changed

- content guide дополнен исходными фото товара и checklist ручной сверки деталей;
- следующий шаг проекта перенесён с прямой замены STORM на создание масштабируемой data-driven архитектуры.

### 2026-08-21 — Interactive prototype

#### Added

- Next.js + TypeScript приложение с главной страницей и маршрутом `/cases/storm`;
- адаптивный Commerce Atelier UI для 375, 768, 1024 и 1440 px;
- touch/keyboard-карусель из семи ролей слайдов;
- паспорт контента 7 обязательных + 2 опциональных изображения;
- before/after и CTR-блок с периодом, источником, формулой и честными пустыми значениями;
- три AI-сгенерированных локальных STORM-заглушки с явной demo-маркировкой;
- Playwright + axe тесты, Lighthouse-отчёты и desktop/mobile скриншоты.

#### Changed

- `README.md` и `STATUS.md` обновлены с командами запуска и следующим шагом импорта Telegram.

### 2026-08-21 — Prototype handoff

#### Added

- промпт для новой сессии разработки визуального прототипа;
- требования к desktop/mobile макетам главной и страницы кейса;
- контентная модель из 6–8 основных и до 2 доказательных изображений;
- показы, переходы, CTR, источник и период в аналитическом блоке;
- методика разделения оценки обложки и последующих слайдов.

### 2026-08-21 — Concept selection

#### Changed

- концепция B — Commerce Atelier — утверждена пользователем;
- подтверждено правильное написание имени «Елена Бадьина»;
- рабочая дизайн-система приведена к выбранному premium fashion/data-driven направлению;
- зафиксированы кириллическая типографика и ограничения motion/accessibility.

### 2026-08-21 — Foundation

#### Added

- продуктовый бриф и критерии успеха;
- три визуальные концепции сайта;
- исследование конкурентов и интерактивных портфолио;
- сравнение Framer, Readymag, Webflow и кастомной реализации;
- инструкция экспорта Telegram;
- шаблон контента и инвентарь кейсов;
- план будущей MPSTATS-аналитики;
- техническая рекомендация для реализации;
- инструкции `AGENTS.md` и входная точка `CLAUDE.md`;
- протокол журналирования каждой содержательной AI-сессии.
