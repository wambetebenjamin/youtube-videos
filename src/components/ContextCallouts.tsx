import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalloutEvent } from "../data/editPlan";

export type ContextCalloutsProps = {
  callouts: CalloutEvent[];
};

export const ContextCallouts: React.FC<ContextCalloutsProps> = ({ callouts }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const active = callouts.find((event) => time >= event.start && time < event.end);
  if (!active) {
    return null;
  }

  const localFrame = Math.max(0, frame - Math.round(active.start * fps));
  const enter = spring({
    frame: localFrame,
    fps,
    config: { damping: 14, stiffness: 210, mass: 0.7 },
  });
  const opacity = interpolate(
    time,
    [active.start, active.start + 0.15, active.end - 0.18, active.end],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const translateY = interpolate(enter, [0, 1], [-24, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 220,
        left: 54,
        right: 54,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: opacity * enter,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 980,
          color: active.color,
          fontFamily: "Montserrat, Arial, sans-serif",
          fontWeight: 900,
          fontSize: active.compact ? 58 : 40,
          lineHeight: 1.08,
          letterSpacing: active.compact ? "-0.03em" : "0.01em",
          textAlign: "center",
          textTransform: "uppercase",
          textShadow: "0 5px 18px rgba(0, 0, 0, 0.92), 0 0 3px rgba(0, 0, 0, 0.95)",
        }}
      >
        {active.label}
      </div>
    </div>
  );
};
