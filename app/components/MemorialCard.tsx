import React from "react";

type Content = {
  omText:string; title:string; shloka:string; recipientPlaceholder:string;
  salutation:string; intro:string; deceasedName:string; deathDate:string; deathDay:string;
  afterDeath:string; invitation:string; scheduleTitle:string;
  events:{date:string;day:string;title:string}[];
  familyTitle:string; familyLines:string[]; regardsTitle:string; representative:string;
  address:string; phones:string; footer:string; portraitUrl:string;
};

export function Card({c,recipient,photo}:{c:Content;recipient:string;photo:string}) {
 return <article className="mem-card">
  <div className="mem-inset"/>
  <header className="mem-head">
   <div className="mem-om">ॐ</div>
   <div className="mem-omtext">{c.omText}</div>
   <h1>{c.title}</h1>
   <p className="mem-shloka">{c.shloka.split("\\n").map((x,i)=><span key={i}>{x}<br/></span>)}</p>
   <div className="mem-rule">✥</div>
  </header>
  <section className="mem-main">
   <div className="mem-photo-col">
    <div className="mem-frame">{photo ? <img src={photo} alt={c.deceasedName}/> : <div className="mem-placeholder"><b>ॐ</b><span>चित्र</span></div>}</div>
    <div className="mem-plaque"><small>स्वर्गीय</small><strong>{c.deceasedName}</strong></div>
    <div className="mem-date"><small>स्वर्गवास</small><b>{c.deathDate}</b><small>({c.deathDay})</small></div>
   </div>
   <div className="mem-copy">
    <p className="mem-recipient">{recipient.trim() || c.recipientPlaceholder}</p>
    <p className="mem-salutation">{c.salutation}</p>
    <p>{c.intro}</p>
    <h2>{c.deceasedName}</h2>
    <p>{c.afterDeath} <b>{c.deathDate}</b> ({c.deathDay}) को हो गया है।</p>
    <p>{c.invitation}</p>
    <div className="mem-ribbon"><span>{c.scheduleTitle}</span></div>
    <div className="mem-events">{c.events.map((e,i)=><div className="mem-event" key={i}>
      <span className="mem-cal">▦</span><span>दिनांक&nbsp; {e.date}</span><span>({e.day})</span><b>{e.title}</b>
    </div>)}</div>
   </div>
  </section>
  <div className="mem-separator">✥</div>
  <footer className="mem-footer">
   <section><div className="mem-ribbon"><span>{c.familyTitle}</span></div>
    <p>{c.familyLines.map((line,i)=><span key={i}>{line}<br/></span>)}</p>
   </section>
   <section><div className="mem-ribbon"><span>{c.regardsTitle}</span></div>
    <h3>{c.representative}</h3><p>⌖ &nbsp;{c.address}</p><p>☎ &nbsp;{c.phones}</p>
   </section>
  </footer>
  <div className="mem-bottom"><span>♨</span><span>ॐ</span><span className="mem-diya">◒</span><span>✿</span></div>
  <div className="mem-footnote">{c.footer}</div>
 </article>
}

