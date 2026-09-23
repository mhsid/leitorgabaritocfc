import fs from 'node:fs';
const core=fs.readFileSync(new URL('./core.js',import.meta.url),'utf8').replaceAll('export ','');
const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8').split('\n').slice(1).join('\n');
fs.writeFileSync(new URL('./bundle.js',import.meta.url),'(()=>{\n'+core+'\n'+app+'\n})();\n');
console.log('bundle.js atualizado');
