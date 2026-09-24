import { RouteObject } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import AppLayout from "layouts/AppLayout";
import { ruleRoutes } from "features/rules/routes";
import { settingRoutes } from "features/settings/routes";
import { miscRoutes } from "./miscRoutes";
import RouterError from "components/misc/PageError/RouterError";

export const routesV2: RouteObject[] = [
  {
    path: "",
    element: <AppLayout />,
    errorElement: <RouterError />,
    children: [
      {
        path: "",
        element: <DashboardLayout />,
        children: [...ruleRoutes, ...settingRoutes, ...miscRoutes],
      },
    ],
  },
];
