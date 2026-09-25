import { CLIENT_MESSAGES, EXTENSION_MESSAGES } from "common/constants";
import { checkIfNoRulesPresent, getRulesAndGroups } from "common/rulesStore";
import { applyScriptRules } from "../scriptRuleHandler";
import { initCustomWidgets } from "../customWidgets";
import { requestProcessor } from "../requestProcessor";
import {
  handleTestRuleOnClientPageLoad,
  launchUrlAndStartRuleTesting,
  saveTestRuleResult,
} from "../testThisRuleHandler";
import ruleExecutionHandler from "../ruleExecutionHandler";
import { isExtensionEnabled, isUrlInBlockList } from "../../../utils";
import { globalStateManager } from "../globalStateManager";
import { sendMessageToApp } from "./sender";
import { updateExtensionStatus } from "../utils";
import extensionIconManager from "../extensionIconManager";
import {
  startNetworkRecording,
  stopNetworkRecording,
  getNetworkRecordingState,
  handleNetworkRecordingOnClientPageLoad,
  onNetworkBodyCaptured,
  onBodyRecorderReady,
  reopenNetworkRecordingPanel,
} from "../networkRecording";
import { openRuleLink } from "../ruleLink";
import { allowDelayedNavigation } from "../delayedNavigation";
import rulesStorageService from "../../../rulesStorageService";

const getSenderOrigin = (sender: chrome.runtime.MessageSender) =>
  sender.origin ?? (sender.url ? new URL(sender.url).origin : undefined);

