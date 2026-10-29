# Портфолио Елены Бадьиной

Проект сайта-портфолио дизайнера карточек товаров для Wildberries и Ozon. Основная специализация — одежда и fashion-категории.

Выбрана визуальная концепция **B — Commerce Atelier**. Сайт продаёт услугу: главная ведёт клиента от проблемы к предложению «2 кадра бесплатно», в архиве 17 реальных работ Елены, у каждой своя страница с исходниками и воронкой.

## Как запустить сайт на своём ноутбуке

Один раз установить:

1. **Node.js 22 или новее**: скачать LTS-версию с [nodejs.org](https://nodejs.org) и установить как обычную программу.
2. **Git**: на Mac он ставится сам при первой команде `git` (система предложит установить инструменты разработчика), на Windows: [git-scm.com](https://git-scm.com).

Скачать проект и запустить (в Терминале, по одной строке):

```bash
git clone https://github.com/evgeniy2311/portfolio-elena.git
cd portfolio-elena
npm ci
npm run dev
```

Открыть в браузере `http://localhost:3000`. Остановить сайт: `Ctrl + C` в Терминале.

Получить свежую версию позже:

```bash
cd portfolio-elena
git pull
npm ci
npm run dev
```

Что где менять:

- контакты (Telegram и запасной) и цены: `lib/site.ts`;
- тексты работ: `lib/works.ts`;
- фотографии работ: `public/works/<работа>/`, новые добавляются скриптом `scripts/import-works.mjs`.

## Проверки и скриншоты

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run screenshots
```

Playwright проверяет доступность, навигацию, фильтры, условные секции, клавиатуру, touch, reduced motion и контрольные ширины от 320 до 1920 px. 

## С чего начать

- [Текущий статус](STATUS.md)
- [Продуктовый бриф](docs/PRODUCT_BRIEF.md)
- [Три концепции сайта](docs/design/CONCEPTS.md)
- [Исследование и референсы](docs/research/REFERENCES.md)
- [Как подготовить портфолио](docs/content/CONTENT_GUIDE.md)
- [Как выгрузить Telegram](docs/import/TELEGRAM_EXPORT.md)
- [План проверки результатов через MPSTATS](docs/analytics/MPSTATS_PLAN.md)
- [Технический фундамент](docs/architecture/TECHNICAL_FOUNDATION.md)

## Структура

```text
.
├── AGENTS.md                 # единые инструкции для AI-агентов
├── CLAUDE.md                 # входная точка Claude → AGENTS.md
├── STATUS.md                 # актуальное состояние и следующий шаг
├── CHANGELOG.md              # история существенных изменений
├── assets/
│   └── inbox/                # временные входные файлы, не коммитятся
├── content/
│   └── cases/                # будущие структурированные кейсы
├── data/
│   └── imports/              # сырые выгрузки, не коммитятся
├── design-system/            # дизайн-система после выбора концепции
└── docs/
    ├── analytics/
    ├── architecture/
    ├── content/
    ├── design/
    ├── import/
    ├── research/
    └── sessions/
```

## Что осталось до публикации

1. Вписать Telegram Елены и запасной контакт для России в `lib/site.ts`.
2. Подтвердить цены «от» для четырёх пакетов (там же).
3. Подтвердить, что работы можно показывать публично.
4. Выбрать хостинг и домен, затем production-деплой.
