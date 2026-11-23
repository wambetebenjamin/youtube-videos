import React from "react";
import { Composition } from "remotion";
import "./index.css";
import {
  VerticalReel,
  defaultVerticalReelProps,
  verticalReelSchema,
} from "./compositions/VerticalReel";
import {
  YouTubeVideo,
  defaultYouTubeVideoProps,
  youTubeVideoSchema,
} from "./compositions/YouTubeVideo";
import {
  AbbasStories,
  abbasStoriesSchema,
  defaultAbbasStoriesProps,
} from "./compositions/AbbasStories";
import {
  PeaceBeStillV6,
  defaultPeaceBeStillProps,
  peaceBeStillSchema,
} from "./compositions/PeaceBeStillV6";
import {
  SocialReel,
  socialReelSchema,
  defaultWisdomProps,
  defaultMotivationProps,
} from "./compositions/SocialReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ——— YOUTUBE — 1920x1080, out/youtube/ ——— */}
      <Composition
        id="YouTubeVideo"
        component={YouTubeVideo}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        schema={youTubeVideoSchema}
        defaultProps={defaultYouTubeVideoProps}
      />
      {/* ——— SOCIAL REELS — 1080x1920, out/reels/, ≥60s, wisdom & motivation ———
           DISTINCT from YouTube: vertical, AI slides, music-length aware,
           no people-mids stock, separate folder so exports never mix. */}
      <Composition
        id="SocialReelWisdom"
        component={SocialReel}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        schema={socialReelSchema}
        defaultProps={defaultWisdomProps}
      />
      <Composition
        id="SocialReelMotivation"
        component={SocialReel}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        schema={socialReelSchema}
        defaultProps={defaultMotivationProps}
      />
      {/* Legacy VerticalReel kept for compat — use SocialReel for new work */}
      <Composition
        id="VerticalReel"
        component={VerticalReel}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
        schema={verticalReelSchema}
        defaultProps={defaultVerticalReelProps}
      />
      <Composition
        id="AbbasStories"
        component={AbbasStories}
        durationInFrames={3600}
        fps={30}
        width={1920}
        height={1080}
        schema={abbasStoriesSchema}
        defaultProps={defaultAbbasStoriesProps}
      />
      <Composition
        id="PeaceBeStillV6"
        component={PeaceBeStillV6}
        durationInFrames={26022}
        fps={30}
        width={1920}
        height={1080}
        schema={peaceBeStillSchema}
        defaultProps={defaultPeaceBeStillProps}
      />
    </>
  );
};
