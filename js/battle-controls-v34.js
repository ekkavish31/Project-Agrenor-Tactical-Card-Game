/* Generated atlas icons; retain existing command handlers and settings controls. */
(function(){
 const layer=document.getElementById('tacticsLayer'),field=layer?.querySelector('.field-wrap');if(!field)return;
 const dock=document.createElement('nav');dock.id='battleArtDock';dock.setAttribute('aria-label','เข็มทิศและควบคุมสนาม');
 const panel=document.createElement('section');panel.id='battleSettingsV34';panel.hidden=true;panel.setAttribute('aria-label','ตั้งค่าการต่อสู้');panel.innerHTML='<header><strong>ตั้งค่าการต่อสู้</strong><button type="button" aria-label="ปิดการตั้งค่า">×</button></header>';
 panel.querySelector('button').onclick=()=>toggle(false);
 function icon(button,index,label){if(!button)return;button.classList.add('battle-art-button');button.style.setProperty('--icon-x',(index%4)*100/3+'%');button.style.setProperty('--icon-y',index<4?'0%':'100%');button.setAttribute('aria-label',label);button.title=label;dock.appendChild(button)}
 icon(document.getElementById('tacticsExit'),0,'ถอย / กลับ');icon(document.getElementById('rotLeft'),1,'หมุนทวนเข็ม');icon(document.getElementById('rotRight'),2,'หมุนตามเข็ม');
 const settings=document.createElement('button');settings.id='battleSettingsButton';settings.type='button';settings.setAttribute('aria-expanded','false');settings.setAttribute('aria-controls',panel.id);icon(settings,3,'ตั้งค่า');settings.onclick=()=>toggle(panel.hidden);
 icon(document.getElementById('zoomIn'),4,'ขยายสนาม');icon(document.getElementById('zoomOut'),5,'ย่อสนาม');icon(document.getElementById('zoomReset'),6,'พอดีจอ');icon(document.getElementById('fullButton'),7,'เต็มจอ');
 const rot=document.getElementById('rotLabel');if(rot){rot.classList.add('battle-dock-bearing');dock.appendChild(rot)}
 const actions=layer.querySelector('.top-actions');if(actions)panel.appendChild(actions);
 function toggle(open){panel.hidden=!open;settings.setAttribute('aria-expanded',String(open))}
 field.append(dock,panel);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){toggle(false);e.stopPropagation()}},true);
 new MutationObserver(()=>{if(layer.hidden)toggle(false)}).observe(layer,{attributes:true,attributeFilter:['hidden']});
})();
