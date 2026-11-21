import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

/* ============================================================
   Abbas Stories — Cinematic Faith/Motivational Edit
   Replicates reference video style:
   "6 Signs God Is Moving You Into a New Season"
   ============================================================ */

export const abbasStoriesSchema = z.object({
  accentColor: zColor(),
  title: z.string(),
  subtitle: z.string(),
  chapterLabelColor: zColor(),
});

export type AbbasStoriesProps = z.infer<typeof abbasStoriesSchema>;

export const defaultAbbasStoriesProps: AbbasStoriesProps = {
  accentColor: "#D4AF37",
  title: "2 TIMELESS LAWS FOR A BETTER LIFE",
  subtitle: "The Law of Use & The Law of Sowing and Reaping",
  chapterLabelColor: "#D4AF37",
};

// ── Helpers ──────────────────────────────────────────────────

// Grain texture via CSS (5-10% opacity simulation)
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const jitter = (frame % 3) * 0.5;
  return (
    <AbsoluteFill
      style={{
        opacity: 0.07 + jitter * 0.01,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        mixBlendMode: "overlay" as any,
        pointerEvents: "none",
      }}
    />
  );
};

const WarmGrade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // cinematic warm grade: amber/gold highlights, deep shadows, desaturated blues, raised blacks
  return (
    <AbsoluteFill
      style={{
        filter:
          "contrast(0.94) brightness(1.02) saturate(0.92) sepia(0.08) hue-rotate(-6deg)",
      }}
    >
      {children}
      {/* Warm highlight wash */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 65% 35%, rgba(244,196,48,0.14) 0%, transparent 55%), radial-gradient(ellipse at 20% 85%, rgba(212,175,55,0.09) 0%, transparent 45%)",
          mixBlendMode: "soft-light" as any,
        }}
      />
      {/* Matte lift blacks */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(26,26,26,0) 0%, rgba(10,10,14,0.45) 100%)",
          opacity: 0.6,
        }}
      />
      {/* Vignette for text readability */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <FilmGrain />
    </AbsoluteFill>
  );
};

// B-Roll backdrop — procedural cinematic imagery (category-matched)
// In GPU environment this would be swapped for FreeVideo MiniMax H3 clips
type BRollCategory =
  | "wilderness"
  | "desert"
  | "scrolls"
  | "stone"
  | "contemplation"
  | "door"
  | "light"
  | "seed"
  | "harvest";

