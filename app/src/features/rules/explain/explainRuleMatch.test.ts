import { describe, expect, it } from "vitest";

import { explainRuleMatch as explainWith, ExplainInput } from "./explainRuleMatch";

// Same semantics as RuleMatcher.matchUrlCriteria in common/rule-processor (which needs a browser to
// load); the e2e tests cover the app with the real matcher.
const toRegex = (value: string) => {
  const literal = value.match(/^\/([\s\S]+)\/([a-z]*)$/);
  return literal ? new RegExp(literal[1] ?? "", literal[2]) : null;
};
const wildcardToRegex = (value: string) =>
  new RegExp(
    `^${value
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("(.*)")}$`
  );
const matchUrl = (component: string, operator: string, value: string) => {
  if (operator === "Equals") return component === value;
  if (operator === "Contains") return component.includes(value);
  if (operator === "Matches") return !!toRegex(value)?.test(component);
  if (operator === "Wildcard_Matches") return wildcardToRegex(value).test(component);
  return false;
};
const explainRuleMatch = (input: ExplainInput) => explainWith(input, matchUrl);

const rule = { ruleType: "Redirect", status: "Active" };
const source = (key: string, operator: string, value: string, filters?: Record<string, any>[]) => ({
  key,
  operator,
  value,
  filters,
});
const failed = (explanation: ReturnType<typeof explainRuleMatch>) =>
  explanation.checks.filter((check) => check.status === "fail");

describe("explainRuleMatch", () => {
  it("passes when the URL matches and nothing blocks the rule", () => {
    const result = explainRuleMatch({
      rule,
      source: source("Url", "Contains", "/api/"),
      request: { url: "https://example.com/api/posts" },
      context: { isExtensionEnabled: true, isGroupEnabled: true, blockedDomains: [] },
    });
    expect(result.applies).toBe(true);
    expect(result.checks[0]).toMatchObject({ id: "condition", status: "pass" });
  });

  it("explains a URL that doesn't match, with the part that was checked", () => {
    const result = explainRuleMatch({
      rule,
      source: source("path", "Contains", "/v2/"),
      request: { url: "https://example.com/api/v1/posts" },
    });
    expect(result.applies).toBe(false);
    expect(failed(result)[0]).toMatchObject({
      title: `The path doesn't contain "/v2/"`,
      detail: "The path is /api/v1/posts.",
    });
  });

  it.each([
    ["Equals", "https://example.com", "https://example.com", 'trailing "/"'],
    ["Equals", "https://example.com/api", "https://example.com/api?page=2", "query string"],
    ["Equals", "http://example.com/api", "https://example.com/api", "http/https"],
    ["Equals", "https://example.com/api", "https://example.com/api/posts", 'Use "Contains"'],
    ["Contains", "/API/", "https://example.com/api/posts", "case-sensitive"],
    ["Contains", " /api/", "https://example.com/api/posts", "spaces"],
    ["Matches", "/api/(v1/", "https://example.com/api/v1/", "regex is invalid"],
  ])("hints why %s %s fails for %s", (operator, value, url, hint) => {
    const [check] = failed(explainRuleMatch({ rule, source: source("Url", operator, value), request: { url } }));
    expect(check!.detail).toContain(hint);
    expect(check!.detail).not.toContain("..");
  });

  it("points out a full URL used in a host condition", () => {
    const [check] = failed(
      explainRuleMatch({
        rule,
        source: source("host", "Equals", "https://example.com"),
        request: { url: "https://example.com/" },
      })
    );
    expect(check!.detail).toContain('Switch the condition to "URL"');
  });

  it("matches regex and wildcard conditions like the rules do", () => {
    const check = (operator: string, value: string) =>
      explainRuleMatch({
        rule,
        source: source("Url", operator, value),
        request: { url: "https://example.com/api/v1/posts" },
      }).applies;
    expect(check("Matches", "/api\\/v\\d+/")).toBe(true);
    expect(check("Matches", "/api\\/v9/")).toBe(false);
    expect(check("Wildcard_Matches", "*://example.com/api/*")).toBe(true);
    expect(check("Wildcard_Matches", "*://other.com/*")).toBe(false);
  });

  it("reports a paused extension, a disabled rule or group, and blocked sites", () => {
    const result = explainRuleMatch({
      rule: { ruleType: "Redirect", status: "Inactive" },
      source: source("Url", "Contains", "api"),
      request: { url: "https://shop.example.com/api", pageUrl: "https://shop.example.com/" },
      context: { isExtensionEnabled: false, isGroupEnabled: false, blockedDomains: ["example.com"] },
    });
    expect(failed(result).map((check) => check.id)).toEqual(["extension", "status", "group", "blocked"]);
  });

  it("checks method, request type and page filters", () => {
    const filters = [
      { requestMethod: ["POST"], resourceType: ["xmlhttprequest"], pageUrl: { operator: "Contains", value: "/admin" } },
    ];
    const result = explainRuleMatch({
      rule,
      source: source("Url", "Contains", "api", filters),
      request: {
        url: "https://example.com/api",
        method: "GET",
        resourceType: "script",
        pageUrl: "https://example.com/home",
      },
    });
    expect(failed(result).map((check) => check.id)).toEqual(["method", "resourceType", "pageUrl"]);
    expect(failed(result)[0]!.title).toBe("The filter allows POST, not GET");

    const withoutPage = explainRuleMatch({
      rule,
      source: source("Url", "Contains", "api", filters),
      request: { url: "https://example.com/api" },
    });
    expect(withoutPage.checks.find((check) => check.id === "pageUrl")?.status).toBe("info");
  });

  it("explains that API response and body rules only change fetch/XHR requests", () => {
    const page = explainRuleMatch({
      rule: { ruleType: "Response", status: "Active" },
      source: source("Url", "Contains", "posts"),
      request: { url: "https://example.com/posts", resourceType: "main_frame" },
    });
    expect(failed(page)[0]!.title).toBe("This rule type only changes fetch / XHR requests");

    const xhr = explainRuleMatch({
      rule: { ruleType: "Response", status: "Active" },
      source: source("Url", "Contains", "posts"),
      request: { url: "https://example.com/posts", resourceType: "xmlhttprequest" },
    });
    expect(xhr.applies).toBe(true);
    expect(xhr.checks.find((check) => check.id === "devtools")?.status).toBe("info");
  });

  it("asks for a full URL", () => {
    const result = explainRuleMatch({
      rule,
      source: source("Url", "Contains", "api"),
      request: { url: "example.com/api" },
    });
    expect(result).toMatchObject({ applies: false, checks: [{ id: "url" }] });
  });
});
