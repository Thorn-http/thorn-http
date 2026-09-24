import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PATHS from "config/constants/sub/paths";

// Thorn HTTP only has the rules feature, so the root path always opens the rules list.
const useRootPathRedirector = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === PATHS.ROOT) {
      navigate(PATHS.RULES.MY_RULES.ABSOLUTE, { replace: true });
    }
  }, [location.pathname, navigate]);
};

export default useRootPathRedirector;
