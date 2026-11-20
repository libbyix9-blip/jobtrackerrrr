// Conservative, local-only classification. Email text is data, never instructions.
const norm=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function body(part){if(!part)return '';if(part.mimeType==='text/plain'&&part.body?.data){try{return new TextDecoder().decode(Uint8Array.from(atob(part.body.data.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0)));}catch{return '';}}if(part.mimeType==='text/html'&&part.body?.data){try{return new TextDecoder().decode(Uint8Array.from(atob(part.body.data.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&');}catch{return '';}}const parts=part.parts??[];const plain=parts.filter(p=>p.mimeType==='text/plain');return (plain.length?plain:parts).map(body).join('\n');}
function messageLinks(part){
 const candidates=[];
 const visit=p=>{if(!p)return;const data=p.body?.data;if(data){try{const raw=new TextDecoder().decode(Uint8Array.from(atob(data.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0)));if(p.mimeType==='text/html')for(const m of raw.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))candidates.push({url:m[1].replaceAll('&amp;','&'),label:m[2].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()});if(p.mimeType==='text/html')for(const m of raw.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi))candidates.push({url:m[1].replaceAll('&amp;','&'),label:''});for(const m of raw.matchAll(/https?:\/\/[^\s<>"')]+/gi))candidates.push({url:m[0].replace(/[.,;!?]+$/,''),label:''});}catch{}}
  for(const child of p.parts??[])visit(child);};
 visit(part);
 return candidates;
}
function usableJobUrl(candidate){try{const u=new URL(candidate);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null;const host=u.hostname.toLowerCase(),path=u.pathname.toLowerCase();if(/(^|\.)(google|bing|facebook)\.com$/.test(host))return null;if(/unsubscribe|tracking|click\./i.test(host+path))return null;return {u,host,path};}catch{return null;}}
function jobPostingUrl(part){
 const candidates=messageLinks(part);
 for(const candidate of candidates){const parsed=usableJobUrl(candidate.url);if(parsed&&/jobs?|careers?|greenhouse|lever\.co|ashbyhq|workdayjobs|myworkdayjobs|smartrecruiters|icims|workable|jobvite|taleo|linkedin\.com\/jobs/i.test(parsed.host+parsed.path))return parsed.u.href;}
 return '';
}
function applicationPageUrl(part){
 for(const candidate of messageLinks(part)){const parsed=usableJobUrl(candidate.url);if(!parsed)continue;const context=(candidate.label+' '+parsed.host+parsed.path+' '+parsed.u.search).toLowerCase();if(/(?:unsubscribe|email-preferences|tracking|click\.)/i.test(context))continue;const direct=/\/(?:apply|application|my-applications?|candidate|candidate-portal|portal)(?:\/|$)/i.test(parsed.path)||/[?&](?:action|page|view)=(?:apply|application|candidate)/i.test(parsed.u.search);const label=/\b(?:view|manage|check|track|continue|complete|submit|open|review)(?:\s+your)?\s+(?:job\s+)?application\b|\bcandidate portal\b|\bapply now\b/i.test(candidate.label);if((direct||label)&&/jobs?|careers?|greenhouse|lever\.co|ashbyhq|workday|smartrecruiters|icims|workable|jobvite|taleo|linkedin\.com\/jobs/i.test(parsed.host+parsed.path))return parsed.u.href;}
 return '';
}
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
 else if(/(?:thank you|thanks) for (?:applying|submitting your application|your application)|submit(?:ting)? an? application|application (?:was )?(?:received|submitted|sent|confirmation)|received your (?:job )?application|(?:confirming|progress update|status update).{0,60}application|application.{0,80}(?:submitted|received|progress update|status update)|(?:you(?:'ve| have) applied|application was sent to)/i.test(signal)){status='Applied';kind='confirmation';}
 else return null;
 const pair=text.match(/(?:application for|applying for|interest in|applying to) (?:the )?(.{3,150}?) (?:role |position |job )?at ([^\n.!]{2,80})/i);
 const linkedinSent=text.match(/\byour application was sent to\s+([^\r\n.!?]{2,100})/i);
 const titleOnly=text.match(/\bposition of\s+(.{3,150}?)(?:\s*\(?(?:ID|#)\s*:|\s*,\s*\d{5,}|[.!?\n])/i)
  ??text.match(/(?:application for|applying for|applying to|applied to|interest in) (?:the )?([^\n.!?]{3,150}?)\s+(?:role|position|job)\b/i)
  ??text.match(/\byou(?:'ve| have) applied to\s+([^.!?\n]{3,150})/i)
  ??text.match(/\bapplication for\s+([^.!?\n]{3,150}?)(?:\s+(?:was|is)\s+(?:submitted|received)|[.!?\n])/i)
  ??text.match(/\bshown in the\s+([^.!?\n]{3,150}?)\s+position\b/i)
  ??text.match(/\brole below\s*:?\s*([^\n.!?]{3,150})/i);
 const companyFromText=pair?.[2]?.trim()??'';
 // Some ATS templates name the role but omit the employer from the sentence.
 // Use only explicit employer names, including the sender display name/address.
 const evidenceText=text+' '+from;
 const brands=[['Snap',/\b(?:snapchat|snap inc\.?|snap hr)\b/i],['ALO',/\balo(?: yoga)?\b/i],['Anthropic',/\banthropic\b/i],['PwC',/\b(?:pwc|pricewaterhousecoopers)\b/i],['Control Risks',/\bcontrol risks\b/i],['OpenAI',/\bopenai\b/i],['ModSquad',/\bmodsquad\b/i],['CAA',/\bCAA\b|creative artists agency/i],['Kroll',/\bkroll\b/i],['K2 Integrity',/\bk2 integrity\b/i],['Deloitte',/\bdeloitte\b/i],['Amazon',/\bamazon\b/i]];
 const company=companyFromText||linkedinSent?.[1]?.trim().replace(/[\s,]+$/,'')||brands.find(([,pattern])=>pattern.test(evidenceText))?.[0]||'';
 const linkedinLines=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 const companyLine=linkedinSent?linkedinLines.findIndex(line=>norm(line)===norm(company)):-1;
 const linkedinTitle=companyLine>0?linkedinLines.slice(0,companyLine).reverse().find(line=>!/^your application was sent to\b/i.test(line)&&!/^libby,?\s+your application/i.test(line)&&!/^https?:\/\//i.test(line)):'';
 const title=(titleOnly?.[1]??pair?.[1]??linkedinTitle??'').replace(/\s+(?:role|position|job)$/i,'').replace(/\s+/g,' ').trim();
 const updatedAt=new Date(Number(message.internalDate)).toISOString();
 return {id:'gmail-'+message.id,company,title,status,kind,summary:subject.slice(0,2000),contact:from.slice(0,300),url:jobPostingUrl(message.payload),applicationUrl:applicationPageUrl(message.payload),updatedAt,appliedAt:kind==='confirmation'?updatedAt.slice(0,10):null,source:'Gmail',evidence:[{messageId:message.id,threadId:message.threadId,date:updatedAt}],reason:kind==='outreach'?'Incoming recruiting conversation. Confirm the employer and role; an application date is not assumed.':'Confirm the employer, role and whether this belongs to an existing application.'};
}
export function integrateMessages(current,messages){
 const next=structuredClone(current);next.dismissed??=[];let added=0;
 for(const message of [...messages].sort((a,b)=>Number(a.internalDate)-Number(b.internalDate))){
  const event=parseMessage(message);if(!event||next.dismissed.includes(event.id))continue;
  const existingReview=next.reviews.find(a=>(a.evidence??[]).some(e=>e.messageId===message.id));
  if(existingReview){
   // Earlier versions left LinkedIn receipts in review because they did not
   // extract the employer/title. Promote only when this same message now has
   // both fields and a definite application confirmation.
   if(event.kind==='confirmation'&&event.company&&event.title&&existingReview.source==='Gmail'&&!existingReview.applicationId){
    next.reviews=next.reviews.filter(a=>a!==existingReview);
    next.applications.push({...event,evidence:[...new Map([...(existingReview.evidence??[]),...event.evidence].map(item=>[item.messageId,item])).values()]});
    added++;
   }
   continue;
  }
  const all=[...next.applications,...next.reviews];
  if(all.some(a=>(a.evidence??[]).some(e=>e.messageId===message.id)))continue;
  const threads=next.applications.filter(a=>(a.evidence??[]).some(e=>e.threadId&&e.threadId===message.threadId));
  const matches=next.applications.filter(a=>event.company&&event.title&&norm(a.company)===norm(event.company)&&norm(a.title)===norm(event.title));
  const companyMatches=event.company&&!event.title&&event.kind==='confirmation'?next.applications.filter(a=>norm(a.company)===norm(event.company)):[];
  const compatible=threads.filter(a=>!event.title||norm(a.title)===norm(event.title));
  const candidates=compatible.length===1?compatible:matches.length?matches:companyMatches.length===1?companyMatches:[];
  const old=candidates.length===1?candidates[0]:null;
  if(old){
   if(old.manualOverride&&event.status!==old.status&&event.updatedAt>old.updatedAt){next.reviews.push({...event,applicationId:old.id,company:old.company,title:old.title,reason:'This email suggests a different status from your manual edit. Confirm before changing it.'});}
   else {old.evidence=[...(old.evidence??[]),...event.evidence];old.url||=event.url;old.applicationUrl||=event.applicationUrl;if(event.updatedAt>old.updatedAt&&!old.manualOverride)Object.assign(old,{status:event.kind==='outreach'&&['Interviewing','Assessment','Offer','Rejected','Withdrawn'].includes(old.status)?old.status:event.status,summary:event.summary,updatedAt:event.updatedAt,lastResponseAt:event.updatedAt.slice(0,10)});}
  }else if(event.company&&event.title&&['confirmation','decision','interview','assessment','offer'].includes(event.kind)){next.applications.push(event);}
  else next.reviews.push(event);
  added++;
 }
 return {data:next,added};
}
