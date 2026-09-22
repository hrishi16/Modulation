/* Modulation — renders every section from the JSON files in /content.
   Editors never touch this file: they change content through /admin, which writes those JSON files. */
(function () {
'use strict';

const FILES = ['settings','home','exhibition','takepart','artists','workshops','lineage','people','pages'];
const C = {};

/* ---------- tiny, safe markdown (bold, italic, links, paragraphs) ---------- */
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function mdi(s){
  return esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|#[\w-]+)\)/g,(m,t,u)=>`<a href="${u}"${u[0]==='#'?'':' target="_blank" rel="noopener"'}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>');
}
function md(s){return String(s||'').trim().split(/\n\s*\n/).map(p=>`<p>${mdi(p.trim()).replace(/\n/g,'<br>')}</p>`).join('');}
const arr = x => Array.isArray(x) ? x : [];

/* ---------- viewer (shared) ---------- */
let VIEW=null, VPOS=0;
function openViewer(items,pos){VIEW=items;VPOS=pos||0;renderViewer();const s=document.getElementById('shot');s.hidden=false;document.body.style.overflow='hidden';s.querySelector('.shot-close').focus();}
function closeViewer(){document.getElementById('shot').hidden=true;document.body.style.overflow='';}
function stepViewer(d){if(!VIEW||VIEW.length<2)return;VPOS=(VPOS+d+VIEW.length)%VIEW.length;renderViewer();}
function renderViewer(){
  const it=VIEW[VPOS];
  const tag=t=>t==='science'?'<span class="shot-tag science">Science</span>':t==='composite'?'<span class="shot-tag composite">Art on science</span>':t==='art'?'<span class="shot-tag">Art</span>':'';
  const fig=f=>`<figure><img src="${esc(f.image)}" alt="${esc(f.alt||f.caption||'')}"><figcaption>${tag(f.type)}${mdi(f.caption||'')}</figcaption></figure>`;
  const box=document.getElementById('shotImgs');
  const figs=[it].concat(it.partner?[it.partner]:[]);
  box.className='shot-imgs'+(it.partner?' pair':'');
  box.innerHTML=figs.map(fig).join('');
  const count=VIEW.length>1?`<span class="who">${it.maker?('Made by '+esc(it.maker)+' · '):''}${it.group?esc(it.group)+' · ':''}${VPOS+1} of ${VIEW.length}</span>`:(it.maker?`<span class="who">Made by ${esc(it.maker)}</span>`:'');
  document.getElementById('shotCap').innerHTML=(it.context?`<span class="shot-context">${mdi(it.context)}</span>`:'')+count;
  const multi=VIEW.length>1;
  document.getElementById('shotPrev').style.display=multi?'':'none';
  document.getElementById('shotNext').style.display=multi?'':'none';
}
document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeViewer();});
document.getElementById('shotPrev').addEventListener('click',()=>stepViewer(-1));
document.getElementById('shotNext').addEventListener('click',()=>stepViewer(1));
document.addEventListener('keydown',e=>{
  if(document.getElementById('shot').hidden)return;
  if(e.key==='Escape')closeViewer();
  else if(e.key==='ArrowRight'){e.preventDefault();stepViewer(1);}
  else if(e.key==='ArrowLeft'){e.preventDefault();stepViewer(-1);}
});
/* swipe */
(function(){let x0=null;const s=document.getElementById('shot');
  s.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;},{passive:true});
  s.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;if(Math.abs(dx)>50)stepViewer(dx<0?1:-1);x0=null;});
})();

/* ---------- section builders ---------- */
const head=(label,title)=>`<div class="head"><span class="n">${esc(label||'')}</span><h2>${esc(title||'')}</h2></div>`;

