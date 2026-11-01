import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { HAND, NUNITO } from "./kit/fonts";
import { CUES, SCENES, STORY, SUBS, XF } from "./story";
import { clamp01, eback, eio, eout, lerp, ramp, rnd, wobble } from "./kit/helpers";
import { Face, Glow, StoryDefs } from "./kit/parts";
import { Subtitles } from "./kit/Subtitles";

// "Jonas plants a pension": a 30 s, 9:16 Basisrente story for Robin Emig, Allianz.
// Everything is drawn in a 1080 x 1920 design space. All timing comes from src/story.ts.

const W = 1080, H = 1920;
const INK = "#2b1d18";
const SKIN = "#f3c39b";
const SKIN_D = "#e6ab84";
const HAIR = "#4a2f20";
const SHIRT = "#8ec5ef";
const SHIRT_D = "#6aa8d8";
const TIE = "#1f3a6b";
const GOLD = "#ffc93c";
const GOLD_D = "#e0a21a";
const LEAF = "#5fbf6a";
const LEAF_D = "#3f9d55";
const POT = "#d9784f";
const NAVY = "#0c2f6b";
const BLUE = "#2f78d6";
const RED = "#e2483d";

// ---------- small helpers ----------
const camT = (cx: number, cy: number, z: number) => `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`;
type Key = [number, number, number, number]; // frame, cx, cy, zoom
const camAt = (f: number, keys: Key[]) => {
  for (let k = 0; k < keys.length - 1; k++) {
    const [f0, x0, y0, z0] = keys[k], [f1, x1, y1, z1] = keys[k + 1];
    if (f <= f1) {
      const t = eio(ramp(f, f0, f1));
      return camT(lerp(x0, x1, t), lerp(y0, y1, t), Math.exp(lerp(Math.log(z0), Math.log(z1), t)));
    }
  }
  const [, x, y, z] = keys[keys.length - 1];
  return camT(x, y, z);
};
// fade in at a, fade out at b
const span = (f: number, a: number, b: number, d = 8) => Math.min(ramp(f, a, a + d), 1 - ramp(f, b - d, b));
const popIn = (f: number, a: number, d = 14) => eback(ramp(f, a, a + d));

