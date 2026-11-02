import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { NUNITO } from "./kit/fonts";
import { CUES, SCENES, STORY, SUBS, XF } from "./story";
import { clamp01, eback, eio, eout, lerp, ramp, rnd, wobble } from "./kit/helpers";
import { Face, Glow, StoryDefs } from "./kit/parts";
import { Subtitles } from "./kit/Subtitles";

// "Max and the football": a 30 s, 9:16 glass insurance story for Robin Emig, Allianz.
// Everything is drawn in a 1080 x 1920 design space. All timing comes from src/story.ts.

const W = 1080, H = 1920;
const INK = "#2b1d18";
const SKIN = "#f3c39b";
const SHIRT = "#f0a03c"; // Max's orange, same as in the liability film
const PANTS = "#34477a";
const MIA_TOP = "#ffc93c";
const MIA_PANTS = "#3aa59a";
const BALL = "#e8352e"; // Mia's red football: the token
const GLASS = "#bfe3fb";

// Window position in the garden (world units) and the impact point on the glass.
const WIN = { x: 130, y: 470, w: 500, h: 460 };
const IMPACT = { x: 400, y: 700 };
const MAX_POS = { x: 430, y: 1560 };
const MIA_POS = { x: 880, y: 1620 };
const BALL_START = { x: 770, y: 1588 };

// ---------- small helpers ----------
type P = [number, number];
const camT = (cx: number, cy: number, z: number) => `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`;
const camLerp = (t: number, a: [number, number, number], b: [number, number, number], dx = 0, dy = 0) => {
  const e = eio(clamp01(t));
  return camT(lerp(a[0], b[0], e) + dx, lerp(a[1], b[1], e) + dy, Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), e)));
};
const quad = (t: number, p0: P, p1: P, p2: P): P => [
  (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
  (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
];

// ---------- poses ----------
const POSES: Record<string, { L: P; R: P }> = {
  rest: { L: [-82, -228], R: [82, -228] },
  ready: { L: [-165, -300], R: [165, -300] },
  up: { L: [-120, -620], R: [120, -620] },
  head: { L: [-74, -588], R: [74, -588] },
  headKid: { L: [-96, -650], R: [96, -650] },
  give: { L: [-82, -228], R: [175, -330] },
  hold: { L: [-34, -300], R: [34, -300] },
  cheer: { L: [-150, -570], R: [150, -570] },
};
type PoseKey = [number, keyof typeof POSES];
const poseAt = (f: number, keys: PoseKey[]) => {
  let prev = POSES[keys[0][1]], cur = POSES[keys[0][1]], start = -999;
  for (let i = 0; i < keys.length; i++) {
    if (f >= keys[i][0]) {
      prev = i > 0 ? POSES[keys[i - 1][1]] : POSES[keys[i][1]];
      cur = POSES[keys[i][1]];
      start = keys[i][0];
    }
  }
  const t = eio(ramp(f, start, start + 7));
  const mix = (a: P, b: P): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  return { L: mix(prev.L, cur.L), R: mix(prev.R, cur.R) };
};

// ---------- characters ----------
const Arm: React.FC<{ s: P; h: P; coat: string; side: number }> = ({ s, h, coat, side }) => {
  const mx = (s[0] + h[0]) / 2, my = (s[1] + h[1]) / 2;
  const dx = h[0] - s[0], dy = h[1] - s[1];
  const d = Math.max(1, Math.hypot(dx, dy));
  const c: P = [mx + (dy / d) * 26 * side, my - (dx / d) * 26 * side];
  return (
    <g>
      <path d={`M ${s[0]},${s[1]} Q ${c[0]},${c[1]} ${h[0]},${h[1]}`} stroke={coat} strokeWidth={32} fill="none" strokeLinecap="round" />
      <circle cx={h[0]} cy={h[1]} r={17} fill={SKIN} />
    </g>
  );
};

type Mood = "smile" | "happy" | "o" | "sad";

const MaxHead: React.FC<{ f: number; mood: Mood; look: P }> = ({ f, mood, look }) => (
  <g>
    <circle r={64} fill={SKIN} />
    <ellipse cx={58} cy={10} rx={14} ry={18} fill={SKIN} />
    <path d="M -66,4 C -76,-70 -10,-92 44,-66 C 70,-54 70,-30 66,-20 C 40,-46 -10,-50 -44,-26 C -52,-14 -60,-4 -66,4 Z" fill="#5a3825" />
    <path d="M -10,-76 C 0,-96 20,-96 24,-84" stroke="#5a3825" strokeWidth={10} fill="none" strokeLinecap="round" />
    <ellipse cx={-48} cy={8} rx={11} ry={15} fill="#e6ab84" />
    <g transform="translate(14 12)">
      <Face f={f} seed={7} size={9.5} gap={40} look={look} mood={mood} />
    </g>
  </g>
);

const MiaHead: React.FC<{ f: number; mood: Mood; look: P }> = ({ f, mood, look }) => {
  const sway = 6 * wobble(f, 3, 1.2);
  return (
    <g>
      {/* pigtails with red bows (they match her ball) */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`rotate(${sway * s} ${s * 60} -20)`}>
          <ellipse cx={s * 84} cy={10} rx={26} ry={36} fill="#3a2418" />
          <path d={`M ${s * 62},-26 l ${s * 18},-14 l 0,28 Z M ${s * 62},-26 l ${s * -4},-22 l ${s * 22},10 Z`} fill={BALL} />
        </g>
      ))}
      <circle r={62} fill={SKIN} />
      <path d="M -64,6 C -74,-74 74,-82 64,6 C 50,-32 20,-44 -6,-40 C -30,-36 -50,-20 -64,6 Z" fill="#3a2418" />
      <g transform="translate(6 14)">
        <Face f={f} seed={21} size={10} gap={40} look={look} mood={mood} />
      </g>
    </g>
  );
};

