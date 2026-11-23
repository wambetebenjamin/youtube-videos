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
  captionStyle: z.enum(["pill-top", "centered-bold", "minimal-lower", "samurai-quote", "handwritten-ink"]).default("handwritten-ink"),
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


// Helper: wrap text into lines (same as builder)
function wrapLines(text:string, maxChars=26){
  const words=text.split(" ");
  const lines:string[]=[];
  let cur="";
  for(const w of words){
    if((cur+" "+w).trim().length > maxChars && cur){
      lines.push(cur.trim());
      cur=w;
    } else cur=(cur+" "+w).trim();
  }
  if(cur) lines.push(cur);
  return lines;
}

// Handwritten Ink — tall narrow organic handwritten (Shadows Into Light / Caveat / Amatic SC / Indie Flower)
// Prompt Keywords: tall narrow handwritten ink font, organic casual fine-liner script, imperfect hand-lettered typography, thin dark charcoal ink
// Layer-by-layer animation: 1.0s line1, 1.8s line2, 2.6s line3, 3.5s footer — ink-bleed fade + 10px upward drift, paper-grain Multiply blend
const HandwrittenInk: React.FC<{ text: string; localFrame: number; fps: number }> = ({ text, localFrame, fps }) => {
  const clean = text.replaceAll("—"," ").replaceAll("–"," ").replaceAll("-", " ").replace(/\s+/g," ").trim();
  const lines = wrapLines(clean, 26);
  return (
    <div style={{ position:"absolute", top:"44%", left:40, right:40, transform:"translateY(-50%)", textAlign:"center" }}>
      {lines.map((line, i) => {
        const delay = 30 + i*24; // 1.0s, 1.8s, 2.6s ...
        const prog = spring({ frame: Math.max(0, localFrame - delay), fps, config:{ damping:18, stiffness:120 }});
        const opacity = prog;
        const y = interpolate(prog, [0,1], [10, 0]);
        const blur = interpolate(prog, [0,1], [2, 0]);
        return (
          <div key={i} style={{ opacity, transform: `translateY(${y}px)`, filter: `blur(${blur}px)`, willChange:"transform,opacity" }}>
            <p style={{
              color: "white",
              fontSize: 58,
              fontWeight: 500,
              lineHeight: 1.15,
              fontFamily: `"Caveat", "Shadows Into Light", "Amatic SC", "Indie Flower", cursive`,
              textShadow: "0 1px 10px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,1)",
              letterSpacing: "0.02em",
              margin: "8px 0",
              // ink-bleed subtle: slightly heavier on entrance via textShadow
            }}>
              {line}
            </p>
          </div>
        );
      })}
      {/* paper grain hint — faint texture overlay handled in parent via Multiply */}
    </div>
  );
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

  // Style 5: Handwritten Ink — tall narrow organic handwritten ink script (Shadows Into Light / Caveat)
  handwrittenInk: (text: string, progress: number, localFrame?: number, fps?: number) => {
    // fallback for non-staggered use — delegates to HandwrittenInk component style
    return (
      <div style={{ position:"absolute", top:"44%", left:40, right:40, transform:"translateY(-50%)", textAlign:"center", opacity: progress }}>
        <p style={{ color:"white", fontSize:58, fontWeight:500, lineHeight:1.15, fontFamily:`"Caveat", "Shadows Into Light", "Amatic SC", "Indie Flower", cursive`, textShadow:"0 1px 10px rgba(0,0,0,0.85)", letterSpacing:"0.02em" }}>{text}</p>
      </div>
    );
  },
};

const SlideDeck: React.FC<{ slides: { src: string }[]; variant: string }> = ({ slides, variant }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!slides?.length) {
    // Warm cream textured paper fallback — watercolor hint
    const t = frame / durationInFrames;
    const bg = variant === "wisdom"
      ? `linear-gradient(180deg, #fdf6e3 0%, #f5e6c8 50%, #ede0b8 100%)`
      : `linear-gradient(180deg, #fdf6e3 0%, #e9dcc3 100%)`;
    return (
      <AbsoluteFill style={{ background: bg }}>
        {/* paper grain — multiply texture */}
        <AbsoluteFill style={{ opacity:0.08, background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 3px)` }} />
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(0,0,0,0.06))` }} />
      </AbsoluteFill>
    );
  }
  const perSlide = Math.floor(durationInFrames / slides.length);
  const active = Math.min(slides.length - 1, Math.floor(frame / perSlide));
  const local = frame % perSlide;
  const zoom = interpolate(local, [0, perSlide], [1.0, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ambientPan = interpolate(local, [0, perSlide], [-8, 8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const driftY = interpolate(local, [0, perSlide], [-6, 6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#070a12" }}>
      <img src={slides[active]?.src} alt="" style={{ width: "108%", height: "108%", objectFit: "cover", transform: `scale(${zoom}) translate(${ambientPan}px, ${driftY}px)`, filter: "contrast(1.04) saturate(0.96) brightness(0.96)" }} />
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.30)" }} />
      {/* subtle vignette + paper grain multiply for ink absorption */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.38))` }} />
      <AbsoluteFill style={{ opacity:0.06, background: `repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 2px)`, mixBlendMode:"multiply" as any }} />
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
  const localFrame = frame % linesPerSec;
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
      case "handwritten-ink": return <HandwrittenInk text={currentText} localFrame={localFrame} fps={fps} />;
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
