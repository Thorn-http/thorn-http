import { Navigate, RouteObject } from "react-router-dom";
import PATHS from "config/constants/sub/paths";
import Page403 from "views/misc/ServerResponses/403";
import Page404 from "views/misc/ServerResponses/404";
import { ImportFromCharlesWrapperView } from "features/rules/screens/rulesList/components/RulesList/components";
import { ImportFromModheaderWrapperView } from "features/rules/screens/rulesList/components/RulesList/components/ImporterComponents/ModheaderImporter/ImportFromModheaderScreen";
import { ImportFromResourceOverrideWrapperView } from "features/rules/screens/rulesList/components/RulesList/components/ImporterComponents/ResourceOverrideImporter";
import { HeaderEditorImportScreen } from "features/rules/screens/rulesList/components/RulesList/components/ImporterComponents/HeaderEditorImporter/HeaderEditorImporterScreen";

const toRules = <Navigate to={PATHS.RULES.MY_RULES.ABSOLUTE} replace />;

export const miscRoutes: RouteObject[] = [
  { path: PATHS.EXTENSION_INSTALLED.RELATIVE, element: toRules },
  { path: PATHS.EXTENSION_UPDATED.RELATIVE, element: toRules },
  { path: PATHS.HOME.RELATIVE, element: toRules },
  { path: PATHS.PAGE403.RELATIVE, element: <Page403 /> },
  { path: PATHS.PAGE404.RELATIVE, element: <Page404 /> },
  { path: PATHS.IMPORT_FROM_CHARLES.RELATIVE, element: <ImportFromCharlesWrapperView /> },
  { path: PATHS.IMPORT_FROM_MODHEADER.RELATIVE, element: <ImportFromModheaderWrapperView /> },
  { path: PATHS.IMPORT_FROM_HEADER_EDITOR.RELATIVE, element: <HeaderEditorImportScreen /> },
  { path: PATHS.IMPORT_FROM_RESOURCE_OVERRIDE.RELATIVE, element: <ImportFromResourceOverrideWrapperView /> },
  { path: PATHS.ANY, element: <Navigate to={PATHS.PAGE404.RELATIVE} /> },
];
