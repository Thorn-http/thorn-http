import { RouterProvider, createBrowserRouter, createHashRouter } from "react-router-dom";
import { routesV2 } from "routes";
import * as Sentry from "@sentry/react";

declare global {
  namespace globalThis {
    var globalUnhandledRejectionHandlers: Set<(event: PromiseRejectionEvent) => void>;
  }
}

/** Common things which do not depend on routes for App **/
const App = () => {
  // Inside the extension the app is served from app.html, so routes live in the URL hash.
  const createRouter = process.env.VITE_THORN_EXTENSION === "true" ? createHashRouter : createBrowserRouter;
  const router = Sentry.wrapCreateBrowserRouterV6(createRouter)(routesV2);

  return <RouterProvider router={router} />;
};

export default App;
