// @ts-ignore
import config from "../../config/dist/config.build.json";

export interface ExtensionConfig {
  browser: "chrome" | "firefox" | "edge";
  storageType: "sync" | "local";
  contextMenuContexts: chrome.contextMenus.ContextType[];
  env: "local" | "beta" | "prod";
  WEB_URL: string;
  OTHER_WEB_URLS?: string[];
  logLevel: "debug" | "info";
  LANDING_PAGE_BASE_URL: string;
}

// WEB_URL "extension" means the app UI is bundled inside the extension as app.html
// and uses hash routing, so `${WEB_URL}/rules/...` resolves to `app.html#/rules/...`.
export const PACKAGED_APP_WEB_URL = "extension";
export const PACKAGED_APP_PAGE = "app.html";

export const isPackagedApp = (config as ExtensionConfig).WEB_URL === PACKAGED_APP_WEB_URL;

if (isPackagedApp) {
  (config as ExtensionConfig).WEB_URL = chrome.runtime.getURL(`${PACKAGED_APP_PAGE}#`);
}

export default config as ExtensionConfig;
