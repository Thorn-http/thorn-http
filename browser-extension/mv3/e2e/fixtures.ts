import { BrowserContext, Page, test as base, chromium } from "@playwright/test";
import http from "http";
import { AddressInfo } from "net";
import path from "path";

const EXTENSION_PATH = path.join(__dirname, "..", "dist");

type Fixtures = {
  context: BrowserContext;
  extensionId: string;
  server: { origin: string };
  openApp: (hashPath: string) => Promise<Page>;
};

// Tiny local site used as the target of rules:
//   /a, /b          -> pages whose body text is "PAGE-A" / "PAGE-B"
//   /api            -> JSON endpoint
//   /with-fetch     -> page that fetches /api
const createServer = () =>
  http.createServer((req, res) => {
    const url = req.url || "/";
    if (url.startsWith("/api")) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ source: "server", headers: req.headers }));
      return;
    }
    if (url.startsWith("/with-fetch")) {
      res.end(
        `<html><body id="page">FETCH</body><script>fetch("/api").then(r=>r.text()).then(t=>{document.body.dataset.api=t})</script></html>`
      );
      return;
    }
    const name = url.startsWith("/b") ? "PAGE-B" : "PAGE-A";
    res.setHeader("content-type", "text/html");
    res.end(`<html><body id="page">${name}</body></html>`);
  });

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  server: async ({}, use) => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as AddressInfo;
    await use({ origin: `http://localhost:${port}` });
    server.close();
  },

  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext("", {
      // Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to reuse an already installed Chromium.
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      headless: true,
      viewport: { width: 1400, height: 900 },
      acceptDownloads: true,
      args: [`--disable-extensions-except=${EXTENSION_PATH}`, `--load-extension=${EXTENSION_PATH}`],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    if (!worker) worker = await context.waitForEvent("serviceworker");
    const extensionId = worker.url().split("/")[2];

    await use(extensionId);
  },

  openApp: async ({ context, extensionId }, use) => {
    await use(async (hashPath: string) => {
      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/app.html#${hashPath}`);
      return page;
    });
  },
});

export const expect = test.expect;

/** Opens `url` in a new tab and returns the text of #page. */
export const readPage = async (context: BrowserContext, url: string) => {
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForTimeout(500);
  const text = await page.evaluate(() => document.getElementById("page")?.textContent);
  await page.close();
  return text;
};

/** Creates a Redirect rule from the rule editor UI. */
export const createRedirectRule = async (
  openApp: Fixtures["openApp"],
  { name, source, destination }: { name: string; source: string; destination: string }
) => {
  const editor = await openApp("/rules/editor/create/Redirect");
  await editor.waitForSelector('[data-selectionid="source-value"]');
  await editor.fill('[placeholder="Enter rule name"]', name);
  await editor.fill('[data-selectionid="source-value"]', source);
  await editor.fill('[data-selectionid="destination-url"]', destination);
  await editor.click('button:has-text("Save rule")');
  await editor.waitForURL(/#\/rules\/editor\/edit\//);
  await editor.waitForTimeout(1000); // let the service worker apply the new DNR rules
  return editor;
};
