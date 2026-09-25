import { getRules, isRuleExpired, onRuleOrGroupChange } from "common/rulesStore";
import { saveObject } from "common/storage";
import { Rule, Status } from "common/types";
import { CLIENT_MESSAGES } from "common/constants";
import { updateLastUpdatedTS } from "common/utils";
import { debounce } from "../../utils";
import { sendMessageToApp } from "./messageHandler/sender";

const EXPIRY_ALARM = "thorn-rule-expiry";

/**
 * Rules can carry an `expiresAt` timestamp ("auto-disable in 1h"). Expired rules are already
 * skipped wherever enabled rules are read; this switches them off in storage too, so the UI shows
 * them as disabled, and keeps one alarm set for the next expiry.
 */
const disableExpiredRules = async (rules: Rule[], now: number): Promise<void> => {
  const expiredRules = rules.filter((rule) => isRuleExpired(rule, now));
  if (!expiredRules.length) {
    return;
  }

  // Inactive rules only lose their stale timer, so turning one back on later doesn't switch it
  // straight off again.
  const updates: Record<string, Rule> = {};
  expiredRules.forEach((rule) => {
    const { expiresAt, ...ruleWithoutExpiry } = rule;
    updates[rule.id] =
      rule.status === Status.ACTIVE
        ? { ...ruleWithoutExpiry, status: Status.INACTIVE, modificationDate: now }
        : (ruleWithoutExpiry as Rule);
  });

  await saveObject(updates);
  await updateLastUpdatedTS();
  sendMessageToApp({ action: CLIENT_MESSAGES.NOTIFY_RECORD_UPDATED }).catch(() => {});
};

const scheduleNextExpiry = async (rules: Rule[], now: number): Promise<void> => {
  const upcomingExpiries = rules
    .filter((rule) => typeof rule.expiresAt === "number" && rule.expiresAt > now)
    .map((rule) => rule.expiresAt);

  if (!upcomingExpiries.length) {
    await chrome.alarms.clear(EXPIRY_ALARM);
    return;
  }

  await chrome.alarms.create(EXPIRY_ALARM, { when: Math.min(...upcomingExpiries) });
};

const syncRuleExpiries = async (): Promise<void> => {
  const now = Date.now();
  const rules = await getRules();
  await disableExpiredRules(rules, now);
  await scheduleNextExpiry(rules, now);
};

export const initRuleExpiryManager = (): void => {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === EXPIRY_ALARM) {
      syncRuleExpiries();
    }
  });
  onRuleOrGroupChange(debounce(syncRuleExpiries, 500));
  syncRuleExpiries();
};
