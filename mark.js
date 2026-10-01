/* Modulation — "Make a mark": the workshop, online.
   Every word from Take Part is a brush. Each mark is recorded as seeded stroke data,
   so any mark can be replayed exactly (ModMark.replay) — that is what a future shared wall would use. */
(function () {
'use strict';

const W = 960, H = 640;

/* ---------- small helpers ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function hex2rgb(h){h=String(h||'#000').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16)||0;return [n>>16&255,n>>8&255,n&255];}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const rgba=(c,a)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
const lum=c=>(0.2126*c[0]+0.7152*c[1]+0.0722*c[2])/255;
function seg(ctx,x0,y0,x1,y1,w,col,a,cap){ctx.strokeStyle=rgba(col,a);ctx.lineWidth=w;ctx.lineCap=cap||'round';ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();}
function dot(ctx,x,y,r,col,a){ctx.fillStyle=rgba(col,a);ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();}
function soft(ctx,x,y,r,col,a,hard){const g=ctx.createRadialGradient(x,y,r*(hard||0),x,y,r);g.addColorStop(0,rgba(col,a));g.addColorStop(1,rgba(col,0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill();}

/* walk along a segment, calling cb every `step` px of total path length */
function walk(st,key,a,b,step,cb){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  if(len===0)return;
  const ux=dx/len,uy=dy/len,start=st.len;
  let nx=st.nx[key]; if(nx===undefined)nx=start;
  while(nx<=start+len){const t=nx-start;cb(a.x+ux*t,a.y+uy*t,ux,uy,nx);nx+=step;}
  st.nx[key]=nx;
}

/* ---------- the brushes: one per word ---------- */
const B={};

/* how it feels */
B.tight={move(ctx,st,a,b,o){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  const spread=Math.max(2,9-st.len/110)*o.S;
  for(let k=0;k<5;k++){const off=(k-2)/2*spread;seg(ctx,a.x+nx*off,a.y+ny*off,b.x+nx*off,b.y+ny*off,1.15*o.S,o.col,.85);}
  walk(st,'tie',a,b,40,(x,y,ux,uy)=>{seg(ctx,x+uy*spread,y-ux*spread,x-uy*spread,y+ux*spread,1.6*o.S,o.col,.95);});
}};
B.burning={move(ctx,st,a,b,o){
  const hot=mix(o.col,[255,214,120],.65);
  walk(st,'d',a,b,4,(x,y)=>{soft(ctx,x,y,(15+o.rng()*8)*o.S,o.col,.2);soft(ctx,x,y,(5+o.rng()*3)*o.S,hot,.8);});
}};
B.aching={move(ctx,st,a,b,o){
  const c=mix(o.col,[120,112,120],.25);
  walk(st,'d',a,b,5,(x,y)=>{soft(ctx,x,y,24*o.S,c,.095);});
}};
B.sharp={move(ctx,st,a,b,o){
  seg(ctx,a.x,a.y,b.x,b.y,1.25*o.S,o.col,.95,'butt');
  walk(st,'s',a,b,13,(x,y,ux,uy)=>{
    const side=o.rng()<.5?1:-1,ang=Math.atan2(uy,ux)+side*(0.9+o.rng()*0.6),L=(5+o.rng()*10)*o.S;
    seg(ctx,x,y,x+Math.cos(ang)*L,y+Math.sin(ang)*L,1*o.S,o.col,.9,'butt');
  });
}};
B.prickling={move(ctx,st,a,b,o){
  walk(st,'d',a,b,3,(x,y)=>{for(let i=0;i<3;i++){const r=14*o.S*Math.sqrt(o.rng()),t=o.rng()*6.283;dot(ctx,x+Math.cos(t)*r,y+Math.sin(t)*r,(.6+o.rng()*1.5)*o.S,o.col,.75);}});
}};
B.heavy={move(ctx,st,a,b,o){
  const seglen=Math.hypot(b.x-a.x,b.y-a.y),slow=Math.max(0,1-seglen/14),c=mix(o.col,[20,16,20],.35);
  walk(st,'d',a,b,3,(x,y)=>{
    const r=(8+slow*8)*o.S;dot(ctx,x,y+r*.3,r,c,.33);
    if(o.rng()<.025){const L=(16+o.rng()*30)*o.S;seg(ctx,x,y+r*.3,x+(o.rng()-.5)*3,y+r*.3+L,(2+o.rng()*1.5)*o.S,c,.5);}
  });
}};
B.cold={move(ctx,st,a,b,o){
  seg(ctx,a.x,a.y,b.x,b.y,1.05*o.S,o.col,.9);
  walk(st,'f',a,b,20,(x,y,ux,uy)=>{
    const base=Math.atan2(uy,ux);
    for(const side of [-1,1]){
      const ang=base+side*1.05,L=(7+o.rng()*10)*o.S,ex=x+Math.cos(ang)*L,ey=y+Math.sin(ang)*L;
      seg(ctx,x,y,ex,ey,.85*o.S,o.col,.8);
      const mx=(x+ex)/2,my=(y+ey)/2,a2=base+side*.35,L2=L*.45;
      seg(ctx,mx,my,mx+Math.cos(a2)*L2,my+Math.sin(a2)*L2,.7*o.S,o.col,.7);
    }
  });
}};
B.raw={
  begin(ctx,st,p,o){st.bo=[];st.on=[];st.sh=[];for(let i=0;i<13;i++){st.bo.push((i-6)*2.4*o.S+(o.rng()-.5)*1.6);st.on.push(o.rng()>.3);st.sh.push(o.rng()*.45);}},
  move(ctx,st,a,b,o){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
    for(let i=0;i<13;i++){
      if(o.rng()<.12)st.on[i]=!st.on[i];
      if(!st.on[i])continue;
      const j=(o.rng()-.5)*1.8*o.S;
      seg(ctx,a.x+nx*(st.bo[i]+j),a.y+ny*(st.bo[i]+j),b.x+nx*(st.bo[i]+j),b.y+ny*(st.bo[i]+j),(1.1+o.rng()*.9)*o.S,mix(o.col,[20,16,20],st.sh[i]),.72,'butt');
    }
  }};
B.numb={move(ctx,st,a,b,o){
  ctx.save();ctx.globalCompositeOperation='destination-out';
  walk(st,'e',a,b,4,(x,y)=>soft(ctx,x,y,22*o.S,[0,0,0],.24));
  ctx.restore();
  seg(ctx,a.x,a.y,b.x,b.y,1*o.S,o.col,.16);
}};

/* how it moves */
B.pulsing={move(ctx,st,a,b,o){
  walk(st,'d',a,b,2,(x,y,ux,uy,d)=>{const k=Math.abs(Math.sin(d/15));soft(ctx,x,y,(5+k*14)*o.S,o.col,.1);dot(ctx,x,y,(1.5+k*6)*o.S,o.col,.6);});
}};
B.steady={move(ctx,st,a,b,o){seg(ctx,a.x,a.y,b.x,b.y,3*o.S,o.col,.92);}};
B.sudden={
  begin(ctx,st,p,o){
    for(let i=0;i<7;i++){const ang=o.rng()*6.283,L=(8+o.rng()*14)*o.S;seg(ctx,p.x,p.y,p.x+Math.cos(ang)*L,p.y+Math.sin(ang)*L,1.4*o.S,o.col,.9);}
    st.pz={x:p.x,y:p.y};st.sign=1;
  },
  move(ctx,st,a,b,o){
    walk(st,'z',a,b,9,(x,y,ux,uy)=>{
      const mag=(4+o.rng()*15)*o.S;st.sign=-st.sign;
      const z={x:x-uy*mag*st.sign,y:y+ux*mag*st.sign};
      seg(ctx,st.pz.x,st.pz.y,z.x,z.y,1.9*o.S,o.col,.92);st.pz=z;
    });
  }};
B.creeping={
  begin(ctx,st,p,o){st.pp={x:p.x,y:p.y};st.alt=1;st.k=0;},
  move(ctx,st,a,b,o){
    walk(st,'w',a,b,4,(x,y,ux,uy,d)=>{
      const off=Math.sin(d/45)*6*o.S,q={x:x-uy*off,y:y+ux*off};
      seg(ctx,st.pp.x,st.pp.y,q.x,q.y,1.6*o.S,o.col,.85);st.pp=q;
      st.k++;
      if(st.k%2===0){st.alt=-st.alt;const ang=Math.atan2(uy,ux)+st.alt*.6,L=(4+o.rng()*4)*o.S;seg(ctx,q.x,q.y,q.x+Math.cos(ang)*L,q.y+Math.sin(ang)*L,1*o.S,o.col,.7);}
    });
  }};
B.spreading={
  begin(ctx,st,p,o){st.pts=[];},
  move(ctx,st,a,b,o){
    seg(ctx,a.x,a.y,b.x,b.y,1.2*o.S,o.col,.5);
    walk(st,'p',a,b,16,(x,y)=>{st.pts.push({x,y,r:2,max:(16+o.rng()*18)*o.S});});
  },
  end(ctx,st,o){o.spread(st.pts);}
};
B['coming and going']={move(ctx,st,a,b,o){
  const k=.5+.5*Math.sin(st.len/36);
  if(k<.12)return;
  seg(ctx,a.x,a.y,b.x,b.y,2.4*o.S,o.col,.1+.85*k);
}};

/* what it does */
B.exhausting={move(ctx,st,a,b,o){
  const d=st.len,seglen=Math.hypot(b.x-a.x,b.y-a.y),w=Math.max(.7,6.5-d/70)*o.S,al=Math.max(.2,.92-d/650);
  seg(ctx,a.x,a.y,b.x,b.y,w,o.col,al);
  seg(ctx,a.x,a.y+Math.min(46,d/10),b.x,b.y+Math.min(46,(d+seglen)/10),.8*o.S,o.col,al*.35);
}};
B.frightening={move(ctx,st,a,b,o){
  const c=mix(o.col,[14,10,16],.62);
  walk(st,'b',a,b,5,(x,y)=>{
    const r=(6+o.rng()*7)*o.S,n=9;
    ctx.fillStyle=rgba(c,.82);ctx.beginPath();
    for(let i=0;i<n;i++){const ang=i/n*6.283,rr=r*(.45+o.rng()*.8),px=x+Math.cos(ang)*rr,py=y+Math.sin(ang)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
    ctx.closePath();ctx.fill();
  });
  walk(st,'c',a,b,55,(x,y)=>{const ang=o.rng()*6.283,L=(18+o.rng()*26)*o.S;seg(ctx,x,y,x+Math.cos(ang)*L,y+Math.sin(ang)*L,1.1*o.S,c,.9,'butt');});
}};
B.dulling={move(ctx,st,a,b,o){
  seg(ctx,a.x,a.y,b.x,b.y,15*o.S,mix(o.col,[136,131,126],.65),.3,'butt');
}};
B.relentless={move(ctx,st,a,b,o){
  seg(ctx,a.x,a.y,b.x,b.y,1*o.S,o.col,.3);
  walk(st,'t',a,b,5,(x,y,ux,uy)=>{seg(ctx,x-uy*8*o.S,y+ux*8*o.S,x+uy*8*o.S,y-ux*8*o.S,1.3*o.S,o.col,.85,'butt');});
}};
B.distant={move(ctx,st,a,b,o){
  const f=Math.max(.25,1-st.len/900);
  walk(st,'d',a,b,7,(x,y)=>dot(ctx,x,y,.9*o.S,o.col,.55*f));
  walk(st,'r',a,b,70,(x,y)=>{ctx.strokeStyle=rgba(o.col,.3*f);ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,7*o.S,0,6.283);ctx.stroke();});
}};
B.isolating={move(ctx,st,a,b,o){
  ctx.save();ctx.globalCompositeOperation='destination-out';
  walk(st,'e',a,b,4,(x,y)=>soft(ctx,x,y,28*o.S,[0,0,0],.8,.35));
  ctx.restore();
  walk(st,'d',a,b,13,(x,y)=>dot(ctx,x,y,1.7*o.S,o.col,.95));
}};

/* words added later in the editor get a stable look of their own */
const FALLBACK=['steady','prickling','pulsing','aching','relentless','creeping','cold'];
function brushFor(word){return B[word]||B[FALLBACK[hash(String(word))%FALLBACK.length]];}

const NOTE={
  tight:'strands drawing together, bound at intervals',burning:'a glow with a hot core',aching:'a slow, dull wash that builds up',
  sharp:'a thin cut that throws barbs',prickling:'scattered points',heavy:'dense weight that pools and drips',
  cold:'crisp lines that branch like frost',raw:'scraped, abraded bristle marks',numb:'fades whatever is under it',
  pulsing:'a beat that swells and settles',steady:'one even, unbroken line',sudden:'a jolt that bursts and kinks',
  creeping:'a slow, wobbling tendril',spreading:'seeps outward after you lift',coming_and_going:'',
  exhausting:'thins and sags as it goes',frightening:'ragged dark mass, with cracks',dulling:'a flat, blunt, greyed band',
  relentless:'unending, even ticks',distant:'faint, small, far away',isolating:'clears a space around itself'
};
NOTE['coming and going']='a line that fades in and out';

/* ---------- Modulate: blend and soften what is already there ---------- */
function modulateAt(ctx,x,y,R){
  const x0=Math.max(0,Math.floor(x-R)),y0=Math.max(0,Math.floor(y-R)),x1=Math.min(W,Math.ceil(x+R)),y1=Math.min(H,Math.ceil(y+R));
  const w=x1-x0,h=y1-y0; if(w<4||h<4)return;
  const img=ctx.getImageData(x0,y0,w,h),d=img.data,n=w*h;
  const o=new Float32Array(n*4);
  for(let i=0;i<n;i++){const a=d[i*4+3]/255;o[i*4]=d[i*4]*a;o[i*4+1]=d[i*4+1]*a;o[i*4+2]=d[i*4+2]*a;o[i*4+3]=a;}
  let s=Float32Array.from(o);
  for(let pass=0;pass<2;pass++){
    const t=new Float32Array(n*4);
    for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4,l=(yy*w+Math.max(0,xx-1))*4,r=(yy*w+Math.min(w-1,xx+1))*4;for(let c=0;c<4;c++)t[i+c]=(s[l+c]+s[i+c]+s[r+c])/3;}
    for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const i=(yy*w+xx)*4,u=(Math.max(0,yy-1)*w+xx)*4,dn=(Math.min(h-1,yy+1)*w+xx)*4;for(let c=0;c<4;c++)s[i+c]=(t[u+c]+t[i+c]+t[dn+c])/3;}
  }
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
    const i=yy*w+xx,tt=1-Math.hypot(xx+x0-x,yy+y0-y)/R;
    if(tt<=0)continue;
    const m=(tt>=.5?1:tt*2)*.6;
    const ra=o[i*4+3]+(s[i*4+3]-o[i*4+3])*m;
    if(ra<.002){d[i*4+3]=0;continue;}
    for(let c=0;c<3;c++){const rp=o[i*4+c]+(s[i*4+c]-o[i*4+c])*m;d[i*4+c]=Math.max(0,Math.min(255,rp/ra));}
    d[i*4+3]=ra*255;
  }
  ctx.putImageData(img,x0,y0);
}

