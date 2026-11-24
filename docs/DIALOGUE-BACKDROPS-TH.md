# ตรวจสถานที่และภาพฉากหลังบทสนทนา · v98.1027

ตรวจจาก scene/event/service ID ใน source จริง ภาพใหม่เป็นงานฉาก ไม่แก้บทพูด เควส ตารางเวลา หรือ canon.
คัตซีนคุย NPC ผ่าน Story.sceneAt ใช้สถานที่ NPC อยู่จริง ณ เวลานั้น แทนค่าเริ่มต้นในตารางนี้; การเปลี่ยน bg รายบรรทัดยังคงเดิม.

| ประเภท | ID | แมพ | สถานที่/ฉาก | ภาพ | แหล่งข้อมูล |
|---|---|---|---|---|---|
| คัตซีน | opening | fernvale | home | assets/home.webp | js/story-data.js |
| เปลี่ยนฉากระหว่างบท | opening:36 | fernvale | ตามบรรทัด | assets/new-game-prologue/images/hero-house.webp | js/story-data.js |
| คัตซีน | bookExit | fernvale | house | assets/new-game-prologue/images/hero-house.webp | js/story-data.js |
| คัตซีน | bookFirst | fernvale | house | assets/new-game-prologue/images/hero-house.webp | js/story-data.js |
| คัตซีน | elderMeet | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | goatsDone | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | homeWelcome | fernvale | home | assets/home.webp | js/story-data.js |
| คัตซีน | pumpkinDone | fernvale | farm | assets/generated-village/farm.png | js/story-data.js |
| คัตซีน | seeds | fernvale | farm | assets/generated-village/farm.png | js/story-data.js |
| คัตซีน | tomStall | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | stallDone | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | day2 | fernvale | home | assets/home.webp | js/story-data.js |
| คัตซีน | guardTalk | fernvale | village-gate | assets/scenes/dialogue/village-gate.webp | js/story-data.js |
| คัตซีน | crystal | fernvale | mine | assets/scenes/area-mine.webp | js/story-data.js |
| คัตซีน | gusLantern | fernvale | forge | assets/forge.webp | js/story-data.js |
| คัตซีน | lanternsDone | fernvale | workshop | assets/workshop.webp | js/story-data.js |
| คัตซีน | craftDone | fernvale | forge | assets/forge.webp | js/story-data.js |
| คัตซีน | hireDone | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | day3 | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | soldOne | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | raid | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | awaken | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | plate | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | safTalk | fernvale | healer | assets/generated-village/healer.png | js/story-data.js |
| คัตซีน | sibSwordIntro | fernvale | forge | assets/forge.webp | js/story-data.js |
| คัตซีน | sibSwordDone | fernvale | forge | assets/forge.webp | js/story-data.js |
| คัตซีน | potionsDone | fernvale | healer | assets/generated-village/healer.png | js/story-data.js |
| คัตซีน | kierHurt | fernvale | forest-stream | assets/scenes/dialogue/forest-stream.webp | js/story-data.js |
| คัตซีน | kierAdmitted | fernvale | healer | assets/generated-village/healer.png | js/story-data.js |
| คัตซีน | homeKier | fernvale | square | assets/market.webp | js/story-data.js |
| คัตซีน | departure | fernvale | forest | assets/scenes/area-forest.webp | js/story-data.js |
| คัตซีน | camp | fernvale | camp | assets/camp.webp | js/story-data.js |
| คัตซีน | guildFirst | fernvale | guild | assets/generated-village/guild.png | js/story-data.js |
| คัตซีน | home | fernvale | house | assets/new-game-prologue/images/hero-house.webp | js/story-data.js |
| คัตซีน | finale | fernvale | home | assets/home.webp | js/story-data.js |
| เปลี่ยนฉากระหว่างบท | finale:10 | fernvale | ตามบรรทัด | assets/market.webp | js/story-data.js |
| เปลี่ยนฉากระหว่างบท | finale:12 | fernvale | ตามบรรทัด | assets/home.webp | js/story-data.js |
| ผลประกวดทุกสาขา | contest | fernvale | square | assets/market.webp | js/story-data.js |
| ทางแยก | fugitive | willowshore | market-alley | assets/scenes/dialogue/market-alley.webp | js/crossroads.js |
| ทางแยก | fugitive | northgate | market-alley | assets/scenes/dialogue/market-alley.webp | js/crossroads.js |
| ทางแยก | callup | willowshore | willowshore | assets/scenes/dialogue/willowshore.webp | js/crossroads.js |
| ทางแยก | callup | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/crossroads.js |
| ทางแยก | callup | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/crossroads.js |
| ทางแยก | firstSick | willowshore | teahouse-yard | assets/scenes/dialogue/teahouse-yard.webp | js/crossroads.js |
| ทางแยก | firstSick | deepcairn | teahouse-yard | assets/scenes/dialogue/teahouse-yard.webp | js/crossroads.js |
| ทางแยก | firstSick | thornwatch | teahouse-yard | assets/scenes/dialogue/teahouse-yard.webp | js/crossroads.js |
| ทางแยก | mayaBroker | haven | market-alley | assets/scenes/dialogue/market-alley.webp | js/crossroads.js |
| ทางแยก | corvinInvite | lakenhold | royal-office | assets/scenes/dialogue/royal-office.webp | js/crossroads.js |
| ทางแยก | convoy | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/crossroads.js |
| ทางแยก | moonRite | northgate | moon-shrine | assets/scenes/dialogue/moon-shrine.webp | js/crossroads.js |
| ทางแยก | moonRite | thornwatch | moon-shrine | assets/scenes/dialogue/moon-shrine.webp | js/crossroads.js |
| ทางแยก | scent | thornwatch | forest-camp | assets/scenes/dialogue/forest-camp.webp | js/crossroads.js |
| ทางแยก | armor | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/crossroads.js |
| ทางแยก | sickRefugee | willowshore | refugee-camp | assets/scenes/dialogue/refugee-camp.webp | js/crossroads.js |
| ทางแยก | sickRefugee | northgate | refugee-camp | assets/scenes/dialogue/refugee-camp.webp | js/crossroads.js |
| ทางแยก | languageLeaf | lakenhold | royal-library | assets/scenes/dialogue/royal-library.webp | js/crossroads.js |
| ทางแยก | gouge | fernvale | square | assets/market.webp | js/crossroads.js |
| ทางแยก | gouge | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/crossroads.js |
| ทางแยก | gouge | willowshore | willowshore | assets/scenes/dialogue/willowshore.webp | js/crossroads.js |
| ทางแยก | gouge | deepcairn | deepcairn | assets/scenes/dialogue/deepcairn.webp | js/crossroads.js |
| ทางแยก | gouge | thornwatch | thornwatch | assets/scenes/dialogue/thornwatch.webp | js/crossroads.js |
| ทางแยก | gouge | vinehollow | vinehollow | assets/scenes/dialogue/vinehollow.webp | js/crossroads.js |
| ทางแยก | gouge | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/crossroads.js |
| ทางแยก | gouge | haven | haven | assets/scenes/dialogue/haven.webp | js/crossroads.js |
| ทางแยก | gouge | brookmere | brookmere | assets/scenes/dialogue/brookmere.webp | js/crossroads.js |
| ทางแยก | boudilList | deepcairn | mine-tool-yard | assets/scenes/dialogue/mine-tool-yard.webp | js/crossroads.js |
| ทางแยก | lightPass | thornwatch | forest-camp | assets/scenes/dialogue/forest-camp.webp | js/crossroads.js |
| ทางแยก | sigrid | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/crossroads.js |
| ทางแยก | sigrid | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/crossroads.js |
| ทางแยก | bram | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/crossroads.js |
| ทางแยก | bram | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/crossroads.js |
| ทางแยก | kier | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/crossroads.js |
| ทางแยก | kier | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/crossroads.js |
| ทางแยก | luna | lakenhold | royal-library | assets/scenes/dialogue/royal-library.webp | js/crossroads.js |
| ทางแยก | luna | thornwatch | thornwatch | assets/scenes/dialogue/thornwatch.webp | js/crossroads.js |
| ทางแยก | armySupply | lakenhold | supply-warehouse | assets/scenes/dialogue/supply-warehouse.webp | js/crossroads.js |
| ทางแยก | armySupply | haven | supply-warehouse | assets/scenes/dialogue/supply-warehouse.webp | js/crossroads.js |
| ทางแยก | caravanEscort | haven | haven | assets/scenes/dialogue/haven.webp | js/crossroads.js |
| ทางแยก | caravanEscort | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/crossroads.js |
| ทางแยก | gravenWar | haven | supply-warehouse | assets/scenes/dialogue/supply-warehouse.webp | js/crossroads.js |
| ทางแยก | gravenWar | lakenhold | supply-warehouse | assets/scenes/dialogue/supply-warehouse.webp | js/crossroads.js |
| ทางแยก | gravenWar | willowshore | supply-warehouse | assets/scenes/dialogue/supply-warehouse.webp | js/crossroads.js |
| ทางแยก | farmLabor | fernvale | wheat-field | assets/scenes/dialogue/wheat-field.webp | js/crossroads.js |
| ทางแยก | refugeeShelter | fernvale | square | assets/market.webp | js/crossroads.js |
| ทางแยก | granaryAsk | fernvale | granary | assets/scenes/dialogue/granary.webp | js/crossroads.js |
| ทางแยก | leafBeetle | fernvale | wheat-field | assets/scenes/dialogue/wheat-field.webp | js/crossroads.js |
| ทางแยก | pilgrimTwo | fernvale | inn | assets/generated-village/inn.png | js/crossroads.js |
| ทางแยก | pilgrimTwo | northgate | inn | assets/generated-village/inn.png | js/crossroads.js |
| ทางแยก | northPriest | northgate | holding-room | assets/scenes/dialogue/holding-room.webp | js/crossroads.js |
| ทางแยก | northPriest | deepcairn | holding-room | assets/scenes/dialogue/holding-room.webp | js/crossroads.js |
| ทางแยก | godAnswers | vinehollow | vineyard | assets/scenes/dialogue/vineyard.webp | js/crossroads.js |
| ทางแยก | godAnswers | thornwatch | moon-shrine | assets/scenes/dialogue/moon-shrine.webp | js/crossroads.js |
| ทางแยก | manMadeGod | northgate | army-camp | assets/scenes/dialogue/army-camp.webp | js/crossroads.js |
| ทางแยก | manMadeGod | thornwatch | army-camp | assets/scenes/dialogue/army-camp.webp | js/crossroads.js |
| ทางแยก | manMadeGod | lakenhold | army-camp | assets/scenes/dialogue/army-camp.webp | js/crossroads.js |
| ทางแยก | dragonTale | haven | haven | assets/scenes/dialogue/haven.webp | js/crossroads.js |
| ทางแยก | dragonTale | vinehollow | vinehollow | assets/scenes/dialogue/vinehollow.webp | js/crossroads.js |
| ทางแยก | dragonTale | thornwatch | thornwatch | assets/scenes/dialogue/thornwatch.webp | js/crossroads.js |
| ทางแยก | dragonAsh | vinehollow | vineyard | assets/scenes/dialogue/vineyard.webp | js/crossroads.js |
| ทางแยก | dragonAsh | haven | haven | assets/scenes/dialogue/haven.webp | js/crossroads.js |
| ทางแยก | dragonOmen | haven | haven | assets/scenes/dialogue/haven.webp | js/crossroads.js |
| ทางแยก | dragonOmen | vinehollow | vinehollow | assets/scenes/dialogue/vinehollow.webp | js/crossroads.js |
| ทางแยก | dragonOmen | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/crossroads.js |
| ทางแยก | dragonName | lakenhold | royal-library | assets/scenes/dialogue/royal-library.webp | js/crossroads.js |
| ทางแยก | dragonWell | thornwatch | forest-camp | assets/scenes/dialogue/forest-camp.webp | js/crossroads.js |
| จุดเนื้อเรื่อง | news | fernvale | square | assets/market.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | news | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | news | willowshore | willowshore | assets/scenes/dialogue/willowshore.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | news | deepcairn | deepcairn | assets/scenes/dialogue/deepcairn.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | news | thornwatch | thornwatch | assets/scenes/dialogue/thornwatch.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | news | vinehollow | vinehollow | assets/scenes/dialogue/vinehollow.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | news | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | news | haven | haven | assets/scenes/dialogue/haven.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | news | brookmere | brookmere | assets/scenes/dialogue/brookmere.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | camp | northgate | refugee-camp | assets/scenes/dialogue/refugee-camp.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | camp | willowshore | refugee-camp | assets/scenes/dialogue/refugee-camp.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | ruin | thornwatch | ruins | assets/scenes/area-ruins.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | epilogue | deepcairn | deepcairn | assets/scenes/dialogue/deepcairn.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | epilogue | thornwatch | thornwatch | assets/scenes/dialogue/thornwatch.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | epilogue | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | dragon | vinehollow | volcanic-crater | assets/scenes/dialogue/volcanic-crater.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | dragon | haven | volcanic-crater | assets/scenes/dialogue/volcanic-crater.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | finale | deepcairn | deep-mine | assets/scenes/dialogue/deep-mine.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | pit | deepcairn | deep-mine | assets/scenes/dialogue/deep-mine.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | faith | northgate | pilgrim-room | assets/scenes/dialogue/pilgrim-room.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | clinic | willowshore | war-clinic | assets/scenes/dialogue/war-clinic.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | army | lakenhold | supply-warehouse | assets/scenes/dialogue/supply-warehouse.webp | js/story-cast.js |
| จุดเนื้อเรื่อง | army | northgate | supply-warehouse | assets/scenes/dialogue/supply-warehouse.webp | js/story-cast.js |
| บริการเมือง | ferry | willowshore | willowshore | assets/scenes/dialogue/willowshore.webp | js/town-services.js |
| บริการเมือง | bounty | lakenhold | guild | assets/generated-village/guild.png | js/town-services.js |
| บริการเมือง | tower | lakenhold | mage-hall | assets/scenes/dialogue/mage-hall.webp | js/town-services.js |
| บริการเมือง | museum | lakenhold | museum | assets/scenes/dialogue/museum.webp | js/town-services.js |
| บริการเมือง | blessing | lakenhold | cathedral | assets/scenes/dialogue/cathedral.webp | js/town-services.js |
| บริการเมือง | ferry | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/town-services.js |
| บริการเมือง | mine | deepcairn | mine | assets/scenes/area-mine.webp | js/town-services.js |
| บริการเมือง | guide | thornwatch | forest-camp | assets/scenes/dialogue/forest-camp.webp | js/town-services.js |
| บริการเมือง | tales | thornwatch | forest-camp | assets/scenes/dialogue/forest-camp.webp | js/town-services.js |
| บริการเมือง | spring | vinehollow | hot-spring | assets/scenes/dialogue/hot-spring.webp | js/town-services.js |
| ตัวละครประจำเมือง | corvin | lakenhold | lakenhold | assets/scenes/dialogue/lakenhold.webp | js/story-cast.js |
| ตัวละครประจำเมือง | helga | northgate | northgate | assets/scenes/dialogue/northgate.webp | js/story-cast.js |
| ตัวละครประจำเมือง | darren | deepcairn | deepcairn | assets/scenes/dialogue/deepcairn.webp | js/story-cast.js |
| ตัวละครประจำเมือง | irene | willowshore | willowshore | assets/scenes/dialogue/willowshore.webp | js/story-cast.js |
| ตัวละครประจำเมือง | vik | haven | haven | assets/scenes/dialogue/haven.webp | js/story-cast.js |
| ตัวละครประจำเมือง | mierris | thornwatch | thornwatch | assets/scenes/dialogue/thornwatch.webp | js/story-cast.js |
| ตัวละครประจำเมือง | lorrik | thornwatch | thornwatch | assets/scenes/dialogue/thornwatch.webp | js/story-cast.js |

