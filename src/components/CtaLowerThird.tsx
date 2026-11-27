import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BODY_FONT, DISPLAY_FONT, GOLD, PREMIUM_EASE } from "../theme";

export type CtaLowerThirdProps = {
  start: number;
  end?: number;
  headline: string;
  dates: string;
};

export const CtaLowerThird: React.FC<CtaLowerThirdProps> = ({
  start,
  end,
  headline,
  dates,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  if (time < start || (end !== undefined && time >= end)) {
    return null;
  }

  const localFrame = Math.max(0, frame - Math.round(start * fps));
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 16, stiffness: 190, mass: 0.8 },
  });
  const slide = interpolate(enter, [0, 1], [48, 0], {
    easing: PREMIUM_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(enter, [0, 1], [0.96, 1], {
    easing: PREMIUM_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const datesOpacity = interpolate(localFrame, [6, 20], [0, 1], {
    easing: PREMIUM_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const datesY = interpolate(datesOpacity, [0, 1], [16, 0], {
    easing: PREMIUM_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shadow =
    "0 0 28px rgba(255,216,77,0.28), 0 6px 22px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.98)";

  return (
    <div
      style={{
        position: "absolute",
        left: 52,
        right: 52,
        bottom: 150,
        textAlign: "center",
        pointerEvents: "none",
        opacity: enter,
        transform: `translateY(${slide}px) scale(${scale})`,
      }}
    >
      <div
        style={{
          color: "#FFFFFF",
          fontFamily: DISPLAY_FONT,
          fontWeight: 400,
          fontSize: 54,
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          textShadow: shadow,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          marginTop: 14,
          color: GOLD,
          fontFamily: BODY_FONT,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          textShadow: shadow,
          opacity: datesOpacity,
          transform: `translateY(${datesY}px)`,
        }}
      >
        {dates}
      </div>
    </div>
  );
};
