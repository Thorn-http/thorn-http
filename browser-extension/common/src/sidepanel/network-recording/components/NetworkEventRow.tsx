import React from "react";
import { NetworkEntry } from "../types";

const METHOD_COLORS: Record<string, string> = {
  GET: "#4CAF50",
  POST: "#2196F3",
  PUT: "#FF9800",
  PATCH: "#FF9800",
  DELETE: "#F44336",
  OPTIONS: "#9E9E9E",
  HEAD: "#9E9E9E",
};

const getStatusColor = (statusCode: number): string => {
  if (statusCode === 0) return "#F44336";
  if (statusCode < 300) return "#4CAF50";
  if (statusCode < 400) return "#2196F3";
  if (statusCode < 500) return "#FF9800";
  return "#F44336";
};

const splitUrl = (url: string): { host: string; path: string } => {
  try {
    const parsed = new URL(url);
    return { host: parsed.host, path: parsed.pathname + parsed.search || "/" };
  } catch {
    return { host: "", path: url };
  }
};

interface NetworkEventRowProps {
  entry: NetworkEntry;
  typeDisplay: string;
  formatSize: (bytes: number | undefined) => string;
  /** fetch/XHR only: opens a Modify API Response rule filled with this response. */
  onCreateMock?: (entry: NetworkEntry) => void;
}

const NetworkEventRow: React.FC<NetworkEventRowProps> = ({ entry, typeDisplay, formatSize, onCreateMock }) => {
  const { method, url } = entry.request;
  const { status } = entry.response;
  const error = (entry as { _error?: string })._error;
  const isError = !!error;
  const { host, path } = splitUrl(url);

  return (
    <div className={`network-row ${isError ? "network-row--error" : ""}`}>
      <div className="row-main">
        <span className="method-badge" style={{ backgroundColor: METHOD_COLORS[method] || "#9E9E9E" }}>
          {method}
        </span>
        <span className="row-url" title={url}>
          {path}
        </span>
        {onCreateMock && (
          <button
            type="button"
            className="mock-btn"
            data-testid="create-mock"
            disabled={entry.response.content.text === undefined}
            title={
              entry.response.content.text === undefined
                ? "The response body wasn't recorded"
                : "Create a Modify API Response rule from this response"
            }
            onClick={() => onCreateMock(entry)}
          >
            Mock
          </button>
        )}
      </div>
      <div className="row-details">
        {host && (
          <>
            <span className="row-host" title={url}>
              {host}
            </span>
            <span className="row-separator">·</span>
          </>
        )}
        <span className="row-status" style={{ color: getStatusColor(status) }}>
          {isError ? error : status}
        </span>
        <span className="row-separator">·</span>
        <span className="row-type">{typeDisplay}</span>
        <span className="row-separator">·</span>
        <span className="row-size">{formatSize(entry.response.content.size)}</span>
      </div>
    </div>
  );
};

export default NetworkEventRow;
