import { defineConfig } from "@playwright/test";

// Local-only end-to-end tests: they load the built extension (../dist) in Chromium and use a
// local HTTP server, so they need no internet access. Run `bash build.sh` at the repo root first.
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  reporter: [["list"]],
  retries: process.env.CI ? 1 : 0,
});
