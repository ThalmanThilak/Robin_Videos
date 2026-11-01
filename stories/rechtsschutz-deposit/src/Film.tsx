import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { HAND, NUNITO } from "./kit/fonts";
import { CUES, SCENES, STORY, SUBS, XF } from "./story";
import { clamp01, eback, eio, eout, lerp, ramp, rnd, wobble } from "./kit/helpers";
import { Face, Glow, StoryDefs } from "./kit/parts";
import { Subtitles } from "./kit/Subtitles";

// "Max and the deposit": a 30 s, 9:16 legal protection (Rechtsschutz) story for Robin Emig, Allianz.
// Max is the same character as in stories/liability-max. Everything is drawn in a 1080 x 1920
// design space. All timing comes from src/story.ts.

const W = 1080, H = 1920;
const FEET = 1520; // where standing characters' feet touch the floor
const INK = "#2b1d18";
const SKIN = "#f3c39b";
const JACKET = "#f0a03c";
const PANTS = "#34477a";
const HAIR = "#5a3825";
const RED = "#e8352e"; // the red key tag (the token)
const GOLD = "#f2c14e";

type Mood = "smile" | "happy" | "o" | "sad";
type Brows = "none" | "angry" | "worried";

// ---------- small helpers ----------
const camT = (cx: number, cy: number, z: number) => `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`;
type Cam = [number, number, number];
const camLerp = (t: number, a: Cam, b: Cam) => {
  const e = eio(clamp01(t));
  return camT(lerp(a[0], b[0], e), lerp(a[1], b[1], e), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), e)));
};
// Camera through several keys: [frame, cx, cy, zoom].
const camKeys = (f: number, keys: [number, number, number, number][]) => {
  for (let k = 0; k < keys.length - 1; k++) {
    const [f0, ...a] = keys[k], [f1, ...b] = keys[k + 1];
    if (f <= f1) return camLerp(ramp(f, f0, f1), a as Cam, b as Cam);
  }
  const [, ...l] = keys[keys.length - 1];
  return camT(l[0], l[1], l[2]);
};

// Shoulder of the front arm and the arm length, shared by Person and handPos.
const SH = [56, -390];
const ARM = 150;
// World position of a standing person's front hand. a = arm angle in degrees (0 = down, 90 = straight forward).
const handPos = (ox: number, a: number, flip = false, scale = 1): [number, number] => {
  const r = (a * Math.PI) / 180;
  const hx = (SH[0] + ARM * Math.sin(r)) * scale;
  const hy = (SH[1] + ARM * Math.cos(r)) * scale;
  return [ox + (flip ? -hx : hx), FEET + hy];
};

const SkyGrad: React.FC<{ id: string; top: string; bottom: string }> = ({ id, top, bottom }) => (
  <>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={top} />
      <stop offset="1" stopColor={bottom} />
    </linearGradient>
    <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill={`url(#${id})`} />
  </>
);

// ---------- props ----------
// The token: a gold key with a red tag. Origin = the top of the ring (where it hangs).
const Key: React.FC<{ swing?: number; scale?: number }> = ({ swing = 0, scale = 1 }) => (
  <g transform={`scale(${scale}) rotate(${swing})`}>
    <path d="M 0,8 C 18,24 34,40 40,62" stroke="#c9b48a" strokeWidth={4} fill="none" />
    <g transform="translate(46 92) rotate(-14)">
      <rect x={-28} y={-34} width={56} height={74} rx={12} fill={RED} />
      <rect x={-28} y={-34} width={56} height={14} rx={7} fill="#fff" opacity={0.25} />
      <circle cx={0} cy={-22} r={6} fill="#fff8e8" />
    </g>
    <circle cx={0} cy={30} r={22} fill="none" stroke={GOLD} strokeWidth={11} />
    <rect x={-7} y={50} width={14} height={92} rx={5} fill={GOLD} />
    <rect x={7} y={110} width={18} height={10} rx={3} fill={GOLD} />
    <rect x={7} y={128} width={13} height={10} rx={3} fill={GOLD} />
    <path d="M -10,22 a 12,12 0 0 1 12,-10" stroke="#fff" strokeWidth={4} fill="none" opacity={0.6} />
  </g>
);

