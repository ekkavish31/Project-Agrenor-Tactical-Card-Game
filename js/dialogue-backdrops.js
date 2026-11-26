/* v98.1027 · Authored dialogue locations. Scene/event/service IDs, never speaker names or guessed keywords.
   NPC quest talks use the NPC's actual scheduled place. Ordinary NPC/battle bubbles keep their live map.
   This is presentation only: no quest, schedule, geography or save changes. */
(function (root) {
  'use strict';
  const painted = id => 'assets/scenes/dialogue/' + id + '.webp';
  const IMG = {
    home: 'assets/home.webp', square: 'assets/market.webp', forge: 'assets/forge.webp', workshop: 'assets/workshop.webp',
    house: 'assets/new-game-prologue/images/hero-house.webp', inn: 'assets/generated-village/inn.png',
    guild: 'assets/generated-village/guild.png', healer: 'assets/generated-village/healer.png', temple: 'assets/generated-village/temple.png',
    farm: 'assets/generated-village/farm.png', door: 'assets/generated-village/door.png', camp: 'assets/camp.webp',
    road: 'assets/new-game-prologue/images/road-to-fernvale.webp', forest: 'assets/scenes/area-forest.webp', mine: 'assets/scenes/area-mine.webp', ruins: 'assets/scenes/area-ruins.webp',
    snow: 'assets/scenes/area-frost.webp', coast: 'assets/scenes/area-coast.webp', swamp: 'assets/scenes/area-swamp.webp', quarry: 'assets/scenes/area-quarry.webp'
  };
  for (const id of 'northgate haven brookmere refugee-camp royal-office deep-mine market-alley teahouse-yard forest-camp royal-library moon-shrine pilgrim-room wheat-field granary war-clinic supply-warehouse forest-stream village-gate vineyard volcanic-crater hot-spring mage-hall museum holding-room army-camp mine-tool-yard deep-mine-inner cathedral'.split(' ')) IMG[id] = painted(id);
  for (const id of ['lakenhold', 'willowshore', 'deepcairn', 'thornwatch', 'vinehollow']) IMG[id] = painted(id);
  const TOWNS = { fernvale: 'square', home: 'square', lakenhold: 'lakenhold', willowshore: 'willowshore', deepcairn: 'deepcairn', thornwatch: 'thornwatch', vinehollow: 'vinehollow', northgate: 'northgate', haven: 'haven', brookmere: 'brookmere' };
  const PLACES = { home: 'home', forge: 'forge', market: 'square', shop: 'square', square: 'square', inn: 'inn', guild: 'guild', healer: 'healer', temple: 'temple', farm: 'farm', hildaFarm: 'farm', east: 'village-gate', west: 'village-gate', gate: 'village-gate', training: 'forest' };
  const INTRO = {
    opening: 'home', bookExit: 'house', bookFirst: 'house', elderMeet: 'square', goatsLook: 'square', goatsDone: 'square', homeWelcome: 'home',
    pumpkinDone: 'farm', seeds: 'farm', tomStall: 'square', stallDone: 'square', day2: 'home', guardTalk: 'village-gate',
    crystal: 'mine', gusLantern: 'forge', lanternsDone: 'workshop', craftDone: 'forge', hireDone: 'square', day3: 'square',
    soldOne: 'square', raid: 'square', awaken: 'square', plate: 'square', safTalk: 'healer', sibSwordIntro: 'forge',
    sibSwordDone: 'forge', sigLight: 'guild', potionsDone: 'healer', kierHurt: 'forest-stream', kierAdmitted: 'healer', homeKier: 'square',
    departure: 'forest', camp: 'camp', guildFirst: 'guild', home: 'house', finale: 'home', contest: 'square'
  };
  const EVENTS = {
    fugitive: 'market-alley', callup: null, firstSick: 'teahouse-yard', mayaBroker: 'market-alley', corvinInvite: 'royal-office',
    convoy: 'northgate', moonRite: 'moon-shrine', scent: 'forest-camp', armor: null, sickRefugee: 'refugee-camp',
    languageLeaf: 'royal-library', gouge: null, boudilList: 'mine-tool-yard', lightPass: 'forest-camp', sigrid: null,
    bram: null, kier: null, luna: null, armySupply: 'supply-warehouse', caravanEscort: null,
    gravenWar: 'supply-warehouse', farmLabor: 'wheat-field', refugeeShelter: 'square', granaryAsk: 'granary',
    leafBeetle: 'wheat-field', pilgrimTwo: 'inn', northPriest: 'holding-room', godAnswers: null,
    manMadeGod: 'army-camp', dragonTale: null, dragonAsh: null, dragonOmen: null,
    dragonName: 'royal-library', dragonWell: 'forest-camp'
  };
  const SERVICES = {
    news: null, camp: 'refugee-camp', ruin: 'ruins', epilogue: null, dragon: 'volcanic-crater', finale: 'deep-mine',
    pit: 'deep-mine', faith: 'pilgrim-room', clinic: 'war-clinic', army: 'supply-warehouse',
    ferry: null, bounty: 'guild', tower: 'mage-hall', museum: 'museum', blessing: 'cathedral',
    mine: 'mine', guide: 'forest-camp', tales: 'forest-camp', spring: 'hot-spring', rumor: 'inn', inn: 'inn', hall: 'royal-office'
  };
  const BIOMES = { forest: 'forest', snow: 'snow', frost: 'snow', sand: 'coast', coast: 'coast', swamp: 'swamp', hills: 'quarry', stone: 'quarry', ruins: 'ruins', mine: 'mine', volcano: 'volcanic-crater', grass: 'road' };
  function village(place) { return PLACES[place] || (/^npc\d+$/.test(place || '') ? 'door' : 'square'); }
  function resolve(context = {}) {
    const { town, place, event, service, location, biome } = context;
    // Multi-town events keep the real host map. Their prose sometimes names a different settlement's landmark.
    const localEvent = event === 'luna' && town === 'lakenhold' ? 'royal-library' :
      event === 'godAnswers' ? (town === 'vinehollow' ? 'vineyard' : 'moon-shrine') :
      event === 'dragonAsh' && town === 'vinehollow' ? 'vineyard' : null;
    const key = location || localEvent || (event && EVENTS[event]) || (service && SERVICES[String(service).replace(/^st:/, '')]) ||
      (place && village(place)) || TOWNS[town] || BIOMES[biome];
    return key && IMG[key] ? { key, src: IMG[key], town: town || null } : null;
  }
  function intro(id, scene, place) {
    if (!scene) return scene;
    const key = place ? village(place) : INTRO[id];
    return key && IMG[key] ? { ...scene, art: null, bg: IMG[key], dialogueLocation: { map: 'fernvale', place: place || key, scene: id } } : scene;
  }
  root.DialogueBackdrops = { IMG, TOWNS, PLACES, INTRO, EVENTS, SERVICES, resolve, intro, village };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.DialogueBackdrops;
})(typeof window !== 'undefined' ? window : globalThis);
