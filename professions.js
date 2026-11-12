/* Professions page (Alchemy / Tailoring): recipes from data/<prof>.json, hourly AH prices from
   data/prices.json + data/history.json (written by the "AH prices" GitHub Action). */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const load=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const money=c=>{if(c==null||isNaN(c))return '—';c=Math.round(c);const neg=c<0;c=Math.abs(c);const g=Math.floor(c/1e4),s=Math.floor(c/100)%100,cc=c%100;
 return (neg?'-':'')+(g?g+'g ':'')+(g||s?s+'s':'')+(!g&&cc?(s?' ':'')+cc+'c':'')||'0c'};
const AH_CUT=0.95;
// rough vendor prices, only used until the hourly job has read the real ones
const VENDOR_FALLBACK={};
const PROFS={
 alchemy:{name:'Alchemy',key:'alc',file:'data/alchemy.json',thing:'potion',things:'potions',raw:'herb',raws:'herbs',
  cats:['All','Potion','Elixir','Flask','Oil','Transmute','Other'],farm:'I farm my herbs',shop:[['Free Action Potion',5]],search:'potion or herb…',pvp:true,
  logo:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f6c9da" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7 15h10"/></svg>'},
 cooking:{name:'Cooking',key:'ckg',file:'data/cooking.json',thing:'dish',things:'dishes',raw:'fish',raws:'fish',
  cats:['All','Fish','Meat','Drink','Feast','Other'],farm:'I catch my own fish',shop:[['Smoked Desert Dumplings',10]],search:'dish or fish…',pvp:false,
  logo:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f6c9da" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11h14a0 0 0 0 1 0 0 6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z"/><path d="M17 12h4"/><path d="M8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3"/></svg>'},
 tailoring:{name:'Tailoring',key:'tlr',file:'data/tailoring.json',thing:'item',things:'items',raw:'cloth',raws:'cloth',
  cats:['All','Bolt','Bag','Shirt','Armor','Other'],farm:'I farm my cloth',shop:[['Bolt of Runecloth',10]],search:'item or cloth…',pvp:false,
  logo:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f6c9da" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19 19 5"/><circle cx="17.5" cy="6.5" r="1.6"/><path d="M4 12c3-3 5 3 8 0s5 3 8 0"/></svg>'}};
const PID=(new URLSearchParams(location.search).get('p')||(()=>{try{return localStorage.getItem('prof-last')}catch(e){return null}})()||'alchemy').toLowerCase();
const P=PROFS[PID]||PROFS.alchemy;try{localStorage.setItem('prof-last',PROFS[PID]?PID:'alchemy')}catch(e){}
const K=k=>P.key+'-'+k;
const cap=w=>w[0].toUpperCase()+w.slice(1);

let A=null,PR=null,H=null,SRC='';
const S={tab:load(K('tab'),'top'),skill:load(K('skill'),null),sort:'profit',dir:-1,filters:load(K('filters'),{can:true,profit:true}),cat:'All',q:'',farm:load(K('farm'),false),make:load(K('make'),false),
 open:null,topSort:'price',bags:load(K('bags'),{}),shop:load(K('shop'),P.shop),bought:load(K('bought'),{})};

/* ---------- prices ---------- */
function syncedPrices(){ // fallback: prices from the ForeverGuide addon sync, if any
 let best=null;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!/^fg-sync-/.test(k))continue;
  const d=load(k,null);if(d&&d.pr&&d.pr.length&&(!best||d.t>best.t))best=d}
 if(!best)return null;const items={};best.pr.forEach(([n,v])=>items[n]={mkt:v,min:v,qty:null});
 return {updated:best.t,realm:best.r,items,vendor:{},synced:true};
}
const sell=n=>{const it=PR&&PR.items[n];return it?(it.mkt||it.min||null):null};
const qtyOf=n=>{const it=PR&&PR.items[n];return it?it.qty:null};
const perDay=n=>{const it=PR&&PR.items[n];return it&&it.perDay?Math.round(it.perDay):null};
const vendor=n=>(PR&&PR.vendor&&PR.vendor[n])||VENDOR_FALLBACK[n]||null;
const RECIPE={},PRODUCT={};
const O=r=>r.o||r.n; // what a recipe makes (transmutes are named differently from their bar)
// cheapest way to get a mat: vendor, AH, or crafting it yourself (e.g. Blackmouth Oil)
// "I farm my herbs / cloth / fish": set on any profession's page, it counts everywhere
// (herbs you farm are free in the potions tailoring needs too)
const farmed=n=>Object.entries(PROFS).some(([id,pf])=>{const on=id===PID?S.farm:load(pf.key+'-farm',false);return on&&(RAWS[id]||[]).includes(n)});
function matCost(n,depth=0){
 if(farmed(n))return {c:0,how:'farmed'};
 const v=vendor(n);if(v!=null)return {c:v,how:'vendor'};
 const ah=sell(n),r=PRODUCT[n];
 const cc=r&&depth<3?recipeCost(r,depth+1):null;const made=cc&&cc.c!=null?cc.c/(r.y||1):null;
 const who=r&&r.prof&&r.prof!==PID?PROFS[r.prof].name.toLowerCase():'';
 if(S.make&&made!=null)return {c:made,how:'you make it'+(who?' ('+who+')':'')};       // making components yourself
 if(ah!=null)return {c:ah,how:'AH'};
 if(made!=null)return {c:made,how:'craft it (none on AH)'+(who?' · '+who:'')};
 return {c:null,how:'no price'};
}
// profit both ways, for the breakdown
function calcBoth(r){const was=S.make;S.make=false;const buy=calc(r);S.make=true;const make=calc(r);S.make=was;return {buy,make}}
const RAWS={};
function recipeCost(r,depth=0){let c=0,known=true;const parts=r.m.map(([q,n])=>{const m=matCost(n,depth);if(m.c==null)known=false;else c+=q*m.c;return {q,n,...m}});
 return {c:known?c:null,parts}}
function calc(r){const y=r.y||1,one=sell(O(r)),s=one!=null?one*y:null,cost=recipeCost(r);const profit=s!=null&&cost.c!=null?s*AH_CUT-cost.c:null;
 return {s,cost:cost.c,parts:cost.parts,profit,margin:profit!=null&&cost.c?profit/cost.c*100:null,qty:qtyOf(O(r))}}
const skill=()=>S.skill??1;
const canMake=r=>r.sk<=skill();
const trained=r=>/^(Trainer|Auto)$/.test(r.src||'');

/* ---------- history helpers ---------- */
const hist=n=>{const h=(H&&H.p&&H.p[n])||[];if(h.filter(v=>v!=null).length>=6)return h;const it=PR&&PR.items[n];return it&&it.d?it.d.map(x=>x[1]):h};
function change(n,hours){const raw=(H&&H.p&&H.p[n])||[];if(raw.filter(v=>v!=null).length<hours/2){const it=PR&&PR.items[n];const d=it&&it.d||[];if(d.length>=2){const a=d[d.length-2][1],b=d[d.length-1][1];return a?(b-a)/a*100:null}return null}const h=raw.filter(v=>v!=null);if(h.length<2)return null;const now=h[h.length-1],then=h[Math.max(0,h.length-1-hours)];return then?(now-then)/then*100:null}
function spark(vals,col){vals=vals.filter(v=>v!=null);if(vals.length<2)return '<div class="note">trend shows after a few hourly updates</div>';
 const w=150,h=36,mx=Math.max(...vals),mn=Math.min(...vals);
 const pts=vals.map((v,i)=>`${(i*(w/(vals.length-1))).toFixed(1)},${(h-((v-mn)/((mx-mn)||1))*h).toFixed(1)}`).join(' ');
 return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="price trend"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`}
// "might jump": supply drying up, steady climb, or a weekday spike
function jumpSignals(n){
 const it=PR&&PR.items[n],why=[];
 if(it&&it.mkt){
  if(it.m30&&it.mkt<it.m30*0.8)why.push(`${Math.round((1-it.mkt/it.m30)*100)}% under its 30-day median (${money(it.m30)})`);
  if(it.perDay&&it.qty!=null&&it.perDay>=2&&it.qty<it.perDay*1.5)why.push(`Only ${it.qty} listed but ~${Math.round(it.perDay)} sell a day`);
  if(it.m7&&it.m30&&it.m7>it.m30*1.1)why.push('Price trending up this week');
 }
 if(!H||!H.t||H.t.length<24)return why.length?{why,high:it.hi30||it.mkt}:null;
 const p=hist(n),q=(H.q&&H.q[n])||[];
 const qs=q.filter(v=>v!=null),qNow=qs[qs.length-1],qAvg=qs.reduce((a,b)=>a+b,0)/(qs.length||1);
 if(qs.length>=24&&qAvg>=5&&qNow<qAvg*0.5)why.push(`Only ${qNow} on the AH (usually ~${Math.round(qAvg)})`);
 const days=[];for(let i=p.length;i>0;i-=24){const d=p.slice(Math.max(0,i-24),i).filter(v=>v!=null).sort((a,b)=>a-b);if(d.length)days.unshift(d[Math.floor(d.length/2)])}
 if(days.length>=3){const l=days.slice(-3);if(l[0]<l[1]&&l[1]<l[2])why.push('Price up 3 days in a row')}
 if(H.t.length>=24*6){const by={};H.t.forEach((t,i)=>{const v=p[i];if(v==null)return;const d=new Date(t*1000).getDay();(by[d]=by[d]||[]).push(v)});
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length,all=avg(p.filter(v=>v!=null));const tmr=(new Date().getDay()+1)%7;
  if(by[tmr]&&avg(by[tmr])>all*1.1)why.push(`Usually spikes on ${['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays'][tmr]}`)}
 if(!why.length)return null;
 const high=Math.max(it&&it.hi30||0,...p.filter(v=>v!=null));return {why,high};
}

/* ---------- 1. top sellers ---------- */
function renderTop(){
 const list=A.recipes.map(r=>({r,...calc(r)})).filter(x=>x.s!=null&&(!S.filters.topCan||canMake(x.r)));
 const key={price:x=>x.s,listed:x=>x.qty||0,jump:x=>change(O(x.r),24)??-1e9}[S.topSort];
 list.sort((a,b)=>key(b)-key(a));
 const cards=list.slice(0,8).map((x,i)=>{const ch=change(O(x.r),24);const col=ch==null?'#a7a0a5':ch>=0?'#7fd8a8':'#ff8f8f';
  return `<div class="card ${i===0?'first':''}"><div class="mrow"><span class="soft" style="font-weight:700">#${i+1}</span><span class="soft" style="font-size:11.5px">${x.r.pvp?'PvP':''}${x.qty!=null?` · ${x.qty} on AH`:''}</span></div>
  <div style="font-size:15.5px;font-weight:600">${esc(x.r.n)}</div>
  <div style="display:flex;align-items:baseline;gap:10px"><span class="big">${money(x.s)}</span>${ch!=null?`<span style="font-weight:700;font-size:13px;color:${col}">${ch>=0?'+':''}${ch.toFixed(0)}% 24h</span>`:''}</div>
  ${spark(hist(O(x.r)).slice(-24),col)}</div>`}).join('');
 const jumps=list.map(x=>({x,j:jumpSignals(O(x.r))})).filter(o=>o.j).slice(0,3);
 const jc=jumps.map(({x,j})=>`<div class="card jump"><div class="mrow"><span style="font-size:15.5px;font-weight:600">${esc(x.r.n)}</span><span class="badge lock">MIGHT JUMP</span></div>
  <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><span class="big" style="font-size:22px">${money(x.s)}</span>${j.high>x.s*1.03?`<span class="soft" style="font-size:13px">recent high</span><span class="up" style="font:700 18px 'Space Grotesk',Inter,sans-serif">${money(j.high)}</span>`:''}</div>
  ${spark(hist(O(x.r)),'#ffb26b')}<div class="lbl" style="color:var(--soft)">WHY</div><ul style="margin:0;padding-left:18px;font-size:13px">${j.why.map(w=>`<li>${esc(w)}</li>`).join('')}</ul>
  <div class="note" style="margin-top:2px">Tip: craft or buy now, list when it peaks.</div></div>`).join('');
 const enough=H&&H.t&&H.t.length>=24;
 $('[data-p=top]').innerHTML=`<h2>Top sellers</h2><p class="sub">The priciest ${P.things} on your AH right now, and which way they're heading.</p>
 <div class="chips">${chip('Price','topSort','price')}${chip('Most listed','topSort','listed')}${chip('Biggest jump (24h)','topSort','jump')}<span class="r">${fchip('Only ones I can make','topCan')}</span></div>
 ${list.length?`<div class="cards">${cards}</div>`:'<div class="callout">No prices yet.</div>'}
 <div class="sec"><div><h3 style="color:var(--warn)">Might jump soon</h3><div class="sub">Guesses, not promises: supply drying up, a price that keeps climbing, or one that spikes on certain days.</div></div><span class="soft" style="font-size:12px">from the last 7 days of hourly prices</span></div>
 ${jc?`<div class="cards three" style="margin-top:12px">${jc}</div>`:`<div class="callout">${enough?'Nothing looks ready to jump right now. Check back after the next few updates.':'Needs about a day of hourly prices before it can spot anything. It fills in on its own.'}</div>`}`;
 document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{S[b.dataset.k]=b.dataset.v;renderTop()});
 $('[data-p=top]').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.filters[b.dataset.f]=!S.filters[b.dataset.f];store(K('filters'),S.filters);renderTop()});
}

/* ---------- 2. profit board ---------- */
const CATS=P.cats;
function renderProfit(){
 let rows=A.recipes.map(r=>({r,...calc(r)}));
 const f=S.filters,q=S.q.trim().toLowerCase();
 rows=rows.filter(x=>(!f.can||canMake(x.r))&&(!f.pvp||x.r.pvp)&&(!f.train||/^(Trainer|Auto)$/.test(x.r.src))&&(!f.profit||(x.profit!=null&&x.profit>0))&&(S.cat==='All'||x.r.c===S.cat)
  &&(!q||x.r.n.toLowerCase().includes(q)||x.r.m.some(([,m])=>m.toLowerCase().includes(q))));
 const key={name:x=>x.r.n,skill:x=>x.r.sk,sell:x=>x.s??-1e12,cost:x=>x.cost??1e12,profit:x=>x.profit??-1e12,margin:x=>x.margin??-1e12,qty:x=>x.qty??-1}[S.sort];
 rows.sort((a,b)=>{const ka=key(a),kb=key(b);return (ka>kb?1:ka<kb?-1:0)*S.dir});
 const th=(k,t,n)=>`<th class="${n?'n':''}" data-sort="${k}">${t}${S.sort===k?(S.dir<0?' ▾':' ▴'):''}</th>`;
 const body=rows.map(x=>{const r=x.r,open=S.open===r.n,pc=x.profit==null?'soft':x.profit>0?'up':'down';
  let h=`<tr class="row ${open?'open':''}" data-r="${esc(r.n)}"><td><div class="pname">${esc(r.n)}${!canMake(r)?`<span class="badge lock">NEEDS ${r.sk}</span>`:trained(r)?'<span class="badge ok">CAN MAKE</span>':'<span class="badge pvp">NEEDS RECIPE</span>'}</div><div class="psub">${P.name} ${r.sk} · ${r.c}${trained(r)?'':' · '+esc(r.src||'recipe source unknown')}${r.pvp?' · PvP':''}${perDay(O(r))?` · ~${perDay(O(r))} sell a day`:''}</div></td>
  <td class="n">${money(x.s)}</td><td class="n soft">${money(x.cost)}</td><td class="n ${pc}" style="font-weight:700">${money(x.profit)}</td><td class="n ${pc}">${x.margin!=null?x.margin.toFixed(0)+'%':'—'}</td><td class="n soft">${x.qty!=null?x.qty+' on AH':'—'}</td></tr>`;
  if(open){const mats=x.parts.map(p=>`<div class="mrow"><span>${p.q}× ${esc(p.n)}</span><span class="soft">${p.how}${p.c!=null?' · '+money(p.c)+' each':''}</span><span>${p.c!=null?money(p.c*p.q):'—'}</span></div>`).join('');
   h+=`<tr class="open"><td colspan="6" style="padding:0 10px 12px"><div class="detail"><div><div class="lbl">MATS (CHEAPEST WAY)</div>${mats}</div>
   <div><div class="lbl">THE MATH</div><div style="font-size:13px;line-height:1.7">Sells for <b>${money(x.s)}</b> − 5% AH cut = <b>${money(x.s!=null?x.s*AH_CUT:null)}</b><br>Mats cost <b>${money(x.cost)}</b><br>Profit each: <b class="${pc}">${money(x.profit)}</b>${x.profit!=null?` · a stack of 5 makes <b class="${pc}">${money(x.profit*5)}</b>`:''}</div>
   ${(()=>{if(!x.parts.some(p=>PRODUCT[p.n]))return '';const b=calcBoth(r);if(b.buy.profit==null&&b.make.profit==null)return '';
   return `<div class="note" style="margin-top:6px">Buying the components: <b class="${(b.buy.profit||0)>=0?'up':'down'}">${money(b.buy.profit)}</b> each · making them yourself: <b class="${(b.make.profit||0)>=0?'up':'down'}">${money(b.make.profit)}</b> each</div>`})()}
   ${r.y>1?`<div class="note">Makes ${r.y} per craft: the numbers are for one craft.</div>`:''}
   <div class="note">Recipe: ${esc(r.src||'unknown')}</div></div></div></td></tr>`}
  return h}).join('');
 $('[data-p=profit]').innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap"><div><h2>Profit board</h2><p class="sub">Every ${P.name.toLowerCase()} recipe: sell price vs what the mats cost right now. Tap a row for the breakdown.</p></div>
 <label class="search"><span class="soft" style="font-size:13px">Search</span><input id="q" value="${esc(S.q)}" placeholder="${P.search}"></label></div>
 <div class="chips">${fchip('Can make now','can')}${P.pvp?fchip('PvP potions','pvp'):''}${fchip('Trainer recipes','train')}${fchip('Profitable only','profit')}
 <select id="cat" aria-label="Category">${CATS.map(c=>`<option ${c===S.cat?'selected':''}>${c}</option>`).join('')}</select>
 <span class="r">Raw mats: <button class="chip" data-farm="0" aria-pressed="${!S.farm}">Buy</button><button class="chip" data-farm="1" aria-pressed="${S.farm}">${P.farm}</button>
 · Components: <button class="chip" data-make="0" aria-pressed="${!S.make}">Buy on AH</button><button class="chip" data-make="1" aria-pressed="${S.make}">I make them</button></span></div>
 <div class="box" style="overflow-x:auto"><table><thead><tr>${th('name',P.thing.toUpperCase())}${th('sell','SELLS FOR',1)}${th('cost','MATS COST',1)}${th('profit','PROFIT EACH',1)}${th('margin','MARGIN',1)}${th('qty','ON THE AH',1)}</tr></thead><tbody>${body||'<tr><td colspan="6" class="soft">Nothing matches those filters.</td></tr>'}</tbody></table></div>
 <div class="note">Sell price = the lowest listing right now. Mat cost: vendor price, else the AH. With "I make them", anything you can craft (bolts, potions, Goblin Rocket Fuel…) is costed at its own mats instead. Red = you'd lose money. ${rows.length} recipes shown.</div>`;
 const qi=$('#q');qi.oninput=e=>{S.q=e.target.value;renderProfit();const n=$('#q');n.focus();n.setSelectionRange(n.value.length,n.value.length)};
 $('#cat').onchange=e=>{S.cat=e.target.value;renderProfit()};
 document.querySelectorAll('[data-farm]').forEach(b=>b.onclick=()=>{S.farm=b.dataset.farm==='1';store(K('farm'),S.farm);renderAll()});
 document.querySelectorAll('[data-make]').forEach(b=>b.onclick=()=>{S.make=b.dataset.make==='1';store(K('make'),S.make);renderAll()});
 document.querySelectorAll('th[data-sort]').forEach(t=>t.onclick=()=>{const k=t.dataset.sort;if(S.sort===k)S.dir*=-1;else{S.sort=k;S.dir=k==='name'||k==='skill'||k==='cost'?1:-1}renderProfit()});
 document.querySelectorAll('tr.row').forEach(t=>t.onclick=()=>{S.open=S.open===t.dataset.r?null:t.dataset.r;renderProfit()});
 $('[data-p=profit]').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.filters[b.dataset.f]=!S.filters[b.dataset.f];store(K('filters'),S.filters);renderProfit()});
}
function fchip(t,k){return `<button class="chip" data-f="${k}" aria-pressed="${!!S.filters[k]}">${t}</button>`}
function chip(t,k,v){return `<button class="chip" data-k="${k}" data-v="${v}" aria-pressed="${S[k]===v}">${t}</button>`}