const Coin: React.FC<{ x: number; y: number; r?: number; spin?: number }> = ({ x, y, r = 30, spin = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${Math.max(0.15, Math.abs(Math.cos(spin)))} 1)`}>
    <circle r={r} fill="#e8a92e" />
    <circle r={r * 0.82} fill={GOLD} />
    <text y={r * 0.36} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={r * 1.05} fill="#c4861d">€</text>
  </g>
);

const Piggy: React.FC<{ f: number; shake?: number; happy?: boolean; sparkle?: number }> = ({ f, shake = 0, happy = false, sparkle = 0 }) => (
  <g transform={`rotate(${shake * Math.sin(f * 1.4) * 6})`}>
    <ellipse cx={0} cy={4} rx={100} ry={12} fill="#000" opacity={0.15} />
    <ellipse cx={0} cy={-70} rx={90} ry={70} fill="#ff9fb4" />
    <circle cx={80} cy={-80} r={34} fill="#ff9fb4" />
    <ellipse cx={104} cy={-78} rx={16} ry={12} fill="#f57f9a" />
    <circle cx={100} cy={-80} r={3} fill="#c9506c" /><circle cx={109} cy={-76} r={3} fill="#c9506c" />
    {happy ? (
      <path d="M 66,-102 q 8,-8 16,0" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
    ) : (
      <circle cx={76} cy={-98} r={6} fill={INK} />
    )}
    <path d="M -20,-140 l 20,-26 l 16,24 Z" fill="#f57f9a" />
    <rect x={-30} y={-142} width={50} height={10} rx={5} fill="#c9506c" />
    {[-50, -10, 30, 60].map((x) => <rect key={x} x={x} y={-14} width={20} height={20} rx={6} fill="#f57f9a" />)}
    <path d="M -88,-70 q -24,-6 -18,-24 q 6,-12 14,0" stroke="#f57f9a" strokeWidth={6} fill="none" strokeLinecap="round" />
    {sparkle > 0 &&
      [0, 1, 2].map((k) => {
        const p = ((f + k * 14) % 42) / 42;
        return <path key={k} d={`M ${-60 + k * 50},${-170 - p * 80} l 6,-14 l 6,14 l 14,6 l -14,6 l -6,14 l -6,-14 l -14,-6 Z`} fill="#ffd54a" opacity={sparkle * (1 - p)} />;
      })}
  </g>
);

// ---------- people ----------
// Max's head without the bike helmet: same face, same hair colour, now with a full head of hair.
const MaxHead: React.FC<{ f: number; mood: Mood; look?: [number, number]; brows?: Brows; sweat?: number }> = ({ f, mood, look = [0.6, 0], brows = "none", sweat = 0 }) => (
  <g>
    <circle r={64} fill={SKIN} />
    <ellipse cx={-50} cy={8} rx={12} ry={16} fill="#e6ab84" />
    <path d="M -68,4 C -78,-74 -6,-98 52,-70 C 70,-60 74,-36 66,-16 C 50,-40 20,-50 -14,-44 C -34,-40 -50,-24 -56,6 Z" fill={HAIR} />
    <path d="M 10,-66 C 20,-80 40,-78 46,-66" stroke="#7a5236" strokeWidth={6} fill="none" strokeLinecap="round" />
    <g transform="translate(18 12)">
      <Face f={f} seed={7} size={9.5} gap={40} look={look} mood={mood} />
      {brows === "angry" && (
        <g stroke={HAIR} strokeWidth={6} strokeLinecap="round">
          <path d="M -32,-22 L -10,-14" /><path d="M 32,-22 L 10,-14" />
        </g>
      )}
      {brows === "worried" && (
        <g stroke={HAIR} strokeWidth={6} strokeLinecap="round">
          <path d="M -32,-16 L -10,-24" /><path d="M 32,-16 L 10,-24" />
        </g>
      )}
    </g>
    {sweat > 0 && (
      <path d={`M -58,${-30 + sweat * 30} q -10,16 0,24 q 10,-8 0,-24 Z`} fill="#9fd4ff" opacity={clamp01(sweat * 3) * (1 - clamp01((sweat - 0.8) * 5))} />
    )}
  </g>
);

const LandlordHead: React.FC<{ f: number; mood: Mood; look?: [number, number] }> = ({ f, mood, look = [0.5, 0] }) => (
  <g>
    <circle r={62} fill="#efbf9a" />
    <path d="M -64,6 C -70,-30 -60,-44 -44,-50 C -30,-34 -36,-10 -48,10 Z" fill="#c9c9d1" />
    <path d="M 64,-6 C 68,-30 60,-44 46,-48 C 40,-30 44,-14 54,0 Z" fill="#c9c9d1" />
    <path d="M -40,-56 C -14,-70 20,-70 40,-56" stroke="#e2a988" strokeWidth={6} fill="none" opacity={0.6} />
    <g transform="translate(12 10)">
      <Face f={f} seed={21} size={8} gap={38} look={look} mood={mood} />
      <g stroke="#7d7d8c" strokeWidth={7} strokeLinecap="round">
        <path d="M -34,-26 L -8,-16" /><path d="M 34,-26 L 8,-16" />
      </g>
      <g fill="none" stroke="#4b4b5a" strokeWidth={4}>
        <circle cx={-19} cy={0} r={17} /><circle cx={19} cy={0} r={17} /><path d="M -2,0 h 4" />
      </g>
      <path d="M -30,28 C -16,18 -4,22 0,26 C 4,22 16,18 30,28 C 20,36 -20,36 -30,28 Z" fill="#b8b8c4" />
    </g>
  </g>
);

const LawyerHead: React.FC<{ f: number; mood: Mood; look?: [number, number] }> = ({ f, mood, look = [0.5, 0] }) => (
  <g>
    <circle cx={-48} cy={-56} r={30} fill="#2e2236" />
    <circle r={62} fill="#d9a07a" />
    <path d="M -66,14 C -76,-70 70,-86 66,0 C 46,-46 -30,-52 -66,14 Z" fill="#2e2236" />
    <g transform="translate(14 14)">
      <Face f={f} seed={33} size={9} gap={38} look={look} mood={mood} />
    </g>
  </g>
);

type Kind = "max" | "landlord" | "lawyer";
const LOOKS: Record<Kind, { coat: string; pants: string; pantsBack: string; skin: string }> = {
  max: { coat: JACKET, pants: PANTS, pantsBack: "#2a3963", skin: SKIN },
  landlord: { coat: "#8a6a52", pants: "#4a4a5c", pantsBack: "#3a3a4a", skin: "#efbf9a" },
  lawyer: { coat: "#2d3e6e", pants: "#2d3e6e", pantsBack: "#22305a", skin: "#d9a07a" },
};

// A standing person facing right (flip = facing left). Origin = feet on the floor.
// armF / armB: arm angles in degrees (0 = hanging down, 90 = straight forward, 160 = up).
const Person: React.FC<{
  f: number; kind: Kind; mood: Mood; seed: number; armF?: number; armB?: number; flip?: boolean;
  look?: [number, number]; brows?: Brows; sweat?: number; walk?: number; hold?: React.ReactNode;
}> = ({ f, kind, mood, seed, armF = 8, armB = -8, flip, look, brows, sweat, walk = 0, hold }) => {
  const c = LOOKS[kind];
  const br = 3 * wobble(f, seed, 0.7);
  const step = walk ? Math.sin(walk) * 18 : 0;
  const lift = walk ? Math.abs(Math.cos(walk)) * 8 : 0;
  return (
    <g transform={flip ? "scale(-1 1)" : undefined}>
      <ellipse cx={0} cy={4} rx={110} ry={14} fill="#000" opacity={0.18} />
      <g transform={`translate(0 ${-lift})`}>
        <path d={`M -30,-230 L ${-36 - step},-10`} stroke={c.pantsBack} strokeWidth={42} strokeLinecap="round" />
        <path d={`M 26,-230 L ${34 + step},-10`} stroke={c.pants} strokeWidth={42} strokeLinecap="round" />
        <ellipse cx={-30 - step} cy={-6} rx={34} ry={15} fill="#3b2a24" />
        <ellipse cx={44 + step} cy={-6} rx={34} ry={15} fill="#3b2a24" />
        {/* back arm */}
        <g transform={`translate(-56 ${-390 + br}) rotate(${-armB})`}>
          <path d="M 0,0 L 0,140" stroke={c.coat} strokeWidth={32} strokeLinecap="round" />
          <circle cx={0} cy={150} r={16} fill={c.skin} />
          {kind === "lawyer" && (
            <g transform="translate(0 160)">
              <rect x={-50} y={0} width={100} height={70} rx={10} fill="#6b4a3a" />
              <path d="M -16,0 v -14 h 32 v 14" stroke="#4a3226" strokeWidth={6} fill="none" />
            </g>
          )}
        </g>
        <path d={`M -78,-200 C -84,-330 -60,${-420 + br} 0,${-428 + br} C 60,${-420 + br} 84,-330 78,-200 Z`} fill={c.coat} />
        {kind === "max" && <path d={`M -30,${-410 + br} Q 0,${-380 + br} 30,${-410 + br}`} stroke="#d1852a" strokeWidth={8} fill="none" />}
        {kind === "lawyer" && (
          <g>
            <path d={`M -26,${-424 + br} L 0,${-340} L 26,${-424 + br} Z`} fill="#ffffff" />
            <path d={`M -6,${-410 + br} L 0,-350 L 6,${-410 + br} Z`} fill="#c4372f" />
          </g>
        )}
        {kind === "landlord" && [0, 1, 2].map((k) => <circle key={k} cx={4} cy={-370 + k * 50 + br} r={7} fill="#5e4636" />)}
        <g transform={`translate(0 ${-500 + br})`}>
          {kind === "max" && <MaxHead f={f} mood={mood} look={look} brows={brows} sweat={sweat} />}
          {kind === "landlord" && <LandlordHead f={f} mood={mood} look={look} />}
          {kind === "lawyer" && <LawyerHead f={f} mood={mood} look={look} />}
        </g>
        {/* front arm */}
        <g transform={`translate(${SH[0]} ${SH[1] + br}) rotate(${-armF})`}>
          <path d={`M 0,0 L 0,${ARM - 10}`} stroke={c.coat} strokeWidth={32} strokeLinecap="round" />
          <circle cx={0} cy={ARM} r={17} fill={c.skin} />
        </g>
      </g>
      {hold}
    </g>
  );
};

// ---------- scenes ----------
const FlatRoom: React.FC<{ f: number; dirty: number }> = ({ f, dirty }) => (
  <g>
    <rect x={-600} y={-600} width={W + 1200} height={1910} fill="#f1e2c4" />
    {Array.from({ length: 16 }, (_, k) => <rect key={k} x={k * 110 - 300} y={-600} width={46} height={1910} fill="#e9d6b2" opacity={0.6} />)}
    {/* a pale patch where a picture used to hang */}
    <rect x={470} y={470} width={180} height={140} rx={6} fill="#f8eedb" />
    <circle cx={560} cy={460} r={6} fill="#9b8a6c" />
    {/* window with sunlight */}
    <rect x={60} y={360} width={360} height={520} rx={18} fill="#ffffff" />
    <rect x={80} y={380} width={320} height={480} rx={10} fill="#bfe3fb" />
    <path d="M 240,380 V 860 M 80,620 H 400" stroke="#ffffff" strokeWidth={14} />
    <circle cx={330} cy={470} r={44} fill="#fff1a8" opacity={0.9} />
    <path d="M 80,860 L 400,860 L 760,1600 L -160,1600 Z" fill="#fff7d8" opacity={0.28} />
    {/* door to the hallway */}
    <rect x={770} y={560} width={270} height={760} fill="#4a3a35" />
    <rect x={754} y={548} width={302} height={24} rx={6} fill="#ffffff" />
    <rect x={754} y={548} width={20} height={772} fill="#ffffff" />
    <rect x={1036} y={548} width={20} height={772} fill="#ffffff" />
    {/* floor */}
    <rect x={-600} y={1310} width={W + 1200} height={1200} fill="#c98f5a" />
    {Array.from({ length: 9 }, (_, k) => <rect key={k} x={-600} y={1330 + k * 70} width={W + 1200} height={4} fill="#a8703f" opacity={0.6} />)}
    <rect x={-600} y={1300} width={W + 1200} height={18} fill="#ffffff" />
    {/* dust that the mop wipes away */}
    <g opacity={dirty}>
      {Array.from({ length: 10 }, (_, k) => (
        <ellipse key={k} cx={80 + rnd(`dx${k}`) * 900} cy={1360 + rnd(`dy${k}`) * 200} rx={30 + rnd(`dr${k}`) * 40} ry={10} fill="#8a6a4a" opacity={0.35} />
      ))}
    </g>
    <Glow x={330} y={470} r={320} opacity={0.6 + 0.08 * Math.sin(f * 0.07)} />
  </g>
);

const SceneFlat: React.FC<{ f: number }> = ({ f }) => {
  const walkT = ramp(f, CUES.hand - 4, CUES.hand + 20);
  const maxX = lerp(300, 560, eio(walkT));
  const mopping = f < CUES.hand;
  const mopA = 40 + 18 * Math.sin(f * 0.22);
  const armF = mopping ? mopA : lerp(mopA, 92, eout(ramp(f, CUES.hand + 4, CUES.hand + 22)));
  const lordIn = eout(ramp(f, CUES.hand - 10, CUES.hand + 14));
  const lordX = lerp(1220, 900, lordIn);
  const lordArm = lerp(10, 70, eout(ramp(f, CUES.keys - 12, CUES.keys)));
  const give = eio(ramp(f, CUES.keys, CUES.keys + 10));
  const [mhx, mhy] = handPos(maxX, armF);
  const [lhx, lhy] = handPos(lordX, lordArm, true);
  const keyX = lerp(mhx, lhx, give), keyY = lerp(mhy, lhy, give) - 14;
  const [hx, hy] = handPos(maxX, mopA);
  const mopFoot = [hx + 150, FEET - 30];
  const dirty = 1 - ramp(f, 10, CUES.hand - 20);
  return (
    <g transform={camKeys(f, [[0, 540, 980, 1.0], [CUES.hand - 10, 500, 980, 1.06], [CUES.keys + 6, 720, 1000, 1.22]])}>
      <FlatRoom f={f} dirty={dirty} />
      {/* the mop: in Max's hands, then leaning on the wall */}
      {mopping ? (
        <g>
          <path d={`M ${hx - 30},${hy - 70} L ${mopFoot[0]},${mopFoot[1]}`} stroke="#b07a3e" strokeWidth={12} strokeLinecap="round" />
          <path d={`M ${mopFoot[0] - 50},${mopFoot[1]} q 50,40 100,0 l -10,30 h -80 Z`} fill="#8fc7e8" />
        </g>
      ) : (
        <g>
          <path d="M 70,1050 L 150,1500" stroke="#b07a3e" strokeWidth={12} strokeLinecap="round" />
          <path d="M 100,1500 q 50,30 100,0 l -10,30 h -80 Z" fill="#8fc7e8" />
        </g>
      )}
      {/* sparkles where the floor is clean */}
      {Array.from({ length: 6 }, (_, k) => {
        const p = ((f + k * 11) % 40) / 40;
        const sx = 120 + rnd(`spx${k}`) * 820, sy = 1360 + rnd(`spy${k}`) * 160;
        return <path key={k} d={`M ${sx},${sy - 16 * (1 - p)} l 5,-12 l 5,12 l 12,5 l -12,5 l -5,12 l -5,-12 l -12,-5 Z`} fill="#fff" opacity={(1 - dirty) * Math.sin(p * Math.PI)} />;
      })}
      <g transform={`translate(${lordX} ${FEET})`}>
        <Person f={f} kind="landlord" seed={21} mood="sad" flip armF={lordArm} look={[0.6, 0.2]} />
      </g>
      <g transform={`translate(${maxX} ${FEET})`}>
        <Person f={f} kind="max" seed={7} mood={f >= CUES.keys ? "smile" : "happy"} armF={armF} look={mopping ? [0.6, 0.8] : [0.8, 0]} walk={walkT > 0 && walkT < 1 ? f * 0.5 : 0} />
      </g>
      <g transform={`translate(${keyX} ${keyY})`} opacity={ramp(f, CUES.hand + 6, CUES.hand + 14)}>
        <Key swing={Math.sin(f * 0.25) * 10} scale={0.9} />
      </g>
    </g>
  );
};

const SceneLetter: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneLetter;
  const drop = eback(ramp(f, CUES.sceneLetter, CUES.sceneLetter + 18));
  const stamp = ramp(f, CUES.stamp, CUES.stamp + 8);
  const shake = f >= CUES.cent && f < CUES.cent + 30 ? 1 - ramp(f, CUES.cent + 18, CUES.cent + 30) : 0;
  const jolt = f >= CUES.stamp && f < CUES.stamp + 8 ? Math.sin((f - CUES.stamp) * 2.5) * 8 * (1 - stamp) : 0;
  return (
    <g transform={camLerp(t / 120, [540, 960, 1.0], [560, 980, 1.06])}>
      <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill="#ead2ad" />
      {Array.from({ length: 12 }, (_, k) => <circle key={k} cx={(k % 4) * 300 + 80} cy={Math.floor(k / 4) * 520 + 200} r={70} fill="#e3c79c" opacity={0.6} />)}
      <Glow x={540} y={560} r={620} opacity={0.5} />
      {/* the letter */}
      <g transform={`translate(${540 + jolt} ${lerp(-500, 610, drop)}) rotate(${lerp(-20, -3, drop)})`}>
        <rect x={-300} y={-360} width={600} height={720} rx={14} fill="#000" opacity={0.12} transform="translate(10 14)" />
        <rect x={-300} y={-360} width={600} height={720} rx={14} fill="#ffffff" />
        <text x={0} y={-270} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={60} fill="#3c3a4a">Your deposit</text>
        <text x={0} y={-212} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={34} fill="#8a879a">(Kaution)</text>
        <rect x={-240} y={-180} width={480} height={6} fill="#d4d0de" />
        {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={-240} y={-130 + k * 56} width={480 - (k % 3) * 90} height={18} rx={9} fill="#d4d0de" />)}
        <path d="M 60,280 c 20,-30 40,20 60,-10 s 40,10 70,-20" stroke="#3c3a4a" strokeWidth={5} fill="none" />
        {f >= CUES.stamp && (
          <g transform={`translate(0 40) rotate(-14) scale(${lerp(2.4, 1, eout(stamp))})`} opacity={clamp01(stamp * 2) * 0.92}>
            <rect x={-250} y={-90} width={500} height={180} rx={18} fill="none" stroke="#d2312a" strokeWidth={14} />
            <text x={0} y={-12} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={70} fill="#d2312a">KAUTION</text>
            <text x={0} y={62} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={60} fill="#d2312a">EINBEHALTEN</text>
          </g>
        )}
      </g>
      {/* coins fly out of the piggy bank, every one of them */}
      {f >= CUES.cent &&
        Array.from({ length: 9 }, (_, k) => {
          const p = ramp(f, CUES.cent + k * 2.5, CUES.cent + k * 2.5 + 26);
          if (p <= 0 || p >= 1) return null;
          const x = lerp(300, 1180, p) + (k % 3) * 30;
          const y = 1050 - Math.sin(p * Math.PI) * (360 + (k % 4) * 60) + p * 80;
          return <Coin key={k} x={x} y={y} r={30} spin={f * 0.3 + k} />;
        })}
      <g transform={`translate(300 1220) scale(1.25)`}>
        <Piggy f={f} shake={shake} />
      </g>
      {/* Max, disappointed */}
      <g transform={`translate(${800 + 3 * wobble(f, 2)} ${1150 - 30 * eback(ramp(f, CUES.sceneLetter + 4, CUES.sceneLetter + 20))}) scale(1.5)`}>
        <path d="M -90,150 C -90,80 -50,70 0,70 C 50,70 90,80 90,150 Z" fill={JACKET} />
        <MaxHead f={f} mood={f >= CUES.stamp ? (f >= CUES.cent ? "o" : "sad") : "smile"} look={f >= CUES.cent ? [-0.9, 0.4] : [-0.6, -0.8]} brows={f >= CUES.stamp ? "worried" : "none"} />
      </g>
    </g>
  );
};

const BILL_LABELS = ["Lawyer", "Court", "Lawyer", "Court fees", "Expert", "Lawyer", "Court", "Appeal"];

const Courthouse: React.FC<{ rise: number; bright: number }> = ({ rise, bright }) => (
  <g transform={`translate(540 ${lerp(1500, 0, eout(rise))})`}>
    <g fill={bright > 0.5 ? "#f4f1ea" : "#dcd7cf"}>
      <path d="M -440,420 L 0,190 L 440,420 Z" />
      <rect x={-460} y={420} width={920} height={60} />
      {[-360, -216, -72, 72, 216, 360].map((x) => <rect key={x} x={x - 34} y={480} width={68} height={560} />)}
      <rect x={-480} y={1040} width={960} height={50} />
      <rect x={-520} y={1090} width={1040} height={50} />
      <rect x={-560} y={1140} width={1120} height={50} />
    </g>
    <g fill="#000" opacity={0.08}>{[-360, -216, -72, 72, 216, 360].map((x) => <rect key={x} x={x + 10} y={480} width={24} height={560} />)}</g>
    <text x={0} y={378} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={64} fill="#8a8578" letterSpacing={8}>COURT</text>
    <g transform="translate(0 262) scale(0.7)" stroke="#8a8578" strokeWidth={7} fill="none">
      <path d="M -50,0 h 100 M 0,-30 v 60" />
      <path d="M -66,0 l -16,34 h 32 Z M 66,0 l -16,34 h 32 Z" />
    </g>
  </g>
);

const SceneCourt: React.FC<{ f: number }> = ({ f }) => {
  const fight = f < CUES.costs;
  const rise = ramp(f, CUES.court - 6, CUES.court + 22);
  const nBills = Math.floor(lerp(0, 16, ramp(f, CUES.costs + 6, CUES.shield - 30)));
  const sh = eback(ramp(f, CUES.shield, CUES.shield + 18));
  const bright = ramp(f, CUES.shield - 10, CUES.shield + 30);
  const stamp = ramp(f, CUES.paid, CUES.paid + 8);
  const shrink = 1 - eio(ramp(f, CUES.paid + 6, CUES.paid + 22));
  const lawyerIn = eout(ramp(f, CUES.lawyer - 18, CUES.lawyer + 10));
  const lawyerX = lerp(1300, 660, lawyerIn);
  const safe = f >= CUES.shield;
  const maxMood: Mood = safe ? (f >= CUES.paid ? "happy" : "smile") : fight ? "smile" : "o";
  const maxArm = fight ? lerp(8, 150, eback(ramp(f, CUES.fist - 10, CUES.fist + 4))) : lerp(150, 8, eout(ramp(f, CUES.costs, CUES.costs + 12)));
  const fistShake = fight && f >= CUES.fist ? Math.sin(f * 0.9) * 6 : 0;
  return (
    <g transform={camKeys(f, [[CUES.sceneCourt, 400, 1010, 1.7], [CUES.costs, 420, 1010, 1.6], [CUES.costs + 60, 540, 960, 1.0], [CUES.shield - 10, 540, 960, 1.0], [CUES.sceneBack, 520, 1000, 1.1]])}>
      <SkyGrad id="skyCourt" top="#8d93ad" bottom="#c9c4cf" />
      <rect x={-600} y={-600} width={W + 1200} height={H + 1200} fill="#a8d4f2" opacity={bright} />
      <Courthouse rise={rise} bright={bright} />
      <rect x={-600} y={1190} width={W + 1200} height={H} fill={bright > 0.5 ? "#e8e1d3" : "#bdb6aa"} />
      {/* the pile of bills */}
      <g transform={`translate(800 ${FEET}) scale(1 ${shrink})`}>
        {Array.from({ length: nBills }, (_, k) => (
          <g key={k} transform={`translate(${(rnd(`bo${k}`) - 0.5) * 40} ${-60 - k * 52}) rotate(${(rnd(`br${k}`) - 0.5) * 8})`}>
            <rect x={-140} y={-24} width={280} height={50} rx={6} fill="#ffffff" stroke="#d8d4e2" strokeWidth={3} />
            <text x={-118} y={12} fontFamily={NUNITO} fontWeight={800} fontSize={28} fill="#3c3a4a">{BILL_LABELS[k % BILL_LABELS.length]}</text>
            <text x={118} y={14} textAnchor="end" fontFamily={NUNITO} fontWeight={900} fontSize={32} fill="#c4372f">€€€</text>
          </g>
        ))}
      </g>
      {f >= CUES.paid && shrink > 0.02 && (
        <g transform={`translate(840 ${FEET - 700}) rotate(-12) scale(${lerp(2.2, 1, eout(stamp))})`} opacity={clamp01(stamp * 2) * shrink}>
          <rect x={-160} y={-60} width={320} height={120} rx={16} fill="#ffffff" opacity={0.85} />
          <rect x={-160} y={-60} width={320} height={120} rx={16} fill="none" stroke="#1e9e5a" strokeWidth={12} />
          <text x={0} y={30} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={86} fill="#1e9e5a">PAID</text>
        </g>
      )}
      {/* the protective bubble around Max, and the shield above him */}
      {safe && (
        <g>
          <ellipse cx={380} cy={1200} rx={260 * sh} ry={380 * sh} fill="#7cc4ff" opacity={0.18} stroke="#ffffff" strokeWidth={6} strokeOpacity={0.7} />
          <g transform={`translate(380 520) scale(${sh})`} opacity={clamp01(sh)}>
            <Glow x={0} y={0} r={380} warm={false} />
            <path d="M 0,-250 C 80,-205 150,-195 210,-195 C 210,-20 170,150 0,260 C -170,150 -210,-20 -210,-195 C -150,-195 -80,-205 0,-250 Z" fill="#2f78d6" stroke="#ffffff" strokeWidth={12} />
            <path d="M -70,-90 L -20,-40 L 80,-150" stroke="#ffffff" strokeWidth={22} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x={-260} y={-10} width={520} height={92} rx={18} fill="#ffffff" />
            <text x={0} y={60} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={52} fill="#0c2f6b">RECHTSSCHUTZ</text>
            <text x={0} y={140} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={30} fill="#ffffff">legal protection</text>
          </g>
        </g>
      )}
      {f >= CUES.lawyer - 18 && (
        <g transform={`translate(${lawyerX} ${FEET})`}>
          <Person f={f} kind="lawyer" seed={33} mood="smile" flip armF={f >= CUES.paid ? 60 : 10} look={[0.7, 0]} walk={lawyerIn < 1 ? f * 0.5 : 0} />
        </g>
      )}
      <g transform={`translate(${380 + fistShake} ${FEET})`}>
        <Person f={f} kind="max" seed={7} mood={maxMood} armF={maxArm} brows={fight ? "angry" : safe ? "none" : "worried"} look={safe ? [0.8, 0] : fight ? [0.6, -0.3] : [0.8, -0.8]} sweat={!fight && !safe ? ramp(f, CUES.costs + 20, CUES.costs + 70) : 0} />
      </g>
    </g>
  );
};

const SceneBack: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneBack;
  const pop = eback(ramp(f, CUES.sceneBack, CUES.sceneBack + 16));
  const full = ramp(f, CUES.coinsBack, CUES.coinsBack + 34);
  const cheer = f >= CUES.coinsBack + 6;
  return (
    <g transform={camLerp(t / 90, [540, 960, 1.0], [540, 940, 1.05])}>
      <SkyGrad id="skyBack" top="#7cc4f4" bottom="#fff1cf" />
      <g transform={`translate(540 520) rotate(${t * 0.5})`}>
        {Array.from({ length: 14 }, (_, k) => <rect key={k} x={-14} y={-900} width={28} height={700} fill="#fff4c8" opacity={0.35} transform={`rotate(${k * (360 / 14)})`} />)}
      </g>
      <rect x={-600} y={1300} width={W + 1200} height={H} fill="#bfe3a8" />
      <rect x={-600} y={1300} width={W + 1200} height={16} fill="#a3d08a" />
      {/* coins fly back in */}
      {Array.from({ length: 9 }, (_, k) => {
        const p = ramp(f, CUES.coinsBack + k * 3 - 10, CUES.coinsBack + k * 3 + 14);
        if (p <= 0 || p >= 1) return null;
        const x = lerp(1180 - (k % 3) * 40, 600, eio(p));
        const y = lerp(200 + (k % 4) * 60, 820, p) - Math.sin(p * Math.PI) * 160;
        return <Coin key={k} x={x} y={y} r={34} spin={f * 0.3 + k} />;
      })}
      <g transform={`translate(600 ${1150}) scale(${2.0 * pop * (1 + 0.06 * Math.sin(full * Math.PI * 4) * (1 - full))})`}>
        <Piggy f={f} happy={full > 0.5} sparkle={full} />
      </g>
      <g transform={`translate(240 ${FEET - (cheer ? Math.abs(Math.sin(f * 0.3)) * 30 : 0)})`}>
        <Person f={f} kind="max" seed={7} mood={cheer ? "happy" : "smile"} armF={cheer ? 160 : 30} armB={cheer ? -160 : -10} look={[0.8, -0.4]} />
      </g>
    </g>
  );
};

const SceneHome: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneHome;
  const reach = eio(ramp(f, CUES.hang - 18, CUES.hang));
  const armF = f < CUES.hang + 8 ? lerp(10, 150, reach) : lerp(150, 10, eout(ramp(f, CUES.hang + 8, CUES.hang + 24)));
  const maxX = 480;
  const [hx, hy] = handPos(maxX, armF, true);
  const hookX = 300, hookY = 1000;
  const onHook = f >= CUES.hang;
  const swing = onHook ? 22 * Math.exp(-(f - CUES.hang) / 22) * Math.sin((f - CUES.hang) * 0.35) : 0;
  return (
    <g transform={camLerp(t / 88, [560, 1000, 1.12], [520, 960, 1.0])}>
      <rect x={-600} y={-600} width={W + 1200} height={1910} fill="#fbe0c2" />
      {Array.from({ length: 30 }, (_, k) => <circle key={k} cx={(k % 6) * 200 - 20} cy={Math.floor(k / 6) * 260 + 60} r={10} fill="#f4cfa6" />)}
      {/* lamp and warm light */}
      <Glow x={900} y={560} r={520} opacity={0.75 + 0.05 * Math.sin(f * 0.2)} />
      <path d="M 900,0 V 470" stroke="#6b4a3a" strokeWidth={6} />
      <path d="M 830,560 L 970,560 L 940,470 L 860,470 Z" fill="#ffcf6b" />
      {/* shelf with the piggy bank */}
      <rect x={700} y={820} width={340} height={20} rx={6} fill="#b07a3e" />
      <g transform="translate(860 820) scale(0.8)"><Piggy f={f} happy sparkle={0.5} /></g>
      {/* plant */}
      <g transform="translate(980 1310)">
        <path d="M -60,0 L -50,-120 L 50,-120 L 60,0 Z" fill="#d9734a" />
        {[-50, -20, 10, 40].map((a, k) => <ellipse key={k} cx={a * 0.8} cy={-200 - (k % 2) * 40} rx={34} ry={90} fill="#5bb06a" transform={`rotate(${a * 0.6 + 3 * Math.sin(f * 0.05 + k)} ${a * 0.8} -120)`} />)}
      </g>
      {/* key board with hooks */}
      <rect x={150} y={940} width={240} height={90} rx={14} fill="#c98f5a" />
      {[200, 300].map((x) => <path key={x} d={`M ${x},975 v 26 q 0,14 12,10`} stroke="#6b4a3a" strokeWidth={8} fill="none" strokeLinecap="round" />)}
      <text x={270} y={918} textAnchor="middle" fontFamily={HAND} fontSize={48} fill="#8a5a3a">home</text>
      {/* floor */}
      <rect x={-600} y={1310} width={W + 1200} height={1200} fill="#d9a46c" />
      <rect x={-600} y={1300} width={W + 1200} height={18} fill="#ffffff" />
      <ellipse cx={560} cy={1520} rx={400} ry={70} fill="#e98b6b" opacity={0.6} />
      <g transform={`translate(${maxX} ${FEET})`}>
        <Person f={f} kind="max" seed={7} mood={onHook ? "happy" : "smile"} flip armF={armF} look={onHook && f > CUES.hang + 16 ? [0, 0] : [0.7, -0.6]} />
      </g>
      <g transform={`translate(${onHook ? hookX : hx} ${onHook ? hookY + 22 : hy - 14})`}>
        <Key swing={onHook ? swing : Math.sin(f * 0.25) * 8} scale={0.9} />
      </g>
    </g>
  );
};

const SceneCard: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneCard;
  const up = eback(ramp(f, CUES.sceneCard + 2, CUES.sceneCard + 22));
  const line = (a: number) => eout(ramp(f, CUES.sceneCard + a, CUES.sceneCard + a + 12));
  const pulse = 1 + 0.03 * Math.sin(t * 0.25) * ramp(f, CUES.sceneCard + 50, CUES.sceneCard + 60);
  const keyT = Math.max(0, f - CUES.cardKey);
  const swing = 6 * Math.sin(t * 0.12) + (f >= CUES.cardKey ? 20 * Math.exp(-keyT / 18) * Math.sin(keyT * 0.5) : 0);
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
          <text x={540} y={730} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={46} fill="#4a5578">Rechtsschutzversicherung?</text>
          <text x={540} y={796} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Talk to</text>
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
      {/* the red-tag key, one last time */}
      <g transform={`translate(540 1430)`} opacity={line(40)}>
        <path d="M -60,0 H 60" stroke="#ffffff" strokeWidth={8} strokeLinecap="round" opacity={0.6} />
        <Key swing={swing} scale={1.6} />
      </g>
    </g>
  );
};

const SCENE_COMPONENTS: Record<string, React.FC<{ f: number }>> = {
  flat: SceneFlat,
  letter: SceneLetter,
  court: SceneCourt,
  back: SceneBack,
  home: SceneHome,
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
          // the incoming scene fades in over XF frames on top of the outgoing one
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
