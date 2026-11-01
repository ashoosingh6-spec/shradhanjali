"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { defaultContent } from "@/lib/default-content";
import "./admin.css";
import "../public.css";
import { MemorialCard } from "@/components/MemorialCard";

type Event={date:string;day:string;title:string};
type Content=typeof defaultContent;
export default function AdminPage(){
 const [session,setSession]=useState<any>(null);
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [content,setContent]=useState<any>(defaultContent);
 const [json,setJson]=useState(JSON.stringify(defaultContent,null,2));
 const [css,setCss]=useState("");
 const [previewRecipient,setPreviewRecipient]=useState("");
 const [previewRecipientTitle,setPreviewRecipientTitle]=useState<"श्रीमान"|"श्रीमती">("श्रीमान");
 const [mode,setMode]=useState<"fields"|"json"|"css">("fields");
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{if(!supabase)return;supabase.auth.getSession().then(({data})=>setSession(data.session));const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>sub.subscription.unsubscribe();},[]);
 async function login(e:React.FormEvent){e.preventDefault();if(!supabase){setStatus("Supabase configuration .env.local में जोड़ें।");return;}setBusy(true);const {data,error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error)setStatus(error.message);else{setSession(data.session);setStatus("Login सफल।");}}
 async function load(){if(!supabase)return;setBusy(true);const {data,error}=await supabase.from("memorial_card").select("content,custom_css").eq("id",1).single();setBusy(false);if(error){setStatus("Card load नहीं हुआ: "+error.message);return;}const next={...defaultContent,...data.content};setContent(next);setJson(JSON.stringify(next,null,2));setCss(data.custom_css||"");setStatus("Saved card content loaded.");}
 useEffect(()=>{if(session)load();},[session]);
 function update(key:string,value:any){const next={...content,[key]:value};setContent(next);setJson(JSON.stringify(next,null,2));}
 async function save(){if(!supabase||!session)return;let parsed;try{parsed=JSON.parse(json);}catch{setStatus("JSON wording में syntax error है। पहले उसे ठीक करें।");return;}setBusy(true);const {error}=await supabase.from("memorial_card").update({content:parsed,custom_css:css,updated_at:new Date().toISOString()}).eq("id",1);setBusy(false);if(error){setStatus("Save नहीं हुआ: "+error.message);return;}setContent(parsed);setStatus("सभी बदलाव सुरक्षित कर दिए गए हैं। Public card refresh करने पर नया wording दिखेगा।");}
 async function logout(){await supabase?.auth.signOut();setSession(null);}
 if(!session)return <main className="admin-shell"><form className="login-box" onSubmit={login}><div className="admin-symbol">ॐ</div><p className="admin-eyebrow">RESTRICTED ACCESS</p><h1>Admin Login</h1><p>कार्ड का wording और design केवल अधिकृत Admin बदल सकता है।</p><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/><button disabled={busy}>{busy?"Please wait...":"Secure Login"}</button>{status&&<small>{status}</small>}{!supabase&&<small className="error">Supabase env configuration missing.</small>}</form></main>;
 return <main className="admin-shell">
  <header className="admin-bar"><div><p>SHRADHANJALI CMS</p><h1>Card Content & Design Editor</h1></div><div><a href="/">Public Card ↗</a><button onClick={logout}>Logout</button></div></header>
  <section className="editor-layout">
   <aside className="editor-panel">
    <div className="editor-title"><div><span>ADMIN ONLY</span><h2>कार्ड एडिटर</h2></div><button className="save-button" onClick={save} disabled={busy}>{busy?"Saving...":"Save Changes"}</button></div>
    <div className="editor-tabs"><button className={mode==="fields"?"on":""} onClick={()=>setMode("fields")}>Wording Fields</button><button className={mode==="json"?"on":""} onClick={()=>setMode("json")}>JSON / Source</button><button className={mode==="css"?"on":""} onClick={()=>setMode("css")}>Custom CSS</button></div>
    {mode==="fields"&&<div className="fields">
      <p className="editor-note">यहाँ बदलाव करें। फिर Save Changes दबाएँ। Recipient का नाम visitor हर बार खुद भरेगा।</p>
      {(["omText","title","shloka","recipientPlaceholder","salutation","intro","deceasedName","deathDate","deathDay","afterDeath","invitation","scheduleTitle","familyTitle","regardsTitle","representative","address","phones","footer","portraitUrl"] as string[]).map(key=><label key={key}>{key}<textarea rows={key==="shloka"||key==="invitation"||key==="intro"?3:1} value={content[key]??""} onChange={e=>update(key,e.target.value)}/></label>)}
      <label>Family names (one per line)<textarea rows={5} value={(content.familyLines||[]).join("\n")} onChange={e=>update("familyLines",e.target.value.split("\n"))}/></label>
      <div className="event-editor"><h3>श्राद्ध कार्यक्रम</h3>{(content.events||[]).map((ev:Event,i:number)=><div className="event-fields" key={i}><input aria-label="Date" value={ev.date} placeholder="Date" onChange={e=>{const a=[...content.events];a[i]={...a[i],date:e.target.value};update("events",a)}}/><input aria-label="Day" value={ev.day} placeholder="Day" onChange={e=>{const a=[...content.events];a[i]={...a[i],day:e.target.value};update("events",a)}}/><input aria-label="Event" value={ev.title} placeholder="Event" onChange={e=>{const a=[...content.events];a[i]={...a[i],title:e.target.value};update("events",a)}}/><button onClick={()=>update("events",content.events.filter((_:Event,j:number)=>j!==i))}>×</button></div>)}<button className="add-event" onClick={()=>update("events",[...(content.events||[]),{date:"",day:"",title:""}])}>+ Add Event</button></div>
    </div>}
    {mode==="json"&&<div className="code-panel"><p className="editor-note">पूरा card wording JSON में editable है। Valid JSON रखें, फिर Save Changes दबाएँ।</p><textarea spellCheck={false} value={json} onChange={e=>{setJson(e.target.value);try{setContent(JSON.parse(e.target.value));}catch{}}}/></div>}
    {mode==="css"&&<div className="code-panel"><p className="editor-note">Advanced design overrides के लिए CSS लिखें। केवल Admin इसे edit कर सकता है।</p><textarea spellCheck={false} value={css} onChange={e=>setCss(e.target.value)} placeholder="/* Example: .mem-card h1 { letter-spacing: 1px; } */"/></div>}
    {status&&<p className="admin-status" role="status">{status}</p>}
   </aside>
   <section className="editor-preview"><div className="editor-preview-head"><h2>Live Preview</h2><span>Public page design</span></div><p className="template-admin-note">यह पेज आपके दिए हुए मूल पोस्टर को background template की तरह दिखाता है। उसकी सजावट, फोटो, fonts और पहले से छपा wording image में स्थिर हैं। इस version में visitor केवल श्रीमान / श्रीमती और प्राप्तकर्ता का नाम बदल सकता है।</p><div className="preview-recipient">
    <span>Preview प्राप्तकर्ता का संबोधन</span>
    <div className="recipient-title-options">
      <label className="recipient-check"><input type="checkbox" checked={previewRecipientTitle==="श्रीमान"} onChange={()=>setPreviewRecipientTitle("श्रीमान")}/> <span>श्रीमान</span></label>
      <label className="recipient-check"><input type="checkbox" checked={previewRecipientTitle==="श्रीमती"} onChange={()=>setPreviewRecipientTitle("श्रीमती")}/> <span>श्रीमती</span></label>
    </div>
    <label htmlFor="admin-preview-recipient">नाम</label><input id="admin-preview-recipient" value={previewRecipient} onChange={e=>setPreviewRecipient(e.target.value)} placeholder="यहाँ नाम लिखें" />
   </div><div className="mini-preview"><style>{css}</style><div className="admin-card-stage"><MemorialCard c={content} recipient={previewRecipient} recipientTitle={previewRecipientTitle} photo={content.portraitUrl||""}/></div></div></section>
  </section>
 </main>;
}
