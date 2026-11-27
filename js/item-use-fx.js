/* v98.1179 · ITEM USE FX — what happens when a consumable is used from the card-book (สมุดผนึก):
   the CARD turns over and becomes the real ITEM picture (assets/cards/item/<key>.webp), a restoring effect plays by item kind (HP = green crosses · stamina = golden sparks · water = blue drops),
   floating "HP +n / แรง +n" numbers rise, and the item fades away.
   ItemUseFX.play({ key, hp, st, rect, node? }) → Promise (resolves when the effect has finished; never throws, never blocks the game).
   rect = the card's screen rectangle BEFORE the bag is redrawn · node = a clone of the card to show first (optional). Draws inside the open <dialog> (the card-book) so it is above it. */
(function (root) {
  'use strict';
  const TINT = { momWater: '#7fd0ff', holyWater: '#9fe6ff', energyDrink: '#ffe45a', potion: '#ff7a8a', bigPotion: '#ff7a8a', elixir: '#c79bff' };
  function css() {
    if (document.getElementById('iuCss')) return; const s = document.createElement('style'); s.id = 'iuCss';
    s.textContent = `
#itemUse{position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden}
#itemUse .iu-stage{position:absolute;transform-style:preserve-3d;perspective:900px}
#itemUse .iu-card{position:absolute;inset:0;transition:transform .32s ease-in,opacity .1s .3s;transform-origin:50% 50%;overflow:hidden;border-radius:10px}
#itemUse .iu-card>*{pointer-events:none}
#itemUse .iu-art{position:absolute;left:50%;top:50%;width:125%;aspect-ratio:1;object-fit:cover;border-radius:14px;border:3px solid #f6e6c2;box-sizing:border-box;transform:translate(-50%,-50%) rotateY(-90deg) scale(.6);opacity:0;filter:drop-shadow(0 8px 14px #0008) drop-shadow(0 0 18px var(--t,#ffe08a));transition:transform .5s cubic-bezier(.2,1.3,.4,1) .3s,opacity .2s .3s}
#itemUse .iu-glow{position:absolute;left:50%;top:50%;width:170%;aspect-ratio:1;border-radius:50%;transform:translate(-50%,-50%) scale(.2);opacity:0;background:radial-gradient(circle,var(--t,#ffe08a)aa 0,#0000 65%)}
#itemUse.go .iu-card{transform:rotateY(90deg);opacity:0}
#itemUse.go .iu-art{transform:translate(-50%,-50%) rotateY(0) scale(1.25);opacity:1}
#itemUse.go .iu-glow{animation:iuGlow .9s .5s ease-out forwards}
#itemUse.out .iu-art{transition:transform .45s ease-in,opacity .45s;transform:translate(-50%,-62%) scale(.55);opacity:0}
@keyframes iuGlow{0%{opacity:.9;transform:translate(-50%,-50%) scale(.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
#itemUse .iu-p{position:absolute;font:900 22px/1 system-ui,sans-serif;pointer-events:none;opacity:0;animation:iuUp var(--d,1.1s) var(--t0,.7s) ease-out forwards;text-shadow:0 0 6px currentColor}
@keyframes iuUp{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.1) rotate(var(--r,0deg))}}
#itemUse .iu-n{position:absolute;left:50%;font:900 26px/1 AgThai,VillageThai,system-ui,sans-serif;white-space:nowrap;transform:translateX(-50%);opacity:0;animation:iuNum 1.3s var(--t0,.9s) ease-out forwards;text-shadow:0 2px 3px #000c,0 0 10px currentColor}
@keyframes iuNum{0%{opacity:0;transform:translate(-50%,10px)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-70px)}}
@media(prefers-reduced-motion:reduce){#itemUse .iu-p{animation-duration:.01s}}`;
    document.head.append(s);
  }
  function play(o) {
    return new Promise(resolve => {
      try {
        const r = o.rect; if (!r || !r.width || !document.body) { resolve(); return; }
        css();
        const host = document.querySelector('dialog[open]') || document.body, el = document.createElement('div'); el.id = 'itemUse';
        const tint = TINT[o.key] || (o.hp && !o.st ? '#7be07b' : !o.hp && o.st ? '#ffd24a' : '#ffe08a');
        el.style.setProperty('--t', tint);
        const w = r.width, h = r.height, cx = r.left + w / 2, cy = r.top + h / 2;
        const st = document.createElement('div'); st.className = 'iu-stage'; st.style.cssText = `left:${r.left}px;top:${r.top}px;width:${w}px;height:${h}px`;
        const card = document.createElement('div'); card.className = 'iu-card'; if (o.node) card.appendChild(o.node);
        const art = document.createElement('img'); art.className = 'iu-art'; art.alt = ''; art.src = 'assets/cards/item/' + o.key + '.webp'; art.onerror = () => { art.remove() };
        const glow = document.createElement('div'); glow.className = 'iu-glow';
        st.append(glow, card, art); el.append(st);
        /* restoring particles: HP = green crosses · stamina = golden sparks · water = drops */
        const mk = (txt, col, n, spread, t0) => { for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.className = 'iu-p'; p.textContent = txt; p.style.color = col; const a = Math.random() * 6.283, d = 30 + Math.random() * spread; p.style.left = cx - 8 + Math.cos(a) * 14 + 'px'; p.style.top = cy - 8 + Math.sin(a) * 14 + 'px'; p.style.setProperty('--x', Math.round(Math.cos(a) * d) + 'px'); p.style.setProperty('--y', Math.round(Math.sin(a) * d - 70 - Math.random() * 50) + 'px'); p.style.setProperty('--r', Math.round(Math.random() * 90 - 45) + 'deg'); p.style.setProperty('--t0', (t0 + Math.random() * .35) + 's'); p.style.setProperty('--d', (.9 + Math.random() * .5) + 's'); el.append(p) } };
        const water = o.key === 'momWater' || o.key === 'holyWater';
        if (o.hp > 0) mk('✚', '#7be07b', 9, 110, .7);
        if (o.st > 0) mk(water ? '●' : '✦', water ? '#7fd0ff' : '#ffd24a', 10, 130, .8);
        const num = (txt, col, dy) => { const n = document.createElement('b'); n.className = 'iu-n'; n.textContent = txt; n.style.color = col; n.style.left = cx + 'px'; n.style.top = r.top - 10 + dy + 'px'; el.append(n) };
        let dy = 0; if (o.hp > 0) { num('HP +' + o.hp, '#9cf29c', dy); dy -= 30 } if (o.st > 0) num('แรง +' + o.st, '#ffe07a', dy);
        host.append(el);
        try { root.Sfx?.play?.('mg-heal', { vol: .9 }) } catch (e) { }
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('go')));
        setTimeout(() => el.classList.add('out'), 1500);
        setTimeout(() => { el.remove(); resolve() }, 2000);
      } catch (e) { resolve() }
    });
  }
  root.ItemUseFX = { play };
})(globalThis);
