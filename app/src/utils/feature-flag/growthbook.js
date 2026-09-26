import { GrowthBook } from "@growthbook/growthbook";
import { trackAttr, trackEvent } from "modules/analytics";
import { buildBasicUserProperties } from "modules/analytics/utils";

// THorn HTTP has no remote flag service: these local defaults decide which gated features are on.
// Any flag not listed here resolves to the default passed at the call site.
const THORN_FEATURE_DEFAULTS = {
  import_rules_from_charles: { defaultValue: true },
  content_table_drag_and_drop_support: { defaultValue: true },
};

export const growthbook = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: process.env.VITE_GROWTHBOOK_CLIENT_KEY,
  enableDevMode: true,
  ...(process.env.VITE_THORN_EXTENSION === "true" && { features: THORN_FEATURE_DEFAULTS }),
  trackingCallback: (experiment, result) => {
    trackEvent("experiment_assigned", { id: experiment.key, value: result.value });
  },
  onFeatureUsage: (featureKey, result) => {
    const attrName = `x_flag_${featureKey}`;
    trackAttr(attrName, result?.value);
  },
});

export const initGrowthbook = (user, userAttributes) => {
  let id = null;
  let email = null;

  if (user) {
    const userData = buildBasicUserProperties(user);

    id = userData?.uid;
    email = userData?.email;
  }

  initGrowthbookAttributes(id, email, userAttributes);
};

// Hard Reset Growthbook Attributes.
// id & email kept here so no one can spoof if email by changing in local storage.
export const initGrowthbookAttributes = (id, email, userAttributes) => {
  const attributes = {
    ...userAttributes,
    id: id,
    email: email,
  };

  growthbook.setAttributes(attributes);
};

// Updates Growthbook attributes after every change in redux/local storage store
export const updateGrowthbookAttributes = (newAttributes = {}) => {
  const attributes = { ...growthbook.getAttributes(), ...newAttributes };
  growthbook.setAttributes(attributes);
};
