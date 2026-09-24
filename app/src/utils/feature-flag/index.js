// Remote feature flags were served by PostHog. Thorn HTTP has no backend, so every flag
// resolves to the caller's default value.
class FeatureFlag {
  isFeatureFlagLoaded = true;

  init = () => {};

  setIsFeatureFlagLoaded = () => {};

  getValue = (_flagName, defaultValue = null) => defaultValue;
}

const featureFlag = new FeatureFlag();

export default featureFlag;