// ---------- parts ----------
const Coin: React.FC<{ x: number; y: number; r?: number; spin?: number; o?: number }> = ({ x, y, r = 30, spin = 1, o = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.15, Math.abs(spin))} 1)`} opacity={o}>
    <circle r={r} fill={GOLD_D} />
    <circle r={r * 0.86} fill={GOLD} />
    <text y={r * 0.36} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={r} fill={GOLD_D}>€</text>
    <circle cx={-r * 0.35} cy={-r * 0.4} r={r * 0.16} fill="#fff" opacity={0.6} />
  </g>
);

// A stack of coins seen from the side. Origin = bottom centre.
const CoinStack: React.FC<{ n: number; x: number; y: number }> = ({ n, x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: Math.max(0, Math.round(n)) }, (_, k) => (
      <g key={k} transform={`translate(${(k % 2 ? 3 : -3)} ${-k * 18 - 10})`}>
        <ellipse rx={56} ry={16} fill={GOLD_D} />
        <rect x={-56} y={-6} width={112} height={8} fill={GOLD_D} />
        <ellipse cy={-6} rx={56} ry={16} fill={GOLD} />
        <ellipse cy={-6} rx={36} ry={8} fill="none" stroke={GOLD_D} strokeWidth={3} />
      </g>
    ))}
  </g>
);

// The token: a little plant that grows. g 0..1 (young sapling) and up to 1 = full small plant.
const leafPath = "M 0,0 C 18,-22 52,-26 70,-6 C 50,12 18,12 0,0 Z";
const Sapling: React.FC<{ f: number; g: number; x: number; y: number; perk?: number }> = ({ f, g, x, y, perk = 0 }) => {
  const h = 50 + 170 * g;
  const sway = 3 * wobble(f, 2, 0.6) + perk * 6 * Math.sin(perk * 12);
  const leaves = Math.round(2 + g * 6);
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`rotate(${sway})`}>
        <path d={`M 0,0 C -8,${-h * 0.4} 8,${-h * 0.7} 0,${-h}`} stroke={LEAF_D} strokeWidth={9} fill="none" strokeLinecap="round" />
        {Array.from({ length: leaves }, (_, k) => {
          const side = k % 2 ? -1 : 1;
          const ly = -h * (0.25 + (0.75 * (k + 1)) / (leaves + 1));
          const s = (0.55 + 0.45 * (1 - k / (leaves + 1))) * (0.8 + 0.4 * g);
          return (
            <g key={k} transform={`translate(0 ${ly}) scale(${side * s} ${s}) rotate(${-15 - 8 * Math.sin(f * 0.07 + k)})`}>
              <path d={leafPath} fill={k % 3 === 0 ? LEAF_D : LEAF} />
              <path d="M 4,0 C 24,-6 44,-8 62,-6" stroke="#9be0a0" strokeWidth={3} fill="none" opacity={0.7} />
            </g>
          );
        })}
        {/* top bud */}
        <g transform={`translate(0 ${-h})`}>
          <g transform="scale(0.7) rotate(-60)"><path d={leafPath} fill={LEAF} /></g>
          <g transform="scale(-0.7 0.7) rotate(-60)"><path d={leafPath} fill={LEAF_D} /></g>
        </g>
      </g>
    </g>
  );
};

const Pot: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -66,-110 L 66,-110 L 52,0 L -52,0 Z" fill={POT} />
    <rect x={-76} y={-128} width={152} height={30} rx={10} fill="#e88a62" />
    <ellipse cy={-126} rx={62} ry={9} fill="#6b4630" />
    <path d="M -40,-80 L -34,-20" stroke="#fff" strokeWidth={8} opacity={0.25} strokeLinecap="round" />
  </g>
);

// Jonas's head. Origin = head centre. old = grey hair and glasses.
const JonasHead: React.FC<{ f: number; mood: "smile" | "happy" | "o" | "sad"; look?: [number, number]; old?: boolean; tilt?: number }> = ({ f, mood, look = [0, 0], old = false, tilt = 0 }) => (
  <g transform={`rotate(${tilt})`}>
    <ellipse cx={-104} cy={10} rx={20} ry={28} fill={SKIN_D} />
    <ellipse cx={104} cy={10} rx={20} ry={28} fill={SKIN_D} />
    <circle r={108} fill={SKIN} />
    {old ? (
      <g fill="#d9d9e0">
        <path d="M -108,-6 C -118,-70 -60,-118 0,-112 C -40,-96 -80,-70 -92,-20 Z" />
        <path d="M 108,-6 C 118,-70 60,-118 0,-112 C 40,-96 80,-70 92,-20 Z" />
        <ellipse cx={-60} cy={-96} rx={30} ry={14} />
      </g>
    ) : (
      <path d="M -108,-10 C -122,-92 -20,-140 66,-108 C 104,-94 118,-56 108,-20 C 86,-60 40,-76 -10,-70 C -50,-66 -86,-50 -108,-10 Z" fill={HAIR} />
    )}
    <g transform="translate(0 6)">
      <Face f={f} seed={old ? 9 : 3} size={14} gap={64} look={look} mood={mood} />
    </g>
    {old && (
      <g stroke="#5b4a6e" strokeWidth={6} fill="none">
        <circle cx={-32} cy={6} r={28} />
        <circle cx={32} cy={6} r={28} />
        <path d="M -4,4 L 4,4" />
      </g>
    )}
    {old ? (
      <path d="M -36,-52 q 14,-8 28,0 M 8,-52 q 14,-8 28,0" stroke="#bfbfc8" strokeWidth={7} fill="none" strokeLinecap="round" />
    ) : (
      <path d={mood === "sad" ? "M -48,-46 q 16,8 30,0 M 18,-46 q 16,-8 30,0" : "M -48,-50 q 16,-10 30,0 M 18,-50 q 16,-10 30,0"} stroke={HAIR} strokeWidth={8} fill="none" strokeLinecap="round" />
    )}
  </g>
);

// Jonas at his desk. Origin = where his body meets the desk top (centre).
const JonasDesk: React.FC<{ f: number; mood: "smile" | "happy" | "o" | "sad"; look: [number, number]; reach: number; reachTo: [number, number]; cheer?: number }> = ({ f, mood, look, reach, reachTo, cheer = 0 }) => {
  const br = 4 * wobble(f, 1, 0.7);
  const hy = -440 + br - cheer * 16;
  const shR: [number, number] = [118, -300 + br];
  const shL: [number, number] = [-118, -300 + br];
  const restR: [number, number] = [150, -10];
  const handR: [number, number] = [lerp(restR[0], reachTo[0], reach), lerp(restR[1], reachTo[1], reach)];
  const elbowR: [number, number] = [lerp(200, (shR[0] + handR[0]) / 2 + 20, reach), lerp(-110, (shR[1] + handR[1]) / 2 + 50, reach)];
  const handL: [number, number] = cheer > 0 ? [-180, lerp(-10, -360, cheer)] : [-150, -10];
  const elbowL: [number, number] = cheer > 0 ? [lerp(-200, -230, cheer), lerp(-110, -230, cheer)] : [-200, -110];
  return (
    <g>
      {/* chair back */}
      <rect x={-200} y={-420} width={400} height={440} rx={60} fill="#3c4a6b" />
      {/* torso */}
      <path d={`M -150,0 C -160,-180 -150,${-300 + br} -100,${-318 + br} L 100,${-318 + br} C 150,${-300 + br} 160,-180 150,0 Z`} fill={SHIRT} />
      <path d={`M -30,${-318 + br} L 0,${-280 + br} L 30,${-318 + br} Z`} fill="#fff" />
      <path d={`M -12,${-286 + br} L 12,${-286 + br} L 20,-120 L 0,-90 L -20,-120 Z`} fill={TIE} />
      <rect x={-34} y={-350 + br} width={68} height={50} fill={SKIN_D} />
      {/* head */}
      <g transform={`translate(0 ${hy})`}>
        <JonasHead f={f} mood={mood} look={look} tilt={2 * wobble(f, 5, 0.4)} />
      </g>
      {/* arms */}
      <path d={`M ${shL[0]},${shL[1]} Q ${elbowL[0]},${elbowL[1]} ${handL[0]},${handL[1]}`} stroke={SHIRT_D} strokeWidth={62} fill="none" strokeLinecap="round" />
      <circle cx={handL[0]} cy={handL[1]} r={32} fill={SKIN} />
      <path d={`M ${shR[0]},${shR[1]} Q ${elbowR[0]},${elbowR[1]} ${handR[0]},${handR[1]}`} stroke={SHIRT_D} strokeWidth={62} fill="none" strokeLinecap="round" />
      <circle cx={handR[0]} cy={handR[1]} r={32} fill={SKIN} />
    </g>
  );
};

const Calendar: React.FC<{ f: number; x: number; y: number; flips: number[]; labels: string[]; scale?: number }> = ({ f, x, y, flips, labels, scale = 1 }) => {
  const n = flips.filter((a) => f >= a).length;
  const last = n > 0 ? flips[n - 1] : -99;
  const flip = ramp(f, last, last + 8);
  const cur = labels[Math.min(n, labels.length - 1)];
  const prev = labels[Math.max(0, Math.min(n - 1, labels.length - 1))];
  const Page = ({ label }: { label: string }) => (
    <g>
      <rect x={-70} y={-80} width={140} height={160} rx={12} fill="#fff" />
      <rect x={-70} y={-80} width={140} height={44} rx={12} fill={RED} />
      <rect x={-70} y={-50} width={140} height={14} fill={RED} />
      <text y={-48} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={30} fill="#fff">{label}</text>
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={-54 + c * 28} y={-22 + r * 30} width={18} height={18} rx={4} fill="#d8dbe6" />))}
      <circle cx={26} cy={38} r={14} fill="none" stroke={GOLD_D} strokeWidth={5} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-66} y={-74} width={140} height={160} rx={12} fill="#000" opacity={0.12} />
      <Page label={cur} />
      {n > 0 && flip < 1 && (
        <g transform={`translate(0 -80) scale(1 ${1 - flip}) translate(0 80)`} opacity={1 - flip * 0.3}>
          <Page label={prev} />
        </g>
      )}
      <circle cx={-34} cy={-86} r={8} fill="#7a7f93" />
      <circle cx={34} cy={-86} r={8} fill="#7a7f93" />
    </g>
  );
};

// Screen-space label card (not moved by the camera).
const Label: React.FC<{ y: number; o: number; children: React.ReactNode; s?: number }> = ({ y, o, children, s = 1 }) => (
  <g opacity={clamp01(o)} transform={`translate(${W / 2} ${y + 24 * (1 - clamp01(o))}) scale(${s})`}>{children}</g>
);
const Pill: React.FC<{ w: number; h: number; fill: string; children: React.ReactNode }> = ({ w, h, fill, children }) => (
  <g>
    <rect x={-w / 2} y={-h / 2 + 8} width={w} height={h} rx={h / 2} fill="#000" opacity={0.12} />
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} />
    {children}
  </g>
);

// ---------- scenes ----------
const DESK_Y = 1200;
const POT_X = 800;
const STACK_X = 175;

const plantGrowth = (f: number) =>
  0.12 + 0.18 * eout(ramp(f, CUES.coinLand, CUES.coinLand + 14)) + CUES.months.reduce((s, a) => s + 0.16 * eout(ramp(f, a + 8, a + 20)), 0);

const SceneOffice: React.FC<{ f: number }> = ({ f }) => {
  const cam = camAt(f, [
    [0, 560, 1040, 1.1],
    [150, 560, 1020, 1.16],
    [CUES.scenePot, 560, 1020, 1.16],
    [CUES.scenePot + 30, 700, 1000, 1.4],
    [CUES.sceneRefund, 720, 990, 1.45],
    [CUES.sceneRefund + 30, 560, 1020, 1.12],
    [CUES.sceneGarden + XF, 560, 1010, 1.16],
  ]);
  // coins on the stack: 10, the tax takes 5, the refund brings 4 back
  const taxT = ramp(f, CUES.tax, CUES.tax + 26);
  const refundT = ramp(f, CUES.shower, CUES.back);
  const stackN = 10 - (f >= CUES.tax + 4 ? 5 : 0) + Math.floor(refundT * 4.99);
  const mood: "smile" | "happy" | "o" | "sad" =
    f < CUES.tax ? "smile" : f < CUES.bars ? "o" : f < CUES.scenePot ? "sad" : f < CUES.envelope ? "smile" : f < CUES.shower ? "o" : "happy";
  const look: [number, number] =
    f < CUES.tax ? [0, 0.3] : f < CUES.bars ? [-0.9, 0.6] : f < CUES.scenePot ? [0, -1] : f < CUES.sceneRefund ? [1, 0.4] : f < CUES.back ? [0.8, -0.8] : [0, 0];
  // reach out with a coin, then again for each month
  const reachOut = eio(ramp(f, CUES.reach, CUES.reach + 16)) * (1 - eio(ramp(f, CUES.coinLand + 2, CUES.coinLand + 14)));
  const cheer = eback(ramp(f, CUES.back, CUES.back + 12)) * (1 - ramp(f, CUES.sceneGarden - 4, CUES.sceneGarden + 4));
  const g = plantGrowth(f);
  const perkAt = [CUES.coinLand, ...CUES.months].filter((a) => f >= a).pop() ?? -99;
  const perk = f - perkAt < 20 ? 1 - (f - perkAt) / 20 : 0;
  // hand coin: held during the reach, then drops into the pot
  const handCoin = f >= CUES.reach && f < CUES.coinLand;
  const dropT = ramp(f, CUES.coinLand - 10, CUES.coinLand);
  return (
    <g transform={cam}>
      {/* wall */}
      <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fbefdc" />
        <stop offset="1" stopColor="#f1dcc0" />
      </linearGradient>
      <rect x={-300} y={-300} width={W + 600} height={DESK_Y + 300} fill="url(#wall)" />
      {/* window with a city */}
      <g transform="translate(110 250)">
        <rect width={480} height={430} rx={18} fill="#9fd3f5" />
        <circle cx={380} cy={110} r={46} fill="#fff4c2" />
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x={10 + k * 78} y={430 - (140 + rnd(`bh${k}`) * 150)} width={64} height={140 + rnd(`bh${k}`) * 150} fill={k % 2 ? "#c8d8ea" : "#b3c6dd"} />
        ))}
        <ellipse cx={((f * 0.6) % 640) - 80} cy={90} rx={70} ry={24} fill="#fff" opacity={0.9} />
        <rect width={480} height={430} rx={18} fill="none" stroke="#fff" strokeWidth={22} />
        <rect x={232} y={0} width={16} height={430} fill="#fff" />
        <rect x={0} y={208} width={480} height={14} fill="#fff" />
      </g>
      <Glow x={350} y={460} r={520} warm opacity={0.55} />
      {/* wall calendar */}
      <Calendar f={f} x={945} y={830} flips={CUES.months} labels={["JAN", "FEB", "MAR", "APR", "MAY"]} />
      {/* Jonas */}
      <g transform={`translate(420 ${DESK_Y})`}>
        <JonasDesk f={f} mood={mood} look={look} reach={reachOut} reachTo={[POT_X - 420 - 30, -250]} cheer={cheer} />
      </g>
      {/* desk */}
      <rect x={-300} y={DESK_Y} width={W + 600} height={40} fill="#b9794a" />
      <rect x={-300} y={DESK_Y + 40} width={W + 600} height={H} fill="#a0653c" />
      <rect x={-300} y={DESK_Y + 40} width={W + 600} height={10} fill="#000" opacity={0.12} />
      {/* drawers */}
      {[-40, 700].map((dx) => (
        <g key={dx} transform={`translate(${dx} ${DESK_Y + 90})`}>
          {[0, 1].map((r) => (
            <g key={r} transform={`translate(0 ${r * 190})`}>
              <rect width={380} height={160} rx={16} fill="#ad7046" stroke="#8d5631" strokeWidth={6} />
              <rect x={150} y={64} width={80} height={22} rx={11} fill="#e8c9a0" />
            </g>
          ))}
        </g>
      ))}
      {[0, 1, 2, 3].map((k) => <path key={k} d={`M 380,${DESK_Y + 110 + k * 90} q 150,${10 + k * 4} 300,0`} stroke="#8d5631" strokeWidth={4} fill="none" opacity={0.35} />)}
      <rect x={-300} y={DESK_Y + 500} width={W + 600} height={H} fill="#6e4a33" />
      {/* mug */}
      <g transform={`translate(600 ${DESK_Y})`}>
        <rect x={-36} y={-90} width={72} height={90} rx={14} fill="#fff" />
        <path d="M 36,-70 q 30,0 30,26 q 0,26 -30,26" stroke="#fff" strokeWidth={12} fill="none" />
        <rect x={-36} y={-60} width={72} height={16} fill={BLUE} />
        {[0, 1].map((k) => {
          const p = ((f + k * 30) % 60) / 60;
          return <path key={k} d={`M ${-10 + k * 18},${-100 - p * 60} q 10,-14 0,-28`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.6 * (1 - p)} strokeLinecap="round" />;
        })}
      </g>
      {/* coin stack */}
      <CoinStack n={stackN} x={STACK_X} y={DESK_Y} />
      {/* the plant (token) */}
      <Sapling f={f} g={g} x={POT_X} y={DESK_Y - 126} perk={perk} />
      <Pot x={POT_X} y={DESK_Y} />
      {/* first coin: in his hand, then falling into the pot */}
      {handCoin && (
        <Coin x={lerp(POT_X - 30, POT_X, dropT)} y={lerp(DESK_Y - 250 - 34, DESK_Y - 130, eio(dropT))} r={30} spin={Math.cos(f * 0.3)} />
      )}
      {/* monthly coins fall from above into the pot */}
      {CUES.months.map((a, k) => {
        const t = ramp(f, a - 2, a + 10);
        if (f < a - 2 || t >= 1) return null;
        return <Coin key={k} x={POT_X + (k % 2 ? 8 : -8)} y={lerp(DESK_Y - 520, DESK_Y - 130, t * t)} r={28} spin={Math.cos(f * 0.4 + k)} />;
      })}
      {/* sparkle on each landing */}
      {[CUES.coinLand, ...CUES.months.map((a) => a + 10)].map((a, k) => {
        const t = ramp(f, a, a + 16);
        if (f < a || t >= 1) return null;
        return (
          <g key={k} transform={`translate(${POT_X} ${DESK_Y - 140})`} opacity={1 - t}>
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <circle key={j} cx={Math.cos(j * 1.05) * (30 + 60 * t)} cy={Math.sin(j * 1.05) * (20 + 40 * t) - 20 * t} r={7} fill={GOLD} />
            ))}
          </g>
        );
      })}
      {/* the tax takes coins: they fly up and away */}
      {f >= CUES.tax && taxT < 1 &&
        [0, 1, 2, 3, 4].map((k) => {
          const t = clamp01(taxT * 1.3 - k * 0.07);
          return <Coin key={k} x={lerp(STACK_X, -120, eio(t))} y={lerp(DESK_Y - 110 - k * 18, 300 - k * 40, eout(t))} r={30} spin={Math.cos(f * 0.5 + k)} o={1 - ramp(t, 0.8, 1)} />;
        })}
      {/* the tax office envelope sends coins back */}
      {(() => {
        const inT = eout(ramp(f, CUES.envelope, CUES.envelope + 18));
        const out = ramp(f, CUES.back + 6, CUES.back + 20);
        if (f < CUES.envelope || f > CUES.sceneGarden + XF) return null;
        const ex = lerp(1300, 730, inT), ey = lerp(300, 700, inT) + 8 * Math.sin(f * 0.15);
        const open = ramp(f, CUES.envelope + 20, CUES.envelope + 30);
        return (
          <g>
            <g transform={`translate(${ex} ${ey}) rotate(${lerp(25, -6, inT)}) scale(${0.85 * (1 - 0.3 * out)})`} opacity={1 - out}>
              <rect x={-150} y={-95} width={300} height={190} rx={14} fill="#fff" stroke="#d7dbe6" strokeWidth={4} />
              <path d={`M -150,-95 L 0,${lerp(10, -200, open)} L 150,-95 Z`} fill="#eef1f7" stroke="#d7dbe6" strokeWidth={4} />
              <text y={60} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={40} fill={NAVY}>Finanzamt</text>
            </g>
            {Array.from({ length: 8 }, (_, k) => {
              const a = CUES.shower + k * 4;
              const t = ramp(f, a, a + 22);
              if (f < a || t >= 1) return null;
              const x = lerp(730, STACK_X + (k % 3 - 1) * 20, t);
              const y = lerp(690, DESK_Y - 110, t) - Math.sin(t * Math.PI) * 260;
              return <Coin key={k} x={x} y={y} r={28} spin={Math.cos(f * 0.5 + k)} />;
            })}
          </g>
        );
      })()}
    </g>
  );
};

const OfficeLabels: React.FC<{ f: number }> = ({ f }) => {
  // TAX tag
  const taxO = span(f, CUES.tax, CUES.bars, 6);
  // pension bars
  const barsO = span(f, CUES.bars, CUES.scenePot, 8);
  const grow = eout(ramp(f, CUES.bars + 4, CUES.bars + 24));
  const drop = eio(ramp(f, CUES.barsDrop, CUES.barsDrop + 18));
  const salaryH = 330 * grow;
  const pensionH = 330 * grow * lerp(1, 0.42, drop);
  // Basisrente title and Example tag
  const basisO = span(f, CUES.basis, CUES.sceneRefund + 4, 8);
  const exO = span(f, CUES.example, CUES.sceneRefund + 4, 8);
  // refund label
  const amtO = span(f, CUES.amount, CUES.sceneGarden + 2, 8);
  return (
    <g>
      {taxO > 0 && (
        <g transform={`translate(260 ${560 - 30 * taxO}) rotate(-6) scale(${popIn(f, CUES.tax)})`} opacity={taxO}>
          <Pill w={260} h={110} fill={RED}>
            <text y={26} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={72} fill="#fff">TAX</text>
          </Pill>
        </g>
      )}
      {barsO > 0 && (
        <g opacity={barsO} transform={`translate(0 ${30 * (1 - barsO)})`}>
          <rect x={150} y={190} width={780} height={560} rx={40} fill="#000" opacity={0.12} transform="translate(0 12)" />
          <rect x={150} y={190} width={780} height={560} rx={40} fill="#fff" />
          <text x={540} y={268} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={44} fill="#4a5578">Every month</text>
          <rect x={270} y={650 - salaryH} width={200} height={salaryH} rx={18} fill={NAVY} />
          <rect x={610} y={650 - pensionH} width={200} height={pensionH} rx={18} fill="#f0a03c" />
          <rect x={210} y={650} width={660} height={6} rx={3} fill="#d8dbe6" />
          <text x={370} y={710} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={40} fill={NAVY}>Salary</text>
          <text x={710} y={710} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={40} fill="#c97a12">State pension</text>
          {drop > 0 && (
            <path d={`M 860,${330} L 860,${330 + 150 * drop} M 836,${305 + 150 * drop} L 860,${332 + 150 * drop} L 884,${305 + 150 * drop}`} stroke={RED} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={drop} />
          )}
        </g>
      )}
      {basisO > 0 && (
        <Label y={250} o={basisO} s={popIn(f, CUES.basis)}>
          <Pill w={720} h={190} fill="#ffffff">
            <text y={4} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={96} fill={NAVY}>Basisrente</text>
            <text y={64} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={40} fill="#5b6a8c">(Rürup pension)</text>
          </Pill>
        </Label>
      )}
      {exO > 0 && (
        <Label y={430} o={exO} s={popIn(f, CUES.example)}>
          <Pill w={600} h={96} fill={GOLD}>
            <text y={18} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={50} fill={INK}>Example: €300 / month</text>
          </Pill>
        </Label>
      )}
      {amtO > 0 && (
        <Label y={260} o={amtO} s={popIn(f, CUES.amount)}>
          <Pill w={860} h={200} fill="#ffffff">
            <text y={4} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={84} fill="#1e9e5a">≈ €1,500 back</text>
            <text y={66} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={42} fill="#4a5578">in tax, every year</text>
          </Pill>
          <g transform="translate(0 150)">
            <Pill w={560} h={64} fill="rgba(12,47,107,0.85)">
              <text y={13} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={34} fill="#fff">Example: 42% tax rate</text>
            </Pill>
          </g>
        </Label>
      )}
    </g>
  );
};

// Old Jonas on the bench. Origin = bench seat centre.
const OldJonas: React.FC<{ f: number; mood: "smile" | "happy"; bob: number }> = ({ f, mood, bob }) => {
  const br = 4 * wobble(f, 8, 0.6);
  return (
    <g>
      {/* legs */}
      <rect x={-110} y={-10} width={90} height={60} rx={26} fill="#5b4a6e" />
      <rect x={20} y={-10} width={90} height={60} rx={26} fill="#5b4a6e" />
      <rect x={-104} y={30} width={70} height={190} rx={30} fill="#5b4a6e" />
      <rect x={34} y={30} width={70} height={190} rx={30} fill="#5b4a6e" />
      <ellipse cx={-70} cy={226} rx={58} ry={26} fill="#3b2b25" />
      <ellipse cx={70} cy={226} rx={58} ry={26} fill="#3b2b25" />
      {/* cardigan */}
      <path d={`M -140,10 C -150,-160 -130,${-280 + br} -90,${-300 + br} L 90,${-300 + br} C 130,${-280 + br} 150,-160 140,10 Z`} fill="#c0563f" />
      <path d={`M 0,${-300 + br} L 0,10`} stroke="#9a3f2d" strokeWidth={8} />
      {[0, 1, 2].map((k) => <circle key={k} cx={14} cy={-210 + k * 70} r={8} fill="#f6d28f" />)}
      <rect x={-32} y={-332 + br} width={64} height={48} fill={SKIN_D} />
      <g transform={`translate(0 ${-420 + br})`}>
        <JonasHead f={f} mood={mood} look={[0.6, -0.5]} old tilt={-4 + 2 * wobble(f, 3, 0.4)} />
      </g>
      {/* left arm resting */}
      <path d={`M -120,${-260 + br} Q -170,-120 -90,-40`} stroke="#a9472f" strokeWidth={58} fill="none" strokeLinecap="round" />
      <circle cx={-90} cy={-40} r={30} fill={SKIN} />
      {/* right arm, open hand up */}
      <path d={`M 120,${-260 + br} Q 200,-140 230,${-190 + bob}`} stroke="#a9472f" strokeWidth={58} fill="none" strokeLinecap="round" />
      <g transform={`translate(240 ${-200 + bob})`}>
        <ellipse rx={50} ry={22} fill={SKIN} />
        <path d="M -50,0 q 50,30 100,0" stroke={SKIN_D} strokeWidth={6} fill="none" />
      </g>
    </g>
  );
};

const Tree: React.FC<{ f: number; x: number; y: number }> = ({ f, x, y }) => {
  const sway = 1.5 * wobble(f, 6, 0.5);
  const blobs: [number, number, number][] = [[0, -560, 230], [-190, -470, 170], [190, -470, 170], [-110, -680, 160], [120, -690, 160], [0, -780, 140], [-250, -600, 120], [250, -600, 120]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${sway} 0 0)`}>
      <path d="M -60,0 C -40,-150 -50,-300 -20,-420 L 20,-420 C 50,-300 40,-150 60,0 Z" fill="#8a5a3c" />
      <path d="M -10,-330 C -60,-380 -120,-400 -160,-440" stroke="#8a5a3c" strokeWidth={30} fill="none" strokeLinecap="round" />
      <path d="M 10,-360 C 60,-400 120,-420 160,-460" stroke="#8a5a3c" strokeWidth={28} fill="none" strokeLinecap="round" />
      {blobs.map(([bx, by, r], k) => <circle key={k} cx={bx} cy={by} r={r} fill={k % 2 ? LEAF_D : LEAF} />)}
      {/* the same leaves as the little plant */}
      {Array.from({ length: 16 }, (_, k) => {
        const a = rnd(`la${k}`) * Math.PI * 2, d = 120 + rnd(`ld${k}`) * 200;
        return (
          <g key={k} transform={`translate(${Math.cos(a) * d} ${-600 + Math.sin(a) * d * 0.7}) rotate(${rnd(`lr${k}`) * 360 + 6 * Math.sin(f * 0.06 + k)}) scale(0.8)`}>
            <path d={leafPath} fill="#7fd48a" />
          </g>
        );
      })}
      {/* golden coins growing in the tree */}
      {[[-150, -520], [130, -560], [-40, -700], [210, -680], [-220, -650], [40, -480]].map(([cx, cy], k) => (
        <Coin key={k} x={cx} y={cy + 4 * Math.sin(f * 0.08 + k)} r={24} spin={Math.cos(f * 0.05 + k)} />
      ))}
    </g>
  );
};

