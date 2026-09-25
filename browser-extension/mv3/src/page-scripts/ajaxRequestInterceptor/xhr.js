import {
  applyDelay,
  getAbsoluteUrl,
  getCustomRequestBody,
  getFunctionFromCode,
  getMatchedDelayRule,
  getMatchedRequestRule,
  getMatchedResponseRule,
  isContentTypeJSON,
  isJSON,
  isPromise,
  jsonifyValidJSONString,
  notifyOnBeforeRequest,
  notifyRequestRuleApplied,
  notifyResponseRuleApplied,
  shouldServeResponseWithoutRequest,
  waitForRulesCache,
} from "./utils";

// Our proxy of each page XHR, under a key no other interceptor uses.
const PROXY_XHR = Symbol("thornProxyXhr");

export const initXhrInterceptor = (debug) => {
  // XHR Implementation
  const updateXhrReadyState = (xhr, readyState) => {
    Object.defineProperty(xhr, "readyState", { writable: true, configurable: true });
    // @ts-ignore
    xhr.readyState = readyState;
    xhr.dispatchEvent(new CustomEvent("readystatechange"));
  };

  const resolveXHR = (xhr, responseData) => {
    xhr.dispatchEvent(new ProgressEvent("loadstart"));

    // update response headers
    const contentType = isJSON(responseData) ? "application/json" : "text/plain";
    xhr.getResponseHeader = (key) => {
      if (key.toLowerCase() === "content-type") {
        return contentType;
      }
      return null;
    };
    updateXhrReadyState(xhr, xhr.HEADERS_RECEIVED);
    updateXhrReadyState(xhr, xhr.LOADING);

    // mark resolved
    updateXhrReadyState(xhr, xhr.DONE);
  };

  const OriginalXMLHttpRequest = XMLHttpRequest;

  const createProxyXHRObject = function () {
    const actualXhr = this;

    const dispatchEventToActualXHR = (type, e) => {
      debug && console.log("[RQ]", `on${type}`, e);
      actualXhr.dispatchEvent(
        new ProgressEvent(type, {
          lengthComputable: e?.lengthComputable,
          loaded: e?.loaded,
          total: e?.total,
        })
      );
    };

    const updateActualXHRReadyState = (readyState) => {
      updateXhrReadyState(actualXhr, readyState);
    };

    const onReadyStateChange = async function () {
      debug &&
        console.log("[RQ]", "onReadyStateChange", {
          state: this.readyState,
          status: this.status,
          response: this.response,
          xhr: this,
          url: this._requestURL,
        });
      if (!this.responseRule) {
        return;
      }
      const responseModification = this.responseRule.pairs[0].response;

      if (this.readyState === this.HEADERS_RECEIVED) {
        // For network failures, responseStatus=0 but we still return customResponse with status=200
        const responseStatus = parseInt(responseModification.statusCode || this.status) || 200;
        const responseStatusText = responseModification.statusText || this.statusText;

        Object.defineProperties(actualXhr, {
          status: {
            configurable: true,
            get: () => responseStatus,
          },
          statusText: {
            configurable: true,
            get: () => responseStatusText,
          },
          getResponseHeader: {
            configurable: true,
            value: this.getResponseHeader.bind(this),
          },
          getAllResponseHeaders: {
            configurable: true,
            value: this.getAllResponseHeaders.bind(this),
          },
        });

        updateActualXHRReadyState(this.HEADERS_RECEIVED);
      } else if (this.readyState === this.DONE) {
        const responseType = this.responseType;
        const contentType = this.getResponseHeader("content-type");

        let customResponse;

        if (responseModification.type === "code") {
          const evaluatorArgs = {
            method: this._method,
            url: this._requestURL,
            requestHeaders: this._requestHeaders,
            requestData: jsonifyValidJSONString(this._requestData),
            responseType: contentType,
            response: this.response,
            responseJSON: jsonifyValidJSONString(this.response, true),
          };

          customResponse = getFunctionFromCode(responseModification.value, "response")(evaluatorArgs);
        } else {
          customResponse = responseModification.value;
        }

        if (typeof customResponse === "undefined") {
          return;
        }

        // Convert customResponse back to rawText
        // response.value is String and evaluator method might return string/object
        if (isPromise(customResponse)) {
          customResponse = await customResponse;
        }

        debug && console.log("[RQ]", "Rule Applied - customResponse", { customResponse, responseType, contentType });

        const isUnsupportedResponseType = responseType && !["json", "text"].includes(responseType);

        // We do not support statically modifying responses of type - blob, arraybuffer, document etc.
        if (responseModification.type === "static" && isUnsupportedResponseType) {
          customResponse = this.response;
        }

        if (
          !isUnsupportedResponseType &&
          typeof customResponse === "object" &&
          !(customResponse instanceof Blob) &&
          (responseType === "json" || isContentTypeJSON(contentType))
        ) {
          customResponse = JSON.stringify(customResponse);
        }
        Object.defineProperty(actualXhr, "response", {
          configurable: true,
          get: function () {
            if (responseModification.type === "static" && responseType === "json") {
              if (typeof customResponse === "object") {
                return customResponse;
              }

              return jsonifyValidJSONString(customResponse);
            }

            return customResponse;
          },
        });

        if (responseType === "" || responseType === "text") {
          Object.defineProperty(actualXhr, "responseText", {
            configurable: true,
            get: function () {
              return customResponse;
            },
          });
        }

        const responseURL = this.responseURL;
        const responseXML = this.responseXML;

        Object.defineProperties(actualXhr, {
          responseType: {
            configurable: true,
            get: function () {
              return responseType;
            },
          },
          responseURL: {
            configurable: true,
            get: function () {
              return responseURL;
            },
          },
          responseXML: {
            configurable: true,
            get: function () {
              return responseXML;
            },
          },
        });

        const requestDetails = {
          url: this._requestURL,
          method: this._method,
          type: "xmlhttprequest",
          timeStamp: Date.now(),
        };

        // mark resolved)
        if (this._abort) {
          // Note: This might get delayed due to async in code block
          dispatchEventToActualXHR("abort");
          dispatchEventToActualXHR("loadend");
        } else {
          updateActualXHRReadyState(this.DONE);
          dispatchEventToActualXHR("load");
          dispatchEventToActualXHR("loadend");
        }

        notifyResponseRuleApplied({
          ruleDetails: this.responseRule,
          requestDetails,
        });
      } else {
        updateActualXHRReadyState(this.readyState);
      }
    };

    const xhr = new OriginalXMLHttpRequest();
    xhr.addEventListener("readystatechange", onReadyStateChange.bind(xhr), false);
    xhr.addEventListener("abort", dispatchEventToActualXHR.bind(xhr, "abort"), false);
    xhr.addEventListener("error", dispatchEventToActualXHR.bind(xhr, "error"), false);
    xhr.addEventListener("timeout", dispatchEventToActualXHR.bind(xhr, "timeout"), false);
    xhr.addEventListener("loadstart", dispatchEventToActualXHR.bind(xhr, "loadstart"), false);
    xhr.addEventListener("progress", dispatchEventToActualXHR.bind(xhr, "progress"), false);

    // Keep timeout and withCredentials in sync with the proxy XHR. Other interceptors patching XHR
    // the same way (e.g. Requestly, which this code comes from) may already have wrapped them: chain
    // onto their accessors, and never redefine a property that can't be (that threw "Cannot
    // redefine property: timeout" and broke the page's XHR).
    const forwardToProxyXhr = (name) => {
      const own = Object.getOwnPropertyDescriptor(actualXhr, name);
      const accessor = own ?? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(actualXhr), name);
      if (!accessor?.get || !accessor?.set || (own && !own.configurable)) {
        return;
      }
      Object.defineProperty(actualXhr, name, {
        configurable: true,
        get: function () {
          return accessor.get.call(this);
        },
        set: function (value) {
          xhr[name] = value;
          accessor.set.call(this, value);
        },
      });
    };
    forwardToProxyXhr("timeout");
    forwardToProxyXhr("withCredentials"); // https://github.com/requestly/requestly/issues/2936

    this[PROXY_XHR] = xhr;
  };

  XMLHttpRequest = function () {
    const xhr = new OriginalXMLHttpRequest();
    createProxyXHRObject.call(xhr);
    return xhr;
  };

  XMLHttpRequest.prototype = OriginalXMLHttpRequest.prototype;
  Object.entries(OriginalXMLHttpRequest).map(([key, val]) => {
    XMLHttpRequest[key] = val;
  });

  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, async = true) {
    open.apply(this, arguments);
    try {
      this[PROXY_XHR]._method = method;
      this[PROXY_XHR]._requestURL = getAbsoluteUrl(url);
      this[PROXY_XHR]._async = async;
      open.apply(this[PROXY_XHR], arguments);
    } catch (err) {
      debug && console.log("[proxyXhr.open] error", err);
    }
  };

  const abort = XMLHttpRequest.prototype.abort;
  XMLHttpRequest.prototype.abort = function () {
    debug && console.log("abort called");
    abort.apply(this, arguments);
    try {
      this[PROXY_XHR]._abort = true;
      abort.apply(this[PROXY_XHR], arguments);
    } catch (err) {
      debug && console.log("[proxyXhr.abort] error", err);
    }
  };

  let setRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
    setRequestHeader.apply(this, arguments);
    try {
      this[PROXY_XHR]._requestHeaders = this[PROXY_XHR]._requestHeaders || {};
      this[PROXY_XHR]._requestHeaders[header] = value;
      setRequestHeader.apply(this[PROXY_XHR], arguments);
    } catch (err) {
      debug && console.log("[proxyXhr.setRequestHeader] error", err);
    }
  };

  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = async function (data) {
    try {
      if (!this[PROXY_XHR]._async) {
        debug && console.log("Async disabled");
        return send.call(this, data);
      }

      this[PROXY_XHR]._requestData = data;

      await waitForRulesCache();

      const matchedDelayRulePair = getMatchedDelayRule({
        url: this[PROXY_XHR]._requestURL,
        method: this[PROXY_XHR]._method,
        type: "xmlhttprequest",
        initiator: location.origin, // initiator=origin. Should now contain port and protocol
      });
      if (matchedDelayRulePair) {
        debug && console.log("[xhrInterceptor] matchedDelayRulePair", { matchedDelayRulePair });
        await applyDelay(matchedDelayRulePair.delay);
      }

      const requestRule = getMatchedRequestRule({
        url: this[PROXY_XHR]._requestURL,
        method: this[PROXY_XHR]._method,
        type: "xmlhttprequest",
        initiator: location.origin, // initiator=origin. Should now contain port and protocol
        requestData: jsonifyValidJSONString(data),
      });

      if (requestRule) {
        debug && console.log("[xhrInterceptor] matchedRequestRule", { requestRule });
        this[PROXY_XHR]._requestData = getCustomRequestBody(requestRule, {
          method: this[PROXY_XHR]._method,
          url: this[PROXY_XHR]._requestURL,
          body: data,
          bodyAsJson: jsonifyValidJSONString(data, true),
        });

        notifyRequestRuleApplied({
          ruleDetails: requestRule,
          requestDetails: {
            url: this[PROXY_XHR]._requestURL,
            method: this[PROXY_XHR]._method,
            type: "xmlhttprequest",
            timeStamp: Date.now(),
          },
        });
      }

      await notifyOnBeforeRequest({
        url: this[PROXY_XHR]._requestURL,
        method: this[PROXY_XHR]._method,
        type: "xmlhttprequest",
        initiator: location.origin,
        requestHeaders: this[PROXY_XHR]._requestHeaders ?? {},
      });

      this.responseRule = getMatchedResponseRule({
        url: this[PROXY_XHR]._requestURL,
        requestData: jsonifyValidJSONString(this[PROXY_XHR]._requestData),
        method: this[PROXY_XHR]._method,
      });
      this[PROXY_XHR].responseRule = this.responseRule;

      if (this.responseRule) {
        debug && console.log("[xhrInterceptor]", "send and response rule matched", this.responseRule);
        if (shouldServeResponseWithoutRequest(this.responseRule)) {
          debug && console.log("[xhrInterceptor]", "send and response rule matched and serveWithoutRequest is true");
          resolveXHR(this[PROXY_XHR], this.responseRule.pairs[0].response.value);
        } else {
          send.call(this[PROXY_XHR], this[PROXY_XHR]._requestData);
        }
        return;
      }

      send.call(this, this[PROXY_XHR]._requestData);
    } catch (err) {
      debug && console.log("[proxyXhr.send] error", err);
      send.call(this, data);
    }
  };
};
