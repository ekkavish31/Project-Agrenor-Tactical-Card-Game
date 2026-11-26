const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/story-fx.js','utf8'),start=source.indexOf('root.StoryToast=function'),code=source.slice(start,source.indexOf('\n})(globalThis)',start));
const nodes=new Map(),timers=[];
const make=()=>({children:[],attrs:{},classList:{add(k){this.added=k}},setAttribute(k,v){this.attrs[k]=v},appendChild(n){this.children.push(n);if(n.id)nodes.set(n.id,n)},remove(){this.removed=true}});
const body=make(),document={body,getElementById:id=>nodes.get(id)||null,createElement:make},root={};vm.runInNewContext(code,{root,document,setTimeout:(f,ms)=>timers.push({f,ms})});
for(const [kind,text] of [['quest','✦ เควสใหม่: เดินทางไปหาผู้ใหญ่บ้าน'],['quest','เรื่องเควสที่ยาวมาก '.repeat(25)],['good','สำเร็จ <b>รางวัล</b>'],['','ทั่วไป']]){
 root.StoryToast(text,kind);const host=nodes.get('storyToasts'),t=host.children.at(-1);assert.equal(t.innerHTML,text,'live text stays complete');assert(!t.className.split(/\s+/).includes('quest'),'must not inherit old .quest dimensions/position');assert.equal(t.className,'st-toast'+(kind?' st-toast--'+kind:''));assert.equal(host.attrs.role,'status');
}
assert.equal(body.children.length,1,'reuse toast host');assert.equal(timers.filter(x=>x.ms===2600).length,4);assert.equal(timers.filter(x=>x.ms===3200).length,4);timers.forEach(x=>x.f());assert(nodes.get('storyToasts').children.every(x=>x.removed));
const css=fs.readFileSync('css/story.css','utf8');assert(css.includes("quest-ribbon-red.webp') 28 148 fill"));assert(css.includes('-webkit-line-clamp:unset'));assert(!/\.st-toast\.(quest|good)\s*\{/.test(css));assert(fs.existsSync('assets/ui/quest-ribbon-red.webp'));
console.log('PASS quest class isolation, complete short/long HTML, good/default notices, single live host, toast cleanup and stretchable art');
