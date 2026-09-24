import { Navigate, RouteObject } from "react-router-dom";
import PATHS from "config/constants/sub/paths";
import { RulesContainer } from "views/containers/RulesContainer";
import RuleEditor from "views/features/rules/RuleEditor";
import { joinPaths } from "utils/PathUtils";

// V2 Imports
import RulesContainerV2 from "./container";
import { RulesListScreen } from "./screens/rulesList";
import { TemplatesList } from "./screens/templatesList";

export const ruleRoutes: RouteObject[] = [
  {
    path: PATHS.RULES.INDEX,
    element: <RulesContainer />,
  },
  {
    path: PATHS.MARKETPLACE.RELATIVE,
    element: <Navigate to={PATHS.RULES.MY_RULES.ABSOLUTE} />,
  },
  // New V2 Routes
  {
    path: `${PATHS.RULES.INDEX}`,
    element: <RulesContainerV2 />,
    handle: {
      breadcrumb: {
        label: "Rules",
        navigateTo: PATHS.RULES.INDEX,
      },
    },
    children: [
      {
        index: true,
        element: <Navigate to={PATHS.RULES.MY_RULES.RELATIVE} />,
        handle: {
          breadcrumb: {
            label: "All",
            disabled: true, // Will not navigate
          },
        },
      },
      {
        path: `${PATHS.RULES.MY_RULES.RELATIVE}`,
        element: <RulesListScreen />,
        handle: {
          breadcrumb: {
            label: "All",
            disabled: true,
          },
        },
      },
      // TODO:  VV Needs Refractoring below this VV
      {
        path: joinPaths(PATHS.RULE_EDITOR.RELATIVE, PATHS.ANY),
        element: <RuleEditor />,
        handle: {
          breadcrumb: {
            label: "Editor",
            isEditable: true,
            disabled: false,
          },
        },
      },
      {
        path: joinPaths(PATHS.RULE_EDITOR.CREATE_RULE.RELATIVE, "/:ruleType"),
        element: <RuleEditor />,
        handle: {
          breadcrumb: {
            label: "Create rule",
            disabled: true,
          },
        },
      },
      {
        path: PATHS.RULES.TEMPLATES.RELATIVE,
        element: <TemplatesList />,
        handle: {
          breadcrumb: {
            label: "Templates",
          },
        },
      },
    ],
  },
];