/* ---------- 3. craft or sell raw ---------- */
// does making n use raw h, directly or through something you craft first (cloth → bolt → shirt)?
function usesRaw(n,h,d=0){const r=d?PRODUCT[n]:(RECIPE[n]||PRODUCT[n]);return !!r&&d<3&&r.m.some(([,m])=>m===h||usesRaw(m,h,d+1))}
// split a recipe into: how many h it eats, and what everything else costs
function expand(r,h,d=0){let use=0,other=0,ok=true;
 r.m.forEach(([q,m])=>{if(m===h){use+=q;return}
  if(d<2&&usesRaw(m,h)){const sub=PRODUCT[m],y=sub.y||1,e=expand(sub,h,d+1);if(!e.ok)ok=false;use+=q*e.use/y;other+=q*e.other/y;return}
  const c=matCost(m);if(c.c==null)ok=false;else other+=q*c.c});
 return {use,other,ok}}
function rawBest(h){ // best recipe you can make from this raw mat, value per unit
 let best=null;
 A.recipes.forEach(r=>{if(!canMake(r)||!usesRaw(r.n,h))return;const one=sell(O(r));if(one==null)return;const s=one*(r.y||1);
  const e=expand(r,h);if(!e.ok||!e.use)return;
  const per=(s*AH_CUT-e.other)/e.use;if(!best||per>best.per)best={r,per,uses:e.use}});
 return best;
}
function renderRaw(){
 const RAW=cap(P.raw);
 const list=A.raw.map(h=>({h,raw:sell(h),best:rawBest(h)})).filter(x=>x.raw!=null||x.best);
 const rows=list.map(x=>{const craft=x.best&&(x.raw==null||x.best.per>x.raw*AH_CUT);
  return `<tr><td style="font-size:15px">${esc(x.h)}</td><td class="n">${money(x.raw)}</td><td class="soft">${x.best?esc(x.best.r.n)+(x.best.uses%1?'':` <span class="psub">(${x.best.uses} each)</span>`):'none you can make'}</td><td class="n" style="font-weight:700">${x.best?money(x.best.per):'—'}</td>
  <td class="n"><span class="verdict ${craft?'up':'pvp'}" style="border-color:currentColor">${craft?'CRAFT':'SELL RAW'}</span></td></tr>`}).join('');
 let plan=[],craftTotal=0,rawTotal=0;
 Object.entries(S.bags).forEach(([h,n])=>{n=+n||0;if(!n||!A.raw.includes(h))return;const raw=sell(h),b=rawBest(h);const rv=raw!=null?raw*AH_CUT*n:0;rawTotal+=rv;
  if(b&&(raw==null||b.per>raw*AH_CUT)){const k=Math.floor(n/b.uses);plan.push(`Craft <b>${k} ${esc(b.r.n)}</b> (uses ${k*b.uses} ${esc(h)})`);craftTotal+=k*b.uses*b.per+(n-k*b.uses)*(raw||0)*AH_CUT}
  else{plan.push(`Sell <b>${n} ${esc(h)}</b> raw`);craftTotal+=rv}});
 $('[data-p=raw]').innerHTML=`<h2>Craft or sell raw?</h2><p class="sub">For each ${P.raw}: is it worth more sold as-is, or turned into ${/^[aeiou]/.test(P.thing)?'an':'a'} ${P.thing} you can make? "Per ${P.raw} crafted" = the ${P.thing}'s profit after its other mats, split across the ${P.raws} it uses${PID==='tailoring'?' (counting the cloth inside any bolts)':''}.</p>
 <div class="grid2"><div class="box" style="overflow-x:auto"><table><thead><tr><th>${RAW.toUpperCase()}</th><th class="n">SELL RAW</th><th>BEST ${P.thing.toUpperCase()}</th><th class="n">PER ${P.raw.toUpperCase()} CRAFTED</th><th class="n">DO THIS</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="soft">No prices yet.</td></tr>'}</tbody></table></div>
 <div style="display:flex;flex-direction:column;gap:12px"><div class="side hl"><div class="lbl">MY BAGS</div><p class="sub" style="margin-bottom:8px">Type how many of each you're carrying.</p>
  <div class="bag">${A.raw.map(h=>`<label for="b-${esc(h)}">${esc(h)}</label><input id="b-${esc(h)}" data-bag="${esc(h)}" type="number" min="0" value="${S.bags[h]||''}" placeholder="0">`).join('')}</div></div>
  <div class="side" style="font-size:14px;line-height:1.7"><div class="lbl">BEST PLAN FOR THOSE</div>${plan.length?plan.join('<br>')+`<div style="margin-top:6px">Total: <b class="up">${money(craftTotal)}</b> vs <b>${money(rawTotal)}</b> selling everything raw</div>`:'<span class="soft">Fill in your bags above.</span>'}</div></div></div>`;
 document.querySelectorAll('[data-bag]').forEach(i=>i.onchange=()=>{const v=+i.value||0;if(v)S.bags[i.dataset.bag]=v;else delete S.bags[i.dataset.bag];store(K('bags'),S.bags);renderRaw()});
}

