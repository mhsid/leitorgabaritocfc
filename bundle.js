(()=>{
const LETTERS = 'ABCDE';
const AREAS = ['Linguagens','Ciências Humanas','Ciências da Natureza','Matemática'];
const groups = [
'D A D D B C B B B D B E E D E E D E C E E B E E A C E A E C E E D D C D B E E B D E D A E',
'B D D E B D C D D E B C D D C D E A B C E A B E E B A D E A D A A A C B A A E B D A E E C',
'E D C B B D D E B C A D C C C A A D D E E B A B A E D C D D D D A C E D E B E B A C A E D',
'C C C B D B A C C B B C C C E B A D D A D C D C D D D B C C B B D A B C C D A B D E A E C'
];
const KEY = groups.flatMap(s=>s.split(' '));
if (groups.some(s=>s.split(' ').length!==45)) throw Error('Gabarito inválido');
function correctKey(lang) { const k=[...KEY]; if(lang==='es') k.splice(0,5,...'CADEA'); return k; }
function score(record) {
 const key=correctKey(record.lang), areas=AREAS.map((name,i)=>({name,correct:0,read:0,total:45}));
 for(let d=0;d<2;d++) if(record.days?.[d]) for(let j=0;j<90;j++) {const q=d*90+j,a=areas[Math.floor(q/45)]; a.read++; if(record.days[d].answers[j]===key[q]) a.correct++;}
 return {areas,total:areas.reduce((n,a)=>n+a.correct,0),read:areas.reduce((n,a)=>n+a.read,0)};
}
// Projective mapping: unit square -> four photographed bubble centers (TL, TR, BR, BL).
function projective(p) {
 const [a,b,c,d]=p, dx1=b.x-c.x,dx2=d.x-c.x,dx3=a.x-b.x+c.x-d.x,dy1=b.y-c.y,dy2=d.y-c.y,dy3=a.y-b.y+c.y-d.y;
 const det=dx1*dy2-dx2*dy1;
 if(Math.abs(det)<1) throw Error('Pontos muito próximos. Refaça o alinhamento.');
 const g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
 return (u,v)=>{const z=g*u+h*v+1;return {x:((b.x-a.x+g*b.x)*u+(d.x-a.x+h*d.x)*v+a.x)/z,y:((b.y-a.y+g*b.y)*u+(d.y-a.y+h*d.y)*v+a.y)/z};};
}
function validateCorners(p) {
 if(p.length!==4) return false;
 let signs=[]; for(let i=0;i<4;i++){const a=p[i],b=p[(i+1)%4],c=p[(i+2)%4];signs.push((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x));}
 return signs.every(n=>n>100) && Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)>150 && Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)>60;
}
function bubble(q,option) {const col=Math.floor(q/15),row=q%15;const starts=[49,171,293,421,544,666];const steps=[18.2,18.3,18.4,18.3,18.3,18.1];return {u:(starts[col]+option*steps[col]-49)/(738.4-49),v:row/14};}
function classify(values) {
 const sorted=values.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v), top=sorted[0],second=sorted[1];
 const filled=values.map((v,i)=>v>.48?i:-1).filter(i=>i>=0);
 if(filled.length>1) return {answer:'X',status:'Dupla'};
 if(top.v<.24) return {answer:'',status:'Em branco'};
 if(top.v<.48 || top.v-second.v<.22) return {answer:LETTERS[top.i],status:'Conferir'};
 return {answer:LETTERS[top.i],status:'Lida'};
}
function scan(image,p) {
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
function makePdf(lines) {
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

// Local OMR for color and grayscale SAS cards. No network, OCR or student-identity recognition.
function components(mask,w,h,minSize=8){
 const out=[],seen=new Uint8Array(w*h),queue=new Int32Array(w*h);
 for(let i=0;i<mask.length;i++){if(!mask[i]||seen[i])continue;let head=0,tail=1;queue[0]=i;seen[i]=1;let minX=w,minY=h,maxX=0,maxY=0,sx=0,sy=0;
 while(head<tail){const at=queue[head++],x=at%w,y=(at/w)|0;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);sx+=x;sy+=y;
 for(const n of [x>0?at-1:-1,x<w-1?at+1:-1,y>0?at-w:-1,y<h-1?at+w:-1])if(n>=0&&mask[n]&&!seen[n]){seen[n]=1;queue[tail++]=n;}}
 if(tail>=minSize)out.push({x:sx/tail,y:sy/tail,w:maxX-minX+1,h:maxY-minY+1,minX,minY,maxX,maxY,size:tail});}
 return out;
}
function findMarkers(im){
 const {width:w,height:h,data}=im,mask=new Uint8Array(w*h);
 for(let i=0;i<mask.length;i++){const j=i*4;mask[i]=Math.max(data[j],data[j+1],data[j+2])<105?1:0;}
 const candidates=components(mask,w,h,30).filter(c=>c.w>w*.009&&c.w<w*.065&&c.h>h*.006&&c.h<h*.06&&c.w/c.h>.5&&c.w/c.h<1.8&&c.size/(c.w*c.h)>.66);
 const zones=[c=>c.x<w*.35&&c.y<h*.3,c=>c.x>w*.65&&c.y<h*.3,c=>c.x>w*.65&&c.y>h*.7,c=>c.x<w*.35&&c.y>h*.7];
 const cost=[c=>c.x/w+c.y/h,c=>(w-c.x)/w+c.y/h,c=>(w-c.x)/w+(h-c.y)/h,c=>c.x/w+(h-c.y)/h];
 const p=zones.map((z,i)=>candidates.filter(z).sort((a,b)=>cost[i](a)-cost[i](b))[0]);
 if(p.some(c=>!c))throw Error('Não encontrei os quatro quadrados pretos. Fotografe a folha inteira, na vertical, sobre um fundo claro e sem cortar os cantos.');
 // Three markers at the upper left identify the orientation and reduce false corner matches.
 const tl=p[0],tr=p[1],distance=tr.x-tl.x;
 const extra=candidates.filter(c=>c!==tl&&Math.abs(c.y-tl.y)<tl.h*1.1&&c.x>tl.x+tl.w&&c.x<tl.x+distance*.19);
 if(extra.length<2)throw Error('Coloque a folha na posição correta: os três quadrados pretos devem ficar no canto superior esquerdo. Use Girar foto se necessário.');
 const sizes=p.map(c=>c.size);if(Math.max(...sizes)/Math.min(...sizes)>4)throw Error('A foto está muito inclinada ou os marcadores não estão nítidos. Fotografe novamente de frente.');
 return p.map(c=>({x:c.x,y:c.y}));
}
function rectify(im){
 const p=findMarkers(im),map=projective(p),width=1304,height=1848,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const a=map((x-53.5)/1195.5,(y-53.5)/1726.5),at=(y*width+x)*4,xx=Math.round(a.x),yy=Math.round(a.y);if(xx<0||yy<0||xx>=im.width||yy>=im.height){data[at]=data[at+1]=data[at+2]=data[at+3]=255;continue;}const src=(yy*im.width+xx)*4;data[at]=im.data[src];data[at+1]=im.data[src+1];data[at+2]=im.data[src+2];data[at+3]=255;}
 return {width,height,data,markers:p};
}
function inkMap(im){
 const {width:w,height:h,data}=im,gray=new Float32Array(w*h),integral=new Float64Array((w+1)*(h+1));
 for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){const i=y*w+x,j=i*4;gray[i]=.299*data[j]+.587*data[j+1]+.114*data[j+2];row+=gray[i];integral[(y+1)*(w+1)+x+1]=integral[y*(w+1)+x+1]+row;}}
 const mask=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const x0=Math.max(0,x-18),x1=Math.min(w,x+19),y0=Math.max(0,y-18),y1=Math.min(h,y+19);const mean=(integral[y1*(w+1)+x1]-integral[y0*(w+1)+x1]-integral[y1*(w+1)+x0]+integral[y0*(w+1)+x0])/((x1-x0)*(y1-y0));mask[y*w+x]=gray[y*w+x]<mean-13?1:0;}return mask;
}
function detectLayout(im){
 const {width:w,height:h}=im,mask=inkMap(im);mask.fill(0,0,Math.floor(h*.40)*w);mask.fill(0,Math.floor(h*.96)*w);
 const rings=components(mask,w,h,22).filter(c=>c.w>=16&&c.w<=36&&c.h>=16&&c.h<=36&&c.w/c.h>.7&&c.w/c.h<1.4&&c.size/(c.w*c.h)<.99).map(c=>({...c,x:(c.minX+c.maxX)/2,y:(c.minY+c.maxY)/2}));
 const bands=[];for(const c of rings.sort((a,b)=>a.y-b.y)){let row=bands.find(b=>Math.abs(b.y-c.y)<5);if(!row){row={y:c.y,items:[]};bands.push(row);}row.items.push(c);}
 const rows=[];for(const band of bands){const cells=band.items.sort((a,b)=>a.x-b.x);for(let i=0;i<=cells.length-5;i++){const five=cells.slice(i,i+5),steps=five.slice(1).map((c,j)=>c.x-five[j].x),avg=steps.reduce((a,b)=>a+b)/4;if(avg<19||avg>49||steps.some(s=>Math.abs(s-avg)>3))continue;rows.push({x:five[0].x,y:five.reduce((s,c)=>s+c.y,0)/5,step:avg,radius:five.reduce((s,c)=>s+(c.w+c.h)/4,0)/5});i+=4;}}
 const columns=[];for(const row of rows){let col=columns.find(c=>Math.abs(c.x-row.x)<7);if(!col){col={x:row.x,rows:[]};columns.push(col);}col.rows.push(row);}
 // Recover rows even when a filled bubble merges with its outline or a table border.
 for(const col of columns){if(col.rows.length<8)continue;const step=col.rows.reduce((s,r)=>s+r.step,0)/col.rows.length;const recovered=[];for(const band of bands){const matches=[];for(let o=0;o<5;o++){const found=band.items.filter(c=>Math.abs(c.x-(col.x+o*step))<7).sort((a,b)=>b.w-a.w)[0];if(found)matches.push({...found,o});}if(matches.length>=3){const xs=matches.map(c=>c.x-c.o*step).sort((a,b)=>a-b);recovered.push({x:xs[Math.floor(xs.length/2)],y:matches.reduce((s,c)=>s+c.y,0)/matches.length,step,radius:matches.reduce((s,c)=>s+(c.w+c.h)/4,0)/matches.length});}}col.rows=recovered;}
 const result=[];for(const col of columns.sort((a,b)=>a.x-b.x)){if(col.rows.length<8)continue;col.rows.sort((a,b)=>a.y-b.y);const diffs=col.rows.slice(1).map((r,i)=>r.y-col.rows[i].y).sort((a,b)=>a-b),pitch=diffs[Math.floor(diffs.length/2)];if(pitch<20||pitch>55||diffs.some(d=>Math.abs(d-pitch)>4))throw Error('A grade não está completa ou nítida. Use uma foto melhor ou cadastre antes o cartão em branco de 90 questões.');result.push(...col.rows);}
 if(![40,90].includes(result.length))throw Error(`Identifiquei ${result.length} linhas de respostas. São necessárias 90 para corrigir, ou 40 para testar o modelo fornecido. Fotografe novamente ou cadastre o cartão em branco.`);
 return {version:1,width:w,height:h,rows:result,count:result.length};
}
function validLayout(l){return !!l&&l.version===1&&l.width===1304&&l.height===1848&&l.count===90&&Array.isArray(l.rows)&&l.rows.length===90&&l.rows.every(r=>Number.isFinite(r.x)&&r.x>20&&r.x<1250&&Number.isFinite(r.y)&&r.y>700&&r.y<1800&&r.step>=19&&r.step<=49&&r.x+4*r.step<1304&&r.radius>=6&&r.radius<=18);}
function readLayout(im,layout){
 const {data,width,height}=im;
 // Drop out red form printing but preserve dark blue/black handwriting.
 const light=at=>data[at]-data[at+1]>45&&data[at]-data[at+2]>18?Math.max(data[at],data[at+1],data[at+2]):.299*data[at]+.587*data[at+1]+.114*data[at+2];
 const ink=inkMap(im);function printedInk(x,y){return ink[Math.round(y)*width+Math.round(x)]===1;}
 // Reject a saved template if printed rings no longer coincide with it.
 let checks=0,hits=0,badRows=0;for(const r of layout.rows){let rowHits=0;for(let o=0;o<5;o++)for(let t=0;t<12;t++){const angle=t*Math.PI/6;let found=false;for(let dr=-2;dr<=2;dr++){const x=r.x+o*r.step+Math.cos(angle)*(r.radius-1+dr),y=r.y+Math.sin(angle)*(r.radius-1+dr);if(x>=0&&y>=0&&x<width&&y<height&&printedInk(x,y)){found=true;break;}}checks++;if(found){hits++;rowHits++;}}if(rowHits/60<.35)badRows++;}
 if(hits/checks<.45||badRows>Math.floor(layout.count*.03))throw Error('A grade desta foto não coincide com o modelo cadastrado, ou está desfocada. Refaça a foto; se o desenho mudou, cadastre o novo cartão em branco.');
 return layout.rows.map(r=>{const values=[];for(let o=0;o<5;o++){const cx=r.x+o*r.step,cy=r.y;let paper=[];for(let t=0;t<24;t++){const a=t*Math.PI/12,x=Math.round(cx+Math.cos(a)*r.radius*1.25),y=Math.round(cy+Math.sin(a)*r.radius*1.25);if(x>=0&&y>=0&&x<width&&y<height){const at=(y*width+x)*4;paper.push(light(at));}}paper.sort((a,b)=>a-b);const white=paper[Math.floor(paper.length*.8)]||255;let sum=0,n=0;const radius=r.radius*.57;for(let y=Math.floor(cy-radius);y<=cy+radius;y++)for(let x=Math.floor(cx-radius);x<=cx+radius;x++){if((x-cx)**2+(y-cy)**2>radius**2)continue;const at=(y*width+x)*4;sum+=Math.max(0,1-light(at)/white);n++;}values.push(sum/n);}const sorted=[...values].sort((a,b)=>b-a);const result=sorted[0]<.32&&sorted[0]-sorted[1]<.14?{answer:'',status:'Em branco'}:classify(values);return {...result,values};});
}
function automaticScan(im,template=null){
 const normalized=rectify(im);
 if(template)return {normalized,layout:template,answers:readLayout(normalized,template)};
 // The official layout is already installed. Verify the whole grid before using it.
 try{return {normalized,layout:OFFICIAL_LAYOUT,answers:readLayout(normalized,OFFICIAL_LAYOUT)};}catch{}
 const layout=detectLayout(normalized);return {normalized,layout,answers:readLayout(normalized,layout)};
}

