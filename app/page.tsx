"use client";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
import { defaultContent } from "@/lib/default-content";
import "./public.css";

import { MemorialCard } from "@/components/MemorialCard";
import type { CardContent } from "@/lib/card-types";

export default function Home() {
 const [content,setContent]=useState<CardContent>(defaultContent as CardContent);
 const [customCss,setCustomCss]=useState("");
 const [recipient,setRecipient]=useState("");
 const [recipientTitle,setRecipientTitle]=useState<"श्रीमान"|"श्रीमती">("श्रीमान");
 const [format,setFormat]=useState<"pdf"|"png">("pdf");
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 const cardRef=useRef<HTMLDivElement>(null);

 useEffect(()=>{ (async()=>{
   if(!supabase) return;
   const {data}=await supabase.from("memorial_card").select("content,custom_css").eq("id",1).maybeSingle();
   if(data?.content) setContent({...defaultContent,...data.content} as CardContent);
   if(data?.custom_css) setCustomCss(data.custom_css);
 })(); },[]);

 async function makeFile() {
  if(!cardRef.current) throw new Error("Card not ready");
  const data=await toPng(cardRef.current,{pixelRatio:2,cacheBust:true,backgroundColor:"#fff"});
  if(format==="png") return new File([await (await fetch(data)).blob()],"shradhanjali-card.png",{type:"image/png"});
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:[210,315]});
  pdf.addImage(data,"PNG",0,0,210,315);
  return new File([pdf.output("blob")],"shradhanjali-card.pdf",{type:"application/pdf"});
 }
 async function download() {
  try{setBusy(true);setStatus("फाइल तैयार हो रही है...");const f=await makeFile();const u=URL.createObjectURL(f);const a=document.createElement("a");a.href=u;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);setStatus("फाइल डाउनलोड हो गई।");}
  catch{setStatus("फाइल नहीं बन सकी। दोबारा प्रयास करें।");}finally{setBusy(false);}
 }
 async function share() {
  try{setBusy(true);setStatus("WhatsApp के लिए फाइल तैयार हो रही है...");const f=await makeFile();const nav=navigator as Navigator&{canShare?:(d:ShareData)=>boolean};
   const text=`${recipient.trim()?recipientTitle+" "+recipient.trim()+" जी, ":""}सादर आमंत्रण। कृपया शोक-संदेश एवं श्राद्ध-कार्यक्रम में उपस्थित होकर हमें कृतार्थ करें।`;
   if(navigator.share&&nav.canShare?.({files:[f]})){await navigator.share({files:[f],title:cTitle(content),text});setStatus("Share menu खुल गया है। WhatsApp चुनें।");}
   else {const u=URL.createObjectURL(f);const a=document.createElement("a");a.href=u;a.download=f.name;a.click();window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");setStatus("फाइल डाउनलोड हुई है। WhatsApp में Attach करके भेजें।");setTimeout(()=>URL.revokeObjectURL(u),10000);}
  }catch(e){if(e instanceof Error&&e.name==="AbortError")setStatus("Sharing रद्द की गई।");else setStatus("Share नहीं हो सका। फाइल डाउनलोड करके WhatsApp में भेजें।");}finally{setBusy(false);}
 }
 const c=content;
 return <main className="public-shell">
  <header className="public-top"><div><span>श्रद्धांजलि कार्ड मेकर</span><h1>डिजिटल शोक-संदेश</h1><p>नाम लिखें, कार्ड देखें और PDF या इमेज WhatsApp पर साझा करें।</p></div><a href="/admin" className="admin-link">Admin Login ↗</a></header>
  <section className="public-grid">
   <aside className="public-controls">
    <h2>कार्ड व्यक्तिगत करें</h2>
    <label>प्राप्तकर्ता का संबोधन</label>
    <div className="recipient-title-options" role="group" aria-label="प्राप्तकर्ता का संबोधन चुनें">
      <label className="recipient-check"><input type="checkbox" checked={recipientTitle==="श्रीमान"} onChange={()=>setRecipientTitle("श्रीमान")}/> <span>श्रीमान</span></label>
      <label className="recipient-check"><input type="checkbox" checked={recipientTitle==="श्रीमती"} onChange={()=>setRecipientTitle("श्रीमती")}/> <span>श्रीमती</span></label>
    </div>
    <label htmlFor="recipient-name">नाम लिखें</label><input id="recipient-name" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="यहाँ नाम लिखें" maxLength={32}/>
    <small>चुना हुआ संबोधन और नाम कार्ड में डॉटेड लाइन पर दिखाई देगा।</small>
    <small className="template-note">मूल डिजाइन, सजावट, चित्र और हिंदी फॉन्ट आपके दिए हुए पोस्टर से ज्यों-के-त्यों लिए गए हैं।</small>
    <label>फाइल का प्रकार</label><div className="format-switch">
      <button className={format==="pdf"?"selected":""} onClick={()=>setFormat("pdf")}>PDF</button>
      <button className={format==="png"?"selected":""} onClick={()=>setFormat("png")}>PNG Image</button>
    </div>
    <button className="download-action" disabled={busy} onClick={download}>↓ &nbsp; डाउनलोड करें</button>
    <button className="share-action" disabled={busy} onClick={share}>WhatsApp पर शेयर करें</button>
    {status&&<p className="public-status" role="status">{status}</p>}
    <p className="privacy-hint">मूल पोस्टर का डिजाइन और फोटो बदले बिना रखा गया है।</p>
   </aside>
   <section className="preview-wrap"><style>{customCss}</style><div className="preview-label"><b>कार्ड का Preview</b><span>Original Poster · 2:3</span></div><div className="preview-scroll"><div ref={cardRef}><MemorialCard c={c} recipient={recipient} recipientTitle={recipientTitle}/></div></div></section>
  </section>
 </main>
}
function cTitle(c:CardContent){return c.title+" – "+c.deceasedName;}
