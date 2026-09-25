import { BrowserContext, Page } from "@playwright/test";
import { test, expect, newRule, saveRule, createRedirectRule, typeInCodeEditor } from "./fixtures";

// Thorn HTTP must work fully offline: no feature may contact, redirect to or open any other server.
// These tests use the features the way a user does and fail on any request or tab that leaves the
// machine (such requests are aborted, so nothing is actually sent).

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "thorn.test"];
const RULE_TYPES = [
  "Redirect",
  "Replace",
  "QueryParam",
  "Headers",
  "UserAgent",
  "Request",
  "Response",
  "Script",
  "Cancel",
  "Delay",
];

const isExternal = (url: string) => {
  const { protocol, hostname } = new URL(url);
  if (["chrome-extension:", "chrome-error:", "data:", "blob:", "about:", "chrome:", "devtools:"].includes(protocol))
    return false;
  return !LOCAL_HOSTS.includes(hostname);
};

/** Records (and aborts) every request, and every tab, that goes to another server. */
const trackExternalTraffic = async (context: BrowserContext) => {
  const external: string[] = [];
  await context.route(
    (url) => isExternal(url.href),
    (route) => {
      external.push(route.request().url());
      return route.abort();
    }
  );
  const watchPage = (page: Page) => {
    page.on("framenavigated", (frame) => {
      if (frame.url() && isExternal(frame.url())) external.push(`tab: ${frame.url()}`);
    });
    // Extension pages block other servers with their CSP: a blocked load means something tried.
    page.on("console", (message) => {
      if (/Refused to (connect|load|frame)/.test(message.text())) external.push(`CSP: ${message.text()}`);
    });
  };
  context.pages().forEach(watchPage);
  context.on("page", watchPage);
  return external;
};

const sendToExtension = (page: Page, message: Record<string, unknown>) =>
  page.evaluate(
    (msg) => new Promise<any>((resolve) => chrome.runtime.sendMessage(msg, resolve)),
    message
  );

test("rules run without contacting any other server", async ({ context, openApp, server }) => {
  const external = await trackExternalTraffic(context);

  // Delay with no request type filter also applies to page loads, scripts, images...
  let editor = await newRule(openApp, "Delay", "delay everything", "/a");
  await editor.fill('[data-selectionid="delay-value"]', "300");
  await saveRule(editor);

  await createRedirectRule(openApp, {
    name: "redirect",
    source: "/b-redirect",
    destination: `${server.domainOrigin}/a`,
  });

  editor = await newRule(openApp, "Response", "mock");
  await editor.click("text=REST API");
  await editor.fill('[data-selectionid="source-value"]', "/post.json");
  await typeInCodeEditor(editor, '{"title":"mocked"}');
  await saveRule(editor);

  editor = await newRule(openApp, "Headers", "headers", "/");
  await editor.click('button:has-text("Add Request Header")');
  await editor.fill('[data-selectionid="header-name"]', "X-Test");
  await editor.fill('[data-selectionid="header-value"]', "1");
  await saveRule(editor);

  const page = await context.newPage();
  for (const path of ["/a", "/b-redirect", "/blog", "/with-fetch"]) {
    await page.goto(`${server.domainOrigin}${path}`).catch(() => {}); // an aborted redirect fails the load
    await page.waitForTimeout(800);
  }

  expect(external).toEqual([]);
  await page.goto(`${server.domainOrigin}/blog`);
  await expect(page.locator("#now")).toContainText("mocked");
});

test("recording the network, from start to stop, stays local", async ({ context, extensionId, server }) => {
  const external = await trackExternalTraffic(context);

  const panel = await context.newPage();
  await panel.goto(`chrome-extension://${extensionId}/sidepanel/network-recording/index.html`);

  // The real popup has no tab and closes as soon as it loses focus: use a popup window, closed
  // before stopping, so the recording has no tab or window to return to.
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    panel.evaluate(
      (url) => chrome.windows.create({ url, type: "popup", width: 400, height: 600 }),
      `chrome-extension://${extensionId}/popup/popup.html`
    ),
  ]);
  await popup.waitForURL(/popup\/popup\.html/);
  await popup.waitForLoadState();
  const start = await sendToExtension(popup, {
    action: "startNetworkRecording",
    url: `${server.domainOrigin}/with-fetch`,
  });
  expect(start.success).toBe(true);
  await panel.waitForTimeout(1500);
  await popup.close(); // closes its window too

  await sendToExtension(panel, { action: "stopNetworkRecording", targetTabId: start.targetTabId });
  await panel.waitForTimeout(2000);

  expect(external).toEqual([]);
});

test("every screen of the extension stays local", async ({ context, openApp, extensionId }) => {
  const external = await trackExternalTraffic(context);

  const app = await openApp("/rules/my-rules");
  await expect(app.getByText("Create new rule")).toBeVisible();
  const paths = [
    "/rules/templates",
    "/rules/import-link",
    "/settings/global-settings",
    ...RULE_TYPES.map((type) => `/rules/editor/create/${type}`),
  ];
  for (const path of paths) {
    await app.evaluate((hash) => (location.hash = hash), `#${path}`);
    await app.waitForTimeout(1000);
  }

  // The Delay rule's explanation of the optional debugger permission.
  await app.evaluate(() => (location.hash = "#/rules/editor/create/Delay"));
  await app.waitForTimeout(800);
  await app.getByRole("button", { name: "Review and allow…" }).click();
  await app.waitForTimeout(500);
  await app.getByRole("button", { name: "Not now" }).click();

  // Template previews render example rules, with images and links.
  await app.evaluate(() => (location.hash = "#/rules/templates"));
  await app.waitForTimeout(800);
  await app.locator(".ant-table-row").first().click();
  await app.waitForTimeout(1000);
  await app.keyboard.press("Escape");

  for (const page of ["popup/popup.html", "devtools/index.html", "sidepanel/network-recording/index.html"]) {
    const extensionPage = await context.newPage();
    await extensionPage.goto(`chrome-extension://${extensionId}/${page}`);
    await extensionPage.waitForTimeout(1000);
    await extensionPage.close();
  }

  expect(external).toEqual([]);
});
