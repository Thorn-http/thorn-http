//@ts-ignore
import { RULE_PROCESSOR } from "@thorn-http/core";
import { ExplainInput, explainRuleMatch as explainWith } from "./explainRuleMatch";

export type { CheckStatus, Explanation, MatchCheck } from "./explainRuleMatch";

/** explainRuleMatch with the same URL matcher the rules use. */
export const explainRuleMatch = (input: ExplainInput) =>
  explainWith(input, (component, operator, value) => {
    return RULE_PROCESSOR.RuleMatcher.matchUrlCriteria(component, operator, value)?.destination != null;
  });
export { MatchChecklist } from "./MatchChecklist";
