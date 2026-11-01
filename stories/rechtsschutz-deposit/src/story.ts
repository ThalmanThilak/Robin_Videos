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
  title: "Max and the deposit (Robin Emig, Allianz)",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 900, // exactly 30 s
  audio: "audio/mix.wav" as string | null,
};

// Subtitles: [startFrame, endFrame, text], as spoken (narration.words.json, pauses shortened by tools/tighten.py).
export const SUBS: [number, number, string][] = [
  [22, 88, "Max moves out of his old flat."],
  [91, 186, "He cleans every corner and hands back the keys."],
  [190, 260, "But the landlord keeps his deposit."],
  [262, 302, "Every cent."],
  [309, 348, "Max wants to fight."],
  [351, 470, "But a lawyer costs money, and court costs add up fast."],
  [474, 569, "Luckily, Max has legal protection insurance."],
  [572, 608, "It pays his lawyer."],
  [611, 689, "In the end, Max gets his deposit back."],
  [692, 772, "Your rights should not depend on your wallet."],
  // the last line is shown by the contact card itself
];

// Story beats by frame (from the word times).
export const CUES = {
  hand: 142, // "hands back": Max walks to the door
  keys: 168, // "keys": the key goes to the landlord
  sceneLetter: 186, // "But the landlord"
  stamp: 226, // just after "keeps" (the stamp sound lands here)
  cent: 264, // "Every cent": coins fly out of the piggy bank
  sceneCourt: 304, // "Max wants to fight"
  fist: 330, // "fight"
  costs: 351, // "But a lawyer costs": camera pulls back, bills pile up
  court: 410, // "court": the courthouse rises
  shield: 512, // "legal protection"
  lawyer: 572, // "It pays his lawyer": the lawyer walks in
  paid: 590, // "lawyer": PAID stamp
  sceneBack: 606, // "In the end"
  coinsBack: 664, // "deposit back"
  sceneHome: 688, // "Your rights"
  hang: 728, // Max hangs the red-tag key in his new flat
  sceneCard: 772, // "Talk to Robin Emig"
  cardKey: 862, // just after "today."
  end: 900,
};

// Each scene's span; neighbouring scenes cross-fade over XF frames.
export const XF = 8;
export const SCENES: [string, number, number][] = [
  ["flat", 0, CUES.sceneLetter],
  ["letter", CUES.sceneLetter, CUES.sceneCourt],
  ["court", CUES.sceneCourt, CUES.sceneBack],
  ["back", CUES.sceneBack, CUES.sceneHome],
  ["home", CUES.sceneHome, CUES.sceneCard],
  ["card", CUES.sceneCard, CUES.end],
];
