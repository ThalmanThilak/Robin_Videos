import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { NUNITO } from "./kit/fonts";
import { CUES, SCENES, SEAM_Y, STORY, SUBS, SUBS_ON_SEAM, XF } from "./story";
import { clamp01, eback, eio, eout, lerp, ramp, rnd, wobble } from "./kit/helpers";
import { Face, Glow, StoryDefs } from "./kit/parts";
import { Subtitles } from "./kit/Subtitles";

// "Tom's key": a 30 s, 9:16 term life insurance (Risikolebensversicherung) story for Robin Emig, Allianz.
// Everything is drawn in a 1080 x 1920 design space. All timing comes from src/story.ts.

const W = 1080, H = 1920;
const INK = "#2b1d18";
const SKIN = "#f3c39b";
const GOLD = "#f2c84b", GOLD_D = "#c9a227";
const HEART = "#e8352e";

// ---------- small helpers ----------
const camT = (cx: number, cy: number, z: number) => `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`;
const camLerp = (t: number, a: [number, number, number], b: [number, number, number]) => {
  const e = eio(clamp01(t));
  return camT(lerp(a[0], b[0], e), lerp(a[1], b[1], e), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), e)));
};
const heartPath = (cx: number, cy: number, s: number) =>
  `M ${cx},${cy + 0.35 * s} C ${cx - 1.1 * s},${cy - 0.35 * s} ${cx - 0.55 * s},${cy - 1.15 * s} ${cx},${cy - 0.5 * s} C ${cx + 0.55 * s},${cy - 1.15 * s} ${cx + 1.1 * s},${cy - 0.35 * s} ${cx},${cy + 0.35 * s} Z`;
const star = (s: number) => `M 0,${-s} L ${s * 0.22},${-s * 0.22} L ${s},0 L ${s * 0.22},${s * 0.22} L 0,${s} L ${-s * 0.22},${s * 0.22} L ${-s},0 L ${-s * 0.22},${-s * 0.22} Z`;
// A swing that rings out over 24 frames after frame a (for the key jingles).
const ringOut = (f: number, a: number, amp = 26) => (f >= a && f < a + 26 ? Math.sin((f - a) * 1.25) * amp * (1 - (f - a) / 26) : 0);

const SkyGrad: React.FC<{ id: string; top: string; bottom: string; w?: number; h?: number }> = ({ id, top, bottom, w = W, h = H }) => (
  <>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={top} />
      <stop offset="1" stopColor={bottom} />
    </linearGradient>
    <rect x={-400} y={-400} width={w + 800} height={h + 800} fill={`url(#${id})`} />
  </>
);

const Clouds: React.FC<{ f: number; dark: boolean; y0?: number; n?: number; scale?: number }> = ({ f, dark, y0 = 140, n = 4, scale = 1 }) => (
  <g>
    {Array.from({ length: n }, (_, k) => {
      const x = ((rnd(`cx${k}`) * 1400 + f * (0.6 + k * 0.2)) % 1500) - 250;
      const y = y0 + k * 110 * scale;
      return (
        <g key={k} transform={`translate(${x} ${y}) scale(${scale})`} fill={dark ? "#8d8ea3" : "#ffffff"} opacity={dark ? 0.95 : 0.9}>
          <ellipse rx={150} ry={60} />
          <ellipse cx={-90} cy={20} rx={100} ry={48} />
          <ellipse cx={95} cy={18} rx={110} ry={50} />
          <ellipse cx={20} cy={-40} rx={90} ry={60} />
        </g>
      );
    })}
  </g>
);

const Rain: React.FC<{ f: number; w: number; h: number; n?: number }> = ({ f, w, h, n = 50 }) => (
  <g opacity={0.5}>
    {Array.from({ length: n }, (_, k) => {
      const x0 = rnd(`rx${k}`) * (w + 200) - 100;
      const sp = 30 + rnd(`rs${k}`) * 14;
      const y = ((rnd(`ry${k}`) * h + f * sp) % (h + 120)) - 60;
      return <line key={k} x1={x0 - y * 0.1} y1={y} x2={x0 - y * 0.1 - 6} y2={y + 34} stroke="#e6eefc" strokeWidth={3.5} strokeLinecap="round" />;
    })}
  </g>
);

const Birds: React.FC<{ f: number }> = ({ f }) => (
  <g stroke="#4a4a5c" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7}>
    {[0, 1].map((k) => {
      const x = ((f * (2.2 + k * 0.5) + k * 380) % 1500) - 200;
      const y = 300 + k * 70 + 14 * Math.sin(f * 0.05 + k);
      const flap = 10 * Math.sin(f * 0.5 + k * 2);
      return <path key={k} d={`M ${x - 22},${y - flap} Q ${x - 10},${y - 10} ${x},${y} Q ${x + 10},${y - 10} ${x + 22},${y - flap}`} />;
    })}
  </g>
);

