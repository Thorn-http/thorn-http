import { BrowserContext, Page } from "@playwright/test";
import { test, expect } from "./fixtures";

// Any website can post messages to the content script, the same way the page script does. These
// tests play the part of a hostile page and check the extension doesn't act on what it forges.

const seedRules = (app: Page, records: Record<string, unknown>) =>
  app.evaluate((items) => chrome.storage.local.set(items), records);

const dynamicResponseRule = {
  Response_security: {
    id: "Response_security",
    objectType: "rule",
    ruleType: "Response",
    status: "Active",
    name: "dynamic mock",
    pairs: [
      {
        id: "p1",
        source: { key: "Url", operator: "Contains", value: "/nothing-matches-this" },
        response: {
          type: "code",
          value: "function modifyResponse(args) { return args.response; }",
          resourceType: "restApi",
        },
      },
    ],
  },
};

/** What the page script sends when a page's CSP blocks a dynamic rule; a page can send it too. */
const postFromPage = (page: Page, data: Record<string, unknown>) =>
  page.evaluate((message) => window.postMessage({ source: "requestly:client", ...message }, "*"), data);

const scriptRanOn = async (context: BrowserContext, page: Page, url: string) => {
  await page.goto(url);
  await page.waitForTimeout(300);
  return page.evaluate(() => document.body.dataset.ran === "1");
};

test("a page can't lift the CSP of other sites", async ({ context, openApp, server }) => {
  const app = await openApp("/rules/my-rules");
  await seedRules(app, dynamicResponseRule);
  await app.waitForTimeout(1000);

  const page = await context.newPage();
  await page.goto(`${server.domainOrigin}/a`);
  // Forged "CSP error" naming another origin, and a filter that would match every URL.
  await postFromPage(page, { action: "onErrorOccurred", requestDetails: { initiator: server.origin } });
  await postFromPage(page, { action: "onErrorOccurred", requestDetails: { initiator: "|http" } });
  await page.waitForTimeout(1000);

  expect(await scriptRanOn(context, page, `${server.origin}/csp`)).toBe(false);
  const sessionRules = await app.evaluate(() => chrome.declarativeNetRequest.getSessionRules());
  expect(JSON.stringify(sessionRules)).not.toContain(server.origin);
});

test("a page's own CSP is still lifted for dynamic rules", async ({ context, openApp, server }) => {
  const app = await openApp("/rules/my-rules");
  await seedRules(app, dynamicResponseRule);
  await app.waitForTimeout(1000);

  const page = await context.newPage();
  expect(await scriptRanOn(context, page, `${server.origin}/csp`)).toBe(false);
  await postFromPage(page, { action: "onErrorOccurred", requestDetails: { initiator: "ignored" } });
  await page.waitForTimeout(1000);
  expect(await scriptRanOn(context, page, `${server.origin}/csp`)).toBe(true);
});

test("without a dynamic rule, no CSP is lifted", async ({ context, openApp, server }) => {
  const app = await openApp("/rules/my-rules");
  await seedRules(app, {
    Response_static: {
      ...dynamicResponseRule.Response_security,
      id: "Response_static",
      pairs: [{ ...dynamicResponseRule.Response_security.pairs[0], response: { type: "static", value: "{}" } }],
    },
  });
  await app.waitForTimeout(1000);

  const page = await context.newPage();
  await page.goto(`${server.origin}/csp`);
  await postFromPage(page, { action: "onErrorOccurred", requestDetails: {} });
  await page.waitForTimeout(1000);
  expect(await scriptRanOn(context, page, `${server.origin}/csp`)).toBe(false);
});

test("a page can't report rules that aren't running as applied", async ({ context, openApp, server, extensionId }) => {
  const app = await openApp("/rules/my-rules");
  // A real rule, but switched off: a page could learn its id from an export or a shared link.
  await seedRules(app, {
    Response_security: { ...dynamicResponseRule.Response_security, status: "Inactive", name: "switched off" },
  });
  await app.waitForTimeout(1000);

  const page = await context.newPage();
  await page.goto(`${server.origin}/a`);
  for (const id of ["Response_security", "Response_made_up"]) {
    await postFromPage(page, { action: "response_rule_applied", rule: { id }, requestDetails: { url: page.url() } });
  }
  await page.waitForTimeout(1000);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  const executed = await popup.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url: url + "*" });
    return new Promise<any>((resolve) =>
      chrome.runtime.sendMessage({ action: "getExecutedRules", tabId: tab.id }, resolve)
    );
  }, `${server.origin}/a`);
  expect(executed || []).toEqual([]);
});

test("blocked sites don't receive the rules", async ({ context, openApp, server }) => {
  const app = await openApp("/rules/my-rules");
  await seedRules(app, { ...dynamicResponseRule, blocked_domains: ["thorn.test"] });
  await app.waitForTimeout(1000);

  const readCachedRules = async (url: string) => {
    const page = await context.newPage();
    await page.goto(url);
    await page.waitForTimeout(800);
    const names = await page.evaluate(() =>
      ((window as any).__REQUESTLY__?.responseRules || []).map((rule: { name: string }) => rule.name)
    );
    await page.close();
    return names;
  };

  expect(await readCachedRules(`${server.domainOrigin}/a`)).toEqual([]);
  expect(await readCachedRules(`${server.origin}/a`)).toEqual(["dynamic mock"]);
});
