import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { NUNITO } from "./kit/fonts";
import { CUES, SCENES, STORY, SUBS, XF } from "./story";
import { clamp01, eback, eio, eout, lerp, ramp, rnd, wobble } from "./kit/helpers";
import { Face, Glow, StoryDefs } from "./kit/parts";
import { Subtitles } from "./kit/Subtitles";

// "Tom and the small card": a 30 s, 9:16 travel health insurance story for Robin Emig, Allianz.
// Everything is drawn in a 1080 x 1920 design space. All timing comes from src/story.ts.

const W = 1080, H = 1920;
const INK = "#2b1d18";
const SKIN = "#f3c39b";
const HAIR = "#6b4128";
const JACKET = "#e8553e";
const JACKET_DARK = "#c23e2c";
const PANTS = "#2e3f6e";
const BOOT = "#3b3f55";
const HAT = "#ffc93c";
const HAT_DARK = "#e9a91f";
const GOGGLE = "#2bb3a3";
const SKI = "#2bb3a3";
const MITTEN = "#2e3f6e";
const CARD = "#2f78d6";
const SNOW = "#f5f9ff";
const SNOW_SHADE = "#d3def2";

type Mood = "smile" | "happy" | "o" | "sad";

// ---------- small helpers ----------
const camT = (cx: number, cy: number, z: number) => `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`;
const camLerp = (t: number, a: [number, number, number], b: [number, number, number]) => {
  const e = eio(clamp01(t));
  return camT(lerp(a[0], b[0], e), lerp(a[1], b[1], e), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), e)));
};

const SkyGrad: React.FC<{ id: string; stops: string[] }> = ({ id, stops }) => (
  <>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      {stops.map((c, i) => <stop key={i} offset={i / (stops.length - 1)} stopColor={c} />)}
    </linearGradient>
    <rect x={-1400} y={-1400} width={W + 2800} height={H + 2800} fill={`url(#${id})`} />
  </>
);

// ---------- world parts ----------
type Pt = [number, number];
const Range: React.FC<{ pts: Pt[]; color: string; cap?: string; base?: number }> = ({ pts, color, cap = SNOW, base = 2400 }) => {
  const d = `M ${pts[0][0]},${base} ` + pts.map((p) => `L ${p[0]},${p[1]}`).join(" ") + ` L ${pts[pts.length - 1][0]},${base} Z`;
  const caps: React.ReactNode[] = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i], [lx, ly] = pts[i - 1], [rx, ry] = pts[i + 1];
    if (py > ly || py > ry) continue; // only real peaks
    const A: Pt = [lerp(px, lx, 0.32), lerp(py, ly, 0.32)], B: Pt = [lerp(px, rx, 0.32), lerp(py, ry, 0.32)];
    const m1: Pt = [lerp(B[0], A[0], 0.33), lerp(B[1], A[1], 0.33) + 26], m2: Pt = [lerp(B[0], A[0], 0.66), lerp(B[1], A[1], 0.66) - 4];
    caps.push(<path key={i} d={`M ${A[0]},${A[1]} L ${px},${py} L ${B[0]},${B[1]} L ${m1[0]},${m1[1]} L ${m2[0]},${m2[1] + 18} Z`} fill={cap} />);
  }
  return (
    <g>
      <path d={d} fill={color} />
      {caps}
    </g>
  );
};

const FarAlps: React.FC<{ shift?: number; cool?: number }> = ({ shift = 0, cool = 0 }) => (
  <g transform={`translate(${shift} 0)`}>
    <Range pts={[[-500, 980], [-260, 640], [-60, 820], [180, 470], [420, 760], [640, 540], [880, 800], [1120, 500], [1380, 760], [1600, 600], [1800, 900]]} color={cool ? "#9aa6c4" : "#b3c6ea"} cap={cool ? "#e3e8f2" : "#ffffff"} />
    <Range pts={[[-500, 1100], [-240, 900], [40, 1040], [300, 800], [560, 1010], [820, 840], [1080, 1040], [1340, 860], [1600, 1060]]} color={cool ? "#7f8cb0" : "#8fa6d8"} cap={cool ? "#d6dcea" : "#f2f6ff"} />
  </g>
);

const Pine: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={4} rx={70} ry={12} fill="#9fb0d6" opacity={0.5} />
    <rect x={-10} y={-40} width={20} height={44} fill="#6b4a3a" />
    {[0, 1, 2].map((k) => (
      <g key={k}>
        <path d={`M 0,${-300 + k * 80} L ${70 + k * 22},${-150 + k * 70} L ${-70 - k * 22},${-150 + k * 70} Z`} fill={k === 2 ? "#25584b" : "#2f6b5a"} />
        <path d={`M 0,${-300 + k * 80} L ${26 + k * 6},${-250 + k * 78} L ${8},${-258 + k * 80} L ${-6},${-246 + k * 80} L ${-24 - k * 6},${-252 + k * 78} Z`} fill={SNOW} />
      </g>
    ))}
  </g>
);

const Chalet: React.FC<{ f: number }> = ({ f }) => (
  <g transform="translate(250 1330)">
    <ellipse cx={0} cy={6} rx={280} ry={22} fill="#a9b9dc" opacity={0.6} />
    <rect x={-210} y={-330} width={420} height={330} fill="#a8683f" />
    {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={-210} y={-320 + k * 55} width={420} height={6} fill="#8a5232" opacity={0.6} />)}
    {/* lit windows: the warm light of the scene */}
    {[-110, 110].map((x) => (
      <g key={x}>
        <rect x={x - 55} y={-250} width={110} height={110} rx={10} fill="#ffd27a" opacity={0.9 + 0.08 * Math.sin(f * 0.2 + x)} />
        <path d={`M ${x},-250 v 110 M ${x - 55},-195 h 110`} stroke="#8a5232" strokeWidth={8} />
        <rect x={x - 62} y={-140} width={124} height={22} rx={6} fill="#e8553e" />
      </g>
    ))}
    <rect x={-45} y={-120} width={90} height={120} rx={10} fill="#6b3b2a" />
    <circle cx={25} cy={-60} r={7} fill="#ffd27a" />
    {/* roof with snow */}
    <path d="M -270,-310 L 0,-520 L 270,-310 Z" fill="#6b3b2a" />
    <path d="M -282,-300 L 0,-536 L 282,-300 L 250,-290 C 200,-320 150,-300 110,-320 C 60,-300 0,-330 -60,-312 C -120,-330 -180,-300 -250,-292 Z" fill={SNOW} />
    <rect x={120} y={-520} width={48} height={110} fill="#7a4a35" />
    <rect x={112} y={-534} width={64} height={22} rx={8} fill={SNOW} />
    {/* chimney smoke */}
    {[0, 1, 2].map((k) => {
      const p = ((f + k * 22) % 66) / 66;
      return <circle key={k} cx={144 + p * 60 + 10 * Math.sin(p * 6)} cy={-560 - p * 180} r={18 + p * 30} fill="#fff" opacity={0.55 * (1 - p)} />;
    })}
    <Glow x={0} y={-190} r={320} opacity={0.55} />
  </g>
);

