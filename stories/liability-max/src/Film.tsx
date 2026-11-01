import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { HAND, NUNITO } from "./kit/fonts";
import { CUES, SCENES, STORY, SUBS, XF } from "./story";
import { clamp01, eback, eio, eout, lerp, ramp, rnd, wobble } from "./kit/helpers";
import { Face, Glow, StoryDefs } from "./kit/parts";
import { Subtitles } from "./kit/Subtitles";

// "Max and the scratch": a 30 s, 9:16 liability insurance story for Robin Emig, Allianz.
// Everything is drawn in a 1080 x 1920 design space. All timing comes from src/story.ts.


const W = 1080, H = 1920;
const GROUND = 1420; // where Max's wheels touch the road
const INK = "#2b1d18";
const SKIN = "#f3c39b";
const JACKET = "#f0a03c";
const PANTS = "#34477a";
const HELMET = "#2bb3a3";
const BELL = "#e8352e";
const CAR = "#3f7fd9";

// ---------- small helpers ----------
const camT = (cx: number, cy: number, z: number) => `translate(${W / 2} ${H / 2}) scale(${z}) translate(${-cx} ${-cy})`;
const camLerp = (t: number, a: [number, number, number], b: [number, number, number]) => {
  const e = eio(clamp01(t));
  return camT(lerp(a[0], b[0], e), lerp(a[1], b[1], e), Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), e)));
};

// Two-bone leg: hip -> knee -> foot, knee bends forward (+x).
const knee = (hx: number, hy: number, fx: number, fy: number, L = 122) => {
  const dx = fx - hx, dy = fy - hy;
  const d = Math.min(Math.hypot(dx, dy), 2 * L - 2);
  const mx = (hx + fx) / 2, my = (hy + fy) / 2;
  const h = Math.sqrt(Math.max(0, L * L - (d / 2) * (d / 2)));
  const px = -dy / d, py = dx / d; // perpendicular
  const k1 = [mx + px * h, my + py * h], k2 = [mx - px * h, my - py * h];
  return k1[0] > k2[0] ? k1 : k2;
};

// ---------- world parts ----------
const PALETTES = {
  sun: ["#f7c6a3", "#a8d5c9", "#f4e1a1", "#c9b6e4", "#f2a99b", "#b9d7f0", "#f6d28f", "#cfe3b4"],
  rain: ["#a9a3b5", "#8fa3a8", "#b3ad98", "#9b95ad", "#ab948f", "#94a6b8", "#b2a68a", "#9fae95"],
};
const BUILDINGS = Array.from({ length: 8 }, (_, i) => ({
  w: 250 + Math.floor(rnd(`bw${i}`) * 50),
  h: 520 + Math.floor(rnd(`bh${i}`) * 220),
  rows: 4 + Math.floor(rnd(`br${i}`) * 2),
  roof: rnd(`bro${i}`) > 0.5,
}));
const STREET_W = BUILDINGS.reduce((s, b) => s + b.w + 12, 0);

const Street: React.FC<{ scroll: number; mood: "sun" | "rain"; f: number }> = ({ scroll, mood, f }) => {
  const pal = PALETTES[mood];
  const winLit = mood === "rain" ? "#f6dc8e" : "#dff0fb";
  const base = 1160;
  const items: React.ReactNode[] = [];
  for (const rep of [-1, 0, 1, 2]) {
    let x = -((scroll % STREET_W) + STREET_W) % STREET_W + rep * STREET_W - 60;
    BUILDINGS.forEach((b, i) => {
      const top = base - b.h;
      if (x < W + 100 && x + b.w > -100) {
        items.push(
          <g key={`${rep}-${i}`}>
            <rect x={x} y={top} width={b.w} height={b.h} fill={pal[i % pal.length]} />
            <rect x={x} y={top} width={b.w} height={22} fill="#000" opacity={0.08} />
            {b.roof && <path d={`M ${x - 6},${top} L ${x + b.w / 2},${top - 70} L ${x + b.w + 6},${top} Z`} fill={mood === "rain" ? "#6d6177" : "#c4664f"} />}
            {Array.from({ length: b.rows }, (_, r) =>
              [0, 1, 2].map((c) => (
                <g key={`${r}-${c}`}>
                  <rect x={x + 30 + c * ((b.w - 60) / 3) + 8} y={top + 60 + r * 105} width={(b.w - 60) / 3 - 16} height={66} rx={10} fill={winLit} opacity={mood === "rain" && (r + c + i) % 3 === 0 ? 0.95 : 0.75} />
                  <rect x={x + 30 + c * ((b.w - 60) / 3) + 4} y={top + 124 + r * 105} width={(b.w - 60) / 3 - 8} height={7} fill="#fff" opacity={0.45} />
                </g>
              ))
            )}
            <rect x={x + b.w / 2 - 40} y={base - 140} width={80} height={140} rx={36} fill="#6b4a3a" opacity={0.85} />
          </g>
        );
      }
      x += b.w + 12;
    });
  }
  return (
    <g>
      {items}
      {/* pavement, curb, road */}
      <rect x={-200} y={base} width={W + 400} height={110} fill={mood === "rain" ? "#9c9aa3" : "#d9d2c5"} />
      <rect x={-200} y={base + 110} width={W + 400} height={18} fill={mood === "rain" ? "#7d7b85" : "#bdb4a5"} />
      <rect x={-200} y={base + 128} width={W + 400} height={H} fill={mood === "rain" ? "#55586a" : "#6f7385"} />
      {Array.from({ length: 8 }, (_, k) => {
        const lx = ((k * 260 - scroll * 1.0) % 2080 + 2080) % 2080 - 300;
        return <rect key={k} x={lx} y={1560} width={140} height={14} rx={7} fill="#f3eee2" opacity={0.7} />;
      })}
      {mood === "rain" && <rect x={-200} y={base + 128} width={W + 400} height={H} fill="#9fb3d9" opacity={0.08 + 0.03 * Math.sin(f * 0.2)} />}
    </g>
  );
};