function buildHome(h){
  const pairs=arr(h.pairs);
  const film=h.film||{};
  return `<div class="wrap hero">
    <p class="eyebrow">${esc(h.eyebrow)}</p>
    <h1>${esc(h.title||'Modulation')}</h1>
    <div class="hero-sub">${mdi(h.intro)}</div>
    ${pairs.length?`<div class="dialwrap">
      <div class="stage-img">
        ${pairs.length>1?'<button class="hero-arrow hero-prev" id="heroPrev" aria-label="Previous pair">‹</button>':''}
        <img class="felt" id="feltImg" alt="">
        <img class="measured" id="measuredImg" alt="">
        <div class="stage-tint"></div>
        ${pairs.length>1?'<button class="hero-arrow hero-next" id="heroNext" aria-label="Next pair">›</button>':''}
      </div>
      <div class="dial">
        <div class="dial-labels"><span>felt</span><span class="measured-l">measured</span><span class="hero-count" id="heroCount"></span></div>
        <input type="range" min="0" max="100" value="0" class="slider" id="dial" aria-label="Move from felt to measured">
        <div class="dial-caption">
          <span class="felt-c" id="feltCap"></span>
          <span class="measured-c" id="measuredCap" style="opacity:0;position:absolute;inset:0"></span>
          <span class="dial-tag">${esc(h.dial_hint)}</span><span class="dial-tag" id="heroCredit" style="color:var(--paper-faint)"></span>
        </div>
      </div>
    </div>`:''}
    ${h.quote?`<div class="govern"><p>“${esc(h.quote)}”</p><div class="src">${esc(h.quote_source)}</div></div>`:''}
  </div>
  ${film.show&&film.youtube_id?`<section class="block"><div class="wrap">
    ${head(film.label,film.heading)}
    <a class="film" href="https://youtu.be/${esc(film.youtube_id)}" target="_blank" rel="noopener" aria-label="Watch the film on YouTube"><img src="https://i.ytimg.com/vi/${esc(film.youtube_id)}/hqdefault.jpg" alt="Film still" loading="lazy"><span class="play">▶ Watch on YouTube</span></a>
    <div class="dim md" style="font-size:.85rem;margin-top:.9rem;max-width:44rem">${md(film.note)}</div>
  </div></section>`:''}`;
}
function wireHome(h){
  const pairs=arr(h.pairs); if(!pairs.length)return;
  let i=0;
  const dial=document.getElementById('dial'),F=document.getElementById('feltImg'),M=document.getElementById('measuredImg'),
        fc=document.getElementById('feltCap'),mc=document.getElementById('measuredCap');
  function render(){const p=pairs[i];
    F.src=p.felt||'';F.alt=p.felt_alt||'';M.src=p.measured||'';M.alt=p.measured_alt||'';
    fc.innerHTML=mdi(p.felt_caption);mc.innerHTML=mdi(p.measured_caption);
    document.getElementById('heroCredit').textContent=p.credit||'';
    document.getElementById('heroCount').textContent=pairs.length>1?`Pair ${i+1} of ${pairs.length}`:'';
    dial.value=0;M.style.opacity=0;fc.style.opacity=1;mc.style.opacity=0;}
  dial.addEventListener('input',()=>{const v=dial.value/100;M.style.opacity=v;fc.style.opacity=1-v;mc.style.opacity=v;});
  const n=document.getElementById('heroNext'),p=document.getElementById('heroPrev');
  if(n)n.addEventListener('click',()=>{i=(i+1)%pairs.length;render();});
  if(p)p.addEventListener('click',()=>{i=(i-1+pairs.length)%pairs.length;render();});
  render();
}