// ---------- props ----------
// The token: a house key on a ring with a red heart charm. Origin = top of the ring; it hangs down.
const Key: React.FC<{ swing?: number; glint?: number }> = ({ swing = 0, glint = 0 }) => (
  <g transform={`rotate(${swing})`}>
    <circle cx={0} cy={12} r={13} fill="none" stroke={GOLD_D} strokeWidth={5} />
    <path d={heartPath(-20, 40, 16)} fill={HEART} />
    <path d={heartPath(-23, 35, 5)} fill="#fff" opacity={0.5} />
    <circle cx={6} cy={46} r={21} fill={GOLD} stroke={GOLD_D} strokeWidth={4} />
    <circle cx={6} cy={46} r={7} fill={GOLD_D} />
    <rect x={0} y={64} width={12} height={78} rx={4} fill={GOLD} stroke={GOLD_D} strokeWidth={3} />
    <rect x={10} y={112} width={16} height={9} rx={2} fill={GOLD} stroke={GOLD_D} strokeWidth={2.5} />
    <rect x={10} y={127} width={12} height={9} rx={2} fill={GOLD} stroke={GOLD_D} strokeWidth={2.5} />
    {glint > 0 && (
      <g transform={`translate(18 40) scale(${0.4 + glint})`} opacity={1 - Math.abs(glint - 0.5) * 2 + 0.2}>
        <path d={star(26)} fill="#fff" />
      </g>
    )}
  </g>
);

const Envelope: React.FC = () => (
  <g>
    <rect x={-70} y={-45} width={140} height={90} rx={6} fill="#fffaf0" stroke="#cfc6b0" strokeWidth={3} />
    <path d="M -70,-45 L 0,4 L 70,-45" fill="none" stroke="#cfc6b0" strokeWidth={3} />
    <text x={0} y={34} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={22} fill="#c4372f">BANK</text>
  </g>
);

const LoanPaper: React.FC<{ len: number; w: number; id: string; stamp?: number }> = ({ len, w, id, stamp = 0 }) => (
  <g>
    <rect x={-w / 2 + 8} y={10} width={w} height={len} fill="#000" opacity={0.12} />
    <rect x={-w / 2} y={0} width={w} height={len} fill="#ffffff" />
    <clipPath id={id}><rect x={-w / 2} y={0} width={w} height={len} /></clipPath>
    <g clipPath={`url(#${id})`}>
      <text x={0} y={w * 0.25} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={w * 0.15} fill="#c4372f">BANK LOAN</text>
      <rect x={-w / 2 + 24} y={w * 0.32} width={w - 48} height={5} fill="#c4372f" opacity={0.6} />
      {Array.from({ length: 14 }, (_, k) => (
        <rect key={k} x={-w / 2 + 24} y={w * 0.42 + k * w * 0.16} width={(w - 48) * (k % 3 === 2 ? 0.6 : 0.9)} height={w * 0.05} rx={w * 0.025} fill="#c9c6d4" />
      ))}
    </g>
    <rect x={-w / 2 - 14} y={-24} width={w + 28} height={36} rx={18} fill="#eae6dc" />
    <rect x={-w / 2 - 14} y={-18} width={w + 28} height={8} rx={4} fill="#fff" opacity={0.7} />
    {stamp > 0 && (
      <g transform={`translate(0 ${Math.min(len, w * 1.3) * 0.6}) rotate(-16) scale(${lerp(2.2, 1, eout(stamp))})`} opacity={clamp01(stamp * 2)}>
        <rect x={-w * 0.42} y={-w * 0.17} width={w * 0.84} height={w * 0.34} rx={12} fill="#ffffff" opacity={0.6} stroke="#1e9e5a" strokeWidth={10} />
        <text x={0} y={w * 0.1} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={w * 0.26} fill="#1e9e5a">PAID</text>
      </g>
    )}
  </g>
);

const SaleSign: React.FC = () => (
  <g>
    <rect x={-9} y={-230} width={18} height={230} fill="#7a5a44" />
    <rect x={-140} y={-250} width={280} height={96} rx={10} fill="#ffffff" stroke="#c4372f" strokeWidth={8} />
    <text x={0} y={-218} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={30} fill="#c4372f">ZU</text>
    <text x={0} y={-176} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={34} fill="#c4372f">VERKAUFEN</text>
  </g>
);

// The name of the cover, in German, on a ribbon with a shield.
const Badge: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <Glow x={0} y={0} r={420} warm opacity={0.7} />
    <rect x={-400} y={-50} width={800} height={100} rx={50} fill="#ffffff" />
    <rect x={-400} y={-50} width={800} height={100} rx={50} fill="none" stroke="#2f78d6" strokeWidth={6} />
    <text x={44} y={17} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={46} fill="#0c2f6b">Risikolebensversicherung</text>
    <g transform={`translate(-372 0) scale(${1 + 0.03 * Math.sin(f * 0.2)})`}>
      <path d="M 0,-74 C 26,-60 50,-58 66,-58 C 66,0 54,50 0,82 C -54,50 -66,0 -66,-58 C -50,-58 -26,-60 0,-74 Z" fill="#2f78d6" stroke="#ffffff" strokeWidth={8} />
      <path d={heartPath(0, 10, 30)} fill="#ffffff" />
    </g>
  </g>
);

