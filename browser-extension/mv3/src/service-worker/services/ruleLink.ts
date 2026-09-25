import config from "common/config";

// Static hosts may serve the page with or without ".html" or a trailing slash.
const RULE_LINK_PAGES = ["https://thorn-http.dev/r", "https://thorn-http.dev/r/", "https://thorn-http.dev/r.html"];
const MAX_PAYLOAD_LENGTH = 2 * 1024 * 1024;

/** Opens the editor's import preview for a rule link clicked on the website (see content-scripts/ruleLink). */
export const openRuleLink = (payload: unknown, sender: chrome.runtime.MessageSender) => {
  const senderUrl = sender.url ? new URL(sender.url) : null;
  if (!senderUrl || !RULE_LINK_PAGES.includes(senderUrl.origin + senderUrl.pathname)) {
    return;
  }

  // Only the link format itself is checked here; the editor validates the rules inside.
  if (typeof payload !== "string" || payload.length > MAX_PAYLOAD_LENGTH || !/^\d+\.[\w-]+$/.test(payload)) {
    return;
  }

  chrome.tabs.create({
    url: `${config.WEB_URL}/rules/import-link?d=${encodeURIComponent(payload)}`,
    openerTabId: sender.tab?.id,
    index: sender.tab ? sender.tab.index + 1 : undefined,
  });
};
