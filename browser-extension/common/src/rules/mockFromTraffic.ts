import { Rule, SourceKey, SourceOperator } from "../types";

/** A request seen in the network recording or the DevTools panel, with its real response. */
export interface RecordedTraffic {
  url: string;
  method: string;
  status: number;
  responseBody: string;
  requestBody?: string;
}

const prettyJson = (text: string) => {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

const getGraphQLOperationName = (requestBody?: string): string | undefined => {
  try {
    const operationName = JSON.parse(requestBody ?? "").operationName;
    return typeof operationName === "string" && operationName ? operationName : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Fills a blank Modify API Response rule from real traffic: same URL (without the query, which often
 * carries timestamps or tokens), same method and status, and the real response body to edit.
 */
export const fillMockFromTraffic = (rule: Rule, traffic: RecordedTraffic): void => {
  const url = new URL(traffic.url);
  const baseUrl = url.origin + url.pathname;
  const operationName = getGraphQLOperationName(traffic.requestBody);
  const method = traffic.method.toUpperCase();

  const filter: Record<string, unknown> = {};
  if (method !== "GET") filter.requestMethod = [method];
  if (operationName) filter.requestPayload = { key: "operationName", value: operationName };

  rule.pairs[0].source = ({
    key: SourceKey.URL,
    operator: SourceOperator.CONTAINS,
    value: baseUrl,
    ...(Object.keys(filter).length ? { filters: [filter] } : {}),
  } as unknown) as Rule["pairs"][0]["source"];
  rule.pairs[0].response = {
    type: "static" as const,
    value: prettyJson(traffic.responseBody) || "{}",
    resourceType: operationName ? "graphqlApi" : "restApi",
    // Empty keeps whatever status the server returns; otherwise the recorded one (e.g. an error).
    statusCode: traffic.status && traffic.status !== 200 ? String(traffic.status) : "",
  };

  rule.name = operationName ? `Mock ${operationName}` : `Mock ${method} ${url.pathname}`;
  rule.description = `Created from a recorded ${method} ${baseUrl} response.`;
};
