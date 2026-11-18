import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLinkedInApplicationsCsv,mergeLinkedInApplications} from '../linkedin-import.mjs';

const csv='Job Title,Company Name,Application Date,Job URL\r\n"Senior Analyst, Trust & Safety",Snap Inc.,2026-11-10,https://www.linkedin.com/jobs/view/123\r\nInvestigator,ALO,11/13/2026,https://www.linkedin.com/jobs/view/456\r\n';
const empty=()=>({applications:[],reviews:[],dismissed:[]});

test('reads LinkedIn Job Applications CSV fields, quoted commas, dates, and safe posting links',()=>{
 const rows=parseLinkedInApplicationsCsv(csv);
 assert.deepEqual(rows.map(({company,title,appliedAt,url})=>({company,title,appliedAt,url})),[
  {company:'Snap Inc.',title:'Senior Analyst, Trust & Safety',appliedAt:'2026-11-10',url:'https://www.linkedin.com/jobs/view/123'},
  {company:'ALO',title:'Investigator',appliedAt:'2026-11-13',url:'https://www.linkedin.com/jobs/view/456'}
 ]);
});

test('LinkedIn import adds jobs and fills a matching incomplete LinkedIn email review',()=>{
 const current=empty();current.reviews=[{id:'gmail-1234567890abcdef',company:'ALO',title:'',status:'Applied',kind:'confirmation',source:'Gmail',contact:'LinkedIn <jobs-noreply@linkedin.com>',summary:'Your application was sent to ALO',evidence:[{messageId:'1234567890abcdef',threadId:'t1'}]}];
 const rows=parseLinkedInApplicationsCsv(csv);const first=mergeLinkedInApplications(current,rows);const second=mergeLinkedInApplications(first.data,rows);
 assert.equal(first.added,2);assert.equal(first.filledReviews,1);assert.equal(first.data.reviews.length,0);
 assert.equal(first.data.applications.find(app=>app.company==='ALO').evidence[0].messageId,'1234567890abcdef');
 assert.equal(second.added,0);assert.equal(second.updated,0);assert.equal(second.data.applications.length,2);
});

test('LinkedIn import fills missing dates and job links without changing existing status',()=>{
 const current=empty();current.applications=[{id:'existing',company:'Snap Inc.',title:'Senior Analyst, Trust & Safety',status:'Interviewing',appliedAt:null,url:'',evidence:[]}];
 const result=mergeLinkedInApplications(current,parseLinkedInApplicationsCsv(csv));
 assert.equal(result.added,1);assert.equal(result.updated,1);assert.equal(result.data.applications[0].status,'Interviewing');
 assert.equal(result.data.applications[0].appliedAt,'2026-11-10');assert.equal(result.data.applications[0].url,'https://www.linkedin.com/jobs/view/123');
});

test('normalizes company aliases such as Snap and Snap Inc. to avoid duplicate applications',()=>{
 const current=empty();current.applications=[{id:'existing-snap',company:'Snap',title:'Senior Analyst, Trust & Safety',status:'Applied',appliedAt:'2026-11-10',url:'',evidence:[]}];
 const result=mergeLinkedInApplications(current,parseLinkedInApplicationsCsv(csv));
 assert.equal(result.data.applications.filter(app=>companyIsSnap(app.company)).length,1);
 assert.equal(result.data.applications.find(app=>app.id==='existing-snap').url,'https://www.linkedin.com/jobs/view/123');
});
function companyIsSnap(name){return /^(?:Snap|Snap Inc\.)$/.test(name);}

test('rejects CSVs without identifiable company and title columns',()=>{
 assert.throws(()=>parseLinkedInApplicationsCsv('Company,Date\nExample,2026-01-01'),/company and job title columns/);
});