// ---------- the house ----------
type HouseMood = "sun" | "grey" | "gold";
const HOUSE_PAL: Record<HouseMood, { wall: string; roof: string; door: string; win: string; bush: string; trim: string }> = {
  sun: { wall: "#f6e3c4", roof: "#d8614c", door: "#3d8f86", win: "#cfe9ff", bush: "#6db36a", trim: "#ffffff" },
  grey: { wall: "#b9b6be", roof: "#7d6f78", door: "#5c7471", win: "#8d97a8", bush: "#6f8a74", trim: "#d7d5db" },
  gold: { wall: "#f9dcb4", roof: "#d9573f", door: "#3d8f86", win: "#ffe2a0", bush: "#6aa964", trim: "#fff4e0" },
};

// Origin = ground under the middle of the house. 700 units wide, about 1000 tall.
const House: React.FC<{ mood: HouseMood; f: number; doorOpen?: number; keyInLock?: number; lockTurn?: number; keySwing?: number }> = ({ mood, f, doorOpen = 0, keyInLock = 0, lockTurn = 0, keySwing = 0 }) => {
  const p = HOUSE_PAL[mood];
  const Win = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
    <g>
      <rect x={x - 8} y={y - 8} width={w + 16} height={h + 16} rx={10} fill={p.trim} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill={p.win} />
      {mood === "gold" && <rect x={x} y={y} width={w} height={h} rx={6} fill="#ffcf6b" opacity={0.35 + 0.08 * Math.sin(f * 0.15 + x)} />}
      <path d={`M ${x + w / 2},${y} V ${y + h} M ${x},${y + h / 2} H ${x + w}`} stroke={p.trim} strokeWidth={8} />
      <path d={`M ${x + 14},${y + h - 16} L ${x + w / 2 - 14},${y + 14}`} stroke="#fff" strokeWidth={6} opacity={0.4} strokeLinecap="round" />
    </g>
  );
  const open = clamp01(doorOpen);
  return (
    <g>
      <ellipse cx={0} cy={6} rx={400} ry={26} fill="#000" opacity={0.14} />
      {/* chimney */}
      <rect x={150} y={-930} width={74} height={170} fill={p.roof} />
      <rect x={140} y={-946} width={94} height={26} rx={6} fill={p.trim} />
      {mood !== "grey" && [0, 1, 2].map((k) => {
        const q = ((f * 0.6 + k * 33) % 100) / 100;
        return <circle key={k} cx={187 + 20 * Math.sin(q * 6 + k)} cy={-960 - q * 160} r={14 + q * 26} fill="#ffffff" opacity={0.35 * (1 - q)} />;
      })}
      {/* walls and roof */}
      <rect x={-300} y={-700} width={600} height={700} fill={p.wall} />
      <rect x={-300} y={-700} width={600} height={30} fill="#000" opacity={0.08} />
      <path d="M -360,-680 L 0,-1000 L 360,-680 Z" fill={p.roof} />
      <path d="M -360,-680 L 360,-680" stroke="#000" strokeWidth={14} opacity={0.12} />
      <circle cx={0} cy={-800} r={50} fill={p.trim} />
      <circle cx={0} cy={-800} r={38} fill={p.win} />
      <Win x={-230} y={-600} w={150} h={130} />
      <Win x={80} y={-600} w={150} h={130} />
      <Win x={-250} y={-370} w={150} h={140} />
      <Win x={100} y={-370} w={150} h={140} />
      {/* door: warm inside, then the door leaf turning on its left hinge */}
      <rect x={-96} y={-340} width={192} height={340} rx={10} fill={p.trim} />
      <rect x={-80} y={-320} width={160} height={320} rx={6} fill="#ffcf6b" />
      {open > 0 && <rect x={-80} y={-320} width={160} height={320} rx={6} fill="#fff1c4" opacity={open * (0.6 + 0.1 * Math.sin(f * 0.3))} />}
      <g transform={`translate(-80 0) scale(${1 - 0.86 * open} 1) translate(80 0)`}>
        <rect x={-80} y={-320} width={160} height={320} rx={6} fill={p.door} />
        <rect x={-56} y={-290} width={112} height={110} rx={8} fill={p.win} opacity={0.9} />
        <rect x={-56} y={-150} width={112} height={120} rx={8} fill="#000" opacity={0.1} />
        <circle cx={52} cy={-150} r={10} fill={GOLD} />
        <rect x={46} y={-128} width={12} height={20} rx={4} fill="#3a3a4a" />
      </g>
      {/* the key in the lock */}
      {keyInLock > 0 && open < 0.15 && (
        <g transform={`translate(52 -118) scale(${0.55 * (1 - 0.3 * lockTurn)} 0.55)`}>
          <Key swing={keySwing} />
        </g>
      )}
      <rect x={-130} y={-12} width={260} height={24} rx={8} fill="#c9bfae" />
      {/* bushes */}
      {[-1, 1].map((s) => (
        <g key={s} transform={`translate(${s * 220} 0)`}>
          <ellipse cx={0} cy={-40} rx={90} ry={60} fill={p.bush} />
          <ellipse cx={s * 50} cy={-70} rx={60} ry={50} fill={p.bush} />
          <ellipse cx={-s * 30} cy={-90} rx={40} ry={34} fill="#fff" opacity={0.12} />
          {mood !== "grey" && [0, 1, 2].map((k) => <circle key={k} cx={-40 + k * 40} cy={-60 + (k % 2) * 30} r={9} fill={k === 1 ? "#ff8fa3" : "#ffe27a"} />)}
        </g>
      ))}
    </g>
  );
};

