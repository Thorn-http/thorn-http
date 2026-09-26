/* global CompressionStream, DecompressionStream, BlobPart */
import { RecordType, Rule, RuleType } from "@thorn-http/shared/types/entities/rules";

/**
 * Rules shared as a link: https://thorn-http.dev/r#1.<data>, where <data> is the rules as JSON,
 * deflate-compressed and base64url-encoded. The rules live in the URL fragment, which browsers
 * never send to the server, so sharing needs no backend and the site never sees them.
 */
export const RULE_LINK_BASE = "https://thorn-http.dev/r#";
const PAYLOAD_VERSION = "1";
/** Past this, chat apps and some browsers may cut the link; the JSON file is the safer option. */
export const LONG_LINK_LENGTH = 8000;
const MAX_PAYLOAD_LENGTH = 2 * 1024 * 1024;

// Fields that only make sense in the sender's own storage.
const LOCAL_ONLY_FIELDS = [
  "id",
  "groupId",
  "status",
  "expiresAt",
  "isFavourite",
  "isSample",
  "isReadOnly",
  "createdBy",
  "currentOwner",
  "lastModifiedBy",
  "creationDate",
  "modificationDate",
];

const RULE_TYPES: string[] = Object.values(RuleType);

const toBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (text: string) => {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

const transform = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream) => {
  const output = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(output).arrayBuffer());
};

export const createRuleLink = async (rules: Rule[]): Promise<string> => {
  const portableRules = rules.map((rule) => {
    const copy: Record<string, unknown> = { ...rule };
    LOCAL_ONLY_FIELDS.forEach((field) => delete copy[field]);
    return copy;
  });

  const json = new TextEncoder().encode(JSON.stringify(portableRules));
  const compressed = await transform(json, new CompressionStream("deflate-raw"));
  return `${RULE_LINK_BASE}${PAYLOAD_VERSION}.${toBase64Url(compressed)}`;
};

/** Accepts a whole link or just the part after "#". */
export const getRuleLinkPayload = (linkOrPayload: string): string => {
  const text = linkOrPayload.trim();
  const hashIndex = text.indexOf("#");
  return hashIndex === -1 ? text : text.slice(hashIndex + 1);
};

const isValidRule = (value: unknown): value is Rule => {
  const rule = value as Record<string, unknown>;
  return (
    !!rule &&
    typeof rule === "object" &&
    rule.objectType === RecordType.RULE &&
    RULE_TYPES.includes(rule.ruleType as string) &&
    typeof rule.name === "string" &&
    Array.isArray(rule.pairs)
  );
};

/** Throws with a message fit for the user when the link is broken or not a THorn HTTP link. */
export const readRuleLink = async (linkOrPayload: string): Promise<Rule[]> => {
  const payload = getRuleLinkPayload(linkOrPayload);
  const [version, data] = payload.split(".");

  if (version !== PAYLOAD_VERSION || !data || payload.length > MAX_PAYLOAD_LENGTH || !/^[\w-]+$/.test(data)) {
    throw new Error("This isn't a THorn HTTP rule link, or it was cut short.");
  }

  let rules: unknown;
  try {
    const json = await transform(fromBase64Url(data), new DecompressionStream("deflate-raw"));
    rules = JSON.parse(new TextDecoder().decode(json));
  } catch (e) {
    throw new Error("This link is damaged. Ask for the link again, or for the rules as a file.");
  }

  if (!Array.isArray(rules) || !rules.length || !rules.every(isValidRule)) {
    throw new Error("This link doesn't contain valid rules.");
  }

  return rules;
};
