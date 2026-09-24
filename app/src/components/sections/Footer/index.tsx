import React from "react";
import { useLocation } from "react-router-dom";
import { Typography, Row, Col } from "antd";
import { Footer } from "antd/lib/layout/layout";
import APP_CONSTANTS from "config/constants";
import { getExtensionVersion } from "actions/ExtensionActions";
import "./Footer.css";

const { Text } = Typography;
const { PATHS } = APP_CONSTANTS;
const PAGES_WITHOUT_FOOTER = [PATHS.SETTINGS.RELATIVE];

export const THORN_LINKS = {
  WEBSITE: "https://thorn-http.dev",
  SOURCE_CODE: "https://thorn-http.dev/source",
};

const AppFooter: React.FC = () => {
  const { pathname } = useLocation();

  if (PAGES_WITHOUT_FOOTER.some((path) => pathname.includes(path))) {
    return null;
  }

  return (
    <Footer className="app-layout-footer">
      <Row align="middle" justify="space-between" wrap={false}>
        <Col>
          <Text className="text-gray">v{getExtensionVersion()}</Text>
        </Col>
        <Col>
          <Row align="middle" gutter={16} wrap={false}>
            <Col>
              <a className="footer-link" href={THORN_LINKS.WEBSITE} target="_blank" rel="noreferrer">
                thorn-http.dev
              </a>
            </Col>
            <Col>
              {/* AGPLv3: keep the corresponding source one click away */}
              <a className="footer-link" href={THORN_LINKS.SOURCE_CODE} target="_blank" rel="noreferrer">
                Source code (AGPLv3)
              </a>
            </Col>
          </Row>
        </Col>
      </Row>
    </Footer>
  );
};

export default AppFooter;
