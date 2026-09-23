import {projective,classify} from './core.js';
// Local OMR for red SAS cards. No network, OCR or student-identity recognition.
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
export function detectLayout(im){
 const {width:w,height:h,data}=im,mask=new Uint8Array(w*h);
 for(let y=Math.floor(h*.40);y<h*.96;y++)for(let x=0;x<w;x++){const i=y*w+x,j=i*4,r=data[j],g=data[j+1],b=data[j+2];mask[i]=r-g>45&&r-b>18&&r>100?1:0;}
 const rings=components(mask,w,h,22).filter(c=>c.w>=16&&c.w<=36&&c.h>=16&&c.h<=36&&c.w/c.h>.7&&c.w/c.h<1.4&&c.size/(c.w*c.h)<.85).map(c=>({...c,x:(c.minX+c.maxX)/2,y:(c.minY+c.maxY)/2}));
 const bands=[];for(const c of rings.sort((a,b)=>a.y-b.y)){let row=bands.find(b=>Math.abs(b.y-c.y)<5);if(!row){row={y:c.y,items:[]};bands.push(row);}row.items.push(c);}
 const rows=[];for(const band of bands){const cells=band.items.sort((a,b)=>a.x-b.x);for(let i=0;i<=cells.length-5;i++){const five=cells.slice(i,i+5),steps=five.slice(1).map((c,j)=>c.x-five[j].x),avg=steps.reduce((a,b)=>a+b)/4;if(avg<19||avg>49||steps.some(s=>Math.abs(s-avg)>3))continue;rows.push({x:five[0].x,y:five.reduce((s,c)=>s+c.y,0)/5,step:avg,radius:five.reduce((s,c)=>s+(c.w+c.h)/4,0)/5});i+=4;}}
 const columns=[];for(const row of rows){let col=columns.find(c=>Math.abs(c.x-row.x)<7);if(!col){col={x:row.x,rows:[]};columns.push(col);}col.rows.push(row);}
 const result=[];for(const col of columns.sort((a,b)=>a.x-b.x)){if(col.rows.length<8)continue;col.rows.sort((a,b)=>a.y-b.y);const diffs=col.rows.slice(1).map((r,i)=>r.y-col.rows[i].y).sort((a,b)=>a-b),pitch=diffs[Math.floor(diffs.length/2)];if(pitch<20||pitch>55||diffs.some(d=>Math.abs(d-pitch)>4))throw Error('A grade não está completa ou nítida. Use uma foto melhor ou cadastre antes o cartão em branco de 90 questões.');result.push(...col.rows);}
 if(![40,90].includes(result.length))throw Error(`Identifiquei ${result.length} linhas de respostas. São necessárias 90 para corrigir, ou 40 para testar o modelo fornecido. Fotografe novamente ou cadastre o cartão em branco.`);
 return {version:1,width:w,height:h,rows:result,count:result.length};
}
export function validLayout(l){return !!l&&l.version===1&&l.width===1304&&l.height===1848&&l.count===90&&Array.isArray(l.rows)&&l.rows.length===90&&l.rows.every(r=>Number.isFinite(r.x)&&r.x>20&&r.x<1250&&Number.isFinite(r.y)&&r.y>700&&r.y<1800&&r.step>=19&&r.step<=49&&r.x+4*r.step<1304&&r.radius>=6&&r.radius<=18);}
export function readLayout(im,layout){
 const {data,width,height}=im;
 function red(x,y){const i=(Math.round(y)*width+Math.round(x))*4;return data[i]-data[i+1]>40&&data[i]-data[i+2]>15;}
 // Reject a saved template if printed rings no longer coincide with it.
 let checks=0,hits=0;for(const r of layout.rows)for(let o=0;o<5;o++)for(let t=0;t<12;t++){const angle=t*Math.PI/6;let found=false;for(let dr=-2;dr<=2;dr++){const x=r.x+o*r.step+Math.cos(angle)*(r.radius-1+dr),y=r.y+Math.sin(angle)*(r.radius-1+dr);if(x>=0&&y>=0&&x<width&&y<height&&red(x,y)){found=true;break;}}checks++;if(found)hits++;}
 if(hits/checks<.45)throw Error('A grade desta foto não coincide com o modelo cadastrado, ou está desfocada. Refaça a foto; se o desenho mudou, cadastre o novo cartão em branco.');
 return layout.rows.map(r=>{const values=[];for(let o=0;o<5;o++){const cx=r.x+o*r.step,cy=r.y;let paper=[];for(let t=0;t<24;t++){const a=t*Math.PI/12,x=Math.round(cx+Math.cos(a)*r.radius*1.25),y=Math.round(cy+Math.sin(a)*r.radius*1.25);if(x>=0&&y>=0&&x<width&&y<height){const at=(y*width+x)*4;paper.push(Math.max(data[at],data[at+1],data[at+2]));}}paper.sort((a,b)=>a-b);const white=paper[Math.floor(paper.length*.8)]||255;let sum=0,n=0;const radius=r.radius*.57;for(let y=Math.floor(cy-radius);y<=cy+radius;y++)for(let x=Math.floor(cx-radius);x<=cx+radius;x++){if((x-cx)**2+(y-cy)**2>radius**2)continue;const at=(y*width+x)*4;sum+=Math.max(0,1-Math.max(data[at],data[at+1],data[at+2])/white);n++;}values.push(sum/n);}return {...classify(values),values};});
}
export function automaticScan(im,template=null){const normalized=rectify(im),layout=template||detectLayout(normalized),answers=readLayout(normalized,layout);return {normalized,layout,answers};}
