import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { zColor } from "@remotion/zod-types";
import { z } from "zod";
import { AnimatedCaptions } from "../components/AnimatedCaptions";
import { LowerThird } from "../components/LowerThird";
import { MediaBackdrop } from "../components/MediaBackdrop";
import { TitleCard } from "../components/TitleCard";

export const youTubeVideoSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
  speakerName: z.string(),
  speakerRole: z.string(),
  captionText: z.string(),
  mediaSrc: z.string(),
  accentColor: zColor(),
});

export type YouTubeVideoProps = z.infer<typeof youTubeVideoSchema>;

export const defaultYouTubeVideoProps: YouTubeVideoProps = {
  eyebrow: "AI Video Studio",
  title: "Edit Footage & Motion Graphics in Code",
  subtitle:
    "Drop clips into public/raw-footage/ or photos into public/pics/ and prompt your coding agent.",
  speakerName: "Benjamin Wambete",
  speakerRole: "Creator • AI Video Studio",
  captionText:
    "Upload raw clips trim silences add captions and export crisp 1080p or 4K videos",
  mediaSrc: "",
  accentColor: "#38bdf8",
};

export const YouTubeVideo: React.FC<YouTubeVideoProps> = ({
  eyebrow,
  title,
  subtitle,
  speakerName,
  speakerRole,
  captionText,
  mediaSrc,
  accentColor,
}) => {
  return (
    <AbsoluteFill className="bg-slate-950 font-sans antialiased">
      <MediaBackdrop mediaSrc={mediaSrc} accentColor={accentColor} />

      <Sequence durationInFrames={95}>
        <TitleCard
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          accentColor={accentColor}
        />
      </Sequence>

      <Sequence from={85} durationInFrames={155}>
        <AbsoluteFill>
          <LowerThird
            speakerName={speakerName}
            speakerRole={speakerRole}
            accentColor={accentColor}
          />
          <AnimatedCaptions
            captionText={captionText}
            accentColor={accentColor}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
