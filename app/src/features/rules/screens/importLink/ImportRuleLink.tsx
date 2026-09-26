import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Button, Input } from "antd";
import { Rule, RuleType } from "@thorn-http/shared/types/entities/rules";
import { getAppMode, getIsRefreshRulesPending } from "store/selectors";
import { getAllRules } from "store/features/rules/selectors";
import { getUserAuthDetails } from "store/slices/global/user/selectors";
import { globalActions } from "store/slices/global/slice";
import { addRulesAndGroupsToStorage, processDataToImport } from "components/features/rules/ImportRulesModal/actions";
import RuleTypeTag from "components/common/RuleTypeTag";
import PATHS from "config/constants/sub/paths";
import { toast } from "utils/Toast";
import { readRuleLink } from "features/rules/sharing/ruleLink";
import "./importRuleLink.css";

const describeSource = (rule: Rule) => {
  const source = (rule.pairs?.[0] as { source?: { operator?: string; value?: string } })?.source;
  return source?.value ? `${source.operator ?? ""} ${source.value}`.trim() : "";
};

/** Preview and import of rules shared as a link (see features/rules/sharing/ruleLink). */
export const ImportRuleLink: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appMode = useSelector(getAppMode);
  const allRules = useSelector(getAllRules);
  const user = useSelector(getUserAuthDetails);
  const isRulesListRefreshPending = useSelector(getIsRefreshRulesPending);

  const [pastedLink, setPastedLink] = useState("");
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const preview = useCallback((link: string) => {
    setError("");
    setRules(null);
    readRuleLink(link)
      .then(setRules)
      .catch((e: Error) => setError(e.message));
  }, []);

  const linkInUrl = searchParams.get("d");
  useEffect(() => {
    if (linkInUrl) preview(linkInUrl);
  }, [linkInUrl, preview]);

  const importRules = async () => {
    setIsImporting(true);
    try {
      // New ids, so a link can never overwrite rules that are already here. Imported rules are
      // always switched off: they come from someone else and should be reviewed first.
      const { data } = await processDataToImport(rules, user, allRules, false);
      await addRulesAndGroupsToStorage(appMode, data);
      dispatch(globalActions.updateRefreshPendingStatus({ type: "rules", newValue: !isRulesListRefreshPending }));
      toast.success(`Imported ${data.length} ${data.length === 1 ? "rule" : "rules"}, switched off`);
      navigate(PATHS.RULES.MY_RULES.ABSOLUTE);
    } catch (e) {
      toast.error("Couldn't import these rules");
      setIsImporting(false);
    }
  };

  const hasScriptRules = rules?.some((rule) => rule.ruleType === RuleType.SCRIPT);

  return (
    <div className="import-rule-link">
      <h2>Import shared rules</h2>

      {!linkInUrl && (
        <div className="import-rule-link-paste">
          <Input
            placeholder="Paste a THorn HTTP rule link"
            value={pastedLink}
            onChange={(e) => setPastedLink(e.target.value)}
            onPressEnter={() => preview(pastedLink)}
          />
          <Button onClick={() => preview(pastedLink)} disabled={!pastedLink.trim()}>
            Preview
          </Button>
        </div>
      )}

      {error && <Alert type="error" showIcon message={error} data-testid="import-rule-link-error" />}

      {rules && (
        <>
          <Alert
            type="warning"
            showIcon
            message="These rules come from whoever sent you the link. They're added switched off: review each one before turning it on."
            description={
              hasScriptRules ? "Some are Insert Script rules, which run code on the pages they match." : undefined
            }
          />
          <ul className="import-rule-link-list" data-testid="import-rule-link-list">
            {rules.map((rule, index) => (
              <li key={index}>
                <RuleTypeTag ruleType={rule.ruleType} />
                <span className="import-rule-link-name">{rule.name}</span>
                <span className="import-rule-link-source">{describeSource(rule)}</span>
              </li>
            ))}
          </ul>
          <div className="import-rule-link-actions">
            <Button onClick={() => navigate(PATHS.RULES.MY_RULES.ABSOLUTE)}>Cancel</Button>
            <Button type="primary" loading={isImporting} onClick={importRules}>
              Import {rules.length} {rules.length === 1 ? "rule" : "rules"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