const TvTower: React.FC<{ x: number; color: string }> = ({ x, color }) => (
  <g transform={`translate(${x} 0)`} fill={color}>
    <rect x={-9} y={180} width={18} height={500} />
    <circle cx={0} cy={300} r={46} />
    <rect x={-4} y={90} width={8} height={170} />
    <rect x={-22} y={350} width={44} height={14} rx={7} />
  </g>
);

const Rain: React.FC<{ f: number; amount?: number }> = ({ f, amount = 1 }) => (
  <g opacity={0.55 * amount}>
    {Array.from({ length: 90 }, (_, k) => {
      const x0 = rnd(`rx${k}`) * (W + 300) - 150;
      const sp = 38 + rnd(`rs${k}`) * 18;
      const y = ((rnd(`ry${k}`) * H + f * sp) % (H + 200)) - 100;
      const x = x0 - (y * 0.12);
      return <line key={k} x1={x} y1={y} x2={x - 8} y2={y + 46} stroke="#e6eefc" strokeWidth={4} strokeLinecap="round" />;
    })}
  </g>
);

const Clouds: React.FC<{ f: number; dark: boolean; part?: number }> = ({ f, dark, part = 0 }) => (
  <g>
    {[0, 1, 2, 3].map((k) => {
      const x = ((rnd(`cx${k}`) * 1400 + f * (0.6 + k * 0.2)) % 1500) - 250 + (k % 2 ? 1 : -1) * part * 500;
      const y = 140 + k * 120;
      return (
        <g key={k} transform={`translate(${x} ${y})`} fill={dark ? "#8d8ea3" : "#ffffff"} opacity={dark ? 0.95 : 0.9}>
          <ellipse rx={150} ry={60} />
          <ellipse cx={-90} cy={20} rx={100} ry={48} />
          <ellipse cx={95} cy={18} rx={110} ry={50} />
          <ellipse cx={20} cy={-40} rx={90} ry={60} />
        </g>
      );
    })}
  </g>
);

// ---------- characters ----------
const Bell: React.FC<{ f: number; ringAt: number[] }> = ({ f, ringAt }) => {
  const t = Math.min(...ringAt.map((a) => (f >= a ? f - a : 999)));
  const ringing = t < 24;
  const rot = ringing ? Math.sin(t * 1.6) * 22 * (1 - t / 24) : 0;
  return (
    <g>
      <g transform={`rotate(${rot})`}>
        <path d="M -16,4 C -16,-18 16,-18 16,4 Z" fill={BELL} />
        <rect x={-19} y={2} width={38} height={7} rx={3.5} fill="#b9201c" />
        <circle cx={-6} cy={-8} r={4} fill="#fff" opacity={0.6} />
      </g>
      {ringing &&
        [1, 2].map((k) => (
          <g key={k} opacity={1 - t / 24} stroke="#ffcf3a" strokeWidth={6} fill="none" strokeLinecap="round">
            <path d={`M ${22 + k * 14 + t * 1.2},-${18 + k * 8} q 10,${12 + k * 4} 0,${26 + k * 8}`} />
            <path d={`M ${-22 - k * 14 - t * 1.2},-${18 + k * 8} q -10,${12 + k * 4} 0,${26 + k * 8}`} />
          </g>
        ))}
    </g>
  );
};

const Head: React.FC<{ f: number; mood: "smile" | "happy" | "o" | "sad"; look?: [number, number]; helmet?: boolean; sweat?: number }> = ({ f, mood, look = [0.6, 0], helmet = true, sweat = 0 }) => (
  <g>
    <circle r={64} fill={SKIN} />
    <ellipse cx={58} cy={10} rx={14} ry={18} fill={SKIN} />
    {/* hair */}
    <path d="M -64,-6 C -70,-60 -10,-82 40,-60 C 20,-50 -20,-46 -40,-20 Z" fill="#5a3825" />
    {helmet && (
      <g>
        <path d="M -72,-14 C -74,-86 70,-96 74,-18 Z" fill={HELMET} />
        <rect x={-76} y={-22} width={154} height={14} rx={7} fill="#1f8f83" />
        <path d="M -40,-66 C -20,-80 20,-80 36,-70" stroke="#fff" strokeWidth={8} fill="none" opacity={0.45} strokeLinecap="round" />
      </g>
    )}
    <ellipse cx={-48} cy={8} rx={11} ry={15} fill="#e6ab84" />
    <g transform="translate(18 12)">
      <Face f={f} seed={7} size={9.5} gap={40} look={look} mood={mood} />
    </g>
    {sweat > 0 && (
      <path d={`M -58,${-30 + sweat * 30} q -10,16 0,24 q 10,-8 0,-24 Z`} fill="#9fd4ff" opacity={clamp01(sweat * 3) * (1 - clamp01((sweat - 0.8) * 5))} />
    )}
  </g>
);

