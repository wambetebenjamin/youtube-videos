import React from "react";
import {
  AbsoluteFill,
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
 * Peace, Be Still — v6 Cinematic Edit
 * Continues v5 (14:27, 8 silences) and applies full reference style:
 * "6 Signs God Is Moving You Into a New Season"
 *
 * Specs: 1920x1080 30fps, full duration 26022 frames (14:27.4)
 * Uses real footage from public/raw-footage/ as A-roll
 * Overlays: warm grade, grain, vignette, chapter cards, lower thirds, scripture overlays, key points
 */

export const peaceBeStillSchema = z.object({
  sourceSrc: z.string(), // staticFile path to v5 mp4
  accentColor: zColor(),
  title: z.string(),
});

export type PeaceBeStillProps = z.infer<typeof peaceBeStillSchema>;

export const defaultPeaceBeStillProps: PeaceBeStillProps = {
  sourceSrc: "raw-footage/Peace, Be Still - v5 - eight silences (Mark 4) - 14-27.mp4",
  accentColor: "#D4AF37",
  title: "Peace, Be Still",
};

// --- Reuse WarmGrade + film grain from AbbasStories but enhanced for real footage ---
const WarmGrade: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ filter: "contrast(0.94) brightness(1.02) saturate(0.92) sepia(0.05) hue-rotate(-4deg)" }}>
    {children}
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 65% 35%, rgba(244,196,48,0.12) 0%, transparent 55%), radial-gradient(ellipse at 20% 85%, rgba(212,175,55,0.07) 0%, transparent 45%)",
        mixBlendMode: "soft-light" as any,
      }}
    />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(26,26,26,0) 0%, rgba(10,10,14,0.38) 100%)", opacity: 0.55 }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.48) 100%)" }} />
    {/* grain */}
    <AbsoluteFill
      style={{
        opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        mixBlendMode: "overlay" as any,
      }}
    />
  </AbsoluteFill>
);