/* ---------- spreading brush: the bloom that continues after you lift ---------- */
function makeSpreader(ctx,instant){
  const groups=[];let raf=0;
  function step(){let any=false;for(const g of groups)for(const p of g.pts)if(p.r<p.max){dot(ctx,p.x,p.y,p.r,g.col,.032);p.r+=.7;any=true;}return any;}
  function frame(){raf=0;for(let i=0;i<2;i++)if(!step()){groups.length=0;return;}raf=requestAnimationFrame(frame);}
  return{
    add(pts,col){groups.push({pts,col});if(instant){while(step()){}groups.length=0;}else if(!raf)raf=requestAnimationFrame(frame);},
    cancel(){groups.length=0;if(raf){cancelAnimationFrame(raf);raf=0;}},
    busy(){return groups.length>0;}
  };
}

/* ---------- a player turns stroke data into marks on any canvas context ---------- */
function makePlayer(ctx,stroke,spreader){
  const rng=mulberry32(stroke.seed),col=hex2rgb(stroke.color),S=stroke.size;
  const o={col,S,rng,spread:pts=>spreader.add(pts,col)};
  const st={len:0,nx:{}};
  let impl,last=null;
  if(stroke.tool==='modulate')impl={move(c,s,a,b){walk(s,'m',a,b,5,(x,y)=>modulateAt(c,x,y,26*S));}};
  else if(stroke.tool==='lift')impl={move(c,s,a,b){c.save();c.globalCompositeOperation='destination-out';walk(s,'l',a,b,3,(x,y)=>soft(c,x,y,17*S,[0,0,0],1,.55));c.restore();}};
  else impl=brushFor(stroke.word);
  return{
    begin(p){last=p;if(impl.begin)impl.begin(ctx,st,p,o);},
    move(p){const l=Math.hypot(p.x-last.x,p.y-last.y);if(l<.001)return;if(impl.move)impl.move(ctx,st,last,p,o);st.len+=l;last=p;},
    end(){if(impl.end)impl.end(ctx,st,o);}
  };
}
function replay(strokes,ctx){
  const sp=makeSpreader(ctx,true);
  strokes.forEach(s=>{
    const pl=makePlayer(ctx,s,sp),pts=s.pts.map(q=>({x:q[0],y:q[1]}));
    pl.begin(pts[0]);for(let i=1;i<pts.length;i++)pl.move(pts[i]);pl.end();
  });
}