// Max on his bike, facing right. Origin = road contact under the bike's centre.
const MaxOnBike: React.FC<{ f: number; dist: number; mood: "smile" | "happy" | "o" | "sad"; ringAt: number[]; lean?: number; sweat?: number }> = ({ f, dist, mood, ringAt, lean = 0, sweat = 0 }) => {
  const R = 92;
  const wheelA = (dist / R) * (180 / Math.PI);
  const crank = (dist / 160) * Math.PI * 2 * 0.5;
  const bb = [-10, -100];
  const pedA = [bb[0] + Math.cos(crank) * 46, bb[1] + Math.sin(crank) * 46];
  const pedB = [bb[0] - Math.cos(crank) * 46, bb[1] - Math.sin(crank) * 46];
  const hip = [-62, -262];
  const breathe = 3 * wobble(f, 4, 0.8);
  const shoulder = [-18, -430 + breathe];
  const grip = [176, -270];
  const elbow = [78, -350 + breathe * 0.5];
  const Wheel = ({ x }: { x: number }) => (
    <g transform={`translate(${x} ${-R})`}>
      <circle r={R} fill="none" stroke="#2d2f3a" strokeWidth={16} />
      <circle r={R - 10} fill="none" stroke="#9aa0b4" strokeWidth={3} />
      <g transform={`rotate(${wheelA})`} stroke="#c9cdd9" strokeWidth={3}>
        {[0, 30, 60, 90, 120, 150].map((a) => (
          <line key={a} x1={Math.cos((a * Math.PI) / 180) * (R - 10)} y1={Math.sin((a * Math.PI) / 180) * (R - 10)} x2={-Math.cos((a * Math.PI) / 180) * (R - 10)} y2={-Math.sin((a * Math.PI) / 180) * (R - 10)} />
        ))}
      </g>
      <circle r={12} fill="#4a4d5c" />
    </g>
  );
  const kA = knee(hip[0], hip[1], pedA[0], pedA[1]);
  const kB = knee(hip[0], hip[1], pedB[0], pedB[1]);
  const Leg = ({ k, p, back }: { k: number[]; p: number[]; back?: boolean }) => (
    <g opacity={back ? 0.85 : 1}>
      <path d={`M ${hip[0]},${hip[1]} L ${k[0]},${k[1]} L ${p[0]},${p[1]}`} stroke={back ? "#2a3963" : PANTS} strokeWidth={40} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx={p[0] + 14} cy={p[1] + 4} rx={30} ry={14} fill="#3b2a24" />
    </g>
  );
  return (
    <g transform={`rotate(${lean} 0 -150)`}>
      <ellipse cx={0} cy={4} rx={280} ry={18} fill="#000" opacity={0.18} />
      <Leg k={kB} p={pedB} back />
      <Wheel x={-165} />
      <Wheel x={170} />
      {/* frame */}
      <g stroke={BELL} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={`M -165,${-R} L ${bb[0]},${bb[1]} L 128,-232 L -52,-240 Z`} />
        <path d={`M -165,${-R} L -52,-240`} />
        <path d={`M 128,-232 L 170,${-R}`} />
      </g>
      <path d="M 128,-232 L 146,-272 L 186,-272" stroke="#2d2f3a" strokeWidth={12} fill="none" strokeLinecap="round" />
      <rect x={-96} y={-262} width={70} height={18} rx={9} fill="#2d2f3a" />
      <circle cx={bb[0]} cy={bb[1]} r={20} fill="#9aa0b4" />
      {/* mudguard */}
      <path d={`M ${-165 - 100},${-R - 6} A 104,104 0 0 1 ${-165 + 60},${-R - 86}`} stroke="#444" strokeWidth={8} fill="none" />
      <g transform="translate(150 -290)">
        <Bell f={f} ringAt={ringAt} />
      </g>
      {/* body */}
      <path d={`M ${hip[0] - 34},${hip[1] + 6} C ${hip[0] - 40},${hip[1] - 90} ${shoulder[0] - 50},${shoulder[1] - 10} ${shoulder[0]},${shoulder[1] - 20} C ${shoulder[0] + 40},${shoulder[1] - 10} ${shoulder[0] + 40},${shoulder[1] + 60} ${hip[0] + 40},${hip[1]} Z`} fill={JACKET} />
      <path d={`M ${shoulder[0] + 10},${shoulder[1] - 10} L ${hip[0] + 30},${hip[1] - 10}`} stroke="#d1852a" strokeWidth={6} />
      <Leg k={kA} p={pedA} />
      <g transform={`translate(${shoulder[0] + 14} ${shoulder[1] - 80})`}>
        <Head f={f} mood={mood} sweat={sweat} />
      </g>
      <path d={`M ${shoulder[0]},${shoulder[1]} L ${elbow[0]},${elbow[1]} L ${grip[0]},${grip[1]}`} stroke={JACKET} strokeWidth={34} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={grip[0]} cy={grip[1]} r={17} fill={SKIN} />
    </g>
  );
};

