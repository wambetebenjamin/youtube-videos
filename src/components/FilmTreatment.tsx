import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export const FilmTreatment: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 54%, rgba(0,0,0,0.26) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundImage: GRAIN,
          backgroundSize: "220px",
          backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
          opacity: 0.055,
          mixBlendMode: "overlay",
        }}
      />
    </>
  );
};
