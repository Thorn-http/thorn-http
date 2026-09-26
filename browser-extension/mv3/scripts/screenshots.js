// Product screenshots (browser-extension/mv3/screenshots/) for the website, the README and the stores.
// Usage: bash build.sh, then: cd browser-extension/mv3 && node scripts/screenshots.js
// CHROME_PATH can point to a Chromium; otherwise Playwright's own is used.
const path = require("path");
const http = require("http");
const ROOT = path.join(__dirname, "..", "..", "..");
const { chromium } = require(path.join(ROOT, "browser-extension/mv3/node_modules/playwright"));
const EXT = path.join(ROOT, "browser-extension/mv3/dist");
const OUT = path.join(__dirname, "..", "screenshots");
require("fs").mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME_PATH || undefined;

const SHOP = `<!doctype html><html><head><title>Shop</title></head><body style="font:16px system-ui;padding:24px">
<h1>Demo shop</h1><div id="cart"></div><script>
fetch("/api/products?page=1").then(r=>r.json());
fetch("/api/cart").then(r=>r.json()).then(c=>document.getElementById("cart").textContent=c.items.length+" items");
fetch("/api/checkout",{method:"POST",body:JSON.stringify({cartId:"c_123"})});
fetch("/api/recommendations");
</script></body></html>`;

const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const json = (code, data) => {
    res.statusCode = code;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(data));
  };
  if (u.pathname === "/api/products")
    return json(200, {
      products: [
        { id: 1, name: "Espresso machine", price: 249.9 },
        { id: 2, name: "Coffee grinder", price: 89.5 },
      ],
    });
  if (u.pathname === "/api/cart") return json(200, { id: "c_123", items: [{ productId: 1, qty: 1 }], total: 249.9 });
  if (u.pathname === "/api/checkout") return json(201, { orderId: "o_789", status: "confirmed" });
  if (u.pathname === "/api/recommendations") return json(503, { error: "Service temporarily unavailable" });
  res.setHeader("content-type", "text/html");
  res.end(SHOP);
});

const now = Date.now();
const PINNED = ["Response_checkout", "Redirect_local", "Headers_debug"];
const base = (id, ruleType, name, extra) => ({
  id,
  ruleType,
  name,
  isFavourite: PINNED.includes(id),
  objectType: "rule",
  status: "Active",
  groupId: "",
  description: "",
  isSample: false,
  schemaVersion: "3.0.0",
  creationDate: now - 86400000,
  modificationDate: now - Math.floor(Math.random() * 7) * 86400000,
  ...extra,
});
const src = (value, operator = "Contains") => ({ key: "Url", operator, value, filters: [] });

const RULES = {
  Group_checkout: {
    id: "Group_checkout",
    objectType: "group",
    name: "Checkout flow",
    status: "Active",
    children: [],
    creationDate: now,
    modificationDate: now,
  },
  Response_checkout: base("Response_checkout", "Response", "Mock checkout failure (500)", {
    groupId: "Group_checkout",
    expiresAt: now + 45 * 60000,
    description: "Checks how the checkout page handles a payment error.",
    pairs: [
      {
        id: "p1",
        source: { ...src("shop.example.com/api/checkout"), filters: [{ requestMethod: ["POST"] }] },
        response: {
          type: "static",
          resourceType: "restApi",
          statusCode: "500",
          value: JSON.stringify(
            { error: "payment_declined", message: "Your card was declined.", retryable: true },
            null,
            2
          ),
        },
      },
    ],
  }),
  Delay_search: base("Delay_search", "Delay", "Slow search API (3 s)", {
    groupId: "Group_checkout",
    status: "Inactive",
    pairs: [{ id: "p2", source: src("/api/search"), delay: "3000" }],
  }),
  Redirect_local: base("Redirect_local", "Redirect", "Production JS → localhost", {
    pairs: [
      {
        id: "p3",
        source: src("https://cdn.example.com/app.js", "Equals"),
        destination: "http://localhost:5173/src/app.js",
        destinationType: "url",
      },
    ],
  }),
  Headers_debug: base("Headers_debug", "Headers", "Add X-Debug header to the API", {
    version: 2,
    pairs: [
      {
        id: "p4",
        source: src("api.example.com"),
        modifications: { Request: [{ id: "h1", header: "X-Debug", value: "true", type: "Add" }], Response: [] },
      },
    ],
  }),
  Replace_staging: base("Replace_staging", "Replace", "Use the staging API", {
    pairs: [{ id: "p5", source: src(""), from: "api.example.com", to: "api.staging.example.com" }],
  }),
  Script_css: base("Script_css", "Script", "Design review outline", {
    status: "Inactive",
    pairs: [
      {
        id: "p6",
        source: src("example.com"),
        scripts: [
          {
            id: "s1",
            codeType: "css",
            type: "code",
            value: "* { outline: 1px solid rgba(47,174,107,.4) }",
            loadTime: "afterPageLoad",
            fileName: "",
          },
        ],
      },
    ],
  }),
  Redirect_case: base("Redirect_case", "Redirect", "Point the v2 API to a local server", {
    pairs: [
      { id: "p7", source: src("/API/v2/"), destination: "http://localhost:8080/api/v2/", destinationType: "url" },
    ],
  }),
};

