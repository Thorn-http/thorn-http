import React, { useEffect } from "react";
import { Col } from "antd";
import { SettingsPrimarySidebar } from "../SettingsPrimarySidebar";
import { Outlet, useLocation } from "react-router-dom";
import { trackAppSettingsViewed } from "features/settings/analytics";
import { isDesktopMode } from "utils/AppUtils";
import { isFeatureCompatible } from "utils/CompatibilityUtils";
import FEATURES from "config/constants/sub/features";
import { getUserOS } from "utils/osUtils";
import "./index.scss";

const SettingsIndex: React.FC = () => {
  const location = useLocation();
  const { state } = location;

  useEffect(() => {
    trackAppSettingsViewed(location.pathname, state?.source);
  }, [location.pathname, state?.source]);

  const isDesktopFramelessMode = isDesktopMode() && isFeatureCompatible(FEATURES.FRAMELESS_DESKTOP_APP);

  return (
    <div
      className={`settings-index-wrapper ${
        isDesktopFramelessMode ? `app-mode-desktop app-mode-desktop-${getUserOS()}` : ""
      }`}
    >
      {isDesktopFramelessMode && <div className="settings-header-draggable" />}
      <div className="settings-index">
        <SettingsPrimarySidebar />
        <Col className="settings-content-wrapper">
          <Col className="settings-content">
            <Outlet />
            <br />
          </Col>
        </Col>
      </div>
    </div>
  );
};

export default SettingsIndex;
