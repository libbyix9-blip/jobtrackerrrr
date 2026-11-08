import {test} from 'node:test';import assert from 'node:assert/strict';
import {createVault,unlockVault,encryptSnapshot,decryptSnapshot,mergeUpdates,checkEnvelope} from '../vault.mjs';
const pass='synthetic-test-passphrase-only';
const created=await createVault(pass);
test('vault roundtrip uses encrypted private key and encrypted records, survives reload',async()=>{
 const data={applications:[{id:'synthetic',company:'Synthetic Secret Company',notes:'test-only private note'}],reviews:[]};
 const envelope={...created.vault,snapshot:await encryptSnapshot(created.vault,data)};
 const serialized=JSON.stringify(envelope);assert.doesNotMatch(serialized,/Synthetic Secret Company|test-only private note|synthetic-test-passphrase/);assert.equal(created.privateKey.extractable,false);
 const restored=JSON.parse(serialized),key=await unlockVault(restored,pass);assert.deepEqual(await decryptSnapshot(restored,key),data);
 await assert.rejects(unlockVault(restored,'wrong passphrase'),/unlock/);
 const changed=structuredClone(restored);changed.id='different-vault';await assert.rejects(decryptSnapshot(changed,key));
 const corrupt=structuredClone(restored);corrupt.snapshot.ciphertext='A'+corrupt.snapshot.ciphertext.slice(1);await assert.rejects(decryptSnapshot(corrupt,key));
});
test('public sync kit encrypts a large inbox without any passphrase or private key',async()=>{
 const kit=JSON.parse(JSON.stringify(created.vault));const data={applications:Array.from({length:150},(_,i)=>({id:String(i),notes:'test'.repeat(500)})),reviews:[]};
 const snapshot=await encryptSnapshot(kit,data);assert.deepEqual(await decryptSnapshot(kit,created.privateKey,snapshot),data);assert.throws(()=>checkEnvelope({...kit,privateKey:{...kit.privateKey,iterations:1}}),/supported/);
});
test('new email cannot overwrite manual status; review dismissal survives repeated imports',()=>{
 const old={applications:[{id:'a',company:'Example',status:'Interviewing',updatedAt:'2026-01-02',manualOverride:true,notes:'Keep me'}],reviews:[],dismissed:[]};
 const incoming={applications:[{id:'a',status:'Rejected',updatedAt:'2026-01-03'}],reviews:[{id:'review-1'}],lastImport:{at:'2026-01-04'}};
 let result=mergeUpdates(old,incoming);assert.equal(result.applications[0].status,'Interviewing');assert.equal(result.reviews.length,2);
 result.dismissed=result.reviews.map(r=>r.id);result.reviews=[];result=mergeUpdates(result,incoming);assert.equal(result.reviews.length,0);assert.equal(result.applications[0].notes,'Keep me');
});
test('imports deduplicate stable IDs, ignore deleted records and never regress newer updates',()=>{
 const old={applications:[{id:'a',status:'Interviewing',updatedAt:'2026-01-04'}],reviews:[],dismissed:['b']};const incoming={applications:[{id:'a',status:'Applied',updatedAt:'2026-01-01'},{id:'b',status:'Applied'}],reviews:[]};
 const merged=mergeUpdates(old,incoming);assert.equal(merged.applications.length,1);assert.equal(merged.applications[0].status,'Interviewing');assert.equal(old.applications[0].status,'Interviewing');
});

test('publication envelope rejects plaintext extras and unencrypted private key fields',()=>{assert.throws(()=>checkEnvelope({...created.vault,applications:[]}),/supported/);assert.throws(()=>checkEnvelope({...created.vault,publicKey:{...created.vault.publicKey,d:'private-material'}}),/unprotected/);assert.throws(()=>checkEnvelope({...created.vault,privateKey:{...created.vault.privateKey,password:'plaintext'}}),/unprotected/);});