/* ---------- 5. caster food (cooking page) ----------
   15-minute Well Fed buffs with spell damage or healing. Buff values from buyboost.com's Forever food list
   (Spotted Yellowtail: metaforge, Sunrise Omelette: kingboost). Beta numbers, may change. */
const BUFFFOOD=[
 ['Baked Salmon','+28 spell damage','sd',28],['Spotted Yellowtail','+22 spell damage','sd',22],['Nightfin Soup','+22 spell damage','sd',22],
 ['Briny Seafood Stew','+14 spell damage','sd',14],['Sagefish Delight','+7 spell damage','sd',7],['Smoked Sagefish','+4 spell damage','sd',4],['Rainbow Fin Albacore','+1 spell damage','sd',1],
 ['Sunrise Omelette','+25 spell damage, +55 healing, +10 Stamina','both',25],
 ["Sage's Tea",'+44 healing','heal',44],['Sunny Tea','+33 healing','heal',33],['Lobster Stew','+28 healing','heal',28],['Triage Tea','+22 healing','heal',22],
 ['Root Tea','+11 healing','heal',11],['Royal Tea','+7 healing','heal',7],['Peace Tea','+2 healing','heal',2]];
const VENDOR_ONLY=n=>vendor(n)!=null;
// where an Alliance player learns each recipe (QuestieDB vendor spawns; newer Forever recipes from wow.gg / wow-professions)
const FOODSRC={
 'Baked Salmon':'Vendor: Vivianna, Feathermoon (Feralas) 31.3, 43.5','Lobster Stew':'Vendor: Vivianna, Feathermoon (Feralas) 31.3, 43.5',
 'Spotted Yellowtail':'Vendor: Gikkix, Steamwheedle Port (Tanaris) 66.6, 22.1','Nightfin Soup':'Vendor: Gikkix, Steamwheedle Port (Tanaris) 66.6, 22.1',
 'Sagefish Delight':'Vendor: Gloria Femmel, Lakeshire (Redridge) 21.6, 43.5 · or Kalsey Sanden, Three Corners (Redridge)',
 'Smoked Sagefish':'Vendor: Gloria Femmel, Lakeshire (Redridge) 21.6, 43.5 · or Erika Tate, Stormwind 78.5, 52.9',
 'Rainbow Fin Albacore':'Vendor: Catherine Leland, Stormwind 55.1, 69.8 · or Kriggon Talsone, Westfall 36.2, 90.2',
 'Briny Seafood Stew':'Cooking trainer (Stormwind: Stephen Ryback)','Sunny Tea':'Cooking trainer (Stormwind: Stephen Ryback)',
 "Sage's Tea":'Not confirmed yet: likely the cooking trainer, like Sunny Tea','Triage Tea':'Not confirmed yet: likely the cooking trainer, like Sunny Tea',
 'Root Tea':'Not confirmed yet: likely the cooking trainer, like Sunny Tea','Royal Tea':'Not confirmed yet: likely the cooking trainer, like Sunny Tea',
 'Peace Tea':'Not confirmed yet: likely the cooking trainer, like Sunny Tea',
 'Sunrise Omelette':'Not confirmed in Forever (in Season of Discovery it was a quest reward in the Scarlet Enclave)'};