// Standing person, facing right. Origin = feet on the ground.
const Person: React.FC<{ f: number; seed: number; coat: string; hair: string; mood: "smile" | "happy" | "o" | "sad"; isMax?: boolean; wave?: number; holdNote?: boolean; flip?: boolean }> = ({ f, seed, coat, hair, mood, isMax, wave = 0, holdNote, flip }) => {
  const br = 3 * wobble(f, seed, 0.7);
  const waveA = wave > 0 ? -60 + Math.sin(f * 0.35) * 18 * wave : 20;
  return (
    <g transform={flip ? "scale(-1 1)" : undefined}>
      <ellipse cx={0} cy={4} rx={110} ry={14} fill="#000" opacity={0.18} />
      <path d="M -30,-230 L -36,-10" stroke={isMax ? "#2a3963" : "#3a3a4a"} strokeWidth={42} strokeLinecap="round" />
      <path d="M 26,-230 L 34,-10" stroke={isMax ? PANTS : "#4a4a5c"} strokeWidth={42} strokeLinecap="round" />
      <ellipse cx={-30} cy={-6} rx={34} ry={15} fill="#3b2a24" />
      <ellipse cx={44} cy={-6} rx={34} ry={15} fill="#3b2a24" />
      <path d={`M -78,-200 C -84,-330 -60,${-420 + br} 0,${-428 + br} C 60,${-420 + br} 84,-330 78,-200 Z`} fill={coat} />
      {/* back arm */}
      <path d={`M -56,${-390 + br} C -90,-330 -84,-280 -70,-230`} stroke={coat} strokeWidth={32} fill="none" strokeLinecap="round" />
      <circle cx={-70} cy={-226} r={16} fill={SKIN} />
      {/* front arm: waving or holding */}
      <g transform={`translate(56 ${-390 + br}) rotate(${waveA})`}>
        <path d="M 0,0 L 0,140" stroke={coat} strokeWidth={32} strokeLinecap="round" />
        <circle cx={0} cy={150} r={17} fill={SKIN} />
        {holdNote && (
          <g transform="translate(-10 150) rotate(-12)">
            <rect x={-10} y={-40} width={110} height={80} rx={6} fill="#fff8d9" stroke="#e2d6a8" strokeWidth={3} />
            <path d="M 4,-18 h 70 M 4,0 h 80 M 4,18 h 50" stroke="#7a6a8f" strokeWidth={5} strokeLinecap="round" />
          </g>
        )}
      </g>
      <g transform={`translate(0 ${-500 + br})`}>
        {isMax ? (
          <Head f={f} mood={mood} helmet />
        ) : (
          <g>
            <circle r={62} fill={SKIN} />
            <path d="M -66,10 C -76,-70 70,-86 66,0 C 50,-40 -40,-50 -66,10 Z" fill={hair} />
            <circle cx={-46} cy={-62} r={30} fill={hair} />
            <g transform="translate(14 14)">
              <Face f={f} seed={seed} size={9} gap={38} look={[0.5, 0]} mood={mood} />
            </g>
          </g>
        )}
      </g>
    </g>
  );
};

// Car, side view, facing left. Origin = road under its centre.
const Car: React.FC<{ scratchTo?: number; scratchFrom?: number; scratchY?: number; glint?: number }> = ({ scratchTo, scratchFrom = 0, scratchY = -165, glint = 0 }) => (
  <g>
    <ellipse cx={0} cy={4} rx={340} ry={20} fill="#000" opacity={0.22} />
    <path d="M -320,-70 C -330,-150 -300,-200 -230,-210 L -150,-212 C -110,-300 -60,-330 40,-330 L 140,-330 C 210,-330 250,-260 280,-215 C 320,-205 340,-170 334,-70 Z" fill={CAR} />
    <path d="M -120,-214 C -90,-282 -50,-306 20,-306 L 20,-214 Z" fill="#cfe9ff" />
    <path d="M 44,-306 L 130,-306 C 180,-306 214,-262 236,-214 L 44,-214 Z" fill="#cfe9ff" />
    <path d="M -100,-230 L -40,-296" stroke="#fff" strokeWidth={10} opacity={0.6} strokeLinecap="round" />
    <path d="M 30,-214 L 30,-80" stroke="#2c5fa8" strokeWidth={5} />
    <path d="M -150,-214 L -150,-90" stroke="#2c5fa8" strokeWidth={5} />
    <rect x={-60} y={-185} width={44} height={10} rx={5} fill="#2c5fa8" />
    <rect x={80} y={-185} width={44} height={10} rx={5} fill="#2c5fa8" />
    <path d="M -300,-150 L 320,-150" stroke="#7fb0f0" strokeWidth={8} opacity={0.6} />
    <ellipse cx={-318} cy={-130} rx={14} ry={20} fill="#fff3b0" />
    <ellipse cx={330} cy={-130} rx={10} ry={18} fill="#ff6b5b" />
    {[-205, 205].map((x) => (
      <g key={x} transform={`translate(${x} -70)`}>
        <circle r={72} fill="#24262f" />
        <circle r={36} fill="#b9bfcf" />
        <circle r={12} fill="#6c7182" />
      </g>
    ))}
    {glint > 0 && <path d={`M ${-260 + glint * 520},-300 l 40,0`} stroke="#fff" strokeWidth={0} />}
    {scratchTo !== undefined && scratchTo > scratchFrom && (
      <path d={`M ${scratchFrom},${scratchY} ${Array.from({ length: Math.ceil((scratchTo - scratchFrom) / 18) }, (_, k) => `L ${Math.min(scratchTo, scratchFrom + (k + 1) * 18)},${scratchY + (k % 2 ? 6 : -6)}`).join(" ")}`} stroke="#1d3f73" strokeWidth={16} fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={0.55} />
    )}
    {scratchTo !== undefined && scratchTo > scratchFrom && (
      <path d={`M ${scratchFrom},${scratchY} ${Array.from({ length: Math.ceil((scratchTo - scratchFrom) / 18) }, (_, k) => `L ${Math.min(scratchTo, scratchFrom + (k + 1) * 18)},${scratchY + (k % 2 ? 6 : -6)}`).join(" ")}`} stroke="#f4f8ff" strokeWidth={7} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    )}
  </g>
);

