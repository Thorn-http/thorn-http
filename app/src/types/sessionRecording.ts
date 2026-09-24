import { RuleSourceKey, RuleSourceOperator } from "@thorn-http/shared/types/entities/rules";

export type SessionRecordingPageSource = {
  id?: string;
  key: RuleSourceKey;
  value: string;
  isActive: boolean;
  operator: RuleSourceOperator;
};
