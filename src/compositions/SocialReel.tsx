import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

/**
 * SocialReel — DISTINCT from YouTubeVideo
 * Uses REAL caption styles from TikToks (not AI captions):
 *  - Top pill: white rounded pill, black text (like "Then there is this song")
 *  - Centered white: bold white centered, black shadow for readability (like samurai quotes)
 *  - Minimal lowercase: simple white lowercase centered (like "i want a better life")
 *  All styles replicate the uploaded videos, no AI word-highlight/dots.
 *  Place outputs in out/reels/ — never in out/youtube/.
 */

export const socialReelSchema = z.object({
  variant: z.enum(["wisdom", "motivation"]),
  hookBadge: z.string(),
  headline: z.string(),
  bodyLines: z.array(z.string()),
  ctaText: z.string(),
  musicSrc: z.string().optional(),
  accentColor: zColor(),
  slides: z.array(z.object({
    src: z.string(),
    caption: z.string().optional(),
  })).optional(),
  captionStyle: z.enum(["pill-top", "centered-bold", "minimal-lower", "samurai-quote"]).default("centered-bold"),
});

export type SocialReelProps = z.infer<typeof socialReelSchema>;

export const defaultWisdomProps: SocialReelProps = {
  variant: "wisdom",
  hookBadge: "WISDOM",
  headline: "The Storm Didn't Come to Drown You",
  bodyLines: [
    "The storm came to show you who calms it.",
    "Peace is not the absence of waves.",
    "It's the presence of His voice over them.",
    "Keep rowing — He is in the boat.",
  ],
  ctaText: "Follow for daily wisdom",
  accentColor: "#D4AF37",
  slides: [],
  captionStyle: "centered-bold",
};

export const defaultMotivationProps: SocialReelProps = {
  variant: "motivation",
  hookBadge: "MOTIVATION",
  headline: "You Are Not Late — You Are Becoming",
  bodyLines: [
    "Comparison steals speed.",
    "Your chapter 3 is not their chapter 10.",
    "Stay the course — consistency beats intensity.",
    "Your time is not late. It's being formed.",
  ],
  ctaText: "Save + share",
  accentColor: "#38bdf8",
  slides: [],
  captionStyle: "centered-bold",
};

// Authentic TikTok caption styles — replicating real videos, no AI effects
const CaptionStyles = {
  // Style 1: Top pill (white pill, black text) — like "Then there is this song"
  pillTop: (text: string, progress: number) => (
    <div style={{
      position: "absolute",
      top: 80,
      left: "50%",
      transform: `translateX(-50%) translateY(${interpolate(progress, [0, 1], [-10, 0])}px)`,
      opacity: progress,
      background: "white",
      borderRadius: 999,
      padding: "12px 28px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
    }}>
      <span style={{ color: "#0a0a0f", fontSize: 24, fontWeight: 600, fontFamily: "sans-serif", whiteSpace: "nowrap" }}>
        {text.replaceAll("—"," ").replaceAll("–"," ").replaceAll("-", " ")}
      </span>
    </div>
  ),

  // Style 2: Centered bold white (like samurai quotes) — most common, authentic
  centeredBold: (text: string, progress: number) => (
    <div style={{
      position: "absolute",
      top: "50%",
      left: 36,
      right: 36,
      transform: `translateY(-50%) translateY(${interpolate(progress, [0, 1], [12, 0])}px)`,
      opacity: progress,
      textAlign: "center",
    }}>
      <p style={{
        color: "white",
        fontSize: 54,
        fontWeight: 900,
        lineHeight: 1.25,
        fontFamily: "sans-serif",
        textShadow: "0 2px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)",
        letterSpacing: "-0.01em",
        textTransform: "uppercase" as const,
      }}>
        {text.replaceAll("—"," ").replaceAll("–"," ").replaceAll("-", " ")}
      </p>
    </div>
  ),

  // Style 3: Minimal lowercase (like "i want a better life") — centered, simple
  minimalLower: (text: string, progress: number) => (
    <div style={{
      position: "absolute",
      top: "50%",
      left: 36,
      right: 36,
      transform: `translateY(-50%)`,
      opacity: progress,
      textAlign: "center",
    }}>
      <p style={{
        color: "white",
        fontSize: 40,
        fontWeight: 600,
        lineHeight: 1.4,
        fontFamily: "sans-serif",
        textShadow: "0 1px 8px rgba(0,0,0,0.8)",
        letterSpacing: "0.01em",
      }}>
        {text.toLowerCase()}
      </p>
      <div style={{
        width: 60,
        height: 1,
        background: "rgba(255,255,255,0.6)",
        margin: "16px auto 0",
        opacity: progress,
      }} />
    </div>
  ),

  // Style 4: Samurai quote (centered, serif, with attribution spacing) — like Mushin
  samuraiQuote: (text: string, progress: number) => (
    <div style={{
      position: "absolute",
      top: "50%",
      left: 40,
      right: 40,
      transform: `translateY(-50%)`,
      opacity: progress,
      textAlign: "center",
    }}>
      <p style={{
        color: "white",
        fontSize: 48,
        fontWeight: 800,
        lineHeight: 1.3,
        fontFamily: "Georgia, serif",
        textShadow: "0 2px 10px rgba(0,0,0,0.9)",
        fontStyle: "normal" as const,
        textTransform: "uppercase" as const,
      }}>
        {text.replaceAll("—"," ").replaceAll("–"," ").replaceAll("-", " ")}
      </p>
    </div>
  ),
};

