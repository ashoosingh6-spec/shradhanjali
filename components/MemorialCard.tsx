import type { CardContent } from "@/lib/card-types";

export function MemorialCard({
  c,
  recipient,
  recipientTitle = "श्रीमान",
}: {
  c: CardContent;
  recipient: string;
  recipientTitle?: "श्रीमान" | "श्रीमती";
  photo?: string;
}) {
  return (
    <article className="mem-poster" aria-label="श्रद्धांजलि कार्ड">
      <img
        className="mem-poster-image"
        src="/shradhanjali-template.png"
        alt="शोक-संदेश एवं श्रद्धांजलि कार्यक्रम का मूल डिजाइन"
        width={1024}
        height={1536}
        draggable={false}
      />
      <div className="mem-recipient-overlay">
        <span className="mem-recipient-title">{recipientTitle}</span>
        <span className="mem-recipient-name">
          {recipient.trim() || "................................"}
        </span>
      </div>
    </article>
  );
}
