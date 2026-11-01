# Robin Videos

Short animated story videos. Use the `story-animator` skill in `.claude/skills/`.
Put every film in its own folder under `stories/`.

## Cloud sessions only
Remotion cannot download its own browser here (the network blocks remotion.media).
Add this flag to every `remotion render` and `remotion still` command:

    --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell

On a local computer, leave the flag out.

## Video skills in .claude/skills
Pick one per video to vary the style. All draw video in code. Never use AI image or video generation.

| Skill | Best for | Engine |
|---|---|---|
| story-animator | Narrated 2D cartoon stories | Remotion |
| motion-designer | Promo reels, teasers, beat edits, data stories | HTML + Three.js + Playwright |
| motion-design | Motion-graphics videos, no Remotion licence needed | HTML + Playwright + FFmpeg |
| remotion-video | Explainer videos with scene timing and narration | Remotion |
| synthetic-ui-demo | Product demo videos rebuilt from app screens | React |
| remotion-best-practices | Official Remotion coding rules (helper skill) | Remotion |
| remotion-video-creation | Remotion coding guide (helper skill) | Remotion |
| playwright-recording, ffmpeg | Screen recording, video editing (helper skills) | Playwright, FFmpeg |

Rules:
- Use the ElevenLabs connector for voice, music and effects. Never write an API key into a file.
- motion-designer and motion-design can download stock photos or videos (Poly Haven, Pexels, Mixkit). Ask the user first.
- Remotion may need a company licence for commercial use. Check remotion.dev/license.

## Lessons from the first two videos (Nov 2026)
- Finished videos: stories/liability-max (story-animator, 30 s, 9:16) and stories/hausrat-water (motion-design, 30 s, 9:16). Both for Robin Emig, Allianz, +49 160 97626099. English, warm male voice "Russell - The Friendly Narrator".
- Real ElevenLabs prices seen (free plan): 30 s voice take 440-500, 30 s music 900, each sound effect 50, Scribe transcription 0.
- ElevenLabs free generations are often busy. Never retry in the same turn; tell the user and retry on the next message.
- Music settings come back as "Instrumental: False" even when the prompt says no vocals. Ask the user to listen for singing.
- Cloud blocks Hugging Face (no faster-whisper models) and Chromium does not trust the proxy for Google Fonts. Use ElevenLabs Scribe for word times, and keep fonts in the project (see public/fonts, kit/fonts.ts).
- motion-design: Python Playwright is not installed. Use stories/hausrat-water/render.js (Node Playwright) instead.
- Mix with .claude/skills/story-animator/scripts/mix.py. Target: background 12-18 dB under the voice, about -14 LUFS.
- The user is on the ElevenLabs free plan: remind them it has no commercial licence before Robin posts.