// A standing person, facing right (flip for left). Origin = feet on the ground.
const Body: React.FC<{
  f: number; seed: number; coat: string; pants: string; pose: { L: P; R: P }; kick?: number; flip?: boolean;
  head: React.ReactNode; headScale?: number; hold?: React.ReactNode;
}> = ({ f, seed, coat, pants, pose, kick = 0, flip, head, headScale = 1, hold }) => {
  const br = 3 * wobble(f, seed, 0.7);
  const sL: P = [-56, -390 + br], sR: P = [56, -390 + br];
  const hL: P = [pose.L[0], pose.L[1] + br], hR: P = [pose.R[0], pose.R[1] + br];
  return (
    <g transform={flip ? "scale(-1 1)" : undefined}>
      <ellipse cx={0} cy={4} rx={110} ry={14} fill="#000" opacity={0.16} />
      <path d="M -30,-230 L -36,-10" stroke={pants} strokeWidth={42} strokeLinecap="round" />
      <ellipse cx={-30} cy={-6} rx={34} ry={15} fill="#3b2a24" />
      <g transform={`rotate(${kick} 26 -230)`}>
        <path d="M 26,-230 L 34,-10" stroke={pants} strokeWidth={42} strokeLinecap="round" />
        <ellipse cx={44} cy={-6} rx={34} ry={15} fill="#3b2a24" />
      </g>
      <path d={`M -78,-200 C -84,-330 -60,${-420 + br} 0,${-428 + br} C 60,${-420 + br} 84,-330 78,-200 Z`} fill={coat} />
      <g transform={`translate(0 ${-428 + br - 70 * headScale}) scale(${headScale})`}>{head}</g>
      <Arm s={sL} h={hL} coat={coat} side={-1} />
      <Arm s={sR} h={hR} coat={coat} side={1} />
      {hold && <g transform={`translate(${(hL[0] + hR[0]) / 2} ${(hL[1] + hR[1]) / 2 - 20})`}>{hold}</g>}
    </g>
  );
};

const Football: React.FC<{ r?: number; spin?: number }> = ({ r = 32, spin = 0 }) => (
  <g transform={`rotate(${spin})`}>
    <circle r={r} fill={BALL} />
    <path d={`M 0,${-r * 0.32} l ${r * 0.3},${r * 0.22} l ${-r * 0.12},${r * 0.36} l ${-r * 0.36},0 l ${-r * 0.12},${-r * 0.36} Z`} fill="#fff" />
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} transform={`rotate(${a})`} d={`M ${-r * 0.16},${-r * 0.9} l ${r * 0.32},0 l ${r * 0.06},${r * 0.14} l ${-r * 0.44},0 Z`} fill="#fff" />
    ))}
    <circle r={r} fill="none" stroke="#a11d18" strokeWidth={3} />
    <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.22} ry={r * 0.12} fill="#fff" opacity={0.5} transform={`rotate(${-spin} 0 0)`} />
  </g>
);

// ---------- the window ----------
const HOLE = Array.from({ length: 13 }, (_, k) => {
  const a = (k / 13) * Math.PI * 2;
  const r = 52 + rnd(`hole${k}`) * 46;
  return [IMPACT.x - WIN.x + Math.cos(a) * r, IMPACT.y - WIN.y + Math.sin(a) * r * 0.9] as P;
});
const CRACKS = Array.from({ length: 10 }, (_, k) => {
  const a = (k / 10) * Math.PI * 2 + rnd(`ca${k}`) * 0.4;
  const ix = IMPACT.x - WIN.x, iy = IMPACT.y - WIN.y;
  const r1 = 90, r2 = 170 + rnd(`cr${k}`) * 60, r3 = 420;
  const kink = (rnd(`ck${k}`) - 0.5) * 0.5;
  return `M ${ix + Math.cos(a) * r1},${iy + Math.sin(a) * r1} L ${ix + Math.cos(a + kink) * r2},${iy + Math.sin(a + kink) * r2} L ${ix + Math.cos(a) * r3},${iy + Math.sin(a) * r3}`;
});

