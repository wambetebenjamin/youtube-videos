import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export type AnimatedCaptionsProps = {
  captionText: string;
  accentColor: string;
  vertical?: boolean;
};

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  captionText,
  accentColor,
  vertical = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const words = captionText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return null;
  }

  const framesPerWord = Math.max(4, Math.floor(durationInFrames / words.length));
  const activeIndex = Math.min(
    words.length - 1,
    Math.floor(frame / framesPerWord),
  );

  const pop = spring({
    frame: frame % framesPerWord,
    fps,
    config: { damping: 14, stiffness: 220 },
  });

  return (
    <div
      className={`absolute inset-x-0 flex justify-center px-12 ${
        vertical ? "bottom-44" : "bottom-16"
      }`}
    >
      <div className="flex max-w-4xl flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-3xl border border-white/15 bg-slate-950/80 px-8 py-5 shadow-2xl backdrop-blur-lg">
        {words.map((word, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;
          const scale = isActive ? 1 + 0.08 * pop : 1;

          return (
            <span
              key={`${word}-${index}`}
              style={{
                transform: `scale(${scale})`,
                backgroundColor: isActive ? accentColor : "transparent",
                color: isActive
                  ? "#020617"
                  : isPast
                    ? "#f8fafc"
                    : "rgba(226, 232, 240, 0.72)",
              }}
              className={`inline-block rounded-xl px-2.5 py-1 font-extrabold tracking-tight ${
                vertical ? "text-5xl" : "text-4xl"
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
