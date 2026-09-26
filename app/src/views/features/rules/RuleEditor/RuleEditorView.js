import { BottomSheetProvider } from "componentsV2/BottomSheet";
import { BottomSheetFeatureContext } from "componentsV2/BottomSheet/types";
import RuleEditor from "./RuleEditor";
import { useSelector } from "react-redux";
import { getAppMode } from "store/selectors";
import { CONSTANTS as GLOBAL_CONSTANTS } from "@thorn-http/core";
import { isExtensionInstalled } from "actions/ExtensionActions";
import InstallExtensionCTA from "components/misc/InstallExtensionCTA";

const RuleEditorView = () => {
  const appMode = useSelector(getAppMode);

  if (appMode !== GLOBAL_CONSTANTS.APP_MODES.DESKTOP) {
    if (!isExtensionInstalled()) {
      return <InstallExtensionCTA />;
    }
  }

  return (
    <BottomSheetProvider context={BottomSheetFeatureContext.RULES}>
      <RuleEditor />
    </BottomSheetProvider>
  );
};

export default RuleEditorView;
