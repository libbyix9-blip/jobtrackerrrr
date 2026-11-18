const clean=value=>String(value??'').replace(/^\uFEFF/,'').trim();
const norm=value=>clean(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const companyKey=value=>{const name=norm(value);if(/^(?:snap|snap inc|snapchat)$/.test(name))return 'snap';if(/^(?:alo|alo yoga)$/.test(name))return 'alo';if(/^(?:pwc|pricewaterhousecoopers)$/.test(name))return 'pricewaterhousecoopers';return name;};

function csvRows(text){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
  const char=text[i],next=text[i+1];
  if(quoted){if(char==='"'&&next==='"'){cell+='"';i++;}else if(char==='"')quoted=false;else cell+=char;}
  else if(char==='"')quoted=true;
  else if(char===','){row.push(cell);cell='';}
  else if(char==='\n'||char==='\r'){if(char==='\r'&&next==='\n')i++;row.push(cell);if(row.some(value=>clean(value)))rows.push(row);row=[];cell='';}
  else cell+=char;
 }
 row.push(cell);if(row.some(value=>clean(value)))rows.push(row);
 return rows;
}

function dateValue(value){
 const input=clean(value);if(!input)return null;
 const iso=input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);let date;
 if(iso)date=new Date(Date.UTC(Number(iso[1]),Number(iso[2])-1,Number(iso[3])));
 else {const us=input.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);date=us?new Date(Date.UTC(Number(us[3]),Number(us[1])-1,Number(us[2]))):new Date(input);}
 if(Number.isNaN(date.getTime()))return null;
 const result=date.toISOString().slice(0,10);return result<=new Date().toISOString().slice(0,10)?result:null;
}

function safeUrl(value){try{const url=new URL(clean(value));return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}}

export function parseLinkedInApplicationsCsv(text){
 const [header,...rows]=csvRows(String(text??''));
 if(!header?.length)throw new Error('The CSV is empty. Choose LinkedIn’s Job Applications CSV.');
 const columns=header.map(norm),find=aliases=>columns.findIndex(name=>aliases.includes(name));
 const companyIndex=find(['company name','company','employer']),titleIndex=find(['job title','title','role','position']),dateIndex=find(['application date','date applied','applied date','date']),urlIndex=find(['job url','job link','linkedin job url','job posting url','url']);
 if(companyIndex<0||titleIndex<0)throw new Error('I couldn’t find the company and job title columns. Choose LinkedIn’s Job Applications CSV.');
 const applications=[];
 for(const row of rows){
  const company=clean(row[companyIndex]),title=clean(row[titleIndex]);if(!company||!title)continue;
  applications.push({company,title,appliedAt:dateIndex<0?null:dateValue(row[dateIndex]),url:urlIndex<0?'':safeUrl(row[urlIndex]),status:'Applied',source:'LinkedIn'});
 }
 if(!applications.length)throw new Error('No LinkedIn applications with a company and job title were found in that CSV.');
 return applications;
}

function stableId(application){let hash=2166136261;for(const char of norm([application.company,application.title,application.appliedAt,application.url].join('|'))){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return `linkedin-${(hash>>>0).toString(36)}`;}
function isLinkedInConfirmation(review){return review.source==='Gmail'&&review.kind==='confirmation'&&(/linkedin\.com/i.test(review.contact??'')||/application was sent to/i.test(review.summary??''));}

export function mergeLinkedInApplications(current,applications){
 const next=structuredClone(current);next.applications??=[];next.reviews??=[];next.dismissed??=[];
 let added=0,updated=0,filledReviews=0;const seen=new Set();
 for(const item of applications){
  const key=[norm(item.company),norm(item.title),item.appliedAt??'',safeUrl(item.url)].join('|');if(seen.has(key))continue;seen.add(key);
  const companyRows=applications.filter(row=>companyKey(row.company)===companyKey(item.company));
  const reviewMatches=next.reviews.filter(review=>isLinkedInConfirmation(review)&&companyKey(review.company)===companyKey(item.company)&&(!review.title||norm(review.title)===norm(item.title))&&(!review.applicationId||next.applications.some(app=>app.id===review.applicationId)));
  const companyMatches=next.applications.filter(app=>companyKey(app.company)===companyKey(item.company)&&(!app.title||norm(app.title)===norm(item.title)));
  const sameUrl=item.url?next.applications.filter(app=>safeUrl(app.url)===item.url):[];
  let existing=sameUrl.length===1?sameUrl[0]:null;
  if(!existing){const exact=next.applications.filter(app=>companyKey(app.company)===companyKey(item.company)&&norm(app.title)===norm(item.title));if(exact.length===1)existing=exact[0];}
  if(!existing&&companyRows.length===1&&companyMatches.length===1)existing=companyMatches[0];
  const matches=reviewMatches.filter(review=>review.title||companyRows.length===1);
  if(existing){
   const before=JSON.stringify([existing.appliedAt,existing.url,existing.evidence]);
   existing.appliedAt??=item.appliedAt;existing.url||=item.url;existing.evidence=[...new Map([...(existing.evidence??[]),...matches.flatMap(review=>review.evidence??[])].map(evidence=>[evidence.messageId,evidence])).values()];
   if(JSON.stringify([existing.appliedAt,existing.url,existing.evidence])!==before)updated++;
  }else{
   next.applications.push({id:stableId(item),...item,applicationUrl:'',location:'',contact:'',summary:'Imported from your LinkedIn Job Applications export.',notes:'',lastResponseAt:null,updatedAt:new Date().toISOString(),evidence:matches.flatMap(review=>review.evidence??[])});added++;
  }
  if(matches.length){const ids=new Set(matches.map(review=>review.id));next.reviews=next.reviews.filter(review=>!ids.has(review.id));for(const id of ids)if(!next.dismissed.includes(id))next.dismissed.push(id);filledReviews+=ids.size;}
 }
 return {data:next,added,updated,filledReviews};
}