const Snowfall: React.FC<{ f: number; amount?: number; drift?: number }> = ({ f, amount = 1, drift = 0.5 }) => (
  <g opacity={0.85 * amount}>
    {Array.from({ length: 46 }, (_, k) => {
      const sp = 1.4 + rnd(`sv${k}`) * 2.2;
      const y = ((rnd(`sy${k}`) * (H + 200) + f * sp) % (H + 200)) - 100;
      const x = ((rnd(`sx${k}`) * (W + 200) + Math.sin(f * 0.03 + k) * 30 + f * drift) % (W + 200)) - 100;
      return <circle key={k} cx={x} cy={y} r={3 + rnd(`sr${k}`) * 6} fill="#fff" />;
    })}
  </g>
);

const Clouds: React.FC<{ f: number; speed?: number; color?: string; y0?: number }> = ({ f, speed = 0.6, color = "#ffffff", y0 = 160 }) => (
  <g>
    {[0, 1, 2, 3].map((k) => {
      const x = ((rnd(`cx${k}`) * 1500 - f * speed * (1 + k * 0.3)) % 1600 + 1600) % 1600 - 300;
      const y = y0 + k * 130;
      return (
        <g key={k} transform={`translate(${x} ${y}) scale(${0.8 + 0.2 * k})`} fill={color} opacity={0.92}>
          <ellipse rx={150} ry={56} />
          <ellipse cx={-90} cy={18} rx={100} ry={44} />
          <ellipse cx={95} cy={16} rx={110} ry={46} />
          <ellipse cx={20} cy={-36} rx={90} ry={56} />
        </g>
      );
    })}
  </g>
);

// ---------- the token: Tom's small blue card ----------
const BlueCard: React.FC<{ f: number; glow?: number; s?: number }> = ({ f, glow = 0, s = 1 }) => (
  <g transform={`scale(${s})`}>
    {glow > 0 && <Glow x={0} y={0} r={260} opacity={glow} />}
    {glow > 0 &&
      [0, 1, 2, 3, 4].map((k) => {
        const p = ((f + k * 11) % 55) / 55;
        const a = k * 1.3 + 0.4;
        return <path key={k} transform={`translate(${Math.cos(a) * (120 + p * 80)} ${Math.sin(a) * (80 + p * 60) - p * 40}) scale(${0.6 + 0.6 * (1 - p)})`} d="M 0,-16 L 5,-5 L 16,0 L 5,5 L 0,16 L -5,5 L -16,0 L -5,-5 Z" fill="#fff3b0" opacity={glow * (1 - p)} />;
      })}
    <rect x={-100} y={-63} width={200} height={126} rx={16} fill="#000" opacity={0.18} transform="translate(5 6)" />
    <rect x={-100} y={-63} width={200} height={126} rx={16} fill={CARD} />
    <rect x={-100} y={18} width={200} height={20} fill="#1d5bb0" />
    <rect x={-78} y={-40} width={34} height={26} rx={5} fill="#ffd54a" />
    <path d="M -78,-27 h 34 M -61,-40 v 26" stroke="#e0a91e" strokeWidth={2} />
    {/* white cross and a small plane */}
    <path d="M 44,-44 h 16 v 16 h 16 v 16 h -16 v 16 h -16 v -16 h -16 v -16 h 16 Z" fill="#fff" />
    <path d="M -28,-4 l 60,-10 l 10,4 l -60,12 Z M 4,-10 l -10,-16 l 8,0 l 16,14 Z M 4,-3 l -6,14 l 8,0 l 12,-12 Z" fill="#fff" opacity={0.9} />
    <rect x={-100} y={-63} width={200} height={126} rx={16} fill="none" stroke="#fff" strokeWidth={3} opacity={0.4} />
    <path d="M -80,-58 L -40,-58" stroke="#fff" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
  </g>
);

// ---------- Tom ----------
// One head for every shot, so Tom looks the same in close-ups.
const Head: React.FC<{ f: number; mood: Mood; look?: [number, number]; sweat?: number; open?: number }> = ({ f, mood, look = [0.5, 0], sweat = 0, open }) => (
  <g>
    <circle r={60} fill={SKIN} />
    <ellipse cx={-50} cy={8} rx={11} ry={15} fill="#e6ab84" />
    <path d="M -58,-10 C -44,4 -14,-4 10,-18 L -60,-32 Z" fill={HAIR} />
    {/* bobble hat */}
    <path d="M -66,-12 C -72,-96 72,-102 68,-14 Z" fill={HAT} />
    <rect x={-70} y={-28} width={142} height={24} rx={12} fill={HAT_DARK} />
    {[-50, -26, -2, 22, 46].map((x) => <rect key={x} x={x} y={-26} width={6} height={20} rx={3} fill="#d99712" opacity={0.6} />)}
    <circle cx={-4} cy={-94} r={22} fill="#fff4e0" />
    <circle cx={-12} cy={-100} r={8} fill="#fff" opacity={0.8} />
    {/* goggles pushed up on the hat */}
    <rect x={-22} y={-66} width={88} height={30} rx={15} fill={GOGGLE} />
    <rect x={-14} y={-61} width={72} height={20} rx={10} fill="#a5ecff" />
    <path d="M -6,-56 l 18,0" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
    <g transform="translate(16 14)">
      <Face f={f} seed={3} size={10} gap={40} look={look} mood={mood} open={open} />
    </g>
    {sweat > 0 && <path d={`M -56,${-20 + sweat * 26} q -10,16 0,24 q 10,-8 0,-24 Z`} fill="#9fd4ff" opacity={clamp01(sweat * 3) * (1 - clamp01((sweat - 0.8) * 5))} />}
  </g>
);

// Puffy jacket torso, bottom at (0,0), shoulders near y -220.
const Torso: React.FC<{ br?: number; pocketCard?: boolean }> = ({ br = 0, pocketCard }) => (
  <g>
    <path d={`M -82,0 C -92,-120 -66,${-214 + br} 0,${-222 + br} C 66,${-214 + br} 92,-120 82,0 Z`} fill={JACKET} />
    <path d="M -80,-70 C -30,-58 30,-58 80,-70 M -86,-140 C -30,-128 30,-128 86,-140" stroke={JACKET_DARK} strokeWidth={6} fill="none" opacity={0.55} />
    <path d={`M 14,${-214 + br} L 14,0`} stroke={JACKET_DARK} strokeWidth={5} />
    <rect x={-46} y={-14} width={112} height={18} rx={9} fill={JACKET_DARK} />
    {/* chest pocket */}
    <rect x={26} y={-168} width={46} height={40} rx={8} fill={JACKET_DARK} opacity={0.75} />
    {pocketCard && <rect x={30} y={-182} width={36} height={18} rx={3} fill={CARD} />}
    <path d={`M -40,${-212 + br} C -20,${-196 + br} 30,${-196 + br} 50,${-212 + br}`} stroke="#ffffff" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.85} />
  </g>
);

const Arm: React.FC<{ x: number; y: number; rot: number; len?: number; back?: boolean; children?: React.ReactNode }> = ({ x, y, rot, len = 130, back, children }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d={`M 0,0 L 0,${len}`} stroke={back ? JACKET_DARK : JACKET} strokeWidth={34} strokeLinecap="round" />
    <circle cx={0} cy={len + 8} r={21} fill={MITTEN} />
    {children}
  </g>
);

