import { test, expect, newRule, saveRule, typeInCodeEditor, readPage, createRedirectRule } from "./fixtures";

const fetchInPage = async (context: any, origin: string, fn: string) => {
  const page = await context.newPage();
  await page.goto(`${origin}/a`);
  await page.waitForTimeout(500);
  const result = await page.evaluate(fn);
  await page.close();
  return result;
};

test("Modify API Response can set the status code", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Response", "status");
  await editor.getByText("REST API", { exact: true }).click();
  await editor.fill('[data-selectionid="source-value"]', "/post.json");
  await editor.locator(".ant-select", { hasText: "Returns original code if left empty" }).click();
  await editor.keyboard.type("404");
  await editor.keyboard.press("Enter");
  await typeInCodeEditor(editor, '{"error":"not found"}');
  await saveRule(editor);

  const result = await fetchInPage(
    context,
    server.origin,
    `fetch("/post.json").then(async (r) => r.status + " " + (await r.text()))`
  );
  expect(result).toBe('404 {"error":"not found"}');
});

test("Modify API Response supports dynamic JavaScript responses", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Response", "dynamic");
  await editor.getByText("REST API", { exact: true }).click();
  await editor.fill('[data-selectionid="source-value"]', "/post.json");
  await editor.getByText("Dynamic (JavaScript)", { exact: true }).click();
  await editor
    .locator(".ant-popover .ant-btn-primary, .ant-popconfirm .ant-btn-primary")
    .click({ timeout: 2000 })
    .catch(() => {});
  await typeInCodeEditor(
    editor,
    "function modifyResponse(args) { const body = JSON.parse(args.responseJSON ? JSON.stringify(args.responseJSON) : args.response); body.title = body.title.toUpperCase() + '!'; return body; }"
  );
  await saveRule(editor);

  const result = await fetchInPage(
    context,
    server.origin,
    `fetch("/post.json").then((r) => r.json()).then((j) => j.title)`
  );
  expect(result).toBe("ORIGINAL!");
});

test("Modify API Response targets GraphQL operations", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Response", "graphql");
  await editor.getByText("GraphQL API", { exact: true }).click();
  await editor.fill('[data-selectionid="source-value"]', "/graphql");
  await editor.getByPlaceholder("Key e.g. operationName").fill("operationName");
  await editor.getByPlaceholder("value e.g. getUsers").fill("GetPost");
  await typeInCodeEditor(editor, '{"data":{"source":"mock"}}');
  await saveRule(editor);

  const run = (operationName: string) =>
    fetchInPage(
      context,
      server.origin,
      `fetch("/graphql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ operationName: "${operationName}", query: "{ x }" }) }).then((r) => r.json()).then((j) => j.data.source)`
    );
  expect(await run("GetPost")).toBe("mock");
  expect(await run("Other")).toBe("server");
});

test("rules in a disabled group are not applied", async ({ context, openApp, server }) => {
  await createRedirectRule(openApp, {
    name: "grouped",
    source: `${server.origin}/a`,
    destination: `${server.origin}/b`,
  });
  const list = await openApp("/rules/my-rules");

  await list.click('button:has-text("New Group")');
  const groupInput = list.locator(".ant-modal input").first();
  await groupInput.fill("My group");
  await list.keyboard.press("Enter");
  await expect(list.getByText("My group")).toBeVisible();

  await list.locator(".ant-table-row", { hasText: "grouped" }).locator(".ant-checkbox-input").click();
  await list.click('button:has-text("Change group")');
  await list.locator(".ant-modal input").first().fill("My group");
  await list.keyboard.press("Enter");
  await list.waitForTimeout(1000);
  expect(await readPage(context, `${server.origin}/a`)).toBe("PAGE-B");

  await list.locator(".ant-table-row", { hasText: "My group" }).locator(".ant-switch").first().click();
  await list.waitForTimeout(1000);
  expect(await readPage(context, `${server.origin}/a`)).toBe("PAGE-A");
});

test("rules are not applied on blocked sites", async ({ context, openApp, server }) => {
  const site = server.domainOrigin;
  await createRedirectRule(openApp, { name: "blocked", source: `${site}/a`, destination: `${site}/b` });
  expect(await readPage(context, `${site}/a`)).toBe("PAGE-B");

  const settings = await openApp("/settings/global-settings");
  await settings.fill('input[placeholder="Enter URL"]', "thorn.test");
  await settings.click('button:has-text("Add")');
  await expect(settings.getByText("thorn.test", { exact: true })).toBeVisible();
  await settings.waitForTimeout(1000);
  expect(await readPage(context, `${site}/a`)).toBe("PAGE-A");
});

test("applied rules are reported to the popup/DevTools", async ({ context, openApp, server, extensionId }) => {
  await createRedirectRule(openApp, {
    name: "tracked",
    source: `${server.origin}/a`,
    destination: `${server.origin}/b`,
  });
  const page = await context.newPage();
  await page.goto(`${server.origin}/a`);
  await page.waitForTimeout(1000);

  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  const executed = await popup.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url: url + "*" });
    return new Promise<any>((resolve) =>
      chrome.runtime.sendMessage({ action: "getExecutedRules", tabId: tab.id }, resolve)
    );
  }, `${server.origin}/b`);
  expect((executed || []).map((rule: any) => rule.name)).toContain("tracked");
});

test("editing a saved rule applies the new values after reload", async ({ context, openApp, server }) => {
  // The reported scenario: change a mocked JSON, save, reload the site.
  const editor = await newRule(openApp, "Response", "edit me");
  await editor.getByText("REST API", { exact: true }).click();
  await editor.fill('[data-selectionid="source-value"]', "/post.json");
  await typeInCodeEditor(editor, '{"title":"first"}');
  await saveRule(editor);

  const site = await context.newPage();
  await site.goto(`${server.origin}/blog`);
  await expect(site.locator("#now")).toHaveText('{"title":"first"}');

  await typeInCodeEditor(editor, '{"title":"second"}');
  await editor.click('button:has-text("Save rule")');
  await editor.waitForTimeout(1500);

  await site.reload();
  for (const id of ["now", "later", "xhr"]) {
    await expect(site.locator(`#${id}`)).toHaveText('{"title":"second"}');
  }
});

test("Insert Scripts can inject CSS", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Script", "css", `${server.origin}/a`);
  await editor.locator(".ant-dropdown-trigger", { hasText: "JS" }).click();
  await editor.locator(".ant-dropdown:not(.ant-dropdown-hidden) li", { hasText: "CSS" }).click();
  await editor
    .locator(".ant-popover .ant-btn-primary, .ant-popconfirm .ant-btn-primary")
    .click({ timeout: 2000 })
    .catch(() => {});
  await typeInCodeEditor(editor, "<style>#page { color: rgb(255, 0, 0); }</style>");
  await saveRule(editor);

  const page = await context.newPage();
  await page.goto(`${server.origin}/a`);
  await expect(page.locator("#page")).toHaveCSS("color", "rgb(255, 0, 0)");
});

test("a rule can be created from a template", async ({ openApp }) => {
  const templates = await openApp("/rules/templates");
  await templates.locator(".ant-table-row", { hasText: "Bypass CORS" }).getByText("View").click();
  await templates.locator(".ant-modal button", { hasText: "Use this template" }).click();
  await templates.waitForURL(/#\/rules\/editor\/edit\/Headers_/);

  const list = await openApp("/rules/my-rules");
  await expect(list.locator(".ant-table-row", { hasText: "Bypass CORS" })).toBeVisible();
});
