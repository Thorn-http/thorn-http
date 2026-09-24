import { Group, Rule } from "@thorn-http/shared/types/entities/rules";

export enum RuleEditorMode {
  EDIT = "edit",
  CREATE = "create",
}

export type RuleTemplate = {
  id: string;
  name: string;
  description: string;
  data: {
    ruleData: Rule | Group;
  };
};
