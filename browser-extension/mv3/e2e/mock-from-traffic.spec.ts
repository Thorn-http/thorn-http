import { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

const sendToExtension = (page: Page, message: Record<string, unknown>) =>
  page.evaluate(
    (msg) => new Promise<any>((resolve) => chrome.runtime.sendMessage(msg, resolve)),
    message
  );

/** Records /traffic and returns the side panel showing its requests. */
const recordTraffic = async (context, extensionId: string, server) => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  const start = await sendToExtension(popup, { action: "startNetworkRecording", url: `${server.origin}/traffic` });
  expect(start.success).toBe(true);

  const panel = await context.newPage();
  await panel.goto(
    `chrome-extension://${extensionId}/sidepanel/network-recording/index.html?tabId=${start.targetTabId}`
  );
  await expect(panel.locator(".network-row", { hasText: "/missing.json" })).toBeVisible({ timeout: 10000 });
  return panel;
};

/** Clicks "Mock" on the row for `path` and returns the rule editor it opens. */
const createMock = async (context, panel: Page, path: string) => {
  const row = panel.locator(".network-row", { hasText: path }).first();
  const [editor] = await Promise.all([context.waitForEvent("page"), row.getByTestId("create-mock").click()]);
  await editor.waitForURL(/#\/rules\/editor\/create\/Response/);
  await editor.bringToFront();
  return editor;
};

test("a recorded response becomes a mock rule, filled with the real response", async ({
  context,
  extensionId,
  server,
}) => {
  const panel = await recordTraffic(context, extensionId, server);
  const editor = await createMock(context, panel, "/post.json");

  await expect(editor.locator('[data-selectionid="source-value"]')).toHaveValue(`${server.origin}/post.json`);
  await expect(editor.locator('[placeholder="Enter rule name"]')).toHaveValue("Mock GET /post.json");
  await expect(editor.locator(".cm-content").first()).toContainText('"title": "original"');

  // Edit the real response and save: the page now gets the mock.
  await editor.locator(".cm-content").first().click();
  await editor.keyboard.press("ControlOrMeta+A");
  await editor.keyboard.insertText('{"title":"from recorded traffic"}');
  await editor.click('button:has-text("Save rule")');
  await editor.waitForURL(/#\/rules\/editor\/edit\//);
  await editor.waitForTimeout(1000);

  const page = await context.newPage();
  await page.goto(`${server.origin}/blog`);
  await expect(page.locator("#now")).toContainText("from recorded traffic");
});

/** Saves the rule open in `editor` and returns it as stored. */
const saveAndRead = async (editor: Page) => {
  await editor.click('button:has-text("Save rule")');
  await editor.waitForURL(/#\/rules\/editor\/edit\//);
  const ruleId = editor.url().split("/").pop();
  return editor.evaluate(async (id) => (await chrome.storage.local.get(id))[id], ruleId);
};

test("the mock keeps the method and an error status", async ({ context, extensionId, server }) => {
  const panel = await recordTraffic(context, extensionId, server);

  const postMock = await createMock(context, panel, "/echo");
  await expect(postMock.locator('[placeholder="Enter rule name"]')).toHaveValue("Mock POST /echo");
  const postRule = await saveAndRead(postMock);
  expect(postRule.pairs[0].source.filters[0].requestMethod).toEqual(["POST"]);
  expect(postRule.pairs[0].response.statusCode).toBe("");

  const errorMock = await createMock(context, panel, "/missing.json");
  await expect(errorMock.locator(".cm-content").first()).toContainText('"error": "not found"');
  const errorRule = await saveAndRead(errorMock);
  expect(errorRule.name).toBe("Mock GET /missing.json");
  expect(errorRule.pairs[0].response.statusCode).toBe("404");
  expect(errorRule.pairs[0].source.filters?.[0]?.requestMethod ?? []).toEqual([]);
});
