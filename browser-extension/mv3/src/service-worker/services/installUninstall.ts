import config, { isPackagedApp } from "common/config";
import { STORAGE_KEYS } from "common/constants";
import { saveRecord } from "common/storage";
import { initBlockedDomainsStorage } from "../../utils";

// Show the "Rules applied on this page" notice by default, so a rule left on is never silent.
// It can be switched off in Settings.
const initRulesAppliedNotice = () =>
  saveRecord(STORAGE_KEYS.IMPLICIT_RULE_TESTING_WIDGET_CONFIG, { enabled: true, visibility: "all", ruleTypes: [] });

const handleExtensionInstalledOrUpdated = (details: chrome.runtime.InstalledDetails) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    initBlockedDomainsStorage();
    initRulesAppliedNotice();
    // Open the bundled app instead of a remote landing page.
    chrome.tabs.create({
      url: isPackagedApp ? config.WEB_URL : config.LANDING_PAGE_BASE_URL + "/extension-installed-success",
    });
  }

  if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
    // chrome.tabs.create({ url: config.WEB_URL + "/extension-updated" });
    // To be disabled with the next release
    initBlockedDomainsStorage();
  }
};

export const handleInstallUninstall = () => {
  chrome.runtime.onInstalled.addListener(handleExtensionInstalledOrUpdated);
  if (!isPackagedApp) {
    // Uninstall URLs must be http(s); the packaged app has no hosted goodbye page.
    chrome.runtime.setUninstallURL(config.WEB_URL + "/goodbye/");
  }
};
