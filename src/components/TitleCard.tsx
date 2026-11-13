import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TitleCardProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  accentColor: string;
  align?: "center" | "left";
};

export const TitleCard: React.FC<TitleCardProps> = ({
  eyebrow,
  title,
  subtitle,
  accentColor,
  align = "left",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
  });

  const subtitleEnter = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 20, stiffness: 110 },
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const translateY = interpolate(enter, [0, 1], [36, 0]);
  const subtitleY = interpolate(subtitleEnter, [0, 1], [24, 0]);

  return (
    <AbsoluteFill
      style={{ opacity: exitOpacity }}
      className={`flex flex-col justify-center px-24 ${
        align === "center" ? "items-center text-center" : "items-start text-left"
      }`}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${translateY}px)`,
        }}
        className="flex flex-col gap-5 max-w-5xl"
      >
        <div className="inline-flex items-center gap-3 self-start rounded-full border border-white/15 bg-white/10 px-5 py-2 backdrop-blur-md">
          <span
            style={{ backgroundColor: accentColor }}
            className="h-2.5 w-2.5 rounded-full"
          />
          <span className="text-xl font-semibold tracking-widest uppercase text-white/90">
            {eyebrow}
          </span>
        </div>

        <h1 className="text-7xl font-extrabold tracking-tight text-white leading-[1.06]">
          {title}
        </h1>

        <p
          style={{
            opacity: subtitleEnter,
            transform: `translateY(${subtitleY}px)`,
          }}
          className="text-3xl font-medium text-slate-300 leading-relaxed max-w-3xl"
        >
          {subtitle}
        </p>
      </div>
    </AbsoluteFill>
  );
};
