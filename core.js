export const LETTERS = 'ABCDE';
export const AREAS = ['Linguagens','Ciências Humanas','Ciências da Natureza','Matemática'];
const groups = [
'D A D D B C B B B D B E E D E E D E C E E B E E A C E A E C E E D D C D B E E B D E D A E',
'B D D E B D C D D E B C D D C D E A B C E A B E E B A D E A D A A A C B A A E B D A E E C',
'E D C B B D D E B C A D C C C A A D D E E B A B A E D C D D D D A C E D E B E B A C A E D',
'C C C B D B A C C B B C C C E B A D D A D C D C D D D B C C B B D A B C C D A B D E A E C'
];
export const KEY = groups.flatMap(s=>s.split(' '));
if (groups.some(s=>s.split(' ').length!==45)) throw Error('Gabarito inválido');
export function correctKey(lang) { const k=[...KEY]; if(lang==='es') k.splice(0,5,...'CADEA'); return k; }
export function score(record) {
 const key=correctKey(record.lang), areas=AREAS.map((name,i)=>({name,correct:0,read:0,total:45}));
 for(let d=0;d<2;d++) if(record.days?.[d]) for(let j=0;j<90;j++) {const q=d*90+j,a=areas[Math.floor(q/45)]; a.read++; if(record.days[d].answers[j]===key[q]) a.correct++;}
 return {areas,total:areas.reduce((n,a)=>n+a.correct,0),read:areas.reduce((n,a)=>n+a.read,0)};
}
// Projective mapping: unit square -> four photographed bubble centers (TL, TR, BR, BL).
export function projective(p) {
 const [a,b,c,d]=p, dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x,dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y;
 const det=dx1*dy2-dx2*dy1;
 if(Math.abs(det)<1) throw Error('Pontos muito próximos. Refaça o alinhamento.');
 const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
 return (u,v)=>{const z=g*u+h*v+1;return {x:((b.x-a.x+g*b.x)*u+(d.x-a.x+h*d.x)*v+a.x)/z,y:((b.y-a.y+g*b.y)*u+(d.y-a.y+h*d.y)*v+a.y)/z};};
}
export function validateCorners(p) {
 if(p.length!==4) return false;
 let signs=[]; for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4],c=p[(i+2)%4];signs.push((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x));}
 return signs.every(n=>n>100) && Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)>150 && Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)>60;
}
export function bubble(q,option) {const col=Math.floor(q/15),row=q%15;const starts=[49,171,293,421,544,666];const steps=[18.2,18.3,18.4,18.3,18.3,18.1];return {u:(starts[col]+option*steps[col]-49)/(738.4-49),v:row/14};}
export function classify(values) {
 const sorted=values.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v), top=sorted[0],second=sorted[1];
 const filled=values.map((v,i)=>v>.48?i:-1).filter(i=>i>=0);
 if(filled.length>1) return {answer:'X',status:'Dupla'};
 if(top.v<.24) return {answer:'',status:'Em branco'};
 if(top.v<.48 || top.v-second.v<.22) return {answer:LETTERS[top.i],status:'Conferir'};
 return {answer:LETTERS[top.i],status:'Lida'};
}
export function scan(image,p) {
 if(!validateCorners(p)) throw Error('Marque os quatro pontos na ordem indicada, com a folha na posição vertical.');
 const map=projective(p), {data,width,height}=image;
 const darkness=(x,y)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=width||y>=height)return 0;const at=(y*width+x)*4;return 1-Math.max(data[at],data[at+1],data[at+2])/255;};
 const out=[];
 for(let q=0;q<90;q++) {
  let vals=[];
  for(let o=0;o<5;o++) {const {u,v}=bubble(q,o);let samples=[];for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(x*x+y*y<=9){const a=map(u+x/(738.4-49),v+y/238);samples.push(darkness(a.x,a.y));}vals.push(samples.reduce((s,n)=>s+n,0)/samples.length);}
  out.push({...classify(vals),values:vals});
 }
 return out;
}
export function makePdf(lines) {
 // Built-in Helvetica, WinAnsi encoding; paginated text report with fixed-width columns.
 const enc=s=>{const arr=[];for(const c of s){let n=c.charCodeAt(0);if(n===8211||n===8212)n=45;if(n>255)n=63;arr.push(n);}return new Uint8Array(arr);};
 const esc=s=>s.replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)');
 const pages=[];for(let i=0;i<lines.length;i+=48)pages.push(lines.slice(i,i+48));
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'];
 const kids=[];
 pages.forEach((page,i)=>{const id=objects.length+1;kids.push(`${id} 0 R`);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${id+1} 0 R >>`);const body='BT /F1 9 Tf 35 805 Td 15 TL\n'+page.map((l,j)=>`${j?'T* ':''}(${esc(l)}) Tj`).join('\n')+`\nET\nBT /F1 9 Tf 35 25 Td (Pagina ${i+1} / ${pages.length}) Tj ET`;objects.push(`<< /Length ${enc(body).length} >>\nstream\n${body}\nendstream`);});
 objects[1]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pages.length} >>`;
 let s='%PDF-1.4\n',offsets=[0];objects.forEach((o,i)=>{offsets.push(enc(s).length);s+=`${i+1} 0 obj\n${o}\nendobj\n`;});const start=enc(s).length;s+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;return enc(s);
}
