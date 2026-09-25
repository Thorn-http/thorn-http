/* global chrome */
import { useCallback, useEffect, useState } from "react";

/**
 * Delaying scripts, styles, images and fonts needs Chrome's debugger, an optional permission the
 * user grants here (see the extension's subresourceDelay service). These helpers read and change
 * that consent from the editor, which runs as an extension page.
 */
const PERMISSION = { permissions: ["debugger"] };
const PAUSED_KEY = "subresource_delay_paused"; // STORAGE_KEYS.SUBRESOURCE_DELAY_PAUSED (chrome.storage.session)

export type SubresourceDelayState = "unsupported" | "off" | "on" | "paused";

const extensionApi = () => (typeof chrome !== "undefined" ? chrome : undefined);

export const isSubresourceDelaySupported = () =>
  !!extensionApi()
    ?.runtime?.getManifest?.()
    .optional_permissions?.includes("debugger" as chrome.runtime.ManifestPermissions);

export const getSubresourceDelayState = async (): Promise<SubresourceDelayState> => {
  const api = extensionApi();
  if (!api || !isSubresourceDelaySupported()) return "unsupported";
  if (!(await api.permissions.contains(PERMISSION))) return "off";
  const stored = await api.storage.session.get(PAUSED_KEY);
  return stored[PAUSED_KEY] ? "paused" : "on";
};

/** Must run in a click handler: Chrome only shows its permission prompt for a user gesture. */
export const allowSubresourceDelay = () => extensionApi()!.permissions.request(PERMISSION);
export const turnOffSubresourceDelay = () => extensionApi()!.permissions.remove(PERMISSION);
export const resumeSubresourceDelay = () => extensionApi()!.storage.session.remove(PAUSED_KEY);

export const useSubresourceDelayState = () => {
  const [state, setState] = useState<SubresourceDelayState>("off");
  const refresh = useCallback(() => {
    getSubresourceDelayState().then(setState, () => setState("unsupported"));
  }, []);

  useEffect(() => {
    refresh();
    const api = extensionApi();
    if (!api?.permissions) return;
    const onStorageChange = (_: unknown, areaName: string) => areaName === "session" && refresh();
    api.permissions.onAdded.addListener(refresh);
    api.permissions.onRemoved.addListener(refresh);
    api.storage.onChanged.addListener(onStorageChange);
    return () => {
      // (Missing from this version of @types/chrome.)
      ((api.permissions.onAdded as unknown) as chrome.events.Event<() => void>).removeListener(refresh);
      ((api.permissions.onRemoved as unknown) as chrome.events.Event<() => void>).removeListener(refresh);
      api.storage.onChanged.removeListener(onStorageChange);
    };
  }, [refresh]);

  return state;
};
