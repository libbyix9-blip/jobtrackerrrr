// Conservative, local-only classification. Email text is data, never instructions.
const norm=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function body(part){if(!part)return '';if(part.mimeType==='text/plain'&&part.body?.data){try{return new TextDecoder().decode(Uint8Array.from(atob(part.body.data.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0)));}catch{return '';}}if(part.mimeType==='text/html'&&part.body?.data){try{return new TextDecoder().decode(Uint8Array.from(atob(part.body.data.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&');}catch{return '';}}const parts=part.parts??[];const plain=parts.filter(p=>p.mimeType==='text/plain');return (plain.length?plain:parts).map(body).join('\n');}
export function parseMessage(message){
 const headers=Object.fromEntries((message.payload?.headers??[]).map(h=>[h.name.toLowerCase(),h.value]));
 if(message.labelIds?.includes('SENT')||message.labelIds?.includes('DRAFT'))return null;
 const subject=headers.subject??'',from=headers.from??'',text=(subject+'\n'+body(message.payload)).slice(0,100000).split(/\nOn .{1,180}wrote:|\n> /)[0];
 // Skip digests, not individual human outreach, even when a sender offers unsubscribe.
 if(/job alert|jobs? for you|recommended jobs|weekly digest|new jobs matching/i.test(subject)||headers['list-id'])return null;
 const signal=text.replace(/[^\n.!?]*(?:if (?:you|we)|we may|may (?:contact|reach|invite)|should (?:you|we))[^\n.!?]*/gi,'');
 let status,kind;
 if(/(?:not moving forward|not proceeding|unsuccessful|position (?:has been )?filled|decided .{0,40}other candidates|regret to inform)/i.test(signal)){status='Rejected';kind='decision';}
 else if(/(?:pleased to offer|offer of employment|formal offer|offer letter)/i.test(signal)){status='Offer';kind='offer';}
 else if(/(?:invite you .{0,50}interview|schedule .{0,50}interview|interview (?:invitation|availability|confirmation|with)|(?:^|\n)(?:re: )?interview\b|availability .{0,50}interview|next round|(?:phone|video|introductory) (?:screen|interview))/i.test(signal)){status='Interviewing';kind='interview';}
 else if(/(?:complete .{0,40}assessment|assessment invitation|take.home (?:exercise|assignment))/i.test(signal)){status='Assessment';kind='assessment';}
 else if(/(?:reaching out|came across your (?:profile|background)|your (?:profile|background|experience) .{0,60}(?:impressed|fit|interest)|interested in .{0,50}(?:opportunity|role|position)|discuss .{0,50}(?:opportunity|role|position)|recruiting .{0,50}(?:role|position)|(?:availability|schedule|arrange) .{0,40}(?:recruiter|recruiting|introductory) (?:call|chat)|following up .{0,70}(?:interview|application|opportunity)|thank you for your interest|background check|reference check)/i.test(signal)){status='Recruiter Contact';kind='outreach';}
 else if(/(?:thank you for (?:applying|submitting your application)|application (?:received|confirmation)|received your application)/i.test(signal)){status='Applied';kind='confirmation';}
 else return null;
 const pair=text.match(/(?:application for|applying for|interest in) (?:the )?(.{3,150}?) (?:role |position )?at ([^\n.!]{2,80})/i);
 const company=pair?.[2]?.trim()??'',title=pair?.[1]?.replace(/ (?:role|position)$/i,'').trim()??'';
 const updatedAt=new Date(Number(message.internalDate)).toISOString();
 return {id:'gmail-'+message.id,company,title,status,kind,summary:subject.slice(0,2000),contact:from.slice(0,300),updatedAt,appliedAt:kind==='confirmation'?updatedAt.slice(0,10):null,source:'Gmail',evidence:[{messageId:message.id,threadId:message.threadId,date:updatedAt}],reason:kind==='outreach'?'Incoming recruiting conversation. Confirm the employer and role; an application date is not assumed.':'Confirm the employer, role and whether this belongs to an existing application.'};
}
export function integrateMessages(current,messages){
 const next=structuredClone(current);next.dismissed??=[];let added=0;
 for(const message of [...messages].sort((a,b)=>Number(a.internalDate)-Number(b.internalDate))){
  const event=parseMessage(message);if(!event||next.dismissed.includes(event.id))continue;
  const all=[...next.applications,...next.reviews];
  if(all.some(a=>(a.evidence??[]).some(e=>e.messageId===message.id)))continue;
  const threads=next.applications.filter(a=>(a.evidence??[]).some(e=>e.threadId&&e.threadId===message.threadId));
  const matches=next.applications.filter(a=>event.company&&event.title&&norm(a.company)===norm(event.company)&&norm(a.title)===norm(event.title));
  const compatible=threads.filter(a=>!event.title||norm(a.title)===norm(event.title));
  const candidates=compatible.length===1?compatible:matches;
  const old=candidates.length===1?candidates[0]:null;
  if(old){
   if(old.manualOverride&&event.status!==old.status&&event.updatedAt>old.updatedAt){next.reviews.push({...event,applicationId:old.id,company:old.company,title:old.title,reason:'This email suggests a different status from your manual edit. Confirm before changing it.'});}
   else {old.evidence=[...(old.evidence??[]),...event.evidence];if(event.updatedAt>old.updatedAt&&!old.manualOverride)Object.assign(old,{status:event.kind==='outreach'&&['Interviewing','Assessment','Offer','Rejected','Withdrawn'].includes(old.status)?old.status:event.status,summary:event.summary,updatedAt:event.updatedAt,lastResponseAt:event.updatedAt.slice(0,10)});}
  }else if(event.company&&event.title&&event.kind==='confirmation'){next.applications.push(event);}
  else next.reviews.push(event);
  added++;
 }
 return {data:next,added};
}
