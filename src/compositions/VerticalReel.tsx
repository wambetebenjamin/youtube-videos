import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { AnimatedCaptions } from "../components/AnimatedCaptions";
import { MediaBackdrop } from "../components/MediaBackdrop";

export const verticalReelSchema = z.object({
  hookBadge: z.string(),
  headline: z.string(),
  captionText: z.string(),
  ctaText: z.string(),
  mediaSrc: z.string(),
  accentColor: zColor(),
});

export type VerticalReelProps = z.infer<typeof verticalReelSchema>;

export const defaultVerticalReelProps: VerticalReelProps = {
  hookBadge: "9:16 REELS & SHORTS",
  headline: "Turn Raw Clips Into Viral Vertical Edits",
  captionText: "Auto reframe 16:9 clips add karaoke captions and export ready to post",
  ctaText: "Subscribe for More",
  mediaSrc: "",
  accentColor: "#f59e0b",
};

export const VerticalReel: React.FC<VerticalReelProps> = ({
  hookBadge,
  headline,
  captionText,
  ctaText,
  mediaSrc,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerEnter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 130 },
  });

  const ctaEnter = spring({
    frame: Math.max(0, frame - 120),
    fps,
    config: { damping: 14, stiffness: 160 },
  });

  const headerY = interpolate(headerEnter, [0, 1], [-32, 0]);
  const ctaScale = interpolate(ctaEnter, [0, 1], [0.85, 1]);

  return (
    <AbsoluteFill className="bg-slate-950 font-sans antialiased">
      <MediaBackdrop mediaSrc={mediaSrc} accentColor={accentColor} />

      <div
        style={{
          opacity: headerEnter,
          transform: `translateY(${headerY}px)`,
        }}
        className="absolute inset-x-10 top-20 flex flex-col items-center gap-5 text-center"
      >
        <span
          style={{ backgroundColor: accentColor }}
          className="rounded-full px-6 py-2 text-2xl font-black tracking-wider uppercase text-slate-950 shadow-lg"
        >
          {hookBadge}
        </span>
        <h1 className="text-6xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg">
          {headline}
        </h1>
      </div>

      <Sequence from={15} durationInFrames={165}>
        <AnimatedCaptions
          captionText={captionText}
          accentColor={accentColor}
          vertical
        />
      </Sequence>

      <div
        style={{
          opacity: ctaEnter,
          transform: `scale(${ctaScale})`,
        }}
        className="absolute inset-x-0 bottom-16 flex justify-center"
      >
        <div className="rounded-full border border-white/25 bg-white/15 px-9 py-4 text-3xl font-bold text-white shadow-xl backdrop-blur-md">
          {ctaText}
        </div>
      </div>
    </AbsoluteFill>
  );
};
