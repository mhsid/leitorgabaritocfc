import {projective,classify} from './core.js';
// Local OMR for color and grayscale SAS cards. No network, OCR or student-identity recognition.
export function components(mask,w,h,minSize=8){
 const out=[],seen=new Uint8Array(w*h),queue=new Int32Array(w*h);
 for(let i=0;i<mask.length;i++){if(!mask[i]||seen[i])continue;let head=0,tail=1;queue[0]=i;seen[i]=1;let minX=w,minY=h,maxX=0,maxY=0,sx=0,sy=0;
 while(head<tail){const at=queue[head++],x=at%w,y=(at/w)|0;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);sx+=x;sy+=y;
 for(const n of [x>0?at-1:-1,x<w-1?at+1:-1,y>0?at-w:-1,y<h-1?at+w:-1])if(n>=0&&mask[n]&&!seen[n]){seen[n]=1;queue[tail++]=n;}}
 if(tail>=minSize)out.push({x:sx/tail,y:sy/tail,w:maxX-minX+1,h:maxY-minY+1,minX,minY,maxX,maxY,size:tail});}
 return out;
}
export function findMarkers(im){
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
export function rectify(im){
 const p=findMarkers(im),map=projective(p),width=1304,height=1848,data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const a=map((x-53.5)/1195.5,(y-53.5)/1726.5),at=(y*width+x)*4,xx=Math.round(a.x),yy=Math.round(a.y);if(xx<0||yy<0||xx>=im.width||yy>=im.height){data[at]=data[at+1]=data[at+2]=data[at+3]=255;continue;}const src=(yy*im.width+xx)*4;data[at]=im.data[src];data[at+1]=im.data[src+1];data[at+2]=im.data[src+2];data[at+3]=255;}
 return {width,height,data,markers:p};
}
export function inkMap(im){
 const {width:w,height:h,data}=im,gray=new Float32Array(w*h),integral=new Float64Array((w+1)*(h+1));
 for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){const i=y*w+x,j=i*4;gray[i]=.299*data[j]+.587*data[j+1]+.114*data[j+2];row+=gray[i];integral[(y+1)*(w+1)+x+1]=integral[y*(w+1)+x+1]+row;}}
 const mask=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const x0=Math.max(0,x-18),x1=Math.min(w,x+19),y0=Math.max(0,y-18),y1=Math.min(h,y+19);const mean=(integral[y1*(w+1)+x1]-integral[y0*(w+1)+x1]-integral[y1*(w+1)+x0]+integral[y0*(w+1)+x0])/((x1-x0)*(y1-y0));mask[y*w+x]=gray[y*w+x]<mean-13?1:0;}return mask;
}
export function detectLayout(im){
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
export function validLayout(l){return !!l&&l.version===1&&l.width===1304&&l.height===1848&&l.count===90&&Array.isArray(l.rows)&&l.rows.length===90&&l.rows.every(r=>Number.isFinite(r.x)&&r.x>20&&r.x<1250&&Number.isFinite(r.y)&&r.y>700&&r.y<1800&&r.step>=19&&r.step<=49&&r.x+4*r.step<1304&&r.radius>=6&&r.radius<=18);}
export function readLayout(im,layout){
 const {data,width,height}=im;
 // Drop out red form printing but preserve dark blue/black handwriting.
 const light=at=>data[at]-data[at+1]>45&&data[at]-data[at+2]>18?Math.max(data[at],data[at+1],data[at+2]):.299*data[at]+.587*data[at+1]+.114*data[at+2];
 const ink=inkMap(im);function printedInk(x,y){return ink[Math.round(y)*width+Math.round(x)]===1;}
 // Reject a saved template if printed rings no longer coincide with it.
 let checks=0,hits=0,badRows=0;for(const r of layout.rows){let rowHits=0;for(let o=0;o<5;o++)for(let t=0;t<12;t++){const angle=t*Math.PI/6;let found=false;for(let dr=-2;dr<=2;dr++){const x=r.x+o*r.step+Math.cos(angle)*(r.radius-1+dr),y=r.y+Math.sin(angle)*(r.radius-1+dr);if(x>=0&&y>=0&&x<width&&y<height&&printedInk(x,y)){found=true;break;}}checks++;if(found){hits++;rowHits++;}}if(rowHits/60<.35)badRows++;}
 if(hits/checks<.45||badRows>Math.floor(layout.count*.03))throw Error('A grade desta foto não coincide com o modelo cadastrado, ou está desfocada. Refaça a foto; se o desenho mudou, cadastre o novo cartão em branco.');
 return layout.rows.map(r=>{const values=[];for(let o=0;o<5;o++){const cx=r.x+o*r.step,cy=r.y;let paper=[];for(let t=0;t<24;t++){const a=t*Math.PI/12,x=Math.round(cx+Math.cos(a)*r.radius*1.25),y=Math.round(cy+Math.sin(a)*r.radius*1.25);if(x>=0&&y>=0&&x<width&&y<height){const at=(y*width+x)*4;paper.push(light(at));}}paper.sort((a,b)=>a-b);const white=paper[Math.floor(paper.length*.8)]||255;let sum=0,n=0;const radius=r.radius*.57;for(let y=Math.floor(cy-radius);y<=cy+radius;y++)for(let x=Math.floor(cx-radius);x<=cx+radius;x++){if((x-cx)**2+(y-cy)**2>radius**2)continue;const at=(y*width+x)*4;sum+=Math.max(0,1-light(at)/white);n++;}values.push(sum/n);}const sorted=[...values].sort((a,b)=>b-a);const result=sorted[0]<.32&&sorted[0]-sorted[1]<.14?{answer:'',status:'Em branco'}:classify(values);return {...result,values};});
}
export function automaticScan(im,template=null){
 const normalized=rectify(im);
 if(template)return {normalized,layout:template,answers:readLayout(normalized,template)};
 // The official layout is already installed. Verify the whole grid before using it.
 try{return {normalized,layout:OFFICIAL_LAYOUT,answers:readLayout(normalized,OFFICIAL_LAYOUT)};}catch{}
 const layout=detectLayout(normalized);return {normalized,layout,answers:readLayout(normalized,layout)};
}

// Geometry only, extracted from the official 90-question blank; no personal data.
export const OFFICIAL_LAYOUT = {"version":1,"width":1304,"height":1848,"rows":[{"x":127.5,"y":887,"step":31,"radius":12.3},{"x":127.5,"y":918.5,"step":31,"radius":12.05},{"x":127.5,"y":949.5,"step":31,"radius":12.1},{"x":127.5,"y":980.5,"step":31,"radius":12.05},{"x":127.5,"y":1011.5,"step":31,"radius":12.55},{"x":127.5,"y":1042.5,"step":31,"radius":12.05},{"x":127.5,"y":1073.5,"step":31,"radius":12.05},{"x":127.5,"y":1104.5,"step":31,"radius":12.05},{"x":127.5,"y":1136,"step":31,"radius":12.3},{"x":127.5,"y":1166.5,"step":31,"radius":12.05},{"x":127.5,"y":1197.5,"step":31,"radius":12.05},{"x":127.5,"y":1228.5,"step":31,"radius":12.05},{"x":127.5,"y":1260,"step":31,"radius":12.3},{"x":127.5,"y":1291,"step":31,"radius":11.8},{"x":127.5,"y":1321.5,"step":31,"radius":12.05},{"x":127.5,"y":1352.5,"step":31,"radius":12.05},{"x":127.5,"y":1384,"step":31,"radius":12.3},{"x":127.5,"y":1415.5,"step":31,"radius":12.05},{"x":127.5,"y":1445.5,"step":31,"radius":12.05},{"x":127.5,"y":1476.5,"step":31,"radius":12.05},{"x":127.5,"y":1508,"step":31,"radius":12.3},{"x":127.5,"y":1539.5,"step":31,"radius":12.05},{"x":127.5,"y":1569.5,"step":31,"radius":12.05},{"x":127.5,"y":1600.5,"step":31,"radius":12},{"x":365.5,"y":887,"step":31,"radius":12.25},{"x":365.5,"y":918.5,"step":31,"radius":11.95},{"x":365.5,"y":949.5,"step":31,"radius":12.1},{"x":365.5,"y":980.5,"step":31,"radius":12},{"x":365.5,"y":1011.5,"step":31,"radius":12.6},{"x":365.5,"y":1042.5,"step":31,"radius":11.95},{"x":365.5,"y":1073.5,"step":31,"radius":12.1},{"x":365.5,"y":1104.5,"step":31,"radius":12},{"x":365.5,"y":1136,"step":31,"radius":12.35},{"x":365.5,"y":1166.5,"step":31,"radius":11.95},{"x":365.5,"y":1197.5,"step":31,"radius":12.1},{"x":365.5,"y":1228.5,"step":31,"radius":12},{"x":365.5,"y":1260,"step":31,"radius":12.35},{"x":365.5,"y":1291,"step":31,"radius":11.7},{"x":365.5,"y":1321.5,"step":31,"radius":12.1},{"x":365.5,"y":1352.5,"step":31,"radius":12},{"x":365.5,"y":1384,"step":31,"radius":12.35},{"x":365.5,"y":1415.5,"step":31,"radius":12},{"x":365.5,"y":1445.5,"step":31,"radius":12.1},{"x":365.5,"y":1476.5,"step":31,"radius":12},{"x":365.5,"y":1508,"step":31,"radius":12.35},{"x":365.5,"y":1539.5,"step":31,"radius":11.95},{"x":365.5,"y":1569.5,"step":31,"radius":12.1},{"x":365.5,"y":1600.5,"step":31,"radius":11.95},{"x":603.5,"y":887,"step":31,"radius":12.3},{"x":603.5,"y":918.5,"step":31,"radius":12.05},{"x":604,"y":949.5,"step":31,"radius":12.1},{"x":603.5,"y":980.5,"step":31,"radius":12.05},{"x":603.5,"y":1011.5,"step":31,"radius":12.55},{"x":603.5,"y":1042.5,"step":31,"radius":12.05},{"x":604,"y":1073.5,"step":31,"radius":12.1},{"x":603.5,"y":1104.5,"step":31,"radius":12.05},{"x":603.5,"y":1136,"step":31,"radius":12.3},{"x":603.5,"y":1166.5,"step":31,"radius":12.05},{"x":604,"y":1197.5,"step":31,"radius":12.1},{"x":603.5,"y":1228.5,"step":31,"radius":12.05},{"x":604,"y":1260,"step":31,"radius":12.35},{"x":603.5,"y":1291,"step":31,"radius":11.8},{"x":603.5,"y":1321.5,"step":31,"radius":12.05},{"x":603.5,"y":1352.5,"step":31,"radius":12.05},{"x":604,"y":1384,"step":31,"radius":12.35},{"x":603.5,"y":1415.5,"step":31,"radius":12.05},{"x":604,"y":1445.5,"step":31,"radius":12.1},{"x":603.5,"y":1476.5,"step":31,"radius":12.05},{"x":604,"y":1508,"step":31,"radius":12.35},{"x":603.5,"y":1539.5,"step":31,"radius":12.05},{"x":604,"y":1569.5,"step":31,"radius":12.1},{"x":603.5,"y":1600.5,"step":31,"radius":12},{"x":842,"y":887,"step":31,"radius":12.3},{"x":842,"y":918.5,"step":31,"radius":12.05},{"x":842,"y":949.5,"step":31,"radius":12.1},{"x":842,"y":980.5,"step":31,"radius":12.05},{"x":842,"y":1011.5,"step":31,"radius":12.6},{"x":842,"y":1042.5,"step":31,"radius":12.05},{"x":842,"y":1073.5,"step":31,"radius":12.1},{"x":842,"y":1104.5,"step":31,"radius":12.05},{"x":842,"y":1136,"step":31,"radius":12.35},{"x":842,"y":1166.5,"step":31,"radius":12.05},{"x":842,"y":1197.5,"step":31,"radius":12.1},{"x":842,"y":1228.5,"step":31,"radius":12.05},{"x":842,"y":1260,"step":31,"radius":12.35},{"x":842,"y":1291,"step":31,"radius":11.8},{"x":842,"y":1321.5,"step":31,"radius":12.1},{"x":842,"y":1352.5,"step":31,"radius":12.05},{"x":842,"y":1384,"step":31,"radius":12.35},{"x":842,"y":1415.5,"step":31,"radius":12.05}],"count":90};