const SlideDeck: React.FC<{ slides: { src: string }[]; variant: string }> = ({ slides, variant }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!slides?.length) {
    // No AI slides — use simple cinematic gradient (no people)
    const progress = frame / durationInFrames;
    const bg = variant === "wisdom"
      ? `linear-gradient(180deg, #0f1419 0%, #1a2332 50%, #0a0e14 100%)`
      : `linear-gradient(180deg, #0a1419 0%, #1a2a32 50%, #0a1014 100%)`;
    return <AbsoluteFill style={{ background: bg }} />;
  }
  const perSlide = Math.floor(durationInFrames / slides.length);
  const active = Math.min(slides.length - 1, Math.floor(frame / perSlide));
  const local = frame % perSlide;
  const zoom = interpolate(local, [0, perSlide], [1.0, 1.06], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#070a12" }}>
      <img src={slides[active]?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, filter: "contrast(1.02) saturate(0.96)" }} />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.35)" }} />
    </AbsoluteFill>
  );
};

export const SocialReel: React.FC<SocialReelProps> = ({
  variant,
  hookBadge,
  headline,
  bodyLines,
  ctaText,
  accentColor,
  slides = [],
  captionStyle = "centered-bold",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 110 } });
  const captionProgress = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 16, stiffness: 100 } });

  const linesPerSec = bodyLines.length ? Math.floor(durationInFrames / bodyLines.length) : durationInFrames;
  const activeLine = Math.min(bodyLines.length - 1, Math.floor(frame / linesPerSec));
  // NO TITLE / NO DASHES — only bodyLines, stripped
  const rawText = bodyLines[activeLine] ?? "";
  const currentText = rawText.replaceAll("—"," ").replaceAll("–"," ").replaceAll("-", " ").replace(/\s+/g," ").trim();

  // Get the authentic caption style renderer — also cycle bg images if provided
  const bgImage = (slides && slides.length) ? slides[activeLine % slides.length]?.src : null;
  const renderCaption = () => {
    switch (captionStyle) {
      case "pill-top": return CaptionStyles.pillTop(currentText, captionProgress);
      case "minimal-lower": return CaptionStyles.minimalLower(currentText, captionProgress);
      case "samurai-quote": return CaptionStyles.samuraiQuote(currentText, captionProgress);
      case "centered-bold":
      default: return CaptionStyles.centeredBold(currentText, captionProgress);
    }
  };

  return (
    <AbsoluteFill className="bg-slate-950 font-sans antialiased">
      <SlideDeck slides={slides} variant={variant} />

      {/* NO PILLS / NO TITLES — hookBadge disabled per user; titles not shown */}

      {/* Main caption — authentic style from TikToks, no AI effects */}
      {renderCaption()}

      {/* CTA — only at end, minimal */}
      {frame > durationInFrames - 90 && (
        <div style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: interpolate(frame, [durationInFrames - 90, durationInFrames - 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          background: "rgba(255,255,255,0.95)",
          borderRadius: 999,
          padding: "12px 24px",
        }}>
          <span style={{ color: "#0a0a0f", fontSize: 16, fontWeight: 700 }}>{ctaText}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