// Standing Tom, facing right. Origin = feet on the snow.
const TomStand: React.FC<{ f: number; mood: Mood; wave?: number; skis?: boolean }> = ({ f, mood, wave = 0, skis }) => {
  const br = 3 * wobble(f, 3, 0.7);
  const waveRot = wave > 0 ? lerp(20, -150 + 22 * Math.sin(f * 0.4), wave) : 20;
  return (
    <g>
      <ellipse cx={0} cy={6} rx={120} ry={16} fill="#8fa3cc" opacity={0.35} />
      <path d="M -26,-210 L -30,-20" stroke="#24335c" strokeWidth={44} strokeLinecap="round" />
      <path d="M 24,-210 L 30,-20" stroke={PANTS} strokeWidth={44} strokeLinecap="round" />
      <rect x={-66} y={-34} width={76} height={38} rx={14} fill={BOOT} />
      <rect x={-6} y={-34} width={80} height={38} rx={14} fill={BOOT} />
      {skis && (
        <g transform="translate(-40 -400) rotate(-62)">
          <rect x={-300} y={-14} width={600} height={20} rx={10} fill={SKI} />
          <rect x={-300} y={10} width={600} height={20} rx={10} fill="#239a8c" />
          <path d="M 290,-14 q 34,-6 30,-34" stroke={SKI} strokeWidth={20} fill="none" strokeLinecap="round" />
        </g>
      )}
      <Arm x={-60} y={-390 + br} rot={skis ? 150 : 18} back />
      <g transform="translate(0 -196)">
        <Torso br={br} />
      </g>
      <Arm x={56} y={-388 + br} rot={waveRot} />
      <g transform={`translate(4 ${-478 + br})`}>
        <Head f={f} mood={mood} />
      </g>
    </g>
  );
};

