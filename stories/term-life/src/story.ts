// The film's settings and timeline. Every frame number lives here.
// Word times come from ElevenLabs Scribe on take A, shifted by the extra pauses
// (public/audio/narration.words.json). frame = OFFSET + round(seconds * FPS).

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
  title: "Tom's key (Robin Emig, Allianz)",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 900, // exactly 30 s
  audio: "audio/mix.wav" as string | null,
};

// Subtitles: [startFrame, endFrame, text], as spoken.
export const SUBS: [number, number, string][] = [
  [16, 94, "Tom just got the keys to a new home."],
  [100, 146, "For Lena, Mia..."],
  [148, 202, "and a big bank loan."],
  [224, 295, "But what if Tom were gone tomorrow?"],
  [325, 356, "Without cover,"],
  [360, 416, "Lena pays the loan alone."],
  [422, 468, "She could lose the house."],
  [490, 537, "With term life insurance,"],
  [538, 581, "the loan is paid off."],
  [583, 646, "Lena and Mia keep their home."],
  [660, 714, "Protect the people you love."],
  // "Talk to Robin Emig today." is shown by the contact card itself
];

// Story beats by frame.
export const CUES = {
  keyLift: 26, // Tom starts to lift the key
  keys: 51, // "keys": the key glints (the token)
  jingle1: 92, // just after "home": Tom jingles the key (sound)
  family: 103, // "For Lena": Lena and Mia come in
  loan: 166, // "big bank loan": the loan paper unrolls
  dim: 197, // just after "loan.": the light dims (sound)
  ghost: 252, // "Tom": Tom fades to a soft outline
  drop: 268, // "gone": the key drops
  sceneSplit: 316, // the screen splits: without cover / with cover
  without: 329, // "Without cover"
  letters: 365, // "Lena pays": bank letters pile up
  sign: 436, // "lose": "Zu verkaufen" sign
  withCover: 494, // "With": the lower half lights up
  badge: 502, // "term life insurance": the badge
  loanIn: 520, // the loan paper slides in
  paid: 577, // in the gap after "off.": PAID stamp (sound)
  sceneKeep: 584, // "Lena and Mia keep their home"
  unlock: 614, // "keep": Mia turns the key
  doorOpen: 622,
  jingle2: 640, // just after "home.": the key jingles in the lock (sound)
  sceneNow: 652, // "Protect the people you love": back to now, Tom is here
  love: 697, // "love"
  sceneCard: 724, // "Talk to Robin Emig"
  cardKey: 780, // just after "today.": the key swings one last time (sound)
  end: 900,
};

// Each scene's span; neighbouring scenes cross-fade over XF frames.
export const XF = 8;
export const SCENES: [string, number, number][] = [
  ["home", 0, CUES.sceneSplit],
  ["split", CUES.sceneSplit, CUES.sceneKeep],
  ["keep", CUES.sceneKeep, CUES.sceneNow],
  ["now", CUES.sceneNow, CUES.sceneCard],
  ["card", CUES.sceneCard, CUES.end],
];

// During these spans the subtitles sit on the seam between the two halves.
export const SEAM_Y = 960;
export const SUBS_ON_SEAM: [number, number] = [CUES.sceneSplit, CUES.sceneKeep];
