// Reads private input outside this checkout; writes only the encrypted public artifact.
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';import {resolve,relative,isAbsolute} from 'node:path';
import {checkEnvelope,encryptSnapshot} from '../vault.mjs';
const [kitPath,inputPath]=process.argv.slice(2);if(!kitPath||!inputPath)throw new Error('Usage: node scripts/encrypt-import.mjs <sync-key.json> <private-import.json>');
const root=realpathSync('.'),input=realpathSync(inputPath);const rel=relative(root,input);if(!rel.startsWith('..')&&!isAbsolute(rel))throw new Error('Private import must be outside this public checkout.');
const {snapshot:unused,...kit}=checkEnvelope(JSON.parse(readFileSync(kitPath,'utf8')));const data=JSON.parse(readFileSync(input,'utf8'));if(!Array.isArray(data.applications)||!Array.isArray(data.reviews))throw new Error('Invalid import input.');
const envelope={...kit,snapshot:await encryptSnapshot(kit,data)};writeFileSync(resolve(root,'inbox.enc.json'),JSON.stringify(envelope)+'\n');console.log('Encrypted inbox artifact ready. No plaintext or passphrase was written to the public checkout.');