const SceneGarden: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneGarden;
  const cam = camAt(f, [
    [CUES.sceneGarden, 540, 1060, 1.12],
    [CUES.sceneCard + XF, 540, 940, 1.0],
  ]);
  // one coin every 22 frames from the "pension" cue
  const period = 22;
  const coins = Array.from({ length: 7 }, (_, k) => CUES.pension - 18 + k * period);
  const landed = coins.filter((a) => f >= a + 18).length;
  const lastLand = landed > 0 ? coins[landed - 1] + 18 : -99;
  const bob = f - lastLand < 10 ? 10 * Math.sin(((f - lastLand) / 10) * Math.PI) : 0;
  const HAND: [number, number] = [540 + 240, 1260 - 200];
  return (
    <g transform={cam}>
      <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8fd0f7" />
        <stop offset="1" stopColor="#fff1cf" />
      </linearGradient>
      <rect x={-300} y={-300} width={W + 600} height={H + 600} fill="url(#skyG)" />
      <Glow x={880} y={300} r={340} />
      <circle cx={880} cy={300} r={80} fill="#ffe08a" />
      {[0, 1, 2].map((k) => {
        const x = ((rnd(`gc${k}`) * 1300 + t * (0.5 + k * 0.2)) % 1500) - 250;
        return (
          <g key={k} transform={`translate(${x} ${180 + k * 150})`} fill="#fff" opacity={0.85}>
            <ellipse rx={120} ry={46} />
            <ellipse cx={-70} cy={14} rx={80} ry={38} />
            <ellipse cx={74} cy={12} rx={86} ry={40} />
          </g>
        );
      })}
      {/* hills */}
      <ellipse cx={200} cy={1380} rx={900} ry={260} fill="#a5d98d" />
      <ellipse cx={900} cy={1420} rx={800} ry={240} fill="#93cf7c" />
      <rect x={-300} y={1420} width={W + 600} height={H} fill="#86c46f" />
      <Tree f={f} x={420} y={1440} />
      {/* bench */}
      <g transform="translate(540 1260)">
        <rect x={-260} y={-120} width={520} height={26} rx={10} fill="#a8683d" />
        <rect x={-260} y={-80} width={520} height={26} rx={10} fill="#a8683d" />
        <rect x={-280} y={0} width={560} height={30} rx={10} fill="#bd7a49" />
        <rect x={-240} y={30} width={24} height={180} fill="#5a4636" />
        <rect x={216} y={30} width={24} height={180} fill="#5a4636" />
        <OldJonas f={f} mood={landed > 0 ? "happy" : "smile"} bob={bob} />
      </g>
      {/* falling coins: one each month */}
      {coins.map((a, k) => {
        const tt = ramp(f, a, a + 18);
        if (f < a) return null;
        if (tt >= 1) {
          const fade = ramp(f, a + 18, a + 28);
          return fade < 1 ? <Coin key={k} x={HAND[0]} y={HAND[1] - 30 - 30 * fade} r={26} o={1 - fade} /> : null;
        }
        return <Coin key={k} x={lerp(380, HAND[0], tt)} y={lerp(860, HAND[1] - 30, tt * tt) - Math.sin(tt * Math.PI) * 60} r={26} spin={Math.cos(f * 0.4 + k)} />;
      })}
      {/* a little stack of saved coins on the bench beside him */}
      <CoinStack n={Math.min(landed, 6)} x={300} y={1260} />
      <Calendar f={f} x={890} y={760} flips={coins.map((a) => a + 18)} labels={["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG"]} scale={0.9} />
    </g>
  );
};

