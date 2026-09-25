import { initFetchInterceptor } from "./fetch";
import { initXhrInterceptor } from "./xhr";
import { sendCacheSharedStateMessage } from "./utils";

const initAjaxRequestInterceptor = () => {
  let isDebugMode;
  try {
    isDebugMode = window && window.localStorage && localStorage.isDebugMode;
  } catch (e) {}

  initXhrInterceptor(isDebugMode);
  initFetchInterceptor(isDebugMode);

  if (window.top === window.self) {
    window.addEventListener("beforeunload", () => {
      sendCacheSharedStateMessage();
    });
  }
};

// Patch fetch/XHR once per window, even if the script is injected again (wrapping our own wrappers
// breaks XHR). A global symbol, so separate copies of the script see the same flag.
const PATCHED = Symbol.for("thorn-http.ajaxRequestInterceptor");
if (!window[PATCHED]) {
  Object.defineProperty(window, PATCHED, { value: true });
  initAjaxRequestInterceptor();
}
