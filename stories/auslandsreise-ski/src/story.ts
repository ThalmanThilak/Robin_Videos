// The film's settings and timeline. Every frame number lives here.
// Word times come from ElevenLabs Scribe on take B, sped up 4 % (public/audio/narration.words.json).
// frame = OFFSET + round(seconds * FPS).

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
  title: "Tom and the small card (Robin Emig, Allianz)",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 900, // exactly 30 s
  audio: "audio/mix.wav" as string | null,
};

// Subtitles: [startFrame, endFrame, text], as spoken.
export const SUBS: [number, number, string][] = [
  [20, 48, "This is Tom."],
  [56, 106, "Ski week in Austria!"],
  [112, 172, "He packs one small card."],
  [180, 250, "Day two. One bad turn..."],
  [254, 302, "and his leg is broken."],
  [311, 374, "A helicopter flies him to hospital."],
  [383, 454, "His normal health insurance won't pay for that,"],
  [455, 492, "or the flight home."],
  [496, 546, "That can cost thousands."],
  [552, 604, "But Tom's card is his..."],
  // the long German word is shown big in the card scene itself
  [674, 711, "It covers the bills"],
  [711, 752, "and flies him home."],
  // the last line is shown by the contact card itself
];

// Story beats by frame.
export const CUES = {
  wave: 30, // "Tom."
  sceneChalet: 0,
  scenePack: 108, // "He packs"
  cardIn: 128, // the card slides towards the pocket
  cardGlint: 150, // "card."
  sceneSlope: 178, // "Day two"
  turn: 230, // "turn": the ski catches
  tumbleEnd: 252,
  sceneHurt: 252, // "and his leg is broken"
  broken: 280, // "broken."
  sceneHeli: 306, // just before "A helicopter"
  heliIn: 306,
  heliHover: 340,
  lift: 344, // "flies him"
  heliOut: 362, // "hospital."
  sceneNoPay: 380, // "His normal health insurance"
  healthCard: 384,
  xHeli: 444, // "that"
  xPlane: 476, // "flight home."
  sceneCost: 494, // "That can cost"
  coins: 500,
  thousands: 517, // "thousands."
  sceneCard: 550, // "But Tom's card"
  cardUp: 562, // "Tom's card"
  word1: 604, // "Auslands-"
  word2: 619, // "reise-"
  word3: 634, // "kranken-"
  word4: 646, // "versicherung"
  sceneHome: 670, // "It covers the bills"
  covered: 707, // stamp, in the gap after "bills" (stamp sound here)
  pullBack: 713, // "and flies him home": the camera pulls back to the whole plane
  sceneEnd: 755, // "Travelling soon? Talk to Robin Emig at Allianz."
  endCard: 848, // after "Allianz.": the card's last bounce
  end: 900,
};

// Each scene's span; neighbouring scenes cross-fade over XF frames.
export const XF = 8;
export const SCENES: [string, number, number][] = [
  ["chalet", 0, CUES.scenePack],
  ["pack", CUES.scenePack, CUES.sceneSlope],
  ["slope", CUES.sceneSlope, CUES.sceneHurt],
  ["hurt", CUES.sceneHurt, CUES.sceneHeli],
  ["heli", CUES.sceneHeli, CUES.sceneNoPay],
  ["nopay", CUES.sceneNoPay, CUES.sceneCost],
  ["cost", CUES.sceneCost, CUES.sceneCard],
  ["card", CUES.sceneCard, CUES.sceneHome],
  ["home", CUES.sceneHome, CUES.sceneEnd],
  ["end", CUES.sceneEnd, CUES.end],
];