const Lawn: React.FC<{ y: number; mood: HouseMood; w?: number; h?: number }> = ({ y, mood, w = W, h = H }) => (
  <g>
    <rect x={-400} y={y} width={w + 800} height={h} fill={mood === "grey" ? "#8c9a86" : mood === "gold" ? "#a9c46e" : "#9ccc7a"} />
    <path d={`M ${w / 2 - 110},${y} L ${w / 2 + 110},${y} L ${w / 2 + 260},${y + 700} L ${w / 2 - 260},${y + 700} Z`} fill={mood === "grey" ? "#aaa59c" : "#e9dcc3"} />
    {Array.from({ length: 18 }, (_, k) => (
      <path key={k} d={`M ${rnd(`gx${k}`) * w},${y + 40 + rnd(`gy${k}`) * 500} l 6,-18 l 6,18`} stroke="#000" strokeWidth={3} opacity={0.08} fill="none" />
    ))}
  </g>
);

// ---------- people ----------
type Who = "tom" | "lena" | "mia";
const LOOK: Record<Who, { top: string; legs: string; hair: string; dress: boolean }> = {
  tom: { top: "#4f9d69", legs: "#34477a", hair: "#5a3825", dress: false },
  lena: { top: "#e8735a", legs: "#3a3a4a", hair: "#7a3324", dress: true },
  mia: { top: "#ffc94a", legs: SKIN, hair: "#6b4226", dress: true },
};

// Standing person, front view. Origin = feet on the ground. Adults are about 560 units tall.
// armA / backA: arm angle in degrees, 0 = hanging down; the front arm (right side) points right at -90.
const Person: React.FC<{
  f: number; seed: number; who: Who; mood?: "smile" | "happy" | "o" | "sad"; look?: [number, number];
  armA?: number; backA?: number; holdKey?: boolean; keySwing?: number; keyGlint?: number; ghost?: number; flip?: boolean;
}> = ({ f, seed, who, mood = "smile", look = [0.4, 0], armA = 12, backA = 12, holdKey, keySwing = 0, keyGlint = 0, ghost = 0, flip }) => {
  const c = LOOK[who];
  const kid = who === "mia";
  const br = 3 * wobble(f, seed, 0.7);
  const headS = kid ? 1.35 : 1;
  const Arm = ({ x, a, front }: { x: number; a: number; front?: boolean }) => (
    <g transform={`translate(${x} ${-390 + br}) rotate(${a})`}>
      <path d="M 0,0 L 0,140" stroke={c.top} strokeWidth={32} strokeLinecap="round" />
      <circle cx={0} cy={150} r={17} fill={SKIN} />
      {front && holdKey && (
        <g transform={`translate(0 150) rotate(${-a})`}>
          <g transform="scale(0.8)"><Key swing={keySwing} glint={keyGlint} /></g>
        </g>
      )}
    </g>
  );
  return (
    <g transform={`${flip ? "scale(-1 1)" : ""} ${kid ? "scale(0.62)" : ""}`} opacity={1 - 0.78 * ghost}>
      <ellipse cx={0} cy={4} rx={110} ry={14} fill="#000" opacity={0.18} />
      <path d="M -30,-230 L -36,-10" stroke={c.legs} strokeWidth={kid ? 34 : 42} strokeLinecap="round" />
      <path d="M 26,-230 L 34,-10" stroke={c.legs} strokeWidth={kid ? 34 : 42} strokeLinecap="round" />
      <ellipse cx={-34} cy={-6} rx={34} ry={15} fill={kid ? "#e8352e" : "#3b2a24"} />
      <ellipse cx={40} cy={-6} rx={34} ry={15} fill={kid ? "#e8352e" : "#3b2a24"} />
      {c.dress ? (
        <path d={`M -100,-150 C -86,-330 -60,${-420 + br} 0,${-428 + br} C 60,${-420 + br} 86,-330 100,-150 Z`} fill={c.top} />
      ) : (
        <path d={`M -78,-200 C -84,-330 -60,${-420 + br} 0,${-428 + br} C 60,${-420 + br} 84,-330 78,-200 Z`} fill={c.top} />
      )}
      {c.dress && <path d={`M -96,-170 C -40,-150 40,-150 96,-170`} stroke="#fff" strokeWidth={8} opacity={0.35} fill="none" />}
      {!c.dress && <path d="M -20,-410 L 0,-380 L 20,-410" stroke="#fff" strokeWidth={8} opacity={0.4} fill="none" strokeLinecap="round" />}
      <Arm x={-58} a={backA} />
      <g transform={`translate(0 ${-428 - 62 * headS + 14 + br}) scale(${headS})`}>
        {who === "lena" && <path d="M -74,0 C -82,-84 82,-84 74,0 L 78,96 C 40,112 -40,112 -78,96 Z" fill={c.hair} />}
        {who === "mia" && [-1, 1].map((s) => (
          <g key={s}>
            <circle cx={s * 70} cy={-6} r={26} fill={c.hair} />
            <circle cx={s * 52} cy={-24} r={8} fill={HEART} />
          </g>
        ))}
        <circle r={62} fill={SKIN} />
        {who === "tom" && <path d="M -64,-4 C -72,-66 62,-86 66,-8 C 44,-42 -24,-50 -64,-4 Z" fill={c.hair} />}
        {who === "lena" && <path d="M -66,-2 C -72,-72 66,-82 66,-4 C 28,-44 -22,-34 -66,-2 Z" fill={c.hair} />}
        {who === "mia" && <path d="M -62,-10 C -64,-70 62,-74 62,-10 C 30,-40 -10,-28 -62,-10 Z" fill={c.hair} />}
        <g transform={`translate(${look[0] * 8} 14)`}>
          <Face f={f} seed={seed} size={9} gap={38} look={look} mood={mood} />
        </g>
      </g>
      <Arm x={58} a={armA} front />
    </g>
  );
};

