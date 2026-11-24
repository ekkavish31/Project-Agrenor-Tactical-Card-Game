/* v98.947 · authored NPC expression routes and existing town event behavior. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ids=['bryn','ella','joe','ken','finn','berg','shep','pim','tess','ash','pell','hugo'];
const c={};c.window=c;
for(const file of ['story-actors','story-cast','battle-portrait'])vm.runInNewContext(fs.readFileSync('js/'+file+'.js','utf8'),c);
const moods=['neutral','happy','angry','worry'];
for(const id of ids)for(const mood of moods){
 const file='assets/portraits/'+id+'-'+mood+'.webp';
 assert.equal(c.StoryActors.facePic(id,{},mood),file);assert.equal(c.StoryCast.face(id,mood).src,file);assert.ok(fs.existsSync(file),file);
}
const maps={idle:'neutral',attack:'angry',hurt:'worry',guard:'neutral',heal:'happy',win:'happy',down:'worry'};
for(const id of [...ids,'oren','pip','grev','gus','tom','may','marta','mira','saf'])for(const [m,expr]of Object.entries(maps)){
 const f=c.BattlePortrait.face({key:id,side:'ally',hp:10},m);
 assert.equal(f.kind,'real');assert.equal(f.src,'assets/portraits/'+id+'-'+expr+'.webp');assert.ok(fs.existsSync(f.src));
}
assert.equal(c.BattlePortrait.face({key:'elder',side:'ally'},'idle').src,'assets/portraits/oren-neutral.webp');
assert.equal(c.BattlePortrait.face({key:'graven',side:'ally'},'idle').src,'assets/portraits/grev-neutral.webp');
let policy='festival',day=1;
c.WorldState={game:()=>({day})};c.Settlements={SETTLEMENTS:{test:{name:'test',ruler:'village'}},policy:()=>policy,sellPrice:()=>10};c.Factions={rep:()=>0,add(){},FACTIONS:{}};
vm.runInNewContext(fs.readFileSync('js/town-events.js','utf8'),c);
const seen=new Set();
for(day=1;day<1000;day++)for(policy of ['festival','tax_high','tax_low','trade','safety']){
 const e=c.TownEvents.today('test');if(!e)continue;seen.add(e.id);
 const s={gold:100,cargo:{grain:2}},card=c.TownEvents.card(s,'test');
 const p='assets/generated-village/events/'+e.id+'.png';assert.ok(card.html.includes(p));assert.ok(fs.existsSync(p));assert.equal(s.gold,100,'rendering cannot spend gold');
 if(e.id==='games')assert.equal(card.button.disabled,false);
 if(e.id==='toll'){c.TownEvents.arrive(s,'test');assert.equal(s.gold,95);assert.deepEqual(Array.from(c.TownEvents.arrive(s,'test')),[]);}
}
assert.equal(seen.size,6);
const M=JSON.parse(fs.readFileSync('data/asset-manifest.json','utf8'));
for(const id of ids){
 const rows=M.assets.filter(a=>moods.some(m=>a.file==='assets/portraits/'+id+'-'+m+'.webp'));assert.equal(rows.length,4);assert.equal(new Set(rows.map(r=>r.size.join('x'))).size,1,'common crop dimensions');
}
console.log('PASS 48 NPC faces, 147 battle mood routes, aliases, six event images and unchanged toll behavior');

// A slow portrait request must never paint over a different NPC or a closed conversation.
const pending=[];
c.Image=class {
 constructor(){this.complete=false;this.naturalWidth=400;this.naturalHeight=600;this.listeners=[];pending.push(this);}
 addEventListener(type,fn){if(type==='load')this.listeners.push(fn);}
 finish(){this.complete=true;this.onload?.();for(const fn of this.listeners)fn();}
};
const painted=[],ctx={save(){},restore(){},setTransform(){},clearRect(){},drawImage(im){painted.push(im.src);}};
const canvas={width:180,height:210,isConnected:true,getContext:()=>ctx};
assert.equal(c.StoryActors.drawTalkPortrait(canvas,'bryn','บ้าน'),true);
assert.equal(c.StoryActors.drawTalkPortrait(canvas,'ella','บ้าน'),true);
pending[0].finish();assert.equal(painted.length,0,'stale request cannot replace the current NPC');
pending[1].finish();assert.deepEqual(painted,['assets/portraits/ella-neutral.webp']);
c.StoryActors.drawTalkPortrait(canvas,'pim','บ้าน',()=>false);pending[2].finish();
assert.equal(painted.length,1,'closed conversation cannot be painted');
assert.equal(c.StoryActors.drawTalkPortrait(canvas,'unknown','บ้าน'),false,'unknown NPC keeps its sprite');
for(const [page,consumer]of [['village-town.html','town-npcs'],['place-interior.html','interior']]){
 const html=fs.readFileSync(page,'utf8');assert.ok(html.indexOf('js/story-actors.js?')<html.indexOf('js/'+consumer+'.js?'));
}
console.log('PASS village/interior portrait loading: latest NPC wins, closed talks stay closed, sprite fallback and script order preserved');