function foodCost(r,farm){let c=0,ok=true;const farmList=[];
 r.m.forEach(([q,n])=>{if(farm&&!VENDOR_ONLY(n)){farmList.push(q+'× '+n);return}
  const v=vendor(n),a=sell(n),one=v!=null?v:a;if(one==null)ok=false;else c+=q*one});
 const y=r.y||1;return {c:ok?c/y:null,farm:farmList}}
function renderFood(){
 const el=$('[data-p=food]');if(!el)return;
 const groups=[['sd','Spell damage'],['both','Spell damage + healing'],['heal','Healing']];
 const rows=g=>BUFFFOOD.filter(f=>f[2]===g).map(([n,buff])=>{const r=RECIPE[n];if(!r)return '';
  const buy=foodCost(r,false),farm=foodCost(r,true),ah=sell(n);
  const pr=ah!=null&&buy.c!=null?ah*AH_CUT-buy.c:null;const pc=pr==null?'':pr>=0?'up':'down';
  return `<tr><td style="font-size:15px"><span class="${pc}" style="font-weight:700">${esc(n)}</span><div class="psub">Cooking ${r.sk}${canMake(r)?'':' · you need '+r.sk}</div><div class="psub">📍 ${esc(FOODSRC[n]||r.src)}</div>
   ${pr!=null?`<div class="psub">Buy mats, cook &amp; sell: <b class="${pc}">${pr>=0?'+':''}${money(pr)}</b> each</div>`:''}</td>
   <td>${esc(buff)}</td>
   <td class="n">${money(ah)}${qtyOf(n)!=null?`<div class="psub">${qtyOf(n)} on AH</div>`:''}</td>
   <td class="n ${pc}">${money(buy.c)}</td>
   <td class="n" style="font-weight:700">${money(farm.c)}<div class="psub">${farm.farm.length?'farm: '+farm.farm.map(esc).join(', '):'all vendor'}</div></td></tr>`}).join('');
 el.innerHTML=`<h2>Caster food: spell damage &amp; healing</h2>
 <p class="sub">Every 15-minute Well Fed buff with spell damage or healing (any level), strongest first. Compare buying one ready-made, cooking it with bought mats, or cooking it with mats you fish/gather yourself (you only pay for the vendor stuff). Costs are per piece of food.</p>
 ${groups.map(([g,t])=>`<div class="lbl" style="margin:14px 0 6px">${t.toUpperCase()}</div><div class="box" style="overflow-x:auto"><table><thead><tr><th>FOOD</th><th>BUFF (15 MIN)</th><th class="n">BUY IT ON AH</th><th class="n">COOK · BUY MATS</th><th class="n">COOK · FARM MATS</th></tr></thead><tbody>${rows(g)}</tbody></table></div>`).join('')}
 <div class="note">Green = you make money buying the mats, cooking and selling it on the AH (after the 5% cut); red = you'd lose money. Recipe spots are for Alliance. One food buff at a time: a new Well Fed replaces the old one. Buff numbers are from the Forever beta and may have changed, so check the tooltip. Sunrise Omelette's numbers come from one source only.</div>`;
}

