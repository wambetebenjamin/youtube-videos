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

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
