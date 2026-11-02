"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { defaultContent } from "@/lib/default-content";
import "./public.css";

import { MemorialCard } from "@/components/MemorialCard";
import type { CardContent } from "@/lib/card-types";
import { renderToCanvas, DESIGNS, type Design } from "@/lib/render-card";

type Fmt = "pdf" | "jpg";
const EXPORT_SCALE = 1.5; // 1536 x 2304 px: sharp text, small file

export default function Home() {
 const [content,setContent]=useState<CardContent>(defaultContent as CardContent);
 const [customCss,setCustomCss]=useState("");
 const [recipient,setRecipient]=useState("");
 const [recipientTitle,setRecipientTitle]=useState<"श्रीमान्"|"श्रीमती">("श्रीमान्");
 const [format,setFormat]=useState<Fmt>("pdf");
 const [design,setDesign]=useState<Design>(1);
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 // file prepared in the background, so Download / Share react instantly
 const prepared=useRef<{key:string;file:File}|null>(null);
 const pending=useRef<{key:string;p:Promise<File>}|null>(null);

 useEffect(()=>{ (async()=>{
   if(!supabase) return;
   const {data}=await supabase.from("memorial_card").select("content,custom_css").eq("id",1).maybeSingle();
   if(data?.content) setContent({...defaultContent,...data.content} as CardContent);
   if(data?.custom_css) setCustomCss(data.custom_css);
 })(); },[]);

 const keyOf=useCallback(()=>JSON.stringify([content,recipient.trim(),recipientTitle,format,design]),[content,recipient,recipientTitle,format,design]);

 const build=useCallback(async(key:string):Promise<File>=>{
  if(prepared.current?.key===key) return prepared.current.file;
  if(pending.current?.key===key) return pending.current.p;
  const p=(async()=>{
   const cv=document.createElement("canvas");
   await renderToCanvas(cv,{c:content,recipient,recipientTitle,design},EXPORT_SCALE);
   const jpg:string=cv.toDataURL("image/jpeg",0.9);
   let file:File;
   if(format==="jpg"){
    const blob=await new Promise<Blob>((res,rej)=>cv.toBlob(b=>b?res(b):rej(new Error("toBlob failed")),"image/jpeg",0.9));
    file=new File([blob],`shradhanjali-card-${design}.jpg`,{type:"image/jpeg"});
   } else {
    const {jsPDF}=await import("jspdf"); // loaded only when needed
    const pdf=new jsPDF({orientation:design===2?"landscape":"portrait",unit:"mm",format:design===2?[315,210]:[210,315],compress:true});
    pdf.addImage(jpg,"JPEG",0,0,design===2?315:210,design===2?210:315,undefined,"FAST");
    file=new File([pdf.output("blob")],`shradhanjali-card-${design}.pdf`,{type:"application/pdf"});
   }
   prepared.current={key,file};
   return file;
  })();
  pending.current={key,p};
  try{return await p;}finally{if(pending.current?.p===p)pending.current=null;}
 },[content,recipient,recipientTitle,format,design]);

 // prepare quietly ~0.6s after the visitor stops typing
 useEffect(()=>{
  const key=keyOf(); setReady(prepared.current?.key===key);
  if(prepared.current?.key===key) return;
  const t=setTimeout(()=>{build(key).then(()=>{if(keyOf()===key)setReady(true);}).catch(()=>{});},600);
  return()=>clearTimeout(t);
 },[keyOf,build]);

 function save(f:File){const u=URL.createObjectURL(f);const a=document.createElement("a");a.href=u;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);}

 async function download() {
  try{
   setBusy(true);const key=keyOf();
   if(prepared.current?.key!==key) setStatus("फाइल तैयार हो रही है...");
   const f=await build(key);save(f);setStatus("फाइल डाउनलोड हो गई।");
  }catch{setStatus("फाइल नहीं बन सकी। दोबारा प्रयास करें।");}finally{setBusy(false);}
 }
 async function share() {
  const nav=navigator as Navigator&{canShare?:(d:ShareData)=>boolean};
  const text=`${recipient.trim()?recipientTitle+" "+recipient.trim()+" जी, ":""}सादर आमंत्रण। कृपया शोक-संदेश एवं श्राद्ध-कार्यक्रम में उपस्थित होकर हमें कृतार्थ करें।`;
  try{
   setBusy(true);const key=keyOf();
   // prepared file => share() is called immediately, while the tap is still "fresh" (needed by iOS / Chrome)
   const f=prepared.current?.key===key?prepared.current.file:await build(key);
   if(navigator.share&&nav.canShare?.({files:[f]})){
    await navigator.share({files:[f],title:cTitle(content),text});setStatus("Share menu खुल गया है। WhatsApp चुनें।");
   } else {
    save(f);window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
    setStatus("फाइल डाउनलोड हुई है। WhatsApp में Attach करके भेजें।");
   }
  }catch(e){
   if(e instanceof Error&&e.name==="AbortError")setStatus("Sharing रद्द की गई।");
   else if(e instanceof Error&&e.name==="NotAllowedError"){setStatus("फाइल तैयार है। एक बार फिर 'WhatsApp पर शेयर करें' दबाएँ।");}
   else setStatus("Share नहीं हो सका। फाइल डाउनलोड करके WhatsApp में भेजें।");
  }finally{setBusy(false);}
 }
 const c=content;
 return <main className="public-shell">
  <header className="public-top"><div><span>श्रद्धांजलि कार्ड मेकर</span><h1>डिजिटल शोक-संदेश</h1><p>नाम लिखें, कार्ड देखें और PDF या इमेज WhatsApp पर साझा करें।</p></div><a href="/admin" className="admin-link">Admin Login ↗</a></header>
  <section className="public-grid">
   <aside className="public-controls">
    <h2>कार्ड व्यक्तिगत करें</h2>
    <label>प्राप्तकर्ता का संबोधन</label>
    <div className="recipient-title-options" role="group" aria-label="प्राप्तकर्ता का संबोधन चुनें">
      <label className="recipient-check"><input type="checkbox" checked={recipientTitle==="श्रीमान्"} onChange={()=>setRecipientTitle("श्रीमान्")}/> <span>श्रीमान्</span></label>
      <label className="recipient-check"><input type="checkbox" checked={recipientTitle==="श्रीमती"} onChange={()=>setRecipientTitle("श्रीमती")}/> <span>श्रीमती</span></label>
    </div>
    <label htmlFor="recipient-name">नाम लिखें</label><input id="recipient-name" value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="यहाँ नाम लिखें" maxLength={32}/>
    <small>चुना हुआ संबोधन और नाम कार्ड में डॉटेड लाइन पर दिखाई देगा।</small>
    <small className="template-note">मूल डिजाइन, सजावट, चित्र और हिंदी फॉन्ट आपके दिए हुए पोस्टर से ज्यों-के-त्यों लिए गए हैं।</small>
    <label>कार्ड का डिज़ाइन चुनें</label><div className="format-switch design-switch">
      {([1,2] as Design[]).map(d=><button key={d} className={design===d?"selected":""} onClick={()=>setDesign(d)}>{DESIGNS[d].name}</button>)}
    </div>
    <label>फाइल का प्रकार</label><div className="format-switch">
      <button className={format==="pdf"?"selected":""} onClick={()=>setFormat("pdf")}>PDF</button>
      <button className={format==="jpg"?"selected":""} onClick={()=>setFormat("jpg")}>Image (JPG)</button>
    </div>
    <button className="download-action" disabled={busy} onClick={download}>↓ &nbsp; डाउनलोड करें</button>
    <button className="share-action" disabled={busy} onClick={share}>WhatsApp पर शेयर करें</button>
    {status&&<p className="public-status" role="status">{status}</p>}
    <p className="privacy-hint">मूल पोस्टर का डिजाइन और फोटो बदले बिना रखा गया है।</p>
   </aside>
   <section className="preview-wrap"><style>{customCss}</style><div className="preview-label"><b>कार्ड का Preview</b><span>{ready?"✓ फाइल तैयार":"फाइल बन रही है…"}</span></div><div className="preview-scroll"><div><MemorialCard c={c} recipient={recipient} recipientTitle={recipientTitle} design={design}/></div></div></section>
  </section>
 </main>
}
function cTitle(c:CardContent){return c.title+" – "+c.deceasedName;}
