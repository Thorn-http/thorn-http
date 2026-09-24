import { RuleType } from "@thorn-http/shared/types/entities/rules";

export const RULES_WITHOUT_LIMITS = [RuleType.HEADERS];

export const PREMIUM_RULE_TYPES = [RuleType.RESPONSE, RuleType.REQUEST, RuleType.SCRIPT];

export const RULE_IMPORT_TYPE = {
  OVERWRITE: "overwrite",
  DUPLICATE: "duplicate",
};
