import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";

// Checks the built extension itself, every file of every type (JSON, CSS, SVG... not only JS):
// a Delay rule once redirected to Requestly's server from a JSON file that a JS-only audit missed.

const DIST = path.join(__dirname, "..", "dist");

const listFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "_metadata" ? [] : listFiles(fullPath);
    return [fullPath];
  });

// Services the upstream code called or opened. None may come back, in any file.
const FORBIDDEN_ENDPOINTS = [
  "app.requestly.io/delay",
  "notion-api.splitbee.io",
  "editor-doc?teamId", // the editor help fetched its docs from requestly.dev
  "www.browserstack.com",
  "cdn.growthbook.io/api",
  "rqst.ly",
  "app.formbricks.com",
];

test("no file of the extension refers to the services the upstream code used", () => {
  const found: string[] = [];
  for (const file of listFiles(DIST)) {
    if (/\.(png|gif|jpe?g|woff2?|ttf|ico)$/.test(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const endpoint of FORBIDDEN_ENDPOINTS) {
      if (text.includes(endpoint)) found.push(`${path.relative(DIST, file)}: ${endpoint}`);
    }
  }
  expect(found).toEqual([]);
});

test("the manifest keeps the extension local", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "manifest.json"), "utf8"));

  expect(manifest.update_url).toBeUndefined(); // updates only through the browser's store
  expect(manifest.externally_connectable).toBeUndefined(); // no website can message the extension
  const csp: string = manifest.content_security_policy.extension_pages;
  for (const directive of [
    "default-src 'self'",
    "connect-src 'self' data: blob:",
    "img-src 'self' data: blob:",
    "frame-src 'self'",
  ]) {
    expect(csp).toContain(directive);
  }
  expect(csp).not.toMatch(/https?:/);
  // The debugger permission is only ever optional (asked with an explanation).
  expect(manifest.permissions).not.toContain("debugger");
});

test("static network rules never send requests to another server", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST, "manifest.json"), "utf8"));
  for (const { path: rulesPath } of manifest.declarative_net_request.rule_resources) {
    const rules = JSON.parse(fs.readFileSync(path.join(DIST, rulesPath), "utf8"));
    for (const rule of rules) {
      expect(JSON.stringify(rule.action)).not.toMatch(/https?:\/\//);
    }
  }
});
