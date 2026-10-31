import { expect, test } from "@playwright/test";
import { contactLinks, intentMessages, safeTelegram, safeWhatsapp, telegramHref, whatsappHref } from "../lib/site";
import { go, isPages } from "./helpers/navigation";

/*
 * Контакты: честные состояния без подтверждённых адресов и готовые ссылки с сообщением.
 * Тестовые адреса даёт dev-стенд состояний на 3001 (NEXT_PUBLIC_QA_FIXTURE=contacts), в сборку они не попадают.
 */

test.describe("без подтверждённых адресов", () => {
  for (const route of ["/", "/works"]) {
    test(`${route}: обе кнопки фокусируемые, aria-disabled, без ссылки, с пояснением`, async ({ page }) => {
      await go(page, route);
      const block = page.locator("#contact");
      for (const name of ["Telegram: адрес скоро появится", "WhatsApp: ссылка скоро появится"]) {
        const button = block.getByRole("button", { name });
        await expect(button).toHaveAttribute("aria-disabled", "true");
        await expect(button).not.toHaveAttribute("href", /.*/);
        await button.focus();
        await expect(button).toBeFocused();
        const helperId = await button.getAttribute("aria-describedby");
        await expect(page.locator(`#${helperId}`)).toHaveText("Контакты уточняются. Кнопки заработают после подтверждения.");
      }
      await expect(block.locator("a[href^='https://t.me'], a[href^='https://wa.me']")).toHaveCount(0);
      await expect(block).not.toContainText("Или на почту");
      await expect(block.locator(".eyebrow")).toHaveText("Связаться");
      // Надзаголовок на wine-deep шампанью, не вином (ошибка v2).
      expect(await block.locator(".eyebrow").evaluate((element) => getComputedStyle(element).color)).toBe("rgb(217, 184, 146)");
    });
  }
});

test.describe("правила адресов", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "Чистые функции, ширина экрана не важна");
  });

  test("подтверждён только Telegram: WhatsApp честно выключен", () => {
    const links = contactLinks({ telegram: "https://t.me/elena_badyina", whatsapp: null, email: null });
    expect(links.telegram).toBe(`https://t.me/elena_badyina?text=${encodeURIComponent(intentMessages.project)}`);
    expect(links.whatsapp).toBeNull();
    expect(links.email).toBeNull();
  });

  test("неверная схема, хост или путь не активируют ссылку", () => {
    for (const bad of ["http://t.me/elena_badyina", "https://t.me.evil.example/elena_badyina", "https://evil.example/t.me/elena", "javascript:alert(1)", "https://t.me/elena_badyina/extra", "https://t.me/x", "https://user@t.me/elena_badyina", "https://t.me/elena_badyina?start=1", "", "t.me/elena_badyina"]) {
      expect(safeTelegram(bad), bad).toBeNull();
      expect(telegramHref("trial", bad), bad).toBeNull();
    }
    for (const bad of ["https://wa.me/abc", "https://wa.me/7900/1234567", "http://wa.me/79001234567", "https://api.whatsapp.com/send?phone=79001234567", "https://wa.me/+79001234567", "https://wa.me/79001234567?text=x", "https://wa.me.evil.example/79001234567"]) {
      expect(safeWhatsapp(bad), bad).toBeNull();
      expect(whatsappHref("project", bad), bad).toBeNull();
    }
    expect(safeWhatsapp("https://wa.me/79001234567")).toBe("https://wa.me/79001234567");
  });

  test("сообщения для каждого повода кодируются в адресе", () => {
    for (const intent of ["trial", "project", "season", "video", "question"] as const) {
      const href = telegramHref(intent, "https://t.me/elena_badyina")!;
      expect(new URL(href).searchParams.get("text")).toBe(intentMessages[intent]);
      expect(href).not.toContain(" ");
    }
    expect(contactLinks({ telegram: null, whatsapp: null, email: "" }).email).toBeNull();
    expect(contactLinks({ telegram: null, whatsapp: null, email: "not an email" }).email).toBeNull();
    expect(contactLinks({ telegram: null, whatsapp: null, email: "elena@example.com" }).email).toBe("elena@example.com");
    // ? и & открывают заголовки mailto (cc, bcc, body): такой адрес отвергается.
    for (const bad of ["elena@example.com?cc=x@y.ru", "elena@example.com?bcc=x@y.ru&body=hi", "a&b@example.com", "elena@exa&mple.com", "elena@example.com#x", "el%0Aena@example.com"]) {
      expect(contactLinks({ telegram: null, whatsapp: null, email: bad }).email, bad).toBeNull();
    }
  });
});

test.describe("стенд с тестовыми контактами", () => {
  test.skip(isPages, "Тестовые данные есть только на dev-стенде");
  test.use({ baseURL: "http://127.0.0.1:3001" });

  test("Telegram и WhatsApp: готовые ссылки с сообщением, новая вкладка, noopener; номера на странице нет", async ({ page }) => {
    await page.goto("/");
    const block = page.locator("#contact");
    const telegram = block.getByRole("link", { name: "Написать в Telegram" });
    const whatsapp = block.getByRole("link", { name: "Написать в WhatsApp" });
    await expect(telegram).toHaveAttribute("href", `https://t.me/qa_fixture_sentinel?text=${encodeURIComponent(intentMessages.project)}`);
    await expect(whatsapp).toHaveAttribute("href", `https://wa.me/10000000000?text=${encodeURIComponent(intentMessages.project)}`);
    for (const link of [telegram, whatsapp]) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
    await expect(block.locator("[aria-disabled='true']")).toHaveCount(0);
    await expect(page.locator("#contact-pending")).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toContain("10000000000");
    await expect(block).not.toContainText("Или на почту");
    // Пробная кнопка ведёт в Telegram с сообщением пробы.
    const trial = page.locator("main a", { hasText: /2 кадра бесплатно/ }).first();
    await expect(trial).toHaveAttribute("href", `https://t.me/qa_fixture_sentinel?text=${encodeURIComponent(intentMessages.trial)}`);
  });
});