// ---------- scenes (each gets its local frame t and the global frame f) ----------
const SkyGrad: React.FC<{ id: string; top: string; bottom: string }> = ({ id, top, bottom }) => (
  <>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={top} />
      <stop offset="1" stopColor={bottom} />
    </linearGradient>
    <rect x={-400} y={-400} width={W + 800} height={H + 800} fill={`url(#${id})`} />
  </>
);

const SceneRide: React.FC<{ f: number }> = ({ f }) => {
  const enter = eout(ramp(f, 0, 55));
  const x = lerp(-420, 470, enter);
  const scroll = f * 7;
  const dist = scroll + x * 1.2;
  return (
    <g transform={camLerp(f / 136, [540, 960, 1.0], [540, 1010, 1.08])}>
      <SkyGrad id="skyRide" top="#9fd3f5" bottom="#fde7c6" />
      <g transform={`translate(${-scroll * 0.1} 0)`}>
        <TvTower x={760} color="#c7d9ea" />
      </g>
      <Glow x={880} y={260} r={260} />
      <circle cx={880} cy={260} r={70} fill="#ffe08a" />
      <Clouds f={f} dark={false} />
      <Street scroll={scroll} mood="sun" f={f} />
      <g transform={`translate(${x} ${GROUND})`}>
        <MaxOnBike f={f} dist={dist} mood={f >= CUES.bell1 && f < CUES.bell1 + 40 ? "happy" : "smile"} ringAt={[CUES.bell1]} />
      </g>
    </g>
  );
};

const SceneRain: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneRain;
  // Max rides in, swerves round a puddle, scrapes along the car, then stops.
  const contactX = 340;
  const xAtScrape = contactX;
  let x: number;
  if (f < CUES.scrape) x = lerp(-380, xAtScrape, eout(ramp(f, CUES.sceneRain, CUES.scrape)) * 0.9 + ramp(f, CUES.sceneRain, CUES.scrape) * 0.1);
  else if (f < CUES.scrapeEnd) x = lerp(xAtScrape, 540, ramp(f, CUES.scrape, CUES.scrapeEnd));
  else x = lerp(540, 600, eout(ramp(f, CUES.scrapeEnd, CUES.scrapeEnd + 18)));
  const swerve = Math.sin(clamp01(ramp(f, CUES.swerve - 14, CUES.scrape + 4)) * Math.PI);
  const lean = -7 * swerve;
  const yLift = -26 * swerve;
  const scratchTo = f >= CUES.scrape ? Math.min(x, 600) + 176 : undefined;
  const carX = 770, carY = 1336;
  const scrapeOn = f >= CUES.scrape && f < CUES.scrapeEnd;
  const shocked = f >= CUES.scrape;
  return (
    <g transform={camLerp(ramp(f, CUES.scrapeEnd - 6, CUES.sceneBill), [540, 960, 1.0], [700, 1140, 1.55])}>
      <SkyGrad id="skyRain" top="#6f7690" bottom="#b6b4c2" />
      <TvTower x={760} color="#9aa1b5" />
      <Clouds f={f} dark />
      <Street scroll={0} mood="rain" f={f} />
      {/* puddle */}
      <g transform="translate(300 1470)">
        <ellipse rx={170} ry={26} fill="#8fa4c9" opacity={0.7} />
        {[0, 1].map((k) => {
          const p = ((t + k * 20) % 40) / 40;
          return <ellipse key={k} cx={-40 + k * 70} rx={20 + p * 60} ry={4 + p * 10} fill="none" stroke="#dfe8fb" strokeWidth={3} opacity={1 - p} />;
        })}
      </g>
      <g transform={`translate(${carX} ${carY})`}>
        <Car scratchFrom={contactX + 176 - carX} scratchTo={scratchTo !== undefined ? scratchTo - carX : undefined} scratchY={GROUND + yLift - 270 - carY + 6} />
      </g>
      <g transform={`translate(${x} ${GROUND + yLift})`}>
        <MaxOnBike f={f} dist={x * 1.4} mood={shocked ? "o" : "smile"} ringAt={[]} lean={lean} sweat={shocked ? ramp(f, CUES.scrape + 6, CUES.scrape + 50) : 0} />
      </g>
      {scrapeOn &&
        Array.from({ length: 6 }, (_, k) => {
          const a = rnd(`sp${k}-${f}`) * Math.PI - Math.PI;
          const l = 20 + rnd(`spl${k}-${f}`) * 40;
          const gx = x + 176, gy = GROUND + yLift - 270;
          return <line key={k} x1={gx} y1={gy} x2={gx + Math.cos(a) * l} y2={gy + Math.sin(a) * l} stroke="#ffe27a" strokeWidth={5} strokeLinecap="round" />;
        })}
      <Rain f={f} />
    </g>
  );
};

