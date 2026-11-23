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
 * Used for social-media vertical reels (1080x1920, ≥60s, wisdom & motivation).
 * Replicates the *structure* of uploaded TikToks (hook badge, captions, CTA)
 * but purposely DIFFERENT styling from YouTube horizontal (1920x1080):
 *  - Vertical 9:16 safe areas, large type, burned-in captions
 *  - AI slides / stock (no identifiable people mid-video) with push/pull transitions
 *  - Music bed trimmed only to current track length; loader can fetch full track later
 * Place outputs in out/reels/ — never in out/youtube/.
 */

export const socialReelSchema = z.object({
  variant: z.enum(["wisdom", "motivation"]),
  hookBadge: z.string(),
  headline: z.string(),
  bodyLines: z.array(z.string()), // 3-5 short lines that become timed captions
  ctaText: z.string(),
  musicSrc: z.string().optional(), // optional bed; if missing, 60s silent master
  accentColor: zColor(),
  // Slide list: AI-generated images or new stock (no people mids)
  slides: z.array(z.object({
    src: z.string(), // public/reels/slides/*.jpg
    caption: z.string().optional(),
  })).optional(),
});

export type SocialReelProps = z.infer<typeof socialReelSchema>;

export const defaultWisdomProps: SocialReelProps = {
  variant: "wisdom",
  hookBadge: "WISDOM — 60S",
  headline: "The Discipline You Avoid Is the Price You Pay",
  bodyLines: [
    "You don't need more motivation.",
    "You need fewer negotiations with yourself.",
    "Discipline is choosing now what your future self will thank you for.",
    "Show up when it's boring. That's where the edge is.",
  ],
  ctaText: "Follow for daily wisdom →",
  accentColor: "#D4AF37",
  slides: [],
};

export const defaultMotivationProps: SocialReelProps = {
  variant: "motivation",
  hookBadge: "MOTIVATION — 60S",
  headline: "You Are Not Late — You Are Becoming",
  bodyLines: [
    "Comparison steals speed.",
    "Your chapter 3 is not their chapter 10.",
    "Stay the course — consistency beats intensity.",
  ],
  ctaText: "Save + share this →",
  accentColor: "#38bdf8",
  slides: [],
};

// Reusable helpers — intentionally different palette from YouTube
const WisdomGrade: React.FC<{ children: React.ReactNode; accent: string }> = ({ children, accent }) => (
  <AbsoluteFill style={{ filter: "contrast(0.96) saturate(0.92) brightness(1.02)" }}>
    {children}
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 18%, ${accent}18 0%, transparent 55%)`, mixBlendMode: "soft-light" as any }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.55) 100%)" }} />
  </AbsoluteFill>
);

const SlideDeck: React.FC<{ slides: { src: string; caption?: string }[]; variant: string; accent: string }> = ({ slides, variant, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  if (!slides?.length) {
    // Procedural fallback — no people, geometry + gradient only
    const idx = Math.floor((frame / durationInFrames) * 3);
    const bg = idx === 0 ? `linear-gradient(180deg, ${accent}22 0%, #0a0a12 100%)`
      : idx === 1 ? `radial-gradient(ellipse at 30% 20%, ${accent}33 0%, #0a0a14 60%)`
      : `linear-gradient(120deg, #0a0a14 0%, ${accent}14 100%)`;
    return <AbsoluteFill style={{ background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 640, height: 960, border: `1px solid ${accent}33`, borderRadius: 24, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(6px)" }} />
    </AbsoluteFill>;
  }
  const perSlide = Math.floor(durationInFrames / slides.length);
  const active = Math.min(slides.length - 1, Math.floor(frame / perSlide));
  const local = frame % perSlide;
  const zoom = interpolate(local, [0, perSlide], [1.0, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = variant === "motivation" ? interpolate(local, [0, perSlide], [0, -18]) : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#070a12" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={slides[active]?.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom}) translateX(${x}px)`, filter: "contrast(1.04) saturate(0.95)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};

export const SocialReel: React.FC<SocialReelProps> = ({ variant, hookBadge, headline, bodyLines, ctaText, accentColor, slides = [] }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // Ensure ≥60s: if composition is shorter, we letterbox with loop; builder passes correct duration
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 120 } });
  const y = interpolate(enter, [0, 1], [-18, 0]);
  const ctaEnter = spring({ frame: Math.max(0, frame - durationInFrames + 60), fps, config: { damping: 14, stiffness: 160 } });
  const linesPerSec = bodyLines.length ? Math.floor(durationInFrames / bodyLines.length) : durationInFrames;
  const activeLine = Math.min(bodyLines.length - 1, Math.floor(frame / linesPerSec));

  return (
    <AbsoluteFill className="bg-slate-950 font-sans antialiased">
      <WisdomGrade accent={accentColor}>
        <SlideDeck slides={slides} variant={variant} accent={accentColor} />
      </WisdomGrade>

      {/* Hook badge + headline — top safe area, large, replicating TikTok hook structure */}
      <div style={{ opacity: enter, transform: `translateY(${y}px)` }} className="absolute left-6 right-6 top-14 flex flex-col items-center gap-4 text-center">
        <span style={{ background: accentColor }} className="rounded-full px-5 py-2 text-[20px] font-black uppercase tracking-widest text-slate-950 shadow-lg">{hookBadge}</span>
        <h1 className="text-[52px] font-black leading-[0.95] tracking-tight text-white drop-shadow-xl px-2">{headline}</h1>
        {/* Progress bar — distinct from YouTube (YouTube is bottom, Reels is top) */}
        <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.14)", borderRadius: 999, overflow: "hidden", marginTop: 8 }}>
          <div style={{ width: `${(frame / durationInFrames) * 100}%`, height: "100%", background: accentColor }} />
        </div>
      </div>

      {/* Body captions — one line at a time, timed to ≥60s */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 36px" }}>
        <div style={{ background: "rgba(0,0,0,0.58)", border: `1px solid ${accentColor}33`, borderRadius: 20, padding: "22px 26px", backdropFilter: "blur(10px)", maxWidth: 960, textAlign: "center" }}>
          <p style={{ color: "white", fontSize: 38, fontWeight: 800, lineHeight: 1.18 }}>{bodyLines[activeLine] ?? ""}</p>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 6 }}>
            {bodyLines.map((_, i) => (
              <div key={i} style={{ width: i === activeLine ? 28 : 8, height: 8, borderRadius: 999, background: i === activeLine ? accentColor : "rgba(255,255,255,0.35)", transition: "all 0.2s" }} />
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {/* CTA — bottom safe area */}
      <div style={{ opacity: ctaEnter, transform: `scale(${interpolate(ctaEnter, [0, 1], [0.92, 1])})` }} className="absolute inset-x-6 bottom-14 flex justify-center">
        <div style={{ background: "rgba(255,255,255,0.96)", borderRadius: 999, padding: "14px 22px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
          <span style={{ background: accentColor, borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 900, color: "#0a0a0f" }}>{variant === "wisdom" ? "WISDOM" : "MOTIVATE"}</span>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0a0a14" }}>{ctaText}</span>
        </div>
      </div>

      {/* Watermark — subtle, distinct from YouTube lower-third */}
      <div style={{ position: "absolute", bottom: 22, right: 18, fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", fontWeight: 600 }}>AI Slides • No stock people mids</div>
    </AbsoluteFill>
  );
};
