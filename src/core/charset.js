/**
 * The character set we build advance-width tables for.
 * Latin-1 + the punctuation that actually shows up in quotes and captions
 * (smart quotes, dashes, ellipsis, arrows, stars).
 */
const ranges = [
  [0x20, 0x7e], // ASCII printable
  [0xa0, 0xff], // Latin-1 supplement
  [0x100, 0x17f], // Latin Extended-A
];

const extras = '‘’‚“”„†‡•…‰‹›€₂₃™←↑→↓↔⇒∞≈≠≤≥✓✔✗✦★☆♥♡♦♣♠·–—―§¶№';

export const METRIC_CHARS = (() => {
  const out = [];
  for (const [a, b] of ranges) {
    for (let cp = a; cp <= b; cp++) out.push(String.fromCodePoint(cp));
  }
  for (const ch of extras) if (!out.includes(ch)) out.push(ch);
  return out;
})();
