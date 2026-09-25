import { Page } from "@playwright/test";
import { test, expect, readPage, newRule, saveRule } from "./fixtures";

type StoredRule = { id: string; name: string; status: string; expiresAt?: number };

/** Reads a rule straight from the extension storage (any extension page can). */
const getStoredRule = (app: Page, name: string) =>
  app.evaluate(async (ruleName) => {
    const records = Object.values(await chrome.storage.local.get(null)) as StoredRule[];
    return records.find((record) => record?.name === ruleName);
  }, name);

const updateStoredRule = (app: Page, rule: StoredRule) =>
  app.evaluate((record) => chrome.storage.local.set({ [record.id]: record }), rule);

/** Text inside a widget's closed shadow root, read through CDP (page scripts and locators can't reach it). */
const readWidgetText = async (page: Page, tagName: string) => {
  type DomNode = {
    nodeName: string;
    nodeType: number;
    nodeValue: string;
    children?: DomNode[];
    shadowRoots?: DomNode[];
  };
  const cdp = await page.context().newCDPSession(page);
  const { root } = (await cdp.send("DOM.getDocument", { depth: -1, pierce: true })) as { root: DomNode };
  await cdp.detach();

  const texts: string[] = [];
  const collect = (node: DomNode, inside: boolean) => {
    const isWidget = inside || node.nodeName === tagName.toUpperCase();
    if (isWidget && node.nodeType === 3) texts.push(node.nodeValue);
    [...(node.children || []), ...(node.shadowRoots || [])].forEach((child) => collect(child, isWidget));
  };
  collect(root, false);
  return texts.join(" ");
};

const createRedirectWithTimer = async (openApp, server, name: string, timerLabel?: string) => {
  const editor = await newRule(openApp, "Redirect", name, `${server.domainOrigin}/a`);
  await editor.fill('[data-selectionid="destination-url"]', `${server.domainOrigin}/b`);
  if (timerLabel) {
    await editor.click('[data-testid="rule-auto-disable"] .ant-select-selector');
    await editor.click(`.ant-select-item-option:has-text("${timerLabel}")`);
  }
  await saveRule(editor);
  return editor;
};

test("a rule with an auto-disable timer switches itself off when the time is up", async ({
  context,
  openApp,
  server,
}) => {
  const editor = await createRedirectWithTimer(openApp, server, "timed redirect", "Turn off in 15 minutes");

  const saved = await getStoredRule(editor, "timed redirect");
  expect(saved.status).toBe("Active");
  expect(saved.expiresAt - Date.now()).toBeGreaterThan(14 * 60 * 1000);
  expect(saved.expiresAt - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000);
  await expect(editor.locator('[data-testid="rule-auto-disable"]')).toContainText("Off in 15 min");
  expect(await readPage(context, `${server.domainOrigin}/a`)).toBe("PAGE-B");

  // The rules list shows the countdown next to the status switch.
  const list = await openApp("/rules/my-rules");
  await expect(list.locator('[data-testid="rule-expiry-indicator"]')).toContainText("15 min");

  // Bring the expiry forward instead of waiting 15 minutes.
  await updateStoredRule(list, { ...saved, expiresAt: Date.now() + 2000 });
  await expect
    .poll(async () => (await getStoredRule(list, "timed redirect")).status, { timeout: 15000 })
    .toBe("Inactive");

  expect((await getStoredRule(list, "timed redirect")).expiresAt).toBeUndefined();
  expect(await readPage(context, `${server.domainOrigin}/a`)).toBe("PAGE-A");
});

test("a rule turned off by hand drops its timer and stays on when turned back on", async ({
  context,
  openApp,
  server,
}) => {
  const editor = await createRedirectWithTimer(openApp, server, "manual toggle", "Turn off in 1 hour");
  const saved = await getStoredRule(editor, "manual toggle");

  // Turned off by hand, then its time passes while it is off.
  await updateStoredRule(editor, { ...saved, status: "Inactive", expiresAt: Date.now() + 1500 });
  await expect
    .poll(async () => (await getStoredRule(editor, "manual toggle")).expiresAt, { timeout: 15000 })
    .toBeUndefined();

  // Turning it back on later must not switch it straight off again.
  await updateStoredRule(editor, { ...(await getStoredRule(editor, "manual toggle")), status: "Active" });
  await editor.waitForTimeout(2500);
  expect((await getStoredRule(editor, "manual toggle")).status).toBe("Active");
  expect(await readPage(context, `${server.domainOrigin}/a`)).toBe("PAGE-B");
});

test("choosing 'Keep on' removes the timer", async ({ openApp, server }) => {
  const editor = await createRedirectWithTimer(openApp, server, "keep on", "Turn off in 4 hours");
  expect((await getStoredRule(editor, "keep on")).expiresAt).toBeGreaterThan(Date.now());

  await editor.click('[data-testid="rule-auto-disable"] .ant-select-selector');
  await editor.click('.ant-select-item-option:has-text("Keep on")');
  await editor.click('button:has-text("Save rule")');
  await editor.waitForTimeout(1000);

  expect((await getStoredRule(editor, "keep on")).expiresAt).toBeUndefined();
  await expect(editor.locator('[data-testid="rule-auto-disable"]')).toContainText("Keep on");
});

test("pages show which rules were applied to them, with rule names escaped", async ({ context, openApp, server }) => {
  const name = `<img src=x onerror="window.__thornXss=1">`;
  await createRedirectWithTimer(openApp, server, name);

  const page = await context.newPage();
  await page.goto(`${server.domainOrigin}/a`);
  await expect
    .poll(() => readWidgetText(page, "rq-implicit-test-rule-widget"), { timeout: 10000 })
    .toContain("Rules applied on this page");
  // Escaped: the name shows up as text instead of becoming an <img> element.
  expect(await readWidgetText(page, "rq-implicit-test-rule-widget")).toContain(name);
  expect(await page.evaluate(() => (window as any).__thornXss)).toBeUndefined();
});