// Lower third chapter — same spec as master prompt
const LowerThirdChapter: React.FC<{ label: string; title: string; subtitle: string; accent: string }> = ({ label, title, subtitle, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const slideIn = spring({ frame, fps, config: { damping: 18, stiffness: 160, mass: 0.7 } });
  const slideOut = interpolate(frame, [durationInFrames - 9, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const vis = Math.min(slideIn, slideOut);
  const tx = interpolate(vis, [0, 1], [-60, 0]);
  return (
    <div style={{ position: "absolute", left: 100, bottom: 100, opacity: vis, transform: `translateX(${tx}px)`, maxWidth: 920, display: "flex" }}>
      <div style={{ backgroundColor: accent, width: 4, borderRadius: 999 }} />
      <div
        style={{
          background: "rgba(0,0,0,0.70)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderLeft: "none",
          borderTopRightRadius: 14,
          borderBottomRightRadius: 14,
          padding: "14px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span style={{ color: accent, letterSpacing: "0.18em", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
        <span style={{ color: "white", fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{title}</span>
        <span style={{ color: "#CCCCCC", fontSize: 13, fontWeight: 500 }}>{subtitle}</span>
      </div>
    </div>
  );
};

const ScripturePill: React.FC<{ refText: string; accent: string }> = ({ refText, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(fadeIn, fadeOut);
  return (
    <div style={{ position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)", opacity: op }}>
      <div style={{ background: "rgba(0,0,0,0.62)", borderRadius: 999, border: "1px solid rgba(212,175,55,0.32)", padding: "8px 22px", display: "inline-flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: accent, fontSize: 12 }}>✦</span>
        <span style={{ color: accent, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 16, fontWeight: 700 }}>{refText}</span>
      </div>
    </div>
  );
};

const ScriptureOverlay: React.FC<{ verse: string; refText: string; accent: string }> = ({ verse, refText, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(fade, fadeOut);
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80, opacity: op }}>
      <div style={{ background: "rgba(0,0,0,0.60)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.10)", padding: "30px 36px", maxWidth: 1000, textAlign: "center", backdropFilter: "blur(10px)" }}>
        <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 24, lineHeight: 1.45, color: "white" }}>“{verse}”</p>
        <div style={{ marginTop: 14, display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: 28, height: 1, background: accent }} />
          <span style={{ color: accent, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, fontWeight: 700 }}>— {refText}</span>
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
  const exit = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(enter, [0, 1], [30, 0]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0e0e12 0%, #1a1a1f 50%, #0a0a0d 100%)", opacity: exit, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: enter, transform: `translateY(${y}px)`, textAlign: "center", maxWidth: 1100, padding: "0 60px" }}>
        <span style={{ color: accent, border: `1px solid ${accent}55`, padding: "6px 18px", borderRadius: 999, fontSize: 12, letterSpacing: "0.22em", background: "rgba(212,175,55,0.08)", fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 80, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, margin: "16px auto", opacity: 0.9 }} />
        <h1 style={{ fontSize: 48, fontWeight: 900, color: "white", lineHeight: 0.95, letterSpacing: "-0.02em", textTransform: "uppercase" }}>{title}</h1>
        <div style={{ width: 80, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, margin: "16px auto", opacity: 0.5 }} />
      </div>
    </AbsoluteFill>
  );
};

const KeyPointBar: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = spring({ frame, fps: 30, config: { damping: 16, stiffness: 120 } });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(1, exit);
  return (
    <div style={{ position: "absolute", bottom: 128, left: 96, right: 96, opacity: op, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "linear-gradient(90deg, #0f0f12 0%, #1c1c20 50%, #0f0f12 100%)", borderTop: `2px solid ${accent}`, padding: "12px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: 2, width: `${progress * 100}%`, background: accent }} />
        <p style={{ color: "white", fontSize: 16, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{text}</p>
      </div>
    </div>
  );
};

// 8 silences / chapters mapped from extracted transcript (approx times, refined from v5 duration 867s)
type ChapterDef = {
  id: string;
  from: number; // frames at 30fps
  duration: number;
  label: string;
  title: string;
  subtitle: string;
  ref: string;
  verse?: string;
  keyPoint?: string;
};

// Times estimated from 141 subtitle lines ~6.15s each, anchored to narrative beats observed in thumbs
const CHAPTERS: ChapterDef[] = [
  {
    id: "intro",
    from: 0,
    duration: 1500, // 0:00-0:50 — long day, teaching from boat, parables
    label: "CHAPTER ONE",
    title: "A Long Day by the Water",
    subtitle: "All afternoon He taught from a boat • Mark 4:1-34",
    ref: "Mark 4:1-2",
    verse: "Again he began to teach beside the sea. And a very large crowd gathered about him.",
  },
  {
    id: "crossing",
    from: 1500,
    duration: 1200, // 0:50-1:30 — Let us go over to the other side
    label: "CHAPTER TWO",
    title: "Let Us Go Over to the Other Side",
    subtitle: "Not shelter, not morning — forward",
    ref: "Mark 4:35",
    verse: "On that day, when evening had come, he said to them, Let us go across to the other side.",
    keyPoint: "FAITH MOVES FORWARD — EVEN AT EVENING",
  },
  {
    id: "bowl",
    from: 2700,
    duration: 1800, // 1:30-2:30 — lake in bowl of hills, other boats
    label: "CHAPTER THREE",
    title: "The Lake Is Not a Gentle Place",
    subtitle: "A bowl of hills • A sudden storm",
    ref: "Mark 4:36-37a",
    verse: "And a great windstorm arose, and the waves were breaking into the boat.",
  },
  {
    id: "bailing",
    from: 4500,
    duration: 3900, // 2:30-4:40 — bailing, fishermen know
    label: "CHAPTER FOUR",
    title: "The Water Was Over Their Ankles",
    subtitle: "Fishermen who know when a boat will fail",
    ref: "Mark 4:37b",
    verse: "The waves beat into the boat, so that the boat was already filling.",
    keyPoint: "EXPERIENCE TELLS YOU WHEN YOU'RE SINKING",
  },
  {
    id: "asleep",
    from: 8400,
    duration: 3600, // 4:40-6:40 — He was in stern asleep
    label: "CHAPTER FIVE",
    title: "Asleep on a Cushion",
    subtitle: "The strangest detail in the story",
    ref: "Mark 4:38a",
    verse: "But he was in the stern, asleep on the cushion.",
    keyPoint: "THE SEA IS TRYING TO KILL THEM — AND HE SLEEPS",
  },
  {
    id: "wake",
    from: 12000,
    duration: 2700, // 6:40-8:10 — Teacher don't you care
    label: "CHAPTER SIX",
    title: "Teacher, Don't You Care That We Are Dying?",
    subtitle: "Never only a question — always an accusation",
    ref: "Mark 4:38b",
    verse: "Teacher, do you not care that we are perishing?",
  },
  {
    id: "rebuke",
    from: 14700,
    duration: 3300, // 8:10-10:00 — Peace Be still, Silence muzzle it
    label: "CHAPTER SEVEN",
    title: "Peace. Be Still. — Silence. Muzzle It.",
    subtitle: "Words a man uses to tell a storm to stop",
    ref: "Mark 4:39",
    verse: "And he awoke and rebuked the wind and said to the sea, Peace! Be still! And the wind ceased.",
    keyPoint: "HE DOES NOT SHOUT FROM WHERE HE LAY — HE STANDS UP",
  },
  {
    id: "calm",
    from: 18000,
    duration: 2700, // 10:00-11:30 — great calm, silence after noise
    label: "CHAPTER EIGHT",
    title: "And There Was a Great Calm",
    subtitle: "Not quiet — a great calm",
    ref: "Mark 4:39b",
    verse: "The wind ceased, and there was a great calm.",
    keyPoint: "THE SILENCE AFTER THAT KIND OF NAUSEA IS HOLY",
  },
  {
    id: "fear",
    from: 20700,
    duration: 1800, // 11:30-12:30 — Why are you so afraid / How is it you have no faith
    label: "CHAPTER NINE",
    title: "Why Are You So Afraid?",
    subtitle: "He gets them safe first — then asks about fear",
    ref: "Mark 4:40",
    verse: "He said to them, Why are you so afraid? Have you still no faith?",
    keyPoint: "THE FEAR WAS NEVER REALLY ABOUT THE WATER",
  },
  {
    id: "who",
    from: 22500,
    duration: 1500, // 12:30-13:20 — Who then is this?
    label: "CHAPTER TEN",
    title: "Who Then Is This?",
    subtitle: "First fear: drowning • Second fear: who is in the boat",
    ref: "Mark 4:41",
    verse: "Who then is this, that even the wind and the sea obey him?",
  },
  {
    id: "prayer",
    from: 24000,
    duration: 1850, // 13:20-14:22 — Father prayer, He is still in boat
    label: "PRAYER",
    title: "He Is Still in the Boat",
    subtitle: "Not on shore watching — in the stern with us",
    ref: "Psalm 4:8",
    verse: "In peace I will both lie down and sleep; for you alone, O Lord, make me dwell in safety.",
  },
];

export const PeaceBeStillV6: React.FC<PeaceBeStillProps> = ({ sourceSrc, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const globalIn = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const globalOut = interpolate(frame, [durationInFrames - 24, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(globalIn, globalOut);

  return (
    <AbsoluteFill style={{ backgroundColor: "#06080f", opacity: op }}>
      {/* Real footage A-roll */}
      <AbsoluteFill style={{ opacity: 0.96 }}>
        <OffthreadVideo
          src={staticFile(sourceSrc)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          volume={1}
          muted={false}
        />
      </AbsoluteFill>

      <WarmGrade>
        {/* Progress bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.08)" }}>
          <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${accentColor}, #F4C430)`, boxShadow: `0 0 10px ${accentColor}88` }} />
        </div>

        {/* Chapters — title card then content */}
        {CHAPTERS.map((ch) => (
          <Sequence key={ch.id} from={ch.from} durationInFrames={ch.duration}>
            {/* Title card 2.5s */}
            <Sequence durationInFrames={75}>
              <ChapterCard label={ch.label} title={ch.title} accent={accentColor} />
            </Sequence>
            {/* Content after card */}
            <Sequence from={75} durationInFrames={ch.duration - 75}>
              <AbsoluteFill style={{ opacity: interpolate(useCurrentFrame(), [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
                <Sequence durationInFrames={200}>
                  <LowerThirdChapter label={ch.label} title={ch.title} subtitle={ch.subtitle} accent={accentColor} />
                </Sequence>
                {ch.ref && (
                  <Sequence from={180} durationInFrames={160}>
                    <ScripturePill refText={ch.ref} accent={accentColor} />
                  </Sequence>
                )}
                {ch.verse && (
                  <Sequence from={210} durationInFrames={200}>
                    <ScriptureOverlay verse={ch.verse} refText={ch.ref} accent={accentColor} />
                  </Sequence>
                )}
                {ch.keyPoint && (
                  <Sequence from={260} durationInFrames={140}>
                    <KeyPointBar text={ch.keyPoint} accent={accentColor} />
                  </Sequence>
                )}
              </AbsoluteFill>
            </Sequence>
          </Sequence>
        ))}

        {/* Outro CTA at end */}
        <Sequence from={durationInFrames - 360} durationInFrames={360}>
          <OutletCTA accent={accentColor} />
        </Sequence>
      </WarmGrade>
    </AbsoluteFill>
  );
};

const OutletCTA: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const enter = spring({ frame, fps: 30, config: { damping: 16, stiffness: 120 } });
  const y = interpolate(enter, [0, 1], [30, 0]);
  const pulse = (Math.sin(frame * 0.08) + 1) / 2;
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 110, opacity: enter, transform: `translateY(${y}px)` }}>
      <div style={{ background: "rgba(0,0,0,0.58)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, padding: "14px 28px", backdropFilter: "blur(10px)", display: "flex", gap: 14, transform: `scale(${1 + pulse * 0.015})` }}>
        <span style={{ background: accent, color: "#0a0a14", borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 900, letterSpacing: "0.08em" }}>SUBSCRIBE</span>
        <span style={{ color: "white", fontSize: 16, fontWeight: 600, opacity: 0.95 }}>Abba's Table — One story, one prayer at a time</span>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 600 }}>He is still in the boat • Mark 4:35-41</div>
    </AbsoluteFill>
  );
};