export const initMessageHandler = () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    /* From any case, return true when sendResponse is called asynchronously */
    switch (message.action) {
      case EXTENSION_MESSAGES.HANDSHAKE_CLIENT:
        isExtensionEnabled().then((isExtensionStatusEnabled) => {
          if (!isExtensionStatusEnabled) return;
          initCustomWidgets(sender.tab?.id, sender.frameId);
          applyScriptRules(sender.tab?.id, sender.frameId, sender.url, sender.tab?.url);
        });
        break;

      case EXTENSION_MESSAGES.ALLOW_DELAYED_NAVIGATION:
        allowDelayedNavigation(message.url, sender).then(
          () => sendResponse(true),
          () => sendResponse(false)
        );
        return true;

      case EXTENSION_MESSAGES.OPEN_RULE_LINK:
        openRuleLink(message.payload, sender);
        break;

      case EXTENSION_MESSAGES.CLIENT_PAGE_LOADED:
        ruleExecutionHandler.processTabCachedRulesExecutions(sender.tab.id);
        handleTestRuleOnClientPageLoad(sender.tab);
        handleNetworkRecordingOnClientPageLoad(sender.tab);
        break;

      case CLIENT_MESSAGES.NETWORK_BODY_CAPTURED:
        // Network Interceptor v2: an XHR/Fetch body+headers captured by the SDK page script.
        onNetworkBodyCaptured(sender.tab?.id, message.payload, sender.frameId);
        break;

      case CLIENT_MESSAGES.NETWORK_BODY_RECORDER_READY:
        // Network Interceptor v2: the page body-recorder is armed — reply with START (resolved caps).
        onBodyRecorderReady(sender.tab?.id);
        break;

      case EXTENSION_MESSAGES.REOPEN_NETWORK_RECORDING_PANEL:
        // Floating widget asked to reopen the closed side panel for this tab.
        reopenNetworkRecordingPanel(sender.tab?.id);
        break;

      case EXTENSION_MESSAGES.GET_RULES_AND_GROUPS:
        getRulesAndGroups().then(sendResponse);
        return true;

      case EXTENSION_MESSAGES.GET_EXECUTED_RULES:
        ruleExecutionHandler.getExecutedRules(message.tabId ?? sender.tab.id).then(sendResponse);
        return true;

      case EXTENSION_MESSAGES.CHECK_IF_NO_RULES_PRESENT:
        checkIfNoRulesPresent().then(sendResponse);
        return true;

      case EXTENSION_MESSAGES.CHECK_IF_EXTENSION_ENABLED:
        isExtensionEnabled().then(sendResponse);
        return true;

      case EXTENSION_MESSAGES.TOGGLE_EXTENSION_STATUS:
        console.log(`[Toggle extension status] message received`, {
          message,
        });
        updateExtensionStatus(message.newStatus)
          .then((updatedStatus) => {
            const response = {
              success: true,
              updatedStatus,
            };
            sendResponse(response);
            console.log(`[Toggle extension status] response sent`, {
              ...response,
              extensionIconState: extensionIconManager.getState(),
            });
          })
          .catch((e) => {
            sendResponse({
              success: false,
            });
            console.log(
              "[messageHandler.handleToggleExtensionStatus] Error occurred while updating extension status.",
              {
                error: e.message,
                extensionIconState: extensionIconManager.getState(),
                message,
              }
            );
          });
        return true;

      // These two come from the page script, relayed from the page, so the page controls their
      // content: the initiator is always taken from the sender instead.
      case EXTENSION_MESSAGES.ON_BEFORE_AJAX_REQUEST:
        requestProcessor
          .onBeforeAJAXRequest(sender.tab.id, { ...message.requestDetails, initiator: getSenderOrigin(sender) })
          .then(sendResponse);
        return true;

      case EXTENSION_MESSAGES.ON_ERROR_OCCURRED:
        requestProcessor.onErrorOccurred(sender.tab.id, getSenderOrigin(sender)).then(sendResponse);
        return true;

      case EXTENSION_MESSAGES.TEST_RULE_ON_URL:
        launchUrlAndStartRuleTesting(message, sender.tab.id);
        break;

      case EXTENSION_MESSAGES.SAVE_TEST_RULE_RESULT:
        saveTestRuleResult(message, sender.tab);
        break;

      case EXTENSION_MESSAGES.RULE_EXECUTED:
        // Also relayed from the page: only report rules that exist and are enabled, as stored.
        rulesStorageService.getEnabledRules().then((enabledRules) => {
          const rule = enabledRules.find((enabledRule) => enabledRule.id === message.rule?.id);
          if (!rule || !sender.tab) return;
          ruleExecutionHandler.onRuleExecuted(rule, { ...message.requestDetails, tabId: sender.tab.id });
        });
        break;

      case EXTENSION_MESSAGES.IS_EXTENSION_BLOCKED_ON_TAB: {
        if (!message.tabUrl) {
          sendResponse(false);
          break;
        }

        isUrlInBlockList(message.tabUrl)
          .then((isBlocked) => sendResponse(isBlocked))
          .catch(() => sendResponse(false));

        return true;
      }

      case EXTENSION_MESSAGES.NOTIFY_RECORD_UPDATED_IN_POPUP:
        sendMessageToApp({ action: CLIENT_MESSAGES.NOTIFY_RECORD_UPDATED, payload: message?.payload });
        break;

      case EXTENSION_MESSAGES.CACHE_SHARED_STATE:
        globalStateManager.updateSharedStateInStorage(sender.tab.id, message.sharedState);
        break;

      case EXTENSION_MESSAGES.START_NETWORK_RECORDING:
        // From the popup: record the given URL in a new tab with the side panel open.
        // No await before startNetworkRecording, it must run inside the click's user gesture.
        startNetworkRecording(message.url, {}, { tabId: sender.tab?.id, windowId: sender.tab?.windowId }).then(
          sendResponse
        );
        return true;

      case EXTENSION_MESSAGES.STOP_NETWORK_RECORDING:
        stopNetworkRecording(message.targetTabId || sender.tab?.id);
        break;

      case EXTENSION_MESSAGES.GET_NETWORK_RECORDING_STATE:
        sendResponse(getNetworkRecordingState(message.tabId || sender.tab?.id));
        return true;
    }

    return false;
  });
};
