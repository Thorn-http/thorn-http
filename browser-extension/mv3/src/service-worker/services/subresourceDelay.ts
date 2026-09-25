import { Rule, RuleType, SourceKey, SourceOperator, UrlSource } from "common/types";
import { STORAGE_KEYS } from "common/constants";
import { matchRuleWithRequest } from "../../common/ruleMatcher";
import rulesStorageService from "../../rulesStorageService";
import { isExtensionEnabled } from "../../utils";
import { onVariableChange, Variable } from "../variable";
import { ChangeType } from "common/storage";

/**
 * Delay rules for scripts, styles, images, fonts and media. Browsers don't let extensions hold
 * these requests, so the only local way is Chrome's debugger (Fetch domain): pause the requests a
 * Delay rule matches and continue them when the time is up. The "debugger" permission is optional
 * and only requested after the user reads what it does (Delay rule editor and Settings).
 *
 * It's only attached while it is needed: permission granted, extension on, at least one enabled
 * Delay rule that covers these request types, and the user hasn't closed Chrome's debugging bar
 * (closing it pauses these delays until they are resumed in the editor or Settings).
 */

const PROTOCOL_VERSION = "1.3";
const MAX_DELAY_MS = 10 * 60 * 1000;
const KEEPALIVE_MS = 20 * 1000;

// Chrome DevTools Protocol resource types handled here, and the rule filter value for each.
// Page/iframe loads and fetch/XHR are delayed elsewhere (delay page and page script).
const CDP_RESOURCE_TYPES: Record<string, string> = {
  Script: "script",
  Stylesheet: "stylesheet",
  Image: "image",
  Font: "font",
  Media: "media",
  Other: "other",
  Ping: "ping",
};
export const SUBRESOURCE_TYPES = Array.from(new Set(Object.values(CDP_RESOURCE_TYPES)));

const attachedTabs = new Set<number>();
let pendingDelays = 0;
let keepaliveId: ReturnType<typeof setInterval> | undefined;

const hasDebuggerPermission = () =>
  chrome.permissions?.contains({ permissions: ["debugger"] }).catch(() => false) ?? Promise.resolve(false);

const isPausedByUser = async () =>
  !!(await chrome.storage.session.get(STORAGE_KEYS.SUBRESOURCE_DELAY_PAUSED))[STORAGE_KEYS.SUBRESOURCE_DELAY_PAUSED];

const coversSubresources = (rule: Rule) =>
  rule.pairs?.some((pair) => {
    const types: string[] = pair.source.filters?.[0]?.resourceType ?? [];
    return !types.length || types.some((type) => SUBRESOURCE_TYPES.includes(type));
  });

const getSubresourceDelayRules = async () =>
  (await rulesStorageService.getEnabledRules(RuleType.DELAY)).filter(coversSubresources);

/** A Fetch.enable URL pattern that covers everything the source can match (the rule decides later). */
const toUrlPattern = (source: UrlSource) => {
  const escape = (text: string) => text.replace(/[\\*?]/g, "\\$&");
  if (!source.value || source.key !== SourceKey.URL) return "*";
  switch (source.operator) {
    case SourceOperator.EQUALS:
      return escape(source.value);
    case SourceOperator.CONTAINS:
      return `*${escape(source.value)}*`;
    case SourceOperator.WILDCARD_MATCHES:
      return source.value;
    default:
      return "*";
  }
};

const getFetchPatterns = (rules: Rule[]) => {
  const urlPatterns = new Set(rules.flatMap((rule) => rule.pairs.map((pair) => toUrlPattern(pair.source))));
  const patterns = urlPatterns.has("*") ? ["*"] : Array.from(urlPatterns);
  return patterns.flatMap((urlPattern) =>
    Object.keys(CDP_RESOURCE_TYPES).map((resourceType) => ({ urlPattern, resourceType, requestStage: "Request" }))
  );
};

const isActive = async (rules: Rule[]) =>
  rules.length > 0 && (await hasDebuggerPermission()) && (await isExtensionEnabled()) && !(await isPausedByUser());

const enableFetch = (tabId: number, rules: Rule[]) =>
  chrome.debugger.sendCommand({ tabId }, "Fetch.enable", { patterns: getFetchPatterns(rules) }).catch(() => {});

const attach = async (tabId: number, rules: Rule[]) => {
  if (attachedTabs.has(tabId)) return;
  attachedTabs.add(tabId);
  try {
    await chrome.debugger.attach({ tabId }, PROTOCOL_VERSION);
    await enableFetch(tabId, rules);
  } catch (e) {
    attachedTabs.delete(tabId); // e.g. a page the debugger can't attach to
  }
};

