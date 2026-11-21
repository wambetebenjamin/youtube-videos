import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

/**
 * Peace, Be Still — v6.1 Cinematic Edit — Reference-Faithful Rebuild
 * Source: "Peace, Be Still - v5 - eight silences (Mark 4) - 14-27.mp4" (867.4s, 1920x1080 30fps)
 * Reference: "6 Signs God Is Moving You Into a New Season" — https://youtu.be/W4iVXGBuQlQ
 * Inspo traits fixed from v6.0 "feeling off": intro hook, B-roll every 15-30s with real camp images,
 * chapter cards exact spec, lower thirds no-blur, subtle zooms, pattern interrupts inside chapters.
 */
export const peaceBeStillSchema = z.object({
  sourceSrc: z.string(),
  accentColor: zColor(),
  title: z.string(),
});

export type PeaceBeStillProps = z.infer<typeof peaceBeStillSchema>;

export const defaultPeaceBeStillProps: PeaceBeStillProps = {
  sourceSrc: "raw-footage/Peace, Be Still - v5 - eight silences (Mark 4) - 14-27.mp4",
  accentColor: "#D4AF37",
  title: "Peace, Be Still",
};

// ── Grain + Grade ────────────────────────────────────────────
const FilmGrain: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: 0.06,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      mixBlendMode: "overlay" as any,
      pointerEvents: "none",
    }}
  />
);

const WarmGrade: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      filter: "contrast(0.94) brightness(1.02) saturate(0.92) sepia(0.08) hue-rotate(-5deg)",
    }}
  >
    {children}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 65% 35%, rgba(244,196,48,0.13) 0%, transparent 56%), radial-gradient(ellipse at 20% 85%, rgba(212,175,55,0.08) 0%, transparent 46%)",
        mixBlendMode: "soft-light" as any,
      }}
    />
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, rgba(26,26,26,0) 0%, rgba(10,10,14,0.42) 100%)",
        opacity: 0.58,
      }}
    />
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.52) 100%)",
      }}
    />
    <FilmGrain />
  </AbsoluteFill>
);

