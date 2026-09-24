import { Header } from "antd/lib/layout/layout";
import { RQButton } from "lib/design-system-v2/components";
import Settings from "assets/icons/settings.svg?react";
import ThornLogo from "assets/img/brand/rq_logo.svg";
import { redirectToSettings } from "utils/RedirectionUtils";
import { useNavigate } from "react-router-dom";
import "./menuHeader.scss";

export const MenuHeader = () => {
  const navigate = useNavigate();

  return (
    <Header className="app-primary-header">
      <div className="app-primary-header-section app-primary-header__left">
        <img src={ThornLogo} alt="" className="app-primary-header-logo" />
        <span className="app-primary-header-title">Thorn HTTP</span>
      </div>
      <div className="app-primary-header-section app-primary-header__right no-drag">
        <div className="app-primary-header__right-section">
          <RQButton
            type="transparent"
            icon={<Settings />}
            onClick={() => redirectToSettings(navigate, window.location.pathname, "header")}
          />
        </div>
      </div>
    </Header>
  );
};
