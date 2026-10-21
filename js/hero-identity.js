// v14: the lead is a shonen hero with a player-chosen name — not a blacksmith.
// • heroName() everywhere the game shows the lead · name asked once on a new save (rename: click the name in the scene or the top-bar face)
// • PLAYABLE = characters that can lead the party. Each has its own look/asset prefix; more join later
//   (art ids: char-<key>-…; the first lead keeps the existing hero_* files until new art replaces them).
// • Crafting (forge) stays as a village facility anyone can use — it is not the hero's profession.
const PLAYABLE={hero:{defaultName:'นักผจญภัย',title:'ตัวเอก',element:'fire',assetPrefix:'hero',card:'u-hero'}};
function leaderKey(){return (typeof s!=='undefined'&&s.village?.leader&&PLAYABLE[s.village.leader])?s.village.leader:'hero'}
function heroName(){let n=typeof s!=='undefined'&&s.village?.heroName;return (n&&String(n).trim())||PLAYABLE[leaderKey()].defaultName}
function askHeroName(first){if(typeof s==='undefined'||!s.village)return;let cur=s.village.heroName||'';let n=prompt(first?'ตั้งชื่อตัวเอกของคุณ (เปลี่ยนภายหลังได้โดยคลิกชื่อหรือรูปตัวเอก)':'เปลี่ยนชื่อตัวเอก',cur||'');
 if(n===null){if(first&&!s.village.heroName){s.village.heroName=PLAYABLE.hero.defaultName;save()}return}n=n.trim().slice(0,16);if(!n)return;s.village.heroName=n;save();if(typeof render==='function')render();syncHeroName()}
function syncHeroName(){document.querySelectorAll('[data-hero-name]').forEach(el=>{if(el.textContent!==heroName())el.textContent=heroName()});document.title=heroName()+' · Project A'}
window.HeroIdentity={PLAYABLE,leaderKey,heroName,askHeroName,syncHeroName};
document.addEventListener('click',e=>{if(e.target.closest('[data-hero-name],.hero-face,#heroFace'))askHeroName(false)});
window.addEventListener('load',()=>{setTimeout(()=>{syncHeroName();let ed=/[?&]editor=/.test(location.search);if(!ed&&typeof s!=='undefined'&&s.village&&!s.village.heroName&&!navigator.webdriver)askHeroName(true)},600)});
setInterval(syncHeroName,800);
