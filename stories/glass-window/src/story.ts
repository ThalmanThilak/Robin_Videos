// The film's settings and timeline. Every frame number lives here.
// frame = OFFSET + round(seconds * FPS), seconds measured in public/audio/narration.mp3.
// Word times come from ElevenLabs Scribe; the word frames are noted next to each cue.

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
  title: "Max and the football (Robin Emig, Allianz)",
  fps: FPS,
  width: SHAPE.width,
  height: SHAPE.height,
  durationFrames: 900, // exactly 30 s
  audio: "audio/mix.wav" as string | null,
};

// Subtitles: [startFrame, endFrame, text], as spoken.
export const SUBS: [number, number, string][] = [
  [18, 62, "Sunday afternoon."],
  [66, 142, "Max plays football with his niece Mia."],
  [150, 192, "One big kick..."],
  [198, 262, "...straight through the living room window."],
  [266, 296, "Who pays?"],
  [300, 350, "His liability insurance?"],
  [352, 414, "It only pays for damage to others."],
  [418, 462, "Contents insurance?"],
  [466, 528, "Usually not for broken windows."],
  [532, 586, "Glass insurance does."],
  [589, 634, "Max gets a new pane."],
  [636, 688, "Mia gets her ball back."],
  // the last line is shown by the contact card itself
];

// Story beats by frame.
export const CUES = {
  kick: 186, // Mia's foot hits the ball, right after "kick" (176-185)
  maxJump: 212, // Max jumps for the ball and misses
  impact: 256, // ball hits the window, just after "window" (241-254)
  sceneWho: 266, // "Who pays?" (270)
  cardLiab: 302, // "His liability insurance" (304)
  crossLiab: 408, // after "others" (ends 406)
  cardHome: 418, // "Contents insurance" (421)
  crossHome: 522, // after "broken windows" (ends 520)
  shield: 534, // "Glass insurance does" (536)
  chime: 579, // just after "does" (ends 577)
  sceneFix: 590, // "Max gets a new pane" (593)
  pane: 598, // the new pane slides in
  ballBack: 660, // "Mia gets her ball back" ("ball" 663)
  sceneCard: 690, // "Glass breaks fast. Talk to Robin Emig, Allianz." (693-805)
  end: 900,
};

// Each scene's span; neighbouring scenes cross-fade over XF frames.
export const XF = 8;
export const SCENES: [string, number, number][] = [
  ["garden", 0, CUES.sceneWho],
  ["who", CUES.sceneWho, CUES.sceneFix],
  ["fix", CUES.sceneFix, CUES.sceneCard],
  ["card", CUES.sceneCard, CUES.end],
];