const BILL_ITEMS = ["Door paint", "Scratch repair", "Parts", "Labour", "Polish", "Rental car", "Paint match", "Clear coat", "Workshop", "Extra work"];

const SceneBill: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneBill;
  const len = f < CUES.billFast ? lerp(0, 1000, eout(ramp(f, CUES.sceneBill + 4, CUES.billFast))) : 1000 + (f - CUES.billFast) * 34;
  const bx = 400, bw = 520, top = 170;
  const shake = f >= CUES.billFast ? Math.sin(f * 1.3) * 3 : 0;
  return (
    <g transform={camLerp(t / 145, [540, 960, 1.0], [560, 1000, 1.06])}>
      <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="#f6e3c4" />
      {Array.from({ length: 14 }, (_, k) => (
        <rect key={k} x={k * 90 - 60} y={-400} width={40} height={H + 800} fill="#f0d6ae" opacity={0.6} />
      ))}
      <Glow x={700} y={500} r={600} opacity={0.6} />
      {/* bill paper */}
      <g transform={`translate(${shake} 0)`}>
        <rect x={bx + 8} y={top + 10} width={bw} height={len} fill="#000" opacity={0.12} />
        <rect x={bx} y={top} width={bw} height={len} fill="#ffffff" />
        <clipPath id="billClip"><rect x={bx} y={top} width={bw} height={len} /></clipPath>
        <g clipPath="url(#billClip)">
          <text x={bx + bw / 2} y={top + 80} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={56} fill="#c4372f">REPAIR BILL</text>
          <rect x={bx + 40} y={top + 110} width={bw - 80} height={6} fill="#c4372f" opacity={0.6} />
          {Array.from({ length: 40 }, (_, k) => (
            <g key={k} transform={`translate(0 ${top + 180 + k * 74})`}>
              <text x={bx + 40} y={0} fontFamily={NUNITO} fontWeight={700} fontSize={34} fill="#3c3a4a">{BILL_ITEMS[k % BILL_ITEMS.length]}</text>
              <path d={`M ${bx + 300},-8 h 80`} stroke="#b5b2c2" strokeWidth={4} strokeDasharray="4 8" />
              <rect x={bx + bw - 130} y={-26} width={90} height={26} rx={8} fill="#c4372f" opacity={0.75} />
            </g>
          ))}
        </g>
        {/* roll at the top */}
        <rect x={bx - 20} y={top - 40} width={bw + 40} height={56} rx={28} fill="#eae6dc" />
        <rect x={bx - 20} y={top - 30} width={bw + 40} height={12} rx={6} fill="#fff" opacity={0.7} />
      </g>
      {/* Max close-up, worried */}
      <g transform={`translate(${200 + 4 * wobble(f, 2)} ${1170 - 30 * eback(ramp(f, CUES.sceneBill, CUES.sceneBill + 16))}) scale(1.9)`}>
        <path d="M -90,140 C -90,70 -50,60 0,60 C 50,60 90,70 90,140 Z" fill={JACKET} />
        <Head f={f} mood={f >= CUES.billFast ? "o" : "sad"} look={[0.9, -0.9]} helmet sweat={ramp(f, CUES.billFast, CUES.billFast + 40)} />
      </g>
    </g>
  );
};

