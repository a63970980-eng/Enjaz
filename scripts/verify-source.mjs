import {readdirSync,statSync} from 'node:fs';
import {join,relative} from 'node:path';
import {spawnSync} from 'node:child_process';

const root=new URL('..',import.meta.url).pathname;
const includeRoots=['apps/web','services/api/src','services/api/test','api','supabase/functions','packages'];
const files=[];
function walk(dir){
  for(const entry of readdirSync(join(root,dir),{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory()){if(!['node_modules','dist','build','coverage'].includes(entry.name))walk(path);continue;}
    if(/\.(m?js|cjs|ts)$/.test(entry.name)&&!entry.name.endsWith('.d.ts'))files.push(path);
  }
}
for(const dir of includeRoots){try{walk(dir)}catch(error){if(error.code!=='ENOENT')throw error;}}
let failed=0;
for(const file of files.sort()){
  const isTypeScript=file.endsWith('.ts');
  const args=isTypeScript?['--experimental-strip-types','--check',file]:['--check',file];
  const result=spawnSync(process.execPath,args,{cwd:root,encoding:'utf8'});
  if(result.status!==0){failed++;process.stderr.write(`${relative(root,file)}\n${result.stderr||result.stdout}`);}
}
if(failed){console.error(`Source verification failed for ${failed} file(s).`);process.exit(1);}
console.log(`Source verification passed for ${files.length} JavaScript/TypeScript source files.`);
