import type { CardContent } from "@/lib/card-types";

/**
 * Canvas renderer for the card.
 * - Same drawing code is used for the on-screen preview and for the PDF / image export,
 *   so what you see is exactly what you share.
 * - All text is measured with the real font (measureText) and shrunk / wrapped to fit,
 *   so lines can never overlap, whatever wording the admin enters.
 * - No DOM-to-image conversion, no CSS container units: works on old Android / iOS Safari.
 */
export type Design = 1 | 2;
/** mask = the exact visible shape of the photo (frame opening minus the flowers that sit in front of it). x/y/w/h = where the mask PNG sits on the card. */
type PhotoMask = { src: string; x: number; y: number; w: number; h: number; fy: number };
export const DESIGNS: Record<Design, { w: number; h: number; plate: string; portrait: string; name: string; mask: PhotoMask }> = {
  1: { w: 1024, h: 1536, plate: "/shradhanjali-plate.jpg", portrait: "/default-portrait.jpg", name: "कार्ड 1 · खड़ा (Portrait)", mask: { src: "/portrait-mask-1.png", x: 74, y: 368, w: 319, h: 401, fy: 0.1 } },
  2: { w: 1536, h: 1024, plate: "/shradhanjali-plate-2.jpg", portrait: "/default-portrait-2.jpg", name: "कार्ड 2 · आड़ा (Landscape)", mask: { src: "/portrait-mask-2.png", x: 44, y: 85, w: 316, h: 442, fy: 0.1 } },
};
export const W = 1024;
export const H = 1536;

const SERIF = '"Noto Serif Devanagari","Noto Serif","Mangal","Nirmala UI",serif';
const SANS = '"Noto Sans Devanagari","Mukta","Nirmala UI","Mangal",sans-serif';
const MUKTA = 'Mukta,"Noto Sans Devanagari","Nirmala UI","Mangal",sans-serif';
type Fam = "serif" | "sans" | "mukta";
const FAM: Record<Fam, string> = { serif: SERIF, sans: SANS, mukta: MUKTA };

const INK = "#0a0a0a";
const WHITE = "#ffffff";

export type CardImages = { plate: HTMLImageElement; portrait: HTMLImageElement | null; mask: HTMLImageElement | null };

/* ---------- asset loading (cached) ---------- */
const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImage(src: string, cors = false): Promise<HTMLImageElement> {
  const key = (cors ? "c:" : "n:") + src;
  let p = imgCache.get(key);
  if (!p) {
    p = new Promise((res, rej) => {
      const im = new Image();
      if (cors) im.crossOrigin = "anonymous";
      im.decoding = "async";
      im.onload = () => res(im);
      im.onerror = () => { imgCache.delete(key); rej(new Error("image load failed: " + src)); };
      im.src = src;
    });
    imgCache.set(key, p);
  }
  return p;
}

export async function loadCardImages(portraitUrl?: string, design: Design = 1): Promise<CardImages> {
  const plate = loadImage(DESIGNS[design].plate);
  const fallback = () => loadImage(DESIGNS[design].portrait);
  const portrait = (portraitUrl ? loadImage(portraitUrl, true).catch(fallback) : fallback()).catch(() => null);
  const mask = loadImage(DESIGNS[design].mask.src).catch(() => null);
  return { plate: await plate, portrait: await portrait, mask: await mask };
}

const FONT_SPECS: [string, string][] = [
  ["700", SERIF], ["800", SERIF], ["400", SANS], ["500", SANS], ["700", SANS], ["800", SANS], ["600", MUKTA],
];
let fontsReady: Promise<void> | null = null;
export function loadFonts(): Promise<void> {
  if (!fontsReady) {
    fontsReady = (async () => {
      try {
        if (typeof document === "undefined" || !document.fonts) return;
        await Promise.all(FONT_SPECS.map(([w, f]) => document.fonts.load(`${w} 30px ${f}`, "अआकखशोक-संदेश0123456789")));
        await document.fonts.ready;
      } catch { /* fall back to system fonts */ }
    })();
  }
  return fontsReady;
}

/* ---------- text helpers ---------- */
type Ctx = CanvasRenderingContext2D;
const setFont = (ctx: Ctx, weight: number, size: number, fam: Fam) => { ctx.font = `${weight} ${size}px ${FAM[fam]}`; };
const lineW = (ctx: Ctx, s: string) => ctx.measureText(s).width;