// Geometry only, extracted from the official 90-question blank; no personal data.
const OFFICIAL_LAYOUT = {"version":1,"width":1304,"height":1848,"rows":[{"x":127.5,"y":887,"step":31,"radius":12.3},{"x":127.5,"y":918.5,"step":31,"radius":12.05},{"x":127.5,"y":949.5,"step":31,"radius":12.1},{"x":127.5,"y":980.5,"step":31,"radius":12.05},{"x":127.5,"y":1011.5,"step":31,"radius":12.55},{"x":127.5,"y":1042.5,"step":31,"radius":12.05},{"x":127.5,"y":1073.5,"step":31,"radius":12.05},{"x":127.5,"y":1104.5,"step":31,"radius":12.05},{"x":127.5,"y":1136,"step":31,"radius":12.3},{"x":127.5,"y":1166.5,"step":31,"radius":12.05},{"x":127.5,"y":1197.5,"step":31,"radius":12.05},{"x":127.5,"y":1228.5,"step":31,"radius":12.05},{"x":127.5,"y":1260,"step":31,"radius":12.3},{"x":127.5,"y":1291,"step":31,"radius":11.8},{"x":127.5,"y":1321.5,"step":31,"radius":12.05},{"x":127.5,"y":1352.5,"step":31,"radius":12.05},{"x":127.5,"y":1384,"step":31,"radius":12.3},{"x":127.5,"y":1415.5,"step":31,"radius":12.05},{"x":127.5,"y":1445.5,"step":31,"radius":12.05},{"x":127.5,"y":1476.5,"step":31,"radius":12.05},{"x":127.5,"y":1508,"step":31,"radius":12.3},{"x":127.5,"y":1539.5,"step":31,"radius":12.05},{"x":127.5,"y":1569.5,"step":31,"radius":12.05},{"x":127.5,"y":1600.5,"step":31,"radius":12},{"x":365.5,"y":887,"step":31,"radius":12.25},{"x":365.5,"y":918.5,"step":31,"radius":11.95},{"x":365.5,"y":949.5,"step":31,"radius":12.1},{"x":365.5,"y":980.5,"step":31,"radius":12},{"x":365.5,"y":1011.5,"step":31,"radius":12.6},{"x":365.5,"y":1042.5,"step":31,"radius":11.95},{"x":365.5,"y":1073.5,"step":31,"radius":12.1},{"x":365.5,"y":1104.5,"step":31,"radius":12},{"x":365.5,"y":1136,"step":31,"radius":12.35},{"x":365.5,"y":1166.5,"step":31,"radius":11.95},{"x":365.5,"y":1197.5,"step":31,"radius":12.1},{"x":365.5,"y":1228.5,"step":31,"radius":12},{"x":365.5,"y":1260,"step":31,"radius":12.35},{"x":365.5,"y":1291,"step":31,"radius":11.7},{"x":365.5,"y":1321.5,"step":31,"radius":12.1},{"x":365.5,"y":1352.5,"step":31,"radius":12},{"x":365.5,"y":1384,"step":31,"radius":12.35},{"x":365.5,"y":1415.5,"step":31,"radius":12},{"x":365.5,"y":1445.5,"step":31,"radius":12.1},{"x":365.5,"y":1476.5,"step":31,"radius":12},{"x":365.5,"y":1508,"step":31,"radius":12.35},{"x":365.5,"y":1539.5,"step":31,"radius":11.95},{"x":365.5,"y":1569.5,"step":31,"radius":12.1},{"x":365.5,"y":1600.5,"step":31,"radius":11.95},{"x":603.5,"y":887,"step":31,"radius":12.3},{"x":603.5,"y":918.5,"step":31,"radius":12.05},{"x":604,"y":949.5,"step":31,"radius":12.1},{"x":603.5,"y":980.5,"step":31,"radius":12.05},{"x":603.5,"y":1011.5,"step":31,"radius":12.55},{"x":603.5,"y":1042.5,"step":31,"radius":12.05},{"x":604,"y":1073.5,"step":31,"radius":12.1},{"x":603.5,"y":1104.5,"step":31,"radius":12.05},{"x":603.5,"y":1136,"step":31,"radius":12.3},{"x":603.5,"y":1166.5,"step":31,"radius":12.05},{"x":604,"y":1197.5,"step":31,"radius":12.1},{"x":603.5,"y":1228.5,"step":31,"radius":12.05},{"x":604,"y":1260,"step":31,"radius":12.35},{"x":603.5,"y":1291,"step":31,"radius":11.8},{"x":603.5,"y":1321.5,"step":31,"radius":12.05},{"x":603.5,"y":1352.5,"step":31,"radius":12.05},{"x":604,"y":1384,"step":31,"radius":12.35},{"x":603.5,"y":1415.5,"step":31,"radius":12.05},{"x":604,"y":1445.5,"step":31,"radius":12.1},{"x":603.5,"y":1476.5,"step":31,"radius":12.05},{"x":604,"y":1508,"step":31,"radius":12.35},{"x":603.5,"y":1539.5,"step":31,"radius":12.05},{"x":604,"y":1569.5,"step":31,"radius":12.1},{"x":603.5,"y":1600.5,"step":31,"radius":12},{"x":842,"y":887,"step":31,"radius":12.3},{"x":842,"y":918.5,"step":31,"radius":12.05},{"x":842,"y":949.5,"step":31,"radius":12.1},{"x":842,"y":980.5,"step":31,"radius":12.05},{"x":842,"y":1011.5,"step":31,"radius":12.6},{"x":842,"y":1042.5,"step":31,"radius":12.05},{"x":842,"y":1073.5,"step":31,"radius":12.1},{"x":842,"y":1104.5,"step":31,"radius":12.05},{"x":842,"y":1136,"step":31,"radius":12.35},{"x":842,"y":1166.5,"step":31,"radius":12.05},{"x":842,"y":1197.5,"step":31,"radius":12.1},{"x":842,"y":1228.5,"step":31,"radius":12.05},{"x":842,"y":1260,"step":31,"radius":12.35},{"x":842,"y":1291,"step":31,"radius":11.8},{"x":842,"y":1321.5,"step":31,"radius":12.1},{"x":842,"y":1352.5,"step":31,"radius":12.05},{"x":842,"y":1384,"step":31,"radius":12.35},{"x":842,"y":1415.5,"step":31,"radius":12.05}],"count":90};

