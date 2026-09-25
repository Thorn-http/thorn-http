import { AJAXRequestDetails } from "./types";
import { forwardHeadersOnRedirect } from "./handleHeadersOnRedirect";
import { handleInitiatorDomainFunction } from "./handleInitiatorDomainFunction";
import rulesStorageService from "../../../rulesStorageService";
import { RuleType } from "common/types";
import { handleCSPError } from "./handleCSPError";

class RequestProcessor {
  constructor() {}

  onBeforeAJAXRequest = async (tabId: number, requestDetails: AJAXRequestDetails): Promise<void> => {
    const enabledRules = await rulesStorageService.getEnabledRules();

    if (enabledRules.length === 0) {
      return;
    }

    const redirectReplaceRules = enabledRules.filter(
      (rule) => rule.ruleType === RuleType.REDIRECT || rule.ruleType === RuleType.REPLACE
    );
    const headerRules = enabledRules.filter((rule) => rule.ruleType === RuleType.HEADERS);

    await forwardHeadersOnRedirect(tabId, requestDetails, redirectReplaceRules);
    await handleInitiatorDomainFunction(tabId, requestDetails, headerRules);
  };

  /**
   * The page's CSP blocked a dynamic (JavaScript) response or request rule. Remove the CSP of that
   * origin in this tab so the rule works after a reload. `origin` is the page's own origin (from the
   * message sender), so a page can only ever lift its own CSP.
   */
  onErrorOccurred = async (tabId: number, origin: string | undefined): Promise<void> => {
    if (!origin || !/^https?:\/\//.test(origin)) {
      return;
    }

    const enabledRules = await rulesStorageService.getEnabledRules();
    const hasCodeRule = enabledRules.some((rule) =>
      rule.pairs?.some((pair) => pair.response?.type === "code" || pair.request?.type === "code")
    );

    if (!hasCodeRule) {
      return;
    }

    await handleCSPError(tabId, origin);
  };
}

export const requestProcessor = new RequestProcessor();
