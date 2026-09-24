import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAuthInitialization } from "store/selectors";
import { globalActions } from "store/slices/global/slice";

// Rules only live in the extension's local storage (no cloud sync), so the rules list is
// ready as soon as the app has initialized.
export const useLocalRulesReady = () => {
  const dispatch = useDispatch();
  const hasAuthInitialized = useSelector(getAuthInitialization);

  useEffect(() => {
    if (!hasAuthInitialized) return;
    window.isFirstSyncComplete = true;
    dispatch(globalActions.updateIsRulesListLoading(false));
  }, [hasAuthInitialized, dispatch]);
};
