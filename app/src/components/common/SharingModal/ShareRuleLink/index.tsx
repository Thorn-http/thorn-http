import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button, Input } from "antd";
import { getAppMode } from "store/selectors";
import { getRulesAndGroupsFromRuleIds } from "utils/rules/misc";
import { Rule } from "@thorn-http/shared/types/entities/rules";
import { createRuleLink, LONG_LINK_LENGTH } from "features/rules/sharing/ruleLink";
import { toast } from "utils/Toast";
import "./shareRuleLink.css";

/** The selected rules as a link; the rules travel inside the link itself, so nothing is uploaded. */
export const ShareRuleLink: React.FC<{ selectedRules: string[] }> = ({ selectedRules }) => {
  const appMode = useSelector(getAppMode);
  const [link, setLink] = useState("");

  useEffect(() => {
    let cancelled = false;
    getRulesAndGroupsFromRuleIds(appMode, selectedRules)
      .then(({ rules }: { rules: Rule[] }) => createRuleLink(rules))
      .then((newLink) => !cancelled && setLink(newLink))
      .catch(() => !cancelled && toast.error("Couldn't create a link for these rules"));
    return () => {
      cancelled = true;
    };
  }, [appMode, selectedRules]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Couldn't copy. Select the link and copy it by hand."));
  };

  return (
    <div className="sharing-modal-body share-rule-link">
      <div className="share-rule-link-title">Or share as a link</div>
      <div className="share-rule-link-row">
        <Input readOnly value={link} data-testid="share-rule-link" onFocus={(e) => e.target.select()} />
        <Button onClick={copyLink} disabled={!link}>
          Copy link
        </Button>
      </div>
      <div className="share-rule-link-note">
        The rules are inside the link, so anyone who has it can see them. Leave tokens and passwords out.
        {link.length > LONG_LINK_LENGTH ? " This link is long and chat apps may cut it: prefer the file." : ""}
      </div>
    </div>
  );
};
