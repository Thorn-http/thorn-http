import { EXTENSION_MESSAGES } from "../constants";
import { Rule } from "../types";

/** chrome.storage.local key of the rule the editor should open with (see useRuleEditorDraft in the app). */
export const RULE_EDITOR_DRAFT_KEY = "rule_editor_draft";

export interface RuleEditorDraft {
  id: string;
  ruleType: string;
  name?: string;
  description?: string;
  pair: Record<string, unknown>;
}

/**
 * Opens the rule editor on a new rule of `ruleType` filled in by `initRuleData` (e.g. from recorded
 * traffic). The rule goes through extension storage, not through the page, and the user reviews and
 * saves it. Works from any extension page, DevTools panel included (which can't open tabs itself).
 */
export const openRuleEditorWith = async <T extends Rule>(ruleType: string, initRuleData: (rule: T) => void) => {
  const rule = ({ ruleType, name: "", pairs: [{}] } as unknown) as T;
  initRuleData(rule);

  const draft: RuleEditorDraft = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ruleType,
    name: rule.name,
    description: rule.description as string | undefined,
    pair: (rule.pairs[0] as unknown) as Record<string, unknown>,
  };
  await chrome.storage.local.set({ [RULE_EDITOR_DRAFT_KEY]: draft });
  await chrome.runtime.sendMessage({
    action: EXTENSION_MESSAGES.OPEN_RULE_EDITOR_DRAFT,
    ruleType,
    draftId: draft.id,
  });
};
