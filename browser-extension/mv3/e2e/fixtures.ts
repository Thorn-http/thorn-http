import { BrowserContext, Page, test as base, chromium } from "@playwright/test";
import http from "http";
import { AddressInfo } from "net";
import path from "path";

const EXTENSION_PATH = path.join(__dirname, "..", "dist");

type Fixtures = {
  context: BrowserContext;
  extensionId: string;
  server: { origin: string; domainOrigin: string };
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
    if (url.startsWith("/echo")) {
      // Echoes what the server received, so tests can check request modifications.
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        res.setHeader("content-type", "application/json");
        res.setHeader("access-control-expose-headers", "*");
        res.end(JSON.stringify({ method: req.method, url, headers: req.headers, body }));
      });
      return;
    }
    if (url.startsWith("/graphql")) {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ data: { source: "server", operation: JSON.parse(body || "{}").operationName } }));
      });
      return;
    }
    if (url.startsWith("/post.json")) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ title: "original" }));
      return;
    }
    if (url.startsWith("/blog")) {
      // Fetches the JSON immediately (while parsing), later, and via XHR.
      res.setHeader("content-type", "text/html");
      res.end(`<html><body><pre id="now"></pre><pre id="later"></pre><pre id="xhr"></pre><script>
        fetch("/post.json").then((r) => r.text()).then((t) => (document.getElementById("now").textContent = t));
        setTimeout(() => fetch("/post.json").then((r) => r.text()).then((t) => (document.getElementById("later").textContent = t)), 1000);
        const x = new XMLHttpRequest(); x.open("GET", "/post.json"); x.onload = () => (document.getElementById("xhr").textContent = x.responseText); x.send();
      </script></body></html>`);
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
    await use({ origin: `http://localhost:${port}`, domainOrigin: `http://thorn.test:${port}` });
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
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        // A real-looking domain for the local server (e.g. the block list only accepts domains).
        "--host-resolver-rules=MAP thorn.test 127.0.0.1",
      ],
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
      // The tab the extension opens on install stays in front otherwise, and background tabs don't
      // run CSS animations (modals would stay invisible).
      await page.bringToFront();
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

/** Opens a new rule of `ruleType` in the editor and fills its name and source condition. */
export const newRule = async (openApp: Fixtures["openApp"], ruleType: string, name: string, source?: string) => {
  const editor = await openApp(`/rules/editor/create/${ruleType}`);
  await editor.waitForSelector('[placeholder="Enter rule name"]');
  await editor.fill('[placeholder="Enter rule name"]', name);
  if (source !== undefined) await editor.fill('[data-selectionid="source-value"]', source);
  return editor;
};

/** Saves the rule open in `editor` and waits for the extension to apply it. */
export const saveRule = async (editor: Page) => {
  await editor.click('button:has-text("Save rule")');
  await editor.waitForURL(/#\/rules\/editor\/edit\//);
  await editor.waitForTimeout(1000);
};

/** Replaces the content of the n-th code editor on the page. */
export const typeInCodeEditor = async (editor: Page, text: string, index = 0) => {
  await editor.locator(".cm-content").nth(index).click();
  await editor.keyboard.press("ControlOrMeta+A");
  await editor.keyboard.press("Delete");
  await editor.keyboard.insertText(text);
};

/** Loads `url` in a new tab and returns the JSON the /echo endpoint sent back. */
export const readEcho = async (context: BrowserContext, url: string) => {
  const page = await context.newPage();
  await page.goto(url);
  const text = await page.evaluate(() => document.body.innerText);
  await page.close();
  return JSON.parse(text);
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
