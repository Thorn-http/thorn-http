import { Page } from "@playwright/test";
import { test, expect, newRule, saveRule } from "./fixtures";

const openTestModal = async (editor: Page, url: string) => {
  await editor.click('button:has-text("Test URL")');
  await editor.fill('[placeholder="https://www.example.com"]', url);
  return editor.locator('[data-testid="match-checklist"]');
};

const chooseOption = async (editor: Page, testId: string, label: string) => {
  await editor.click(`[data-testid="${testId}"] .ant-select-selector`);
  await editor.click(`.ant-select-item-option:has-text("${label}")`);
};

test("testing a URL explains why the condition doesn't match", async ({ openApp, server }) => {
  const editor = await newRule(openApp, "Redirect", "case mismatch", "/API/");
  await editor.fill('[data-selectionid="destination-url"]', `${server.domainOrigin}/b`);

  const checklist = await openTestModal(editor, `${server.domainOrigin}/api/posts`);
  await expect(checklist).toContainText("The rule won't apply to this request");
  await expect(checklist.locator('[data-check="condition"]')).toContainText(`The URL doesn't contain "/API/"`);
  await expect(checklist.locator('[data-check="condition"]')).toContainText("matching is case-sensitive");

  // Fixing the condition inside the modal updates the verdict.
  await editor.fill('.test-url-modal [placeholder="Enter source URL"]', "/api/");
  await expect(checklist).toContainText("The rule applies to this request");
});

test("testing explains that API response rules only change fetch/XHR requests", async ({ openApp, server }) => {
  const editor = await newRule(openApp, "Response", "api mock");
  await editor.click("text=REST API");
  await editor.fill('[data-selectionid="source-value"]', "posts");

  const checklist = await openTestModal(editor, `${server.domainOrigin}/posts`);
  await expect(checklist).toContainText("The rule applies to this request");
  await expect(checklist.locator('[data-check="devtools"]')).toContainText("DevTools Network tab still shows");

  await chooseOption(editor, "test-url-resource-type", "Page load");
  await expect(checklist).toContainText("The rule won't apply to this request");
  await expect(checklist.locator('[data-check="ruleType"]')).toContainText("only changes fetch / XHR requests");
});

test("testing reports a disabled rule and blocked sites", async ({ openApp, server }) => {
  const editor = await newRule(openApp, "Redirect", "filtered", "/a");
  await editor.fill('[data-selectionid="destination-url"]', `${server.domainOrigin}/b`);
  await saveRule(editor);

  // The site is blocked and the rule is switched off.
  await editor.evaluate((host) => chrome.storage.local.set({ blocked_domains: [host] }), "thorn.test");
  await editor.click(".rule-editor-header-switch .ant-switch");
  await editor.waitForTimeout(800);

  const checklist = await openTestModal(editor, `${server.domainOrigin}/a`);
  await expect(checklist.locator('[data-check="status"]')).toContainText("This rule is switched off");
  await expect(checklist.locator('[data-check="blocked"]')).toContainText("thorn.test is in the blocked sites list");
  await expect(checklist.locator('[data-check="condition"]')).toHaveClass(/pass/);
});