const BRollVisual: React.FC<{
  category: BRollCategory;
  accentColor: string;
  durationInFrames: number;
}> = ({ category, accentColor, durationInFrames }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panX = interpolate(frame, [0, durationInFrames], [0, -22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panY = interpolate(frame, [0, durationInFrames], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Each category gets a symbolic gradient + texture
  const palettes: Record<BRollCategory, React.CSSProperties> = {
    wilderness: {
      background:
        "radial-gradient(ellipse at 30% 20%, #3a4a2e 0%, #1e2e1a 30%, #0d1a0f 70%), linear-gradient(180deg, #2a3a1e 0%, #0a1208 100%)",
    },
    desert: {
      background:
        "linear-gradient(180deg, #c9a86a 0%, #a67c3d 25%, #7a4a1f 55%, #2c1810 100%), radial-gradient(ellipse at 80% 90%, #e8c98a 0%, transparent 40%)",
    },
    scrolls: {
      background:
        "linear-gradient(90deg, #e8dcc0 0%, #d4c5a0 20%, #b8a07a 50%, #8a6a3a 100%), radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.12) 0%, transparent 70%)",
    },
    stone: {
      background:
        "linear-gradient(180deg, #6a6a6a 0%, #4a4a4a 30%, #2a2a2a 70%, #1a1a1a 100%), radial-gradient(ellipse at 40% 30%, #8a8a7a 0%, transparent 35%)",
    },
    contemplation: {
      background:
        "radial-gradient(ellipse at 35% 40%, #2a2a3a 0%, #1a1a2e 40%, #0d0d14 100%), linear-gradient(180deg, #1a1a2a 0%, #0a0a14 100%)",
    },
    door: {
      background:
        "linear-gradient(90deg, #1a1008 0%, #3d2810 20%, #5a3a14 50%, #1a1008 100%), radial-gradient(ellipse at 50% 10%, rgba(244,196,48,0.25) 0%, transparent 50%)",
    },
    light: {
      background:
        "radial-gradient(ellipse at 50% 15%, #fff8dc 0%, #ffec8b 10%, #d4af37 25%, #1a1a1a 70%), linear-gradient(180deg, #2a2410 0%, #0a0a0a 100%)",
    },
    seed: {
      background:
        "radial-gradient(ellipse at 50% 80%, #2a3a1a 0%, #1a2a0a 30%, #0d1205 70%), linear-gradient(180deg, #1a2a0f 0%, #0a0f04 100%)",
    },
    harvest: {
      background:
        "linear-gradient(180deg, #e8c878 0%, #d4a843 30%, #8a6a1a 60%, #2a1e05 100%), radial-gradient(ellipse at 70% 20%, #fff2a8 0%, transparent 30%)",
    },
  };

  const icons: Record<BRollCategory, string> = {
    wilderness: "⛰",
    desert: "◐",
    scrolls: "▥",
    stone: "⬢",
    contemplation: "◯",
    door: "▭",
    light: "✦",
    seed: "⬥",
    harvest: "⬔",
  };

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0a0a0f" }}>
      <div
        style={{
          ...palettes[category],
          width: "100%",
          height: "100%",
          transform: `scale(${scale}) translate(${panX}px, ${panY}px)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: 420,
            opacity: 0.045,
            color: accentColor,
            fontWeight: 100,
            transform: `scale(${1 + frame * 0.00015})`,
            userSelect: "none",
          }}
        >
          {icons[category]}
        </div>
      </div>
      {/* B-roll dark vignette for text readability */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 100%), radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {/* Category label for QA (small, top-right) */}
      <div
        style={{
          position: "absolute",
          top: 28,
          right: 36,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
          fontFamily: "sans-serif",
        }}
      >
        B-ROLL • {category}
      </div>
    </AbsoluteFill>
  );
};

// ── Lower Thirds ─────────────────────────────────────────────

const LowerThirdChapter: React.FC<{
  signLabel: string;
  title: string;
  subtitle: string;
  accentColor: string;
  fps: number;
}> = ({ signLabel, title, subtitle, accentColor, fps }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Slide-in 300ms (9 frames at 30fps), hold, slide-out 300ms
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 160, mass: 0.7 },
  });
  const slideOut = interpolate(
    frame,
    [durationInFrames - 9, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const visibility = Math.min(slideIn, slideOut);
  const translateX = interpolate(visibility, [0, 1], [-60, 0]);
  const opacity = visibility;

  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        bottom: 100,
        opacity,
        transform: `translateX(${translateX}px)`,
        maxWidth: 980,
      }}
      className="flex"
    >
      <div
        style={{ backgroundColor: accentColor }}
        className="w-[4px] shrink-0 rounded-full"
      />
      <div
        style={{
          background: "rgba(0,0,0,0.70)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderLeft: "none",
          borderTopRightRadius: 14,
          borderBottomRightRadius: 14,
        }}
        className="px-7 py-4 flex flex-col gap-1"
      >
        <span
          style={{
            color: accentColor,
            letterSpacing: "0.18em",
            fontSize: 13,
          }}
          className="font-black uppercase"
        >
          {signLabel}
        </span>
        <span className="text-[22px] font-bold leading-none tracking-tight text-white">
          {title}
        </span>
        <span className="text-[14px] font-medium leading-tight text-[#CCCCCC]">
          {subtitle}
        </span>
      </div>
    </div>
  );
};

const ScriptureLowerThird: React.FC<{
  reference: string;
  accentColor: string;
  align?: "center" | "right";
}> = ({ reference, accentColor, align = "center" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 6, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 100,
        left: align === "center" ? "50%" : "auto",
        right: align === "right" ? 100 : "auto",
        transform: align === "center" ? "translateX(-50%)" : "none",
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          borderRadius: 999,
          border: "1px solid rgba(212,175,55,0.30)",
          padding: "8px 22px",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ color: accentColor, fontSize: 13 }}>✦</span>
        <span
          style={{
            color: accentColor,
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {reference}
        </span>
      </div>
    </div>
  );
};

const KeyPointLowerThird: React.FC<{
  text: string;
  accentColor: string;
}> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Mask reveal: wipe across
  const progress = spring({
    frame,
    fps: 30,
    config: { damping: 16, stiffness: 120 },
  });
  const exit = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(1, exit);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 128,
        left: 96,
        right: 96,
        opacity,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: `linear-gradient(90deg, #0f0f12 0%, #1c1c20 50%, #0f0f12 100%)`,
          borderTop: `2px solid ${accentColor}`,
          borderBottom: `1px solid rgba(255,255,255,0.10)`,
          padding: "14px 36px",
          textAlign: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Gold accent line top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 2,
            width: `${progress * 100}%`,
            background: accentColor,
          }}
        />
        <p
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            opacity: progress,
            transform: `translateY(${interpolate(progress, [0, 1], [12, 0])}px)`,
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
};

// ── Text Overlays ─────────────────────────────────────────────

const ChapterTitleCard: React.FC<{
  numberLabel: string;
  title: string;
  accentColor: string;
}> = ({ numberLabel, title, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const exit = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const translateY = interpolate(enter, [0, 1], [30, 0]);

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #0e0e12 0%, #1a1a1f 50%, #0a0a0d 100%)",
        opacity: exit,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* subtle texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, white 2px, white 3px)`,
        }}
      />
      <div
        style={{
          opacity: enter,
          transform: `translateY(${translateY}px)`,
          textAlign: "center",
          maxWidth: 1100,
          padding: "0 60px",
        }}
      >
        <div className="flex flex-col items-center gap-6">
          <span
            style={{
              color: accentColor,
              border: `1px solid ${accentColor}55`,
              padding: "6px 18px",
              borderRadius: 999,
              fontSize: 13,
              letterSpacing: "0.22em",
              background: "rgba(212,175,55,0.08)",
            }}
            className="font-black uppercase"
          >
            {numberLabel}
          </span>
          <div
            style={{
              width: 80,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              opacity: 0.9,
            }}
          />
          <h1 className="text-[56px] font-black leading-[0.95] tracking-tight text-white uppercase">
            {title}
          </h1>
          <div
            style={{
              width: 80,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              opacity: 0.5,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ScriptureOverlay: React.FC<{
  verse: string;
  reference: string;
  accentColor: string;
}> = ({ verse, reference, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fade, fadeOut);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.62)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.10)",
          padding: "36px 44px",
          maxWidth: 1100,
          textAlign: "center",
          backdropFilter: "blur(10px)",
        }}
      >
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: 26,
            lineHeight: 1.45,
            color: "white",
            fontWeight: 400,
          }}
        >
          “{verse}”
        </p>
        <div
          style={{
            marginTop: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 1,
              background: accentColor,
              opacity: 0.8,
            }}
          />
          <span
            style={{
              color: accentColor,
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.06em",
            }}
          >
            — {reference}
          </span>
          <div
            style={{
              width: 28,
              height: 1,
              background: accentColor,
              opacity: 0.8,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const QuoteOverlay: React.FC<{
  quote: string;
  accentColor: string;
}> = ({ quote, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 14, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fade, fadeOut);
  // typewriter chars
  const charsToShow = Math.floor(interpolate(frame, [0, 50], [0, quote.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));
  const visible = quote.slice(0, charsToShow);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 120px",
        opacity,
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, rgba(10,10,14,0.55) 0%, rgba(0,0,0,0.55) 100%)",
          backdropFilter: "blur(8px)",
          borderLeft: `3px solid ${accentColor}`,
          padding: "28px 36px",
          maxWidth: 1000,
        }}
      >
        <p
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 30,
            lineHeight: 1.35,
            color: "white",
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          “{visible}
          <span
            style={{
              opacity: frame % 16 < 8 ? 1 : 0,
              color: accentColor,
            }}
          >
            ▍
          </span>
          ”
        </p>
      </div>
    </AbsoluteFill>
  );
};

// ── Captions (word-highlight, synced to voice) ────────────────
const WordCaptions: React.FC<{
  text: string;
  accentColor: string;
}> = ({ text, accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  const framesPerWord = Math.max(4, Math.floor(durationInFrames / Math.max(1, words.length)));
  const activeIndex = Math.min(words.length - 1, Math.floor(frame / framesPerWord));
  const pop = spring({
    frame: frame % framesPerWord,
    fps: 30,
    config: { damping: 14, stiffness: 220 },
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 168,
        left: 96,
        right: 96,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(2,6,23,0.78)",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 18,
          padding: "14px 18px",
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 8px",
          justifyContent: "center",
          maxWidth: 1100,
          backdropFilter: "blur(10px)",
        }}
      >
        {words.map((w, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          const scale = isActive ? 1 + 0.08 * pop : 1;
          return (
            <span
              key={`${w}-${i}`}
              style={{
                transform: `scale(${scale})`,
                backgroundColor: isActive ? accentColor : "transparent",
                color: isActive ? "#0a0a14" : isPast ? "#f8fafc" : "rgba(226,232,240,0.72)",
                borderRadius: 8,
                padding: "2px 7px",
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1.2,
                display: "inline-block",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ── Chapter definitions (condensed from transcript, timed for 120s) ──
type Chapter = {
  id: string;
  from: number;
  duration: number;
  numberLabel: string;
  title: string;
  subtitle: string;
  caption: string;
  category: BRollCategory;
  scripture?: { ref: string; verse: string };
  keyPoint?: string;
  quote?: string;
  // optional overlay timing inside chapter (frames relative to chapter start)
  scriptureAt?: number;
  keyPointAt?: number;
  quoteAt?: number;
};

const CHAPTERS: Chapter[] = [
  {
    id: "intro",
    from: 0,
    duration: 300, // 10s
    numberLabel: "INTRO",
    title: "2 Timeless Laws for a Better Life",
    subtitle: "The Law of Use & The Law of Sowing and Reaping",
    caption:
      "Mr. Shoaff taught me the Bible is a book of ideas and success equations for the better life",
    category: "light",
    scripture: {
      ref: "Matthew 25:14-30",
      verse: "To everyone who has, more will be given, and he will have abundance.",
    },
    scriptureAt: 150,
  },
  {
    id: "law1",
    from: 300,
    duration: 420, // 14s
    numberLabel: "LAW 1",
    title: "The Law of Use",
    subtitle: "Whatever you don't use, you lose",
    caption:
      "Whatever you don't use you lose. Lack of use causes loss. A talent unused is lost",
    category: "desert",
    keyPoint: "LACK OF USE CAUSES LOSS — TODAY UNUSED IS LOST",
    keyPointAt: 180,
    scripture: {
      ref: "Matthew 25:29",
      verse: "For to everyone who has will more be given, and from him who has not, even what he has will be taken away.",
    },
    scriptureAt: 300,
  },
  {
    id: "parable",
    from: 720,
    duration: 450, // 15s
    numberLabel: "THE PARABLE",
    title: "The Master and the Three Servants",
    subtitle: "Five talents • Two talents • One talent",
    caption:
      "He gave five talents to one, two to another, and one to the last. Go see what you can do while I'm gone",
    category: "stone",
    quote: "I poured it on and doubled my talents from five to ten",
    quoteAt: 180,
    scripture: {
      ref: "Matthew 25:20",
      verse: "Master, you delivered to me five talents; look, I have gained five more talents besides them.",
    },
    scriptureAt: 360,
  },
  {
    id: "buried",
    from: 1170,
    duration: 330, // 11s
    numberLabel: "THE WARNING",
    title: "The Buried Talent",
    subtitle: "Carefully wrapped and hidden — and lost",
    caption:
      "I took the talent you gave me and carefully wrapped it and buried it so nobody would steal it",
    category: "contemplation",
    keyPoint: "YOU LOSE AUTOMATICALLY WHEN YOU QUIT",
    keyPointAt: 160,
  },
  {
    id: "takeaway1",
    from: 1500,
    duration: 330, // 11s
    numberLabel: "KEY INSIGHT",
    title: "Take a New Inventory",
    subtitle: "Ambition • Vitality • Faith — use it or lose it",
    caption:
      "Take a new inventory of yourself. Make sure all your talent and ability and faith is being used",
    category: "wilderness",
    quote: "Whatever you do not employ, you forfeit. It's a law",
    quoteAt: 120,
  },
  {
    id: "law2",
    from: 1830,
    duration: 420, // 14s
    numberLabel: "LAW 2",
    title: "The Law of Sowing and Reaping",
    subtitle: "Whatever you reap is what you've sown",
    caption:
      "I was confused about what was causing my poor reaping. Then I learned: if you don't like the crop, look in the mirror",
    category: "seed",
    scripture: {
      ref: "Galatians 6:7",
      verse: "Do not be deceived, God is not mocked; for whatever a man sows, that he will also reap.",
    },
    scriptureAt: 220,
  },
  {
    id: "keys",
    from: 2250,
    duration: 630, // 21s — 7 keys fast-cut
    numberLabel: "THE 7 KEYS",
    title: "Seven Keys to Sowing and Reaping",
    subtitle: "Negative • Positive • More • Many Ways • Anyone • You Could Lose • You Must Sow",
    caption:
      "You don't reap what you sow, you reap much more than you sow. And anyone can — the question is will you",
    category: "harvest",
    keyPoint: "YOU ALWAYS REAP MUCH MORE THAN YOU SOW",
    keyPointAt: 140,
    quote: "Anyone can fix the next 10 years. The question is where will you be",
    quoteAt: 380,
  },
  {
    id: "closing",
    from: 2880,
    duration: 420, // 14s
    numberLabel: "CLOSING",
    title: "Don't Try to Beat the Law",
    subtitle: "Get some sowing going — don't let the springs pass",
    caption:
      "Don't try to beat it. You might as well try to sit on the sun. Life is so short. Don't let the springs pass",
    category: "light",
    scripture: {
      ref: "Ecclesiastes 11:4",
      verse: "He who observes the wind will not sow, and he who regards the clouds will not reap.",
    },
    scriptureAt: 180,
    keyPoint: "WHATEVER YOU'RE GOING TO DO — GET AT IT NOW",
    keyPointAt: 300,
  },
];

// ── Main Component ───────────────────────────────────────────

export const AbbasStories: React.FC<AbbasStoriesProps> = ({
  accentColor,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Global fade in/out
  const globalIn = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const globalOut = interpolate(
    frame,
    [durationInFrames - 24, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const globalOpacity = Math.min(globalIn, globalOut);

  // Intro title hero (first 90 frames = 3s) with cinematic hook
  const introProgress = spring({
    frame: Math.min(frame, 90),
    fps,
    config: { damping: 18, stiffness: 100 },
  });
  const introY = interpolate(introProgress, [0, 1], [36, 0]);

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#06080f", opacity: globalOpacity }}
      className="font-sans antialiased"
    >
      {/* Global warm grade */}
      <WarmGrade>
        {/* Background BRolls per chapter — cross-faded */}
        {CHAPTERS.map((ch) => {
          const isActive = frame >= ch.from && frame < ch.from + ch.duration;
          if (!isActive) return null;
          // cross-dissolve 10 frames
          const localFrame = frame - ch.from;
          const fadeIn = interpolate(localFrame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fadeOut = interpolate(
            localFrame,
            [ch.duration - 10, ch.duration],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const opacity = Math.min(fadeIn, fadeOut);
          return (
            <div key={ch.id} style={{ opacity, position: "absolute", inset: 0 }}>
              <BRollVisual
                category={ch.category}
                accentColor={accentColor}
                durationInFrames={ch.duration}
              />
            </div>
          );
        })}

        {/* Intro hero overlay (0-300) */}
        {frame < 360 && (
          <Sequence from={0} durationInFrames={360}>
            <AbsoluteFill
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 80px",
                textAlign: "center",
              }}
            >
              {/* Hook badge */}
              <div
                style={{
                  opacity: introProgress,
                  transform: `translateY(${introY}px)`,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 999,
                  padding: "8px 20px",
                  backdropFilter: "blur(8px)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: accentColor,
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    color: "rgba(255,255,255,0.90)",
                    textTransform: "uppercase",
                  }}
                >
                  Abbas Stories • Faith & Wisdom Series
                </span>
              </div>

              <h1
                style={{
                  opacity: introProgress,
                  transform: `translateY(${introY}px)`,
                  marginTop: 22,
                  fontSize: 64,
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: "-0.02em",
                  color: "white",
                  maxWidth: 1100,
                  textShadow: "0 6px 30px rgba(0,0,0,0.55)",
                }}
              >
                {title}
              </h1>
              <p
                style={{
                  opacity: interpolate(introProgress, [0, 1], [0, 1]),
                  transform: `translateY(${interpolate(introProgress, [0, 1], [24, 0])}px)`,
                  marginTop: 16,
                  fontSize: 20,
                  fontWeight: 500,
                  color: "rgba(203,213,225,0.95)",
                  maxWidth: 800,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
              {/* gold line */}
              <div
                style={{
                  marginTop: 28,
                  width: interpolate(introProgress, [0, 1], [0, 120]),
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                  opacity: introProgress,
                }}
              />
              {/* Speaker */}
              <div
                style={{
                  opacity: introProgress,
                  marginTop: 20,
                  fontSize: 14,
                  letterSpacing: "0.14em",
                  color: "rgba(255,255,255,0.60)",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Inspired by Jim Rohn • Parable of the Talents
              </div>
            </AbsoluteFill>
          </Sequence>
        )}

        {/* Chapters — title card + lower thirds + captions */}
        {CHAPTERS.map((ch) => (
          <Sequence
            key={ch.id}
            from={ch.from}
            durationInFrames={ch.duration}
          >
            {/* Chapter title card — first 75 frames (2.5s) of each chapter after intro */}
            {ch.from > 0 && (
              <Sequence durationInFrames={75}>
                <ChapterTitleCard
                  numberLabel={ch.numberLabel}
                  title={ch.title}
                  accentColor={accentColor}
                />
              </Sequence>
            )}

            {/* Content after title card */}
            <Sequence from={75} durationInFrames={ch.duration - 75}>
              {/* Dip-to-black transition is simulated by title card fade; content fades in */}
              <AbsoluteFill
                style={{
                  opacity: interpolate(
                    useCurrentFrame(),
                    [0, 10],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  ),
                }}
              >
                {/* Lower third chapter ID (5-8s hold as per spec) */}
                <Sequence durationInFrames={Math.min(220, ch.duration - 75 - 20)}>
                  <LowerThirdChapter
                    signLabel={ch.numberLabel}
                    title={ch.title}
                    subtitle={ch.subtitle}
                    accentColor={accentColor}
                    fps={fps}
                  />
                </Sequence>

                {/* Scripture reference lower third (if set) */}
                {ch.scripture && ch.scriptureAt !== undefined && (
                  <Sequence
                    from={ch.scriptureAt - 75}
                    durationInFrames={160}
                  >
                    <ScriptureLowerThird
                      reference={ch.scripture.ref}
                      accentColor={accentColor}
                    />
                  </Sequence>
                )}

                {/* Scripture full overlay (a bit later, longer hold 8-12s) */}
                {ch.scripture && ch.scriptureAt !== undefined && (
                  <Sequence
                    from={ch.scriptureAt - 75 + 30}
                    durationInFrames={180}
                  >
                    <ScriptureOverlay
                      verse={ch.scripture.verse}
                      reference={ch.scripture.ref}
                      accentColor={accentColor}
                    />
                  </Sequence>
                )}

                {/* Key point lower third */}
                {ch.keyPoint && ch.keyPointAt !== undefined && (
                  <Sequence
                    from={ch.keyPointAt - 75}
                    durationInFrames={140}
                  >
                    <KeyPointLowerThird
                      text={ch.keyPoint}
                      accentColor={accentColor}
                    />
                  </Sequence>
                )}

                {/* Quote overlay */}
                {ch.quote && ch.quoteAt !== undefined && (
                  <Sequence
                    from={ch.quoteAt - 75}
                    durationInFrames={150}
                  >
                    <QuoteOverlay quote={ch.quote} accentColor={accentColor} />
                  </Sequence>
                )}

                {/* Word-highlight captions — synced to voice rhythm */}
                <WordCaptions text={ch.caption} accentColor={accentColor} />
              </AbsoluteFill>
            </Sequence>
          </Sequence>
        ))}

        {/* Outro — Subscribe CTA (last 420 frames) */}
        <Sequence from={3240} durationInFrames={360}>
          <OutroCTA accentColor={accentColor} />
        </Sequence>

        {/* Top bar — progress */}
        <ProgressBar accentColor={accentColor} />

        {/* Safe margin guide (hidden, for QA) */}
        {/* <SafeGuide /> */}
      </WarmGrade>
    </AbsoluteFill>
  );
};

const OutroCTA: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const pulse = (Math.sin(frame * 0.08) + 1) / 2; // subtle pulse
  const y = interpolate(enter, [0, 1], [30, 0]);

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
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 999,
          padding: "14px 28px",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          transform: `scale(${1 + pulse * 0.015})`,
        }}
      >
        <span
          style={{
            background: accentColor,
            color: "#0a0a0f",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: "0.08em",
          }}
        >
          SUBSCRIBE
        </span>
        <span
          style={{ color: "white", fontSize: 16, fontWeight: 600, opacity: 0.95 }}
        >
          For more faith & wisdom stories — new every week
        </span>
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 12,
          letterSpacing: "0.16em",
          color: "rgba(255,255,255,0.45)",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        Leave the last 5 seconds clear for YouTube end screen
      </div>
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${accentColor}, #F4C430)`,
          boxShadow: `0 0 10px ${accentColor}88`,
        }}
      />
    </div>
  );
};