const GardenLabels: React.FC<{ f: number }> = ({ f }) => {
  const ylO = span(f, CUES.yearsLater, CUES.everyMonth, 8);
  const emO = span(f, CUES.everyMonth, CUES.lessTax, 8);
  const l1 = ramp(f, CUES.lessTax, CUES.lessTax + 10);
  const l2 = ramp(f, CUES.moreLater, CUES.moreLater + 10);
  const outO = 1 - ramp(f, CUES.sceneCard - 4, CUES.sceneCard + XF);
  return (
    <g>
      {ylO > 0 && (
        <Label y={220} o={ylO}>
          <Pill w={460} h={90} fill="rgba(255,255,255,0.92)">
            <text y={17} textAnchor="middle" fontFamily={HAND} fontSize={56} fill={NAVY}>Years later…</text>
          </Pill>
        </Label>
      )}
      {emO > 0 && (
        <Label y={230} o={emO} s={popIn(f, CUES.everyMonth)}>
          <Pill w={760} h={150} fill="#ffffff">
            <text y={-4} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={64} fill={NAVY}>Every month.</text>
            <text y={54} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={50} fill="#1e9e5a">For life.</text>
          </Pill>
        </Label>
      )}
      {l1 > 0 && (
        <g opacity={outO}>
          <Label y={200} o={l1} s={eback(l1)}>
            <Pill w={640} h={120} fill="#ffffff">
              <text y={24} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={68} fill={NAVY}>Less tax now.</text>
            </Pill>
          </Label>
          {l2 > 0 && (
            <Label y={350} o={l2} s={eback(l2)}>
              <Pill w={760} h={120} fill={GOLD}>
                <text y={24} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={68} fill={INK}>More money later.</text>
              </Pill>
            </Label>
          )}
        </g>
      )}
    </g>
  );
};

