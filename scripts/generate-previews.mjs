import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import vm from 'node:vm';
import {flatDesign} from './flat-design.mjs';
import {referenceDesign,references} from './reference-designs.mjs';
const context={window:{}};
vm.runInNewContext(await readFile(new URL('../dist/catalog.js',import.meta.url),'utf8'),context);
const out=new URL('../dist/previews/',import.meta.url);
const assets=new URL('../dist/assets/references/',import.meta.url);
await mkdir(out,{recursive:true});await mkdir(assets,{recursive:true});
for(const design of context.window.DESIGNS){
  if(design.id!=='01-flat'){
    const destination=new URL(design.id+'.png',assets);
    try{await access(destination);}catch{
      await copyFile(new URL('../../../サンプルデザイン/'+encodeURIComponent(references[design.id].file),import.meta.url),destination);
    }
  }
  await writeFile(new URL(design.id+'.html',out),design.id==='01-flat'?flatDesign():referenceDesign(design),'utf8');
}
console.log('Generated 20 independent 1672 x 941 HTML compositions.');
