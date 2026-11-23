#!/usr/bin/env node
// Priority 2 fallback: photoreal stills with anti-AI constraints (no glossy 3D, no AI faces)
// Uses local Stable Diffusion if available, else instructs to use HF WAI or external API with prompt constraints.
import fs from "fs";
const ANTI_AI_NEGATIVE = "glossy 3d skin, oversaturated neon, surreal morphing, symmetrical ai face, excessive lens flare, smooth plastic texture, cartoon, illustration, cgi, perfect skin, studio lighting";
const ANTI_AI_POSITIVE_SUFFIX = ", handheld smartphone camera, natural dusk low-light grain, slight motion blur, 35mm film aesthetic, candid unposed framing, natural shadows, film grain, vignette";
export function buildPrompt(base){
  return base + ANTI_AI_POSITIVE_SUFFIX;
}
export { ANTI_AI_NEGATIVE, ANTI_AI_POSITIVE_SUFFIX, buildPrompt };
if(process.argv[1]?.endsWith("generate-photoreal.mjs")){
  console.log("Anti-AI prompt helper — import buildPrompt() in your generation script.");
  console.log("Negative:", ANTI_AI_NEGATIVE);
}
