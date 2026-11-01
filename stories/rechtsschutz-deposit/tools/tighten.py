#!/usr/bin/env python3
"""Shorten every pause in the narration to KEEP seconds and move Scribe word times to match.
usage: python3 tools/tighten.py in.mp3 scribe.json out.mp3 out.words.json"""
import json, re, subprocess, sys
KEEP = 0.28
src, scribe, out, out_words = sys.argv[1:5]
err = subprocess.run(["ffmpeg","-i",src,"-af","silencedetect=noise=-35dB:d=0.25","-f","null","-"],capture_output=True,text=True).stderr
ss = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
se = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",src],capture_output=True,text=True).stdout)
# keep [0, s0+KEEP/2], [e0-KEEP/2, s1+KEEP/2], ... ; the trailing silence is kept short too
cuts = [(a + KEEP/2, b - KEEP/2) for a, b in zip(ss, se) if b - a > KEEP]
keep, t = [], 0.0
for a, b in cuts:
    keep.append((t, a)); t = b
keep.append((t, dur))
sel = "+".join(f"between(t,{a:.4f},{b:.4f})" for a, b in keep)
subprocess.run(["ffmpeg","-v","error","-y","-i",src,"-af",f"aselect='{sel}',asetpts=N/SR/TB","-ar","44100","-b:a","192k",out],check=True)
def mapt(x):
    shift = 0.0
    for a, b in cuts:
        if x >= b: shift += b - a
        elif x > a: return a - shift
    return x - shift
words = json.load(open(scribe))
res, tag = [], False
for w in words:  # drop direction tags such as "[warm, friendly storytelling]" (they are not spoken)
    if w["text"].startswith("["): tag = True
    if not tag: res.append({"w": w["text"], "s": round(mapt(w["start"]), 3), "e": round(mapt(w["end"]), 3)})
    if w["text"].endswith("]"): tag = False
json.dump(res, open(out_words, "w"), indent=0)
fr = lambda s: 15 + round(s * 30)
print(" ".join(f"{w['w']}@{fr(w['s'])}" for w in res))
print("new length", subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",out],capture_output=True,text=True).stdout.strip())
