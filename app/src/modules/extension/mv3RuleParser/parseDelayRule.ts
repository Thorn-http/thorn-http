import { DelayRule } from "@thorn-http/shared/types/entities/rules";
import { ExtensionResourceType, ExtensionRule, RuleActionType } from "../types";
import { parseConditionFromSource } from "./utils";

/** Query param that marks a page load to delay; the extension turns it into its local delay page. */
export const DELAY_MARKER_PARAM = "thorn-delay";

const FRAME_TYPES = ["main_frame", "sub_frame"] as ExtensionResourceType[];

/**
 * Only page and iframe loads are delayed through declarativeNetRequest: they get the marker param,
 * which the extension redirects to its own delay page (a local countdown that then loads the page).
 * fetch/XHR are delayed by the page script, and scripts, styles, images and fonts through the
 * optional debugger permission, so nothing ever goes through a server.
 */
const parseDelayRule = (rule: DelayRule.Record): ExtensionRule[] => {
  return rule.pairs.flatMap((rulePair): ExtensionRule[] => {
    const condition = parseConditionFromSource(rulePair.source);
    const resourceTypes = condition.resourceTypes?.length
      ? condition.resourceTypes.filter((type) => FRAME_TYPES.includes(type))
      : FRAME_TYPES;

    if (!resourceTypes.length) {
      return [];
    }

    return [
      {
        priority: 1,
        condition: { ...condition, resourceTypes },
        action: {
          type: RuleActionType.REDIRECT,
          redirect: {
            transform: {
              queryTransform: {
                addOrReplaceParams: [{ key: DELAY_MARKER_PARAM, value: String(rulePair.delay) }],
              },
            },
          },
        },
      },
    ];
  });
};

export default parseDelayRule;