// World position of a person's front hand (for the key when it leaves the hand).
const handPos = (px: number, py: number, s: number, a: number) => {
  const r = (a * Math.PI) / 180;
  return [px + s * (58 - 150 * Math.sin(r)), py + s * (-390 + 150 * Math.cos(r))];
};

// Small sparkles that drift up from a point (Tom fading out, Tom coming back).
const Sparkles: React.FC<{ f: number; x: number; y: number; amount: number; spread?: number }> = ({ f, x, y, amount, spread = 160 }) => (
  <g>
    {Array.from({ length: 12 }, (_, k) => {
      const q = ((f * 0.9 + k * 23) % 60) / 60;
      const sx = x + (rnd(`spx${k}`) - 0.5) * spread * 2 + 14 * Math.sin(f * 0.1 + k);
      const sy = y + rnd(`spy${k}`) * 300 - q * 260;
      return <path key={k} d={star(8 + rnd(`sps${k}`) * 10)} transform={`translate(${sx} ${sy})`} fill="#fff6d6" opacity={amount * Math.sin(q * Math.PI)} />;
    })}
  </g>
);

// ---------- scenes (each gets the global frame f) ----------
const TOM = { x: 300, y: 1420, s: 0.82 };

const SceneHome: React.FC<{ f: number }> = ({ f }) => {
  const d = eio(ramp(f, CUES.dim, CUES.dim + 40));
  const g = eio(ramp(f, CUES.ghost, CUES.ghost + 30));
  const cam =
    f < 150 ? camLerp(ramp(f, 0, 150), [400, 1090, 1.6], [540, 1010, 1.0])
    : f < CUES.dim ? camLerp(ramp(f, 150, CUES.dim), [540, 1010, 1.0], [540, 1000, 1.03])
    : camLerp(ramp(f, CUES.dim, CUES.sceneSplit), [540, 1000, 1.03], [440, 1090, 1.22]);
  // Tom lifts the key, jingles it, then lowers it; it drops when he fades.
  const lift = eio(ramp(f, CUES.keyLift, CUES.keys));
  const lower = eio(ramp(f, 140, 165));
  const afterDrop = eio(ramp(f, CUES.drop, CUES.drop + 20));
  const armA = lerp(lerp(lerp(12, -125, lift), -60, lower), 12, afterDrop);
  const holding = f < CUES.drop;
  const keySwing = ringOut(f, CUES.jingle1) + 4 * Math.sin(f * 0.12);
  const keyGlint = f >= CUES.keys - 4 && f < CUES.keys + 16 ? ramp(f, CUES.keys - 4, CUES.keys + 16) : 0;
  // the falling key
  const [hx, hy] = handPos(TOM.x, TOM.y, TOM.s, -60);
  const fallT = ramp(f, CUES.drop, CUES.drop + 14);
  const bounce = f >= CUES.drop + 14 ? Math.abs(Math.sin(ramp(f, CUES.drop + 14, CUES.drop + 26) * Math.PI)) * 30 * (1 - ramp(f, CUES.drop + 14, CUES.drop + 26)) : 0;
  const keyY = lerp(hy, TOM.y - 30, fallT * fallT) - bounce;
  const keyX = lerp(hx, hx + 40, fallT);
  // Lena and Mia come in from the right.
  const lp = eout(ramp(f, CUES.family, CUES.family + 38));
  const mp = eout(ramp(f, CUES.family + 8, CUES.family + 48));
  const lx = lerp(1260, 690, lp), mx = lerp(1400, 880, mp);
  const lBob = lp > 0 && lp < 0.98 ? -Math.abs(Math.sin(f * 0.45)) * 16 : 0;
  const mBob = mp > 0 && mp < 0.98 ? -Math.abs(Math.sin(f * 0.55)) * 20 : 0;
  const hop = -46 * Math.sin(clamp01(ramp(f, CUES.family + 52, CUES.family + 66)) * Math.PI);
  const famMood = f < CUES.ghost ? "happy" : f < CUES.ghost + 26 ? "o" : "sad";
  const loanLen = eout(ramp(f, CUES.loan, CUES.loan + 30)) * 540;
  return (
    <g transform={cam}>
      <SkyGrad id="skyHome" top="#9fd3f5" bottom="#fde7c6" />
      <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="#3a3f78" opacity={0.45 * d} />
      <Glow x={900} y={230} r={260} opacity={1 - d} />
      <circle cx={900} cy={230} r={70} fill="#ffe08a" opacity={1 - 0.7 * d} />
      <Clouds f={f} dark={false} />
      <Birds f={f} />
      <Lawn y={1310} mood="sun" />
      <g transform="translate(540 1330) scale(0.95)">
        <House mood="sun" f={f} />
      </g>
      {/* the bank loan unrolls over the house */}
      {loanLen > 0 && (
        <g transform={`translate(880 300) rotate(${3 * Math.sin(f * 0.07)})`}>
          <LoanPaper len={loanLen} w={250} id="loanHome" />
        </g>
      )}
      {/* dusk falls on the world, not on the people */}
      <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="#1a2148" opacity={0.42 * d} />
      <g transform={`translate(${lx} ${TOM.y + lBob})`}>
        <g transform="scale(0.8)"><Person f={f} seed={21} who="lena" mood={famMood} look={[-0.7, 0]} flip /></g>
      </g>
      <g transform={`translate(${mx} ${TOM.y + 10 + mBob + hop})`}>
        <g transform="scale(0.8)"><Person f={f} seed={31} who="mia" mood={famMood} look={[-0.7, -0.2]} flip backA={f < CUES.ghost ? -20 + 10 * Math.sin(f * 0.3) : 10} /></g>
      </g>
      {g > 0 && <Glow x={TOM.x} y={TOM.y - 260} r={300} warm={false} opacity={g * 0.8} />}
      <g transform={`translate(${TOM.x} ${TOM.y})`}>
        <g transform={`scale(${TOM.s})`}>
          <Person f={f} seed={11} who="tom" mood={f >= CUES.keys && f < 130 ? "happy" : "smile"} look={[0.6, f < 140 ? -0.6 : 0]} armA={armA} holdKey={holding} keySwing={keySwing} keyGlint={keyGlint} ghost={g} />
        </g>
      </g>
      {g > 0 && <Sparkles f={f} x={TOM.x} y={TOM.y - 470} amount={g} spread={110} />}
      {!holding && (
        <g transform={`translate(${keyX} ${keyY}) rotate(${lerp(0, 72, fallT)}) scale(0.66)`}>
          <Key />
        </g>
      )}
      <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="url(#vignette)" opacity={d} />
    </g>
  );
};

