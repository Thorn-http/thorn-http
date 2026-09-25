import { test, expect, newRule, saveRule } from "./fixtures";

test("page loads are delayed locally, then load with the other rules still applied", async ({
  context,
  openApp,
  server,
}) => {
  const delay = await newRule(openApp, "Delay", "delay page", "/echo");
  await delay.fill('[data-selectionid="delay-value"]', "2000");
  await saveRule(delay);

  const headers = await newRule(openApp, "Headers", "header on delayed page", "/echo");
  await headers.click('button:has-text("Add Request Header")');
  await headers.fill('[data-selectionid="header-name"]', "X-Thorn");
  await headers.fill('[data-selectionid="header-value"]', "still-applied");
  await saveRule(headers);

  const page = await context.newPage();
  const start = Date.now();
  await page.goto(`${server.domainOrigin}/echo?keep=1`);
  // The local delay page shows the countdown and the address...
  await expect(page.locator("h1")).toHaveText("Thorn HTTP is delaying this page");
  await expect(page.locator("#url")).toHaveText(`${server.domainOrigin}/echo?keep=1`);
  // ...then loads it once, unchanged (no marker left in the URL), with the header rule applied.
  await page.waitForURL(`${server.domainOrigin}/echo?keep=1`, { timeout: 10000 });
  expect(Date.now() - start).toBeGreaterThanOrEqual(1900);
  const echo = JSON.parse(await page.evaluate(() => document.body.innerText));
  expect(echo.url).toBe("/echo?keep=1");
  expect(echo.headers["x-thorn"]).toBe("still-applied");
});

test("'Load now' skips the rest of the delay", async ({ context, openApp, server }) => {
  const delay = await newRule(openApp, "Delay", "long delay", "/b");
  await delay.fill('[data-selectionid="delay-value"]', "600000");
  await saveRule(delay);

  const page = await context.newPage();
  await page.goto(`${server.domainOrigin}/b`);
  await expect(page.locator("#countdown")).toContainText("10 min");
  await page.click("#load-now");
  await expect(page.locator("#page")).toHaveText("PAGE-B");
});

test("delays over 10 minutes are refused by the editor", async ({ openApp }) => {
  const editor = await newRule(openApp, "Delay", "too long", "/b");
  await editor.fill('[data-selectionid="delay-value"]', "600001");
  await editor.click('button:has-text("Save rule")');
  await expect(editor.getByText("Delay should lie between 1 and 600000 ms (10 minutes)")).toBeVisible();
});

/** Loads /script-page and returns when its script ran, in ms from the start of navigation. */
const scriptLoadTime = async (context, url: string) => {
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForFunction(() => (window as any).scriptRanAt !== undefined, null, { timeout: 15000 });
  const ranAt = await page.evaluate(() => (window as any).scriptRanAt);
  await page.close();
  return ranAt;
};

const createScriptDelayRule = async (openApp, delayMs: string) => {
  const editor = await newRule(openApp, "Delay", "delay script", "/slow.js");
  await editor.fill('[data-selectionid="delay-value"]', delayMs);
  await saveRule(editor);
  return editor;
};

test("without permission, scripts aren't delayed and the editor explains why", async ({ context, openApp, server }) => {
  const editor = await createScriptDelayRule(openApp, "2000");

  const consent = editor.locator('[data-testid="subresource-delay-consent"]');
  await expect(consent).toHaveAttribute("data-state", "off");
  await expect(consent).toContainText("not delayed: that needs your permission to use Chrome's debugger");

  await consent.getByRole("button", { name: "Review and allow…" }).click();
  const explanation = editor.locator('[data-testid="subresource-delay-explanation"]');
  await expect(explanation).toContainText("Thorn HTTP started debugging this browser");
  await expect(explanation).toContainText("Nothing is read, stored or sent anywhere");
  await expect(explanation).toContainText("chrome://extensions");
  await editor.getByRole("button", { name: "Not now" }).click();

  expect(await scriptLoadTime(context, `${server.domainOrigin}/script-page`)).toBeLessThan(1500);
});

test.describe("with the debugger permission granted", () => {
  test.use({ grantDebugger: true });

  test("scripts are delayed locally", async ({ context, openApp, server }) => {
    const editor = await createScriptDelayRule(openApp, "2000");
    await expect(editor.locator('[data-testid="subresource-delay-consent"]')).toHaveAttribute("data-state", "on");
    await editor.waitForTimeout(500);

    expect(await scriptLoadTime(context, `${server.domainOrigin}/script-page`)).toBeGreaterThanOrEqual(1900);
  });

  test("closing Chrome's debugging bar pauses script delays until resumed", async ({ context, openApp, server }) => {
    const editor = await createScriptDelayRule(openApp, "2000");
    // What the service worker records when the bar is closed (Chrome detaches with "canceled_by_user").
    await editor.evaluate(() => chrome.storage.session.set({ subresource_delay_paused: true }));

    const consent = editor.locator('[data-testid="subresource-delay-consent"]');
    await expect(consent).toHaveAttribute("data-state", "paused");
    await editor.waitForTimeout(500);
    expect(await scriptLoadTime(context, `${server.domainOrigin}/script-page`)).toBeLessThan(1500);

    await consent.getByRole("button", { name: "Resume" }).click();
    await expect(consent).toHaveAttribute("data-state", "on");
    await editor.waitForTimeout(500);
    expect(await scriptLoadTime(context, `${server.domainOrigin}/script-page`)).toBeGreaterThanOrEqual(1900);
  });
});

test("every Delay rule applies to fetch requests, not only the first one", async ({ context, openApp, server }) => {
  const first = await newRule(openApp, "Delay", "unrelated delay", "/nothing-matches");
  await first.fill('[data-selectionid="delay-value"]', "100");
  await saveRule(first);
  const second = await newRule(openApp, "Delay", "echo delay", "/echo");
  await second.fill('[data-selectionid="delay-value"]', "1500");
  await saveRule(second);

  const page = await context.newPage();
  await page.goto(`${server.domainOrigin}/a`);
  await page.waitForTimeout(500);
  const elapsed = await page.evaluate(async () => {
    const start = performance.now();
    await fetch("/echo");
    return performance.now() - start;
  });
  expect(elapsed).toBeGreaterThanOrEqual(1400);
});
