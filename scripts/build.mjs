import {mkdirSync,copyFileSync,rmSync,existsSync,readFileSync} from 'node:fs';
import {checkEnvelope} from '../vault.mjs';
export const publicFiles=['index.html','tracker.mjs','vault.mjs','validation.mjs','tracker.css','favicon.svg','.nojekyll'];
rmSync('dist',{recursive:true,force:true});mkdirSync('dist',{recursive:true});for(const name of publicFiles)copyFileSync(name,'dist/'+name);
if(existsSync('inbox.enc.json')){const envelope=checkEnvelope(JSON.parse(readFileSync('inbox.enc.json','utf8')));const allowed=['format','version','id','publicKey','privateKey','snapshot'];if(Object.keys(envelope).some(k=>!allowed.includes(k))||!envelope.snapshot||Object.keys(envelope.snapshot).sort().join(',')!=='ciphertext,iv,wrappedKey')throw new Error('Only an encrypted vault envelope may be published.');copyFileSync('inbox.enc.json','dist/inbox.enc.json');}
console.log(`Packaged ${publicFiles.length} public app files${existsSync('inbox.enc.json')?' and the encrypted inbox':''}.`);
