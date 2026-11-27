import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ContextCallouts } from "../components/ContextCallouts";
import { CtaLowerThird } from "../components/CtaLowerThird";
import { CutTransitions } from "../components/CutTransitions";
import { FilmTreatment } from "../components/FilmTreatment";
import { WordCaptions } from "../components/WordCaptions";
import { editPlan } from "../data/editPlan";
import { DARK, PREMIUM_EASE } from "../theme";

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

  const endFade = interpolate(
    time,
    [editPlan.durationSeconds - 1.0, editPlan.durationSeconds],
    [0, 0.42],
    {
      easing: PREMIUM_EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: DARK, overflow: "hidden" }}>
      <Audio src={staticFile(editPlan.audioSrc)} />

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
          filter: "contrast(1.02) saturate(1.03)",
        }}
      />

      <AbsoluteFill style={{ backgroundColor: DARK, opacity: 0.08 }} />
      <CutTransitions />
      <FilmTreatment />
      <AbsoluteFill
        style={{
          backgroundColor: "#000000",
          opacity: endFade,
          pointerEvents: "none",
        }}
      />

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