// One half of the split screen: a 1080 x 940 world with the house and Lena and Mia.
const PANEL_H = 940;
const PanelWorld: React.FC<{ f: number; mood: HouseMood; id: string; famMood: "smile" | "happy" | "o" | "sad"; look: [number, number] }> = ({ f, mood, id, famMood, look }) => (
  <g>
    <SkyGrad id={id} top={mood === "grey" ? "#6f7690" : "#9fd3f5"} bottom={mood === "grey" ? "#b6b4c2" : "#fde7c6"} w={W} h={PANEL_H} />
    {mood !== "grey" && <Glow x={940} y={110} r={200} />}
    {mood !== "grey" && <circle cx={940} cy={110} r={52} fill="#ffe08a" />}
    <Clouds f={f} dark={mood === "grey"} y0={90} n={3} scale={0.7} />
    <Lawn y={790} mood={mood} h={PANEL_H} />
    <g transform="translate(640 800) scale(0.5)">
      <House mood={mood} f={f} />
    </g>
    <g transform="translate(270 870) scale(0.5)">
      <Person f={f} seed={21} who="lena" mood={famMood} look={look} backA={-10} />
    </g>
    <g transform="translate(400 878) scale(0.5)">
      <Person f={f} seed={31} who="mia" mood={famMood} look={look} backA={30} />
    </g>
  </g>
);

const Pill: React.FC<{ text: string; color: string; w: number }> = ({ text, color, w }) => (
  <g>
    <rect x={0} y={0} width={w} height={74} rx={37} fill={color} />
    <text x={w / 2} y={50} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={40} fill="#ffffff">{text}</text>
  </g>
);

