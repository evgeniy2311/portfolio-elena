# Портфолио Елены Бадьиной

Проект сайта-портфолио дизайнера карточек товаров для Wildberries и Ozon. Основная специализация — одежда и fashion-категории.

Выбрана визуальная концепция **B — Commerce Atelier**. Рабочий прототип включает главную, архив 12 DEMO-воронок и единый data-driven шаблон кейса. Реальные материалы портфолио пока ожидаются.

## Локальный запуск

```bash
npm install
npm run dev
```

Главная: `http://localhost:3000/`. Архив: `http://localhost:3000/works`. Демонстрационный кейс с исходниками: `http://localhost:3000/works/storm`. Старый путь `/cases/storm` перенаправляет на новый.

## Проверки и скриншоты

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run screenshots
```

Playwright проверяет доступность, навигацию, фильтры, условные секции, клавиатуру, touch, reduced motion и контрольные ширины от 320 до 1920 px. Скриншоты сохраняются в `artifacts/screenshots/final/`.

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

## Рабочий процесс

1. Получить портфолио из Telegram и заполнить инвентарь.
2. Заменить первый DEMO-кейс реальной разрешённой работой через `lib/portfolio.ts`.
3. Выбрать 4–6 главных кейсов и собрать доказательства.
4. Зафиксировать тексты, услуги и контактный сценарий.
5. После контентной проверки подготовить production-деплой.