// Drawn in local units: 0..WIN.w by 0..WIN.h. broken: 0 or more (crack spread), pane: new pane 0..1, shine 0..1.
const Window: React.FC<{ id: string; f: number; broken: number; pane?: number; shine?: number }> = ({ id, f, broken, pane = 0, shine = -1 }) => {
  const g = 28;
  const iw = WIN.w - 2 * g, ih = WIN.h - 2 * g;
  const paneY = lerp(-ih - 40, 0, eout(pane)); // top of the new pane, relative to the glass
  const Room = () => (
    <g>
      <rect x={g} y={g} width={iw} height={ih} fill="#ecd6b8" />
      <rect x={g} y={g + ih * 0.62} width={iw} height={ih * 0.38} fill="#c99f7c" />
      {/* sofa, lamp and a picture inside */}
      <rect x={g + 70} y={g + ih * 0.5} width={260} height={110} rx={30} fill="#5c7fb8" />
      <rect x={g + 60} y={g + ih * 0.42} width={280} height={70} rx={30} fill="#6f92cb" />
      <rect x={g + 300} y={g + 60} width={90} height={70} rx={6} fill="#f7c873" stroke="#a87b4f" strokeWidth={6} />
      <path d={`M ${g + 380},${g + ih * 0.62} L ${g + 380},${g + 210} M ${g + 350},${g + 210} L ${g + 410},${g + 210} L ${g + 395},${g + 170} L ${g + 365},${g + 170} Z`} stroke="#7a5a44" strokeWidth={6} fill="#fff1c9" />
      {/* curtains */}
      <path d={`M ${g},${g} L ${g + 70},${g} C ${g + 60},${g + 160} ${g + 90},${g + 300} ${g + 50},${ih + g} L ${g},${ih + g} Z`} fill="#f2a99b" />
      <path d={`M ${g + iw},${g} L ${g + iw - 70},${g} C ${g + iw - 60},${g + 160} ${g + iw - 90},${g + 300} ${g + iw - 50},${ih + g} L ${g + iw},${ih + g} Z`} fill="#f2a99b" />
    </g>
  );
  const holeD = `M ${HOLE.map((p) => p.join(",")).join(" L ")} Z`;
  const reflection = (
    <g opacity={0.55}>
      <path d={`M ${g + 40},${g + ih - 40} L ${g + 230},${g + 30}`} stroke="#fff" strokeWidth={34} strokeLinecap="round" opacity={0.5} />
      <path d={`M ${g + 120},${g + ih - 20} L ${g + 290},${g + 60}`} stroke="#fff" strokeWidth={14} strokeLinecap="round" opacity={0.5} />
    </g>
  );
  return (
    <g>
      <rect x={-8} y={-8} width={WIN.w + 16} height={WIN.h + 16} rx={14} fill="#000" opacity={0.08} />
      <rect x={0} y={0} width={WIN.w} height={WIN.h} rx={10} fill="#fbfaf5" />
      <clipPath id={`${id}-glass`}><rect x={g} y={g} width={iw} height={ih} /></clipPath>
      <mask id={`${id}-hole`}>
        <rect x={0} y={0} width={WIN.w} height={WIN.h} fill="#fff" />
        {broken > 0 && <path d={holeD} fill="#000" />}
      </mask>
      <clipPath id={`${id}-below`}><rect x={g} y={g + paneY + ih} width={iw} height={ih * 2} /></clipPath>
      <g clipPath={`url(#${id}-glass)`}>
        <Room />
        {/* old glass: the part not yet covered by the new pane */}
        <g clipPath={pane > 0 ? `url(#${id}-below)` : undefined}>
          <g mask={`url(#${id}-hole)`}>
            <rect x={g} y={g} width={iw} height={ih} fill={GLASS} opacity={0.55} />
            {reflection}
          </g>
          {broken > 0 && (
            <g>
              <path d={holeD} fill="none" stroke="#ffffff" strokeWidth={5} strokeLinejoin="round" opacity={0.9} />
              {CRACKS.map((d, k) => (
                <path key={k} d={d} stroke="#ffffff" strokeWidth={4} fill="none" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - clamp01(broken)} opacity={0.95} />
              ))}
            </g>
          )}
        </g>
        {pane > 0 && (
          <g transform={`translate(0 ${paneY})`}>
            <rect x={g} y={g} width={iw} height={ih} fill={GLASS} opacity={0.55} />
            {reflection}
            <rect x={g} y={g + ih - 6} width={iw} height={6} fill="#ffffff" opacity={0.6} />
          </g>
        )}
        {shine >= 0 && shine <= 1 && (
          <path d={`M ${lerp(-200, WIN.w + 200, shine)},${g - 40} l 90,0 l -260,${ih + 80} l -90,0 Z`} fill="#fff" opacity={0.6 * Math.sin(shine * Math.PI)} />
        )}
      </g>
      {/* frame bars and sill */}
      <rect x={g - 6} y={g - 6} width={iw + 12} height={ih + 12} fill="none" stroke="#e6e2d6" strokeWidth={6} />
      <rect x={-24} y={WIN.h - 4} width={WIN.w + 48} height={30} rx={8} fill="#e9e4d8" />
      <rect x={-24} y={WIN.h + 18} width={WIN.w + 48} height={8} rx={4} fill="#000" opacity={0.08} />
      {/* flower box */}
      <rect x={30} y={WIN.h + 26} width={WIN.w - 60} height={56} rx={10} fill="#b65a45" />
      {Array.from({ length: 9 }, (_, k) => {
        const x = 70 + k * 46, sw = 4 * Math.sin(f * 0.08 + k);
        const c = ["#ff6b8a", "#ffd34d", "#ffffff"][k % 3];
        return (
          <g key={k} transform={`translate(${x} ${WIN.h + 30}) rotate(${sw})`}>
            <path d="M 0,0 L 0,-40" stroke="#4f9a3c" strokeWidth={6} />
            {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 11} cy={-44 + Math.sin((a * Math.PI) / 180) * 11} r={9} fill={c} />)}
            <circle cx={0} cy={-44} r={7} fill="#f0a03c" />
          </g>
        );
      })}
    </g>
  );
};

