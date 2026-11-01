# Director's brief: "The burst pipe" (Hausratversicherung)

- Length 30 s, 9:16 (1080 x 1920), 30 fps. English. For Robin Emig, Allianz.
- Promise in one line: when water ruins your things, your contents insurance replaces them at new value.
- Audience: adults and expats in Germany. Channel: Reels, Shorts, WhatsApp Status.
- Reference style: Apple keynote explainer. Warm off-white #f5f5f2, ink #0f172a, ONE accent: water blue #2f78d6.
- One shape system: the water drop. It drips, floods the screen, drains, then becomes the shield.
- One thing moves at a time. Springs, no bounce, no particles, no rainbow gradients.
- Text sits inside the centre 1080 x 1080 safe zone.

## Narration (60 words, warm male voice "Russell", same as the liability video)
1. Your home. Everything you own, in one place.
2. Then one night... a water pipe bursts.
3. The sofa. The laptop. The rug. Ruined.
4. Your household contents insurance replaces them.
5. Not at the old price. At what new ones cost today.
6. It also covers fire, storm, hail and burglary.
7. Protect what's inside. Talk to Robin Emig, Allianz.

## Beats
| Time | Voice | Screen |
|---|---|---|
| 0-3 s | Your home... | A line-drawn flat builds in. Sofa, laptop, rug, lamp pop into place. Big text: "Your home." |
| 3-6 s | Then one night... | Light dims. One blue drop forms on a pipe and falls. A crack opens. Small label: "Example" |
| 6-8 s | ...bursts | The drop hits the floor and floods the screen in blue (circle clears every corner). |
| 8-12 s | The sofa... Ruined. | Water level drops to half. Items tilt in the water. Each name lands on its word, then "Ruined." |
| 12-16 s | Your household contents insurance... | Water drains into one drop. The drop morphs into a shield. Big text: "Household contents insurance", small: "Hausratversicherung". |
| 16-20 s | Not at the old price... | Items come back new. Tag "Old value" is crossed out, "New value" slides in. |
| 20-24 s | It also covers... | Four icons pop in a row on their words: fire, storm, hail, burglary. |
| 24-30 s | Protect what's inside... | End card: "Robin Emig", "Allianz", phone +49 160 97626099. Footnote "Cover depends on your policy." Gentle drift, no frozen frame. |

## Sound plan (ElevenLabs only)
- Voice: 1 take first, about 500 credits. Second take only if needed.
- Music: calm, modern, light piano and soft pulse, tension at 3-8 s, lift at 12 s, about 900 credits.
- Effects: water drip, water burst rush, soft chime on the shield. About 50 each, 150 total.
- Total about 1,550 credits. Mix: voice on top, background 12 to 18 dB under.

## Build
- One HTML file with window.seek(t), drawn in SVG and code. Rendered frame by frame with Playwright (Node) and FFmpeg.
- 4 stills first, then a draft, then the full render. Critique pass with scores before delivery.
