import React, { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { isSettingsPage } from "utils/PathUtils.js";
import Footer from "../../components/sections/Footer";
import DashboardContent from "./DashboardContent";
import { Sidebar } from "./Sidebar";
import { removeElement } from "utils/domUtils";
import { isAppOpenedInIframe } from "utils/AppUtils";
import useRootPathRedirector from "hooks/useRootPathRedirector";
import { MenuHeader } from "./MenuHeader/MenuHeader";
import { useInitPopupConfig } from "hooks/useInitPopupConfig";
import "./DashboardLayout.scss";

const DashboardLayout = () => {
  const { pathname } = useLocation();

  useRootPathRedirector();
  useInitPopupConfig();

  const isSidebarVisible = useMemo(() => !isSettingsPage(pathname), [pathname]);
  const isAppHeaderVisible = useMemo(() => !isSettingsPage(pathname), [pathname]);

  useEffect(() => {
    if (!isAppOpenedInIframe()) return;

    removeElement(".app-sidebar");
    removeElement(".app-header");
    removeElement(".app-footer");
  }, []);

  return (
    <div className="app-layout app-dashboard-layout">
      {isAppHeaderVisible && (
        <div className="app-header">
          <MenuHeader />
        </div>
      )}
      <div className="app-sidebar">{isSidebarVisible && <Sidebar />}</div>
      <div className="app-main-content">
        <DashboardContent />
      </div>
      <div className="app-footer">
        <Footer />
      </div>
    </div>
  );
};

export default DashboardLayout;
