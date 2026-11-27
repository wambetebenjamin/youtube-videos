import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { editPlan } from "../data/editPlan";
import { PREMIUM_EASE } from "../theme";

export const CutTransitions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;
  const cuts = editPlan.reframe.points
    .slice(1, -1)
    .map((point) => point.t);

  const opacities = cuts.map((cut) =>
    interpolate(time, [cut - 0.12, cut, cut + 0.12], [0, 0.32, 0], {
      easing: PREMIUM_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const opacity = Math.max(0, ...opacities);

  if (opacity <= 0.001) {
    return null;
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