function buildExhibition(x){
  const panels=arr(x.panels), room=x.inroom||{};
  return `<section class="block"><div class="wrap">
    ${head(x.label,x.heading)}
    <p class="measure dim" style="margin-top:-1rem;margin-bottom:2rem">${mdi(x.intro)}</p>
    <div class="panelbar" id="panelbar">${panels.map((p,i)=>`<button data-panel="${i}" aria-current="${i===0}">${esc(p.number)} ${esc(p.title)}</button>`).join('')}</div>
    <div id="panels">${panels.map((p,i)=>{
      const imgs=arr(p.images);
      const figs=imgs.map((a,j)=>`<button class="fig-btn" data-view="${i}:${j}" aria-label="View larger — ${esc(a.caption)}"><figure><img src="${esc(a.image)}" alt="${esc(a.caption)}" loading="lazy"><figcaption>${a.type&&a.type!=='art'?`<span class="fig-type ${a.type}">${a.type==='science'?'Science':'Art on science'}</span>`:''}${mdi(a.caption)}</figcaption></figure></button>`).join('');
      const strip=arr(p.strip);
      return `<div class="panel${i===0?' active':''}">
        <div class="art">${imgs.length>2?`<div class="two">${figs}</div>`:figs}</div>
        <div class="txt"><span class="sci">${esc(p.science_tag)}</span><h3>${esc(p.title)}</h3>
          <div class="science-note">${mdi(p.text)}</div>
          ${strip.length?`<div class="lh-strip"><span class="lh-label">${esc(p.strip_label)}</span><div class="lh-row">${strip.map((s,j)=>`<button class="lh-btn" data-view="${i}:${imgs.length+j}" aria-label="View larger — ${esc(s.caption)}"><img src="${esc(s.image)}" alt="${esc(s.caption)}" loading="lazy"></button>`).join('')}</div></div>`:''}
          ${arr(p.links).length?`<div class="readmore">${arr(p.links).map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} →</a>`).join('')}</div>`:''}
        </div></div>`;}).join('')}</div>
    ${room.show&&arr(room.images).length?`<div class="inroom"><span class="sci">${esc(room.label)}</span>
      <p class="dim measure">${mdi(room.text)}</p>
      <div class="inroom-row">${arr(room.images).map((r,j)=>`<button data-room="${j}" aria-label="View larger — ${esc(r.caption)}"><img src="${esc(r.image)}" alt="${esc(r.caption)}" loading="lazy"></button>`).join('')}</div></div>`:''}
  </div></section>`;
}
function wireExhibition(x){
  const panels=arr(x.panels);
  const bar=document.getElementById('panelbar'),wrap=document.getElementById('panels');
  function show(i){[...bar.children].forEach((b,j)=>b.setAttribute('aria-current',j===i));[...wrap.children].forEach((d,j)=>d.classList.toggle('active',j===i));}
  bar.addEventListener('click',e=>{const b=e.target.closest('[data-panel]');if(b)show(+b.dataset.panel);});
  /* one continuous slideshow through every panel; images paired in a panel are shown side by side */
  const slides=[];
  panels.forEach((p,pi)=>{
    const all=arr(p.images).concat(arr(p.strip));
    all.forEach((a,j)=>{
      let partner=null;
      if(!p.pair_images){} else if(a.type==='art'||a.type==='composite'){ /* pair each artwork with the science image in the same position, if the panel defines both */
        const sci=arr(p.images).filter(z=>z.type==='science'), art=arr(p.images).filter(z=>z.type!=='science');
        const k=art.indexOf(a); if(k>-1&&sci[k])partner=sci[k];
      } else if(a.type==='science' && j<arr(p.images).length){
        const sci=arr(p.images).filter(z=>z.type==='science'), art=arr(p.images).filter(z=>z.type!=='science');
        const k=sci.indexOf(a); if(k>-1&&art[k])partner=art[k];
      }
      slides.push(Object.assign({},a,{partner,group:`Panel ${p.number}`,context:p.title,_p:pi,_j:j}));
    });
  });
  wrap.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;
    const [pi,j]=b.dataset.view.split(':').map(Number);
    const pos=slides.findIndex(s=>s._p===pi&&s._j===j);openViewer(slides,pos);});
  const room=document.querySelector('.inroom-row');
  if(room)room.addEventListener('click',e=>{const b=e.target.closest('[data-room]');if(b)openViewer(arr(x.inroom.images),+b.dataset.room);});
}

function buildTakepart(t){
  return `<section class="block"><div class="wrap">
    ${head(t.label,t.heading)}
    <p class="measure dim" style="margin-top:-1rem;margin-bottom:2rem">${mdi(t.intro)}</p>
    <div class="takepart">
      <div class="bodycard">
        <svg class="bodysvg" viewBox="0 0 200 380" role="group" aria-label="Body map">
          <circle class="zone" data-zone="head" cx="100" cy="34" r="24"/>
          <rect class="zone" data-zone="chest" x="70" y="64" width="60" height="70" rx="12"/>
          <rect class="zone" data-zone="arms" x="34" y="70" width="26" height="96" rx="12"/>
          <rect class="zone" data-zone="arms2" x="140" y="70" width="26" height="96" rx="12"/>
          <rect class="zone" data-zone="abdomen" x="74" y="140" width="52" height="60" rx="12"/>
          <rect class="zone" data-zone="legs" x="72" y="206" width="24" height="150" rx="12"/>
          <rect class="zone" data-zone="legs2" x="104" y="206" width="24" height="150" rx="12"/>
        </svg>
        <p class="dim" style="font-size:.8rem;margin:.6rem 0 0">Tap the regions where it sits.</p>
      </div>
      <div>
        <p class="sci">${esc(t.choose_label)}</p>
        <div class="choices" id="choices">${arr(t.choices).map((c,i)=>`<button class="choice" data-choice="${i}" aria-pressed="false"><img src="${esc(c.image)}" alt="${esc(c.title)}"><span>${arr(c.words).map(esc).join(' · ')}</span></button>`).join('')}</div>
        <div class="readout" style="margin-top:1.4rem"><div class="composed" id="composed"></div><div class="sci-line" id="sciline"></div></div>
        <button class="btn-reset" id="resetMap">Start again</button>
        <p class="nodiag">${esc(t.disclaimer)}</p>
      </div>
    </div></div></section>`;
}
function wireTakepart(t){
  const choices=arr(t.choices),zones=new Set();let picked=null;
  const W={head:'the head',chest:'the chest',arms:'an arm',arms2:'an arm',abdomen:'the belly',legs:'a leg',legs2:'a leg'};
  const out=document.getElementById('composed'),sci=document.getElementById('sciline'),cw=document.getElementById('choices');
  function compose(){
    if(!zones.size&&picked===null){out.textContent='Mark a place on the body, and pick an image — your sentence forms here.';sci.textContent='';return;}
    const places=[...new Set([...zones].map(z=>W[z]))];const place=places.length?places.slice(0,2).join(' and '):'somewhere unnamed';
    if(picked===null){out.textContent=`It sits in ${place}. Now choose the image nearest to what it’s like.`;sci.textContent='';return;}
    const c=choices[picked],w=arr(c.words);
    out.innerHTML=`It sits in <b>${esc(place)}</b> — and it is ${w.map(x=>`<b>${esc(x)}</b>`).join(', ')}.`;sci.textContent=c.science||'';
  }
  document.querySelectorAll('#route-takepart .zone').forEach(z=>z.addEventListener('click',()=>{z.classList.toggle('on');z.classList.contains('on')?zones.add(z.dataset.zone):zones.delete(z.dataset.zone);compose();}));
  cw.addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(!b)return;picked=+b.dataset.choice;[...cw.children].forEach((x,j)=>x.setAttribute('aria-pressed',j===picked));compose();});
  document.getElementById('resetMap').addEventListener('click',()=>{zones.clear();picked=null;document.querySelectorAll('#route-takepart .zone.on').forEach(z=>z.classList.remove('on'));[...cw.children].forEach(x=>x.setAttribute('aria-pressed','false'));compose();});
  compose();
}

function buildArtist(a,statement,others){
  const secs=arr(a.sections).map((s,si)=>{
    const items=arr(s.items);
    if(s.layout==='magnifier') return `<div class="diary-sub"><span class="diary-sublabel">${esc(s.label)}</span><div class="book">${items.map(it=>`<figure class="spread"><div class="lens-host"><img src="${esc(it.image)}" alt="${esc(it.alt||it.caption)}"></div><figcaption>${mdi(it.caption)}</figcaption></figure>`).join('')}</div></div>`;
    return `<div class="diary-sub"><span class="diary-sublabel">${esc(s.label)}</span><div class="object-row">${items.map((it,j)=>`<figure><img src="${esc(it.image)}" alt="${esc(it.alt||it.caption)}" data-sec="${si}" data-i="${j}" style="cursor:zoom-in"><figcaption>${mdi(it.caption)}</figcaption></figure>`).join('')}</div></div>`;
  }).join('');
  return `<section class="block"><div class="wrap">
    ${head(a.label,a.title||a.name)}
    <div class="diary-intro serif-lead">${mdi(a.intro)}${a.details?`<p class="dim" style="font-size:1rem;margin-top:1rem;font-family:var(--body);font-style:normal">${esc(a.details)}</p>`:''}</div>
    ${secs}
    ${a.coming_soon?`<div class="statement" style="margin-top:2rem"><p class="sci" style="color:var(--paper-dim)">Coming soon</p><p style="margin:0">${mdi(a.coming_soon_text||'')}</p></div>`:''}
    ${statement?`<div class="statement"><p class="sci" style="color:var(--paper-dim)">On the invited artists</p><p style="margin:0">${mdi(statement)}</p>
      ${others.length?`<p class="dim" style="margin:.8rem 0 0;font-size:.9rem">${others.map(o=>`<a class="inline-link" href="#${esc(o.slug)}">${esc(o.name)} →</a>`).join(' · ')}</p>`:''}</div>`:''}
  </div></section>`;
}
function wireArtist(a,el){
  el.querySelectorAll('.lens-host').forEach(host=>{
    const Z=2.4,R=80,img=host.querySelector('img'),lens=document.createElement('div');lens.className='lens';host.appendChild(lens);
    function move(x,y){const r=host.getBoundingClientRect();lens.style.backgroundImage=`url("${img.currentSrc||img.src}")`;
      lens.style.backgroundSize=`${r.width*Z}px ${r.height*Z}px`;lens.style.backgroundPosition=`${-(x*Z-R)}px ${-(y*Z-R)}px`;
      lens.style.left=(x-R-5)+'px';lens.style.top=(y-R-5)+'px';}
    host.addEventListener('mousemove',e=>{const r=host.getBoundingClientRect();move(e.clientX-r.left,e.clientY-r.top);});
    host.addEventListener('touchstart',e=>{const r=host.getBoundingClientRect(),t=e.touches[0];move(t.clientX-r.left,t.clientY-r.top);lens.style.opacity=1;},{passive:true});
    host.addEventListener('touchmove',e=>{const r=host.getBoundingClientRect(),t=e.touches[0];move(t.clientX-r.left,t.clientY-r.top);},{passive:true});
    host.addEventListener('touchend',()=>{lens.style.opacity=0;});
  });
  el.addEventListener('click',e=>{const im=e.target.closest('img[data-sec]');if(!im)return;
    openViewer(arr(arr(a.sections)[+im.dataset.sec].items),+im.dataset.i);});
}

function buildWorkshops(w){
  return `<section class="block"><div class="wrap">
    ${head(w.label,w.heading)}
    <p class="measure dim" style="margin-top:-1rem;margin-bottom:2.4rem">${mdi(w.intro)}</p>
    <div id="wsList">${arr(w.workshops).map((x,wi)=>{
      const gal=arr(x.gallery);
      return `<article class="wsx">
        ${x.poster?`<div class="wsx-poster"><button data-poster="${wi}" aria-label="View poster larger"><img src="${esc(x.poster)}" alt="${esc(x.title)} poster" loading="lazy"></button><span class="cap">${esc(x.poster_caption)}</span></div>`:'<div class="wsx-poster"></div>'}
        <div class="wsx-body">
          <span class="wsx-when">${esc(x.when)}</span>
          <h3>${esc(x.title)}</h3>
          <p class="wsx-where">${esc(x.where)}</p>
          <div class="body md" style="color:var(--paper-dim);max-width:44rem">${md(x.description)}</div>
          ${arr(x.prompts).map(p=>`<div class="prompt"><span class="plabel">${esc(p.label)}</span>${mdi(p.text)}</div>`).join('')}
          ${gal.length?`<div class="wsx-gal"><span class="gl">${esc(x.gallery_label||'Images')}${gal.length>5?' — scroll →':''}</span><div class="wsx-row">${gal.map((g,i)=>`<button data-gal="${wi}:${i}" aria-label="View larger — ${esc(g.caption)}"><img src="${esc(g.image)}" alt="${esc(g.caption)}" loading="lazy"></button>`).join('')}</div></div>`:''}
          ${x.credit?`<p class="dim" style="font-size:.8rem;margin-top:1rem">${mdi(x.credit)}</p>`:''}
        </div></article>`;}).join('')}</div>
    ${w.consent_note?`<p class="dim" style="font-size:.84rem;margin-top:2.2rem;border-top:1px solid var(--line);padding-top:1rem">${mdi(w.consent_note)}</p>`:''}
  </div></section>`;
}
function wireWorkshops(w){
  const list=arr(w.workshops);
  document.getElementById('wsList').addEventListener('click',e=>{
    const p=e.target.closest('[data-poster]');
    if(p){const x=list[+p.dataset.poster];openViewer([{image:x.poster,caption:x.poster_caption||x.title}],0);return;}
    const g=e.target.closest('[data-gal]');
    if(g){const [wi,i]=g.dataset.gal.split(':').map(Number);openViewer(arr(list[wi].gallery),i);}
  });
}

function buildLineage(l){
  return `<section class="block"><div class="wrap">
    ${head(l.label,l.heading)}
    <p class="measure dim" style="margin-top:-1rem;margin-bottom:2rem">${mdi(l.intro)}</p>
    <div class="lineage">${arr(l.cards).map(c=>`<div class="lin"><h3>${esc(c.title)}</h3><div class="who">${esc(c.artist)}</div><p>${mdi(c.text)}</p>${c.url?`<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.link_label||'View ↗')}</a>`:''}</div>`).join('')}</div>
    ${l.essay?`<div class="lin-essay"><span class="sci">${esc(l.essay_label)}</span><div class="md">${md(l.essay)}</div></div>`:''}
    ${l.note?`<p class="dim" style="font-size:.82rem;margin-top:1.4rem">${mdi(l.note)}</p>`:''}
  </div></section>`;
}

function buildPeople(p){
  return `<section class="block"><div class="wrap">${head(p.label,p.heading)}
    <div class="people">${arr(p.people).map(x=>`<div class="person${x.coming_soon?' soon':''}"><h3>${esc(x.name)}</h3><div class="role">${esc(x.role)}</div><p>${mdi(x.bio)}</p></div>`).join('')}</div>
  </div></section>`;
}

function buildPage(pg){
  const blocks=arr(pg.blocks).map((b,bi)=>{
    switch(b.type){
      case 'heading': return `<div class="pg-block"><h3>${esc(b.text)}</h3></div>`;
      case 'text': return `<div class="pg-block md">${md(b.body)}</div>`;
      case 'quote': return `<div class="pg-block pg-quote"><p>“${esc(b.text)}”</p>${b.source?`<div class="src">${esc(b.source)}</div>`:''}</div>`;
      case 'image': return `<div class="pg-block pg-img"><figure><img src="${esc(b.image)}" alt="${esc(b.caption)}" data-one="${bi}"><figcaption>${mdi(b.caption)}</figcaption></figure></div>`;
      case 'gallery': return `<div class="pg-block">${b.heading?`<p class="sci">${esc(b.heading)}</p>`:''}<div class="pg-gallery">${arr(b.items).map((it,i)=>`<button data-pg="${bi}:${i}" aria-label="View larger — ${esc(it.caption)}"><img src="${esc(it.image)}" alt="${esc(it.caption)}" loading="lazy"></button>`).join('')}</div></div>`;
      case 'prompt': return `<div class="pg-block prompt"><span class="plabel">${esc(b.label)}</span>${mdi(b.text)}</div>`;
      case 'links': return `<div class="pg-block pg-links">${b.heading?`<p class="sci">${esc(b.heading)}</p>`:''}${arr(b.items).map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} →</a>`).join('')}</div>`;
      case 'video': return b.youtube_id?`<div class="pg-block pg-video"><a class="film" href="https://youtu.be/${esc(b.youtube_id)}" target="_blank" rel="noopener"><img src="https://i.ytimg.com/vi/${esc(b.youtube_id)}/hqdefault.jpg" alt="${esc(b.caption||'Video')}" loading="lazy"><span class="play">▶ Watch on YouTube</span></a>${b.caption?`<p class="dim" style="font-size:.85rem;margin-top:.6rem">${mdi(b.caption)}</p>`:''}</div>`:'';
      default: return '';
    }}).join('');
  return `<section class="block"><div class="wrap">${head(pg.label,pg.title)}<div class="pg">${blocks}</div></div></section>`;
}
function wirePage(pg,el){
  el.addEventListener('click',e=>{
    const one=e.target.closest('[data-one]');if(one){const b=arr(pg.blocks)[+one.dataset.one];openViewer([{image:b.image,caption:b.caption}],0);return;}
    const g=e.target.closest('[data-pg]');if(g){const [bi,i]=g.dataset.pg.split(':').map(Number);openViewer(arr(arr(pg.blocks)[bi].items),i);}
  });
}