const detachAll = async () => {
  const tabs = Array.from(attachedTabs);
  attachedTabs.clear();
  await Promise.all(tabs.map((tabId) => chrome.debugger.detach({ tabId }).catch(() => {})));
};

/**
 * Web pages, plus blank tabs that are about to load one: attaching takes a moment, so a tab is best
 * attached before its page starts loading. (Chrome's own pages, like a new tab page, can't be; the
 * first page opened from one may load a few files before the delays apply.)
 */
const isAttachable = (url?: string) => !url || url === "about:blank" || /^https?:/.test(url);

/** Attaches to, re-configures or detaches from tabs to match the current rules and consent. */
const sync = async () => {
  if (!chrome.debugger) return; // not granted, or not available in this browser
  const rules = await getSubresourceDelayRules();

  if (!(await isActive(rules))) {
    await detachAll();
    return;
  }

  attachedTabs.forEach((tabId) => enableFetch(tabId, rules));
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map((tab) => tab.id !== undefined && isAttachable(tab.pendingUrl || tab.url) && attach(tab.id, rules))
  );
};

const updateKeepalive = () => {
  // A pending delay lives in a timer here, so the service worker must stay up until it fires.
  if (pendingDelays > 0 && keepaliveId === undefined) {
    keepaliveId = setInterval(() => chrome.runtime.getPlatformInfo().catch(() => {}), KEEPALIVE_MS);
  } else if (pendingDelays === 0 && keepaliveId !== undefined) {
    clearInterval(keepaliveId);
    keepaliveId = undefined;
  }
};

const onRequestPaused = async (source: chrome.debugger.Debuggee, params: any) => {
  const continueRequest = () =>
    chrome.debugger.sendCommand(source, "Fetch.continueRequest", { requestId: params.requestId }).catch(() => {});

  const requestDetails = {
    url: params.request.url,
    method: params.request.method,
    type: CDP_RESOURCE_TYPES[params.resourceType] ?? "other",
  } as any;
  const rules = await getSubresourceDelayRules();
  const matchedPair = rules.map((rule) => matchRuleWithRequest(rule, requestDetails)).find((result) => result.isApplied)
    ?.matchedPair;
  const delay = Math.min(parseInt((matchedPair as { delay?: string } | undefined)?.delay) || 0, MAX_DELAY_MS);

  if (!delay) {
    continueRequest();
    return;
  }

  pendingDelays++;
  updateKeepalive();
  setTimeout(() => {
    continueRequest();
    pendingDelays--;
    updateKeepalive();
  }, delay);
};

export const initSubresourceDelay = () => {
  if (!chrome.debugger && !chrome.permissions) return;

  // Listeners on chrome.debugger only exist once the permission is granted.
  const addDebuggerListeners = () => {
    if (!chrome.debugger || (addDebuggerListeners as any).done) return;
    (addDebuggerListeners as any).done = true;

    chrome.debugger.onEvent.addListener((source, method, params) => {
      if (method === "Fetch.requestPaused") onRequestPaused(source, params);
    });
    chrome.debugger.onDetach.addListener((source, reason) => {
      if (source.tabId !== undefined) attachedTabs.delete(source.tabId);
      // The user closed Chrome's "started debugging this browser" bar: respect it.
      if (reason === "canceled_by_user") {
        chrome.storage.session.set({ [STORAGE_KEYS.SUBRESOURCE_DELAY_PAUSED]: true });
        detachAll();
      }
    });
  };
  addDebuggerListeners();

  chrome.permissions?.onAdded.addListener(() => {
    addDebuggerListeners();
    chrome.storage.session.remove(STORAGE_KEYS.SUBRESOURCE_DELAY_PAUSED).then(sync);
  });
  chrome.permissions?.onRemoved.addListener(() => {
    attachedTabs.clear(); // Chrome detaches by itself
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "session" && STORAGE_KEYS.SUBRESOURCE_DELAY_PAUSED in changes) sync();
  });

  // New pages: attach before their scripts and styles are requested.
  chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0 || !/^https?:/.test(details.url) || !chrome.debugger) return;
    const rules = await getSubresourceDelayRules();
    if (await isActive(rules)) attach(details.tabId, rules);
  });
  chrome.tabs.onCreated.addListener(async (tab) => {
    if (tab.id === undefined || !isAttachable(tab.pendingUrl || tab.url) || !chrome.debugger) return;
    const rules = await getSubresourceDelayRules();
    if (await isActive(rules)) attach(tab.id, rules);
  });
  chrome.tabs.onRemoved.addListener((tabId) => attachedTabs.delete(tabId));

  rulesStorageService.onRuleOrGroupChange(sync);
  onVariableChange(Variable.IS_EXTENSION_ENABLED, sync, [ChangeType.MODIFIED, ChangeType.CREATED]);
  sync();
};
