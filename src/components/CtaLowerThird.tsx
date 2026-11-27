import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

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
    config: { damping: 15, stiffness: 190, mass: 0.75 },
  });
  const slide = interpolate(enter, [0, 1], [42, 0]);
  const shadow = "0 5px 18px rgba(0, 0, 0, 0.92), 0 0 3px rgba(0, 0, 0, 0.95)";

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
        transform: `translateY(${slide}px)`,
      }}
    >
      <div
        style={{
          color: "#FFFFFF",
          fontFamily: "Montserrat, Arial, sans-serif",
          fontWeight: 900,
          fontSize: 58,
          lineHeight: 1.02,
          letterSpacing: "-0.035em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          textShadow: shadow,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          marginTop: 16,
          color: "#FFD84D",
          fontFamily: "Montserrat, Arial, sans-serif",
          fontWeight: 800,
          fontSize: 31,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          textShadow: shadow,
        }}
      >
        {dates}
      </div>
    </div>
  );
};
