import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalloutEvent } from "../data/editPlan";
import { BODY_FONT, DISPLAY_FONT, PREMIUM_EASE } from "../theme";

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
    config: { damping: 16, stiffness: 210, mass: 0.72 },
  });
  const opacity = interpolate(
    time,
    [active.start, active.start + 0.16, active.end - 0.2, active.end],
    [0, 1, 1, 0],
    {
      easing: PREMIUM_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const translateY = interpolate(enter, [0, 1], [-28, 0], {
    easing: PREMIUM_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eyebrowOpacity = interpolate(enter, [0, 1], [0, 0.82], {
    easing: PREMIUM_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const words = active.label.split(" ");

  return (
    <div
      style={{
        position: "absolute",
        top: 210,
        left: 54,
        right: 54,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none",
        opacity: opacity * enter,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          marginBottom: 16,
          color: "rgba(255,255,255,0.82)",
          fontFamily: BODY_FONT,
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          textShadow: "0 4px 14px rgba(0,0,0,0.9)",
          opacity: eyebrowOpacity,
        }}
      >
        Youth Camp 2026
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 0.24em",
          maxWidth: 980,
          fontFamily: DISPLAY_FONT,
          fontWeight: 400,
          fontSize: active.compact ? 60 : 42,
          lineHeight: 1.02,
          letterSpacing: active.compact ? "-0.035em" : "0.005em",
          textAlign: "center",
          textTransform: "uppercase",
          color: active.color,
          textShadow: `0 0 30px ${active.color}55, 0 6px 20px rgba(0,0,0,0.92), 0 0 3px rgba(0,0,0,0.95)`,
        }}
      >
        {words.map((word, index) => {
          const wordFrame = Math.max(0, localFrame - index * 3);
          const wordEnter = spring({
            frame: wordFrame,
            fps,
            config: { damping: 15, stiffness: 230, mass: 0.68 },
          });
          const wordY = interpolate(wordEnter, [0, 1], [26, 0], {
            easing: PREMIUM_EASE,
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={`${word}-${index}`}
              style={{
                display: "inline-block",
                opacity: wordEnter,
                transform: `translateY(${wordY}px)`,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
