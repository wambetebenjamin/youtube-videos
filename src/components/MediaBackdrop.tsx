import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type MediaBackdropProps = {
  mediaSrc?: string;
  accentColor: string;
};

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv"];

const isVideoPath = (src: string): boolean => {
  const lower = src.toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

const resolveSource = (src: string): string => {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  return staticFile(src.replace(/^\/+/, ""));
};

export const MediaBackdrop: React.FC<MediaBackdropProps> = ({
  mediaSrc,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const panX = interpolate(frame, [0, durationInFrames], [0, -18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const trimmed = mediaSrc?.trim() ?? "";

  if (trimmed.length > 0) {
    const resolved = resolveSource(trimmed);

    return (
      <AbsoluteFill className="bg-slate-950 overflow-hidden">
        {isVideoPath(trimmed) ? (
          <OffthreadVideo
            src={resolved}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Img
            src={resolved}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${scale}) translateX(${panX}px)`,
            }}
          />
        )}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(2,6,23,0.38) 0%, rgba(2,6,23,0.18) 45%, rgba(2,6,23,0.82) 100%)",
          }}
        />
      </AbsoluteFill>
    );
  }

  const glowShift = interpolate(frame, [0, durationInFrames], [-40, 40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#060913",
        backgroundImage: `
          radial-gradient(circle at ${50 + glowShift * 0.25}% 32%, ${accentColor}33 0%, transparent 52%),
          radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.16) 0%, transparent 45%),
          linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px)
        `,
        backgroundSize: "100% 100%, 100% 100%, 64px 64px, 64px 64px",
      }}
    />
  );
};
