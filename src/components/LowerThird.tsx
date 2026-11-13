import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type LowerThirdProps = {
  speakerName: string;
  speakerRole: string;
  accentColor: string;
};

export const LowerThird: React.FC<LowerThirdProps> = ({
  speakerName,
  speakerRole,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideIn = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 140 },
  });

  const slideOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const visibility = Math.min(slideIn, slideOut);
  const translateX = interpolate(visibility, [0, 1], [-48, 0]);

  return (
    <div
      style={{
        opacity: visibility,
        transform: `translateX(${translateX}px)`,
      }}
      className="absolute bottom-14 left-16 flex items-stretch overflow-hidden rounded-2xl border border-white/15 bg-slate-950/85 shadow-2xl backdrop-blur-xl"
    >
      <div style={{ backgroundColor: accentColor }} className="w-2.5 shrink-0" />
      <div className="flex flex-col justify-center px-7 py-4">
        <span className="text-3xl font-bold tracking-tight text-white">
          {speakerName}
        </span>
        <span className="text-xl font-medium text-slate-300">
          {speakerRole}
        </span>
      </div>
    </div>
  );
};
