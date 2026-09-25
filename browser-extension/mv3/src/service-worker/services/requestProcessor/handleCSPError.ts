import { SessionRuleType } from "./types";
import { updateRequestSpecificRules } from "../rulesManager";

export const handleCSPError = async (tabId: number, origin: string): Promise<void> => {
  await updateRequestSpecificRules(
    tabId,
    origin,
    {
      action: {
        type: "modifyHeaders" as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        responseHeaders: [
          {
            header: "Content-Security-Policy",
            operation: "remove" as chrome.declarativeNetRequest.HeaderOperation.REMOVE,
          },
        ],
      },
      condition: {
        // Anchored with the trailing slash, so https://site.com can't also match https://site.com.evil.com
        urlFilter: `|${origin}/`,
        resourceTypes: [
          "sub_frame" as chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
          "main_frame" as chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
        ],
        tabIds: [tabId],
        excludedInitiatorDomains: ["requestly.io", "requestly.com"],
      },
    },
    SessionRuleType.CSP_ERROR
  );
};
