import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are stored in public/fonts (both are SIL Open Font License, from Google Fonts),
// so rendering needs no network.
const load = (family: string, file: string, weight: string) => {
  if (typeof document === "undefined") return;
  const handle = delayRender(`font ${family} ${weight}`);
  const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight });
  face.load().then((f) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(f); continueRender(handle); }).catch((e) => { console.error(e); continueRender(handle); });
};

export const NUNITO = "NunitoLocal";
export const HAND = "PatrickHandLocal";
load(NUNITO, "fonts/Nunito.woff2", "200 1000");
load(HAND, "fonts/PatrickHand.woff2", "400");
