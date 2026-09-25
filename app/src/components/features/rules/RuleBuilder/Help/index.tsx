import React, { useRef, useState } from "react";
import { Button, Col, Row, DrawerProps } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import "react-medium-image-zoom/dist/styles.css";
import LeftArrow from "assets/icons/left-arrow.svg?react";
import RightArrow from "assets/icons/right-arrow.svg?react";
import { ExternalLink } from "./types";
import APP_CONSTANTS from "config/constants";
import {
  trackDocsSidebarContactUsClicked,
  trackDocsSidebarSecondaryCategoryClicked,
} from "modules/analytics/events/common/rules";
import { MdClose } from "@react-icons/all-files/md/MdClose";
import { RuleDetailsPanel } from "views/features/rules/RuleEditor/components/RuleDetailsPanel/RuleDetailsPanel";
import "./Help.scss";
import "prismjs/themes/prism-tomorrow.css";
import { RULE_DETAILS } from "views/features/rules/RuleEditor/components/RuleDetailsPanel/constants";
import { sampleRuleDetails } from "features/rules/screens/rulesList/components/RulesList/constants";
import { getCurrentlySelectedRuleData } from "store/selectors";
import { useSelector } from "react-redux";
import { RuleType } from "@thorn-http/shared/types/entities/rules";

const externalLinks: ExternalLink[] = [
  {
    title: "Documentation",
    link: APP_CONSTANTS.LINKS.REQUESTLY_DOCS,
  },
  {
    title: "Report an issue or request a feature",
    link: APP_CONSTANTS.LINKS.REQUESTLY_GITHUB_ISSUES,
  },
];

interface HelpProps {
  ruleType: RuleType;
  onClose: DrawerProps["onClose"];
}

const Help: React.FC<HelpProps> = ({ ruleType, onClose }) => {
  const [isDocsVisible, setIsDocsVisible] = useState<boolean>(false);
  const documentationListRef = useRef<HTMLDivElement | null>(null);
  const currentlySelectedRuleData = useSelector(getCurrentlySelectedRuleData);
  const isSampleRule = currentlySelectedRuleData?.isSample;

  const toggleDocs = () => {
    if (isDocsVisible) {
      setTimeout(() => {
        if (documentationListRef.current) {
          documentationListRef.current.scrollTop = 0;
        }
      }, 0);
    }
    setIsDocsVisible((prev) => !prev);
  };

  return (
    <div className="rule-editor-help-container">
      <div className="rule-editor-help-content-container">
        <Row align="middle" justify="space-between" className="w-full rule-editor-help-header">
          <Col className="title items-center">
            {isDocsVisible && (
              <Button onClick={toggleDocs} icon={<LeftArrow />} className="rule-editor-help-back-btn" />
            )}
            Help and guide
          </Col>
          <Col>
            <Button onClick={onClose} icon={<MdClose className="anticon" />} className="rule-editor-help-close-btn" />
          </Col>
        </Row>

        <div className="rule-editor-help-content">
          {!isDocsVisible ? (
            <RuleDetailsPanel
              isSample={isSampleRule}
              ruleDetails={
                isSampleRule ? sampleRuleDetails[currentlySelectedRuleData.sampleId].details : RULE_DETAILS[ruleType]
              }
              source="docs_sidebar"
            />
          ) : null}

          {isDocsVisible ? null : (
            <>
              {/* internal links */}
              <div ref={documentationListRef} className="rule-editor-help-lists">
                {/* external links */}
                <div className="caption text-gray text-bold rule-editor-help-title">
                  <InfoCircleOutlined />
                  Help categories
                </div>
                <ul className="rule-editor-help-list external-links">
                  {externalLinks.map(({ title, link }) => (
                    <li key={title}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackDocsSidebarSecondaryCategoryClicked(ruleType, title.toLowerCase())}
                      >
                        {title} <RightArrow />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
      {/* footer */}
      <Row className="rule-editor-help-footer">
        <Button
          onClick={() => {
            trackDocsSidebarContactUsClicked(ruleType);
            window.open(APP_CONSTANTS.LINKS.CONTACT_US_PAGE, "_blank");
          }}
        >
          Contact us
        </Button>
      </Row>
    </div>
  );
};

export default Help;
