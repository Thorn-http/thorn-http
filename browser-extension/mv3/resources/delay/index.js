// Local delay page for page and iframe loads (see parseDelayRule in the app and rulesManager).
// URL: delay/index.html?ms=<delay>#<url before the marker param>#<url after it>
(() => {
  const MAX_DELAY_MS = 10 * 60 * 1000;

  const readTarget = () => {
    // Not decoded: the URL is used exactly as it was requested (%-escapes included).
    const hash = location.hash.slice(1);
    const separator = hash.indexOf("#");
    const before = separator === -1 ? hash : hash.slice(0, separator);
    const after = separator === -1 ? "" : hash.slice(separator + 1);
    // The marker param was cut out of the URL: tidy the separators it leaves behind.
    let url = before + after;
    if (!before.includes("?") && after.startsWith("&")) url = before + "?" + after.slice(1);
    url = url.replace(/\?$/, "");
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
    } catch (e) {
      return null;
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, "0")} s`;
  };

  const target = readTarget();
  const delay = Math.min(Math.max(Number(new URLSearchParams(location.search).get("ms")) || 0, 0), MAX_DELAY_MS);
  const countdown = document.getElementById("countdown");
  document.getElementById("total").textContent = formatDuration(delay);
  document.getElementById("url").textContent = target || "(invalid address)";

  if (!target) {
    countdown.textContent = "Can't load this address.";
    document.getElementById("load-now").hidden = true;
    return;
  }

  let done = false;
  const load = () => {
    if (done) return;
    done = true;
    countdown.textContent = "Loading…";
    // Lets this one load through without being delayed again, then loads it.
    chrome.runtime.sendMessage({ action: "allowDelayedNavigation", url: target }, () => location.replace(target));
  };

  const end = Date.now() + delay;
  const tick = () => {
    const left = end - Date.now();
    if (left <= 0) return load();
    countdown.textContent = `${formatDuration(left)} left`;
    setTimeout(tick, Math.min(left, 250));
  };
  document.getElementById("load-now").addEventListener("click", load);
  tick();
})();