// ---------- the garden ----------
const Clouds: React.FC<{ f: number }> = ({ f }) => (
  <g>
    {[0, 1, 2].map((k) => {
      const x = ((rnd(`cx${k}`) * 1400 + f * (0.5 + k * 0.2)) % 1500) - 250;
      const y = 120 + k * 110;
      return (
        <g key={k} transform={`translate(${x} ${y}) scale(${0.8 + k * 0.1})`} fill="#ffffff" opacity={0.9}>
          <ellipse rx={150} ry={56} />
          <ellipse cx={-90} cy={18} rx={100} ry={44} />
          <ellipse cx={95} cy={16} rx={110} ry={46} />
          <ellipse cx={20} cy={-36} rx={90} ry={56} />
        </g>
      );
    })}
  </g>
);

const Garden: React.FC<{ f: number; children?: React.ReactNode; window: React.ReactNode }> = ({ f, children, window }) => (
  <g>
    <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#8fcbf2" />
      <stop offset="1" stopColor="#fde7c6" />
    </linearGradient>
    <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="url(#skyG)" />
    <Glow x={950} y={180} r={300} />
    <circle cx={950} cy={180} r={70} fill="#ffe08a" />
    <Clouds f={f} />
    {/* tree on the right, behind the house corner */}
    <g transform={`translate(1000 1330) rotate(${1.2 * wobble(f, 5, 0.4)} 0 0)`}>
      <rect x={-26} y={-420} width={52} height={430} rx={18} fill="#8a5a3c" />
      {[[-90, -480, 150], [80, -520, 160], [0, -640, 170], [-40, -380, 120], [110, -390, 110]].map(([x, y, r], k) => (
        <circle key={k} cx={x} cy={y} r={r} fill={k % 2 ? "#5fae4e" : "#6dbd57"} />
      ))}
    </g>
    {/* house wall and roof edge */}
    <rect x={-200} y={360} width={1080} height={1060} fill="#f3dcc0" />
    <rect x={-200} y={360} width={1080} height={40} fill="#000" opacity={0.06} />
    <rect x={-220} y={300} width={1120} height={70} fill="#b65a45" />
    {Array.from({ length: 16 }, (_, k) => <circle key={k} cx={-200 + k * 72} cy={370} r={36} fill="#a44e3b" />)}
    <rect x={860} y={360} width={20} height={1060} fill="#000" opacity={0.07} />
    {/* drainpipe */}
    <rect x={770} y={380} width={22} height={1000} rx={10} fill="#c9c1b4" />
    <g transform={`translate(${WIN.x} ${WIN.y})`}>{window}</g>
    {/* hedge and lawn */}
    <linearGradient id="lawnG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#8fd16a" />
      <stop offset="1" stopColor="#56a845" />
    </linearGradient>
    <rect x={-400} y={1380} width={W + 800} height={H} fill="url(#lawnG)" />
    {Array.from({ length: 14 }, (_, k) => <circle key={k} cx={-80 + k * 90} cy={1380} r={64} fill={k % 2 ? "#4f9a3c" : "#5aa846"} />)}
    {Array.from({ length: 26 }, (_, k) => {
      const x = rnd(`gx${k}`) * W, y = 1480 + rnd(`gy${k}`) * 420, s = 3 * Math.sin(f * 0.07 + k);
      return <path key={k} d={`M ${x - 10},${y} q 4,-20 ${8 + s},-28 M ${x},${y} q 2,-22 ${s},-34 M ${x + 10},${y} q -4,-20 ${-8 + s},-28`} stroke="#4c9a3a" strokeWidth={5} fill="none" strokeLinecap="round" />;
    })}
    {/* jumpers as goalposts */}
    {[230, 640].map((x) => (
      <g key={x} transform={`translate(${x} 1575)`}>
        <ellipse rx={56} ry={16} fill="#000" opacity={0.12} />
        <path d="M -50,0 C -50,-30 50,-30 50,0 Z" fill={x < 400 ? "#5c7fb8" : "#c94b6d"} />
      </g>
    ))}
    {children}
  </g>
);

