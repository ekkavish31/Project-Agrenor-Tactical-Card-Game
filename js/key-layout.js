/* v98.198 · keyboard shortcuts work with ANY keyboard layout (Thai, Cyrillic, …) without switching to English.
   Game code tests e.key ('e', 'a', 'm', '1' …). With a non-Latin layout e.key is a Thai letter, so those tests failed. This capture-phase listener runs before
   every other keydown/keyup listener and, when e.key is not ASCII, replaces it on that event with the character of the physical key (from e.code). Text fields are left alone
   (typing a name in Thai still works). Layouts that already produce ASCII (QWERTY, AZERTY, Dvorak) are not touched. */
(function(root){'use strict';
const SYM={Minus:'-',Equal:'=',Comma:',',Period:'.',Slash:'/',Semicolon:';',Quote:"'",BracketLeft:'[',BracketRight:']',Backslash:'\\',Backquote:'`'};
function latin(e){const c=e.code||'';let m;
 if((m=/^Key([A-Z])$/.exec(c)))return e.shiftKey!==!!e.getModifierState?.('CapsLock')?m[1]:m[1].toLowerCase();
 if((m=/^Digit([0-9])$/.exec(c)))return m[1];
 return SYM[c]||null}
function fix(e){
 const k=e.key;if(!k||k.length>1&&k!=='Unidentified'&&k!=='Dead'&&k!=='Process')return;
 if(k.length===1&&k.charCodeAt(0)<128)return;                      // already ASCII
 const t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||'')))return;
 const l=latin(e);if(!l)return;
 try{Object.defineProperty(e,'key',{value:l,configurable:true})}catch{}}
root.addEventListener('keydown',fix,true);root.addEventListener('keyup',fix,true);
})(window);
