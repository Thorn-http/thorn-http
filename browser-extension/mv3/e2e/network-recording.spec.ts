import fs from "fs";
import { test, expect } from "./fixtures";

test("network recording started from the popup captures requests and exports HAR", async ({
  context,
  extensionId,
  server,
}) => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);

  // Same message the popup's "Record network" button sends for the active tab.
  const start = await popup.evaluate(
    (url) =>
      new Promise<any>((resolve) => chrome.runtime.sendMessage({ action: "startNetworkRecording", url }, resolve)),
    `${server.origin}/with-fetch`
  );
  expect(start.success).toBe(true);

  await expect
    .poll(async () => {
      const state = await popup.evaluate(
        (tabId) =>
          new Promise<any>((resolve) =>
            chrome.runtime.sendMessage({ action: "getNetworkRecordingState", tabId }, resolve)
          ),
        start.targetTabId
      );
      return (state?.entries || []).map((entry: any) => new URL(entry.request.url).pathname);
    })
    .toContain("/api");

  const panel = await context.newPage();
  await panel.goto(
    `chrome-extension://${extensionId}/sidepanel/network-recording/index.html?tabId=${start.targetTabId}`
  );
  const [download] = await Promise.all([panel.waitForEvent("download"), panel.click(".export-btn")]);
  const har = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  expect(har.log.creator.name).toBe("THorn HTTP");
  expect(har.log.entries.some((entry: any) => entry.request.url.endsWith("/api"))).toBe(true);
});
