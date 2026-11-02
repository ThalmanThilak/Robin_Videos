// The film's settings and timeline. Every frame number lives here.
// frame = OFFSET + round(seconds * FPS), seconds measured in public/audio/narration.mp3.
// TIMING STATUS: estimated from the script (the audio could not be downloaded yet).
// Re-time from ElevenLabs Scribe word times once narration.mp3 is in public/audio.

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
  audio: null as string | null, // set to "audio/mix.wav" after the mix
};

// Subtitles: [startFrame, endFrame, text], as spoken.
export const SUBS: [number, number, string][] = [
  [15, 70, "Sunday afternoon."],
  [72, 128, "Max plays football with his niece Mia."],
  [138, 182, "One big kick..."],
  [186, 268, "...straight through the living room window."],
  [278, 316, "Who pays?"],
  [324, 446, "His liability insurance? It only pays for damage to others."],
  [454, 560, "Contents insurance? Usually not for broken windows."],
  [568, 624, "Glass insurance does."],
  [630, 728, "Max gets a new pane. Mia gets her ball back."],
  // the last line is shown by the contact card itself
];

// Story beats by frame.
export const CUES = {
  kick: 162, // Mia's foot hits the ball, on "kick"
  maxJump: 212, // Max jumps for the ball and misses
  impact: 258, // ball hits the window, just after "window"
  sceneWho: 274, // "Who pays?"
  cardLiab: 326, // "His liability insurance"
  crossLiab: 432, // after "others"
  cardHome: 456, // "Contents insurance"
  crossHome: 548, // after "broken windows"
  shield: 572, // "Glass insurance does"
  chime: 612, // just after "does"
  sceneFix: 630, // "Max gets a new pane"
  pane: 640, // the new pane slides in
  ballBack: 686, // "Mia gets her ball back"
  sceneCard: 734, // "Glass breaks fast. Talk to Robin Emig"
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
