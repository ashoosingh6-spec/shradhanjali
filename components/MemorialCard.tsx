import type { CSSProperties } from "react";
import type { CardContent } from "@/lib/card-types";

// All positions are in poster pixels (1024 x 1536) and converted to % so the card scales.
const W = 1024, H = 1536;
const px = (v: number) => `${(v / W) * 100}cqw`;
type Box = { font?: "serif"|"sans"|"mukta"; wrap?: boolean; x: number; y: number; w: number; h: number; size: number; max: number; color?: string; weight?: number; align?: "left" | "center" };

const B: Record<string, Box> = {
  om: { x: 400, y: 100, w: 225, h: 46, size: 36, max: 12, font: "sans", weight: 500 },
  title: { x: 322, y: 184, w: 390, h: 88, size: 98, max: 10, color: "#fff", font: "serif", weight: 700 },
  shloka: { wrap: true, x: 295, y: 284, w: 470, h: 66, size: 25, max: 40, font: "sans", weight: 500 },
  salutation: { x: 466, y: 442, w: 200, h: 32, size: 27, max: 14, font: "sans", weight: 500, align: "left" },
  intro: { wrap: true, x: 480, y: 470, w: 450, h: 62, size: 26, max: 46, font: "sans", weight: 500 },
  name: { x: 490, y: 551, w: 410, h: 64, size: 54, max: 16, font: "serif", weight: 800 },
  after: { x: 455, y: 624, w: 490, h: 66, size: 29, max: 40, font: "sans", weight: 500 },
  invite: { wrap: true, x: 440, y: 690, w: 500, h: 92, size: 27, max: 44, font: "sans", weight: 500 },
  sched: { x: 575, y: 829, w: 228, h: 38, size: 36, max: 14, color: "#fff", font: "mukta", weight: 600 },
  sw: { x: 150, y: 890, w: 125, h: 36, size: 28, max: 10, color: "#fff", font: "sans", weight: 500 },
  name2: { x: 62, y: 925, w: 298, h: 52, size: 37, max: 18, color: "#fff", font: "serif", weight: 800 },
  swDate: { x: 112, y: 1000, w: 195, h: 90, size: 28, max: 14, font: "sans", weight: 500 },
  familyT: { x: 225, y: 1128, w: 132, h: 26, size: 31, max: 8, color: "#fff", font: "mukta", weight: 600 },
  family: { wrap: true, x: 80, y: 1170, w: 420, h: 128, size: 27, max: 40, font: "sans", weight: 400 },
  regT: { x: 688, y: 1128, w: 100, h: 26, size: 31, max: 8, color: "#fff", font: "mukta", weight: 600 },
  rep: { x: 580, y: 1166, w: 360, h: 56, size: 47, max: 16, font: "sans", weight: 400 },
  addr: { x: 595, y: 1228, w: 345, h: 32, size: 25, max: 32, font: "sans", weight: 400, align: "left" },
  phones: { x: 595, y: 1264, w: 360, h: 34, size: 26, max: 32, font: "sans", weight: 400, align: "left" },
};
const FAM: Record<string,string> = {serif:'"Noto Serif Devanagari",serif',sans:'"Noto Sans Devanagari",sans-serif',mukta:'Mukta,"Noto Sans Devanagari",sans-serif'};
const EV_ROWS = [905, 949, 992, 1041];

function style(b: Box, text: string): CSSProperties {
  const len = [...text.replace(/\n/g, "")].length;
  // shrink long text so it stays inside its box (use the longest line when text has line breaks)
  const longest = Math.max(1, ...text.split("\n").map((l) => [...l].length));
  const k = Math.min(1, b.max / Math.max(longest, len > 0 ? 1 : 1));
  return {
    left: px(b.x), top: px(b.y), width: px(b.w), height: px(b.h),
    fontSize: px(b.size * k), color: b.color || "#0a0a0a", fontWeight: b.weight || 500, fontFamily: FAM[b.font || "sans"],
    textAlign: b.align || "center",
  };
}
function wrapText(t: string, max: number) {
  const out: string[] = []; let cur = "";
  for (const w of t.split(/\s+/).filter(Boolean)) {
    if (cur && [...(cur + " " + w)].length > max) { out.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
  }
  if (cur) out.push(cur);
  return out.join("\n");
}
function T({ k, text: raw }: { k: keyof typeof B; text: string }) {
  let text = String(raw ?? "").replace(/\\n/g, "\n");
  if (B[k].wrap && !text.includes("\n")) text = wrapText(text, B[k].max);
  return <div className="mem-t" style={style(B[k], text)}>{text.split("\n").map((l, i) => <span key={i}>{l}</span>)}</div>;
}

export function MemorialCard({
  c, recipient, recipientTitle = "श्रीमान", photo,
}: {
  c: CardContent; recipient: string; recipientTitle?: "श्रीमान" | "श्रीमती"; photo?: string;
}) {
  const ev = c.events || [];
  const fam = (c.familyLines || []).join("\n");
  const photoUrl = photo || c.portraitUrl || "/default-portrait.jpg";
  return (
    <article className="mem-poster" aria-label="श्रद्धांजलि कार्ड">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mem-poster-image" src="/shradhanjali-plate.jpg" alt="" width={W} height={H} draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="mem-portrait" src={photoUrl} alt={c.deceasedName} crossOrigin="anonymous" draggable={false}
        style={{ left: px(103), top: `${(363 / H) * 100}%`, width: px(280), height: `${(344 / H) * 100}%` }} />
      <T k="om" text={c.omText} />
      <T k="title" text={c.title} />
      <T k="shloka" text={c.shloka} />
      <div className="mem-recipient-overlay">
        <span className="mem-recipient-title">{recipientTitle}</span>
        <span className="mem-recipient-name">{recipient.trim() || "................................"}</span>
      </div>
      <T k="salutation" text={c.salutation} />
      <T k="intro" text={c.intro} />
      <T k="name" text={c.deceasedName} />
      <T k="after" text={`${c.afterDeath} ${c.deathDate}\n(${c.deathDay}) को हो गया है।`} />
      <T k="invite" text={c.invitation} />
      <T k="sched" text={c.scheduleTitle} />
      <T k="sw" text="स्वर्गीय" />
      <T k="name2" text={c.deceasedName} />
      <T k="swDate" text={`स्वर्गवास\n${c.deathDate}\n(${c.deathDay})`} />
      {EV_ROWS.map((cy, i) => ev[i] && (
        <div key={i}>
          <div className="mem-t" style={{ left: px(458), top: px(cy - 22), width: px(264), height: px(44), fontSize: px(24), fontWeight: 600, fontFamily: FAM.mukta, textAlign: "left", color: "#0a0a0a" }}>
            <span>{`दिनांक ${ev[i].date} (${ev[i].day})`}</span>
          </div>
          <div className="mem-t" style={{ left: px(800), top: px(cy - 22), width: px(172), height: px(44), fontSize: px(24 * Math.min(1, 21 / Math.max(1, [...ev[i].title].length))), fontWeight: 600, fontFamily: FAM.mukta, textAlign: "left", color: "#0a0a0a" }}>
            <span>{ev[i].title}</span>
          </div>
        </div>
      ))}
      <T k="familyT" text={c.familyTitle} />
      <T k="family" text={fam} />
      <T k="regT" text={c.regardsTitle} />
      <T k="rep" text={c.representative} />
      <T k="addr" text={c.address} />
      <T k="phones" text={`${c.phones}`} />
    </article>
  );
}