// ── Lower thirds (spec-exact: no blur, rgba(0,0,0,0.70), rounded, gold bar) ─
const LowerThirdChapter: React.FC<{
  label: string;
  title: string;
  subtitle: string;
  accent: string;
}> = ({ label, title, subtitle, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const slideIn = spring({ frame, fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });
  const slideOut = interpolate(
    frame,
    [durationInFrames - 9, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const vis = Math.min(slideIn, slideOut);
  const tx = interpolate(vis, [0, 1], [-56, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        bottom: 100,
        opacity: vis,
        transform: `translateX(${tx}px)`,
        maxWidth: 920,
        display: "flex",
      }}
    >
      <div style={{ backgroundColor: accent, width: 4, borderRadius: 999, flexShrink: 0 }} />
      <div
        style={{
          background: "rgba(0,0,0,0.70)",
          borderTopRightRadius: 14,
          borderBottomRightRadius: 14,
          padding: "14px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          border: "1px solid rgba(255,255,255,0.10)",
          borderLeft: "none",
        }}
      >
        <span
          style={{
            color: accent,
            letterSpacing: "0.18em",
            fontSize: 12,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span style={{ color: "white", fontSize: 20, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.01em" }}>
          {title}
        </span>
        <span style={{ color: "#CCCCCC", fontSize: 13, fontWeight: 500 }}>{subtitle}</span>
      </div>
    </div>
  );
};

const ScripturePill: React.FC<{ refText: string; accent: string }> = ({ refText, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = Math.min(fadeIn, fadeOut);
  return (
    <div style={{ position: "absolute", bottom: 102, left: "50%", transform: "translateX(-50%)", opacity: op }}>
      <div
        style={{
          background: "rgba(0,0,0,0.60)",
          borderRadius: 999,
          border: "1px solid rgba(212,175,55,0.28)",
          padding: "8px 20px",
          display: "inline-flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span style={{ color: accent, fontSize: 12 }}>✦</span>
        <span
          style={{
            color: accent,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          {refText}
        </span>
      </div>
    </div>
  );
};

const ScriptureOverlay: React.FC<{ verse: string; refText: string; accent: string }> = ({
  verse,
  refText,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = Math.min(fade, fadeOut);
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, opacity: op }}>
      <div
        style={{
          background: "rgba(0,0,0,0.60)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.10)",
          padding: "30px 36px",
          maxWidth: 980,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: 24,
            lineHeight: 1.45,
            color: "white",
          }}
        >
          “{verse}”
        </p>
        <div style={{ marginTop: 14, display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 28, height: 1, background: accent }} />
          <span
            style={{
              color: accent,
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            — {refText}
          </span>
          <div style={{ width: 28, height: 1, background: accent }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ChapterCard: React.FC<{ label: string; title: string; accent: string }> = ({ label, title, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(enter, [0, 1], [26, 0]);
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #111114 0%, #1a1a1f 48%, #0a0a0d 100%)",
        opacity: exit,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${y}px)`,
          textAlign: "center",
          maxWidth: 1080,
          padding: "0 64px",
        }}
      >
        <span
          style={{
            color: accent,
            border: `1px solid ${accent}55`,
            padding: "6px 18px",
            borderRadius: 999,
            fontSize: 12,
            letterSpacing: "0.22em",
            background: "rgba(212,175,55,0.08)",
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 72,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            margin: "16px auto 18px",
            opacity: 0.9,
          }}
        />
        <h1
          style={{
            fontSize: 46,
            fontWeight: 900,
            color: "white",
            lineHeight: 0.98,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  );
};

const KeyPointBar: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = spring({ frame, fps: 30, config: { damping: 16, stiffness: 120 } });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        bottom: 128,
        left: 96,
        right: 96,
        opacity: exit,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "linear-gradient(90deg, #0f0f12 0%, #1c1c20 50%, #0f0f12 100%)",
          borderTop: `2px solid ${accent}`,
          padding: "12px 28px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, height: 2, width: `${progress * 100}%`, background: accent }} />
        <p
          style={{
            color: "white",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

// ── B-roll overlay with Ken Burns + vignette (real camp images) ──
const BRollOverlay: React.FC<{ src: string; durationInFrames: number }> = ({ src, durationInFrames }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panX = interpolate(frame, [0, durationInFrames], [0, -18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(
    interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden", opacity }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translateX(${panX}px)`,
        }}
      >
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.38) 100%), radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ── Intro Hook (0-18s) — cinematic like reference ──
const IntroHook: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 100 } });
  const y = interpolate(enter, [0, 1], [30, 0]);
  const out = interpolate(frame, [480, 540], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        textAlign: "center",
        opacity: out,
      }}
    >
      <div
        style={{
          opacity: enter,
          transform: `translateY(${y}px)`,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 999,
          padding: "8px 20px",
          display: "inline-flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: accent, display: "inline-block" }} />
        <span style={{ fontSize: 12, letterSpacing: "0.18em", color: "rgba(255,255,255,0.92)", fontWeight: 700, textTransform: "uppercase" }}>
          Abba's Table • A Story for the Storm
        </span>
      </div>
      <h1
        style={{
          marginTop: 20,
          fontSize: 64,
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: "-0.02em",
          color: "white",
          maxWidth: 1100,
          opacity: enter,
          transform: `translateY(${y}px)`,
          textShadow: "0 6px 28px rgba(0,0,0,0.55)",
        }}
      >
        PEACE, BE STILL
      </h1>
      <p
        style={{
          marginTop: 10,
          fontSize: 18,
          fontWeight: 500,
          color: "rgba(203,213,225,0.96)",
          maxWidth: 820,
          lineHeight: 1.45,
          opacity: enter,
          transform: `translateY(${interpolate(enter, [0, 1], [20, 0])}px)`,
        }}
      >
        Eight silences in Mark 4 — Even if nothing has changed yet
      </p>
      <div
        style={{
          marginTop: 22,
          width: interpolate(enter, [0, 1], [0, 120]),
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: enter as number,
        }}
      />
      <div style={{ marginTop: 16, fontSize: 12, letterSpacing: "0.16em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", fontWeight: 600, opacity: enter as number }}>
        MARK 4:35-41 • When the water was over their ankles
      </div>
    </AbsoluteFill>
  );
};

// ── Chapters (8 silences + intro/prayer), times from 141 subtitle scan, tuned to avoid "off" pacing ──
type ChapterDef = {
  id: string;
  from: number;
  duration: number;
  label: string;
  title: string;
  subtitle: string;
  ref: string;
  verse?: string;
  keyPoint?: string;
};

const CHAPTERS: ChapterDef[] = [
  {
    id: "intro",
    from: 0,
    duration: 1500,
    label: "SILENCE ONE",
    title: "A Long Day by the Water",
    subtitle: "All afternoon He taught from a boat • A crowd that would not leave",
    ref: "Mark 4:1-2",
    verse: "Again he began to teach beside the sea. And a very large crowd gathered about him, so that he got into a boat.",
  },
  {
    id: "crossing",
    from: 1500,
    duration: 1180,
    label: "SILENCE TWO",
    title: "Let Us Go Over to the Other Side",
    subtitle: "Not shelter. Not morning. Forward — at evening",
    ref: "Mark 4:35",
    verse: "On that day, when evening had come, he said to them, Let us go across to the other side.",
    keyPoint: "FAITH MOVES FORWARD — EVEN AT EVENING",
  },
  {
    id: "bowl",
    from: 2680,
    duration: 1820,
    label: "SILENCE THREE",
    title: "The Lake Is Not a Gentle Place",
    subtitle: "A bowl of hills • A sudden, violent wind",
    ref: "Mark 4:36-37a",
    verse: "A great windstorm arose, and the waves were breaking into the boat.",
  },
  {
    id: "bailing",
    from: 4500,
    duration: 3900,
    label: "SILENCE FOUR",
    title: "The Water Was Over Their Ankles",
    subtitle: "Fishermen who know exactly when a boat will fail",
    ref: "Mark 4:37b",
    verse: "The waves beat into the boat, so that the boat was already filling.",
    keyPoint: "EXPERIENCE TELLS YOU WHEN YOU'RE SINKING",
  },
  {
    id: "asleep",
    from: 8400,
    duration: 3600,
    label: "SILENCE FIVE",
    title: "Asleep on a Cushion",
    subtitle: "The strangest detail in the whole story",
    ref: "Mark 4:38a",
    verse: "But he was in the stern, asleep on the cushion.",
    keyPoint: "THE SEA IS TRYING TO KILL THEM — AND HE SLEEPS",
  },
  {
    id: "wake",
    from: 12000,
    duration: 2700,
    label: "SILENCE SIX",
    title: "Teacher, Don't You Care That We Are Dying?",
    subtitle: "Never only a question — an accusation, still wet",
    ref: "Mark 4:38b",
    verse: "Teacher, do you not care that we are perishing?",
  },
  {
    id: "rebuke",
    from: 14700,
    duration: 3300,
    label: "SILENCE SEVEN",
    title: "Peace. Be Still. — Silence! Muzzled.",
    subtitle: "A man's words to a storm — and it obeyed",
    ref: "Mark 4:39",
    verse: "And he awoke and rebuked the wind and said to the sea, Peace! Be still! And the wind ceased.",
    keyPoint: "HE DOES NOT SHOUT FROM WHERE HE LAY — HE STANDS UP",
  },
  {
    id: "calm",
    from: 18000,
    duration: 2700,
    label: "SILENCE EIGHT",
    title: "And There Was a Great Calm",
    subtitle: "Not quiet. A great calm — the silence after nausea is holy",
    ref: "Mark 4:39b",
    verse: "The wind ceased, and there was a great calm.",
    keyPoint: "THE SILENCE AFTER THAT KIND OF NOISE IS HOLY",
  },
  {
    id: "fear",
    from: 20700,
    duration: 1820,
    label: "AFTER",
    title: "Why Are You So Afraid?",
    subtitle: "Safe first — then the question about faith",
    ref: "Mark 4:40",
    verse: "Why are you so afraid? Have you still no faith?",
    keyPoint: "THE FEAR WAS NEVER REALLY ABOUT THE WATER",
  },
  {
    id: "who",
    from: 22520,
    duration: 1500,
    label: "AFTER",
    title: "Who Then Is This?",
    subtitle: "First fear: drowning • Second fear: who is in the boat",
    ref: "Mark 4:41",
    verse: "Who then is this, that even the wind and the sea obey him?",
  },
  {
    id: "prayer",
    from: 24020,
    duration: 2002,
    label: "PRAYER",
    title: "He Is Still in the Boat",
    subtitle: "Not on shore watching — in the stern with us",
    ref: "Psalm 4:8",
    verse: "In peace I will both lie down and sleep; for you alone, O Lord, make me dwell in safety.",
  },
];

// B-roll inserts every 15-30s using real Drive images (matched to voice moment)
type Broll = { from: number; duration: number; src: string };
const BROLLS: Broll[] = [
  { from: 900, duration: 150, src: "pics/abbas/camp-crowd.jpg" }, // long day crowd
  { from: 2100, duration: 160, src: "pics/abbas/camp-teaching.jpg" }, // let us go over
  { from: 3400, duration: 170, src: "pics/abbas/camp-bowl.jpg" }, // bowl of hills
  { from: 5600, duration: 180, src: "pics/abbas/storm-bailing.jpg" }, // water over ankles
  { from: 7400, duration: 150, src: "pics/abbas/camp-boat.jpg" }, // fisherman knowledge
  { from: 9800, duration: 160, src: "pics/abbas/prayer-night.jpg" }, // asleep contrast
  { from: 11500, duration: 140, src: "pics/abbas/evangelism-outreach.jpg" }, // waking moment
  { from: 13800, duration: 160, src: "pics/abbas/camp-bowl.jpg" }, // wind build before rebuke
  { from: 16200, duration: 200, src: "pics/abbas/camp-calm.jpg" }, // rebuke hush
  { from: 19500, duration: 180, src: "pics/abbas/camp-calm.jpg" }, // great calm
  { from: 21400, duration: 150, src: "pics/abbas/prayer-night.jpg" }, // why afraid
  { from: 23400, duration: 160, src: "pics/abbas/camp-crowd.jpg" }, // who is this
];

const OutletCTA: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const enter = spring({ frame, fps: 30, config: { damping: 16, stiffness: 120 } });
  const y = interpolate(enter, [0, 1], [26, 0]);
  const pulse = (Math.sin(frame * 0.08) + 1) / 2;
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 110,
        opacity: enter,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.58)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 999,
          padding: "14px 28px",
          display: "flex",
          gap: 14,
          transform: `scale(${1 + pulse * 0.013})`,
        }}
      >
        <span
          style={{
            background: accent,
            color: "#0a0a14",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.08em",
          }}
        >
          SUBSCRIBE
        </span>
        <span style={{ color: "white", fontSize: 15, fontWeight: 600, opacity: 0.96 }}>
          Abba's Table — One story, one prayer at a time
        </span>
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        He is still in the boat • Mark 4:35-41
      </div>
    </AbsoluteFill>
  );
};

export const PeaceBeStillV6: React.FC<PeaceBeStillProps> = ({ sourceSrc, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const globalIn = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const globalOut = interpolate(frame, [durationInFrames - 24, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = Math.min(globalIn, globalOut);
  // subtle push-in on base footage during intense moments (8:10-10:00 rebuke) — mimic zoom cut
  const zoomBoost =
    frame >= 14700 && frame < 18000 ? interpolate(frame, [14700, 16200, 18000], [1, 1.04, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#06080f", opacity: op }}>
      {/* A-roll base with subtle zoom on climax */}
      <AbsoluteFill style={{ opacity: 0.96, transform: `scale(${zoomBoost})` }}>
        <OffthreadVideo
          src={staticFile(sourceSrc)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          volume={1}
          muted={false}
        />
      </AbsoluteFill>

      <WarmGrade>
        {/* Progress bar (thin, cinematic) */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.08)" }}>
          <div
            style={{
              width: `${(frame / durationInFrames) * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${accentColor}, #F4C430)`,
              boxShadow: `0 0 10px ${accentColor}88`,
            }}
          />
        </div>

        {/* Intro hook 0-540 (18s) like reference: title over B-roll */}
        <Sequence from={0} durationInFrames={540}>
          <IntroHook accent={accentColor} />
        </Sequence>

        {/* Dip-to-black wrapper + chapter cards + content */}
        {CHAPTERS.map((ch) => (
          <Sequence key={ch.id} from={ch.from} durationInFrames={ch.duration}>
            {/* dip-to-black: faint 12-frame fade before card */}
            <Sequence durationInFrames={75}>
              <ChapterCard label={ch.label} title={ch.title} accent={accentColor} />
            </Sequence>
            <Sequence from={75} durationInFrames={ch.duration - 75}>
              <AbsoluteFill
                style={{
                  opacity: interpolate(useCurrentFrame(), [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
                }}
              >
                <Sequence durationInFrames={190}>
                  <LowerThirdChapter label={ch.label} title={ch.title} subtitle={ch.subtitle} accent={accentColor} />
                </Sequence>
                <Sequence from={176} durationInFrames={155}>
                  <ScripturePill refText={ch.ref} accent={accentColor} />
                </Sequence>
                {ch.verse && (
                  <Sequence from={210} durationInFrames={190}>
                    <ScriptureOverlay verse={ch.verse} refText={ch.ref} accent={accentColor} />
                  </Sequence>
                )}
                {ch.keyPoint && (
                  <Sequence from={268} durationInFrames={138}>
                    <KeyPointBar text={ch.keyPoint} accent={accentColor} />
                  </Sequence>
                )}
              </AbsoluteFill>
            </Sequence>
          </Sequence>
        ))}

        {/* B-roll pattern interrupts every 15-30s (real Drive images) */}
        {BROLLS.map((b, i) => (
          <Sequence key={i} from={b.from} durationInFrames={b.duration}>
            <BRollOverlay src={b.src} durationInFrames={b.duration} />
            {/* B-roll caption to hide jump cut, voice continues underneath */}
          </Sequence>
        ))}

        {/* Outro CTA */}
        <Sequence from={durationInFrames - 360} durationInFrames={360}>
          <OutletCTA accent={accentColor} />
        </Sequence>
      </WarmGrade>
    </AbsoluteFill>
  );
};
