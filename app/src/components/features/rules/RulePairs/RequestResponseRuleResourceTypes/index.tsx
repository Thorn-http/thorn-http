import React, { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Radio } from "antd";
import { getCurrentlySelectedRuleData, getRequestRuleResourceType, getResponseRuleResourceType } from "store/selectors";
import { setCurrentlySelectedRule } from "../../RuleBuilder/actions";
import APP_CONSTANTS from "config/constants";
import { isDesktopMode } from "utils/AppUtils";
import { omit, set } from "lodash";
import { ResponseRule, RuleType } from "@thorn-http/shared/types/entities/rules";
import "./RequestResponseRuleResourceTypes.css";

const ResponseRuleResourceTypes: React.FC<{ ruleDetails: Record<string, unknown>; disabled: boolean }> = ({
  disabled,
  ruleDetails,
}) => {
  const dispatch = useDispatch();
  const isDesktop = useMemo(isDesktopMode, []);
  const currentlySelectedRuleData = useSelector(getCurrentlySelectedRuleData);
  const isResponseRule = currentlySelectedRuleData?.ruleType === RuleType.RESPONSE;
  const ruleResourceType = useSelector(isResponseRule ? getResponseRuleResourceType : getRequestRuleResourceType);
  const isSampleRule = currentlySelectedRuleData?.isSample;

  const requestPayloadFilter = currentlySelectedRuleData.pairs?.[0].source?.filters?.[0]?.requestPayload;

  const updateResourceType = useCallback(
    (resourceType: ResponseRule.ResourceType, clearGraphqlRequestPayload = false) => {
      const pairIndex = 0; // response rule will only have one pair
      const copyOfCurrentlySelectedRule = JSON.parse(JSON.stringify(currentlySelectedRuleData));

      const ruleTypeKey = isResponseRule ? "response" : "request";
      let updatedPair = set(
        copyOfCurrentlySelectedRule?.pairs?.[pairIndex],
        `${ruleTypeKey}.resourceType`,
        resourceType
      );

      if (clearGraphqlRequestPayload) {
        // clear graphql request payload on resource type change
        updatedPair = omit(updatedPair, ["source.filters[0].requestPayload"]);
      }

      const updatedRule = {
        ...currentlySelectedRuleData,
        pairs: [{ ...updatedPair }],
      };

      const responseValue = updatedRule?.pairs?.[pairIndex]?.[ruleTypeKey]?.value;

      const isDefaultValue = ["", "{}", ruleDetails["RESPONSE_BODY_JAVASCRIPT_DEFAULT_VALUE"]].includes(responseValue);

      setCurrentlySelectedRule(dispatch, updatedRule, !isDefaultValue);
    },
    [currentlySelectedRuleData, ruleDetails, dispatch, isResponseRule]
  );

  const isNewResponseRule = "resourceType" in (currentlySelectedRuleData?.pairs?.[0]?.response ?? {});
  const isNewRequestRule = "resourceType" in (currentlySelectedRuleData?.pairs?.[0]?.request ?? {});

  useEffect(() => {
    if (isNewResponseRule || isNewRequestRule || currentlySelectedRuleData?.ruleType === RuleType.REQUEST) return;

    // legacy rules will have "unknown" resource type
    updateResourceType(ResponseRule.ResourceType.UNKNOWN);
  }, [isNewRequestRule, isNewResponseRule, requestPayloadFilter, updateResourceType, currentlySelectedRuleData]);

  const handleResourceTypeChange = (type: ResponseRule.ResourceType) => {
    const clearGraphqlRequestPayload = type !== ResponseRule.ResourceType.GRAPHQL_API;

    updateResourceType(type, clearGraphqlRequestPayload);
  };

  return (isNewResponseRule || isNewRequestRule) && ruleResourceType !== ResponseRule.ResourceType.UNKNOWN ? (
    <div className="resource-types-container" data-tour-id="rule-editor-response-resource-type">
      <div className="subtitle">Select Resource Type</div>
      <div className="resource-types-radio-group">
        <Radio.Group
          disabled={isSampleRule || disabled}
          value={ruleResourceType}
          // Every resource type is free in THorn HTTP, so GraphQL is a plain option too. (It used to be
          // wrapped in a PremiumFeature whose click handler didn't fire on the editor's first load.)
          onChange={(e) => handleResourceTypeChange(e.target.value)}
        >
          <Radio value={ResponseRule.ResourceType.REST_API}>REST API</Radio>
          <Radio value={ResponseRule.ResourceType.GRAPHQL_API} className="graphql-radio-item">
            GraphQL API
          </Radio>
          {/* HTML / JS / CSS responses need the desktop proxy; not offered in the extension */}
          {isResponseRule && isDesktop && <Radio value={ResponseRule.ResourceType.STATIC}>HTML / JS / CSS</Radio>}
        </Radio.Group>
      </div>
    </div>
  ) : null;
};

export default ResponseRuleResourceTypes;
