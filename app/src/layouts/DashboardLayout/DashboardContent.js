import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, Outlet } from "react-router-dom";
import SpinnerModal from "components/misc/SpinnerModal";
import { globalActions } from "store/slices/global/slice";
import { getActiveModals } from "store/slices/global/modals/selectors";
import ImportRulesModal from "components/features/rules/ImportRulesModal";
import { usePrevious } from "hooks";
import { isAppOpenedInIframe } from "utils/AppUtils";
import { SharingModal } from "components/common/SharingModal";

const DashboardContent = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const activeModals = useSelector(getActiveModals);
  const [isImportRulesModalActive, setIsImportRulesModalActive] = useState(false);
  const isInsideIframe = isAppOpenedInIframe();
  const previousLocation = usePrevious(location);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (previousLocation && previousLocation !== location) {
      document.documentElement.scrollTop = 0;
      document.scrollingElement.scrollTop = 0;
      document.getElementById("dashboardMainContent").scrollTop = 0;
    }
    isFirstRenderRef.current = false;
  }, [location, previousLocation]);

  return (
    <>
      <div id="dashboardMainContent">
        {/* Outlet renders all the children of the root route */}
        <Outlet />
      </div>

      {isInsideIframe ? null : (
        <>
          {activeModals.loadingModal.isActive ? (
            <SpinnerModal
              isOpen={activeModals.loadingModal.isActive}
              toggle={() => dispatch(globalActions.toggleActiveModal({ modalName: "loadingModal" }))}
            />
          ) : null}
          {activeModals.sharingModal.isActive ? (
            <SharingModal
              isOpen={activeModals.sharingModal.isActive}
              toggleModal={() => dispatch(globalActions.toggleActiveModal({ modalName: "sharingModal" }))}
              {...activeModals.sharingModal.props}
            />
          ) : null}
          {isImportRulesModalActive ? (
            <ImportRulesModal isOpen={isImportRulesModalActive} toggle={() => setIsImportRulesModalActive(false)} />
          ) : null}
        </>
      )}
    </>
  );
};

export default DashboardContent;
