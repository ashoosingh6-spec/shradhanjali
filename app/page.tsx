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
 const [photo,setPhoto]=useState("");
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

 function choosePhoto(e:React.ChangeEvent<HTMLInputElement>) {
  const f=e.target.files?.[0]; if(!f)return;
  if(!f.type.startsWith("image/")){setStatus("कृपया image file चुनें।");return;}
  if(f.size>8*1024*1024){setStatus("फोटो 8 MB से छोटी होनी चाहिए।");return;}
  const r=new FileReader();r.onload=()=>setPhoto(String(r.result));r.readAsDataURL(f);
 }
 async function makeFile() {
  if(!cardRef.current) throw new Error("Card not ready");
  const data=await toPng(cardRef.current,{pixelRatio:2,cacheBust:true,backgroundColor:"#fff"});
  if(format==="png") return new File([await (await fetch(data)).blob()],"shradhanjali-card.png",{type:"image/png"});
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  const w=pdf.internal.pageSize.getWidth(),h=pdf.internal.pageSize.getHeight(),m=5;
  const scale=Math.min((w-2*m)/794,(h-2*m)/1123),dw=794*scale,dh=1123*scale;
  pdf.addImage(data,"PNG",(w-dw)/2,(h-dh)/2,dw,dh);
  return new File([pdf.output("blob")],"shradhanjali-card.pdf",{type:"application/pdf"});
 }
 async function download() {
  try{setBusy(true);setStatus("फाइल तैयार हो रही है...");const f=await makeFile();const u=URL.createObjectURL(f);const a=document.createElement("a");a.href=u;a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000);setStatus("फाइल डाउनलोड हो गई।");}
  catch{setStatus("फाइल नहीं बन सकी। दोबारा प्रयास करें।");}finally{setBusy(false);}
 }
 async function share() {
  try{setBusy(true);setStatus("WhatsApp के लिए फाइल तैयार हो रही है...");const f=await makeFile();const nav=navigator as Navigator&{canShare?:(d:ShareData)=>boolean};
   const text=`${recipient.trim()?recipient.trim()+" जी, ":""}सादर आमंत्रण। कृपया शोक-संदेश एवं श्राद्ध-कार्यक्रम में उपस्थित होकर हमें कृतार्थ करें।`;
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
    <label>प्राप्तकर्ता का नाम</label><input value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder="श्री अशोक कुमार जी" maxLength={90}/>
    <small>यह नाम कार्ड में श्रीमान / श्रीमती की जगह आएगा।</small>
    <label>दिवंगत व्यक्ति की फोटो</label><input type="file" accept="image/*" onChange={choosePhoto}/>
    <small>वैकल्पिक · JPG / PNG / WEBP · अधिकतम 8 MB</small>
    <label>फाइल का प्रकार</label><div className="format-switch">
      <button className={format==="pdf"?"selected":""} onClick={()=>setFormat("pdf")}>PDF</button>
      <button className={format==="png"?"selected":""} onClick={()=>setFormat("png")}>PNG Image</button>
    </div>
    <button className="download-action" disabled={busy} onClick={download}>↓ &nbsp; डाउनलोड करें</button>
    <button className="share-action" disabled={busy} onClick={share}>WhatsApp पर शेयर करें</button>
    {status&&<p className="public-status" role="status">{status}</p>}
    <p className="privacy-hint">आपकी चुनी हुई फोटो इसी डिवाइस पर प्रोसेस होती है; सर्वर पर अपलोड नहीं होती।</p>
   </aside>
   <section className="preview-wrap"><style>{customCss}</style><div className="preview-label"><b>कार्ड का Preview</b><span>A4 Portrait</span></div><div className="preview-scroll"><div ref={cardRef}><MemorialCard c={c} recipient={recipient} photo={photo||c.portraitUrl}/></div></div></section>
  </section>
 </main>
}
function cTitle(c:CardContent){return c.title+" – "+c.deceasedName;}