// ---------- scenes ----------
const ballAt = (f: number): { p: P; s: number } => {
  const lin = ramp(f, CUES.kick, CUES.impact);
  const s = clamp01(lin + (0.5 / (2 * Math.PI)) * Math.sin(2 * Math.PI * lin)); // fast, floaty top, fast
  return { p: quad(s, [BALL_START.x, BALL_START.y], [560, 300], [IMPACT.x, IMPACT.y]), s };
};

const SceneGarden: React.FC<{ f: number }> = ({ f }) => {
  const hit = f >= CUES.impact;
  const since = f - CUES.impact;
  // camera: slow push in, a shake on impact, then a push toward the window
  const shake = hit ? Math.sin(since * 2.3) * 16 * (1 - ramp(f, CUES.impact, CUES.impact + 14)) : 0;
  const cam = f < CUES.impact
    ? camLerp(ramp(f, 0, CUES.kick), [540, 1000, 1.0], [560, 1010, 1.05])
    : camLerp(ramp(f, CUES.impact + 4, CUES.sceneWho + XF), [560, 1010, 1.05], [420, 860, 1.25], shake, shake * 0.5);
  // Mia's kick: back swing, then forward
  const kick = f < CUES.kick ? 35 * eio(ramp(f, CUES.kick - 18, CUES.kick - 4)) : lerp(-60, 0, eout(ramp(f, CUES.kick, CUES.kick + 24))) * ramp(f, CUES.kick - 4, CUES.kick);
  const jump = -120 * Math.sin(Math.PI * ramp(f, CUES.maxJump, CUES.maxJump + 26));
  const ball = ballAt(f);
  const ballVisible = !hit || since < 6;
  const maxPose = poseAt(f, [[0, "ready"], [CUES.maxJump - 4, "up"], [CUES.impact + 2, "head"]]);
  const miaPose = poseAt(f, [[0, "rest"], [CUES.kick + 8, "cheer"], [CUES.impact + 2, "headKid"]]);
  const lookUp = ramp(f, CUES.kick, CUES.kick + 20);
  return (
    <g transform={cam}>
      <Garden f={f} window={<Window id="wg" f={f} broken={hit ? eout(ramp(f, CUES.impact, CUES.impact + 8)) : 0} />}>
        <g transform={`translate(${MAX_POS.x} ${MAX_POS.y + jump})`}>
          <Body f={f} seed={7} coat={SHIRT} pants={PANTS} pose={maxPose}
            head={<MaxHead f={f} mood={hit ? "o" : f > CUES.maxJump + 20 ? "o" : "smile"} look={hit ? [-0.8, -1] : [lerp(0.8, -0.6, lookUp), lerp(0.2, -1, lookUp)]} />} />
        </g>
        <g transform={`translate(${MIA_POS.x} ${MIA_POS.y}) scale(0.68)`}>
          <Body f={f} seed={21} coat={MIA_TOP} pants={MIA_PANTS} pose={miaPose} kick={-kick} flip headScale={1.35}
            head={<MiaHead f={f} mood={hit ? "o" : f > CUES.kick ? "happy" : "smile"} look={[0.6, lerp(0, -1, lookUp)]} />} />
        </g>
        {ballVisible && (
          <g transform={`translate(${ball.p[0]} ${ball.p[1]}) scale(${hit ? 1 - since / 6 : 1})`}>
            <Football spin={-ball.s * 900} />
          </g>
        )}
        {/* motion lines behind the ball */}
        {f > CUES.kick && !hit && [0.04, 0.08, 0.12].map((d, k) => {
          const q = ballAt(f - 3 - k * 3).p;
          return <circle key={k} cx={q[0]} cy={q[1]} r={22 - k * 6} fill="#fff" opacity={0.35 - k * 0.1} />;
        })}
        {/* flying shards */}
        {hit && since < 50 && Array.from({ length: 16 }, (_, k) => {
          const a = rnd(`sa${k}`) * Math.PI * 2;
          const v = 6 + rnd(`sv${k}`) * 10;
          const x = IMPACT.x + Math.cos(a) * v * since;
          const y = IMPACT.y + Math.sin(a) * v * since * 0.7 + 0.5 * 0.9 * since * since;
          const s = 10 + rnd(`ss${k}`) * 16;
          return (
            <path key={k} transform={`translate(${x} ${y}) rotate(${since * (8 + k)})`} d={`M 0,${-s} L ${s * 0.7},${s * 0.6} L ${-s * 0.6},${s * 0.4} Z`} fill="#e6f5ff" stroke="#ffffff" strokeWidth={2} opacity={1 - since / 50} />
          );
        })}
        {/* a "crash" burst */}
        {hit && since < 16 && (
          <g transform={`translate(${IMPACT.x} ${IMPACT.y}) scale(${eout(ramp(f, CUES.impact, CUES.impact + 6))})`} opacity={1 - ramp(f, CUES.impact + 8, CUES.impact + 16)}>
            {Array.from({ length: 10 }, (_, k) => (
              <path key={k} transform={`rotate(${k * 36})`} d="M 0,-120 L 14,-190 L -14,-190 Z" fill="#fff6c2" />
            ))}
          </g>
        )}
      </Garden>
    </g>
  );
};

