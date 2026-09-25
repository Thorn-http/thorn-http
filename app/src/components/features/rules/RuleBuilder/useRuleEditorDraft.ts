/* global chrome */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { getCurrentlySelectedRuleData } from "store/selectors";
import { setCurrentlySelectedRule } from "./actions";
import APP_CONSTANTS from "config/constants";

// Written by the extension's "Create mock" (browser-extension/common/src/rules/openRuleEditor.ts).
const RULE_EDITOR_DRAFT_KEY = "rule_editor_draft";

interface RuleEditorDraft {
  id: string;
  ruleType: string;
  name?: string;
  description?: string;
  pair: Record<string, unknown>;
}

/**
 * Opens a new rule pre-filled by the extension (e.g. a mock made from recorded traffic): the editor
 * URL carries ?draft=<id>, the rule itself waits in extension storage and is used once.
 */
const useRuleEditorDraft = (mode: string) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const rule = useSelector(getCurrentlySelectedRuleData);
  const appliedDraftIdRef = useRef<string | null>(null);
  const draftId = new URLSearchParams(location.search).get("draft");

  useEffect(() => {
    const isBlankNewRule = mode === APP_CONSTANTS.RULE_EDITOR_CONFIG.MODES.CREATE && rule?.pairs?.length;
    if (!draftId || !isBlankNewRule || appliedDraftIdRef.current === draftId || typeof chrome === "undefined") return;
    appliedDraftIdRef.current = draftId;

    chrome.storage.local.get(RULE_EDITOR_DRAFT_KEY).then((stored) => {
      const draft = stored[RULE_EDITOR_DRAFT_KEY] as RuleEditorDraft | undefined;
      if (!draft || draft.id !== draftId || draft.ruleType !== rule.ruleType) return;
      chrome.storage.local.remove(RULE_EDITOR_DRAFT_KEY);

      setCurrentlySelectedRule(
        dispatch,
        {
          ...rule,
          name: draft.name || rule.name,
          description: draft.description || rule.description,
          pairs: [{ ...rule.pairs[0], ...draft.pair }],
        },
        true
      );
    });
  }, [draftId, mode, rule, dispatch]);
};

export default useRuleEditorDraft;
