(function(){'use strict';
if(window.PackBust){return;}
var KEY='packbust.v1',SITE='https://packbust.com/',START=200,DAILY=60;
var RAR=[{k:'common',n:'Common',v:1},{k:'uncommon',n:'Uncommon',v:2},{k:'rare',n:'Rare',v:5},{k:'holo',n:'Holo',v:15},{k:'secret',n:'Secret',v:40}];
var PACKS=[{k:'basic',n:'Basic Pack',cost:10,r:[700,200,80,18,2]},{k:'pro',n:'Pro Pack',cost:25,r:[550,280,120,40,10]},{k:'collector',n:'Collector Pack',cost:60,r:[400,300,200,80,20]}];
var ATTRS=[
{k:'cinder',n:'Cinder',i:'M12 3 7 10l-3 3 3 6h10l3-6-3-3-5-7Zm-1 9-2 3 2 3 2-3-2-3Z',c:'Kiln Mote|Ash Hopper|Flint Finch|Copper Toad|Soot Hare|Wick Hound|Glaze Cobra|Singe Crane|Furnace Lynx|Brass Mantid|Coal Antler|Crown of Scoria|Glassback Roc|Vesper Kiln|The Red Meridian'},
{k:'brine',n:'Brine',i:'M2 8c2-3 4-3 6 0s4 3 6 0 4-3 6 0M2 13c2-3 4-3 6 0s4 3 6 0 4-3 6 0M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0',c:'Salt Skipper|Foam Wren|Kelp Midge|Drift Claw|Tidal Newt|Reef Scribe|Pearl Grouse|Cove Lurker|Basin Ray|Tangle Whale|Rime Cuttle|Blueglass Leviathan|Mirror Shoal|Deepwater Loom|The Sunken Bell'},
{k:'tangle',n:'Tangle',i:'M12 3c4 0 7 3 7 7s-3 7-7 7-7-3-7-7M12 8c2 0 3 1 3 3s-1 3-3 3',c:'Thorn Kite|Moss Grazer|Briar Wasp|Fern Stalker|Root Binder|Pollen Moth|Hollow Vine|Bramble Boar|Canopy Wraith|Seed Drifter|Old Growth|Verdant Coil|Split Trunk|Green Cathedral|The Quiet Grove'},
{k:'glint',n:'Glint',i:'M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',c:'Dust Spark|Prism Tick|Glass Moth|Flare Chip|Shard Kite|Mirror Lynx|Lamp Wisp|Sunburst Roe|Chrome Basilisk|Halo Drift|Fracture Hound|White Prism|Star Lattice|Gilded Echo|The First Light'},
{k:'hush',n:'Hush',i:'M16 3A9 9 0 1 0 21 15 7 7 0 0 1 16 3Z',c:'Pale Moth|Still Water|Night Fern|Mute Hound|Sleeping Owl|Quiet Stone|Faint Bell|Dusk Walker|Shadow Scribe|Silent Current|Cloud Warden|Blank Mirror|Soft Thunder|Long Night|The Last Silence'},
{k:'grit',n:'Grit',i:'M12 2l8 5v10l-8 5-8-5V7l8-5Zm0 6 4 2.5v5L12 18l-4-2.5v-5L12 8Z',c:'Stone Pup|Iron Beetle|Gravel Boar|Clay Sentinel|Dust Ox|Rivet Crab|Slate Kite|Quarry Drake|Basalt Ram|Anvil Saint|Cinder Wall|Rust Colossus|Granite Titan|Deep Pillar|The Old Foundation'}];
var CARDS=[],POOL=[[],[],[],[],[]],IDX={};
ATTRS.forEach(function(a){a.c.split('|').forEach(function(nm,i){var ri=i<5?0:i<9?1:i<12?2:i<14?3:4,id=('00'+(CARDS.length+1)).slice(-3),c={id:id,name:nm,attr:a.n,icon:a.i,ri:ri};CARDS.push(c);POOL[ri].push(c);IDX[id]=c;});});
var TOTAL=CARDS.length;
function mb(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function pick(rng,r){var x=rng()*1000,s=0,i;for(i=0;i<r.length;i++){s+=r[i];if(x<s){return i;}}return r.length-1;}
function draw(rng,p){var o=[],i,ri,pool;for(i=0;i<5;i++){ri=pick(rng,p.r);pool=POOL[ri];o.push(pool[Math.floor(rng()*pool.length)]);}return o;}
var st;
function load(){var d={balance:START,owned:{},daily:''};try{var raw=localStorage.getItem(KEY);if(raw){var p=JSON.parse(raw);if(p&&typeof p.balance==='number'&&p.owned){d.balance=Math.max(0,Math.floor(p.balance));d.owned=p.owned;d.daily=p.daily||'';}}}catch(e){}return d;}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
function own(id){return st.owned[id]||0;}
function dupPts(){var t=0;for(var k in st.owned){var n=st.owned[k];if(n>1&&IDX[k]){t+=(n-1)*RAR[IDX[k].ri].v;}}return t;}
var TPL='<div class="pb-shell"><div class="pb-top"><div class="pb-brand">Pack<span>Bust</span></div><div class="pb-wallet"><b data-pts>0</b> points</div></div><div class="pb-stage"><div class="pb-stage-head"><span class="pb-eye">Current pull</span><span data-prog class="pb-prog">0 / 90</span></div><div class="pb-cards" data-cards><p class="pb-empty">Pick a pack below to open your first cards.</p></div><div class="pb-actions" data-acts hidden><button type="button" class="pb-btn pb-btn-ghost" data-share>Copy share link</button><button type="button" class="pb-btn pb-btn-ghost" data-skip>Skip animation</button></div><p class="pb-note" data-note></p></div><div class="pb-packs" data-packs></div><details class="pb-odds"><summary>Pull rates for every pack</summary><div data-odds></div></details><div class="pb-col"><div class="pb-stage-head"><span class="pb-eye">Collection</span><span class="pb-prog" data-dup>No duplicates</span></div><div data-rar class="pb-rar"></div><button type="button" class="pb-btn pb-btn-ghost" data-recycle>Recycle duplicates</button></div></div>';
function cardHTML(c,dupe){
 var r=RAR[c.ri];
 return '<article class="pb-card pb-r-'+r.k+(dupe?' pb-dupe':'')+'"><div class="pb-card-top"><span class="pb-card-id">'+c.id+'</span><span class="pb-card-rar">'+r.n+'</span></div><div class="pb-card-art"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+c.icon+'"/></svg></div><div class="pb-card-name">'+c.name+'</div><div class="pb-card-foot"><span>'+c.attr+'</span><span>'+r.v+' pt</span></div></article>';
}
function mount(host){
 if(!host||host.getAttribute('data-pb')==='1'){return;}
 host.setAttribute('data-pb','1');
 st=load();
 var today=new Date().toISOString().slice(0,10);
 if(st.daily!==today){if(st.balance<DAILY){st.balance=DAILY;}st.daily=today;save();}
 var root=document.createElement('div');root.className='pb-root';root.innerHTML=TPL;
 host.innerHTML='';host.appendChild(root);
 var pts=root.querySelector('[data-pts]'),prog=root.querySelector('[data-prog]'),cardsEl=root.querySelector('[data-cards]'),acts=root.querySelector('[data-acts]'),note=root.querySelector('[data-note]'),packsEl=root.querySelector('[data-packs]'),oddsEl=root.querySelector('[data-odds]'),rarEl=root.querySelector('[data-rar]'),dupEl=root.querySelector('[data-dup]'),recBtn=root.querySelector('[data-recycle]');
 var lastSeed=0,lastPack='';
 packsEl.innerHTML=PACKS.map(function(p){return '<button type="button" class="pb-pack" data-pack="'+p.k+'"><span class="pb-pack-n">'+p.n+'</span><span class="pb-pack-c">'+p.cost+' points</span><span class="pb-pack-h">5 cards</span></button>';}).join('');
 oddsEl.innerHTML='<table class="pb-table"><thead><tr><th>Rarity</th>'+PACKS.map(function(p){return '<th>'+p.n+'</th>';}).join('')+'</tr></thead><tbody>'+RAR.map(function(r,ri){return '<tr><th scope="row">'+r.n+'</th>'+PACKS.map(function(p){return '<td>'+(p.r[ri]/10)+'%</td>';}).join('')+'</tr>';}).join('')+'</tbody></table><p class="pb-fine">Five cards per pack. Rates are per card and every pull is decided by a seeded random generator, so a shared link always reproduces exactly the same five cards.</p>';
 function say(m){note.textContent=m;}
 function paint(){
  pts.textContent=st.balance;
  var d=0,k;for(k in st.owned){d++;}
  prog.textContent=d+' / '+TOTAL;
  var per=[0,0,0,0,0],tot=[0,0,0,0,0];
  CARDS.forEach(function(c){tot[c.ri]++;if(own(c.id)>0){per[c.ri]++;}});
  rarEl.innerHTML=RAR.map(function(r,ri){return '<div class="pb-rar-row"><span class="pb-rn pb-r-'+r.k+'">'+r.n+'</span><span class="pb-rv">'+per[ri]+' / '+tot[ri]+'</span></div>';}).join('');
  var dp=dupPts();
  dupEl.textContent=dp>0?('Duplicates worth '+dp+' points'):'No duplicates yet';
  recBtn.textContent=dp>0?('Recycle duplicates for '+dp+' points'):'Recycle duplicates';
  recBtn.disabled=dp<=0;
  Array.prototype.forEach.call(packsEl.children,function(b){var p=byKey(b.getAttribute('data-pack'));b.disabled=st.balance<p.cost;});
 }
 function byKey(k){for(var i=0;i<PACKS.length;i++){if(PACKS[i].k===k){return PACKS[i];}}return null;}
 function show(list,shared){
  cardsEl.innerHTML=list.map(function(c,i){return cardHTML(c,!shared&&own(c.id)>1).replace('class="pb-card','style="animation-delay:'+(i*160)+'ms" class="pb-card');}).join('');
  acts.hidden=false;
 }
 root.querySelector('[data-skip]').addEventListener('click',function(){Array.prototype.forEach.call(cardsEl.children,function(c){c.style.animation='none';});});
 packsEl.addEventListener('click',function(e){
  var b=e.target.closest('[data-pack]');if(!b){return;}
  var p=byKey(b.getAttribute('data-pack'));if(!p||st.balance<p.cost){say('Not enough points for that pack.');return;}
  st.balance-=p.cost;lastPack=p.k;lastSeed=Math.floor(Math.random()*1e9);
  var list=draw(mb(lastSeed),p);
  list.forEach(function(c){st.owned[c.id]=own(c.id)+1;});
  save();show(list,false);paint();
  var best=0;list.forEach(function(c){if(c.ri>best){best=c.ri;}});
  say(p.n+' opened — best pull: '+RAR[best].n+'.');
 });
 root.querySelector('[data-share]').addEventListener('click',function(){
  if(!lastSeed){say('Open a pack first, then you can share it.');return;}
  var url=SITE+'?seed='+lastSeed+'&pack='+lastPack;
  var done=function(){say('Link copied. It will always show these same five cards.');};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(done,function(){say(url);});}else{say(url);}
 });
 root.querySelector('[data-recycle]').addEventListener('click',function(){
  var dp=dupPts();if(dp<=0){say('No duplicates to recycle yet.');return;}
  for(var k in st.owned){if(st.owned[k]>1){st.owned[k]=1;}}
  st.balance+=dp;save();paint();say('Recycled duplicates for '+dp+' points.');
 });
 paint();
 var qs=null;
 try{qs=new URLSearchParams(window.location.search);}catch(e){}
 if(qs&&!qs.get('seed')){try{if(window.parent&&window.parent.location.search){qs=new URLSearchParams(window.parent.location.search);}}catch(e){}}
 var sd=qs?parseInt(qs.get('seed'),10):0,pk=qs?qs.get('pack'):'';
 if(sd&&pk){var sp=byKey(pk);if(sp){show(draw(mb(sd),sp),true);say('Showing a shared pull — '+sp.n+'. Open your own pack below to start a collection.');}}
}
window.PackBust={mount:mount,version:1};
function boot(){var h=document.getElementById('pb-app');if(h){mount(h);}}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot);}else{boot();}
})();