/* ---------- 4. shopping list ---------- */
function renderShop(){
 const picks=S.shop.filter(([n])=>RECIPE[n]);const need={};let cost=0,rev=0,ok=true;
 picks.forEach(([n,k])=>{const x=calc(RECIPE[n]);if(x.s!=null)rev+=x.s*AH_CUT*k;else ok=false;
  RECIPE[n].m.forEach(([q,m])=>{need[m]=(need[m]||0)+q*k})});
 const matRows=Object.entries(need).sort((a,b)=>a[0].localeCompare(b[0])).map(([m,q])=>{const c=matCost(m);if(c.c!=null)cost+=c.c*q;else ok=false;const done=S.bought[m];
  return `<div class="mats ${done?'done':''}"><input type="checkbox" data-bought="${esc(m)}" ${done?'checked':''} aria-label="Bought ${esc(m)}"><span>${esc(m)}</span><span class="n" style="text-align:right">×${q}</span><span class="soft" style="text-align:right">${c.c!=null?money(c.c)+(c.how==='vendor'?' (vendor)':''):'no price'}</span><span style="text-align:right">${c.c!=null?money(c.c*q):'—'}</span></div>`}).join('');
 const opts=A.recipes.filter(r=>!picks.some(([n])=>n===r.n)).map(r=>`<option>${esc(r.n)}</option>`).join('');
 $('[data-p=shop]').innerHTML=`<h2>Shopping list</h2><p class="sub">Pick what you want to craft and how many. It adds up the mats, what they cost right now, and what you'll make.</p>
 <div class="grid2b"><div class="side"><div class="lbl" style="padding-top:2px">I WANT TO CRAFT</div>
 ${picks.map(([n,k],i)=>{const x=calc(RECIPE[n]);return `<div class="pick"><div><div style="font-size:15px">${esc(n)}</div><div class="psub">profit ${money(x.profit)} each</div></div>
  <div class="step"><button data-dq="${i}" data-d="-1" aria-label="Fewer">−</button><span>${k}</span><button data-dq="${i}" data-d="1" aria-label="More">+</button></div><button class="ghostbtn" data-rm="${i}">Remove</button></div>`}).join('')}
 <label class="fld" style="margin-top:12px"><select id="add" style="flex:1"><option value="">+ Add ${/^[aeiou]/.test(P.thing)?'an':'a'} ${P.thing}…</option>${opts}</select></label>
 <div class="tot"><div><small>MATS COST</small><b>${money(cost)}</b></div><div><small>SELLS FOR</small><b>${money(rev)}</b></div><div class="hl"><small>PROFIT</small><b class="${rev-cost>=0?'up':'down'}">${money(rev-cost)}</b></div></div>
 ${ok?'':'<div class="note">Some prices are missing, so the totals are incomplete.</div>'}</div>
 <div class="side"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span class="lbl">MATS TO BUY</span><button class="btn" id="copy">Copy list</button></div>
 <div class="mats h"><span></span><span>ITEM</span><span style="text-align:right">QTY</span><span style="text-align:right">EACH</span><span style="text-align:right">TOTAL</span></div>${matRows||`<div class="note">Add ${/^[aeiou]/.test(P.thing)?'an':'a'} ${P.thing} to see what to buy.</div>`}
 <div class="note">Tick things off as you buy them. "Copy list" copies it as text you can paste anywhere.</div></div></div>`;
 document.querySelectorAll('[data-dq]').forEach(b=>b.onclick=()=>{const p=S.shop[+b.dataset.dq];p[1]=Math.max(1,p[1]+ +b.dataset.d);store(K('shop'),S.shop);renderShop()});
 document.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{S.shop.splice(+b.dataset.rm,1);store(K('shop'),S.shop);renderShop()});
 $('#add').onchange=e=>{if(e.target.value){S.shop.push([e.target.value,1]);store(K('shop'),S.shop);renderShop()}};
 document.querySelectorAll('[data-bought]').forEach(c=>c.onchange=()=>{if(c.checked)S.bought[c.dataset.bought]=1;else delete S.bought[c.dataset.bought];store(K('bought'),S.bought);renderShop()});
 $('#copy').onclick=()=>{const txt=Object.entries(need).map(([m,q])=>`${m} x${q}`).join('\n');navigator.clipboard&&navigator.clipboard.writeText(txt).then(()=>{$('#copy').textContent='Copied!';setTimeout(()=>{const b=$('#copy');if(b)b.textContent='Copy list'},1200)})};
}

