import {mkdirSync,copyFileSync} from 'node:fs';
export const publicFiles=['index.html','app.mjs','boot.mjs','preview.mjs','validation.mjs','library.mjs','gmail.mjs','design.css','styles.css','preview.css','favicon.svg','.nojekyll'];
mkdirSync('dist',{recursive:true});for(const name of publicFiles)copyFileSync(name,'dist/'+name);
console.log(`Packaged ${publicFiles.length} explicitly allowed public files.`);