(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const shop = `http://shop.example.com:${server.address().port}`;
  const ctx = await chromium.launchPersistentContext("", {
    executablePath: CHROME,
    headless: true,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
    args: [
      `--disable-extensions-except=${EXT}`,
      `--load-extension=${EXT}`,
      "--host-resolver-rules=MAP shop.example.com 127.0.0.1",
      "--disable-gpu",
      "--disable-software-rasterizer",
    ],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker");
  const id = sw.url().split("/")[2];
  const app = (hash) => `chrome-extension://${id}/app.html#${hash}`;
  await new Promise((r) => setTimeout(r, 1500));
  for (const p of ctx.pages()) if (p.url().includes("app.html")) await p.close();
  await sw.evaluate((rules) => chrome.storage.local.set(rules), RULES);

  const page = ctx.pages()[0] || (await ctx.newPage());
  const shot = async (p, name, opts = {}) => {
    await p.waitForTimeout(900);
    await p.screenshot({ path: path.join(OUT, name), ...opts });
    console.log("✓", name);
  };

  // Only the popup test: node site-shots.js popup
  const only = process.argv[2];
  if (only === "popup") {
    /* skip to popup */
  }
  // 1. Rules list
  await page.goto(app("/rules/my-rules"));
  await page.waitForSelector(".ant-table-row");
  await page.click("text=Checkout flow").catch(() => {});
  await shot(page, "rules-list.png");

  // 2. Mock editor
  await page.goto(app("/rules/editor/edit/Response_checkout"));
  await page.waitForSelector(".cm-content");
  await page
    .locator(".rule-info-banner-container .ant-alert-close-icon, .ant-alert-close-icon")
    .first()
    .click()
    .catch(() => {});
  await page
    .locator(".rule-details-panel-close-btn, [class*=details] .ant-btn-icon-only")
    .first()
    .click()
    .catch(() => {});
  await shot(page, "mock-editor.png");

  // 3. Test URL explanation
  await page.goto(app("/rules/editor/edit/Redirect_case"));
  await page.waitForSelector('button:has-text("Test URL")');
  await page.click('button:has-text("Test URL")');
  await page.fill('[placeholder="https://www.example.com"]', "https://shop.example.com/api/v2/cart");
  await page.click('[data-testid="test-url-resource-type"] .ant-select-selector');
  await page.click('.ant-select-item-option:has-text("fetch / XHR")');
  await shot(page, "test-url.png");

  // 4. Network recording side panel
  const popup = await ctx.newPage();
  await popup.goto(`chrome-extension://${id}/popup/popup.html`);
  const start = await popup.evaluate(
    (url) => new Promise((r) => chrome.runtime.sendMessage({ action: "startNetworkRecording", url }, r)),
    `${shop}/shop`
  );
  await popup.waitForTimeout(2500);
  const panel = await ctx.newPage();
  await panel.setViewportSize({ width: 420, height: 720 });
  await panel.goto(`chrome-extension://${id}/sidepanel/network-recording/index.html?tabId=${start.targetTabId}`);
  await panel.waitForSelector(".mock-btn");
  await shot(panel, "network-panel.png");

  // 5. Popup, at its natural size
  const pop = await ctx.newPage();
  await pop.setViewportSize({ width: 900, height: 900 });
  await pop.goto(`chrome-extension://${id}/popup/popup.html`);
  await pop.waitForTimeout(800);
  await pop.click("text=Pinned rules").catch(() => {});
  const size = await pop.evaluate(() => {
    const root = document.body.firstElementChild || document.body;
    const r = root.getBoundingClientRect();
    return { width: Math.ceil(Math.max(r.width, document.body.scrollWidth)), height: Math.ceil(r.height) };
  });
  console.log("popup size", size);
  await shot(pop, "popup.png", {
    clip: { x: 0, y: 0, width: Math.min(size.width, 900), height: Math.min(size.height, 900) },
  });

  await ctx.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
