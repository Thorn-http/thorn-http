import { test, expect } from "./fixtures";

test("a Modify API Response rule changes fetch and XHR JSON responses", async ({ context, openApp, server }) => {
  const editor = await openApp("/rules/editor/create/Response");
  await editor.fill('[placeholder="Enter rule name"]', "blog post");
  await editor.getByText("REST API", { exact: true }).click();
  await editor.fill('[data-selectionid="source-value"]', "/post.json");

  const body = editor.locator(".cm-content").first();
  await body.click();
  await editor.keyboard.press("ControlOrMeta+A");
  await editor.keyboard.type('{"title":"MODIFIED"}');

  await editor.click('button:has-text("Save rule")');
  await editor.waitForURL(/#\/rules\/editor\/edit\//);
  await editor.waitForTimeout(1000);

  const site = await context.newPage();
  await site.goto(`${server.origin}/blog`);
  for (const id of ["now", "later", "xhr"]) {
    await expect(site.locator(`#${id}`)).toHaveText('{"title":"MODIFIED"}');
  }
});
