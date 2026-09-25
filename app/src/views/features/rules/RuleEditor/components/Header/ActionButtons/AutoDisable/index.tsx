import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Select, Tooltip } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { getCurrentlySelectedRuleData } from "store/selectors";
import { setCurrentlySelectedRule } from "components/features/rules/RuleBuilder/actions";
import { AUTO_DISABLE_OPTIONS, formatTimeLeft, getPendingExpiry, useNow } from "features/rules/utils/ruleExpiry";
import "./AutoDisable.css";

const NEVER = "never";
const PENDING = "pending";

/** Lets a rule switch itself off after a while, so it isn't left on by mistake. Applied on save. */
const AutoDisable: React.FC = () => {
  const dispatch = useDispatch();
  const rule = useSelector(getCurrentlySelectedRuleData);
  const now = useNow();
  const pendingExpiry = getPendingExpiry(rule, now);

  const handleChange = (value: number | string) => {
    if (value === PENDING) return;

    const updatedRule = { ...rule };
    if (value === NEVER) {
      delete updatedRule.expiresAt;
    } else {
      updatedRule.expiresAt = Date.now() + (value as number);
    }
    setCurrentlySelectedRule(dispatch, updatedRule, true);
  };

  const options = [
    ...(pendingExpiry
      ? [{ value: PENDING, label: `Off in ${formatTimeLeft(pendingExpiry - now)}`, disabled: true }]
      : []),
    { value: NEVER, label: "Keep on" },
    ...AUTO_DISABLE_OPTIONS.map(({ label, durationMs }) => ({ value: durationMs, label: `Turn off in ${label}` })),
  ];

  return (
    <div className="rule-editor-auto-disable" data-testid="rule-auto-disable">
      {/* Tooltip on the icon only: around the whole picker it covered the open dropdown. */}
      <Tooltip
        title="Switch this rule off automatically after a while. Takes effect when the rule is saved."
        placement="bottom"
      >
        <ClockCircleOutlined
          className={pendingExpiry ? "rule-editor-auto-disable-icon active" : "rule-editor-auto-disable-icon"}
        />
      </Tooltip>
      <Select
        size="small"
        bordered={false}
        dropdownMatchSelectWidth={false}
        value={pendingExpiry ? PENDING : NEVER}
        options={options}
        onChange={handleChange}
      />
    </div>
  );
};

export default AutoDisable;