const $=id=>document.getElementById(id), STORE='confere-v1';
let state={version:1,students:[],records:{},templates:{}}, draft=null, photo=null, points=[], stream=null, dirty=false, layout=null, busy=false;
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function studentsValid(rows){return Array.isArray(rows)&&rows.length>0&&rows.length<2000&&rows.every(s=>s&&typeof s.id==='string'&&/^[\w-]{1,60}$/.test(s.id)&&!['__proto__','constructor','prototype'].includes(s.id)&&typeof s.name==='string'&&s.name.length>0&&s.name.length<180&&typeof s.class==='string'&&/^9º [A-Z]$/.test(s.class))&&new Set(rows.map(s=>s.id)).size===rows.length;}
function validateState(s){if(s.version!==1||!studentsValid(s.students)||!s.records||typeof s.records!=='object'||Array.isArray(s.records))throw Error('Cópia de segurança inválida.');const ids=new Set(s.students.map(x=>x.id));for(const [id,r] of Object.entries(s.records)){if(!ids.has(id)||!['en','es'].includes(r.lang)||!r.days||typeof r.days!=='object')throw Error('Registro inválido.');for(const [d,v] of Object.entries(r.days)){if(!['0','1'].includes(d)||!v||!Array.isArray(v.answers)||v.answers.length!==90||v.answers.some(a=>!['','X',...'ABCDE'].includes(a))||typeof v.savedAt!=='string')throw Error('Respostas inválidas.');}}if(s.templates)for(const [d,l] of Object.entries(s.templates))if(!['0','1'].includes(d)||!validLayout(l))throw Error('Modelo inválido na cópia.');return s;}
try{const raw=localStorage.getItem(STORE);if(raw)state=validateState(JSON.parse(raw));}catch(e){notice('Não foi possível carregar os dados salvos. Restaure uma cópia de segurança na aba Preparar.',true);}
function persist(next){try{localStorage.setItem(STORE,JSON.stringify(next));state=next;return true;}catch(e){notice('Não foi possível salvar neste navegador. Seus dados atuais continuam abertos: baixe uma cópia de segurança. Verifique o espaço e as permissões de armazenamento.',true);return false;}}
function selected(){return state.students.find(s=>s.id===$('studentSelect').value);}
function record(){return state.records[selected()?.id];}
function hasWork(){return dirty||!!photo||!!stream;}
function templateStatus(){const ts=state.templates||{};$('templateStatus').textContent=[0,1].map(d=>`${d+1}º dia: ${ts[d]?'modelo personalizado de 90 questões':'modelo oficial de 90 questões pronto'}`).join(' · ');}
function clearWork(){draft=null;photo=null;points=[];layout=null;dirty=false;stopCamera();$('review').hidden=true;$('alignment').hidden=true;$('captureStart').hidden=false;$('photo').value='';$('photoCanvas').width=1;$('photoCanvas').height=1;$('reviewConfirmed').checked=false;$('saveDay').disabled=true;$('saveDay').hidden=false;}
function leaveWork(){if(busy){notice('Aguarde a leitura terminar.',true);return false;}if(hasWork()&&!confirm('Descartar a foto e as respostas ainda não salvas?'))return false;clearWork();return true;}
function fillClasses(){const classes=[...new Set(state.students.map(s=>s.class))].sort();$('classSelect').innerHTML=classes.map(c=>`<option>${safe(c)}</option>`).join('');$('reportClass').innerHTML='<option value="">Todas as turmas</option>'+classes.map(c=>`<option>${safe(c)}</option>`).join('');fillStudents();$('rosterCount').textContent=`${state.students.length} estudantes importados · ${classes.length} turmas`;$('noStudents').hidden=state.students.length>0;}
function fillStudents(){const rows=state.students.filter(s=>s.class===$('classSelect').value);$('studentSelect').innerHTML=rows.map(s=>`<option value="${safe(s.id)}">${safe(s.name)}</option>`).join('');loadStudent();}
function loadStudent(){$('language').value=record()?.lang||'';updateSummary();}
function updateSummary(){const r=record();$('studentSummary').innerHTML=[0,1].map(d=>`<div>${d+1}º dia <strong>${r?.days?.[d]?'✓ salvo':'· ainda não lido'}</strong></div>`).join('');if(r){const sc=score(r);$('studentSummary').innerHTML+=`<div><b>${sc.total} acertos</b> em ${sc.read} questões lidas</div>`;}$('progress').textContent=Object.values(state.records).filter(r=>r.days[0]&&r.days[1]).length;}
let previousClass='',previousStudent='',previousDay='0';
function remember(){previousClass=$('classSelect').value;previousStudent=$('studentSelect').value;previousDay=$('day').value;}
$('classSelect').onchange=()=>{if(!leaveWork()){$('classSelect').value=previousClass;return;}fillStudents();remember();};
$('studentSelect').onchange=()=>{if(!leaveWork()){$('studentSelect').value=previousStudent;return;}loadStudent();remember();};
$('day').onchange=()=>{if(!leaveWork()){$('day').value=previousDay;return;}remember();};
$('language').onchange=()=>{const r=record();if(r&&r.lang!==$('language').value){if(!$('language').value){$('language').value=r.lang;return;}if(!confirm('Alterar o idioma e recalcular as questões 1 a 5 deste estudante?')){$('language').value=r.lang;return;}const next=structuredClone(state);next.records[selected().id].lang=$('language').value;if(!persist(next))$('language').value=r.lang;updateSummary();renderReport();}};
function ready(){if(busy){notice('Aguarde a leitura terminar.',true);return false;}if(!selected()){notice('Importe a lista de estudantes na aba Preparar.',true);return false;}if(!$('language').value){notice('Selecione inglês ou espanhol para este estudante.',true);$('language').focus();return false;}return true;}
function tab(name){document.querySelectorAll('.tab').forEach(el=>el.hidden=el.id!==name);document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));if(name==='report')renderReport();if(name!=='read')stopCamera();}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$('rosterFile').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const data=JSON.parse(await file.text());if(data.version!==1||!studentsValid(data.students))throw Error('Use o arquivo de estudantes fornecido com o sistema.');if(!leaveWork())return;const ids=new Set(data.students.map(s=>s.id));if(Object.keys(state.records).some(id=>!ids.has(id)))throw Error('Essa lista removeria estudantes com resultados. Baixe uma cópia de segurança antes de trocar de lista.');const next={...state,students:data.students.map(({id,name,class:cls})=>({id,name,class:cls}))};if(!persist(next))return;fillClasses();remember();notice(`${state.students.length} estudantes importados. Você já pode iniciar a correção.`);tab('read');}catch(err){notice(err.message,true);}finally{e.target.value='';}};
$('restoreFile').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;const s=validateState(JSON.parse(await file.text()));if(!confirm('Restaurar esta cópia e substituir os dados atuais deste navegador?'))return;clearWork();if(!persist(s))return;fillClasses();remember();templateStatus();notice('Cópia restaurada.');}catch(err){notice('Falha ao restaurar: '+err.message,true);}finally{e.target.value='';}};
function stopCamera(){if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;$('video').srcObject=null;$('cameraView').hidden=true;}
$('cameraBtn').onclick=async()=>{if(!ready())return;try{if(!navigator.mediaDevices?.getUserMedia)throw Error('A câmera precisa de HTTPS. Use “Fotografar ou escolher imagem” ou abra o site no GitHub Pages.');stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:2400},height:{ideal:1800}},audio:false});$('video').srcObject=stream;$('cameraView').hidden=false;$('captureStart').hidden=true;}catch(e){notice(e.name==='NotAllowedError'?'Acesso à câmera não autorizado. Permita o acesso nas configurações ou use o botão para escolher uma imagem.':e.message,true);}};
$('closeCamera').onclick=()=>{stopCamera();$('captureStart').hidden=false;};
function setPhoto(source){const c=document.createElement('canvas');const w=source.videoWidth||source.naturalWidth||source.width,h=source.videoHeight||source.naturalHeight||source.height;if(!w||!h)throw Error('A imagem ainda não está pronta. Tente novamente.');const scale=Math.min(1,2400/Math.max(w,h));c.width=Math.round(w*scale);c.height=Math.round(h*scale);c.getContext('2d').drawImage(source,0,0,c.width,c.height);clearWork();photo=c;points=[];$('alignment').hidden=false;$('captureStart').hidden=true;$('zoom').value=1;$('photoCanvas').style.width='100%';drawPhoto();setTimeout(runAutomatic,30);}
$('takePhoto').onclick=()=>{try{setPhoto($('video'));}catch(e){notice(e.message,true);}};
$('photo').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!ready()){e.target.value='';return;}if(hasWork()&&!confirm('Substituir a leitura ainda não salva?')){e.target.value='';return;}const url=URL.createObjectURL(f);try{const img=new Image();img.src=url;await img.decode();setPhoto(img);}catch(err){notice('Não foi possível abrir a foto. Tente uma imagem JPG, PNG ou WebP.',true);}finally{URL.revokeObjectURL(url);e.target.value='';}};
function drawPhoto(){if(!photo)return;const c=$('photoCanvas');c.width=photo.width;c.height=photo.height;const ctx=c.getContext('2d');ctx.drawImage(photo,0,0);if(draft&&layout)layout.rows.forEach((r,q)=>{for(let o=0;o<5;o++){ctx.beginPath();ctx.arc(r.x+o*r.step,r.y,r.radius*.85,0,Math.PI*2);ctx.strokeStyle=draft[q].answer===LETTERS[o]?'#00a33f':'#147dff88';ctx.lineWidth=2;ctx.stroke();}});$('alignHelp').textContent=layout?`${layout.count} questões localizadas automaticamente. Confira as respostas abaixo.`:'A leitura começa automaticamente. Inclua os quatro cantos e mantenha os três quadrados no alto à esquerda.';}
async function runAutomatic(){if(!photo||busy)return;busy=true;$('analyze').disabled=true;notice('Localizando os marcadores e lendo as bolinhas…');await new Promise(r=>setTimeout(r,30));try{const im=photo.getContext('2d').getImageData(0,0,photo.width,photo.height),result=automaticScan(im,state.templates?.[$('day').value]||null);layout=result.layout;draft=result.answers;dirty=true;const c=document.createElement('canvas');c.width=result.normalized.width;c.height=result.normalized.height;c.getContext('2d').putImageData(new ImageData(result.normalized.data,c.width,c.height),0,0);photo=c;drawPhoto();renderReview();notice(layout.count===90?'90 respostas localizadas. Confira as marcações e salve.':'Modelo de teste: 40 questões reconhecidas. A visualização não será salva nem pontuada como uma prova de 90.');$('review').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){draft=null;layout=null;$('review').hidden=true;notice(e.message,true);}finally{busy=false;$('analyze').disabled=false;}}
$('zoom').oninput=e=>$('photoCanvas').style.width=`${Number(e.target.value)*100}%`;
$('rotatePhoto').onclick=()=>{if(!photo||busy)return;const c=document.createElement('canvas');c.width=photo.height;c.height=photo.width;const ctx=c.getContext('2d');ctx.translate(c.width,0);ctx.rotate(Math.PI/2);ctx.drawImage(photo,0,0);photo=c;points=[];layout=null;draft=null;dirty=false;$('review').hidden=true;drawPhoto();runAutomatic();};
$('discard').onclick=()=>{if(!busy)leaveWork();};
$('analyze').onclick=runAutomatic;
$('manualBtn').onclick=()=>{if(!ready())return;if(!leaveWork())return;const existing=record()?.days?.[$('day').value];draft=Array.from({length:90},(_,i)=>({answer:existing?.answers[i]||'',status:'Conferir'}));dirty=true;renderReview();$('review').scrollIntoView({behavior:'smooth'});};
function renderReview(){if(!draft)return;$('review').hidden=false;$('reviewConfirmed').checked=false;$('saveDay').disabled=true;const d=draft.length===40?0:Number($('day').value),count=draft.filter(r=>r.status!=='Lida'&&r.status!=='Conferida').length;$('reviewTitle').textContent=`${selected().name} · ${draft.length===40?'Teste de 40 questões':(d+1)+'º dia'}`;$('reviewConfirmed').parentElement.hidden=draft.length!==90;$('saveDay').hidden=draft.length!==90;$('reviewStats').textContent=`${count} para conferir`;$('answerGrid').innerHTML=draft.map((r,i)=>{const flagged=!['Lida','Conferida'].includes(r.status);if($('onlyFlagged').checked&&!flagged)return '';return `<div class="answer ${flagged?'flagged':''}"><strong>${i+1+d*90}</strong><select aria-label="Resposta da questão ${i+1+d*90}" data-index="${i}">${['',...LETTERS,'X'].map(a=>`<option value="${a}" ${a===r.answer?'selected':''}>${a===''?'Branco':a==='X'?'Dupla':a}</option>`).join('')}</select><small>${r.status}</small></div>`;}).join('');$('answerGrid').querySelectorAll('select').forEach(sel=>sel.onchange=()=>{draft[Number(sel.dataset.index)]={answer:sel.value,status:'Conferida'};renderReview();if(photo)drawPhoto();});}
$('onlyFlagged').onchange=renderReview;
$('reviewConfirmed').onchange=()=>{$('saveDay').disabled=!$('reviewConfirmed').checked;};
$('saveDay').onclick=()=>{if(!draft||draft.length!==90||!ready()||!$('reviewConfirmed').checked)return;const s=selected(),d=$('day').value;if(record()?.days?.[d]&&!confirm('Substituir a correção já salva deste cartão?'))return;const next=structuredClone(state),r=next.records[s.id]||{lang:$('language').value,days:{}};r.lang=$('language').value;r.days[d]={answers:draft.map(x=>x.answer),savedAt:new Date().toISOString()};next.records[s.id]=r;if(!persist(next))return;clearWork();updateSummary();renderReport();notice(`${s.name}: ${Number(d)+1}º dia salvo. ${r.days[0]&&r.days[1]?'Os dois cartões estão concluídos.':'Falta o outro cartão.'}`);};
function filtered(){return state.students.filter(s=>!$('reportClass').value||s.class===$('reportClass').value);}
function status(r){return !r?'Não iniciado':r.days[0]&&r.days[1]?'Completo':r.days[0]?'Só 1º dia':'Só 2º dia';}
function renderReport(){const rows=filtered(),complete=rows.filter(s=>state.records[s.id]?.days[0]&&state.records[s.id]?.days[1]).length,started=rows.filter(s=>state.records[s.id]).length;$('reportCards').innerHTML=`<div><b>${complete}/${rows.length}</b><span>concluídos</span></div><div><b>${started-complete}</b><span>parciais</span></div><div><b>${rows.length-started}</b><span>não iniciados</span></div>`;$('reportBody').innerHTML=rows.map(s=>{const r=state.records[s.id],sc=score(r||{days:{}});return `<tr><td>${safe(s.name)}<small>${safe(s.class)} · ${r?(r.lang==='es'?'Espanhol':'Inglês'):'Idioma pendente'}</small></td><td><button data-student="${safe(s.id)}">${status(r)}</button></td>${sc.areas.map(a=>`<td>${a.read?a.correct+'/45':'—'}</td>`).join('')}<td>${sc.read?`${sc.total}/${sc.read}`:'—'}</td></tr>`;}).join('');$('reportBody').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!leaveWork())return;const s=state.students.find(s=>s.id===b.dataset.student);$('classSelect').value=s.class;fillStudents();$('studentSelect').value=s.id;loadStudent();remember();tab('read');});$('downloadPdf').disabled=!rows.length;}
$('reportClass').onchange=renderReport;
function download(data,name,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
$('backup').onclick=()=>download(JSON.stringify(state,null,2),'confere-backup-'+new Date().toISOString().slice(0,10)+'.json','application/json');
$('downloadPdf').onclick=()=>{const rows=filtered();if(!rows.length)return;const lines=['CONFERE | RELATORIO DO SIMULADO - 9º ANO',`Emitido em: ${new Date().toLocaleString('pt-BR')}`,`Turma: ${$('reportClass').value||'Todas'} | Estudantes: ${rows.length}`,'','L = Linguagens; H = Humanas; N = Natureza; M = Matematica.','Cada area tem 45 questoes. Total completo: 180 questoes.','-- = cartao ainda nao lido. Branco e dupla contam como erro.','Acertos brutos; nao representa nota TRI.',''];for(const s of rows){const r=state.records[s.id],sc=score(r||{days:{}});if(lines.length%48>41)while(lines.length%48)lines.push('');const wrapped=s.name.match(/.{1,82}(?:\s|$)|.{1,82}/g)||[s.name];lines.push(...wrapped.map(l=>l.trim()),`${s.class} | ${status(r)} | Idioma: ${r?(r.lang==='es'?'Espanhol':'Ingles'):'pendente'}`);lines.push(sc.areas.map((a,i)=>`${'LHNM'[i]}: ${a.read?String(a.correct).padStart(2,' ')+'/45':'--   '}`).join('   ')+`   TOTAL: ${sc.read?sc.total+'/'+sc.read:'--'}`);if(r){const blanks=Object.values(r.days).flatMap(d=>d.answers).filter(a=>a==='').length,doubles=Object.values(r.days).flatMap(d=>d.answers).filter(a=>a==='X').length;lines.push(`Em branco: ${blanks} | Duplas: ${doubles} | ${sc.read<180?'PARCIAL':'CONCLUIDO'}`);}else lines.push('Aguardando leitura dos dois cartoes.');lines.push('--------------------------------------------------------------------------','');}download(makePdf(lines),'relatorio-simulado-9ano.pdf','application/pdf');notice('Relatório PDF gerado. Confira o arquivo nos downloads do navegador.');};
function renderKey(){const k=correctKey($('keyLanguage').value);$('keyView').innerHTML=AREAS.map((a,i)=>`<div class="key-area"><h3>${a} · ${i*45+1} a ${(i+1)*45}</h3><div class="key-grid">${k.slice(i*45,(i+1)*45).map((v,j)=>`<span>${i*45+j+1} <b>${v}</b></span>`).join('')}</div></div>`).join('');}
$('keyLanguage').onchange=renderKey;
window.addEventListener('beforeunload',e=>{if(hasWork()){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&stream){stopCamera();$('captureStart').hidden=false;}});
fillClasses();remember();renderReport();renderKey();templateStatus();

$('templateFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(busy){notice('Aguarde a leitura terminar.',true);return;}const target=$('templateDay').value;let url;try{notice('Identificando a grade do cartão em branco…');url=URL.createObjectURL(f);const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,2400/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const normalized=rectify(c.getContext('2d').getImageData(0,0,c.width,c.height));const l=detectLayout(normalized);if(l.count!==90)throw Error(`Este modelo tem ${l.count} questões. O cadastro para correção exige o cartão completo de 90. Você pode usar esta imagem para testar a leitura na aba Corrigir cartão.`);const answers=readLayout(normalized,l);if(answers.some(a=>a.answer!==''))throw Error('O modelo precisa estar com todas as respostas em branco. Use uma imagem sem preenchimentos.');if(!validLayout(l))throw Error('Grade fora do padrão reconhecido.');if(state.templates?.[target]&&!confirm('Substituir o modelo de leitura deste dia?'))return;const next=structuredClone(state);next.templates||={};next.templates[target]=l;if(persist(next)){templateStatus();notice(`Modelo do ${Number(target)+1}º dia cadastrado. As próximas fotos usarão essa grade automaticamente.`);}}catch(err){notice(err.message,true);}finally{if(url)URL.revokeObjectURL(url);e.target.value='';}};

$('useOfficial').onclick=()=>{const d=$('templateDay').value;const next=structuredClone(state);if(next.templates)delete next.templates[d];if(persist(next)){templateStatus();notice(`Modelo oficial ativado para o ${Number(d)+1}º dia. Os resultados salvos foram mantidos.`);}};

})();
