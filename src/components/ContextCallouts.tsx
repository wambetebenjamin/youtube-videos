import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { CalloutEvent, DoodleName } from "../data/editPlan";
import {
  ArrowDoodle,
  BooksDoodle,
  CrossDoodle,
  CrownDoodle,
  LightbulbDoodle,
  QuestionDoodle,
  ScreenDoodle,
  SparkleDoodle,
  StarDoodle,
  TrophyDoodle,
  type DoodleProps,
} from "./FlatDoodles";

const DOODLES: Record<DoodleName, React.FC<DoodleProps>> = {
  arrow: ArrowDoodle,
  sparkle: SparkleDoodle,
  star: StarDoodle,
  crown: CrownDoodle,
  question: QuestionDoodle,
  screen: ScreenDoodle,
  lightbulb: LightbulbDoodle,
  books: BooksDoodle,
  trophy: TrophyDoodle,
  cross: CrossDoodle,
};

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
  const translateY = interpolate(enter, [0, 1], [-28, 0]);
  const iconSize = active.compact ? 54 : 48;

  return (
    <div
      style={{
        position: "absolute",
        top: 250,
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          maxWidth: 970,
          padding: active.compact ? "18px 34px" : "20px 30px",
          borderRadius: 26,
          backgroundColor: active.color,
          border: "3px solid rgba(8,17,31,0.18)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {active.icons.map((name, index) => {
            const Icon = DOODLES[name];
            return <Icon key={`${name}-${index}`} color={active.ink} size={iconSize} />;
          })}
        </div>
        <div
          style={{
            color: active.ink,
            fontFamily: "Montserrat, Arial, sans-serif",
            fontWeight: 900,
            fontSize: active.compact ? 62 : 38,
            lineHeight: 1.05,
            letterSpacing: active.compact ? "-0.03em" : "0.01em",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          {active.label}
        </div>
      </div>
    </div>
  );
};