// An insurance card that can be crossed out.
const Card: React.FC<{ y: number; inAt: number; crossAt: number; f: number; title: string; de: string; note: string; color: string }> = ({ y, inAt, crossAt, f, title, de, note, color }) => {
  const enter = eback(ramp(f, inAt, inAt + 16));
  const cross = ramp(f, crossAt, crossAt + 10);
  const dim = 1 - 0.35 * ramp(f, crossAt + 6, crossAt + 16);
  const bob = 4 * Math.sin(f * 0.07 + y);
  return (
    <g transform={`translate(${lerp(-1000, 0, enter)} ${y + bob})`} opacity={clamp01(enter * 2)}>
      <rect x={100} y={8} width={880} height={230} rx={36} fill="#000" opacity={0.12} />
      <rect x={100} y={0} width={880} height={230} rx={36} fill="#ffffff" />
      <g opacity={dim}>
        <g transform="translate(205 115)">
          <path d="M 0,-74 C 26,-60 50,-56 66,-56 C 66,0 52,48 0,80 C -52,48 -66,0 -66,-56 C -50,-56 -26,-60 0,-74 Z" fill={color} />
          <path d="M -24,0 L -6,18 L 28,-18" stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <text x={310} y={92} fontFamily={NUNITO} fontWeight={900} fontSize={54} fill="#1d2a4d">{title}</text>
        <text x={310} y={142} fontFamily={NUNITO} fontWeight={700} fontSize={36} fill="#7a84a0" fontStyle="italic">{de}</text>
        <text x={310} y={192} fontFamily={NUNITO} fontWeight={700} fontSize={34} fill="#4a5578">{note}</text>
      </g>
      {cross > 0 && (
        <g stroke="#e0352c" strokeWidth={22} strokeLinecap="round" opacity={0.92}>
          <path d="M 150,30 L 930,200" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - eout(clamp01(cross * 2))} fill="none" />
          <path d="M 930,30 L 150,200" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - eout(clamp01(cross * 2 - 1))} fill="none" />
        </g>
      )}
    </g>
  );
};