## บทพูดบนแมพจริง

- `js/town-npcs.js + js/village-mind.js` — ตำแหน่ง NPC บน village-town ตามตารางเวลา: ใช้แมพจริงด้านหลังกล่องบทพูด
- `js/interior.js + js/village-place.js` — place/farm ที่กำลังเข้าอยู่: ใช้ห้อง/แมพย่อยจริง
- `js/party-talk.js` — แมพที่ทีมกำลังเดิน/พัก: ใช้แมพจริง
- `js/battle-talk.js + js/town-battle.js` — สนามต่อสู้ที่กำลังเล่น: ใช้สนามจริง

## ข้อขัดกันในข้อมูลเดิม

- `dragonTale`: ข้อความระบุท่าเรือ แต่เปิดที่ vinehollow/thornwatch ได้ด้วย → ยึด host town; ไม่สร้างท่าเรือในเมืองที่ไม่มีหลักฐาน
- `dragonAsh`: ข้อความระบุไร่องุ่น แต่เปิดที่ haven ได้ด้วย → vineyard เฉพาะ vinehollow; haven ใช้ท่าเรือจริง
- `godAnswers`: ข้อความมองจันทร์เหนือไร่องุ่น แต่เปิดที่ thornwatch ได้ด้วย → vineyard ที่ vinehollow / ศาลป่าที่ thornwatch

## ขอบเขต

ครอบคลุมบทที่ถูกเรียกใช้โดย Cutscene, world-map modal, Crossroads, StoryCast และ TownServices; บทสุ่ม/บทตอบกลับรับสถานที่จากเจ้าของหน้าต่างเดียวกันทุกประโยค ไม่เดาจากชื่อผู้พูด.
ภาพของ New Game intro เดิมคงอยู่ ตารางนี้แยกจาก prologue slides ของ title-screen. ฉากจบใช้ปากเหมือง/ห้องชั้นล่าง; เรื่องเล่าที่พาดพิงสถานที่ไกลยังใช้สถานที่ที่ผู้เล่ากำลังอยู่.