/** word-wrap by real pixel width */
function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(""); continue; }
    let cur = "";
    for (const w of words) {
      const t = cur ? cur + " " + w : w;
      if (cur && lineW(ctx, t) > maxW) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
  }
  return out;
}

const norm = (t: unknown) => String(t ?? "").replace(/\\n/g, "\n").trim();

type Opts = { x: number; y: number; w: number; h: number; size: number; min?: number; weight: number; fam: Fam; color?: string; align?: "left" | "center"; lh?: number; wrapLines?: boolean };

/** Draw text inside a box: wraps if asked, shrinks until it fits both width and height, centred vertically. Returns used font size. */
function box(ctx: Ctx, text: string, o: Opts): number {
  const lh = o.lh ?? 1.34;
  const min = o.min ?? Math.round(o.size * 0.5);
  let size = o.size, lines: string[] = [];
  for (; size >= min; size -= 0.5) {
    setFont(ctx, o.weight, size, o.fam);
    lines = o.wrapLines ? wrap(ctx, text, o.w) : text.split("\n");
    const widest = Math.max(0, ...lines.map((l) => lineW(ctx, l)));
    if (widest <= o.w && lines.length * size * lh <= o.h + 0.5) break;
  }
  setFont(ctx, o.weight, size, o.fam);
  ctx.fillStyle = o.color || INK;
  ctx.textBaseline = "middle";
  ctx.textAlign = o.align === "left" ? "left" : "center";
  const total = lines.length * size * lh;
  let cy = o.y + (o.h - total) / 2 + (size * lh) / 2;
  const x = o.align === "left" ? o.x : o.x + o.w / 2;
  for (const l of lines) { ctx.fillText(l, x, cy); cy += size * lh; }
  return size;
}

/** A stack of paragraphs sharing one font size, auto-fitted to a zone so they can never collide. */
function stack(ctx: Ctx, paras: string[], z: { x: number; y: number; w: number; h: number; size: number; min: number; weight: number; fam: Fam; align?: "left" | "center"; lh?: number; gap?: number; firstLeft?: boolean }) {
  const lh = z.lh ?? 1.3;
  const gapK = z.gap ?? 0.25;
  let size = z.size, blocks: string[][] = [];
  for (; size >= z.min; size -= 0.5) {
    setFont(ctx, z.weight, size, z.fam);
    blocks = paras.map((p) => wrap(ctx, p, z.w));
    const widest = Math.max(0, ...blocks.flat().map((l) => lineW(ctx, l)));
    const n = blocks.reduce((a, b) => a + b.length, 0);
    const hh = n * size * lh + (blocks.length - 1) * size * gapK;
    if (widest <= z.w && hh <= z.h) break;
  }
  setFont(ctx, z.weight, size, z.fam);
  ctx.fillStyle = INK;
  ctx.textBaseline = "middle";
  const n = blocks.reduce((a, b) => a + b.length, 0);
  const total = n * size * lh + (blocks.length - 1) * size * gapK;
  let cy = z.y + (z.h - total) / 2 + (size * lh) / 2;
  blocks.forEach((b, bi) => {
    const left = z.firstLeft && bi === 0;
    ctx.textAlign = left ? "left" : "center";
    for (const l of b) { ctx.fillText(l, left ? z.x : z.x + z.w / 2, cy); cy += size * lh; }
    cy += size * gapK;
  });
}

/** Place a photo inside a frame: "cover" fit x zoom, moved by the admin's X / Y sliders (percent of the frame), never leaving gaps. */
function placePortrait(ctx: Ctx, im: HTMLImageElement, bx: number, by: number, bw: number, bh: number, c: CardContent, biasY: number) {
  const k = Math.min(3, Math.max(1, Number((c as any).portraitZoom) || 1));
  const px = Math.min(60, Math.max(-60, Number((c as any).portraitX) || 0));
  const py = Math.min(60, Math.max(-60, Number((c as any).portraitY) || 0));
  const s = Math.max(bw / im.width, bh / im.height) * k;
  const dw = im.width * s, dh = im.height * s;
  let x = bx + (bw - dw) / 2 + (px / 100) * bw;
  let y = by + (bh - dh) * biasY + (py / 100) * bh;
  x = Math.min(bx, Math.max(bx + bw - dw, x));
  y = Math.min(by, Math.max(by + bh - dh, y));
  ctx.drawImage(im, x, y, dw, dh);
}

