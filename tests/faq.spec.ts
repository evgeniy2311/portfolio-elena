import { expect, test, type Page } from "@playwright/test";
import { faq } from "../components/blocks/faq/data";
import { go } from "./helpers/navigation";

/*
 * Частые вопросы «Breathing Accordion»: десять безопасных ответов, клавиатура и касание,
 * согласованность open и вида при быстрых повторных нажатиях, native details без движения.
 */

const section = "#faq";

/** Пока ответ закрывается, он ещё в дереве; после конца анимации open и вид совпадают. */
async function settled(page: Page, index: number, open: boolean) {
  const details = page.locator(`${section} details`).nth(index);
  if (open) {
    await expect(details).toHaveAttribute("open", "");
    await expect.poll(() => details.locator("p").evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(10);
  } else {
    await expect(details).not.toHaveAttribute("open", "");
    await expect(details.locator("p")).toBeHidden();
  }
}

test("десять вопросов: сезон, объёмы, сроки, правки, Lamoda и видео", async ({ page }) => {
  expect(faq).toHaveLength(10);
  await go(page, "/");
  const questions = await page.locator(`${section} summary`).allInnerTexts();
  expect(questions).toHaveLength(10);
  for (const topic of [/сезон/i, /объём/i, /Сколько ждать/, /правок/, /Lamoda/, /видео/i]) expect(questions.join(" | ")).toMatch(topic);
  await expect(page.locator(`${section} h2`)).toHaveText("Что обычно спрашивают");
  await expect(page.locator(`${section} a.button-ghost`)).toHaveText(/Задать вопрос/);
});

test("нет неподтверждённых сроков, числа правок и служебных пометок", async ({ page }) => {
  const text = faq.map((item) => `${item.q} ${item.a}`).join(" ");
  expect(text).not.toMatch(/подтвердить|Пока без ответа|\[|\]|обычно за|дней|N дней|длина ролика|формат и размер/i);
  expect(faq.find((item) => item.q === "Сколько ждать?")!.a).toBe("Срок назову сразу, как увижу вещь и задачу.");
  expect(faq.find((item) => item.q === "Сколько правок входит?")!.a).toBe("Если деталь не совпала с оригиналом, переделываю. Об остальных правках договоримся до начала работы.");
  await go(page, "/");
  expect(await page.locator(section).innerText()).not.toMatch(/подтвердить|—/);
});

test("Enter и пробел раскрывают и закрывают, состояние согласовано", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
  const summary = page.locator(`${section} summary`).first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await settled(page, 0, true);
  // Пока идёт закрытие, ответ ещё в дереве доступности: open снимается только после анимации. Порядок
  // изменений пишет MutationObserver на странице, поэтому проверка не зависит от скорости машины.
  await page.locator(`${section} details`).first().evaluate((details) => {
    const log: string[] = [];
    (window as unknown as { __faqLog: string[] }).__faqLog = log;
    new MutationObserver((mutations) => {
      for (const mutation of mutations) log.push(`${mutation.attributeName}=${details.getAttribute(mutation.attributeName!)} open=${(details as HTMLDetailsElement).open}`);
    }).observe(details, { attributes: true, attributeFilter: ["open", "data-state"] });
  });
  await page.keyboard.press("Space");
  await settled(page, 0, false);
  const log = await page.evaluate(() => (window as unknown as { __faqLog: string[] }).__faqLog);
  expect(log[0]).toBe("data-state=closing open=true");
  expect(log.at(-1)).toMatch(/open=false$/);
  await page.keyboard.press(" ");
  await settled(page, 0, true);
});

test("быстрые повторные нажатия: open и вид совпадают", async ({ page, isMobile }) => {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
  const summary = page.locator(`${section} summary`).nth(2);
  await summary.scrollIntoViewIfNeeded();
  const press = () => (isMobile ? summary.tap() : summary.click());
  for (let count = 0; count < 5; count += 1) await press();
  // Нечётное число нажатий: открыт.
  await page.waitForTimeout(500);
  await settled(page, 2, true);
  const state = await page.locator(`${section} details`).nth(2).getAttribute("data-state");
  expect(state === null || state === "open").toBe(true);
  await press();
  await press();
  await page.waitForTimeout(500);
  await settled(page, 2, true);
  await press();
  await page.waitForTimeout(500);
  await settled(page, 2, false);
});

test("браузер сам раскрыл ответ (поиск по странице): ответ виден, повторное нажатие закрывает", async ({ page }) => {
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
  await expect(page.locator(`${section} ul[data-acc="on"]`)).toHaveCount(1);
  const details = page.locator(`${section} details`).nth(4);
  await details.scrollIntoViewIfNeeded();
  // Так раскрывает details поиск по странице (auto-expand): open без клика по summary.
  await details.evaluate((element) => ((element as HTMLDetailsElement).open = true));
  await expect(details).toHaveAttribute("data-state", "open");
  await expect.poll(() => details.locator("p").evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1);
  await settled(page, 4, true);
  await details.locator("summary").click();
  await settled(page, 4, false);
  await expect(details).not.toHaveAttribute("data-state", /.+/);
  // И наоборот: браузер сам закрыл открытый ответ — состояние не остаётся «open».
  await details.locator("summary").click();
  await settled(page, 4, true);
  await details.evaluate((element) => ((element as HTMLDetailsElement).open = false));
  await expect(details).not.toHaveAttribute("data-state", /.+/);
});

test("reduced motion и без JS: обычные details, ответы доступны", async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go(page, "/");
  await expect(page.locator("html")).toHaveAttribute("data-cta", /show|hide/, { timeout: 30_000 });
  await expect(page.locator(`${section} ul`).first()).not.toHaveAttribute("data-acc", "on");
  await page.locator(`${section} summary`).nth(5).click();
  await settled(page, 5, true);

  const context = await browser.newContext({ javaScriptEnabled: false });
  const nojs = await context.newPage();
  await go(nojs, "/");
  await nojs.locator(`${section} summary`).nth(3).click();
  await expect(nojs.locator(`${section} details`).nth(3)).toHaveAttribute("open", "");
  await expect(nojs.locator(`${section} details`).nth(3).locator("p")).toBeVisible();
  await context.close();
});
