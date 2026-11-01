import type { CardContent } from "@/lib/card-types";

/**
 * Canvas renderer for the card.
 * - Same drawing code is used for the on-screen preview and for the PDF / image export,
 *   so what you see is exactly what you share.
 * - All text is measured with the real font (measureText) and shrunk / wrapped to fit,
 *   so lines can never overlap, whatever wording the admin enters.
 * - No DOM-to-image conversion, no CSS container units: works on old Android / iOS Safari.
 */
export const W = 1024;
export const H = 1536;

const SERIF = '"Noto Serif Devanagari","Noto Serif","Mangal","Nirmala UI",serif';
const SANS = '"Noto Sans Devanagari","Mukta","Nirmala UI","Mangal",sans-serif';
const MUKTA = 'Mukta,"Noto Sans Devanagari","Nirmala UI","Mangal",sans-serif';
type Fam = "serif" | "sans" | "mukta";
const FAM: Record<Fam, string> = { serif: SERIF, sans: SANS, mukta: MUKTA };

const INK = "#0a0a0a";
const WHITE = "#ffffff";

export type CardImages = { plate: HTMLImageElement; portrait: HTMLImageElement | null };

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

export async function loadCardImages(portraitUrl?: string): Promise<CardImages> {
  const plate = loadImage("/shradhanjali-plate.jpg");
  const fallback = () => loadImage("/default-portrait.jpg");
  const portrait = (portraitUrl ? loadImage(portraitUrl, true).catch(fallback) : fallback()).catch(() => null);
  return { plate: await plate, portrait: await portrait };
}

const FONT_SPECS: [string, string][] = [
  ["700", SERIF], ["800", SERIF], ["400", SANS], ["500", SANS], ["600", MUKTA],
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

/* ---------- main draw ---------- */
export type DrawArgs = {
  c: CardContent; recipient: string; recipientTitle: string; images: CardImages;
};

export function drawCard(ctx: Ctx, a: DrawArgs) {
  const { c, images } = a;
  ctx.save();
  ctx.fillStyle = WHITE; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(images.plate, 0, 0, W, H);

  // portrait inside the oval frame
  if (images.portrait) {
    ctx.save();
    ctx.beginPath(); ctx.ellipse(103 + 140, 363 + 172, 140, 172, 0, 0, Math.PI * 2); ctx.clip();
    const im = images.portrait, s = Math.max(280 / im.width, 344 / im.height);
    const dw = im.width * s, dh = im.height * s;
    ctx.drawImage(im, 103 + (280 - dw) / 2, 363 + (344 - dh) / 2, dw, dh);
    ctx.restore();
  }

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

/** Render the whole card to a canvas at the given pixel scale (1 = 1024 x 1536). A newer call cancels an older one still loading. */
export async function renderToCanvas(canvas: HTMLCanvasElement, args: Omit<DrawArgs, "images"> & { images?: CardImages }, scale = 1) {
  const cv = canvas as HTMLCanvasElement & { __seq?: number };
  const seq = (cv.__seq = (cv.__seq || 0) + 1);
  const images = args.images || (await loadCardImages(args.c.portraitUrl));
  await loadFonts();
  if (cv.__seq !== seq) return;
  cv.width = Math.round(W * scale); cv.height = Math.round(H * scale);
  const ctx = cv.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = "high";
  drawCard(ctx, { ...args, images });
}
