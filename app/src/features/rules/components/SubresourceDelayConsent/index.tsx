import React, { useState } from "react";
import { Alert, Button, Modal } from "antd";
import {
  allowSubresourceDelay,
  resumeSubresourceDelay,
  turnOffSubresourceDelay,
  useSubresourceDelayState,
} from "./subresourceDelay";
import "./subresourceDelayConsent.css";

/** Everything the user needs to know before allowing it, in plain words. */
export const SubresourceDelayExplanation: React.FC = () => (
  <div className="subresource-delay-explanation" data-testid="subresource-delay-explanation">
    <p>
      Browsers don't let extensions hold back scripts, styles, images and fonts. The only way to delay them without
      sending them through a server is Chrome's <b>debugger</b>, which needs your permission.
    </p>
    <h4>What THorn HTTP does with it</h4>
    <p>
      Only while a Delay rule for these request types is switched on, THorn HTTP attaches to your web tabs, pauses the
      requests your Delay rules match, and lets each one continue when its delay is up. Every other request goes through
      untouched. Nothing is read, stored or sent anywhere: it all happens in your browser. One limit: a page opened from
      Chrome's New Tab page can load a few files before THorn HTTP is attached to that tab; reload it if you need those
      delayed too.
    </p>
    <h4>What you will see</h4>
    <p>
      While it's attached, Chrome shows a bar saying <i>"THorn HTTP started debugging this browser"</i>. That's
      expected. If you close that bar, these delays pause until you resume them here.
    </p>
    <h4>What the permission allows</h4>
    <p>
      Technically, the debugger permission lets an extension read and change web pages and their network traffic. Thorn
      HTTP uses it only as described above, and its source code is public.
    </p>
    <h4>How to turn it off</h4>
    <p>
      At any time, here or in Settings, or by removing the permission in <code>chrome://extensions</code>. Without it,
      fetch/XHR requests and page loads are still delayed; scripts, styles, images and fonts load right away.
    </p>
  </div>
);

/** Consent and status for delaying scripts, styles, images and fonts (Delay rule editor, Settings). */
export const SubresourceDelayConsent: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const state = useSubresourceDelayState();
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  const allow = () => {
    // Straight from the click: Chrome only prompts for a user gesture.
    allowSubresourceDelay().finally(() => setIsExplanationOpen(false));
  };

  const learnMore = (
    <Button type="link" size="small" onClick={() => setIsExplanationOpen(true)}>
      How it works
    </Button>
  );

  let alert: React.ReactNode;
  if (state === "unsupported") {
    alert = (
      <Alert
        type="info"
        showIcon
        message="Scripts, styles, images and fonts can't be delayed in this browser. fetch/XHR requests and page loads are."
      />
    );
  } else if (state === "on") {
    alert = (
      <Alert
        type="success"
        showIcon
        message="Scripts, styles, images and fonts are delayed too, using Chrome's debugger (you allowed it)."
        action={
          <>
            {learnMore}
            <Button size="small" onClick={() => turnOffSubresourceDelay()}>
              Turn off
            </Button>
          </>
        }
      />
    );
  } else if (state === "paused") {
    alert = (
      <Alert
        type="warning"
        showIcon
        message="Delays for scripts, styles, images and fonts are paused: Chrome's debugging bar was closed."
        action={
          <>
            {learnMore}
            <Button size="small" onClick={() => resumeSubresourceDelay()}>
              Resume
            </Button>
          </>
        }
      />
    );
  } else {
    alert = (
      <Alert
        type="warning"
        showIcon
        message="Scripts, styles, images and fonts are not delayed: that needs your permission to use Chrome's debugger."
        action={
          <Button size="small" type="primary" onClick={() => setIsExplanationOpen(true)}>
            Review and allow…
          </Button>
        }
      />
    );
  }

  return (
    <div
      className={compact ? "subresource-delay-consent compact" : "subresource-delay-consent"}
      data-testid="subresource-delay-consent"
      data-state={state}
    >
      {alert}
      <Modal
        open={isExplanationOpen}
        title="Delay scripts, styles, images and fonts?"
        onCancel={() => setIsExplanationOpen(false)}
        footer={
          state === "off"
            ? [
                <Button key="cancel" onClick={() => setIsExplanationOpen(false)}>
                  Not now
                </Button>,
                <Button key="allow" type="primary" onClick={allow}>
                  Allow
                </Button>,
              ]
            : [
                <Button key="close" onClick={() => setIsExplanationOpen(false)}>
                  Close
                </Button>,
              ]
        }
      >
        <SubresourceDelayExplanation />
      </Modal>
    </div>
  );
};
