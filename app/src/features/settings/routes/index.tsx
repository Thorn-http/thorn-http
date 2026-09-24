import { Navigate, RouteObject } from "react-router-dom";
import PATHS from "config/constants/sub/paths";
import SettingsIndexPage from "../components/SettingsIndex";
import { GlobalSettings } from "../components/GlobalSettings";

export const settingRoutes: RouteObject[] = [
  {
    path: PATHS.SETTINGS.RELATIVE,
    element: <SettingsIndexPage />,
    children: [
      {
        index: true,
        element: <Navigate to={PATHS.SETTINGS.GLOBAL_SETTINGS.RELATIVE} replace />,
      },
      {
        path: PATHS.SETTINGS.GLOBAL_SETTINGS.RELATIVE,
        element: <GlobalSettings />,
      },
    ],
  },
  {
    path: PATHS.LEGACY.SETTINGS.ABSOLUTE,
    element: <Navigate to={PATHS.SETTINGS.RELATIVE} />,
  },
];
