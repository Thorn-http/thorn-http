import React from "react";
import { Outlet } from "react-router-dom";
import { ConfigProvider } from "antd";
import enUS from "antd/lib/locale/en_US";
import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { growthbook } from "utils/feature-flag/growthbook";
import usePreLoadRemover from "hooks/usePreLoadRemover";
import AppModeInitializer from "hooks/AppModeInitializer";
import ActiveWorkspace from "hooks/ActiveWorkspace";
import AuthHandler from "hooks/AuthHandler";
import ExtensionContextInvalidationNotice from "components/misc/notices/ExtensionContextInvalidationNotice";
import { useIsExtensionEnabled } from "hooks";
import { LazyMotion, domMax } from "framer-motion";
import ThemeProvider from "lib/design-system-v2/helpers/ThemeProvider";
import { InitImplicitWidgetConfigHandler } from "components/features/rules/TestThisRule";
import { useAppLanguageObserver } from "hooks/useAppLanguageObserver";
import useClientStorageService from "services/clientStorageService/hooks/useClientStorageService";
import { useLocalRulesReady } from "hooks/useLocalRulesReady";

const App: React.FC = () => {
  usePreLoadRemover();
  useClientStorageService();
  useIsExtensionEnabled();
  useAppLanguageObserver();
  useLocalRulesReady();

  return (
    <>
      <ExtensionContextInvalidationNotice />
      <AppModeInitializer />
      <AuthHandler />
      {/* Remote flags are off; GrowthBook only serves the local defaults (see utils/feature-flag/growthbook) */}
      <GrowthBookProvider growthbook={growthbook}>
        {/* @ts-ignore */}
        <ActiveWorkspace />
        <ThemeProvider>
          <ConfigProvider locale={enUS}>
            {/* @ts-ignore */}
            <InitImplicitWidgetConfigHandler />
            <LazyMotion features={domMax} strict>
              <div id="requestly-dashboard-layout">
                <Outlet />
              </div>
            </LazyMotion>
          </ConfigProvider>
        </ThemeProvider>
      </GrowthBookProvider>
    </>
  );
};

export default App;
