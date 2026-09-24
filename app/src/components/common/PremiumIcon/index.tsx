import React from "react";
import { TooltipProps } from "antd";
import { FeatureType, PaidFeatureNudgeViewedSource } from "modules/analytics/events/common/pricing";
import { isThornExtension } from "utils/EnvUtils";
import "./premiumIcon.css";

export const PremiumIcon: React.FC<
  TooltipProps & { onSeePlansClick?: () => void } & {
    featureType: FeatureType;
    source?: PaidFeatureNudgeViewedSource;
  }
> = (props) => {
  // Every feature is free in Thorn HTTP
  if (isThornExtension()) return null;

  return (
    <span className="premium-icon">
      <img width={16} height={16} src={"/assets/media/components/diamond.svg"} alt="Premium icon" />
    </span>
  );
};
