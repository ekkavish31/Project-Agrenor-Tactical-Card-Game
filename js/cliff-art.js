/* v51 textured rock for the crag stamp: tileable cliff face + flagstone top (assets/tactics/cliff). Code fallback when images are missing. */
(function(){'use strict';
const files={cliff:'assets/tactics/cliff/cliff-rock.png',top:'assets/tactics/cliff/stone-top.png'},imgs={},pats={};
for(const k in files){const im=new Image();imgs[k]={im,ready:false};im.onload=()=>imgs[k].ready=true;im.src=files[k]}
window.CliffArt={
 ready(k){return !!imgs[k]?.ready},
 size:256,
 pattern(ctx,k){const e=imgs[k];if(!e?.ready)return null;if(!pats[k]||pats[k].ctx!==ctx)pats[k]={ctx,p:ctx.createPattern(e.im,'repeat')};return pats[k].p}
};
})();
