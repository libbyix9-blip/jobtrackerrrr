import {spawnSync} from 'node:child_process';import {readdirSync} from 'node:fs';
for(const path of [...readdirSync('.').filter(p=>p.endsWith('.mjs')),...readdirSync('scripts').filter(p=>p.endsWith('.mjs')).map(p=>'scripts/'+p)]){const r=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});if(r.status)process.exit(r.status);}
