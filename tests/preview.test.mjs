import {test} from 'node:test';import assert from 'node:assert/strict';
import {previewAPI,exportPreview} from '../preview.mjs';
const fixture={company:'Example Company',title:'Research Analyst',status:'Applied',appliedAt:'2026-01-01',source:'Manual'};
test('preview applications can be created, edited, exported, deleted without backend calls',async()=>{
 const {id}=await previewAPI('applications','POST',fixture);
 let data=await previewAPI('bootstrap');assert.equal(data.applications.find(a=>a.id===id).company,'Example Company');
 data.applications[0].company='Mutated copy';assert.equal((await previewAPI('bootstrap')).applications[0].company,'Example Company');
 await previewAPI('applications/'+id,'PUT',{...fixture,status:'Interviewing'});assert.match(exportPreview(true),/Interviewing/);
 await previewAPI('applications/'+id,'DELETE');assert.equal((await previewAPI('bootstrap')).applications.length,0);
 await assert.rejects(previewAPI('applications','POST',{...fixture,status:'Made up'}),/status/);
});
test('private services fail explicitly instead of pretending to connect',async()=>{
 for(const path of ['refresh','gmail/connect','documents/upload'])await assert.rejects(previewAPI(path,'POST',{}),/backend is not connected/);
 const {previewAPI:fresh}=await import('../preview.mjs?fresh=1');assert.equal((await fresh('bootstrap')).applications.length,0);
});
