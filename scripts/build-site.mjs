#!/usr/bin/env node
/*
 * Единая сборка сайта для локального запуска и CI.
 *   npm run build                                      обычная сборка Next (сервер, proxy работает)
 *   NEXT_PUBLIC_BASE_PATH=/portfolio-elena npm run build  статичная сборка в out/ для GitHub Pages
 *
 * Статичный export не поддерживает Proxy (docs: static-exports.md), поэтому на время такой сборки
 * proxy.ts переименовывается и всегда возвращается на место: в finally, при сигнале и при ошибке Next.
 * Если от прерванной сборки осталась резервная копия, сборка не начинается и ничего не перезаписывает.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exportMode = Boolean(process.env.NEXT_PUBLIC_BASE_PATH);
const proxyFile = path.join(root, "proxy.ts");
const backupFile = path.join(root, ".proxy.ts.export-backup");
const lockFile = path.join(root, ".build-site.lock");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

function fail(message, code = 1) {
  console.error(`build-site: ${message}`);
  process.exit(code);
}

let lockFd = null;
let moved = false;
let restoreError = null;

function acquireLock() {
  try {
    lockFd = fs.openSync(lockFile, "wx");
    fs.writeSync(lockFd, String(process.pid));
  } catch (error) {
    if (error.code === "EEXIST") {
      fail(`уже идёт другая сборка (или прошлая прервалась): ${path.basename(lockFile)}. Если сборок нет, удалите этот файл.`);
    }
    throw error;
  }
}

function releaseLock() {
  if (lockFd === null) return;
  fs.closeSync(lockFd);
  lockFd = null;
  fs.rmSync(lockFile, { force: true });
}

/** Возвращает proxy.ts. Существующий оригинал никогда не перезаписывается. */
function restoreProxy() {
  if (!moved) return;
  if (fs.existsSync(proxyFile)) {
    restoreError = `proxy.ts появился во время сборки; резервная копия оставлена в ${path.basename(backupFile)}. Сравните файлы и удалите лишний вручную.`;
    return;
  }
  fs.renameSync(backupFile, proxyFile);
  moved = false;
}

function cleanup() {
  try {
    restoreProxy();
  } finally {
    releaseLock();
  }
}

// Последняя страховка: при любой неожиданной ошибке процесса proxy.ts и блокировка возвращаются.
process.on("exit", () => {
  try {
    cleanup();
  } catch {
    // Сообщение об ошибке уже выведено; резервная копия остаётся на диске.
  }
});

if (!fs.existsSync(nextBin)) fail(`не найден установленный Next: ${path.relative(root, nextBin)}. Выполните npm ci.`);
acquireLock();

if (exportMode && fs.existsSync(backupFile)) {
  releaseLock();
  fail(`найдена резервная копия proxy.ts от прерванной сборки: ${path.basename(backupFile)}. Верните её вручную (mv ${path.basename(backupFile)} proxy.ts), сборка ничего не перезаписывает.`);
}

if (exportMode && fs.existsSync(proxyFile)) {
  fs.renameSync(proxyFile, backupFile);
  moved = true;
}

const child = spawn(process.execPath, [nextBin, "build"], { cwd: root, stdio: "inherit", env: process.env });

const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
const onSignal = (signal) => {
  child.kill(signal);
};
for (const signal of signals) process.on(signal, onSignal);

child.on("error", (error) => {
  cleanup();
  fail(`не удалось запустить Next: ${error.message}`);
});

child.on("exit", (code, signal) => {
  for (const name of signals) process.off(name, onSignal);
  cleanup();
  if (restoreError) fail(restoreError, 3);
  if (signal) fail(`сборка прервана сигналом ${signal}`, 130);
  if (code !== 0) fail(`next build завершился с кодом ${code}`, code ?? 1);
});
