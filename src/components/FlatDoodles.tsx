import React from "react";

export type DoodleProps = {
  color?: string;
  size?: number;
};

const Svg: React.FC<DoodleProps & { children: React.ReactNode }> = ({
  color = "#111827",
  size = 100,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: "block", overflow: "visible" }}
    aria-hidden="true"
  >
    <g stroke={color} fill={color}>{children}</g>
  </svg>
);

export const ArrowDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <path
      d="M14 62 C30 46, 50 40, 76 30"
      strokeWidth="9"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M64 18 L80 28 L68 42"
      strokeWidth="9"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export const SparkleDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <path
      d="M50 6 L58 38 L90 50 L58 62 L50 94 L42 62 L10 50 L42 38 Z"
      stroke="none"
    />
  </Svg>
);

export const StarDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <path
      d="M50 8 L61 37 L92 39 L68 59 L76 89 L50 72 L24 89 L32 59 L8 39 L39 37 Z"
      stroke="none"
    />
  </Svg>
);

export const CrownDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <path d="M12 34 L28 56 L50 24 L72 56 L88 34 L80 82 L20 82 Z" stroke="none" />
    <rect x="18" y="84" width="64" height="10" rx="3" stroke="none" />
  </Svg>
);

export const QuestionDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <path
      d="M30 30 C30 16, 70 16, 70 34 C70 48, 50 48, 50 64"
      strokeWidth="11"
      strokeLinecap="round"
      fill="none"
    />
    <circle cx="50" cy="82" r="7" stroke="none" />
  </Svg>
);

export const ScreenDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <rect x="12" y="20" width="76" height="52" rx="8" strokeWidth="8" fill="none" />
    <path d="M38 84 L62 84" strokeWidth="8" strokeLinecap="round" fill="none" />
    <path d="M50 72 L50 84" strokeWidth="8" strokeLinecap="round" fill="none" />
  </Svg>
);

export const LightbulbDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <path
      d="M50 12 C70 12, 84 28, 84 46 C84 62, 72 70, 66 82 L34 82 C28 70, 16 62, 16 46 C16 28, 30 12, 50 12 Z"
      stroke="none"
    />
    <rect x="34" y="84" width="32" height="8" rx="3" stroke="none" />
    <rect x="38" y="94" width="24" height="5" rx="2" stroke="none" />
  </Svg>
);

export const BooksDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <rect x="14" y="20" width="60" height="14" rx="3" stroke="none" />
    <rect x="20" y="38" width="66" height="14" rx="3" stroke="none" />
    <rect x="12" y="56" width="58" height="14" rx="3" stroke="none" />
    <rect x="22" y="74" width="64" height="14" rx="3" stroke="none" />
  </Svg>
);

export const TrophyDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <path d="M28 16 L72 16 L68 54 C66 68, 58 76, 50 76 C42 76, 34 68, 32 54 Z" stroke="none" />
    <path d="M28 24 L14 24 L18 42 C20 50, 26 52, 32 50" strokeWidth="8" strokeLinecap="round" fill="none" />
    <path d="M72 24 L86 24 L82 42 C80 50, 74 52, 68 50" strokeWidth="8" strokeLinecap="round" fill="none" />
    <rect x="44" y="76" width="12" height="14" stroke="none" />
    <rect x="32" y="90" width="36" height="8" rx="3" stroke="none" />
  </Svg>
);

export const CrossDoodle: React.FC<DoodleProps> = ({ color = "#111827", size = 100 }) => (
  <Svg color={color} size={size}>
    <rect x="40" y="8" width="20" height="84" rx="3" stroke="none" />
    <rect x="20" y="34" width="60" height="20" rx="3" stroke="none" />
  </Svg>
);