const SceneWho: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneWho;
  const q = eback(ramp(f, CUES.sceneWho + 4, CUES.sceneWho + 18));
  const qOut = eio(ramp(f, CUES.cardLiab - 10, CUES.cardLiab + 4));
  const cardsOut = eio(ramp(f, CUES.shield - 6, CUES.shield + 10));
  const sh = eback(ramp(f, CUES.shield, CUES.shield + 18));
  const happy = f >= CUES.shield + 6;
  return (
    <g transform={camLerp(t / (CUES.sceneFix - CUES.sceneWho), [540, 960, 1.04], [540, 960, 1.0])}>
      <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="#fdf1de" />
      {Array.from({ length: 14 }, (_, k) => (
        <rect key={k} x={k * 90 - 60} y={-400} width={40} height={H + 800} fill="#f7e4c7" opacity={0.7} />
      ))}
      <Glow x={540} y={820} r={700} opacity={0.5} />
      {/* drifting dust */}
      {Array.from({ length: 18 }, (_, k) => {
        const y = ((rnd(`dy${k}`) * H - t * (0.6 + rnd(`dv${k}`))) % H + H) % H;
        return <circle key={k} cx={rnd(`dx${k}`) * W} cy={y} r={3 + rnd(`dr${k}`) * 5} fill="#e9c58f" opacity={0.5} />;
      })}
      {/* the broken window, small, at the top */}
      <g transform={`translate(${540 - WIN.w * 0.62} ${170 + 6 * Math.sin(t * 0.06)}) scale(0.62) rotate(${1.5 * Math.sin(t * 0.05)} ${WIN.w / 2} ${WIN.h / 2})`}>
        <Window id="ww" f={f} broken={1} />
      </g>
      {/* "Who pays?" */}
      <g transform={`translate(540 ${lerp(820, 700, qOut)}) scale(${q * (1 - qOut)})`} opacity={1 - qOut}>
        <text x={0} y={40} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={150} fill="#1d2a4d">Who pays?</text>
      </g>
      <g transform={`translate(0 ${lerp(0, 1100, cardsOut)})`} opacity={1 - cardsOut}>
        <Card f={f} y={640} inAt={CUES.cardLiab} crossAt={CUES.crossLiab} title="Liability insurance" de="Haftpflicht" note="Only damage to others" color="#7a84a0" />
        <Card f={f} y={920} inAt={CUES.cardHome} crossAt={CUES.crossHome} title="Contents insurance" de="Hausrat" note="Usually not broken windows" color="#7a84a0" />
      </g>
      {/* the glass insurance shield */}
      {f >= CUES.shield && (
        <g transform={`translate(540 ${880}) scale(${sh})`} opacity={clamp01(sh * 1.5)}>
          <Glow x={0} y={0} r={460} warm={false} />
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2 + t * 0.01;
            const r = 300 + 20 * Math.sin(t * 0.2 + k);
            return <path key={k} transform={`translate(${Math.cos(a) * r} ${Math.sin(a) * r}) rotate(${t * 2 + k * 30}) scale(${0.6 + 0.4 * Math.sin(t * 0.15 + k)})`} d="M 0,-20 L 6,-6 L 20,0 L 6,6 L 0,20 L -6,6 L -20,0 L -6,-6 Z" fill="#ffffff" opacity={0.9} />;
          })}
          <path d="M 0,-250 C 80,-210 150,-200 205,-200 C 205,-30 168,140 0,250 C -168,140 -205,-30 -205,-200 C -150,-200 -80,-210 0,-250 Z" fill="#8fd3ff" opacity={0.5} stroke="#ffffff" strokeWidth={14} />
          <path d="M -150,-160 L -60,-200 L -150,40 Z" fill="#fff" opacity={0.35} />
          <path d="M -70,0 L -15,55 L 90,-60" stroke="#ffffff" strokeWidth={28} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <text x={0} y={340} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={76} fill="#0c2f6b">Glass insurance</text>
          <text x={0} y={400} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={46} fill="#2f78d6" fontStyle="italic">Glasversicherung</text>
        </g>
      )}
      {/* Max and Mia peek in from the bottom, under the subtitles */}
      <g transform={`translate(330 ${1780 + 6 * wobble(f, 2)}) scale(1.25)`}>
        <path d="M -90,150 C -90,80 -50,70 0,70 C 50,70 90,80 90,150 Z" fill={SHIRT} />
        <MaxHead f={f} mood={happy ? "happy" : "sad"} look={[0.4, -1]} />
      </g>
      <g transform={`translate(760 ${1800 + 6 * wobble(f, 9)}) scale(1.0)`}>
        <path d="M -80,150 C -80,80 -45,70 0,70 C 45,70 80,80 80,150 Z" fill={MIA_TOP} />
        <g transform="scale(-1 1)"><MiaHead f={f} mood={happy ? "happy" : "sad"} look={[0.4, -1]} /></g>
      </g>
    </g>
  );
};

const SceneFix: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneFix;
  const pane = ramp(f, CUES.pane, CUES.pane + 22);
  const shine = ramp(f, CUES.pane + 24, CUES.pane + 46);
  const give = eio(ramp(f, CUES.ballBack, CUES.ballBack + 14));
  const maxPose = poseAt(f, [[0, "give"], [CUES.ballBack + 10, "cheer"]]);
  const miaPose = poseAt(f, [[0, "rest"], [CUES.ballBack + 6, "hold"]]);
  const miaJump = f > CUES.ballBack + 16 ? -50 * Math.abs(Math.sin((f - CUES.ballBack - 16) * 0.16)) : 0;
  const maxX = 430, miaX = 830;
  // ball from Max's hand to Mia's arms
  const from: P = [maxX + 175, MAX_POS.y - 330 - 20];
  const to: P = [miaX - 0, MIA_POS.y - 300 * 0.68 - 20 + miaJump];
  const bp = quad(give, from, [(from[0] + to[0]) / 2, from[1] - 160], to);
  return (
    <g transform={camLerp(ramp(f, CUES.sceneFix, CUES.sceneFix + 70), [400, 820, 1.3], [560, 1040, 1.02])}>
      <Garden f={f} window={<Window id="wf" f={f} broken={1} pane={pane} shine={shine > 0 && shine < 1 ? shine : -1} />}>
        {/* sparkles on the new pane */}
        {shine > 0 && Array.from({ length: 6 }, (_, k) => {
          const p = ((t * 0.04 + k / 6) % 1);
          const x = WIN.x + 60 + rnd(`px${k}`) * (WIN.w - 120), y = WIN.y + 60 + rnd(`py${k}`) * (WIN.h - 120);
          return <path key={k} transform={`translate(${x} ${y}) scale(${Math.sin(p * Math.PI) * 1.4})`} d="M 0,-24 L 7,-7 L 24,0 L 7,7 L 0,24 L -7,7 L -24,0 L -7,-7 Z" fill="#ffffff" />;
        })}
        <g transform={`translate(${maxX} ${MAX_POS.y})`}>
          <Body f={f} seed={7} coat={SHIRT} pants={PANTS} pose={maxPose} head={<MaxHead f={f} mood="happy" look={[0.8, -0.3]} />} />
        </g>
        <g transform={`translate(${miaX} ${MIA_POS.y + miaJump}) scale(0.68)`}>
          <Body f={f} seed={21} coat={MIA_TOP} pants={MIA_PANTS} pose={miaPose} flip headScale={1.35}
            head={<MiaHead f={f} mood={f >= CUES.ballBack ? "happy" : "smile"} look={[0.7, -0.3]} />} />
        </g>
        <g transform={`translate(${bp[0]} ${bp[1]})`}>
          <Football spin={give * 360} />
        </g>
      </Garden>
    </g>
  );
};

