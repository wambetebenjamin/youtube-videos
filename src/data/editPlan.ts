export type AccentColor = "yellow" | "orange" | "cyan" | null;

export type CaptionWord = {
  text: string;
  start: number;
  end: number;
  accent: AccentColor;
};

export type CaptionCue = {
  start: number;
  end: number;
  words: CaptionWord[];
};

export type CalloutType =
  | "parentsQuestions"
  | "courage"
  | "pursue"
  | "overtake"
  | "recoverAll"
  | "hannahSamuel";

export type CalloutEvent = {
  type: CalloutType;
  start: number;
  end: number;
};

export type PunchInEvent = {
  start: number;
  end: number;
  scale: number;
};

export type ReframePoint = {
  t: number;
  x: number;
};

export type EditPlan = {
  fps: number;
  width: number;
  height: number;
  durationSeconds: number;
  videoSrc: string;
  captions: CaptionCue[];
  callouts: CalloutEvent[];
  punchIns: PunchInEvent[];
  reframe: {
    sourceWidth: number;
    points: ReframePoint[];
  };
  cta: {
    start: number;
    headline: string;
    dates: string;
  };
};

// Placeholder timeline. The build script replaces this file with the measured
// word timings, callouts, reframe points and CTA from the edited source clips.
export const editPlan: EditPlan = {
  fps: 30,
  width: 1080,
  height: 1920,
  durationSeconds: 72,
  videoSrc: "edit/cut.mp4",
  captions: [],
  callouts: [],
  punchIns: [],
  reframe: {
    sourceWidth: 1280,
    points: [{ t: 0, x: 50 }],
  },
  cta: {
    start: 66,
    headline: "SEND YOUR TEEN TO CAMP",
    dates: "30th November to 5th December 2026",
  },
};
