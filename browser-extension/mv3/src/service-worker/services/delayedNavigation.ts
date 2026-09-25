/**
 * Delay rules for page and iframe loads, fully local:
 *  1. the user's Delay rule adds the marker param "thorn-delay=<ms>" to a matching page load
 *     (see parseDelayRule in the app);
 *  2. the rule below turns any URL with that marker into the extension's delay page, with the
 *     original URL in the fragment (never sent anywhere);
 *  3. when the time is up the delay page asks for a one-off "allow" of that URL in its tab, so the
 *     Delay rule doesn't catch it again, and loads it.
 */
const DELAY_PAGE = "resources/delay/index.html";
const ALLOW_PRIORITY = 2;
const ALLOW_TTL_MS = 30 * 1000;

export const getDelayPageRule = (id: number): chrome.declarativeNetRequest.Rule => ({
  id,
  priority: 100,
  condition: {
    regexFilter: "^([^#]*?)[?&]thorn-delay=([0-9]+)(.*)$",
    resourceTypes: [
      "main_frame" as chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
      "sub_frame" as chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
    ],
  },
  action: {
    type: "redirect" as chrome.declarativeNetRequest.RuleActionType.REDIRECT,
    redirect: { regexSubstitution: `${chrome.runtime.getURL(DELAY_PAGE)}?ms=\\2#\\1#\\3` },
  },
});

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** One-off pass for a delayed page, requested by the delay page when its time is up. */
export const allowDelayedNavigation = async (url: unknown, sender: chrome.runtime.MessageSender) => {
  const tabId = sender.tab?.id;
  if (tabId === undefined || !sender.url?.startsWith(chrome.runtime.getURL(DELAY_PAGE))) {
    return;
  }
  if (typeof url !== "string" || !/^https?:\/\//.test(url)) {
    return;
  }

  const ruleId = parseInt(`${Date.now() % 1000000}${Math.floor(Math.random() * 1000)}`);
  // urlFilter has no escaping, so special characters need the (2 KB limited) regex form.
  const urlCondition = /[*^|]/.test(url) ? { regexFilter: `^${escapeRegex(url)}$` } : { urlFilter: `|${url}|` };

  await chrome.declarativeNetRequest.updateSessionRules({
    addRules: [
      {
        id: ruleId,
        priority: ALLOW_PRIORITY,
        action: { type: "allow" as chrome.declarativeNetRequest.RuleActionType.ALLOW },
        condition: {
          ...urlCondition,
          tabIds: [tabId],
          resourceTypes: [
            "main_frame" as chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
            "sub_frame" as chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          ],
        },
      },
    ],
  });

  const removeRule = () => {
    chrome.webNavigation.onCommitted.removeListener(onCommitted);
    chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] }).catch(() => {});
  };
  const onCommitted = (details: chrome.webNavigation.WebNavigationTransitionCallbackDetails) => {
    if (details.tabId === tabId && details.url === url) removeRule();
  };
  chrome.webNavigation.onCommitted.addListener(onCommitted);
  setTimeout(removeRule, ALLOW_TTL_MS);
};