/* ---------- paper ---------- */
function paintGround(ctx,g){
  ctx.fillStyle=g.hex;ctx.fillRect(0,0,W,H);
  const rng=mulberry32(4242),dark=lum(hex2rgb(g.hex))<.3;
  if(g.tex==='kraft'){
    for(let i=0;i<650;i++){const x=rng()*W,y=rng()*H,a=rng()*6.283,L=4+rng()*10;seg(ctx,x,y,x+Math.cos(a)*L,y+Math.sin(a)*L,.8,[90,66,40],.07+rng()*.05);}
    for(let i=0;i<2600;i++)dot(ctx,rng()*W,rng()*H,.7,[80,60,38],.05);
    for(let i=0;i<900;i++)dot(ctx,rng()*W,rng()*H,.7,[230,205,170],.06);
  }else if(dark){
    for(let i=0;i<3200;i++)dot(ctx,rng()*W,rng()*H,.6,[240,230,215],.035);
  }else{
    for(let i=0;i<3200;i++)dot(ctx,rng()*W,rng()*H,.6,[100,88,70],.035);
    for(let i=0;i<1400;i++)dot(ctx,rng()*W,rng()*H,.6,[255,255,255],.25);
  }
}

/* ======================================================================
   The page
   ====================================================================== */
function build(M,T){
  const {esc,mdi,arr,head}=window.ModUtil;
  const groups=arr(T.word_groups);
  const rows=groups.map((g,gi)=>`<div class="wordrow"><span class="wordrow-l">${esc(g.label)}</span><div class="wordchips">${arr(g.words).map(w=>`<button class="chip mm-chip" data-w="${esc(w)}" data-g="${gi}" aria-pressed="false">${esc(w)}</button>`).join('')}</div></div>`).join('');
  const pal=arr(M.palette).map((c,i)=>`<button class="mm-sw" data-c="${esc(c.hex)}" style="background:${esc(c.hex)}" aria-label="${esc(c.name)}" title="${esc(c.name)}" aria-pressed="${i===0}"></button>`).join('');
  const grounds=arr(M.grounds).map((g,i)=>`<button class="mm-ground" data-g="${i}" aria-pressed="${i===0}"><span class="mm-gchip" style="background:${esc(g.hex)}"></span>${esc(g.name)}</button>`).join('');
  return `<section class="block"><div class="wrap">
    ${head(M.label,M.heading)}
    <p class="measure dim" style="margin-top:-1rem;margin-bottom:.6rem">${mdi(M.intro)}</p>
    <p class="nodiag" style="margin-top:0">${esc(M.disclaimer)}</p>

    <div class="mm-layout">
      <div class="mm-guidebox">
        <div class="mm-modes" role="group" aria-label="How to use this page">
          <button class="mm-mode" data-mode="guide" aria-pressed="true">${esc(M.guide_label)}</button>
          <button class="mm-mode" data-mode="free" aria-pressed="false">${esc(M.free_label)}</button>
        </div>
        <div class="mm-guide" id="mmGuide"></div>
      </div>
      <div class="mm-stage">
        <div class="mm-canvaswrap" id="mmWrap">
          <canvas id="mmGround" width="${W}" height="${H}"></canvas>
          <canvas id="mmInk" width="${W}" height="${H}" aria-label="Drawing surface"></canvas>
        </div>
        <div class="mm-under">
          <input class="mm-title" id="mmTitle" type="text" maxlength="60" placeholder="${esc(M.title_placeholder)}" aria-label="Name your mark">
          <div class="mm-actions">
            <button class="mm-btn" id="mmUndo">${esc(M.undo_label)}</button>
            <button class="mm-btn" id="mmClear">${esc(M.clear_label)}</button>
            <button class="tp-cta" id="mmSave">${esc(M.save_label)}</button>
          </div>
        </div>
      </div>
      <div class="mm-tools">
        <div class="mm-sec"><span class="mm-l">${esc(M.words_label)}</span>${rows}<p class="mm-note" id="mmNote"></p></div>
        <div class="mm-sec"><span class="mm-l">${esc(M.tools_label)}</span>
          <div class="mm-tool2"><button class="chip mm-chip" id="mmModulate" aria-pressed="false">${esc(M.modulate_label)}</button><button class="chip mm-chip" id="mmLift" aria-pressed="false">${esc(M.lift_label)}</button></div></div>
        <div class="mm-sec"><span class="mm-l">${esc(M.colour_label)}</span><div class="mm-sws">${pal}</div></div>
        <div class="mm-sec"><span class="mm-l">${esc(M.size_label)}</span><input type="range" id="mmSize" min="0.5" max="2.5" step="0.1" value="1" aria-label="Brush size"></div>
        <div class="mm-sec"><span class="mm-l">${esc(M.paper_label)}</span><div class="mm-grounds">${grounds}</div></div>
      </div>
    </div>
    <div class="mm-reflect" id="mmReflect" hidden></div>
  </div></section>`;
}

