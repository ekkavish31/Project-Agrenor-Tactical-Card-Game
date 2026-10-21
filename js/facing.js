// Package v08: the hero faces where he walks, then turns toward the station / target he works on.
// Sprites face right natively; a layout flipX (developer mode) is respected outside battle.
let heroFacing=1,facingPlace=null;
function setHeroFacing(dir){heroFacing=dir<0?-1:1;let flip=s.mode!=='battle'&&sceneLayout().actor?.flipX;$('actor').style.setProperty('--facing',String(heroFacing*(flip?-1:1)))}
function faceToward(x){let hx=Number.parseFloat($('actor').style.left);if(Number.isFinite(hx)&&Number.isFinite(x)&&Math.abs(x-hx)>1)setHeroFacing(x<hx?-1:1)}
function heroDestination(i){if(s.mode==='battle'){let enemyX=Number.parseFloat($('dummy').style.left)||74;return i<3?enemyX-20:Math.min(42,enemyX-26)}return sceneLayout().actions[i]?.hero.x}
function heroFocusX(i){if(s.mode==='battle')return Number.parseFloat($('dummy').style.left)||74;let st=sceneLayout().stations[i];return st?st.x:NaN}
const facingBaseMove=moveHero;
moveHero=async function(i){faceToward(heroDestination(i));await facingBaseMove(i);faceToward(heroFocusX(i))};
const facingBaseRender=render;
render=function(){facingBaseRender();let nameTag=document.querySelector('#actor .actor-name');if(nameTag)nameTag.textContent=s.mode==='battle'?'นักผจญภัย':heroName()+' Lv.'+(s.village.character?.level||1);let place=s.village.location+':'+s.mode;if(place!==facingPlace){facingPlace=place;if(s.mode==='battle')faceToward(heroFocusX(0));else setHeroFacing(1)}else setHeroFacing(heroFacing)};
render();