const SceneNote: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneNote;
  const slide = eio(ramp(f, CUES.sceneNote + 26, CUES.noteTuck));
  const wiperLift = f < CUES.noteTuck ? -10 * ramp(f, CUES.sceneNote + 10, CUES.sceneNote + 30) : -10 + 10 * eback(ramp(f, CUES.noteTuck, CUES.noteTuck + 8));
  const nx = lerp(-260, 600, slide), ny = lerp(1300, 1010, slide);
  return (
    <g transform={camLerp(t / 105, [540, 960, 1.0], [600, 1000, 1.1])}>
      <SkyGrad id="skyNote" top="#7f879f" bottom="#c1c0cc" />
      {/* windshield, front view, close */}
      <path d="M 40,1240 L 170,520 C 180,470 220,440 280,440 L 1000,440 C 1060,440 1100,470 1110,520 L 1240,1240 Z" fill="#2c5fa8" />
      <path d="M 110,1200 L 220,560 C 228,520 250,500 300,500 L 980,500 C 1030,500 1052,520 1060,560 L 1170,1200 Z" fill="#bfe0fb" />
      <path d="M 300,560 L 200,1100" stroke="#fff" strokeWidth={26} opacity={0.35} strokeLinecap="round" />
      <path d="M 370,560 L 300,900" stroke="#fff" strokeWidth={12} opacity={0.3} strokeLinecap="round" />
      <rect x={-200} y={1200} width={W + 400} height={H} fill={CAR} />
      <rect x={-200} y={1200} width={W + 400} height={30} fill="#2c5fa8" />
      {/* drops on the glass */}
      {Array.from({ length: 26 }, (_, k) => {
        const dx = 200 + rnd(`dx${k}`) * 900, dy = 540 + rnd(`dy${k}`) * 620 + ((t * (1 + rnd(`dv${k}`))) % 60);
        return <ellipse key={k} cx={dx} cy={dy} rx={6} ry={9} fill="#fff" opacity={0.5} />;
      })}
      {/* note */}
      <g transform={`translate(${nx} ${ny}) rotate(${lerp(-25, -6, slide)})`}>
        <rect x={-170} y={-120} width={340} height={240} rx={10} fill="#fff8d9" stroke="#e2d6a8" strokeWidth={4} />
        <text x={0} y={-50} textAnchor="middle" fontFamily={HAND} fontSize={50} fill="#3d3366">Sorry!</text>
        <text x={0} y={8} textAnchor="middle" fontFamily={HAND} fontSize={36} fill="#3d3366">I scratched your car.</text>
        <text x={0} y={58} textAnchor="middle" fontFamily={HAND} fontSize={36} fill="#3d3366">Please call me. Max</text>
        <path d="M -40,84 l 20,14 l 30,-30" stroke="#e8352e" strokeWidth={6} fill="none" opacity={0} />
      </g>
      {/* Max's hand pushing the note until it is tucked */}
      {f < CUES.noteTuck + 10 && (
        <g opacity={1 - ramp(f, CUES.noteTuck, CUES.noteTuck + 10)}>
          <path d={`M -200,${ny + 260} L ${nx - 150},${ny + 60}`} stroke={JACKET} strokeWidth={70} strokeLinecap="round" />
          <circle cx={nx - 140} cy={ny + 50} r={40} fill={SKIN} />
        </g>
      )}
      {/* wiper */}
      <g transform={`rotate(${wiperLift} 160 1160)`}>
        <path d="M 160,1160 L 860,1090" stroke="#22242c" strokeWidth={22} strokeLinecap="round" />
        <circle cx={160} cy={1160} r={26} fill="#22242c" />
      </g>
      {/* Max's face, determined and kind */}
      <g transform={`translate(${190} ${1290 - 40 * eback(ramp(f, CUES.sceneNote, CUES.sceneNote + 14))}) scale(1.6)`}>
        <path d="M -90,150 C -90,80 -50,70 0,70 C 50,70 90,80 90,150 Z" fill={JACKET} />
        <Head f={f} mood={f >= CUES.noteTuck ? "happy" : "smile"} look={[0.9, -0.6]} helmet />
      </g>
      <Rain f={f} amount={0.6} />
    </g>
  );
};

