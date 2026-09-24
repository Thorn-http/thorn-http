import { getRulesAndGroupsFromRuleIds } from "utils/rules/misc";
import { Group as NewGroup, StorageRecord } from "@requestly/shared/types/entities/rules";

export const prepareContentToExport = (appMode: string, selectedRuleIds: string[]) => {
  return new Promise((resolve) => {
    getRulesAndGroupsFromRuleIds(appMode, selectedRuleIds).then(({ rules, groups }) => {
      const updatedGroups: NewGroup[] = groups.map((group) => ({
        ...group,
        children: [] as NewGroup[],
      }));
      resolve({
        fileContent: JSON.stringify((rules as StorageRecord[]).concat(updatedGroups), null, 2),
        rulesCount: rules.length,
        groupsCount: updatedGroups.length,
      });
    });
  });
};
