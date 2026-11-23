#!/usr/bin/env python3
"""Beat/downbeat detection via librosa. Print JSON array of beat times in seconds."""
import sys, json
try:
    import librosa
except ImportError:
    print(json.dumps({"error":"librosa not installed, run: pip install librosa"}))
    sys.exit(0)
path=sys.argv[1] if len(sys.argv)>1 else None
if not path:
    print(json.dumps({"error":"no input"})); sys.exit(1)
y,sr=librosa.load(path, sr=22050)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
# also get downbeats via tempogram if you want — beats are enough for cuts
print(json.dumps([round(float(b),2) for b in beats]))