const SceneShield: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneShield;
  const sh = eback(ramp(f, CUES.shield, CUES.shield + 18));
  const stamp = ramp(f, CUES.paid, CUES.paid + 8);
  const billIn = eout(ramp(f, CUES.paid - 16, CUES.paid));
  const pig = eback(ramp(f, CUES.savings, CUES.savings + 14));
  const clear = ramp(f, CUES.sceneShield, CUES.sceneShield + 60);
  return (
    <g transform={camLerp(t / 140, [540, 1000, 1.08], [540, 960, 1.0])}>
      <SkyGrad id="skyShield" top="#a4cdee" bottom="#f4e2c8" />
      <rect x={-400} y={-400} width={W + 800} height={H + 800} fill="#7f879f" opacity={1 - clear} />
      <TvTower x={760} color="#c7d9ea" />
      <Clouds f={f} dark={false} part={clear} />
      <Street scroll={0} mood="sun" f={f} />
      <g transform="translate(860 1330) scale(0.9)">
        <Car scratchFrom={-260} scratchTo={-60} scratchY={-170} />
      </g>
      {/* shield behind Max */}
      <g transform={`translate(330 1020) scale(${sh})`} opacity={clamp01(sh)}>
        <Glow x={0} y={0} r={420} warm={false} />
        <path d="M 0,-300 C 90,-250 170,-240 230,-240 C 230,-40 190,170 0,300 C -190,170 -230,-40 -230,-240 C -170,-240 -90,-250 0,-300 Z" fill="#4aa3ff" opacity={0.28} stroke="#ffffff" strokeWidth={12} />
        <path d="M -80,0 L -20,60 L 100,-70" stroke="#ffffff" strokeWidth={26} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      </g>
      <g transform="translate(330 1430)">
        <Person f={f} seed={7} coat={JACKET} hair="#5a3825" mood={f >= CUES.paid ? "happy" : "smile"} isMax />
      </g>
      <g transform="translate(790 1440)">
        <Person f={f} seed={11} coat="#c94b6d" hair="#2e2236" mood="happy" holdNote flip wave={f >= CUES.savings ? 1 : 0} />
      </g>
      {/* paid bill */}
      <g transform={`translate(${lerp(1300, 560, billIn)} ${lerp(200, 380, billIn)}) rotate(${lerp(30, -6, billIn)})`}>
        <rect x={-150} y={-190} width={300} height={380} rx={10} fill="#fff" stroke="#ddd" strokeWidth={4} />
        <text x={0} y={-130} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={36} fill="#c4372f">REPAIR BILL</text>
        {[0, 1, 2, 3, 4].map((k) => (
          <rect key={k} x={-110} y={-90 + k * 50} width={220 - (k % 2) * 60} height={16} rx={8} fill="#c9c6d4" />
        ))}
        {f >= CUES.paid && (
          <g transform={`rotate(-18) scale(${lerp(2.2, 1, eout(stamp))})`} opacity={clamp01(stamp * 2)}>
            <rect x={-130} y={-50} width={260} height={100} rx={14} fill="none" stroke="#1e9e5a" strokeWidth={12} />
            <text x={0} y={30} textAnchor="middle" fontFamily={NUNITO} fontWeight={900} fontSize={76} fill="#1e9e5a">PAID</text>
          </g>
        )}
      </g>
      {/* piggy bank: Max keeps his savings */}
      <g transform={`translate(560 1400) scale(${pig})`}>
        <ellipse cx={0} cy={-70} rx={90} ry={70} fill="#ff9fb4" />
        <circle cx={80} cy={-80} r={34} fill="#ff9fb4" />
        <ellipse cx={104} cy={-78} rx={16} ry={12} fill="#f57f9a" />
        <circle cx={78} cy={-96} r={6} fill={INK} />
        <path d="M -20,-140 l 20,-26 l 16,24 Z" fill="#f57f9a" />
        <rect x={-30} y={-142} width={50} height={10} rx={5} fill="#c9506c" />
        {[-50, -10, 30, 60].map((x) => <rect key={x} x={x} y={-14} width={20} height={20} rx={6} fill="#f57f9a" />)}
        {[0, 1, 2].map((k) => {
          const p = ((t + k * 14) % 42) / 42;
          return <path key={k} d={`M ${-60 + k * 50},${-170 - p * 80} l 6,-14 l 6,14 l 14,6 l -14,6 l -6,14 l -6,-14 l -14,-6 Z`} fill="#ffd54a" opacity={pig * (1 - p)} />;
        })}
      </g>
    </g>
  );
};

const SceneSun: React.FC<{ f: number }> = ({ f }) => {
  const t = f - CUES.sceneSun;
  const scroll = t * 8;
  const x = lerp(470, 560, ramp(f, CUES.bell2, CUES.sceneCard));
  return (
    <g transform={camLerp(t / 100, [540, 1000, 1.08], [540, 900, 1.0])}>
      <SkyGrad id="skySun" top="#7cc4f4" bottom="#fff1cf" />
      <g opacity={0.45}>
        {["#ff6b6b", "#ffb84d", "#ffe45c", "#6fd38c", "#5aa9ff", "#a77cff"].map((c, k) => (
          <path key={c} d={`M -200,1200 A ${880 - k * 34},${880 - k * 34} 0 0 1 ${1280},1200`} stroke={c} strokeWidth={34} fill="none" transform="translate(0 -100)" />
        ))}
      </g>
      <g transform={`translate(860 260) rotate(${t * 0.6})`}>
        {Array.from({ length: 12 }, (_, k) => (
          <rect key={k} x={-8} y={-190} width={16} height={60} rx={8} fill="#ffd34d" transform={`rotate(${k * 30})`} />
        ))}
      </g>
      <Glow x={860} y={260} r={300} />
      <circle cx={860} cy={260} r={90} fill="#ffe08a" />
      <TvTower x={300} color="#cfe0ef" />
      <Clouds f={f} dark={false} />
      <Street scroll={scroll} mood="sun" f={f} />
      <g transform={`translate(${x} ${GROUND})`}>
        <MaxOnBike f={f} dist={scroll * 1.2} mood={f >= CUES.bell2 ? "happy" : "smile"} ringAt={[CUES.bell2]} />
      </g>
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
          <text x={540} y={740} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Liability insurance?</text>
          <text x={540} y={800} textAnchor="middle" fontFamily={NUNITO} fontWeight={700} fontSize={44} fill="#4a5578">Talk to</text>
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
      {/* the red bell, one last time */}
      <g transform={`translate(540 ${1520 + 10 * Math.sin(t * 0.15)}) scale(2.4)`} opacity={line(40)}>
        <Bell f={f} ringAt={[CUES.cardBell]} />
      </g>
    </g>
  );
};

const SCENE_COMPONENTS: Record<string, React.FC<{ f: number }>> = {
  ride: SceneRide,
  rain: SceneRain,
  bill: SceneBill,
  note: SceneNote,
  shield: SceneShield,
  sun: SceneSun,
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
          if (f < a - (i === 0 ? 0 : 0) || f >= b + (isLast ? 0 : XF)) return null;
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
