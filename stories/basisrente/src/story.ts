// The film's settings and timeline. Every frame number lives here.
// Word times come from ElevenLabs Scribe (public/audio/narration.words.json). frame = OFFSET + round(seconds * FPS).

export const FPS = 30;
export const OFFSET = 15; // the narration starts 0.5 s in

export const SHAPES = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "1:1": { width: 1080, height: 1080 },
} as const;

const SHAPE = SHAPES["9:16"];

export const STORY = {
  title: "Jonas plants a pension (Basisrente, Robin Emig, Allianz)",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 900, // exactly 30 s
  audio: "audio/mix.wav" as string | null,
};

// Subtitles: [startFrame, endFrame, text], as spoken.
export const SUBS: [number, number, string][] = [
  [20, 52, "This is Jonas."],
  [60, 147, "He earns well and pays a lot of tax."],
  [159, 254, "His state pension will be much lower than his salary."],
  [263, 326, "So Jonas starts a Basisrente."],
  [330, 399, "He pays in €300 a month."],
  [405, 452, "The tax office gives him"],
  [452, 504, "about €1,500 back each year,"],
  [509, 566, "and later it pays him a pension"],
  [566, 618, "every month, for life."],
  [627, 659, "Less tax now,"],
  [661, 694, "more money later."],
  // the last line is shown by the contact card itself
];

// Story beats by frame.
export const CUES = {
  jonas: 32, // "Jonas."
  tax: 128, // "tax." coins are taken
  bars: 158, // "His state pension"
  barsDrop: 205, // "much lower"
  scenePot: 256, // camera moves to the plant pot
  reach: 268, // Jonas reaches out with a coin
  basis: 299, // "Basisrente": label
  coinLand: 324, // first coin lands in the pot (just after the word)
  months: [340, 357, 374, 391], // calendar flips, one coin each
  example: 352, // "three hundred": Example tag
  sceneRefund: 400, // camera pulls back
  envelope: 407, // "The tax office"
  amount: 454, // "fifteen": amount label
  shower: 442, // coins start flying back
  back: 478, // "back": coins land on the stack
  sceneGarden: 505, // "and later"
  yearsLater: 512,
  pension: 552, // "pension": first coin falls into his hand
  everyMonth: 571, // "every month"
  lessTax: 629, // "Less tax now"
  moreLater: 665, // "more money later"
  sceneCard: 700, // "Talk to Robin Emig"
  chime: 762, // just after "Allianz."
  end: 900,
};

// Each scene's span; neighbouring scenes cross-fade over XF frames.
export const XF = 8;
export const SCENES: [string, number, number][] = [
  ["office", 0, CUES.sceneGarden],
  ["garden", CUES.sceneGarden, CUES.sceneCard],
  ["card", CUES.sceneCard, CUES.end],
];
