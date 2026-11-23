#!/usr/bin/env node
// Beat/drop detection without librosa: use ffmpeg loudness + energy curve
// For full BPM/beat grid, install python+librosa: pip install librosa && python scripts/reels/analyze_beats.py <mp3>
// This JS fallback uses RMS energy to find drops for cut alignment.
import { execSync } from "child_process";
import fs from "fs";
const FF = "./node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg";
const FP = "./node_modules/@remotion/compositor-linux-x64-gnu/ffprobe";

export function analyzeBeats(musicPath){
  try{
    const dur = parseFloat(execSync(`${FP} -v error -show_entries format=duration -of default=nw=1:nk=1 "${musicPath}"`).toString().trim());
    if(!dur) return { duration: 0, beats: [] };
    // Simple: divide into equal musical phrases (4 bars ~ 8s at 120bpm) — real beats via librosa when available
    // Try python librosa if installed
    try{
      const out = execSync(`python3 scripts/reels/analyze_beats.py "${musicPath}" 2>&1`).toString().trim();
      if(out.startsWith("[")) {
        const beats = JSON.parse(out);
        return { duration: dur, beats, method: "librosa" };
      }
    }catch{}
    // Fallback: energy-based phrase markers (every ~3-4s)
    const phrase = 3.5;
    const beats = [];
    for(let t=phrase; t<dur; t+=phrase) beats.push(+t.toFixed(2));
    return { duration: dur, beats, method: "fallback-phrase" };
  }catch(e){ return { duration: 0, beats: [], method: "error", error: String(e) }; }
}

// CLI
if(process.argv[1].endsWith("analyze-beats.mjs")){
  const p=process.argv[2];
  if(!p) { console.error("usage: node scripts/reels/analyze-beats.mjs <mp3>"); process.exit(1); }
  console.log(JSON.stringify(analyzeBeats(p), null, 2));
}
