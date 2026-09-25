import { test, expect, newRule, saveRule, typeInCodeEditor, readEcho, readPage } from "./fixtures";

// Every rule type, created through the editor UI like a user would, then checked on a real page.

test("Replace String rewrites part of the URL", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Replace", "replace", `${server.origin}/a`);
  await editor.fill('[data-selectionid="replace-from-in-url"]', "/a");
  await editor.fill('[data-selectionid="replace-to-in-url"]', "/b");
  await saveRule(editor);

  expect(await readPage(context, `${server.origin}/a`)).toBe("PAGE-B");
});

test("Query Param adds a parameter", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "QueryParam", "query", "/echo");
  await editor.fill('[data-selectionid="query-param-name"]', "thorn");
  await editor.fill('[data-selectionid="query-param-value"]', "yes");
  await saveRule(editor);

  const echo = await readEcho(context, `${server.origin}/echo?x=1`);
  expect(echo.url).toContain("thorn=yes");
});

test("Modify Headers adds request and response headers", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Headers", "headers", "/echo");
  await editor.click('button:has-text("Add Request Header")');
  await editor.locator('[data-selectionid="header-name"]').nth(0).fill("X-Thorn-Request");
  await editor.locator('[data-selectionid="header-value"]').nth(0).fill("req-ok");
  await editor.getByText("Response Headers", { exact: true }).click();
  await editor.click('button:has-text("Add Response Header")');
  await editor.locator('[data-selectionid="header-name"]').last().fill("X-Thorn-Response");
  await editor.locator('[data-selectionid="header-value"]').last().fill("res-ok");
  await saveRule(editor);

  const echo = await readEcho(context, `${server.origin}/echo`);
  expect(echo.headers["x-thorn-request"]).toBe("req-ok");

  const page = await context.newPage();
  await page.goto(`${server.origin}/a`);
  const responseHeader = await page.evaluate(async () => (await fetch("/echo")).headers.get("x-thorn-response"));
  expect(responseHeader).toBe("res-ok");
});

test("Modify Request Body changes what fetch sends", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Request", "request body");
  await editor.getByText("REST API", { exact: true }).click();
  await editor.fill('[data-selectionid="source-value"]', "/echo");
  await typeInCodeEditor(editor, '{"modified":true}');
  await saveRule(editor);

  const page = await context.newPage();
  await page.goto(`${server.origin}/a`);
  await page.waitForTimeout(500);
  const echo = await page.evaluate(async () =>
    (
      await fetch("/echo", {
        method: "POST",
        body: '{"modified":false}',
        headers: { "content-type": "application/json" },
      })
    ).json()
  );
  expect(JSON.parse(echo.body)).toEqual({ modified: true });
});

test("Insert Scripts runs custom JavaScript on the page", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Script", "script", `${server.origin}/a`);
  await typeInCodeEditor(
    editor,
    '<script type="text/javascript">document.documentElement.dataset.thorn = "injected";</script>'
  );
  await saveRule(editor);

  const page = await context.newPage();
  await page.goto(`${server.origin}/a`);
  await expect(page.locator("html")).toHaveAttribute("data-thorn", "injected");
});

test("Cancel Request blocks matching requests", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Cancel", "cancel", "/echo");
  await saveRule(editor);

  const page = await context.newPage();
  await page.goto(`${server.origin}/a`);
  const result = await page.evaluate(() =>
    fetch("/echo").then(
      () => "loaded",
      () => "blocked"
    )
  );
  expect(result).toBe("blocked");
});

test("Delay Network Requests slows down matching requests", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Delay", "delay", "/echo");
  await editor.fill('[data-selectionid="delay-value"]', "1500");
  await saveRule(editor);

  const page = await context.newPage();
  await page.goto(`${server.origin}/a`);
  await page.waitForTimeout(500);
  const elapsed = await page.evaluate(async () => {
    const start = performance.now();
    await fetch("/echo");
    return performance.now() - start;
  });
  expect(elapsed).toBeGreaterThanOrEqual(1400);
});

test("User-Agent overrides the browser user agent", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "UserAgent", "user agent", "/echo");
  await editor.locator(".ant-dropdown-trigger", { hasText: "SELECT" }).click();
  await editor.locator(".ant-dropdown:not(.ant-dropdown-hidden) li", { hasText: "DEVICE" }).click();
  await editor.locator('[data-selectionid="device-selector"]').click();
  await editor.locator(".ant-select-item-option", { hasText: "Apple iPhone" }).click();
  await saveRule(editor);

  const echo = await readEcho(context, `${server.origin}/echo`);
  expect(echo.headers["user-agent"]).toMatch(/iPhone/);
});

test("fetch/XHR rules also apply to requests made while the page is loading", async ({ context, openApp, server }) => {
  const editor = await newRule(openApp, "Delay", "early delay", "/echo");
  await editor.fill('[data-selectionid="delay-value"]', "1500");
  await saveRule(editor);

  const page = await context.newPage();
  await page.goto(`${server.origin}/timed`);
  await expect(page.locator("#elapsed")).not.toBeEmpty({ timeout: 10_000 });
  expect(Number(await page.locator("#elapsed").textContent())).toBeGreaterThanOrEqual(1400);
});

test("requests are not held up without matching rules", async ({ context, server }) => {
  const page = await context.newPage();
  await page.goto(`${server.origin}/timed`);
  await expect(page.locator("#elapsed")).not.toBeEmpty();
  // Used to wait ~2s for an acknowledgement from a content script listener registered too late.
  expect(Number(await page.locator("#elapsed").textContent())).toBeLessThan(1000);
});
