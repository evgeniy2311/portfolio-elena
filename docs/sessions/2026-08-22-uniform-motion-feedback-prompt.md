# Сессия: prompt для равномерной motion-системы

Дата: 2026-08-22

## Цель

Перевести второй раунд пользовательской обратной связи в точный исполняемый prompt для новой сессии, не меняя код сайта.

## Полученная обратная связь

- hero раскрывает соседние фотографии через заметно разное количество wheel-scroll;
- пользователь требует одинаковое физическое расстояние между каждым появлением;
- тот же scroll-язык нужен блоку dark coat;
- windbreaker и color coat также должны получить внутренние photo reveals;
- motion должен оставаться равномерным во всех секциях;
- mobile и частично открытое окно нужно проверить самостоятельно;
- в compare section фотография заходит на крупный заголовок при промежуточной ширине.

## Диагностика

- hero использует неодинаковые интервалы complete points: после frame 02 оставлен особенно длинный plateau перед frame 03;
- `DarkCoatMotion` включается только от 1100 px, поэтому compact laptop может видеть статичный блок;
- windbreaker и color coat имеют только общее section reveal, отдельные фотографии не привязаны к scroll progress;
- `.compareGrid` становится двухколоночной от 900 px и резервирует правой колонке минимум 480 px, что оставляет недостаточно места крупному display heading;
- пользовательский screenshot визуально подтверждает collision.

## Результат

- полностью переписан `docs/NEXT_SESSION_PROMPT.md`;
- задан общий equal-step motion contract;
- добавлены измеримые допуски 5 процентов и real-wheel acceptance;
- описаны отдельные choreography-задачи для четырёх photo stories;
- добавлена точная responsive collision matrix;
- предусмотрены mobile, half-window, reduced motion, no-JS, performance и полный route regression audit;
- обновлены STATUS, CHANGELOG, DECISIONS и CONTENT_INVENTORY;
- код, изображения и production build не изменялись.

## Следующий шаг

После дополнительной проверки пользователя открыть новую сессию в `/Users/evgeniy/Projects/Portfolio Elena Scroll Test` и передать ей полное содержимое `docs/NEXT_SESSION_PROMPT.md`.
