// The film's settings and timeline. Every frame number lives here.
// Phrase times come from the narration pauses (tools/align.py); word times inside a phrase are
// estimated from word length. frame = OFFSET + round(seconds * FPS).

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
  title: "Max and the scratch (Robin Emig, Allianz)",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 900, // exactly 30 s
  audio: "audio/mix.wav" as string | null,
};

// Subtitles: [startFrame, endFrame, text], as spoken.
export const SUBS: [number, number, string][] = [
  [15, 55, "This is Max."],
  [57, 124, "He rides his bike to work every day."],
  [140, 182, "One wet morning..."],
  [185, 270, "his handlebar scrapes a shiny new car."],
  [277, 362, "In Germany, you pay for damage you cause."],
  [370, 415, "With no upper limit."],
  [423, 466, "Max doesn't ride away."],
  [472, 522, "He leaves a note with his number."],
  [528, 606, "His liability insurance pays the repair."],
  [611, 663, "Max keeps his savings."],
  [668, 760, "One small mistake should not cost you everything."],
  // the last line is shown by the contact card itself
];

// Story beats by frame.
export const CUES = {
  bell1: 40, // "Max." first bell ring (the token)
  sceneRain: 136, // "One wet morning"
  swerve: 196, // just before "scrapes"
  scrape: 210, // "scrapes"
  scrapeEnd: 240,
  sceneBill: 274, // "In Germany"
  billFast: 368, // "With no upper limit"
  sceneNote: 419, // "Max doesn't ride away"
  noteTuck: 486, // "a note"
  sceneShield: 524, // "His liability insurance"
  shield: 538, // "liability"
  paid: 601, // just after "repair" (the stamp sound must not cover a key word)
  savings: 612, // "Max keeps his savings"
  sceneSun: 664, // "One small mistake"
  bell2: 753, // just after "everything": final bell ring
  sceneCard: 762, // "Talk to Robin Emig"
  end: 900,
};

// Each scene's span; neighbouring scenes cross-fade over XF frames.
export const XF = 8;
export const SCENES: [string, number, number][] = [
  ["ride", 0, CUES.sceneRain],
  ["rain", CUES.sceneRain, CUES.sceneBill],
  ["bill", CUES.sceneBill, CUES.sceneNote],
  ["note", CUES.sceneNote, CUES.sceneShield],
  ["shield", CUES.sceneShield, CUES.sceneSun],
  ["sun", CUES.sceneSun, CUES.sceneCard],
  ["card", CUES.sceneCard, CUES.end],
];
