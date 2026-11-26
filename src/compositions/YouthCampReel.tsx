import React from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CtaLowerThird } from "../components/CtaLowerThird";
import { ContextCallouts } from "../components/ContextCallouts";
import { WordCaptions } from "../components/WordCaptions";
import { editPlan } from "../data/editPlan";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const YouthCampReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  const points = editPlan.reframe.points;
  const pan =
    points.length <= 1
      ? (points[0]?.x ?? 50)
      : interpolate(
          time,
          points.map((point) => point.t),
          points.map((point) => point.x),
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

  let zoom = 1.015;
  for (const event of editPlan.punchIns) {
    if (time >= event.start && time <= event.end) {
      const progress = (time - event.start) / Math.max(0.001, event.end - event.start);
      zoom += (event.scale - 1) * Math.sin(Math.PI * clamp(progress, 0, 1));
    }
  }
  zoom = clamp(zoom, 1.0, 1.12);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050816", overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(editPlan.videoSrc)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: `${pan}% 50%`,
          transform: `scale(${zoom})`,
          transformOrigin: "center center",
        }}
      />

      <AbsoluteFill style={{ backgroundColor: "#050816", opacity: 0.12 }} />

      <ContextCallouts callouts={editPlan.callouts} />

      <WordCaptions cues={editPlan.captions} until={editPlan.cta.start} />

      <CtaLowerThird
        start={editPlan.cta.start}
        end={editPlan.durationSeconds}
        headline={editPlan.cta.headline}
        dates={editPlan.cta.dates}
      />
    </AbsoluteFill>
  );
};
