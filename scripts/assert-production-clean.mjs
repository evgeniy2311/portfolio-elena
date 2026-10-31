#!/usr/bin/env node
/*
 * Проверка готовой сборки: в production и export не должно быть тестовых данных стенда состояний
 * (tests/fixtures/site.ts): маркера, тестовых контактов, тестовых роликов.
 *   node scripts/assert-production-clean.mjs            .next (без dev-каталогов) и out/, если есть
 *   node scripts/assert-production-clean.mjs <каталог>  только указанные каталоги
 * Выход 1 и список файлов, если что-то найдено; выход 2, если проверять нечего.
 */
import fs from "node:fs";
import path from "node:path";

const markers = ["qa-fixture-sentinel", "qa_fixture_sentinel", "wa.me/10000000000", "qa-video.", "Тестовый ролик"];
const textTypes = new Set([".html", ".txt", ".js", ".mjs", ".cjs", ".json", ".css", ".rsc", ".map", ".xml", ".body", ".meta"]);
// Каталоги dev-серверов и кэш сборщика не попадают в production.
const skipped = new Set(["dev", "cache", "trace", "diagnostics"]);

const args = process.argv.slice(2);
const targets = args.length > 0 ? args.map((dir) => path.resolve(dir)) : [path.resolve(".next"), path.resolve("out")].filter((dir) => fs.existsSync(dir));

if (targets.length === 0 || targets.some((dir) => !fs.existsSync(dir))) {
  console.error(`assert-production-clean: нечего проверять (${targets.map((dir) => path.relative(process.cwd(), dir)).join(", ") || "нет .next и out"}). Сначала соберите сайт.`);
  process.exit(2);
}

const findings = [];
let scanned = 0;

function walk(dir, top) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (dir === top && skipped.has(entry.name)) continue;
      walk(file, top);
      continue;
    }
    if (/^qa-video\./.test(entry.name)) findings.push(`${file}: тестовый ролик`);
    if (!textTypes.has(path.extname(entry.name)) && path.extname(entry.name) !== "") continue;
    const text = fs.readFileSync(file, "utf8");
    scanned += 1;
    for (const marker of markers) if (text.includes(marker)) findings.push(`${path.relative(process.cwd(), file)}: «${marker}»`);
  }
}

for (const dir of targets) walk(dir, dir);

if (findings.length > 0) {
  console.error(`assert-production-clean: в сборке найдены тестовые данные (${findings.length}):\n${findings.slice(0, 40).join("\n")}`);
  process.exit(1);
}
console.log(`assert-production-clean: чисто, проверено файлов: ${scanned} (${targets.map((dir) => path.relative(process.cwd(), dir) || ".").join(", ")})`);