// Skiing Tom, crouched, facing right. Origin = middle of the skis. Rotate the group to the slope.
const TomSki: React.FC<{ f: number; mood: Mood }> = ({ f, mood }) => {
  const b = 4 * Math.sin(f * 0.5);
  return (
    <g>
      <path d={`M -20,-150 L 50,${-90 + b} L 10,-26`} stroke="#24335c" strokeWidth={42} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M 20,-150 L 90,${-86 + b} L 50,-26`} stroke={PANTS} strokeWidth={42} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={-26} y={-40} width={74} height={34} rx={12} fill={BOOT} />
      <rect x={16} y={-40} width={74} height={34} rx={12} fill={BOOT} />
      {/* skis */}
      <path d="M -190,-8 L 220,-8 Q 262,-10 262,-46" stroke={SKI} strokeWidth={16} fill="none" strokeLinecap="round" />
      <path d="M -170,4 L 240,4 Q 282,2 282,-34" stroke="#239a8c" strokeWidth={16} fill="none" strokeLinecap="round" />
      {/* pole */}
      <path d="M 150,-230 L 40,-12" stroke="#3b3f55" strokeWidth={8} strokeLinecap="round" />
      <ellipse cx={46} cy={-24} rx={18} ry={6} fill="#3b3f55" />
      <g transform={`translate(0 ${-140 + b}) rotate(24)`}>
        <Arm x={-50} y={-190} rot={-40} len={110} back />
        <Torso br={0} />
        <Arm x={50} y={-188} rot={-60} len={120} />
        <g transform="translate(6 -282) rotate(-18)">
          <Head f={f} mood={mood} look={[0.9, 0.2]} />
        </g>
      </g>
    </g>
  );
};

// Tom sitting in the snow, hurt leg out in front. Origin = where he sits.
const TomSit: React.FC<{ f: number; mood: Mood; pain: number }> = ({ f, mood, pain }) => {
  const br = 2 * wobble(f, 5, 0.6);
  return (
    <g>
      <ellipse cx={80} cy={8} rx={240} ry={20} fill="#8fa3cc" opacity={0.35} />
      {/* bent back leg */}
      <path d="M -10,-30 L 110,-130 L 190,-24" stroke="#24335c" strokeWidth={44} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={168} y={-44} width={76} height={38} rx={14} fill={BOOT} />
      {/* hurt leg, straight */}
      <path d="M 20,-26 L 260,-22" stroke={PANTS} strokeWidth={46} strokeLinecap="round" />
      <rect x={262} y={-60} width={40} height={70} rx={14} fill={BOOT} />
      {pain > 0 && (
        <g transform="translate(170 -60)" opacity={clamp01(pain * 2)}>
          {[0, 1, 2].map((k) => {
            const a = -0.9 + k * 0.9, r = 70 + 14 * Math.sin(f * 0.6 + k);
            return <path key={k} d={`M ${Math.cos(a - 1.57) * 40},${Math.sin(a - 1.57) * 40} l ${Math.cos(a - 1.57) * r * 0.5},${Math.sin(a - 1.57) * r * 0.5}`} stroke="#ff4d3d" strokeWidth={12} strokeLinecap="round" />;
          })}
          <path d="M -24,-6 l 14,-20 l 10,18 l 14,-20" stroke="#ff4d3d" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`scale(${1 + 0.15 * Math.sin(f * 0.7)})`} />
        </g>
      )}
      <Arm x={-60} y={-190 + br} rot={40} len={150} back />
      <Torso br={br} />
      <Arm x={56} y={-188 + br} rot={-58} len={140} />
      <g transform={`translate(10 ${-282 + br}) rotate(${-6 + 3 * wobble(f, 8, 0.5)})`}>
        <Head f={f} mood={mood} look={[0.8, 0.7]} open={mood === "sad" ? 0.55 : undefined} />
      </g>
    </g>
  );
};

// Tom lying on a rescue stretcher. Origin = middle of the stretcher.
const Stretcher: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <rect x={-210} y={-10} width={420} height={26} rx={13} fill="#ff8a1e" />
    <rect x={-230} y={-4} width={460} height={12} rx={6} fill="#c86410" />
    <path d="M -150,-12 C -130,-80 140,-90 190,-14 Z" fill="#e5b93a" />
    <path d="M -120,-40 C -40,-64 80,-64 160,-36" stroke="#fff3c4" strokeWidth={6} fill="none" opacity={0.7} />
    <g transform="translate(-200 -52) scale(0.75) rotate(-80)">
      <Head f={f} mood="sad" look={[0, -0.6]} open={0.6} />
    </g>
  </g>
);

// Tom in the hospital bed, leg in a cast in a sling. Origin = floor under the bed's middle.
const BedTom: React.FC<{ f: number; mood: Mood; holdCard?: number }> = ({ f, mood, holdCard = 0 }) => {
  const br = 2 * wobble(f, 6, 0.7);
  const armRot = lerp(30, -150, eout(holdCard));
  return (
    <g>
      <ellipse cx={0} cy={10} rx={420} ry={22} fill="#000" opacity={0.12} />
      {/* bed frame */}
      <rect x={-380} y={-260} width={760} height={60} rx={20} fill="#e9eef6" />
      <rect x={-370} y={-200} width={14} height={200} fill="#9aa6bd" />
      <rect x={356} y={-200} width={14} height={200} fill="#9aa6bd" />
      <rect x={-400} y={-420} width={22} height={420} rx={10} fill="#9aa6bd" />
      <rect x={-400} y={-430} width={60} height={22} rx={10} fill="#9aa6bd" />
      {[-330, 320].map((x) => <circle key={x} cx={x} cy={-6} r={14} fill="#5d6680" />)}
      {/* pillow */}
      <ellipse cx={-300} cy={-300} rx={90} ry={60} fill="#ffffff" />
      {/* Tom sitting up */}
      <g transform="translate(-230 -230)">
        <Arm x={-58} y={-190 + br} rot={30} len={120} back />
        <Torso br={br} pocketCard={holdCard === 0} />
        <g transform={`translate(4 ${-282 + br})`}>
          <Head f={f} mood={mood} look={holdCard > 0.5 ? [0.9, -0.8] : [0.8, 0.2]} sweat={mood === "o" ? ramp(f, CUES.thousands, CUES.thousands + 40) : 0} />
        </g>
        <Arm x={56} y={-188 + br} rot={armRot} len={130}>
          {holdCard > 0 && (
            <g transform="translate(0 175) rotate(170)">
              <BlueCard f={f} glow={holdCard} s={0.8} />
            </g>
          )}
        </Arm>
      </g>
      {/* blanket over the good leg */}
      <path d="M -200,-250 C -100,-330 120,-310 300,-262 L 300,-200 L -200,-200 Z" fill="#7cc4b8" />
      <path d="M -180,-262 C -80,-320 100,-300 290,-262" stroke="#a8dcd3" strokeWidth={8} fill="none" />
      {/* the cast in its sling */}
      <path d={`M 230,-560 L 230,${-420 + br}`} stroke="#9aa6bd" strokeWidth={5} />
      <path d={`M -60,-290 L 250,${-400 + br}`} stroke="#ffffff" strokeWidth={66} strokeLinecap="round" />
      <path d={`M -40,-306 L 240,${-410 + br}`} stroke="#e6ebf3" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
      {[0, 1, 2].map((k) => <circle key={k} cx={276} cy={-414 + br + k * 16 - 14} r={9} fill={SKIN} />)}
      <rect x={196} y={-430 + br} width={60} height={34} rx={10} fill="#ffcf8a" opacity={0.85} />
    </g>
  );
};

// Rescue helicopter, facing left. Origin = cabin centre.
const Heli: React.FC<{ f: number; s?: number }> = ({ f, s = 1 }) => {
  const blade = Math.abs(Math.sin(f * 1.7));
  return (
    <g transform={`scale(${s})`}>
      <path d="M 120,-20 L 360,-40 L 370,-10 L 130,20 Z" fill="#c9221d" />
      <path d="M 340,-110 L 380,-110 L 390,-10 L 350,-20 Z" fill="#e8352e" />
      <g transform={`translate(372 -64) scale(${0.3 + 0.7 * blade} 1)`}>
        <ellipse rx={50} ry={10} fill="#e9ecf3" opacity={0.7} />
      </g>
      <path d="M -190,10 C -200,-90 -110,-130 10,-130 C 120,-130 170,-80 170,0 C 170,60 120,80 20,80 C -110,80 -186,70 -190,10 Z" fill="#e8352e" />
      <path d="M -180,0 C -176,-70 -120,-104 -60,-104 L -60,10 Z" fill="#bfe6ff" />
      <path d="M -150,-30 L -110,-80" stroke="#fff" strokeWidth={10} opacity={0.6} strokeLinecap="round" />
      <rect x={-30} y={-90} width={110} height={90} rx={14} fill="#bfe6ff" opacity={0.9} />
      <path d="M -188,26 L 170,26" stroke="#fff" strokeWidth={16} />
      <path d="M -150,80 L -160,120 M 90,80 L 100,120 M -220,120 L 150,120" stroke="#3b3f55" strokeWidth={12} strokeLinecap="round" />
      <rect x={-20} y={-160} width={40} height={34} rx={8} fill="#3b3f55" />
      <g transform={`translate(0 -164) scale(${0.25 + 0.75 * blade} 1)`}>
        <rect x={-380} y={-7} width={760} height={14} rx={7} fill="#3b3f55" opacity={0.75} />
      </g>
      <ellipse cx={0} cy={-164} rx={380} ry={14} fill="#c9d2e3" opacity={0.25} />
    </g>
  );
};

// Small plane, side view, facing right. Origin = middle of the fuselage.
const Plane: React.FC<{ f: number; tom?: boolean; mood?: Mood }> = ({ f, tom, mood = "happy" }) => (
  <g>
    <path d="M -380,-60 L -470,-260 L -400,-260 L -290,-60 Z" fill="#2f78d6" />
    <path d="M -60,30 L -210,170 L -140,170 L 100,40 Z" fill="#9fb2d4" />
    <path d="M -500,0 C -500,-50 -430,-80 -360,-80 L 380,-80 C 470,-80 520,-40 530,0 C 520,40 470,70 380,70 L -360,70 C -430,70 -500,50 -500,0 Z" fill="#ffffff" />
    <path d="M -500,22 L 520,22" stroke="#2f78d6" strokeWidth={16} />
    <path d="M 420,-60 C 470,-56 500,-36 512,-12 L 430,-12 Z" fill="#9fd0ff" />
    {[-300, -170, -40, 90, 220].map((x) => (
      <g key={x}>
        <circle cx={x} cy={-22} r={46} fill="#cfe9ff" stroke="#c7d3e6" strokeWidth={8} />
        {tom && x === 90 && (
          <g>
            <clipPath id="tomWin"><circle cx={x} cy={-22} r={42} /></clipPath>
            <rect x={x - 46} y={-70} width={92} height={96} fill="#ffe4b8" clipPath="url(#tomWin)" />
            <g clipPath="url(#tomWin)">
              <g transform={`translate(${x - 2} ${-4 + 2 * wobble(f, 9, 0.6)}) scale(0.55)`}>
                <Head f={f} mood={mood} look={[0.6, -0.2]} />
              </g>
            </g>
            <path d={`M ${x - 26},-50 L ${x - 6},-60`} stroke="#fff" strokeWidth={6} opacity={0.7} strokeLinecap="round" />
          </g>
        )}
      </g>
    ))}
    <path d="M -40,-30 L -140,-170 L -70,-170 L 100,-34 Z" fill="#dde5f2" opacity={0.0} />
  </g>
);

const RedX: React.FC<{ p: number; r?: number }> = ({ p, r = 120 }) => {
  const a = clamp01(p * 2), b = clamp01(p * 2 - 1);
  const L = r * 2 * 1.414;
  return (
    <g stroke="#e3342f" strokeWidth={30} strokeLinecap="round" fill="none">
      <path d={`M ${-r},${-r} L ${r},${r}`} strokeDasharray={`${L * a} ${L}`} />
      <path d={`M ${r},${-r} L ${-r},${r}`} strokeDasharray={`${L * b} ${L}`} />
    </g>
  );
};

const CoinStack: React.FC<{ n: number; x: number; y: number; f: number }> = ({ n, x, y, f }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: Math.max(0, Math.floor(n)) }, (_, k) => (
      <g key={k} transform={`translate(${2 * Math.sin(k * 1.7)} ${-k * 22})`}>
        <ellipse cx={0} cy={8} rx={62} ry={18} fill="#c98e1a" />
        <ellipse cx={0} cy={0} rx={62} ry={18} fill="#ffd54a" />
        <ellipse cx={0} cy={0} rx={44} ry={11} fill="none" stroke="#e8b52a" strokeWidth={4} />
      </g>
    ))}
    {n >= 1 && (
      <g transform={`translate(0 ${-Math.floor(n) * 22 - 4})`}>
        <text x={0} y={8} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={30} fill="#b07a12" transform="scale(1 0.5)">€</text>
      </g>
    )}
    <Glow x={0} y={-n * 11} r={120 + 6 * Math.sin(f * 0.3)} opacity={0.25} />
  </g>
);

const Room: React.FC<{ f: number; warm: number }> = ({ f, warm }) => (
  <g>
    <SkyGrad id="roomWall" stops={["#dfeee9", "#cfe3dd"]} />
    <rect x={-1400} y={1400} width={W + 2800} height={2000} fill="#b9cfc8" />
    <rect x={-1400} y={1400} width={W + 2800} height={14} fill="#a3bab2" />
    {/* window with mountains */}
    <g transform="translate(700 520)">
      <rect x={-230} y={-200} width={460} height={380} rx={16} fill="#ffffff" />
      <clipPath id="winClip"><rect x={-210} y={-180} width={420} height={340} rx={8} /></clipPath>
      <g clipPath="url(#winClip)">
        <rect x={-210} y={-180} width={420} height={340} fill={warm > 0.5 ? "#ffd9a8" : "#bcd8f2"} />
        <g transform="translate(-700 -900) scale(1)">
          <FarAlps />
        </g>
      </g>
      <path d="M 0,-180 v 340 M -210,-10 h 420" stroke="#ffffff" strokeWidth={12} />
    </g>
    {/* the warm light that arrives with the card */}
    <rect x={-1400} y={-1400} width={W + 2800} height={H + 2800} fill="#ffcf7a" opacity={0.18 * warm} style={{ mixBlendMode: "multiply" }} />
    <Glow x={700} y={520} r={700} opacity={0.35 + 0.5 * warm} />
    {/* a quiet heart monitor so the room is alive */}
    <g transform="translate(130 760)">
      <rect x={-70} y={-60} width={140} height={110} rx={12} fill="#5d6680" />
      <rect x={-58} y={-48} width={116} height={84} rx={6} fill="#1d2a3a" />
      <path d={`M -58,0 ${Array.from({ length: 12 }, (_, k) => { const xx = -58 + k * 10; const ph = (k * 10 + f * 3) % 60; return `L ${xx},${ph < 6 ? -24 : ph < 10 ? 14 : 0}`; }).join(" ")}`} stroke="#5bffa8" strokeWidth={4} fill="none" />
      <rect x={-6} y={50} width={12} height={460} fill="#9aa6bd" />
    </g>
  </g>
);

// ---------- scenes ----------
const SceneChalet: React.FC<{ f: number }> = ({ f }) => {
  const wave = f >= CUES.wave ? eout(ramp(f, CUES.wave, CUES.wave + 10)) * (1 - ramp(f, CUES.wave + 60, CUES.wave + 75)) : 0;
  return (
    <g transform={camLerp(f / CUES.scenePack, [540, 960, 1.0], [600, 1140, 1.28])}>
      <SkyGrad id="skyDay" stops={["#8ccaf2", "#cfe8f7", "#fdeacc"]} />
      <Glow x={860} y={300} r={300} />
      <circle cx={860} cy={300} r={74} fill="#ffe08a" />
      <Clouds f={f} speed={0.4} />
      <g transform={`translate(${-f * 0.15} 0)`}><FarAlps /></g>
      <rect x={-600} y={1300} width={W + 1200} height={1200} fill={SNOW} />
      <path d="M -600,1320 C -200,1260 300,1330 700,1290 C 1000,1260 1300,1300 1700,1290 L 1700,1360 L -600,1360 Z" fill={SNOW} />
      <path d="M -600,1480 C 0,1440 400,1520 1700,1470" stroke={SNOW_SHADE} strokeWidth={10} fill="none" opacity={0.7} />
      <Pine x={-30} y={1340} s={1.1} />
      <Pine x={980} y={1330} s={0.95} />
      <Pine x={860} y={1310} s={0.7} />
      <Chalet f={f} />
      <g transform="translate(640 1420)">
        <TomStand f={f} mood={wave > 0.3 ? "happy" : "smile"} wave={wave} skis />
      </g>
      <Snowfall f={f} amount={0.6} />
    </g>
  );
};

const ScenePack: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.scenePack;
  const slide = eio(ramp(f, CUES.cardIn, CUES.cardGlint - 4));
  const cx = lerp(1000, 640, slide), cy = lerp(1500, 905, slide);
  const glint = ramp(f, CUES.cardGlint, CUES.cardGlint + 16);
  const tucked = f >= CUES.cardGlint + 6;
  return (
    <g transform={camLerp(t / (CUES.sceneSlope - CUES.scenePack), [540, 960, 1.0], [560, 940, 1.06])}>
      <SkyGrad id="wood" stops={["#c98a55", "#a8683f"]} />
      {Array.from({ length: 16 }, (_, k) => <rect key={k} x={-300} y={k * 140 - 200} width={W + 600} height={8} fill="#8a5232" opacity={0.5} />)}
      {/* window to the snowy morning */}
      <g transform="translate(760 430)">
        <rect x={-210} y={-190} width={420} height={360} rx={18} fill="#6b3b2a" />
        <clipPath id="packWin"><rect x={-190} y={-170} width={380} height={320} rx={10} /></clipPath>
        <g clipPath="url(#packWin)">
          <rect x={-190} y={-170} width={380} height={320} fill="#cfe8f7" />
          <g transform="translate(-760 -1000)"><FarAlps /></g>
          <Snowfall f={f} amount={0.8} />
        </g>
        <path d="M 0,-170 v 320 M -190,-10 h 380" stroke="#6b3b2a" strokeWidth={14} />
      </g>
      <Glow x={200} y={380} r={420} opacity={0.8} />
      <circle cx={200} cy={380} r={36} fill="#ffe7a8" />
      <path d="M 200,0 L 200,340" stroke="#3b2a24" strokeWidth={6} />
      {/* open suitcase at the bottom */}
      <g transform="translate(260 1420)">
        <rect x={-260} y={-120} width={520} height={160} rx={24} fill="#2bb3a3" />
        <rect x={-240} y={-140} width={200} height={70} rx={14} fill="#ffc93c" />
        <rect x={-20} y={-150} width={220} height={60} rx={14} fill="#e8553e" />
      </g>
      {/* Tom, close */}
      <g transform="translate(470 1280) scale(1.75)">
        <Arm x={-60} y={-190} rot={26} len={120} back />
        <Torso br={2 * wobble(f, 3, 0.7)} pocketCard={tucked} />
        <g transform={`translate(6 ${-282 + 2 * wobble(f, 3, 0.7)})`}>
          <Head f={f} mood={tucked ? "happy" : "smile"} look={[0.9, 0.6]} />
        </g>
      </g>
      {/* the card going into the pocket, then a glint */}
      {!tucked && (
        <g>
          <g transform={`translate(${cx} ${cy}) rotate(${lerp(-30, -90, slide)}) scale(0.6)`}>
            <BlueCard f={f} glow={0.6} />
          </g>
          <g transform={`translate(${cx + 80} ${cy + 120})`}>
            <path d={`M -70,90 L 0,0`} stroke={JACKET} strokeWidth={60} strokeLinecap="round" />
            <circle r={38} fill={MITTEN} />
          </g>
        </g>
      )}
      {glint > 0 && glint < 1 && (
        <g transform={`translate(612 ${1280 - 182 * 1.75 + 8}) scale(${2.4 * Math.sin(glint * Math.PI)}) rotate(${glint * 90})`}>
          <path d="M 0,-30 L 7,-7 L 30,0 L 7,7 L 0,30 L -7,7 L -30,0 L -7,-7 Z" fill="#fff8d0" />
        </g>
      )}
    </g>
  );
};

const slopeY = (x: number) => 860 + x * 0.55;
const SLOPE_A = (Math.atan(0.55) * 180) / Math.PI;

const SceneSlope: React.FC<{ f: number }> = ({ f }) => {
  const run = ramp(f, CUES.sceneSlope, CUES.turn);
  const tum = ramp(f, CUES.turn, CUES.tumbleEnd);
  const x = f < CUES.turn ? lerp(-260, 520, run) : lerp(520, 760, eout(tum));
  const y = slopeY(x) - (f < CUES.turn ? 0 : 200 * Math.sin(tum * Math.PI));
  const rot = SLOPE_A + (f < CUES.turn ? 0 : 400 * eout(tum));
  const shake = f >= CUES.turn && f < CUES.turn + 12 ? Math.sin(f * 2.1) * 14 * (1 - ramp(f, CUES.turn, CUES.turn + 12)) : 0;
  const cx = x + 120 + shake, cy = y - 160;
  const trees = [-500, -200, 150, 420, 700, 980, 1250];
  const flags = [-380, 40, 560, 1100];
  return (
    <g>
      <SkyGrad id="skySlope" stops={["#7fc0ef", "#d7ecf8"]} />
      <Glow x={900} y={240} r={260} />
      <circle cx={900} cy={240} r={60} fill="#ffe08a" />
      <g transform={`translate(${-x * 0.12} ${-y * 0.05 + 40})`}><FarAlps /></g>
      <g transform={camT(cx, cy, 1.2)}>
        <path d={`M -1200,${slopeY(-1200)} L 2200,${slopeY(2200)} L 2200,3200 L -1200,3200 Z`} fill={SNOW} />
        <path d={`M -1200,${slopeY(-1200) + 40} L 2200,${slopeY(2200) + 40}`} stroke={SNOW_SHADE} strokeWidth={14} opacity={0.6} />
        {/* ski tracks */}
        <path d={`M -1200,${slopeY(-1200) + 6} L ${x},${slopeY(x) + 6}`} stroke="#c9d6ee" strokeWidth={6} />
        {trees.map((tx) => <Pine key={tx} x={tx} y={slopeY(tx) - 30} s={0.9} />)}
        {flags.map((fx) => (
          <g key={fx} transform={`translate(${fx} ${slopeY(fx) + 10})`}>
            <rect x={-4} y={-150} width={8} height={150} fill="#3b3f55" />
            <path d={`M 4,-150 L ${60 + 6 * Math.sin(f * 0.3 + fx)},-128 L 4,-106 Z`} fill="#e8352e" />
          </g>
        ))}
        {/* the little bump that catches his ski */}
        <ellipse cx={560} cy={slopeY(560) + 4} rx={50} ry={22} fill="#e4ecfa" />
        <ellipse cx={556} cy={slopeY(560) - 4} rx={26} ry={12} fill="#8d97ad" />
        <g transform={`translate(${x} ${y}) rotate(${rot})`}>
          <TomSki f={f} mood={f >= CUES.turn ? "o" : "happy"} />
        </g>
        {/* snow spray */}
        {Array.from({ length: 24 }, (_, k) => {
          const p = f < CUES.turn ? -1 : ramp(f, CUES.turn + (k % 6), CUES.turn + 24 + (k % 6));
          if (p <= 0 || p >= 1) return null;
          const a = -Math.PI / 2 + (rnd(`spa${k}`) - 0.5) * 2.4;
          const r = 60 + rnd(`spr${k}`) * 260;
          return <circle key={k} cx={560 + Math.cos(a) * r * eout(p)} cy={slopeY(560) - 20 + Math.sin(a) * r * eout(p) + 200 * p * p} r={8 + rnd(`sps${k}`) * 16} fill="#fff" opacity={1 - p} />;
        })}
      </g>
      {/* speed lines while skiing */}
      {f < CUES.turn && [0, 1, 2, 3].map((k) => {
        const p = ((f * 2 + k * 17) % 40) / 40;
        return <path key={k} d={`M ${180 - p * 300},${700 + k * 90} l -160,${-90}`} stroke="#fff" strokeWidth={6} opacity={0.6 * (1 - p)} strokeLinecap="round" transform={`rotate(0)`} />;
      })}
      <Snowfall f={f} amount={0.4} drift={-3} />
    </g>
  );
};

const SceneHurt: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneHurt;
  const pain = ramp(f, CUES.broken - 4, CUES.broken + 6);
  const cloud = eio(ramp(f, CUES.sceneHurt, CUES.broken));
  return (
    <g transform={camLerp(t / (CUES.sceneHeli - CUES.sceneHurt), [540, 1000, 1.0], [520, 1060, 1.2])}>
      <SkyGrad id="skyHurt" stops={["#8ea7c9", "#d5dde9"]} />
      <circle cx={860} cy={300} r={60} fill="#fff2c4" opacity={0.7} />
      <g transform={`translate(${lerp(-200, 120, cloud)} 0)`}>
        <Clouds f={f} speed={0.3} color="#b8c2d6" y0={220} />
      </g>
      <FarAlps cool={1} />
      <rect x={-600} y={1240} width={W + 1200} height={1500} fill="#eef3fb" />
      <path d="M -600,1260 C -100,1200 400,1290 1700,1230 L 1700,1300 L -600,1300 Z" fill="#eef3fb" />
      <Pine x={-60} y={1250} s={1.0} />
      <Pine x={1020} y={1240} s={0.9} />
      {/* one ski stuck in the snow, the other one flat, a lost pole */}
      <g transform="translate(860 1250) rotate(14)">
        <rect x={-12} y={-360} width={24} height={360} rx={12} fill={SKI} />
      </g>
      <rect x={120} y={1300} width={300} height={16} rx={8} fill="#239a8c" transform="rotate(-8 270 1308)" />
      <path d="M 700,1330 L 880,1300" stroke="#3b3f55" strokeWidth={8} strokeLinecap="round" />
      <g transform="translate(380 1290)">
        <TomSit f={f} mood={f >= CUES.broken ? "sad" : "o"} pain={pain} />
      </g>
      {/* dizzy stars */}
      {f < CUES.broken + 6 && [0, 1, 2].map((k) => {
        const a = f * 0.18 + (k * Math.PI * 2) / 3;
        return <path key={k} transform={`translate(${390 + Math.cos(a) * 90} ${940 + Math.sin(a) * 26}) scale(0.9)`} d="M 0,-16 L 5,-5 L 16,0 L 5,5 L 0,16 L -5,5 L -16,0 L -5,-5 Z" fill="#ffd54a" opacity={1 - ramp(f, CUES.broken, CUES.broken + 6)} />;
      })}
      <Snowfall f={f} amount={0.5} />
    </g>
  );
};

const SceneHeli: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneHeli;
  const inP = eout(ramp(f, CUES.heliIn, CUES.heliHover));
  const outP = eio(ramp(f, CUES.heliOut, CUES.sceneNoPay + XF));
  const hx = lerp(1350, 560, inP) + lerp(0, -500, outP) + 8 * wobble(f, 2, 0.8);
  const hy = lerp(150, 560, inP) + lerp(0, -380, outP) + 6 * Math.sin(f * 0.2);
  const lift = eio(ramp(f, CUES.lift, CUES.heliOut + 6));
  const sx = lerp(520, hx, ramp(f, CUES.heliOut, CUES.heliOut + 10));
  const sy = lerp(1270, hy + 340, lift);
  const rope = f >= CUES.heliHover - 6;
  return (
    <g transform={camLerp(t / (CUES.sceneNoPay - CUES.sceneHeli), [540, 1040, 1.0], [540, 880, 1.0])}>
      <SkyGrad id="skyHeli" stops={["#9db8dc", "#dfe7f2"]} />
      <Clouds f={f} speed={0.3} color="#c9d2e3" y0={140} />
      <FarAlps cool={1} />
      <rect x={-600} y={1240} width={W + 1200} height={1500} fill="#eef3fb" />
      <Pine x={-60} y={1250} s={1.0} />
      <Pine x={1020} y={1240} s={0.9} />
      {/* rotor wash: snow blown sideways */}
      {Array.from({ length: 18 }, (_, k) => {
        const p = ((f * 1.5 + k * 9) % 50) / 50;
        const side = k % 2 ? 1 : -1;
        const on = ramp(f, CUES.heliHover - 10, CUES.heliHover) * (1 - ramp(f, CUES.heliOut, CUES.heliOut + 12));
        return <circle key={k} cx={540 + side * (60 + p * 520)} cy={1250 - 60 * Math.sin(p * Math.PI) - rnd(`rw${k}`) * 40} r={10 + rnd(`rr${k}`) * 14} fill="#fff" opacity={on * (1 - p)} />;
      })}
      {rope && <path d={`M ${hx},${hy + 120} L ${sx},${sy - 30}`} stroke="#3b3f55" strokeWidth={5} />}
      <g transform={`translate(${sx} ${sy}) rotate(${4 * Math.sin(f * 0.15)})`}>
        <Stretcher f={f} />
      </g>
      <g transform={`translate(${hx} ${hy}) rotate(${lerp(-6, 0, inP) + lerp(0, 8, outP)})`}>
        <Heli f={f} s={0.95} />
      </g>
      <Snowfall f={f} amount={0.4} drift={-2} />
    </g>
  );
};

const SceneNoPay: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneNoPay;
  const card = eback(ramp(f, CUES.healthCard, CUES.healthCard + 16));
  const icons = eback(ramp(f, CUES.healthCard + 24, CUES.healthCard + 40));
  const x1 = ramp(f, CUES.xHeli - 2, CUES.xHeli + 8);
  const x2 = ramp(f, CUES.xPlane - 2, CUES.xPlane + 8);
  return (
    <g transform={camLerp(t / (CUES.sceneCost - CUES.sceneNoPay), [540, 960, 1.0], [540, 940, 1.05])}>
      <SkyGrad id="paper" stops={["#f8ecd6", "#f1dcbc"]} />
      {Array.from({ length: 14 }, (_, k) => <rect key={k} x={k * 90 - 60} y={-400} width={40} height={H + 800} fill="#efd8b4" opacity={0.6} />)}
      <Glow x={540} y={480} r={560} opacity={0.5} />
      {/* the normal health insurance card */}
      <g transform={`translate(540 380) scale(${card * 0.9}) rotate(-4)`}>
        <rect x={-330} y={-200} width={660} height={400} rx={36} fill="#000" opacity={0.15} transform="translate(10 14)" />
        <rect x={-330} y={-200} width={660} height={400} rx={36} fill="#3fae7a" />
        <rect x={-330} y={60} width={660} height={60} fill="#2f8f63" />
        <rect x={-270} y={-140} width={110} height={84} rx={14} fill="#ffd54a" />
        <circle cx={200} cy={-60} r={60} fill="#e8f7ef" />
        <circle cx={200} cy={-80} r={24} fill="#3fae7a" />
        <path d="M 160,-20 C 160,-56 240,-56 240,-20 Z" fill="#3fae7a" />
        <text x={-270} y={20} fontFamily={NUNITO} fontWeight={900} fontSize={54} fill="#ffffff">HEALTH</text>
        <text x={-270} y={170} fontFamily={NUNITO} fontWeight={800} fontSize={40} fill="#e8f7ef">insurance card</text>
      </g>
      {/* what it won't pay: the helicopter, the flight home */}
      <g transform={`translate(290 790) scale(${icons * 0.85})`}>
        <circle r={170} fill="#ffffff" />
        <circle r={170} fill="none" stroke="#e8dcc6" strokeWidth={10} />
        <g transform={`translate(10 10) scale(0.36) translate(0 ${6 * Math.sin(f * 0.3)})`}><Heli f={f} /></g>
        {x1 > 0 && <RedX p={x1} r={110} />}
      </g>
      <g transform={`translate(790 790) scale(${icons * 0.85})`}>
        <circle r={170} fill="#ffffff" />
        <circle r={170} fill="none" stroke="#e8dcc6" strokeWidth={10} />
        <g transform={`rotate(-12) scale(0.26) translate(0 ${10 * Math.sin(f * 0.25)})`}><Plane f={f} /></g>
        {x2 > 0 && <RedX p={x2} r={110} />}
      </g>
      {/* Tom, worried */}
      <g transform={`translate(540 ${1150 - 26 * eback(ramp(f, CUES.sceneNoPay, CUES.sceneNoPay + 16))}) scale(1.3)`}>
        <path d="M -96,140 C -96,60 -54,48 0,48 C 54,48 96,60 96,140 Z" fill={JACKET} />
        <Head f={f} mood={f >= CUES.xHeli ? "o" : "sad"} look={[0, -0.9]} />
      </g>
    </g>
  );
};

const SceneCost: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneCost;
  const grow = (k: number) => {
    const base = 3 + k * 2;
    const g1 = eout(ramp(f, CUES.coins + k * 3, CUES.thousands));
    const g2 = eback(ramp(f, CUES.thousands + k * 2, CUES.thousands + 14 + k * 2));
    return base * g1 + (6 + k * 3) * g2;
  };
  return (
    <g transform={camLerp(t / (CUES.sceneCard - CUES.sceneCost), [560, 1110, 1.26], [570, 1100, 1.32])}>
      <Room f={f} warm={0} />
      <g transform="translate(560 1420)">
        <BedTom f={f} mood={f >= CUES.thousands - 2 ? "o" : "sad"} />
      </g>
      {[0, 1, 2].map((k) => <CoinStack key={k} n={grow(k)} x={480 + k * 135} y={1450 - k * 12} f={f} />)}
      {/* euro signs flying up on "thousands" */}
      {Array.from({ length: 8 }, (_, k) => {
        const p = ramp(f, CUES.thousands + k * 2, CUES.thousands + 34 + k * 2);
        if (p <= 0 || p >= 1) return null;
        return (
          <text key={k} x={480 + rnd(`ex${k}`) * 300} y={1150 - eout(p) * (300 + rnd(`ey${k}`) * 300)} fontFamily={NUNITO} fontWeight={900} fontSize={64 + rnd(`es${k}`) * 40} fill="#e8a91f" opacity={1 - p} textAnchor="middle">€</text>
        );
      })}
    </g>
  );
};

const WORD = ["Auslands-", "reise-", "kranken-", "versicherung"];

const SceneCard: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneCard;
  const hold = ramp(f, CUES.cardUp - 4, CUES.cardUp + 12);
  const warm = eio(ramp(f, CUES.cardUp, CUES.cardUp + 30));
  const at = [CUES.word1, CUES.word2, CUES.word3, CUES.word4];
  const coinsGo = 1 - eio(ramp(f, CUES.sceneCard, CUES.cardUp + 10));
  return (
    <g>
      <g transform={camLerp(t / (CUES.sceneHome - CUES.sceneCard), [570, 1100, 1.32], [560, 1080, 1.38])}>
        <Room f={f} warm={warm} />
        <g transform="translate(560 1420)">
          <BedTom f={f} mood={hold > 0.5 ? "happy" : "o"} holdCard={hold} />
        </g>
        <g opacity={coinsGo}>
          {[0, 1, 2].map((k) => <CoinStack key={k} n={(9 + k * 5) * coinsGo} x={480 + k * 135} y={1450 - k * 12} f={f} />)}
        </g>
      </g>
      {/* the long German word, piece by piece (screen space, above Tom) */}
      <g opacity={1 - ramp(f, CUES.sceneHome - 4, CUES.sceneHome + XF)}>
        <rect x={90} y={80} width={900} height={470} rx={44} fill="#0c2f6b" opacity={0.82 * eout(ramp(f, CUES.word1 - 10, CUES.word1))} />
        {WORD.map((w, i) => {
          const p = eback(ramp(f, at[i] - 3, at[i] + 9));
          return (
            <text key={w} x={540} y={185 + i * 104} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={96} fill={i === 3 ? "#ffd54a" : "#ffffff"} opacity={clamp01(p * 1.5)} transform={`translate(${540 * (1 - p)} ${(185 + i * 104) * (1 - p)}) scale(${Math.max(0.001, p)})`}>
              {w}
            </text>
          );
        })}
      </g>
    </g>
  );
};

const SceneHome: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneHome;
  const pull = ramp(f, CUES.pullBack, CUES.sceneEnd - 4);
  const cam = camLerp(pull, [630, 870, 3.0], [560, 900, 0.86]);
  const billIn = eout(ramp(f, CUES.sceneHome + 4, CUES.sceneHome + 22));
  const stamp = ramp(f, CUES.covered, CUES.covered + 8);
  return (
    <g>
      <SkyGrad id="skyHome" stops={["#6aa7e8", "#b8d7f2", "#ffd7a0"]} />
      <Glow x={880} y={1100} r={500} />
      <circle cx={880} cy={1100} r={90} fill="#ffe6a0" />
      <g transform={`translate(${-t * 1.2} 500) scale(1)`}><FarAlps /></g>
      <Clouds f={f} speed={9} y0={240} />
      <g transform={cam}>
        <g transform={`translate(540 ${880 + 8 * Math.sin(f * 0.12)}) rotate(${-2 + 1.5 * Math.sin(f * 0.09)})`}>
          <Plane f={f} tom mood="happy" />
        </g>
      </g>
      <Clouds f={f + 400} speed={14} y0={1300} />
      {/* the bill, covered */}
      <g transform={`translate(${lerp(1300, 820, billIn)} ${lerp(150, 400, billIn)}) rotate(${lerp(30, 6, billIn)})`}>
        <rect x={-150} y={-190} width={300} height={380} rx={10} fill="#fff" stroke="#ddd" strokeWidth={4} />
        <text x={0} y={-128} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={44} fill="#3c3a4a">BILL</text>
        {[0, 1, 2, 3, 4].map((k) => <rect key={k} x={-110} y={-90 + k * 50} width={220 - (k % 2) * 60} height={16} rx={8} fill="#c9c6d4" />)}
        {stamp > 0 && (
          <g transform={`rotate(-18) scale(${lerp(2.2, 1, eout(stamp))})`} opacity={clamp01(stamp * 2)}>
            <rect x={-140} y={-50} width={280} height={100} rx={14} fill="none" stroke="#1e9e5a" strokeWidth={12} />
            <text x={0} y={28} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={60} fill="#1e9e5a">COVERED</text>
          </g>
        )}
      </g>
    </g>
  );
};

const SceneEnd: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneEnd;
  const up = eback(ramp(f, CUES.sceneEnd + 2, CUES.sceneEnd + 22));
  const line = (a: number) => eout(ramp(f, CUES.sceneEnd + a, CUES.sceneEnd + a + 12));
  const pulse = 1 + 0.03 * Math.sin(t * 0.25) * ramp(f, CUES.sceneEnd + 50, CUES.sceneEnd + 60);
  const bounce = f >= CUES.endCard ? Math.sin(ramp(f, CUES.endCard, CUES.endCard + 16) * Math.PI) * 40 : 0;
  return (
    <g>
      <linearGradient id="cardBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0c2f6b" />
        <stop offset="1" stopColor="#2f78d6" />
      </linearGradient>
      <rect width={W} height={H} fill="url(#cardBg)" />
      {Array.from({ length: 30 }, (_, k) => {
        const y = ((rnd(`by${k}`) * H + t * (1 + rnd(`bv${k}`) * 2)) % H + H) % H;
        return <circle key={k} cx={rnd(`bx${k}`) * W} cy={y} r={3 + rnd(`br${k}`) * 6} fill="#fff" opacity={0.18} />;
      })}
      <g transform={`translate(0 ${lerp(900, 0, up)})`}>
        <rect x={90} y={560} width={900} height={800} rx={48} fill="#000" opacity={0.18} transform="translate(0 16)" />
        <rect x={90} y={560} width={900} height={800} rx={48} fill="#ffffff" />
        <g opacity={line(2)} transform={`translate(0 ${20 * (1 - line(2))})`}>
          <text x={540} y={690} textAnchor="middle" fontFamily={NUNITO} fontWeight={800} fontSize={50} fill="#4a5578">Travelling soon?</text>
          <text x={540} y={760} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Talk to</text>
        </g>
        <g opacity={line(40)} transform={`translate(0 ${20 * (1 - line(40))})`}>
          <text x={540} y={890} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={110} fill="#0c2f6b">Robin Emig</text>
          <text x={540} y={975} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={62} fill="#2f78d6">Allianz</text>
        </g>
        <rect x={240} y={1030} width={600} height={6} rx={3} fill="#e3e8f2" opacity={line(52)} />
        <g opacity={line(56)} transform={`translate(540 1160) scale(${pulse})`}>
          <rect x={-400} y={-70} width={800} height={130} rx={65} fill="#eaf2ff" />
          <g transform="translate(-345 -6)">
            <path d="M -22,-34 C -32,-34 -38,-26 -36,-16 C -30,14 -8,36 22,40 C 32,42 40,36 40,26 L 40,14 C 40,8 36,4 30,4 L 18,4 C 12,4 10,10 8,14 C -4,10 -14,0 -18,-12 C -12,-14 -8,-18 -8,-24 L -8,-36 C -8,-42 -12,-44 -18,-44 Z" fill="#2f78d6" transform="translate(0 6)" />
          </g>
          <text x={45} y={22} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={66} fill="#0c2f6b">+49 160 97626099</text>
        </g>
        <text x={540} y={1300} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={32} fill="#8a93ad" opacity={line(60)}>Example story. Cover depends on your policy.</text>
      </g>
      {/* Tom's small card, one last time */}
      <g transform={`translate(540 ${1560 + 10 * Math.sin(t * 0.15) - bounce}) rotate(${-6 + 3 * Math.sin(t * 0.1)})`} opacity={line(64)}>
        <BlueCard f={f} glow={0.8} s={1.5} />
      </g>
    </g>
  );
};

const SCENE_COMPONENTS: Record<string, React.FC<{ f: number }>> = {
  chalet: SceneChalet,
  pack: ScenePack,
  slope: SceneSlope,
  hurt: SceneHurt,
  heli: SceneHeli,
  nopay: SceneNoPay,
  cost: SceneCost,
  card: SceneCard,
  home: SceneHome,
  end: SceneEnd,
};

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = STORY;
  const fade = Math.max(1 - ramp(f, 0, 8), ramp(f, STORY.durationFrames - 8, STORY.durationFrames - 1));
  const subsOn = f < CUES.sceneEnd;
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