/* ---------- shell ---------- */
function ago(t){const m=Math.round((Date.now()/1000-t)/60);return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' hr ago':Math.round(m/1440)+' days ago'}
function header(){
 const f=$('#freshness'),w=$('#waiting');
 if(!PR){f.innerHTML='<span class="dot none"></span>No prices yet';w.hidden=false;
  w.innerHTML='<b>Waiting for the first hourly price update.</b> Prices fill in every hour on their own. Recipes and mats already work below.';return}
 const age=(Date.now()/1000-PR.updated)/60;
 f.innerHTML=PR.synced?`<span class="dot ${age>130?'old':''}"></span>Prices from your addon sync ${ago(PR.updated)}`
  :`<span class="dot ${age>130?'old':''}"></span>Updated ${ago(PR.updated)} · every hour · ${esc(PR.realm||'')} · <a href="https://ahledger.com/" target="_blank" rel="noopener">Prices from AHledger</a>`;
 w.hidden=!PR.synced;if(PR.synced)w.innerHTML='<b>Using prices from your last addon sync</b> until the hourly prices are set up.';
}
function shell(){
 document.title=P.name+' · Level Guide';$('#plogo').innerHTML=P.logo;$('#skLbl').textContent='My '+P.name.toLowerCase();
 document.querySelectorAll('[data-prof]').forEach(b=>{b.setAttribute('aria-selected',b.dataset.prof===PID||(!PROFS[PID]&&b.dataset.prof==='alchemy'));b.onclick=()=>{location.search='?p='+b.dataset.prof}});
}
{const ft=document.querySelector('.tab[data-t=food]');if(ft)ft.hidden=PID!=='cooking'}
shell();
function renderAll(){header();renderTop();renderProfit();renderRaw();renderShop();if(PID==='cooking')renderFood()}
function showTab(t){S.tab=t;store(K('tab'),t);document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===t));document.querySelectorAll('[data-p]').forEach(p=>p.hidden=p.dataset.p!==t)}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showTab(b.dataset.t));
const getJSON=u=>fetch(u+'?v='+Date.now()).then(r=>r.ok?r.json():null).catch(()=>null);
const OTHER=Object.keys(PROFS).filter(k=>k!==PID&&PROFS[k]);
Promise.all([getJSON(P.file),getJSON('data/prices.json'),getJSON('data/history.json'),getJSON('data/status.json'),...OTHER.map(k=>getJSON(PROFS[k].file))]).then(([a,p,h,st,...others])=>{
 A=a;A.raw=A.raw||A.herbs||[];RAWS[PID]=A.raw;A.recipes.forEach(r=>{r.prof=PID;RECIPE[r.n]=r;if(!PRODUCT[O(r)])PRODUCT[O(r)]=r});
 // other professions' recipes: so a potion or bolt used as a component can be "made yourself"
 others.forEach((d,i)=>{if(!d)return;const id=OTHER[i];RAWS[id]=d.raw||d.herbs||[];d.recipes.forEach(r=>{r.prof=id;if(!PRODUCT[O(r)])PRODUCT[O(r)]=r})});
 PR=p||syncedPrices();H=h;
 if(S.skill==null){const sync=[...Array(localStorage.length).keys()].map(i=>localStorage.key(i)).filter(k=>/^fg-sync-/.test(k)).map(k=>load(k,null)).filter(Boolean);
  if(!sync.length&&st&&st.sync)sync.push(st.sync); // nothing synced here: use the shared progress
  const al=sync.flatMap(d=>d.prof||[]).find(x=>new RegExp(P.name,'i').test(x.n));S.skill=al?al.r:(PID==='alchemy'?150:1)}
 const sk=$('#skill');sk.value=S.skill;sk.onchange=()=>{S.skill=+sk.value||1;store(K('skill'),S.skill);renderAll()};
 renderAll();showTab(S.tab);
});