const SceneCard: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneCard;
  const up = eback(ramp(f, CUES.sceneCard + 2, CUES.sceneCard + 22));
  const line = (a: number) => eout(ramp(f, CUES.sceneCard + a, CUES.sceneCard + a + 12));
  const pulse = 1 + 0.03 * Math.sin(t * 0.25) * ramp(f, CUES.sceneCard + 50, CUES.sceneCard + 60);
  const bounce = Math.abs(Math.sin(t * 0.12));
  return (
    <g>
      <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0c2f6b" />
        <stop offset="1" stopColor="#2f78d6" />
      </linearGradient>
      <rect width={W} height={H} fill="url(#cardBg)" />
      {Array.from({ length: 30 }, (_, k) => {
        const y = ((rnd(`by${k}`) * H - t * (1 + rnd(`bv${k}`) * 2)) % H + H) % H;
        return <circle key={k} cx={rnd(`bx${k}`) * W} cy={y} r={3 + rnd(`br${k}`) * 6} fill="#fff" opacity={0.15} />;
      })}
      <g transform={`translate(0 ${lerp(900, 0, up)})`}>
        <rect x={90} y={560} width={900} height={720} rx={48} fill="#000" opacity={0.18} transform="translate(0 16)" />
        <rect x={90} y={560} width={900} height={720} rx={48} fill="#ffffff" />
        <g opacity={line(8)} transform={`translate(0 ${20 * (1 - line(8))})`}>
          <text x={540} y={680} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Glass breaks fast.</text>
          <text x={540} y={740} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Talk to</text>
        </g>
        <g opacity={line(18)} transform={`translate(0 ${20 * (1 - line(18))})`}>
          <text x={540} y={870} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={110} fill="#0c2f6b">Robin Emig</text>
          <text x={540} y={955} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={62} fill="#2f78d6">Allianz</text>
        </g>
        <rect x={240} y={1010} width={600} height={6} rx={3} fill="#e3e8f2" opacity={line(30)} />
        <g opacity={line(34)} transform={`translate(540 1140) scale(${pulse})`}>
          <rect x={-400} y={-70} width={800} height={130} rx={65} fill="#eaf2ff" />
          <g transform="translate(-345 -6)">
            <path d="M -22,-34 C -32,-34 -38,-26 -36,-16 C -30,14 -8,36 22,40 C 32,42 40,36 40,26 L 40,14 C 40,8 36,4 30,4 L 18,4 C 12,4 10,10 8,14 C -4,10 -14,0 -18,-12 C -12,-14 -8,-18 -8,-24 L -8,-36 C -8,-42 -12,-44 -18,-44 Z" fill="#2f78d6" transform="translate(0 6)" />
          </g>
          <text x={45} y={22} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={66} fill="#0c2f6b">+49 160 97626099</text>
        </g>
      </g>
      <text x={540} y={1360} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={34} fill="#ffffff" opacity={0.85 * line(44)}>Example. Cover depends on your policy.</text>
      {/* Mia's red football, one last time */}
      <g opacity={line(40)}>
        <ellipse cx={540} cy={1640} rx={lerp(50, 80, 1 - bounce)} ry={12} fill="#000" opacity={0.25} />
        <g transform={`translate(540 ${1600 - 170 * bounce})`}>
          <Football r={44} spin={t * 4} />
        </g>
      </g>
    </g>
  );
};

const SCENE_COMPONENTS: Record<string, React.FC<{ f: number }>> = {
  garden: SceneGarden,
  who: SceneWho,
  fix: SceneFix,
  card: SceneCard,
};

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = STORY;
  const fade = Math.max(1 - ramp(f, 0, 8), ramp(f, STORY.durationFrames - 8, STORY.durationFrames - 1));
  const subsOn = f < CUES.sceneCard;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1030" }}>
      <svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        <StoryDefs />
        {SCENES.map(([name, a, b], i) => {
          const isLast = i === SCENES.length - 1;
          if (f < a || f >= b + (isLast ? 0 : XF)) return null;
          const o = i === 0 ? 1 : ramp(f, a, a + XF);
          const C = SCENE_COMPONENTS[name];
          return (
            <g key={name} opacity={o}>
              <C f={f} />
            </g>
          );
        })}
        {subsOn && <rect y={H * 0.7} width={W} height={H * 0.3} fill="url(#subScrim)" opacity={0.5} />}
      </svg>
      {subsOn && <Subtitles f={f} subs={SUBS} width={width} height={height} />}
      {STORY.audio && <Audio src={staticFile(STORY.audio)} />}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