/** Draw the photo, shaped by the design's mask so it sits exactly inside the frame and behind the flowers. */
function drawPortrait(ctx: Ctx, a: DrawArgs, design: Design) {
  const { images, c } = a, M = DESIGNS[design].mask;
  if (!images.portrait) return;
  const sc = Math.max(1, ctx.getTransform().a);
  const off = document.createElement("canvas");
  off.width = Math.ceil(M.w * sc); off.height = Math.ceil(M.h * sc);
  const o = off.getContext("2d")!;
  o.scale(sc, sc); o.imageSmoothingQuality = "high";
  o.fillStyle = "#e6e6e6"; o.fillRect(0, 0, M.w, M.h);
  o.translate(-M.x, -M.y);
  placePortrait(o, images.portrait, M.x, M.y, M.w, M.h, c, M.fy);
  o.setTransform(1, 0, 0, 1, 0, 0);
  if (images.mask) { o.globalCompositeOperation = "destination-in"; o.drawImage(images.mask, 0, 0, off.width, off.height); }
  ctx.drawImage(off, M.x, M.y, M.w, M.h);
}

/* ---------- main draw ---------- */
export type DrawArgs = {
  c: CardContent; recipient: string; recipientTitle: string; images: CardImages; design?: Design;
};

export function drawCard(ctx: Ctx, a: DrawArgs) {
  if (a.design === 2) return drawCard2(ctx, a);
  const { c, images } = a;
  ctx.save();
  ctx.fillStyle = WHITE; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(images.plate, 0, 0, W, H);

  drawPortrait(ctx, a, 1);

  // ---- header
  box(ctx, norm(c.omText), { x: 400, y: 100, w: 225, h: 46, size: 36, weight: 500, fam: "sans" });
  box(ctx, norm(c.title), { x: 322, y: 184, w: 390, h: 88, size: 98, weight: 700, fam: "serif", color: WHITE, lh: 1.2 });
  box(ctx, norm(c.shloka), { x: 285, y: 282, w: 490, h: 72, size: 25, weight: 500, fam: "sans", lh: 1.4 });

  // ---- message box (inner area x 440..935, y 390..790). Plate name-plaque sits at y 541..621.
  const mx = 450, mw = 480;

  // recipient row with dotted line
  {
    const title = a.recipientTitle, name = a.recipient.trim();
    setFont(ctx, 500, 27, "sans");
    const tw = lineW(ctx, title);
    ctx.fillStyle = INK; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(title, 408, 410);
    const nx = 408 + tw + 14, nw = 940 - nx;
    if (name) {
      let s = 27; setFont(ctx, 500, s, "sans");
      while (s > 14 && lineW(ctx, name) > nw) { s -= 0.5; setFont(ctx, 500, s, "sans"); }
      ctx.fillText(name, nx, 410);
    }
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.setLineDash([0.1, 6]);
    ctx.beginPath(); ctx.moveTo(408, 433); ctx.lineTo(940, 433); ctx.stroke();
    ctx.restore();
  }

  // zone above the plaque: salutation + intro
  stack(ctx, [norm(c.salutation), norm(c.intro)], { x: mx, y: 440, w: mw, h: 96, size: 26, min: 18, weight: 500, fam: "sans", lh: 1.28, gap: 0.05, firstLeft: true });

  // name in plaque
  box(ctx, norm(c.deceasedName), { x: 470, y: 546, w: 440, h: 70, size: 54, min: 24, weight: 800, fam: "serif", lh: 1.2 });

  // zone below the plaque: death line + invitation
  stack(ctx, [`${norm(c.afterDeath)} ${norm(c.deathDate)}\n(${norm(c.deathDay)}) को हो गया है।`, norm(c.invitation)], { x: mx, y: 626, w: mw, h: 162, size: 28, min: 18, weight: 500, fam: "sans", lh: 1.28, gap: 0.3 });

  // ---- schedule ribbon
  box(ctx, norm(c.scheduleTitle), { x: 575, y: 826, w: 228, h: 42, size: 36, min: 18, weight: 600, fam: "mukta", color: WHITE, lh: 1.2 });

  // ---- left plaque + death date
  box(ctx, "स्वर्गीय", { x: 150, y: 886, w: 125, h: 38, size: 28, weight: 500, fam: "sans", color: WHITE, lh: 1.2 });
  box(ctx, norm(c.deceasedName), { x: 62, y: 922, w: 298, h: 56, size: 37, min: 18, weight: 800, fam: "serif", color: WHITE, lh: 1.2 });
  stack(ctx, ["स्वर्गवास", norm(c.deathDate), `(${norm(c.deathDay)})`], { x: 100, y: 990, w: 220, h: 100, size: 28, min: 16, weight: 500, fam: "sans", lh: 1.3, gap: 0 });

  // ---- events table
  const ROWS = [905, 949, 992, 1041];
  (c.events || []).slice(0, 4).forEach((ev, i) => {
    const cy = ROWS[i];
    box(ctx, `दिनांक ${ev.date} (${ev.day})`, { x: 458, y: cy - 22, w: 264, h: 44, size: 24, min: 13, weight: 600, fam: "mukta", align: "left", lh: 1.2 });
    box(ctx, norm(ev.title), { x: 800, y: cy - 22, w: 172, h: 44, size: 24, min: 12, weight: 600, fam: "mukta", align: "left", lh: 1.2 });
  });

  // ---- footer
  box(ctx, norm(c.familyTitle), { x: 215, y: 1124, w: 152, h: 34, size: 31, min: 16, weight: 600, fam: "mukta", color: WHITE, lh: 1.2 });
  box(ctx, (c.familyLines || []).join("\n"), { x: 80, y: 1166, w: 420, h: 140, size: 27, min: 14, weight: 400, fam: "sans", lh: 1.36 });
  box(ctx, norm(c.regardsTitle), { x: 678, y: 1124, w: 120, h: 34, size: 31, min: 16, weight: 600, fam: "mukta", color: WHITE, lh: 1.2 });
  box(ctx, norm(c.representative), { x: 580, y: 1164, w: 360, h: 58, size: 47, min: 22, weight: 500, fam: "sans", lh: 1.2 });
  box(ctx, norm(c.address), { x: 595, y: 1228, w: 345, h: 32, size: 25, min: 12, weight: 400, fam: "sans", align: "left", lh: 1.2 });
  box(ctx, norm(c.phones), { x: 595, y: 1264, w: 345, h: 34, size: 26, min: 12, weight: 400, fam: "sans", align: "left", lh: 1.2 });

  ctx.restore();
}

