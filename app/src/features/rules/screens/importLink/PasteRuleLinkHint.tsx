import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Row } from "antd";
import PATHS from "config/constants/sub/paths";

/** Shown under the file picker of the import modals: rule links are imported on their own screen. */
export const PasteRuleLinkHint: React.FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  const navigate = useNavigate();

  return (
    <Row justify="center" className="mt-16 text-gray">
      <span>
        Got a rule link?{" "}
        <Button
          type="link"
          size="small"
          onClick={() => {
            onNavigate();
            navigate(PATHS.RULES.IMPORT_LINK.ABSOLUTE);
          }}
        >
          Paste it here
        </Button>
      </span>
    </Row>
  );
};
