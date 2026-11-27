import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArrowDoodle, SparkleDoodle } from "./FlatDoodles";

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
  const slide = interpolate(enter, [0, 1], [80, 0]);
  const arrowPulse = Math.sin(frame / 7) * 12;

  return (
    <div
      style={{
        position: "absolute",
        left: 42,
        right: 42,
        bottom: 120,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: enter,
        transform: `translateY(${slide}px)`,
      }}
    >
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ transform: `translateX(${-arrowPulse}px) rotate(8deg)` }}>
          <ArrowDoodle color="#FFD84D" size={70} />
        </div>

        <div
          style={{
            minWidth: 720,
            padding: "26px 30px 30px 30px",
            borderRadius: 30,
            backgroundColor: "#0B1020",
            border: "4px solid #FFD84D",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#FFFFFF",
              fontFamily: "Montserrat, Arial, sans-serif",
              fontWeight: 900,
              fontSize: 54,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              marginTop: 12,
              color: "#FFD84D",
              fontFamily: "Montserrat, Arial, sans-serif",
              fontWeight: 800,
              fontSize: 29,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            {dates}
          </div>
        </div>

        <div style={{ transform: `translateX(${arrowPulse}px) scaleX(-1) rotate(8deg)` }}>
          <ArrowDoodle color="#FFD84D" size={70} />
        </div>

        <div style={{ position: "absolute", left: -42, top: -34 }}>
          <SparkleDoodle color="#FF8A3D" size={44} />
        </div>
        <div style={{ position: "absolute", right: -42, top: -34 }}>
          <SparkleDoodle color="#3FE0FF" size={44} />
        </div>
      </div>
    </div>
  );
};
