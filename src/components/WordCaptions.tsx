import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { AccentColor, CaptionCue } from "../data/editPlan";

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
    [cue.start, cue.start + 0.12, cue.end - 0.12, cue.end],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
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
        bottom: 430,
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
          gap: "10px 14px",
          maxWidth: 960,
          padding: "26px 30px",
          borderRadius: 28,
          backgroundColor: "rgba(5, 8, 22, 0.88)",
          border: "2px solid rgba(255,255,255,0.14)",
          fontFamily: "Montserrat, Arial, sans-serif",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        {cue.words.map((word, index) => {
          const isActive = index === activeIndex;
          const isPast = activeIndex >= 0 && index < activeIndex;
          const pop = isActive
            ? spring({
                frame: Math.max(0, Math.floor((time - word.start) * fps)),
                fps,
                config: { damping: 15, stiffness: 260, mass: 0.6 },
              })
            : 0;
          const scale = 1 + pop * 0.09;
          const accent = word.accent ? ACCENTS[word.accent] : null;

          return (
            <span
              key={`${word.text}-${index}`}
              style={{
                display: "inline-block",
                transform: `scale(${scale})`,
                padding: "4px 12px 7px 12px",
                borderRadius: 12,
                fontSize: 68,
                lineHeight: 1.05,
                textTransform: "uppercase",
                backgroundColor: isActive && accent ? accent : "transparent",
                color:
                  isActive && accent
                    ? "#08111F"
                    : isPast
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.62)",
                WebkitTextStroke: isActive && accent ? "0px" : "1px rgba(4,7,18,0.9)",
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