function wire(M,T,S,root){
  const {esc,mdi,arr}=window.ModUtil;
  const $=id=>root.querySelector('#'+id);
  const groundCv=$('mmGround'),inkCv=$('mmInk');
  const gctx=groundCv.getContext('2d'),ctx=inkCv.getContext('2d',{willReadFrequently:true});
  const palette=arr(M.palette).length?arr(M.palette):[{name:'Ink',hex:'#17141a'}];
  const grounds=arr(M.grounds).length?arr(M.grounds):[{name:'Paper',hex:'#f1ece1',tex:'paper'}];
  const groups=arr(T.word_groups);
  const groupOf=w=>groups.findIndex(g=>arr(g.words).includes(w));
  const allWords=groups.reduce((a,g)=>a.concat(arr(g.words)),[]);
  const state={tool:'word',word:allWords.includes('steady')?'steady':(allWords[0]||'steady'),color:palette[0].hex,size:1,ground:0,mode:'guide',step:0};
  const strokes=[],undo=[];
  const spreader=makeSpreader(ctx,false);

  function suggested(){const s=arr(M.steps)[state.step];return state.mode==='guide'&&s?arr(s.try):[];}
  function refresh(){
    const sug=suggested(),step=arr(M.steps)[state.step];
    root.querySelectorAll('.mm-chip[data-w]').forEach(b=>{
      b.setAttribute('aria-pressed',String(state.tool==='word'&&b.dataset.w===state.word));
      b.classList.toggle('suggest',sug.includes(b.dataset.w));
    });
    $('mmModulate').setAttribute('aria-pressed',String(state.tool==='modulate'));
    $('mmLift').setAttribute('aria-pressed',String(state.tool==='lift'));
    $('mmModulate').classList.toggle('suggest',state.mode==='guide'&&!!(step&&step.modulate));
    root.querySelectorAll('.mm-sw').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.c===state.color)));
    root.querySelectorAll('.mm-ground').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===state.ground)));
    root.querySelectorAll('.mm-mode').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
    $('mmNote').textContent = state.tool==='word' ? `${state.word} — ${NOTE[state.word]||'a mark of its own'}` : (state.tool==='modulate'?M.modulate_hint:M.lift_hint);
  }
  function renderGuide(){
    const g=$('mmGuide'),steps=arr(M.steps),s=steps[state.step];
    if(state.mode!=='guide'||!s){g.hidden=true;return;}
    g.hidden=false;
    g.innerHTML=`<div class="mm-stephead"><span class="mm-stepn">${state.step+1} / ${steps.length}</span><h3>${esc(s.title)}</h3></div>
      <p class="mm-prompt">${mdi(s.prompt)}</p>
      <p class="mm-try">${esc(M.try_label)} ${arr(s.try).map(w=>`<button class="chip mm-chip" data-try="${esc(w)}">${esc(w)}</button>`).join('')}${s.modulate?`<button class="chip mm-chip" data-try-tool="modulate">${esc(M.modulate_label)}</button>`:''}</p>
      <div class="mm-stepnav"><button class="mm-btn" data-nav="-1" ${state.step===0?'disabled':''}>${esc(M.back_label)}</button><button class="mm-btn" data-nav="1" ${state.step===steps.length-1?'disabled':''}>${esc(M.next_label)}</button></div>
      <p class="dim mm-source">${esc(M.guide_source)}</p>`;
  }

  /* ----- paper ----- */
  function setGround(i){
    state.ground=i;paintGround(gctx,grounds[i]);
    const dark=lum(hex2rgb(grounds[i].hex))<.3,cl=lum(hex2rgb(state.color));
    if(dark&&cl<.18)state.color=palette.slice().sort((a,b)=>lum(hex2rgb(b.hex))-lum(hex2rgb(a.hex)))[0].hex;
    else if(!dark&&cl>.85)state.color=palette[0].hex;
    refresh();
  }

  /* ----- drawing ----- */
  let cur=null,player=null,lastPt=null,pid=null;
  const pos=ev=>{const r=inkCv.getBoundingClientRect();return{x:Math.round((ev.clientX-r.left)*(W/r.width)*10)/10,y:Math.round((ev.clientY-r.top)*(H/r.height)*10)/10};};
  function pushUndo(){
    const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').drawImage(inkCv,0,0);
    undo.push({cv:c,saved:strokes.slice()});if(undo.length>14)undo.shift();
  }
  inkCv.addEventListener('pointerdown',ev=>{
    if(ev.button>0)return;
    ev.preventDefault();
    try{inkCv.setPointerCapture(ev.pointerId);}catch(e){}
    pid=ev.pointerId;pushUndo();
    const p=pos(ev);
    cur={tool:state.tool,word:state.tool==='word'?state.word:null,color:state.color,size:state.size,seed:(Math.random()*4294967296)>>>0,pts:[[p.x,p.y]]};
    player=makePlayer(ctx,cur,spreader);player.begin(p);lastPt=p;
  });
  inkCv.addEventListener('pointermove',ev=>{
    if(!cur||ev.pointerId!==pid)return;
    ev.preventDefault();
    const evs=ev.getCoalescedEvents?ev.getCoalescedEvents():[ev];
    (evs.length?evs:[ev]).forEach(e=>{const p=pos(e);if(Math.hypot(p.x-lastPt.x,p.y-lastPt.y)<1.5)return;cur.pts.push([p.x,p.y]);player.move(p);lastPt=p;});
  });
  function finish(){
    if(!cur)return;
    if(cur.pts.length===1){const p={x:Math.round((lastPt.x+.6)*10)/10,y:lastPt.y};cur.pts.push([p.x,p.y]);player.move(p);}
    player.end();strokes.push(cur);cur=null;player=null;reflect();
  }
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>inkCv.addEventListener(t,finish));

  function doUndo(){
    const u=undo.pop();if(!u)return;
    spreader.cancel();ctx.clearRect(0,0,W,H);ctx.drawImage(u.cv,0,0);
    strokes.length=0;u.saved.forEach(s=>strokes.push(s));reflect();
  }
  function doClear(){
    if(!strokes.length)return;
    pushUndo();spreader.cancel();ctx.clearRect(0,0,W,H);strokes.length=0;reflect();
  }

  /* ----- save ----- */
  function save(){
    const title=($('mmTitle').value||'').trim(),out=document.createElement('canvas');
    out.width=W;out.height=H+58;
    const c=out.getContext('2d');
    c.drawImage(groundCv,0,0);c.drawImage(inkCv,0,0);
    c.fillStyle='#0c0a0a';c.fillRect(0,H,W,58);
    c.fillStyle='#f2ede4';c.font='italic 24px Georgia,serif';c.textAlign='left';c.fillText(title||M.untitled||'Untitled mark',22,H+37);
    c.fillStyle='#b9b0a3';c.font='14px monospace';c.textAlign='right';
    c.fillText(((S&&S.site_title)||'Modulation')+' · '+((S&&S.site_subtitle)||''),W-22,H+35);
    out.toBlob(b=>{
      const a=document.createElement('a');a.href=URL.createObjectURL(b);
      a.download=(title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'mark')+'.png';
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
    },'image/png');
  }

  /* ----- what your hand did ----- */
  function reflect(){
    const R=M.reflections||{},box=$('mmReflect'),cnt=[0,0,0];let total=0,mod=false;
    strokes.forEach(s=>{
      if(s.tool==='modulate')mod=true;
      else if(s.tool==='word'){const g=groupOf(s.word);if(g>=0&&g<3){cnt[g]++;total++;}}
    });
    if(total<2){box.hidden=true;return;}
    const max=Math.max(...cnt),lead=cnt.indexOf(max),key=max/total>=.6?['feels','moves','does'][lead]:'mixed';
    const items=[R[key]];if(mod&&R.modulated)items.push(R.modulated);
    const live=items.filter(Boolean);
    box.innerHTML=`<span class="sci">${esc(R.title||'')}</span>${live.map(i=>`<p>${mdi(i.text)}</p>`).join('')}
      <div class="mm-links">${live.filter(i=>i.link&&i.panel!==undefined&&i.panel!==null&&i.panel!=='').map(i=>`<button class="mm-btn" data-panel="${i.panel}">${esc(i.link)}</button>`).join('')}${R.takepart_link?`<a class="mm-btn" href="#takepart">${esc(R.takepart_link)}</a>`:''}</div>`;
    box.hidden=false;
  }
  $('mmReflect').addEventListener('click',e=>{
    const b=e.target.closest('[data-panel]');if(!b)return;
    location.hash='exhibition';setTimeout(()=>{if(window.__gotoPanel)window.__gotoPanel(+b.dataset.panel);},80);
  });

  /* ----- controls ----- */
  root.addEventListener('click',e=>{
    const w=e.target.closest('.mm-chip[data-w]');
    if(w){state.tool='word';state.word=w.dataset.w;refresh();return;}
    const tw=e.target.closest('[data-try]');
    if(tw){state.tool='word';state.word=tw.dataset.try;refresh();return;}
    if(e.target.closest('[data-try-tool]')){state.tool='modulate';refresh();return;}
    if(e.target.closest('#mmModulate')){state.tool='modulate';refresh();return;}
    if(e.target.closest('#mmLift')){state.tool='lift';refresh();return;}
    const sw=e.target.closest('.mm-sw');if(sw){state.color=sw.dataset.c;refresh();return;}
    const gr=e.target.closest('.mm-ground');if(gr){setGround(+gr.dataset.g);return;}
    const md=e.target.closest('.mm-mode');if(md){state.mode=md.dataset.mode;renderGuide();refresh();return;}
    const nv=e.target.closest('[data-nav]');if(nv){state.step=Math.max(0,Math.min(arr(M.steps).length-1,state.step+(+nv.dataset.nav)));renderGuide();refresh();return;}
    if(e.target.closest('#mmUndo')){doUndo();return;}
    if(e.target.closest('#mmClear')){doClear();return;}
    if(e.target.closest('#mmSave')){save();return;}
  });
  $('mmSize').addEventListener('input',e=>{state.size=+e.target.value;});
  document.addEventListener('keydown',e=>{
    if(!root.classList.contains('active'))return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/input|textarea/i.test((e.target.tagName||''))){e.preventDefault();doUndo();}
  });

  setGround(0);renderGuide();refresh();
}

window.ModMark={build,wire,replay,makePlayer,makeSpreader,paintGround,brushes:Object.keys(B),W,H,hex2rgb};
})();
