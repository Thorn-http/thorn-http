/**
 * Answers "why didn't my rule apply to this request?": each thing that must hold for the rule to
 * run, with what went wrong and how to fix it. URL matching is done by the `matchUrl` passed in:
 * the rules' own matcher in the app (see ./index.ts).
 */

/** True when `component` (a URL, host or path) satisfies `operator` + `value`. */
export type UrlMatcher = (component: string, operator: string, value: string) => boolean;

export type CheckStatus = "pass" | "fail" | "info";

export interface MatchCheck {
  id: string;
  status: CheckStatus;
  title: string;
  detail?: string;
}

export interface ExplainInput {
  rule: { ruleType: string; status?: string; groupId?: string };
  source: {
    key: string;
    operator: string;
    value: string;
    filters?: Record<string, any>[];
  };
  request: {
    url: string;
    method?: string;
    /** A chrome.declarativeNetRequest resource type, e.g. "xmlhttprequest" or "main_frame". */
    resourceType?: string;
    pageUrl?: string;
  };
  context?: {
    isExtensionEnabled?: boolean;
    isGroupEnabled?: boolean;
    blockedDomains?: string[];
  };
}

export interface Explanation {
  applies: boolean;
  checks: MatchCheck[];
}

// Rule types applied by the fetch/XHR page script instead of the browser's network engine.
const FETCH_XHR_ONLY_RULE_TYPES = ["Response", "Request"];
const RESOURCE_TYPE_NAMES: Record<string, string> = {
  xmlhttprequest: "fetch / XHR",
  main_frame: "page load",
  sub_frame: "iframe load",
  script: "script",
  stylesheet: "stylesheet",
  image: "image",
  font: "font",
  media: "media",
  websocket: "WebSocket",
  other: "other",
};
const OPERATOR_NAMES: Record<string, string> = {
  Equals: "equals",
  Contains: "contains",
  Matches: "matches the regex",
  Wildcard_Matches: "matches the wildcard",
};

const NEGATED_OPERATOR_NAMES: Record<string, string> = {
  Equals: "doesn't equal",
  Contains: "doesn't contain",
  Matches: "doesn't match the regex",
  Wildcard_Matches: "doesn't match the wildcard",
};

const getUrlComponent = (url: URL, key: string) => {
  switch (key) {
    case "host":
      return { name: "host", value: url.host };
    case "path":
      return { name: "path", value: url.pathname };
    default:
      return { name: "URL", value: url.href };
  }
};

const isRegexValid = (value: string) => {
  const literal = value.match(/^\/([\s\S]+)\/([a-z]*)$/);
  try {
    new RegExp(literal ? literal[1] ?? "" : value, literal ? literal[2] : undefined);
    return true;
  } catch {
    return false;
  }
};