const SceneSplit: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneSplit;
  const open = 1; // the halves are in place; the split fades in over XF frames
  const shake = f >= CUES.sign && f < CUES.sign + 12 ? Math.sin(f * 2.1) * 8 * (1 - (f - CUES.sign) / 12) : 0;
  const topDim = 0.45 * ramp(f, CUES.withCover, CUES.withCover + 20);
  const botDim = 0.62 * (1 - ramp(f, CUES.withCover, CUES.withCover + 18));
  const signS = eback(ramp(f, CUES.sign, CUES.sign + 14));
  const badgeS = eback(ramp(f, CUES.badge, CUES.badge + 16));
  const loanIn = eout(ramp(f, CUES.loanIn, CUES.loanIn + 20));
  const stamp = ramp(f, CUES.paid, CUES.paid + 8);
  const topMood = f < CUES.without + 30 ? "o" : "sad";
  const botMood = f < CUES.withCover + 10 ? "smile" : "happy";
  return (
    <g transform={camLerp(t / 268, [540, 960, 1.0], [540, 960, 1.03])}>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#fff7ea" />
      {/* top: without cover */}
      <g transform={`translate(${shake} ${lerp(-PANEL_H, 0, open)})`}>
        <clipPath id="clipTop"><rect width={W} height={PANEL_H} /></clipPath>
        <g clipPath="url(#clipTop)">
          <PanelWorld f={f} mood="grey" id="skyTop" famMood={topMood} look={[-0.6, 0.4]} />
          <Rain f={f} w={W} h={PANEL_H} />
          {/* bank letters fly in and pile up at Lena's feet */}
          {[0, 1, 2, 3, 4].map((k) => {
            const a = CUES.letters + k * 9;
            if (f < a) return null;
            const q = eout(ramp(f, a, a + 14));
            const x = lerp(1180, 150 + (k % 2) * 14, q), y = lerp(260 + k * 30, 850 - k * 22, q);
            return <g key={k} transform={`translate(${x} ${y}) rotate(${lerp(40, -8 + k * 5, q)}) scale(0.8)`}><Envelope /></g>;
          })}
          {f >= CUES.sign && <g transform={`translate(930 880) scale(${signS})`}><SaleSign /></g>}
          <rect width={W} height={PANEL_H} fill="#20243f" opacity={topDim} />
          <g transform="translate(40 40)"><Pill text="Without cover" color="#5b5f73" w={330} /></g>
        </g>
      </g>
      {/* bottom: with cover */}
      <g transform={`translate(0 ${lerp(H, PANEL_H + 40, open)})`}>
        <clipPath id="clipBot"><rect width={W} height={PANEL_H} /></clipPath>
        <g clipPath="url(#clipBot)">
          <PanelWorld f={f} mood="sun" id="skyBot" famMood={botMood} look={[0.5, -0.5]} />
          {f >= CUES.loanIn && (
            <g transform={`translate(${lerp(1300, 950, loanIn)} 330) rotate(-4)`}>
              <LoanPaper len={lerp(60, 380, loanIn)} w={190} id="loanBot" stamp={f >= CUES.paid ? stamp : 0} />
            </g>
          )}
          {f >= CUES.badge && <g transform={`translate(540 230) scale(${badgeS * 0.94})`}><Badge f={f} /></g>}
          <rect width={W} height={PANEL_H} fill="#20243f" opacity={botDim} />
          <g transform="translate(40 40)"><Pill text="With cover" color="#1e9e5a" w={270} /></g>
        </g>
      </g>
    </g>
  );
};

const SceneKeep: React.FC<{ f: number }> = ({ f }) => {
  const turn = eio(ramp(f, CUES.unlock, CUES.unlock + 8));
  const open = eio(ramp(f, CUES.doorOpen, CUES.doorOpen + 24));
  const reach = eout(ramp(f, CUES.sceneKeep, CUES.sceneKeep + 18));
  const keyInLock = f >= CUES.sceneKeep + 18 ? 1 : 0;
  const miaArm = lerp(10, -107, reach) * (1 - eio(ramp(f, CUES.doorOpen + 10, CUES.doorOpen + 26))) + 10 * eio(ramp(f, CUES.doorOpen + 10, CUES.doorOpen + 26));
  return (
    <g transform={camLerp(ramp(f, CUES.sceneKeep, CUES.sceneNow), [540, 1190, 1.45], [520, 1130, 1.25])}>
      <SkyGrad id="skyKeep" top="#9fd3f5" bottom="#fde7c6" />
      <Clouds f={f} dark={false} />
      <Lawn y={1310} mood="sun" />
      <g transform="translate(540 1330) scale(0.95)">
        <House mood="sun" f={f} doorOpen={open} keyInLock={keyInLock} lockTurn={turn} keySwing={ringOut(f, CUES.jingle2, 18)} />
      </g>
      {open > 0 && <Glow x={540} y={1200} r={340 * open} opacity={open} />}
      <g transform="translate(300 1420) scale(0.82)">
        <Person f={f} seed={21} who="lena" mood="happy" look={[0.7, -0.3]} backA={-30} />
      </g>
      <g transform="translate(470 1420) scale(0.82)">
        <Person f={f} seed={31} who="mia" mood={f >= CUES.unlock ? "happy" : "smile"} look={[0.8, -0.8]} armA={miaArm} holdKey={!keyInLock} />
      </g>
    </g>
  );
};

const SceneNow: React.FC<{ f: number }> = ({ f }) => {
  const back = eio(ramp(f, CUES.sceneNow, CUES.sceneNow + 22));
  const hug = eout(ramp(f, CUES.sceneNow + 6, CUES.sceneNow + 24));
  const big = eback(ramp(f, CUES.love, CUES.love + 14));
  return (
    <g transform={camLerp(ramp(f, CUES.sceneNow, CUES.sceneCard), [540, 1130, 1.32], [540, 1040, 1.08])}>
      <SkyGrad id="skyNow" top="#f7b267" bottom="#ffe5b4" />
      <Glow x={180} y={520} r={420} />
      <circle cx={180} cy={520} r={90} fill="#ffd77a" />
      <Clouds f={f} dark={false} />
      <Lawn y={1310} mood="gold" />
      <g transform="translate(540 1330) scale(0.95)">
        <House mood="gold" f={f} doorOpen={1} />
      </g>
      <Glow x={540} y={1200} r={300} opacity={0.8} />
      <g transform="translate(400 1420) scale(0.82)">
        <Person f={f} seed={11} who="tom" mood="happy" look={[0.6, 0]} armA={lerp(12, -78, hug)} ghost={0.7 * (1 - back)} />
      </g>
      <g transform="translate(680 1420) scale(0.8)">
        <Person f={f} seed={21} who="lena" mood="happy" look={[0.6, 0]} armA={lerp(12, -78, hug)} flip />
      </g>
      <g transform="translate(545 1440) scale(0.8)">
        <Person f={f} seed={31} who="mia" mood="happy" look={[0, -0.6]} backA={lerp(10, 150, hug)} armA={lerp(12, -150, hug)} />
      </g>
      <Sparkles f={f} x={400} y={980} amount={1 - ramp(f, CUES.sceneNow + 20, CUES.sceneNow + 40)} spread={120} />
      {/* hearts float up; a big one on "love" */}
      {[0, 1, 2, 3].map((k) => {
        const q = ((f - CUES.sceneNow + k * 16) % 64) / 64;
        return <path key={k} d={heartPath(380 + k * 100 + 20 * Math.sin(f * 0.1 + k), 900 - q * 260, 22)} fill="#ff6b81" opacity={0.8 * Math.sin(q * Math.PI) * ramp(f, CUES.sceneNow + 10, CUES.sceneNow + 20)} />;
      })}
      {f >= CUES.love && <path d={heartPath(540, 790, 70 * big)} fill={HEART} opacity={0.92} />}
    </g>
  );
};

