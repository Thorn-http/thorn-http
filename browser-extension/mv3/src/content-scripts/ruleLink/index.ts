import { EXTENSION_MESSAGES } from "common/constants";

/**
 * Runs only on the website's rule-link page (https://thorn-http.dev/r#...). It tells the page the
 * extension is installed, and hands the link to the extension when "Import" is clicked, which
 * opens the import preview in the editor. The rules themselves never leave the browser.
 */
document.documentElement.dataset.thornHttp = "installed";

document.addEventListener("click", (event) => {
  if ((event.target as Element)?.closest?.("#thorn-import")) {
    chrome.runtime.sendMessage({ action: EXTENSION_MESSAGES.OPEN_RULE_LINK, payload: location.hash.slice(1) });
  }
});
