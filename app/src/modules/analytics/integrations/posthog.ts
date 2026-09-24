import { IAnalyticsIntegration } from "./common";

// Thorn HTTP collects no analytics. This integration is kept as a no-op so existing
// trackEvent/trackAttr call sites keep working without sending data anywhere.
class NoopAnalyticsIntegration implements IAnalyticsIntegration {
  isIntegrationDone = true;
  enabled = false;
  startTime = Date.now();

  init = (_user: any) => {};

  trackEvent = (_eventName: string, _eventParams: any) => {};

  trackAttr = (_name: string, _value: string) => {};
}

const posthogIntegration = new NoopAnalyticsIntegration();
export default posthogIntegration;