const SceneCard: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneCard;
  const up = eback(ramp(f, CUES.sceneCard + 2, CUES.sceneCard + 22));
  const line = (a: number) => eout(ramp(f, CUES.sceneCard + a, CUES.sceneCard + a + 12));
  const pulse = 1 + 0.03 * Math.sin(t * 0.25) * ramp(f, CUES.sceneCard + 50, CUES.sceneCard + 60);
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
        <rect x={90} y={620} width={900} height={720} rx={48} fill="#000" opacity={0.18} transform="translate(0 16)" />
        <rect x={90} y={620} width={900} height={720} rx={48} fill="#ffffff" />
        <g opacity={line(8)} transform={`translate(0 ${20 * (1 - line(8))})`}>
          <text x={540} y={738} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={50} fill="#4a5578">Risikolebensversicherung?</text>
          <text x={540} y={802} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Talk to</text>
        </g>
        <g opacity={line(18)} transform={`translate(0 ${20 * (1 - line(18))})`}>
          <text x={540} y={930} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={110} fill="#0c2f6b">Robin Emig</text>
          <text x={540} y={1015} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={62} fill="#2f78d6">Allianz</text>
        </g>
        <rect x={240} y={1070} width={600} height={6} rx={3} fill="#e3e8f2" opacity={line(30)} />
        <g opacity={line(34)} transform={`translate(540 1200) scale(${pulse})`}>
          <rect x={-400} y={-70} width={800} height={130} rx={65} fill="#eaf2ff" />
          <g transform="translate(-345 -6)">
            <path d="M -22,-34 C -32,-34 -38,-26 -36,-16 C -30,14 -8,36 22,40 C 32,42 40,36 40,26 L 40,14 C 40,8 36,4 30,4 L 18,4 C 12,4 10,10 8,14 C -4,10 -14,0 -18,-12 C -12,-14 -8,-18 -8,-24 L -8,-36 C -8,-42 -12,-44 -18,-44 Z" fill="#2f78d6" transform="translate(0 6)" />
          </g>
          <text x={45} y={22} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={66} fill="#0c2f6b">+49 160 97626099</text>
        </g>
      </g>
      {/* the key, one last time */}
      <g transform={`translate(540 ${1440 + 8 * Math.sin(t * 0.12)}) scale(2.2)`} opacity={line(40)}>
        <Key swing={ringOut(f, CUES.cardKey, 22) + 5 * Math.sin(t * 0.1)} glint={f >= CUES.cardKey && f < CUES.cardKey + 20 ? ramp(f, CUES.cardKey, CUES.cardKey + 20) : 0} />
      </g>
    </g>
  );
};

const SCENE_COMPONENTS: Record<string, React.FC<{ f: number }>> = {
  home: SceneHome,
  split: SceneSplit,
  keep: SceneKeep,
  now: SceneNow,
  card: SceneCard,
};

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = STORY;
  const fade = Math.max(1 - ramp(f, 0, 8), ramp(f, STORY.durationFrames - 8, STORY.durationFrames - 1));
  const subsOn = f < CUES.sceneCard;
  const onSeam = f >= SUBS_ON_SEAM[0] && f < SUBS_ON_SEAM[1];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1030" }}>
      <svg width={width} height={height} viewBox={`0 0 ${W} ${H}`}>
        <StoryDefs />
        {SCENES.map(([name, a, b], i) => {
          const isLast = i === SCENES.length - 1;
          if (f < a || f >= b + (isLast ? 0 : XF)) return null;
          // the incoming scene fades in over XF frames on top of the outgoing one
          const o = i === 0 ? 1 : ramp(f, a, a + XF);
          const C = SCENE_COMPONENTS[name];
          return (
            <g key={name} opacity={o}>
              <C f={f} />
            </g>
          );
        })}
        {subsOn && !onSeam && <rect y={H * 0.7} width={W} height={H * 0.3} fill="url(#subScrim)" opacity={0.8} />}
      </svg>
      {subsOn && <Subtitles f={f} subs={SUBS} width={width} height={height} centerY={onSeam ? (SEAM_Y * height) / H : undefined} />}
      {STORY.audio && <Audio src={staticFile(STORY.audio)} />}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
