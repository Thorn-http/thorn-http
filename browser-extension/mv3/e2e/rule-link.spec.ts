import fs from "fs";
import path from "path";
import { BrowserContext, Page, chromium } from "@playwright/test";
import { test, expect, createRedirectRule, newRule, saveRule, typeInCodeEditor } from "./fixtures";

const SITE_DIR = path.join(__dirname, "..", "..", "..", "site");

/** Serves the website folder as https://thorn-http.dev, so the real rule-link page is tested offline. */
const serveWebsite = (context: BrowserContext) =>
  context.route("https://thorn-http.dev/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = pathname === "/r" ? "r.html" : pathname.slice(1);
    const filePath = path.join(SITE_DIR, file);
    if (!fs.existsSync(filePath)) return route.fulfill({ status: 404, body: "" });
    const contentType = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "text/javascript" : "text/css";
    return route.fulfill({ status: 200, contentType, body: fs.readFileSync(filePath) });
  });

type StoredRule = { id: string; name: string; status: string; ruleType: string; pairs: unknown[] };

const getStoredRules = (app: Page, name: string) =>
  app.evaluate(async (ruleName) => {
    const records = Object.values(await chrome.storage.local.get(null)) as StoredRule[];
    return records.filter((record) => record?.name === ruleName);
  }, name);

/** Creates a redirect rule and returns the share link shown for it in the Export modal. */
const createAndShareRule = async (openApp, server, name: string) => {
  await createRedirectRule(openApp, {
    name,
    source: `${server.domainOrigin}/a`,
    destination: `${server.domainOrigin}/b`,
  });
  const app = await openApp("/rules/my-rules");
  await app.click(".ant-table-row .ant-checkbox-input");
  await app.click('button:has-text("Share")');
  const linkInput = app.locator('[data-testid="share-rule-link"]');
  await expect(linkInput).toHaveValue(/^https:\/\/thorn-http\.dev\/r#1\./);
  const link = await linkInput.inputValue();
  await app.keyboard.press("Escape");
  return { app, link };
};

test("a rule shared as a link is previewed on the website and imported switched off", async ({
  context,
  openApp,
  server,
}) => {
  await serveWebsite(context);
  const { app, link } = await createAndShareRule(openApp, server, "shared redirect");

  const site = await context.newPage();
  await site.goto(link);
  await expect(site.locator("#rules")).toContainText("Redirect Request");
  await expect(site.locator("#rules")).toContainText("shared redirect");

  const [importPage] = await Promise.all([context.waitForEvent("page"), site.click("#thorn-import")]);
  await importPage.bringToFront();
  await expect(importPage.locator('[data-testid="import-rule-link-list"]')).toContainText("shared redirect");
  await importPage.click('button:has-text("Import 1 rule")');
  await importPage.waitForURL(/#\/rules\/my-rules/);

  const rules = await getStoredRules(app, "shared redirect");
  expect(rules).toHaveLength(2);
  const [original, imported] = rules[0].status === "Active" ? rules : [rules[1], rules[0]];
  expect(original.status).toBe("Active");
  expect(imported.status).toBe("Inactive");
  expect(imported.id).not.toBe(original.id);
  expect(JSON.stringify(imported.pairs)).toContain(`${server.domainOrigin}/b`);
});

test("a rule link can be pasted into the editor, and broken links are refused", async ({ openApp, server }) => {
  const { link } = await createAndShareRule(openApp, server, "pasted redirect");

  const app = await openApp("/rules/my-rules");
  await app.click('button:has-text("Import")');
  await app.click('button:has-text("Paste it here")');
  await app.waitForURL(/#\/rules\/import-link/);

  await app.fill('[placeholder="Paste a Thorn HTTP rule link"]', link.slice(0, -8));
  await app.click('button:has-text("Preview")');
  await expect(app.locator('[data-testid="import-rule-link-error"]')).toContainText("damaged");

  await app.fill('[placeholder="Paste a Thorn HTTP rule link"]', "https://example.com/not-a-rule-link");
  await app.click('button:has-text("Preview")');
  await expect(app.locator('[data-testid="import-rule-link-error"]')).toContainText("isn't a Thorn HTTP rule link");

  await app.fill('[placeholder="Paste a Thorn HTTP rule link"]', link);
  await app.click('button:has-text("Preview")');
  await expect(app.locator('[data-testid="import-rule-link-list"]')).toContainText("pasted redirect");
  await app.click('button:has-text("Import 1 rule")');
  await app.waitForURL(/#\/rules\/my-rules/);
  expect((await getStoredRules(app, "pasted redirect")).map((rule) => rule.status).sort()).toEqual([
    "Active",
    "Inactive",
  ]);
});

test("without the extension, the website offers the shared rules as a file", async ({ openApp, server }, testInfo) => {
  const { link } = await createAndShareRule(openApp, server, "file fallback");

  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
  const context = await browser.newContext({ acceptDownloads: true });
  await serveWebsite(context);
  const site = await context.newPage();

  await site.goto("https://thorn-http.dev/r#1.broken!");
  await expect(site.locator("#status")).toContainText("isn't a Thorn HTTP rule link");

  await site.goto(link);
  await site.reload(); // a hash-only navigation doesn't reload the page
  await expect(site.locator("#rules")).toContainText("file fallback");
  await expect(site.locator("#thorn-import")).toBeHidden();
  const [download] = await Promise.all([site.waitForEvent("download"), site.click("#download")]);
  const file = testInfo.outputPath("rules.json");
  await download.saveAs(file);
  const [record] = JSON.parse(fs.readFileSync(file, "utf8"));
  expect(record).toMatchObject({ name: "file fallback", ruleType: "Redirect", objectType: "rule", status: "Inactive" });
  expect(record.id).toMatch(/^Redirect_/);
  await browser.close();

  // The file imports like any export.
  const app = await openApp("/rules/my-rules");
  await app.click('button:has-text("Import")');
  await app.setInputFiles('.ant-modal input[type="file"]', file);
  await expect(app.locator(".ant-modal")).toContainText("Successfully parsed 1 rules");
  await app.click(".ant-modal .rq-modal-footer button");
  await expect
    .poll(async () => (await getStoredRules(app, "file fallback")).map((rule) => rule.status).sort())
    .toEqual(["Active", "Inactive"]);
});

test("importing a shared Insert Script rule warns that it runs code", async ({ openApp, server }) => {
  const editor = await newRule(openApp, "Script", "shared script", `${server.domainOrigin}/a`);
  await typeInCodeEditor(editor, "<script>console.log('hi')</script>");
  await saveRule(editor);
  await editor.evaluate(() => (location.hash = "#/rules/my-rules"));
  await editor.click(".ant-table-row .ant-checkbox-input");
  await editor.click('button:has-text("Share")');
  const link = await editor.locator('[data-testid="share-rule-link"]').inputValue();

  // The same screen the website's Import button opens.
  const importPage = await openApp(`/rules/import-link?d=${encodeURIComponent(link.split("#")[1])}`);
  await expect(importPage.locator('[data-testid="import-rule-link-list"]')).toContainText("shared script");
  await expect(importPage.locator(".ant-alert-warning")).toContainText("Insert Script rules, which run code");
});
