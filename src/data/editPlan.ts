export type AccentColor = "yellow" | "orange" | "cyan" | null;

export type DoodleName =
  | "arrow"
  | "sparkle"
  | "star"
  | "crown"
  | "question"
  | "screen"
  | "lightbulb"
  | "books"
  | "trophy"
  | "cross";

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

export type CalloutEvent = {
  start: number;
  end: number;
  label: string;
  color: string;
  ink: string;
  icons: DoodleName[];
  compact: boolean;
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
  audioSrc: string;
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

export const editPlan: EditPlan = {
  "fps": 30,
  "width": 1080,
  "height": 1920,
  "durationSeconds": 68.024,
  "videoSrc": "edit/cut.mp4",
  "audioSrc": "edit/audio.wav",
  "captions": [
    {
      "start": 0.0,
      "end": 1.72,
      "words": [
        {
          "text": "Yeah",
          "start": 0.0,
          "end": 0.3,
          "accent": null
        },
        {
          "text": "so",
          "start": 0.34,
          "end": 0.66,
          "accent": null
        },
        {
          "text": "I",
          "start": 0.66,
          "end": 1.04,
          "accent": null
        },
        {
          "text": "was",
          "start": 1.04,
          "end": 1.28,
          "accent": null
        },
        {
          "text": "having",
          "start": 1.28,
          "end": 1.6,
          "accent": null
        }
      ]
    },
    {
      "start": 1.56,
      "end": 4.2,
      "words": [
        {
          "text": "this",
          "start": 1.6,
          "end": 1.96,
          "accent": null
        },
        {
          "text": "conversation",
          "start": 1.96,
          "end": 2.64,
          "accent": null
        },
        {
          "text": "with",
          "start": 2.64,
          "end": 3.1,
          "accent": null
        },
        {
          "text": "someone",
          "start": 3.1,
          "end": 3.56,
          "accent": null
        },
        {
          "text": "a",
          "start": 3.56,
          "end": 4.08,
          "accent": null
        }
      ]
    },
    {
      "start": 4.04,
      "end": 6.72,
      "words": [
        {
          "text": "day",
          "start": 4.08,
          "end": 5.56,
          "accent": null
        },
        {
          "text": "ago",
          "start": 5.72,
          "end": 6.02,
          "accent": null
        },
        {
          "text": "I",
          "start": 6.26,
          "end": 6.6,
          "accent": null
        }
      ]
    },
    {
      "start": 6.56,
      "end": 7.88,
      "words": [
        {
          "text": "was",
          "start": 6.6,
          "end": 6.72,
          "accent": null
        },
        {
          "text": "looking",
          "start": 6.72,
          "end": 6.94,
          "accent": null
        },
        {
          "text": "while",
          "start": 6.94,
          "end": 7.22,
          "accent": null
        },
        {
          "text": "having",
          "start": 7.22,
          "end": 7.54,
          "accent": null
        },
        {
          "text": "this",
          "start": 7.54,
          "end": 7.76,
          "accent": null
        }
      ]
    },
    {
      "start": 7.72,
      "end": 10.34,
      "words": [
        {
          "text": "discussion",
          "start": 7.76,
          "end": 8.58,
          "accent": null
        },
        {
          "text": "concerning",
          "start": 8.58,
          "end": 9.3,
          "accent": null
        },
        {
          "text": "why",
          "start": 9.3,
          "end": 10.22,
          "accent": null
        }
      ]
    },
    {
      "start": 10.18,
      "end": 12.22,
      "words": [
        {
          "text": "your",
          "start": 10.22,
          "end": 10.44,
          "accent": null
        },
        {
          "text": "teenager",
          "start": 10.44,
          "end": 10.74,
          "accent": "yellow"
        },
        {
          "text": "needs",
          "start": 10.74,
          "end": 11.08,
          "accent": null
        },
        {
          "text": "the",
          "start": 11.08,
          "end": 11.92,
          "accent": null
        },
        {
          "text": "youth",
          "start": 11.92,
          "end": 12.1,
          "accent": "yellow"
        }
      ]
    },
    {
      "start": 12.06,
      "end": 12.5,
      "words": [
        {
          "text": "camp",
          "start": 12.1,
          "end": 12.38,
          "accent": "yellow"
        }
      ]
    },
    {
      "start": 12.38,
      "end": 14.52,
      "words": [
        {
          "text": "So",
          "start": 12.38,
          "end": 12.66,
          "accent": null
        },
        {
          "text": "a",
          "start": 12.66,
          "end": 13.02,
          "accent": null
        },
        {
          "text": "parent",
          "start": 13.02,
          "end": 13.3,
          "accent": null
        },
        {
          "text": "recently",
          "start": 13.3,
          "end": 14.02,
          "accent": null
        },
        {
          "text": "asked",
          "start": 14.02,
          "end": 14.4,
          "accent": null
        }
      ]
    },
    {
      "start": 14.36,
      "end": 15.86,
      "words": [
        {
          "text": "me",
          "start": 14.4,
          "end": 14.64,
          "accent": null
        },
        {
          "text": "why",
          "start": 14.64,
          "end": 15.02,
          "accent": null
        },
        {
          "text": "should",
          "start": 15.02,
          "end": 15.28,
          "accent": null
        },
        {
          "text": "I",
          "start": 15.28,
          "end": 15.5,
          "accent": null
        },
        {
          "text": "send",
          "start": 15.5,
          "end": 15.74,
          "accent": null
        }
      ]
    },
    {
      "start": 15.7,
      "end": 17.4,
      "words": [
        {
          "text": "my",
          "start": 15.74,
          "end": 15.98,
          "accent": null
        },
        {
          "text": "kids",
          "start": 15.98,
          "end": 16.18,
          "accent": null
        },
        {
          "text": "to",
          "start": 16.18,
          "end": 16.94,
          "accent": null
        },
        {
          "text": "the",
          "start": 16.94,
          "end": 17.14,
          "accent": null
        },
        {
          "text": "youth",
          "start": 17.14,
          "end": 17.28,
          "accent": "yellow"
        }
      ]
    },
    {
      "start": 17.24,
      "end": 19.08,
      "words": [
        {
          "text": "camp",
          "start": 17.28,
          "end": 17.6,
          "accent": "yellow"
        },
        {
          "text": "what",
          "start": 17.94,
          "end": 18.32,
          "accent": null
        },
        {
          "text": "are",
          "start": 18.32,
          "end": 18.5,
          "accent": null
        },
        {
          "text": "they",
          "start": 18.5,
          "end": 18.62,
          "accent": null
        },
        {
          "text": "pursuing",
          "start": 18.62,
          "end": 18.96,
          "accent": "orange"
        }
      ]
    },
    {
      "start": 19.28,
      "end": 21.14,
      "words": [
        {
          "text": "What",
          "start": 19.32,
          "end": 19.4,
          "accent": null
        },
        {
          "text": "are",
          "start": 19.32,
          "end": 19.5,
          "accent": null
        },
        {
          "text": "you",
          "start": 19.5,
          "end": 19.62,
          "accent": null
        },
        {
          "text": "overtaking",
          "start": 19.62,
          "end": 20.06,
          "accent": "orange"
        },
        {
          "text": "so",
          "start": 20.06,
          "end": 21.02,
          "accent": null
        }
      ]
    },
    {
      "start": 20.98,
      "end": 22.48,
      "words": [
        {
          "text": "i",
          "start": 21.02,
          "end": 21.26,
          "accent": null
        },
        {
          "text": "came",
          "start": 21.26,
          "end": 21.46,
          "accent": null
        },
        {
          "text": "to",
          "start": 21.46,
          "end": 21.7,
          "accent": null
        },
        {
          "text": "ask",
          "start": 21.7,
          "end": 22.06,
          "accent": null
        },
        {
          "text": "them",
          "start": 22.06,
          "end": 22.36,
          "accent": null
        }
      ]
    },
    {
      "start": 22.32,
      "end": 24.88,
      "words": [
        {
          "text": "one",
          "start": 22.36,
          "end": 22.88,
          "accent": null
        },
        {
          "text": "question",
          "start": 22.88,
          "end": 24.42,
          "accent": null
        },
        {
          "text": "okay",
          "start": 24.42,
          "end": 24.76,
          "accent": null
        }
      ]
    },
    {
      "start": 24.72,
      "end": 26.044,
      "words": [
        {
          "text": "They",
          "start": 24.76,
          "end": 25.08,
          "accent": null
        },
        {
          "text": "were",
          "start": 25.08,
          "end": 25.16,
          "accent": null
        },
        {
          "text": "asking",
          "start": 25.16,
          "end": 25.4,
          "accent": null
        },
        {
          "text": "me",
          "start": 25.4,
          "end": 25.924,
          "accent": null
        }
      ]
    },
    {
      "start": 25.924,
      "end": 27.392,
      "words": [
        {
          "text": "Even",
          "start": 25.924,
          "end": 26.392,
          "accent": null
        },
        {
          "text": "if",
          "start": 26.392,
          "end": 26.592,
          "accent": null
        },
        {
          "text": "your",
          "start": 26.592,
          "end": 26.712,
          "accent": null
        },
        {
          "text": "child",
          "start": 26.712,
          "end": 26.932,
          "accent": null
        },
        {
          "text": "only",
          "start": 26.932,
          "end": 27.272,
          "accent": null
        }
      ]
    },
    {
      "start": 27.232,
      "end": 28.252,
      "words": [
        {
          "text": "picks",
          "start": 27.272,
          "end": 27.512,
          "accent": null
        },
        {
          "text": "up",
          "start": 27.512,
          "end": 27.692,
          "accent": null
        },
        {
          "text": "one",
          "start": 27.692,
          "end": 27.872,
          "accent": null
        },
        {
          "text": "or",
          "start": 27.872,
          "end": 28.012,
          "accent": null
        },
        {
          "text": "two",
          "start": 28.012,
          "end": 28.132,
          "accent": null
        }
      ]
    },
    {
      "start": 28.092,
      "end": 31.552,
      "words": [
        {
          "text": "sentences",
          "start": 28.132,
          "end": 28.492,
          "accent": null
        },
        {
          "text": "you",
          "start": 28.492,
          "end": 28.952,
          "accent": null
        },
        {
          "text": "never",
          "start": 28.952,
          "end": 29.172,
          "accent": null
        },
        {
          "text": "know",
          "start": 29.172,
          "end": 29.452,
          "accent": null
        },
        {
          "text": "It's",
          "start": 30.872,
          "end": 31.432,
          "accent": null
        }
      ]
    },
    {
      "start": 31.392,
      "end": 32.612,
      "words": [
        {
          "text": "this",
          "start": 31.432,
          "end": 31.652,
          "accent": null
        },
        {
          "text": "word",
          "start": 31.652,
          "end": 31.952,
          "accent": null
        },
        {
          "text": "is",
          "start": 31.952,
          "end": 32.172,
          "accent": null
        },
        {
          "text": "going",
          "start": 32.172,
          "end": 32.332,
          "accent": null
        },
        {
          "text": "to",
          "start": 32.332,
          "end": 32.492,
          "accent": null
        }
      ]
    },
    {
      "start": 32.452,
      "end": 33.632,
      "words": [
        {
          "text": "come",
          "start": 32.492,
          "end": 32.672,
          "accent": null
        },
        {
          "text": "the",
          "start": 32.672,
          "end": 32.812,
          "accent": null
        },
        {
          "text": "Holy",
          "start": 32.812,
          "end": 32.972,
          "accent": "cyan"
        },
        {
          "text": "Spirit",
          "start": 32.972,
          "end": 33.212,
          "accent": "cyan"
        },
        {
          "text": "has",
          "start": 33.212,
          "end": 33.512,
          "accent": null
        }
      ]
    },
    {
      "start": 33.472,
      "end": 34.692,
      "words": [
        {
          "text": "a",
          "start": 33.512,
          "end": 33.652,
          "accent": null
        },
        {
          "text": "way",
          "start": 33.652,
          "end": 33.752,
          "accent": null
        },
        {
          "text": "of",
          "start": 33.752,
          "end": 33.912,
          "accent": null
        },
        {
          "text": "planting",
          "start": 33.912,
          "end": 34.252,
          "accent": null
        },
        {
          "text": "those",
          "start": 34.252,
          "end": 34.572,
          "accent": null
        }
      ]
    },
    {
      "start": 34.532,
      "end": 36.692,
      "words": [
        {
          "text": "seeds",
          "start": 34.572,
          "end": 34.912,
          "accent": null
        },
        {
          "text": "deep",
          "start": 34.912,
          "end": 35.552,
          "accent": null
        },
        {
          "text": "inside",
          "start": 35.552,
          "end": 35.912,
          "accent": null
        },
        {
          "text": "them",
          "start": 35.912,
          "end": 36.212,
          "accent": null
        },
        {
          "text": "years",
          "start": 36.212,
          "end": 36.572,
          "accent": null
        }
      ]
    },
    {
      "start": 36.532,
      "end": 37.332,
      "words": [
        {
          "text": "from",
          "start": 36.572,
          "end": 36.852,
          "accent": null
        },
        {
          "text": "now",
          "start": 36.852,
          "end": 37.212,
          "accent": null
        }
      ]
    },
    {
      "start": 37.212,
      "end": 39.252,
      "words": [
        {
          "text": "Why",
          "start": 37.212,
          "end": 37.892,
          "accent": null
        },
        {
          "text": "why",
          "start": 37.892,
          "end": 38.352,
          "accent": null
        },
        {
          "text": "your",
          "start": 38.352,
          "end": 38.532,
          "accent": null
        },
        {
          "text": "teenager",
          "start": 38.532,
          "end": 38.852,
          "accent": "yellow"
        },
        {
          "text": "needs",
          "start": 38.852,
          "end": 39.132,
          "accent": null
        }
      ]
    },
    {
      "start": 39.092,
      "end": 40.952,
      "words": [
        {
          "text": "a",
          "start": 39.132,
          "end": 39.232,
          "accent": null
        },
        {
          "text": "couple",
          "start": 39.232,
          "end": 39.472,
          "accent": null
        },
        {
          "text": "come",
          "start": 39.472,
          "end": 39.832,
          "accent": null
        },
        {
          "text": "coming",
          "start": 39.832,
          "end": 40.652,
          "accent": null
        },
        {
          "text": "here",
          "start": 40.652,
          "end": 40.832,
          "accent": null
        }
      ]
    },
    {
      "start": 40.792,
      "end": 42.052,
      "words": [
        {
          "text": "to",
          "start": 40.832,
          "end": 40.932,
          "accent": null
        },
        {
          "text": "build",
          "start": 40.932,
          "end": 41.152,
          "accent": null
        },
        {
          "text": "you",
          "start": 41.152,
          "end": 41.352,
          "accent": null
        },
        {
          "text": "social",
          "start": 41.352,
          "end": 41.572,
          "accent": "cyan"
        },
        {
          "text": "capital",
          "start": 41.572,
          "end": 41.932,
          "accent": "cyan"
        }
      ]
    },
    {
      "start": 42.472,
      "end": 44.732,
      "words": [
        {
          "text": "Get",
          "start": 42.512,
          "end": 43.032,
          "accent": null
        },
        {
          "text": "your",
          "start": 43.032,
          "end": 43.232,
          "accent": null
        },
        {
          "text": "lifelong",
          "start": 43.232,
          "end": 43.592,
          "accent": null
        },
        {
          "text": "Christian",
          "start": 43.592,
          "end": 44.072,
          "accent": null
        },
        {
          "text": "friends",
          "start": 44.072,
          "end": 44.612,
          "accent": "yellow"
        }
      ]
    },
    {
      "start": 44.572,
      "end": 45.852,
      "words": [
        {
          "text": "and",
          "start": 44.612,
          "end": 44.832,
          "accent": null
        },
        {
          "text": "connect",
          "start": 44.832,
          "end": 45.192,
          "accent": null
        },
        {
          "text": "them",
          "start": 45.192,
          "end": 45.392,
          "accent": null
        },
        {
          "text": "into",
          "start": 45.392,
          "end": 45.572,
          "accent": null
        },
        {
          "text": "their",
          "start": 45.572,
          "end": 45.732,
          "accent": null
        }
      ]
    },
    {
      "start": 45.692,
      "end": 48.012,
      "words": [
        {
          "text": "spiritual",
          "start": 45.732,
          "end": 46.112,
          "accent": "cyan"
        },
        {
          "text": "Your",
          "start": 46.112,
          "end": 46.912,
          "accent": null
        },
        {
          "text": "special",
          "start": 46.912,
          "end": 47.152,
          "accent": null
        },
        {
          "text": "covering",
          "start": 47.152,
          "end": 47.652,
          "accent": "cyan"
        },
        {
          "text": "so",
          "start": 47.652,
          "end": 47.892,
          "accent": null
        }
      ]
    },
    {
      "start": 47.852,
      "end": 48.932,
      "words": [
        {
          "text": "pastors",
          "start": 47.892,
          "end": 48.312,
          "accent": null
        },
        {
          "text": "okay",
          "start": 48.312,
          "end": 48.812,
          "accent": null
        }
      ]
    },
    {
      "start": 49.164,
      "end": 50.724,
      "words": [
        {
          "text": "So",
          "start": 49.164,
          "end": 49.484,
          "accent": null
        },
        {
          "text": "look",
          "start": 49.484,
          "end": 49.944,
          "accent": null
        },
        {
          "text": "at",
          "start": 49.944,
          "end": 50.184,
          "accent": null
        },
        {
          "text": "that",
          "start": 50.184,
          "end": 50.324,
          "accent": null
        },
        {
          "text": "thing",
          "start": 50.324,
          "end": 50.604,
          "accent": null
        }
      ]
    },
    {
      "start": 50.564,
      "end": 52.004,
      "words": [
        {
          "text": "the",
          "start": 50.604,
          "end": 50.904,
          "accent": null
        },
        {
          "text": "team",
          "start": 50.904,
          "end": 51.144,
          "accent": null
        },
        {
          "text": "for",
          "start": 51.144,
          "end": 51.424,
          "accent": null
        },
        {
          "text": "our",
          "start": 51.424,
          "end": 51.604,
          "accent": null
        },
        {
          "text": "teenagers",
          "start": 51.604,
          "end": 51.884,
          "accent": "yellow"
        }
      ]
    },
    {
      "start": 51.844,
      "end": 54.804,
      "words": [
        {
          "text": "or",
          "start": 51.884,
          "end": 52.824,
          "accent": null
        },
        {
          "text": "youth",
          "start": 52.824,
          "end": 53.124,
          "accent": "yellow"
        },
        {
          "text": "campuses",
          "start": 53.124,
          "end": 53.564,
          "accent": null
        },
        {
          "text": "pursue",
          "start": 53.564,
          "end": 54.124,
          "accent": "orange"
        },
        {
          "text": "overtake",
          "start": 54.124,
          "end": 54.684,
          "accent": "orange"
        }
      ]
    },
    {
      "start": 54.684,
      "end": 56.604,
      "words": [
        {
          "text": "After",
          "start": 54.684,
          "end": 55.144,
          "accent": null
        },
        {
          "text": "I",
          "start": 55.144,
          "end": 55.464,
          "accent": null
        },
        {
          "text": "have",
          "start": 55.464,
          "end": 56.024,
          "accent": null
        },
        {
          "text": "to",
          "start": 56.024,
          "end": 56.164,
          "accent": null
        },
        {
          "text": "return",
          "start": 56.164,
          "end": 56.484,
          "accent": null
        }
      ]
    },
    {
      "start": 56.444,
      "end": 57.584,
      "words": [
        {
          "text": "back",
          "start": 56.484,
          "end": 56.764,
          "accent": null
        },
        {
          "text": "and",
          "start": 56.764,
          "end": 56.944,
          "accent": null
        },
        {
          "text": "make",
          "start": 56.944,
          "end": 57.244,
          "accent": null
        },
        {
          "text": "my",
          "start": 57.244,
          "end": 57.324,
          "accent": null
        },
        {
          "text": "book",
          "start": 57.284,
          "end": 57.464,
          "accent": null
        }
      ]
    },
    {
      "start": 57.424,
      "end": 58.804,
      "words": [
        {
          "text": "the",
          "start": 57.464,
          "end": 57.664,
          "accent": null
        },
        {
          "text": "get",
          "start": 57.664,
          "end": 57.804,
          "accent": null
        },
        {
          "text": "back",
          "start": 57.804,
          "end": 58.004,
          "accent": null
        },
        {
          "text": "my",
          "start": 58.004,
          "end": 58.244,
          "accent": null
        },
        {
          "text": "position",
          "start": 58.244,
          "end": 58.684,
          "accent": null
        }
      ]
    },
    {
      "start": 58.904,
      "end": 60.264,
      "words": [
        {
          "text": "This",
          "start": 58.944,
          "end": 59.404,
          "accent": null
        },
        {
          "text": "is",
          "start": 59.404,
          "end": 59.564,
          "accent": null
        },
        {
          "text": "how",
          "start": 59.564,
          "end": 59.724,
          "accent": null
        },
        {
          "text": "they",
          "start": 59.724,
          "end": 59.884,
          "accent": null
        },
        {
          "text": "actually",
          "start": 59.884,
          "end": 60.144,
          "accent": null
        }
      ]
    },
    {
      "start": 60.104,
      "end": 61.664,
      "words": [
        {
          "text": "get",
          "start": 60.144,
          "end": 60.384,
          "accent": null
        },
        {
          "text": "back",
          "start": 60.384,
          "end": 60.644,
          "accent": null
        },
        {
          "text": "their",
          "start": 60.644,
          "end": 60.884,
          "accent": null
        },
        {
          "text": "identity",
          "start": 60.884,
          "end": 61.324,
          "accent": "orange"
        },
        {
          "text": "in",
          "start": 61.324,
          "end": 61.544,
          "accent": null
        }
      ]
    },
    {
      "start": 61.504,
      "end": 61.884,
      "words": [
        {
          "text": "Christ",
          "start": 61.544,
          "end": 61.764,
          "accent": "orange"
        }
      ]
    },
    {
      "start": 61.764,
      "end": 63.244,
      "words": [
        {
          "text": "For",
          "start": 61.764,
          "end": 62.204,
          "accent": null
        },
        {
          "text": "people",
          "start": 62.204,
          "end": 62.644,
          "accent": null
        },
        {
          "text": "build",
          "start": 62.644,
          "end": 62.944,
          "accent": null
        },
        {
          "text": "it",
          "start": 62.944,
          "end": 63.044,
          "accent": null
        },
        {
          "text": "at",
          "start": 63.044,
          "end": 63.124,
          "accent": null
        }
      ]
    },
    {
      "start": 63.084,
      "end": 64.324,
      "words": [
        {
          "text": "courage",
          "start": 63.124,
          "end": 63.484,
          "accent": "yellow"
        },
        {
          "text": "and",
          "start": 63.484,
          "end": 63.624,
          "accent": null
        },
        {
          "text": "then",
          "start": 63.624,
          "end": 63.784,
          "accent": null
        },
        {
          "text": "build",
          "start": 63.784,
          "end": 64.004,
          "accent": null
        },
        {
          "text": "they",
          "start": 64.004,
          "end": 64.204,
          "accent": null
        }
      ]
    },
    {
      "start": 64.164,
      "end": 65.924,
      "words": [
        {
          "text": "experience",
          "start": 64.204,
          "end": 64.624,
          "accent": null
        },
        {
          "text": "let",
          "start": 64.624,
          "end": 64.844,
          "accent": null
        },
        {
          "text": "them",
          "start": 64.844,
          "end": 65.064,
          "accent": null
        },
        {
          "text": "have",
          "start": 65.064,
          "end": 65.284,
          "accent": null
        },
        {
          "text": "relationship",
          "start": 65.284,
          "end": 65.804,
          "accent": null
        }
      ]
    },
    {
      "start": 65.764,
      "end": 67.024,
      "words": [
        {
          "text": "Let",
          "start": 65.804,
          "end": 66.204,
          "accent": null
        },
        {
          "text": "him",
          "start": 66.204,
          "end": 66.344,
          "accent": null
        },
        {
          "text": "do",
          "start": 66.344,
          "end": 66.524,
          "accent": null
        },
        {
          "text": "their",
          "start": 66.524,
          "end": 66.704,
          "accent": null
        },
        {
          "text": "social",
          "start": 66.704,
          "end": 66.904,
          "accent": "cyan"
        }
      ]
    },
    {
      "start": 66.864,
      "end": 68.144,
      "words": [
        {
          "text": "capital",
          "start": 66.904,
          "end": 67.244,
          "accent": "cyan"
        },
        {
          "text": "new",
          "start": 67.244,
          "end": 67.784,
          "accent": null
        },
        {
          "text": "friends",
          "start": 67.784,
          "end": 68.024,
          "accent": "yellow"
        }
      ]
    }
  ],
  "callouts": [
    {
      "start": 1.0,
      "end": 6.0,
      "label": "WHY YOUTH CAMP?",
      "color": "#3FE0FF",
      "ink": "#08111F",
      "icons": [
        "question",
        "screen"
      ],
      "compact": false
    },
    {
      "start": 13.38,
      "end": 18.88,
      "label": "PURSUE  OVERTAKE  RECOVER ALL",
      "color": "#FF8A3D",
      "ink": "#08111F",
      "icons": [
        "books",
        "star",
        "trophy"
      ],
      "compact": true
    },
    {
      "start": 26.924,
      "end": 32.424,
      "label": "ONE OR TWO SENTENCES CAN STAY",
      "color": "#FFD84D",
      "ink": "#08111F",
      "icons": [
        "lightbulb",
        "star"
      ],
      "compact": false
    },
    {
      "start": 38.212,
      "end": 44.212,
      "label": "SOCIAL CAPITAL  SPIRITUAL COVERING",
      "color": "#3FE0FF",
      "ink": "#08111F",
      "icons": [
        "screen",
        "crown",
        "cross"
      ],
      "compact": false
    },
    {
      "start": 49.764,
      "end": 53.964,
      "label": "PURSUE  OVERTAKE  RECOVER ALL",
      "color": "#FFD84D",
      "ink": "#08111F",
      "icons": [
        "books",
        "star",
        "trophy"
      ],
      "compact": true
    },
    {
      "start": 55.484,
      "end": 60.284,
      "label": "IDENTITY ROOTED IN CHRIST",
      "color": "#FFB35C",
      "ink": "#231205",
      "icons": [
        "cross",
        "star"
      ],
      "compact": true
    },
    {
      "start": 62.164,
      "end": 66.664,
      "label": "COURAGE  COMMUNITY  NEW FRIENDS",
      "color": "#3FE0FF",
      "ink": "#08111F",
      "icons": [
        "lightbulb",
        "screen",
        "star"
      ],
      "compact": false
    }
  ],
  "punchIns": [
    {
      "start": 17.06,
      "end": 17.44,
      "scale": 1.045
    },
    {
      "start": 32.732,
      "end": 33.132,
      "scale": 1.045
    },
    {
      "start": 38.452,
      "end": 39.012,
      "scale": 1.045
    },
    {
      "start": 41.272,
      "end": 41.732,
      "scale": 1.045
    },
    {
      "start": 43.992,
      "end": 44.772,
      "scale": 1.045
    },
    {
      "start": 45.652,
      "end": 46.272,
      "scale": 1.045
    },
    {
      "start": 47.072,
      "end": 47.812,
      "scale": 1.045
    },
    {
      "start": 51.524,
      "end": 52.044,
      "scale": 1.045
    },
    {
      "start": 52.744,
      "end": 53.284,
      "scale": 1.045
    },
    {
      "start": 61.464,
      "end": 61.764,
      "scale": 1.045
    }
  ],
  "reframe": {
    "sourceWidth": 1280,
    "points": [
      {
        "t": 0.0,
        "x": 52.0
      },
      {
        "t": 12.38,
        "x": 51.0
      },
      {
        "t": 25.924,
        "x": 53.0
      },
      {
        "t": 37.212,
        "x": 52.0
      },
      {
        "t": 49.164,
        "x": 50.5
      },
      {
        "t": 54.684,
        "x": 52.0
      },
      {
        "t": 61.764,
        "x": 51.0
      },
      {
        "t": 68.024,
        "x": 52.0
      }
    ]
  },
  "cta": {
    "start": 62.024,
    "headline": "SEND YOUR TEEN TO CAMP",
    "dates": "30th November to 5th December 2026"
  }
};
