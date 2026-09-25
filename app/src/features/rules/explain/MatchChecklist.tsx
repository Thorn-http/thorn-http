import React from "react";
import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled } from "@ant-design/icons";
import type { Explanation } from "./explainRuleMatch";
import "./matchChecklist.css";

const ICONS = {
  pass: <CheckCircleFilled className="match-check-icon pass" />,
  fail: <CloseCircleFilled className="match-check-icon fail" />,
  info: <InfoCircleFilled className="match-check-icon info" />,
};

/** The result of explainRuleMatch: a verdict, then every check with its reason. */
export const MatchChecklist: React.FC<{ explanation: Explanation }> = ({ explanation }) => (
  <div className="match-checklist" data-testid="match-checklist">
    <div className={`match-verdict ${explanation.applies ? "pass" : "fail"}`}>
      {explanation.applies ? "The rule applies to this request" : "The rule won't apply to this request"}
    </div>
    <ul>
      {explanation.checks.map((check) => (
        <li key={check.id} className={`match-check ${check.status}`} data-check={check.id}>
          {ICONS[check.status]}
          <div>
            <div className="match-check-title">{check.title}</div>
            {check.detail && <div className="match-check-detail">{check.detail}</div>}
          </div>
        </li>
      ))}
    </ul>
  </div>
);