const SceneCard: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneCard;
  const up = eback(ramp(f, CUES.sceneCard + 2, CUES.sceneCard + 22));
  const line = (a: number) => eout(ramp(f, CUES.sceneCard + a, CUES.sceneCard + a + 12));
  const pulse = 1 + 0.03 * Math.sin(t * 0.25) * ramp(f, CUES.chime, CUES.chime + 10);
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
      {/* the plant, all grown up, on top of the card */}
      <g opacity={line(30)} transform={`translate(0 ${30 * (1 - line(30))})`}>
        <Sapling f={f} g={1} x={540} y={470} />
        <Pot x={540} y={596} />
      </g>
      <g transform={`translate(0 ${lerp(900, 0, up)})`}>
        <rect x={90} y={640} width={900} height={720} rx={48} fill="#000" opacity={0.18} transform="translate(0 16)" />
        <rect x={90} y={640} width={900} height={720} rx={48} fill="#ffffff" />
        <g opacity={line(8)} transform={`translate(0 ${20 * (1 - line(8))})`}>
          <text x={540} y={760} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Basisrente?</text>
          <text x={540} y={820} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Talk to</text>
        </g>
        <g opacity={line(18)} transform={`translate(0 ${20 * (1 - line(18))})`}>
          <text x={540} y={950} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={110} fill={NAVY}>Robin Emig</text>
          <text x={540} y={1035} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={62} fill={BLUE}>Allianz</text>
        </g>
        <rect x={240} y={1090} width={600} height={6} rx={3} fill="#e3e8f2" opacity={line(30)} />
        <g opacity={line(34)} transform={`translate(540 1220) scale(${pulse})`}>
          <rect x={-400} y={-70} width={800} height={130} rx={65} fill="#eaf2ff" />
          <g transform="translate(-345 -6)">
            <path d="M -22,-34 C -32,-34 -38,-26 -36,-16 C -30,14 -8,36 22,40 C 32,42 40,36 40,26 L 40,14 C 40,8 36,4 30,4 L 18,4 C 12,4 10,10 8,14 C -4,10 -14,0 -18,-12 C -12,-14 -8,-18 -8,-24 L -8,-36 C -8,-42 -12,-44 -18,-44 Z" fill={BLUE} transform="translate(0 6)" />
          </g>
          <text x={45} y={22} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={66} fill={NAVY}>+49 160 97626099</text>
        </g>
      </g>
      <g opacity={line(46)}>
        <text x={540} y={1480} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={34} fill="#dbe7fb">Example only. Tax depends on your income.</text>
        <text x={540} y={1526} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={34} fill="#dbe7fb">The pension is taxed in retirement.</text>
      </g>
    </g>
  );
};

const SCENE_COMPONENTS: Record<string, React.FC<{ f: number }>> = {
  office: (p) => (
    <g>
      <SceneOffice {...p} />
      <OfficeLabels {...p} />
    </g>
  ),
  garden: (p) => (
    <g>
      <SceneGarden {...p} />
      <GardenLabels {...p} />
    </g>
  ),
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
        {subsOn && <rect y={H * 0.7} width={W} height={H * 0.3} fill="url(#subScrim)" opacity={0.8} />}
      </svg>
      {subsOn && <Subtitles f={f} subs={SUBS} width={width} height={height} />}
      {STORY.audio && <Audio src={staticFile(STORY.audio)} />}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
