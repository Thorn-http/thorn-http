import React, { useCallback, useState } from "react";
import { Button, Col, Row, Switch, Typography, Tooltip, message } from "antd";
import { EXTENSION_MESSAGES } from "../../../constants";
import config from "../../../config";
import { EVENT, sendEvent } from "../../events";

interface PopupHeaderProps {
  isExtensionEnabled: boolean;
  handleToggleExtensionStatus: (newStatus: boolean) => void;
}

const PopupHeader: React.FC<PopupHeaderProps> = ({ isExtensionEnabled, handleToggleExtensionStatus }) => {
  const onOpenAppButtonClick = useCallback(() => {
    window.open(`${config.WEB_URL}?source=popup`, "_blank");
    sendEvent(EVENT.OPEN_APP_CLICKED);
  }, []);

  const [isStartingRecording, setIsStartingRecording] = useState(false);

  // Records the active tab's URL in a new tab and opens the network side panel (HAR export there).
  const onRecordNetworkClick = useCallback(() => {
    setIsStartingRecording(true);
    chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
      chrome.runtime.sendMessage(
        { action: EXTENSION_MESSAGES.START_NETWORK_RECORDING, url: activeTab?.url },
        (response: { success: boolean; error?: string }) => {
          setIsStartingRecording(false);
          if (!response?.success) {
            message.error(response?.error || "Could not start the network recording", 2);
            return;
          }
          window.close();
        }
      );
    });
  }, []);

  return (
    <div className="popup-header">
      <div className="popup-header-workspace-section">
        <img className="product-logo" src="/resources/images/48x48.png" />
      </div>

      <Row align="middle" gutter={16}>
        <Col>
          <Row align="middle">
            <Tooltip
              open={!isExtensionEnabled}
              title="Please switch on the THorn HTTP extension. When paused, rules won't be applied."
              overlayClassName="enable-extension-tooltip"
              color="var(--neutrals-black)"
              overlayInnerStyle={{ fontSize: "14px" }}
            >
              <Switch
                checked={isExtensionEnabled}
                onChange={handleToggleExtensionStatus}
                size="small"
                className="pause-switch"
              />
            </Tooltip>
            <Typography.Text>{`THorn HTTP ${isExtensionEnabled ? "running" : "paused"}`}</Typography.Text>
          </Row>
        </Col>
        <Col>
          <Tooltip title="Record the network traffic of this page and export it as HAR">
            <Button
              className="record-network-btn"
              onClick={onRecordNetworkClick}
              loading={isStartingRecording}
              disabled={!isExtensionEnabled}
            >
              Record network
            </Button>
          </Tooltip>
        </Col>
        <Col>
          <Button type="primary" className="open-app-btn" onClick={onOpenAppButtonClick}>
            Open app
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default PopupHeader;
