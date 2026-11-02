#!/usr/bin/env python3
"""Align a known script to speech phrases found by ffmpeg silencedetect.
Word times inside a phrase are ESTIMATED from letter counts (no speech model).
usage: python3 align.py audio.mp3 > words.json"""
import json, re, subprocess, sys
PHRASES = [
 "This is Max.", "He rides his bike to work every day.", "One wet morning...",
 "his handlebar scrapes a shiny new car.", "In Germany,", "you pay for damage you cause.",
 "With no upper limit.", "Max doesn't ride away.", "He leaves a note with his number.",
 "His liability insurance pays the repair.", "Max keeps his savings.",
 "One small mistake should not cost you everything.", "Talk to Robin Emig, Allianz, today."]
audio = sys.argv[1]
err = subprocess.run(["ffmpeg","-i",audio,"-af","silencedetect=noise=-35dB:d=0.25","-f","null","-"],capture_output=True,text=True).stderr
dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",audio],capture_output=True,text=True).stdout)
ss = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
se = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
starts = [0.0] + se; ends = ss + [dur]
if len(starts) != len(PHRASES):
    sys.exit(f"found {len(starts)} speech parts, script has {len(PHRASES)} phrases")
out = []
for (a, b), p in zip(zip(starts, ends), PHRASES):
    ws = p.split(); w8 = [len(re.sub(r"\W", "", w)) + 2 for w in ws]; tot = sum(w8); t = a
    for w, k in zip(ws, w8):
        d = (b - a) * k / tot
        out.append({"w": w, "s": round(t, 2), "e": round(t + d, 2), "phrase_start": t == a}); t += d
json.dump(out, sys.stdout, indent=0)
fr = lambda t: 15 + round(t * 30)
for (a, b), p in zip(zip(starts, ends), PHRASES):
    print(f"{a:6.2f}-{b:6.2f}s f{fr(a):4}-f{fr(b):4}  {p}", file=sys.stderr)
print(" ".join(f"{w['w']}@f{fr(w['s'])}" for w in out), file=sys.stderr)
