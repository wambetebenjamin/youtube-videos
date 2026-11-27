import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { AccentColor, CaptionCue } from "../data/editPlan";
import { DISPLAY_FONT, PREMIUM_EASE } from "../theme";

const ACCENTS: Record<Exclude<AccentColor, null>, string> = {
  yellow: "#FFD84D",
  orange: "#FF8A3D",
  cyan: "#3FE0FF",
};

export type WordCaptionsProps = {
  cues: CaptionCue[];
  until?: number;
};

export const WordCaptions: React.FC<WordCaptionsProps> = ({ cues, until }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  if (until !== undefined && time >= until) {
    return null;
  }

  const cue = cues.find((item) => time >= item.start && time < item.end);
  if (!cue) {
    return null;
  }

  const opacity = interpolate(
    time,
    [cue.start, cue.start + 0.14, cue.end - 0.14, cue.end],
    [0, 1, 1, 0],
    {
      easing: PREMIUM_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const activeIndex = cue.words.findIndex(
    (word) => time >= word.start && time < Math.max(word.end, word.start + 0.08),
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        bottom: 410,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "4px 14px",
          maxWidth: 980,
          fontFamily: DISPLAY_FONT,
          fontWeight: 400,
          letterSpacing: "-0.045em",
        }}
      >
        {cue.words.map((word, index) => {
          const isActive = index === activeIndex;
          const isPast = activeIndex >= 0 && index < activeIndex;
          const pop = isActive
            ? spring({
                frame: Math.max(0, Math.floor((time - word.start) * fps)),
                fps,
                config: { damping: 16, stiffness: 270, mass: 0.62 },
              })
            : 0;
          const scale = 1 + pop * 0.1;
          const lift = -5 * pop;
          const accent = word.accent ? ACCENTS[word.accent] : null;
          const color = isActive
            ? accent ?? "#FFFFFF"
            : isPast
              ? "#FFFFFF"
              : "rgba(255,255,255,0.7)";
          const glow = accent ?? "#FFFFFF";

          return (
            <span
              key={`${word.text}-${index}`}
              style={{
                display: "inline-block",
                transform: `translateY(${lift}px) scale(${scale})`,
                padding: "0 6px 5px 6px",
                fontSize: 74,
                lineHeight: 1.02,
                textTransform: "uppercase",
                color,
                WebkitTextStroke: "1px rgba(0,0,0,0.88)",
                textShadow: isActive
                  ? `0 0 24px ${glow}66, 0 6px 20px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.98)`
                  : "0 6px 20px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.98)",
              }}
            >
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
