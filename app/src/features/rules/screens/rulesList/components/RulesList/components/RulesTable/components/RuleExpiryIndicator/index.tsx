import React from "react";
import { Tooltip } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { formatTimeLeft, getPendingExpiry, useNow } from "features/rules/utils/ruleExpiry";
import "./ruleExpiryIndicator.css";

/** Clock shown next to the status switch of a rule that will switch itself off. */
export const RuleExpiryIndicator: React.FC<{ rule: { expiresAt?: unknown } }> = ({ rule }) => {
  const now = useNow();
  const pendingExpiry = getPendingExpiry(rule, now);

  if (!pendingExpiry) {
    return null;
  }

  return (
    <Tooltip title={`Turns off automatically at ${new Date(pendingExpiry).toLocaleTimeString()}`}>
      <span className="rule-expiry-indicator" data-testid="rule-expiry-indicator">
        <ClockCircleOutlined /> {formatTimeLeft(pendingExpiry - now)}
      </span>
    </Tooltip>
  );
};
