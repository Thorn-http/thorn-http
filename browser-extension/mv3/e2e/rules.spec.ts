import fs from "fs";
import { test, expect, readPage, createRedirectRule } from "./fixtures";

test("a Redirect rule created in the editor is applied to pages", async ({ context, openApp, server }) => {
  await createRedirectRule(openApp, {
    name: "e2e redirect",
    source: `${server.origin}/a`,
    destination: `${server.origin}/b`,
  });

  expect(await readPage(context, `${server.origin}/a`)).toBe("PAGE-B");
});

test("pausing the extension stops applying rules", async ({ context, openApp, server, extensionId }) => {
  await createRedirectRule(openApp, {
    name: "paused",
    source: `${server.origin}/a`,
    destination: `${server.origin}/b`,
  });

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await popup.click(".pause-switch");
  await popup.waitForTimeout(1000);

  expect(await readPage(context, `${server.origin}/a`)).toBe("PAGE-A");
});

test("rules can be exported, deleted and imported back", async ({ context, openApp, server }, testInfo) => {
  // One app tab (navigated by hash) and one site tab: opening many tabs around rule deletion
  // makes Playwright's target auto-attach flaky with extension pages.
  await createRedirectRule(openApp, {
    name: "export me",
    source: `${server.origin}/a`,
    destination: `${server.origin}/b`,
  });
  const app = await openApp("/rules/my-rules");
  const site = await context.newPage();
  const readSite = async () => {
    await site.goto(`${server.origin}/a`);
    return site.evaluate(() => document.getElementById("page")?.textContent);
  };
  const showRulesList = async () => {
    await app.evaluate(() => (location.hash = "#/rules/templates"));
    await app.evaluate(() => (location.hash = "#/rules/my-rules"));
    await app.waitForTimeout(1000);
  };

  // Export
  await app.click(".ant-table-row .ant-checkbox-input");
  await app.click('button:has-text("Share")');
  const [download] = await Promise.all([app.waitForEvent("download"), app.click('button:has-text("Download rule")')]);
  const file = testInfo.outputPath("rules.json");
  await download.saveAs(file);
  const exported = JSON.parse(fs.readFileSync(file, "utf8"));
  expect(exported.map((record: { name: string }) => record.name)).toEqual(["export me"]);
  await app.keyboard.press("Escape");

  // Delete
  await showRulesList();
  await app.click(".ant-table-row .ant-checkbox-input");
  await app.click('button:has-text("Delete")');
  await app.click('.ant-modal button:has-text("Yes")');
  await app.waitForTimeout(1000);
  expect(await readSite()).toBe("PAGE-A");

  // Import (imported rules start inactive, so enable it afterwards)
  await showRulesList();
  await app.click('button:has-text("Upload rules")');
  await app.setInputFiles('.ant-modal input[type="file"]', file);
  await expect(app.locator(".ant-modal")).toContainText("Successfully parsed 1 rules");
  await app.click(".ant-modal .rq-modal-footer button");
  await showRulesList();
  await app.click(".ant-table-row .ant-switch");
  await app.waitForTimeout(1000);
  expect(await readSite()).toBe("PAGE-B");
});
