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
  audio: null as string | null,
};

// Subtitles: [startFrame, endFrame, text], as spoken. (ESTIMATED until the voice exists.)
export const SUBS: [number, number, string][] = [
  [21, 78, "Max moves out of his old flat."],
  [84, 174, "He cleans every corner and hands back the keys."],
  [189, 258, "But the landlord keeps his deposit."],
  [262, 300, "Every cent."],
  [309, 350, "Max wants to fight."],
  [357, 458, "But a lawyer costs money, and court costs add up fast."],
  [471, 552, "Luckily, Max has legal protection insurance."],
  [555, 598, "It pays his lawyer."],
  [606, 680, "In the end, Max gets his deposit back."],
  [687, 768, "Your rights should not depend on your wallet."],
  // the last line is shown by the contact card itself
];

// Story beats by frame. (ESTIMATED until the voice exists.)
export const CUES = {
  hand: 130, // "hands back": Max walks to the door
  keys: 162, // "keys": the key goes to the landlord
  sceneLetter: 182, // "But the landlord"
  stamp: 226, // "keeps"
  cent: 266, // "Every cent": coins fly out of the piggy bank
  sceneCourt: 304, // "Max wants to fight"
  fist: 330, // "fight"
  costs: 357, // "But a lawyer costs": camera pulls back, bills pile up
  court: 400, // "court": the courthouse rises
  shield: 488, // "legal protection"
  lawyer: 552, // "It pays his lawyer": the lawyer walks in
  paid: 580, // "lawyer": PAID stamp
  sceneBack: 602, // "In the end"
  coinsBack: 636, // "deposit back"
  sceneHome: 684, // "Your rights"
  hang: 712, // Max hangs the red-tag key in his new flat
  sceneCard: 772, // "Talk to Robin Emig"
  cardKey: 858, // just after "today."
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