/** Render the selected design to a canvas at the given pixel scale (1 = native size of that design). A newer call cancels an older one still loading. */
export async function renderToCanvas(canvas: HTMLCanvasElement, args: Omit<DrawArgs, "images"> & { images?: CardImages }, scale = 1) {
  const cv = canvas as HTMLCanvasElement & { __seq?: number };
  const seq = (cv.__seq = (cv.__seq || 0) + 1);
  const design: Design = args.design === 2 ? 2 : 1;
  const images = args.images || (await loadCardImages(args.c.portraitUrl, design));
  await loadFonts();
  if (cv.__seq !== seq) return;
  const { w, h } = DESIGNS[design];
  cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = "high";
  drawCard(ctx, { ...args, design, images });
}

/* ================= CARD 2 (landscape, 1536 x 1024) ================= */

/** Left-aligned paragraph with first-line indent; wraps by real width. Returns the lines used. */
function paraLines(ctx: Ctx, text: string, w: number, indent: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const out: string[] = []; let cur = "", first = true;
  for (const wd of words) {
    const t = cur ? cur + " " + wd : wd;
    const max = first ? w - indent : w;
    if (cur && lineW(ctx, t) > max) { out.push(cur); cur = wd; first = false; } else cur = t;
  }
  if (cur) out.push(cur);
  return out;
}

