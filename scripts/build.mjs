import {mkdirSync,copyFileSync,rmSync,existsSync,readFileSync} from 'node:fs';
import {checkEnvelope} from '../vault.mjs';
export const publicFiles=['index.html','tracker.mjs','gmail-direct.mjs','gmail-parser.mjs','vault.mjs','validation.mjs','tracker.css','favicon.svg','.nojekyll','assets/libby-headshot.jpg'];
rmSync('dist',{recursive:true,force:true});mkdirSync('dist',{recursive:true});for(const name of publicFiles){const target='dist/'+name;mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});copyFileSync(name,target);}
if(existsSync('inbox.enc.json')){const envelope=checkEnvelope(JSON.parse(readFileSync('inbox.enc.json','utf8')));const allowed=['format','version','id','publicKey','privateKey','snapshot'];if(Object.keys(envelope).some(k=>!allowed.includes(k))||!envelope.snapshot||Object.keys(envelope.snapshot).sort().join(',')!=='ciphertext,iv,wrappedKey')throw new Error('Only an encrypted vault envelope may be published.');copyFileSync('inbox.enc.json','dist/inbox.enc.json');}
console.log(`Packaged ${publicFiles.length} public app files${existsSync('inbox.enc.json')?' and the encrypted inbox':''}.`);
