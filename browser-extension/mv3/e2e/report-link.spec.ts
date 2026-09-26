import { test, expect } from "./fixtures";
import { version } from "../package.json";

// "Report a problem" only opens the form on the website, with the version filled in:
// the extension itself sends nothing.
test("the popup and the editor link to the report form with the extension version", async ({
  context,
  extensionId,
  openApp,
}) => {
  const requests: string[] = [];
  context.on("request", (request) => requests.push(request.url()));

  const expected = `https://thorn-http.dev/report/?v=${version}`;
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  const popupLink = popup.locator("a.report-problem-link");
  await expect(popupLink).toHaveAttribute("href", expected);
  await expect(popupLink).toHaveAttribute("target", "_blank");

  const app = await openApp("/rules/my-rules");
  await expect(app.locator('a.footer-link:has-text("Report a problem")')).toHaveAttribute("href", expected);

  expect(requests.filter((url) => url.includes("thorn-http.dev"))).toEqual([]);
});