const dot = (d: string) => String(d ?? "").replace(/\//g, ".");

function drawCard2(ctx: Ctx, a: DrawArgs) {
  const { c, images } = a;
  ctx.save();
  ctx.fillStyle = WHITE; ctx.fillRect(0, 0, 1536, 1024);
  ctx.drawImage(images.plate, 0, 0, 1536, 1024);

  drawPortrait(ctx, a, 2);

  const B = 700;
  // header
  box(ctx, norm(c.title), { x: 560, y: 36, w: 415, h: 84, size: 84, min: 36, weight: 800, fam: "sans", color: WHITE, lh: 1.15 });
  box(ctx, norm(c.shloka), { x: 1124, y: 36, w: 352, h: 74, size: 24, min: 12, weight: B, fam: "sans", lh: 1.45 });

  // recipient row (starts directly with श्रीमान / श्रीमती, no "सेवा में")
  {
    const title = a.recipientTitle, name = a.recipient.trim();
    setFont(ctx, B, 38, "sans"); ctx.fillStyle = INK; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    const x0 = 392, ry = 168; ctx.fillText(title, x0, ry);
    let x = x0 + lineW(ctx, title) + 14;
    if (name) {
      let s = 38; setFont(ctx, B, s, "sans");
      while (s > 18 && lineW(ctx, name) > 1480 - x - 30) { s -= 0.5; setFont(ctx, B, s, "sans"); }
      ctx.fillText(name, x, ry); x += lineW(ctx, name) + 10;
    }
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.setLineDash([0.1, 7]);
    ctx.beginPath(); ctx.moveTo(x, ry + 10); ctx.lineTo(1485, ry + 10); ctx.stroke(); ctx.restore();
  }

  // the two paragraphs (shared font size, auto-fit so they never collide with the table)
  {
    const one = (t: string) => norm(t).replace(/\s*\n\s*/g, " ");
    const p1 = `${one(c.intro)} ${norm(c.deceasedName)} ${one(c.afterDeath)} ${dot(norm(c.deathDate))} (${norm(c.deathDay)}) को हो गया है।`;
    const p2 = one(c.invitation);
    const X = 392, Wd = 1098, ZY = 196, ZH = 212, IND = 52;
    let size = 42, l1: string[] = [], l2: string[] = [];
    for (; size >= 20; size -= 0.5) {
      setFont(ctx, B, size, "sans");
      l1 = paraLines(ctx, p1, Wd, IND); l2 = paraLines(ctx, p2, Wd, IND);
      if ((l1.length + l2.length) * size * 1.2 + size * 0.2 <= ZH) break;
    }
    setFont(ctx, B, size, "sans"); ctx.textAlign = "left"; ctx.textBaseline = "middle";
    const lh = size * 1.2, total = (l1.length + l2.length) * lh + size * 0.2;
    let y = ZY + (ZH - total) / 2 + lh / 2;
    [l1, l2].forEach((ls, bi) => { ls.forEach((l, i) => { ctx.fillText(l, X + (i === 0 ? IND : 0), y); y += lh; }); if (bi === 0) y += size * 0.2; });
  }

  // schedule
  box(ctx, norm(c.scheduleTitle), { x: 740, y: 418, w: 256, h: 44, size: 40, min: 18, weight: B, fam: "sans", color: WHITE, lh: 1.15 });
  const RY = [487, 529, 571, 613];
  (c.events || []).slice(0, 4).forEach((ev, i) => {
    const y = RY[i], h = 40;
    box(ctx, "दिनांक :-", { x: 408, y: y - h / 2, w: 135, h, size: 35, min: 20, weight: B, fam: "sans", align: "left", lh: 1.1 });
    box(ctx, dot(ev.date), { x: 548, y: y - h / 2, w: 200, h, size: 35, min: 20, weight: B, fam: "sans", align: "left", lh: 1.1 });
    box(ctx, `(${ev.day})`, { x: 757, y: y - h / 2, w: 175, h, size: 35, min: 18, weight: B, fam: "sans", align: "left", lh: 1.1 });
    box(ctx, "—", { x: 950, y: y - h / 2, w: 40, h, size: 35, min: 20, weight: B, fam: "sans", align: "left", lh: 1.1 });
    box(ctx, norm(ev.title), { x: 1028, y: y - h / 2, w: 462, h, size: 35, min: 14, weight: B, fam: "sans", align: "left", lh: 1.1 });
  });

  // family
  box(ctx, `-: ${norm(c.familyTitle)} :-`, { x: 330, y: 665, w: 356, h: 42, size: 37, min: 18, weight: B, fam: "sans", color: WHITE, lh: 1.15 });
  box(ctx, (c.familyLines || []).join(" "), { x: 92, y: 722, w: 836, h: 186, size: 40, min: 16, weight: B, fam: "sans", lh: 1.28, wrapLines: true });

  // regards
  box(ctx, `${norm(c.regardsTitle)} :-`, { x: 1178, y: 665, w: 132, h: 42, size: 33, min: 16, weight: B, fam: "sans", color: WHITE, lh: 1.15 });
  box(ctx, norm(c.representative).replace(/^श्री\s+/, ""), { x: 1060, y: 724, w: 374, h: 84, size: 76, min: 28, weight: 800, fam: "sans", lh: 1.1 });
  box(ctx, norm(c.address), { x: 1012, y: 812, w: 446, h: 90, size: 35, min: 16, weight: B, fam: "sans", lh: 1.4, wrapLines: true });
  box(ctx, `मोबाइल - ${norm(c.phones)}`, { x: 990, y: 912, w: 430, h: 44, size: 37, min: 16, weight: B, fam: "sans", color: WHITE, lh: 1.1 });

  ctx.restore();
}
