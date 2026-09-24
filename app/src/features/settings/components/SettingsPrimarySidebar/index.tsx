import React, { useRef } from "react";
import { Col, Row } from "antd";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineDisplaySettings } from "@react-icons/all-files/md/MdOutlineDisplaySettings";
import { IoMdArrowBack } from "@react-icons/all-files/io/IoMdArrowBack";
import APP_CONSTANTS from "config/constants";
import { trackAppSettingsSidebarClicked } from "features/settings/analytics";
import "./index.scss";

const { PATHS } = APP_CONSTANTS;

const sidebarItems = [
  {
    id: "app_settings",
    name: "App",
    icon: <MdOutlineDisplaySettings />,
    children: [
      {
        id: "global",
        name: "Global settings",
        path: PATHS.SETTINGS.GLOBAL_SETTINGS.RELATIVE,
      },
    ],
  },
];

export const SettingsPrimarySidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;

  const redirectUrl = useRef(state?.redirectUrl ?? null);

  return (
    <Col className="settings-primary-sidebar">
      <Row
        align="middle"
        gutter={6}
        className="settings-primary-sidebar-back-btn"
        onClick={() => {
          if (redirectUrl.current && !redirectUrl.current.includes("/settings")) {
            navigate(redirectUrl.current);
            return;
          }
          navigate(PATHS.RULES.MY_RULES.ABSOLUTE);
        }}
      >
        <Col>
          <IoMdArrowBack className="settings-primary-sidebar-title-icon" />
        </Col>
        <Col className="settings-primary-sidebar-back-label">Back</Col>
      </Row>
      <Row className="settings-primary-sidebar-title">Settings</Row>

      <Col className="mt-16">
        {sidebarItems.map((item) => {
          return (
            <Col key={item.id} className="settings-primary-sidebar-section">
              <Row className="settings-primary-sidebar-section-header" gutter={8} align="middle">
                <Col className="settings-primary-sidebar-section-header-icon">{item.icon}</Col>
                <Col className="settings-primary-sidebar-section-header-title">{item.name}</Col>
              </Row>
              <Col style={{ padding: "0 1rem" }}>
                {item.children.map((child) => {
                  return (
                    <NavLink
                      key={child.id}
                      to={child.path}
                      onClick={() => trackAppSettingsSidebarClicked(child.id)}
                      className={({ isActive }) =>
                        `settings-primary-sidebar-section-link ${
                          isActive ? "settings-primary-sidebar-section-active-link" : ""
                        }`
                      }
                    >
                      {child.name}
                    </NavLink>
                  );
                })}
              </Col>
            </Col>
          );
        })}
      </Col>
    </Col>
  );
};
