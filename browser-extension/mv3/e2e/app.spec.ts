import { test, expect } from "./fixtures";

const RULE_TYPES = [
  "Redirect",
  "Replace",
  "QueryParam",
  "Headers",
  "Request",
  "Response",
  "Script",
  "Cancel",
  "Delay",
  "UserAgent",
];

test("every rule editor renders without errors", async ({ openApp }) => {
  const errors: string[] = [];
  const page = await openApp("/rules/my-rules");
  page.on("pageerror", (error) => errors.push(error.message));

  for (const ruleType of RULE_TYPES) {
    await page.goto(page.url().replace(/#.*$/, `#/rules/editor/create/${ruleType}`));
    await expect(page.locator('button:has-text("Save rule")')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("the app makes no third-party network requests", async ({ context, openApp }) => {
  const external: string[] = [];
  context.on("request", (request) => {
    const url = new URL(request.url());
    if (!["chrome-extension:", "data:", "blob:"].includes(url.protocol)) external.push(request.url());
  });

  const page = await openApp("/rules/my-rules");
  await expect(page.getByText("Create new rule")).toBeVisible();
  for (const path of ["/rules/templates", "/settings/global-settings", "/rules/editor/create/Response"]) {
    await page.goto(page.url().replace(/#.*$/, `#${path}`));
    await page.waitForTimeout(1500);
  }
  expect(external).toEqual([]);
});
