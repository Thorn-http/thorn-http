import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getAppMode } from "store/selectors";
import APP_CONSTANTS from "../../../../config/constants";
import { CONSTANTS as GLOBAL_CONSTANTS } from "@thorn-http/core";
import { isFeatureCompatible } from "../../../../utils/CompatibilityUtils";
import { ImplicitRuleTesting } from "./components/ImplicitRuleTesting";
import "./index.scss";
import { BlockList } from "./components/BlockListSettings/BlockListSettings";
import { PopupConfig } from "./components/PopupConfig/PopupConfig";

export const GlobalSettings = () => {
  const appMode = useSelector(getAppMode);

  const isImplicitTestThisRuleCompatible = useMemo(
    () => isFeatureCompatible(APP_CONSTANTS.FEATURES.IMPLICIT_TEST_THIS_RULE),
    []
  );

  return (
    <div className="global-settings-container">
      <div className="global-settings-wrapper">
        <div className="settings-header header">⚙️ Global Settings</div>
        <p className="text-gray text-sm settings-caption">
          Please enable the following settings to get the best experience
        </p>
        {appMode === GLOBAL_CONSTANTS.APP_MODES.EXTENSION && isImplicitTestThisRuleCompatible ? (
          <ImplicitRuleTesting />
        ) : null}
        {isFeatureCompatible(APP_CONSTANTS.FEATURES.BLOCK_LIST) && <BlockList />}
        {isFeatureCompatible(APP_CONSTANTS.FEATURES.POPUP_CONFIG) && <PopupConfig />}
      </div>
    </div>
  );
};