/* ---------- assemble ---------- */
function build(){
  const S=C.settings||{}, N=S.nav||{}, T=S.theme||{};
  document.body.dataset.theme=T.background==='light'?'light':'dark';
  if(T.accent)document.documentElement.style.setProperty('--fluor',T.accent);
  if(T.display_font&&T.display_font!=='Fraunces')document.documentElement.style.setProperty('--display',`"${T.display_font}",Georgia,serif`);
  if(S.browser_title)document.title=S.browser_title;
  const banner=document.getElementById('banner');
  if(S.banner&&S.banner.show&&S.banner.text){banner.hidden=false;banner.textContent=S.banner.text;} else banner.hidden=true;
  document.getElementById('brand').innerHTML=`${esc(S.site_title||'Modulation')} <em>${esc(S.site_subtitle||'')}</em>`;

  const routes=[]; /* {slug,label,inNav,html,wire} */
  routes.push({slug:'home',label:N.home||'Home',inNav:true,html:buildHome(C.home||{}),wire:()=>wireHome(C.home||{})});
  if(N.show_exhibition!==false)routes.push({slug:'exhibition',label:N.exhibition||'The exhibition',inNav:true,html:buildExhibition(C.exhibition||{}),wire:()=>wireExhibition(C.exhibition||{})});
  if(N.show_takepart!==false)routes.push({slug:'takepart',label:N.takepart||'Take part',inNav:true,html:buildTakepart(C.takepart||{}),wire:()=>wireTakepart(C.takepart||{})});
  const artists=arr((C.artists||{}).artists).filter(a=>a.slug);
  artists.forEach(a=>{const others=artists.filter(o=>o!==a&&o.show_in_nav!==false);
    routes.push({slug:a.slug,label:a.nav_label||a.name,inNav:a.show_in_nav!==false,html:buildArtist(a,(C.artists||{}).statement,others),wire:el=>wireArtist(a,el)});});
  if(N.show_workshops!==false)routes.push({slug:'workshops',label:N.workshops||'Workshops',inNav:true,html:buildWorkshops(C.workshops||{}),wire:()=>wireWorkshops(C.workshops||{})});
  if(N.show_lineage!==false)routes.push({slug:'lineage',label:N.lineage||'Lineage',inNav:true,html:buildLineage(C.lineage||{}),wire:()=>{}});
  arr((C.pages||{}).pages).filter(p=>p.slug).forEach(p=>routes.push({slug:p.slug,label:p.nav_label||p.title,inNav:p.show_in_nav!==false,html:buildPage(p),wire:el=>wirePage(p,el)}));
  if(N.show_people!==false)routes.push({slug:'people',label:N.people||'Contributors',inNav:true,html:buildPeople(C.people||{}),wire:()=>{}});

  const main=document.getElementById('main');
  main.innerHTML=routes.map(r=>`<div class="route" id="route-${esc(r.slug)}">${r.html}</div>`).join('');
  routes.forEach(r=>{try{r.wire(document.getElementById('route-'+r.slug));}catch(err){console.error('Section failed:',r.slug,err);}});
  document.getElementById('tabs').innerHTML=routes.filter(r=>r.inNav).map(r=>`<button data-go="${esc(r.slug)}">${esc(r.label)}</button>`).join('');

  const F=S.footer||{};
  document.getElementById('footer').innerHTML=`<div class="wrap">
    <div class="foot-grid"><div class="grant"><p class="sci" style="color:var(--paper-dim)">Supported by</p>
      <p style="margin:0 0 .2rem">${esc(F.supported_by)}</p>
      ${F.logo?`<span class="logo-chip"><img src="${esc(F.logo)}" alt="Srishti Manipal · MAHE Bengaluru"></span>`:''}</div></div>
    ${arr(F.links).length?`<div class="credit-line" style="color:var(--paper-dim)">Elsewhere — ${arr(F.links).map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener" style="color:var(--fluor)">${esc(l.label)}</a>`).join(' · ')}</div>`:''}
    ${F.note?`<div class="credit-line">${esc(F.note)}</div>`:''}</div>`;

  const slugs=routes.map(r=>r.slug);
  function go(slug,scroll){
    if(!slugs.includes(slug))slug='home';
    document.querySelectorAll('.route').forEach(r=>r.classList.toggle('active',r.id==='route-'+slug));
    document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.go===slug?'true':'false'));
    document.getElementById('tabs').classList.remove('open');
    if(scroll!==false)window.scrollTo(0,0);
  }
  document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)location.hash=b.dataset.go;});
  window.addEventListener('hashchange',()=>go(location.hash.slice(1)));
  go(location.hash.slice(1)||'home',false);
}
document.getElementById('menuToggle').addEventListener('click',()=>document.getElementById('tabs').classList.toggle('open'));

/* ---------- load content (no-cache so edits show as soon as the host has redeployed) ---------- */
Promise.all(FILES.map(f=>fetch(`content/${f}.json?v=${Date.now()}`).then(r=>r.ok?r.json():{}).catch(()=>({}))))
  .then(res=>{FILES.forEach((f,i)=>C[f]=res[i]);build();})
  .catch(err=>{document.getElementById('main').innerHTML='<p class="loading wrap">The site could not load its content.</p>';console.error(err);});
})();