/** Why a URL part didn't satisfy the condition, when there's a likely, fixable cause. */
const getMismatchHint = (component: string, operator: string, value: string, componentName: string) => {
  if (!value) return "The condition is empty.";

  if (operator === "Matches" && !isRegexValid(value)) {
    return "The regex is invalid, so it never matches. Check brackets and escape special characters like . ? ( ).";
  }

  const caseOnlyDiffers =
    operator === "Contains"
      ? component.toLowerCase().includes(value.toLowerCase())
      : operator === "Equals" && component.toLowerCase() === value.toLowerCase();
  if (caseOnlyDiffers) {
    return "Only the letter case differs: matching is case-sensitive.";
  }

  if (value.trim() !== value) {
    return "The condition has spaces at the start or end.";
  }

  if (operator === "Equals") {
    const withoutQuery = component.split(/[?#]/)[0];
    if (withoutQuery === value) {
      return `The ${componentName} also has a query string or #fragment. Use "Contains", or include them.`;
    }
    if (component.replace(/\/$/, "") === value.replace(/\/$/, "")) {
      return `Only a trailing "/" differs. Browsers add "/" after a bare domain (https://example.com/).`;
    }
    if (component.replace(/^https?:/, "") === value.replace(/^https?:/, "")) {
      return "Only http/https differs.";
    }
    if (component.includes(value)) {
      return `The ${componentName} contains the value but isn't exactly equal to it. Use "Contains".`;
    }
  }

  if (/^https?:\/\//.test(value) && componentName !== "URL") {
    return `The condition checks the ${componentName}, but the value is a full URL. Switch the condition to "URL".`;
  }

  return undefined;
};

const hostMatchesDomain = (host: string, domain: string) => {
  const hostname = host.split(":")[0] ?? "";
  const blocked = domain.split(":")[0] ?? "";
  return hostname === blocked || hostname.endsWith(`.${blocked}`);
};

export const explainRuleMatch = (
  { rule, source, request, context = {} }: ExplainInput,
  matchUrl: UrlMatcher
): Explanation => {
  const matches: UrlMatcher = (component, operator, value) => {
    try {
      return matchUrl(component, operator, value);
    } catch {
      return false;
    }
  };

  const checks: MatchCheck[] = [];

  let url: URL;
  try {
    url = new URL(request.url.trim());
  } catch {
    return {
      applies: false,
      checks: [{ id: "url", status: "fail", title: "Enter a full URL, starting with http:// or https://" }],
    };
  }

  if (context.isExtensionEnabled === false) {
    checks.push({
      id: "extension",
      status: "fail",
      title: "Thorn HTTP is paused",
      detail: "Turn it back on in the toolbar popup.",
    });
  }

  if (rule.status && rule.status !== "Active") {
    checks.push({ id: "status", status: "fail", title: "This rule is switched off", detail: "Enable it at the top." });
  }

  if (context.isGroupEnabled === false) {
    checks.push({
      id: "group",
      status: "fail",
      title: "The rule's group is switched off",
      detail: "Enable the group.",
    });
  }

  let pageHost: string | null = null;
  try {
    pageHost = request.pageUrl ? new URL(request.pageUrl).host : null;
  } catch {
    // An invalid page URL is reported by the page filter check below.
  }
  const blockedDomain = context.blockedDomains?.find(
    (domain) => hostMatchesDomain(url.host, domain) || (pageHost && hostMatchesDomain(pageHost, domain))
  );
  if (blockedDomain) {
    checks.push({
      id: "blocked",
      status: "fail",
      title: `${blockedDomain} is in the blocked sites list`,
      detail: "Rules never run there. Remove it in Settings → Blocked sites.",
    });
  }

  // URL condition
  const component = getUrlComponent(url, source.key);
  const operatorName = OPERATOR_NAMES[source.operator] ?? source.operator;
  if (!source.value && ["Response", "Request", "Headers", "Script", "UserAgent", "Delay"].includes(rule.ruleType)) {
    checks.push({ id: "condition", status: "pass", title: "No URL condition: the rule applies to every URL" });
  } else if (matches(component.value, source.operator, source.value)) {
    checks.push({
      id: "condition",
      status: "pass",
      title: `The ${component.name} ${operatorName} "${source.value}"`,
    });
  } else {
    checks.push({
      id: "condition",
      status: "fail",
      title: `The ${component.name} ${NEGATED_OPERATOR_NAMES[source.operator] ?? "doesn't match"} "${source.value}"`,
      detail: [
        `The ${component.name} is ${component.value}.`,
        getMismatchHint(component.value, source.operator, source.value, component.name),
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  // Filters (a rule pair has at most one filter object in practice)
  const filters = source.filters?.[0] ?? {};

  const methods: string[] = filters.requestMethod ?? [];
  if (methods.length && request.method) {
    const ok = methods.includes(request.method);
    checks.push({
      id: "method",
      status: ok ? "pass" : "fail",
      title: ok
        ? `The method ${request.method} is allowed`
        : `The filter allows ${methods.join(", ")}, not ${request.method}`,
    });
  }

  const resourceTypes: string[] = filters.resourceType ?? [];
  if (resourceTypes.length && request.resourceType) {
    const ok = resourceTypes.includes(request.resourceType);
    const name = RESOURCE_TYPE_NAMES[request.resourceType] ?? request.resourceType;
    checks.push({
      id: "resourceType",
      status: ok ? "pass" : "fail",
      title: ok
        ? `The request type (${name}) is allowed`
        : `The filter allows ${resourceTypes.map((type) => RESOURCE_TYPE_NAMES[type] ?? type).join(", ")}, not ${name}`,
    });
  }

  const pageUrlFilter = Array.isArray(filters.pageUrl) ? filters.pageUrl[0] : filters.pageUrl;
  if (pageUrlFilter?.value) {
    if (!request.pageUrl) {
      checks.push({
        id: "pageUrl",
        status: "info",
        title: `The rule only runs on pages whose URL ${
          OPERATOR_NAMES[pageUrlFilter.operator] ?? pageUrlFilter.operator
        } "${pageUrlFilter.value}"`,
        detail: "Enter the page URL to check it.",
      });
    } else {
      const ok = matches(request.pageUrl, pageUrlFilter.operator, pageUrlFilter.value);
      checks.push({
        id: "pageUrl",
        status: ok ? "pass" : "fail",
        title: ok
          ? "The page URL matches the page filter"
          : `The page URL doesn't match the page filter ("${pageUrlFilter.value}")`,
      });
    }
  }

  // Limits of the rule type
  if (FETCH_XHR_ONLY_RULE_TYPES.includes(rule.ruleType)) {
    if (request.resourceType && request.resourceType !== "xmlhttprequest") {
      checks.push({
        id: "ruleType",
        status: "fail",
        title: "This rule type only changes fetch / XHR requests",
        detail: `It can't change a ${
          RESOURCE_TYPE_NAMES[request.resourceType] ?? request.resourceType
        }. Only requests made by the page's scripts with fetch() or XMLHttpRequest are changed.`,
      });
    } else if (rule.ruleType === "Response") {
      checks.push({
        id: "devtools",
        status: "info",
        title: "The DevTools Network tab still shows the original response",
        detail: "The page receives the modified one. Check it in the page, or in Thorn's DevTools panel.",
      });
    }
  }

  return { applies: checks.every((check) => check.status !== "fail"), checks };
};
