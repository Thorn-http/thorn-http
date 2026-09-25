import { EXTENSION_MESSAGES } from "common/constants";
import { getVariable, Variable } from "../../service-worker/variable";
import { initPageScriptMessageListener } from "./pageScriptMessageListener";
import { initTestRuleHandler } from "./testRuleHandler";
import { initNetworkRecordingWidgetHandler } from "./networkRecordingWidgetHandler";
import { initExtensionMessageListener } from "../common/extensionMessageListener";

if (document.doctype?.name === "html" || document.contentType?.includes("html")) {
  initExtensionMessageListener();
  // Listen right away: the fetch/XHR page script waits (up to 2s) for this listener to acknowledge
  // each request, so registering it after the async storage read below delayed every request the
  // page made while loading. The page script is only injected while the extension is enabled.
  initPageScriptMessageListener();
  getVariable<boolean>(Variable.IS_EXTENSION_ENABLED, true).then((isExtensionStatusEnabled) => {
    if (isExtensionStatusEnabled) {
      chrome.runtime.sendMessage({ action: EXTENSION_MESSAGES.HANDSHAKE_CLIENT });
      initTestRuleHandler();
      initNetworkRecordingWidgetHandler();
    }
  });
}
