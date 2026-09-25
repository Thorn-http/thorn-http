import fs from "fs";
import path from "path";
import { test, expect, newRule, saveRule, typeInCodeEditor } from "./fixtures";

const OUR_PAGE_SCRIPT = fs.readFileSync(
  path.join(__dirname, "..", "dist", "page-scripts", "ajaxRequestInterceptor.ps.js"),
  "utf8"
);
// Other interceptors built on the same upstream code (Requestly) patch fetch/XHR in the same pages,
// with the upstream names. Our own script with those names stands in for them.
const OTHER_INTERCEPTOR = OUR_PAGE_SCRIPT.replaceAll(
  "thorn-http.ajaxRequestInterceptor",
  "other.ajaxRequestInterceptor"
)
  .replaceAll("__THORN_HTTP__", "__REQUESTLY__")
  .replaceAll("thorn:client", "requestly:client");

test("pages keep working when another interceptor also patches XMLHttpRequest", async ({
  context,
  openApp,
  server,
}) => {
  // A Thorn mock for fetch requests; the page's XHRs aren't mocked, like a consent banner's.
  const editor = await newRule(openApp, "Response", "fetch mock");
  await editor.click("text=REST API");
  await editor.fill('[data-selectionid="source-value"]', "/post.json");
  await typeInCodeEditor(editor, '{"title":"mocked"}');
  await saveRule(editor);

  await context.addInitScript({ content: OTHER_INTERCEPTOR });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${server.origin}/blog`);

  // fetch is still mocked by Thorn, and XHRs made while the page loads don't throw.
  await expect(page.locator("#now")).toContainText("mocked", { timeout: 10000 });
  expect(errors).toEqual([]);

  // An XHR the rule doesn't match completes, and the properties the patch wraps still work.
  const result = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/echo");
        xhr.timeout = 5000;
        xhr.withCredentials = true;
        xhr.onload = () =>
          resolve(`${xhr.status} ${xhr.timeout} ${xhr.withCredentials} ${JSON.parse(xhr.responseText).url}`);
        xhr.send();
      })
  );
  expect(result).toBe("200 5000 true /echo");
});

test("the page script patches XMLHttpRequest only once even if injected twice", async ({ context, server }) => {
  await context.addInitScript({ content: OUR_PAGE_SCRIPT });
  await context.addInitScript({ content: OUR_PAGE_SCRIPT });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${server.origin}/blog`);
  await expect(page.locator("#xhr")).toContainText("original", { timeout: 10000 });
  expect(errors).toEqual([]);
});
