/* v66 · One "mood" setting (0–100) shared by the village and battles: how dark/warm/contrasty the picture is.
   Stored in localStorage 'projectA.mood'; the village iframe follows changes through the storage event.
   Battles: a CSS filter on #battleCanvas (GPU, no per-pixel work). Village: js/town-mood.js reads GameMood.level(). */
(function(root){'use strict';
const KEY='projectA.mood',DEF=60,subs=new Set();
let value=DEF;try{const s=localStorage.getItem(KEY);if(s!=null&&!isNaN(+s))value=Math.max(0,Math.min(100,+s))}catch(e){}
function css(k){return k?`brightness(${(1-.13*k).toFixed(3)}) contrast(${(1+.14*k).toFixed(3)}) saturate(${(1-.1*k).toFixed(3)}) sepia(${(.1*k).toFixed(3)})`:'none'}
function apply(){const k=value/100,c=document.getElementById('battleCanvas');if(c)c.style.filter=css(k);subs.forEach(f=>{try{f(k)}catch(e){}})}
function set(v){value=Math.max(0,Math.min(100,Math.round(+v||0)));try{localStorage.setItem(KEY,String(value))}catch(e){}apply();document.querySelectorAll('input[data-mood]').forEach(i=>{if(+i.value!==value)i.value=value})}
// a small labelled range input; any number of them stay in sync
function slider(label='โทนภาพ (มืด/อุ่น)'){const l=document.createElement('label');l.className='moodSlider';l.innerHTML=`<span>${label}</span><input type="range" min="0" max="100" step="5" data-mood><output></output>`;const i=l.querySelector('input'),o=l.querySelector('output');i.value=value;o.textContent=value;i.oninput=()=>{o.textContent=i.value;set(i.value)};subs.add(()=>{o.textContent=value});return l}
root.addEventListener('storage',e=>{if(e.key===KEY&&e.newValue!=null){value=Math.max(0,Math.min(100,+e.newValue||0));apply();document.querySelectorAll('input[data-mood]').forEach(i=>i.value=value)}});
// battle settings dialog: add the slider next to "ฉากหลัง" whenever that dialog is built
new MutationObserver(()=>{const b=document.querySelector('select[data-setting="backdrop"]'),l=b?.closest('label');if(l?.parentNode&&!l.parentNode.querySelector('.moodSlider'))l.after(slider())}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',apply);apply();
root.GameMood={level:()=>value/100,get:()=>value,set,slider,onChange:f=>subs.add(f),css};
})(globalThis);
