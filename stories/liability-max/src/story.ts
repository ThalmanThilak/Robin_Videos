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
  title: "Max and the scratch (Robin Emig, Allianz)",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 900, // exactly 30 s
  audio: "audio/mix.wav" as string | null,
};

// Subtitles: [startFrame, endFrame, text], as spoken.
export const SUBS: [number, number, string][] = [
  [20, 54, "This is Max."],
  [56, 132, "He rides his bike to work every day."],
  [142, 186, "One wet morning..."],
  [188, 272, "his handlebar scrapes a shiny new car."],
  [281, 369, "In Germany, you pay for damage you cause."],
  [370, 419, "With no upper limit."],
  [425, 473, "Max doesn't ride away."],
  [474, 528, "He leaves a note with his number."],
  [533, 612, "His liability insurance pays the repair."],
  [613, 669, "Max keeps his savings."],
  [670, 768, "One small mistake should not cost you everything."],
  // the last line is shown by the contact card itself
];

// Story beats by frame.
export const CUES = {
  bell1: 50, // just after "Max." first bell ring (the token)
  sceneRain: 139, // "One wet morning"
  swerve: 198, // just before "scrapes"
  scrape: 212, // "scrapes"
  scrapeEnd: 242,
  sceneBill: 278, // "In Germany"
  billFast: 370, // "With no upper limit"
  sceneNote: 422, // "Max doesn't ride away"
  noteTuck: 491, // "note"
  sceneShield: 530, // "His liability insurance"
  shield: 536, // "liability"
  paid: 612, // in the gap after "repair"
  savings: 636, // "savings"
  sceneSun: 667, // "One small mistake"
  bell2: 753, // Max rings his bell as he rides off (no sound: it would cover "everything")
  sceneCard: 768, // "Talk to Robin Emig"
  cardBell: 848, // just after "today.": the bell's last ring, with sound
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
