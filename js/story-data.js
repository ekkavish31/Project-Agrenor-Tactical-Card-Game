/* v93 · Intro story data: speakers + cutscenes for the Fernvale festival prologue and the first expedition.
   Pure data — edit text freely. {hero} = the hero's name. Backgrounds reuse existing scene art.
   Lore source: docs/lore/GAME-ERA.md (world of the heirs, tens of thousands of years after the Glaelanar). */
(function(root){'use strict';
const B={home:'assets/home.webp',market:'assets/market.webp',work:'assets/workshop.webp',anvil:'assets/forge.webp',camp:'assets/camp.webp',
 forest:'assets/scenes/area-forest.webp',mine:'assets/scenes/area-mine.webp',ruins:'assets/scenes/area-ruins.webp'};
const ally=()=>{try{const c=(s.village.companions||[])[0];const R=root.Companions?.ROSTER?.[c?.key];return c&&R?{name:R.name,portrait:'assets/cards/portraits/u-'+c.key+'.webp'}:null}catch{return null}};
const SPEAKERS={
 hero:{name:()=>{try{return s.village.heroName||'นักผจญภัย'}catch{return 'นักผจญภัย'}},portrait:'assets/cards/portraits/u-hero.webp'},
 mom:{name:'แม่',color:'#8a4b5c'},
 elder:{name:'ผู้ใหญ่บ้านโอเรน',color:'#56683a'},
 pip:{name:'ปิ๊บ · เด็กเลี้ยงแพะ',color:'#6f8f36'},
 tom:{name:'ลุงทอม · ช่างไม้',color:'#7a5a2a'},
 grev:{name:'เกรเวน · พ่อค้าจากเมือง',color:'#36507a'},
 guard:{name:'ยามดอร์ก',color:'#4a4a5a'},
 boss:{name:'หัวหน้าโจรป่า',portrait:'assets/cards/portraits/en-bandit.webp'},
 ally:{name:()=>ally()?.name||'เพื่อนร่วมทาง',portrait:()=>ally()?.portrait||null,color:'#3d6b6b'}};

const SCENES={
 opening:{card:{kicker:'บทนำ',title:'เฟิร์นเวล'},bg:B.home,pan:'in',tint:'dawn',fx:['rays','motes'],lines:[
  {text:'เช้าวันหนึ่งที่เฟิร์นเวล หมู่บ้านเล็ก ๆ ชานเมืองใหญ่ ริมลุ่มน้ำของ Navelmidia'},
  {who:'mom',text:'{hero}! ตื่นได้แล้ว อีกสามวันก็งานเทศกาลเก็บเกี่ยวแล้วนะ'},
  {who:'mom',text:'ผู้ใหญ่บ้านโอเรนรออยู่ที่ตลาดตั้งแต่เช้า บอกว่าปีนี้ขาดคนช่วยเยอะ'},
  {who:'mom',text:'แล้วเอามีดของพ่อติดตัวไปด้วยนะ ช่วงนี้ชายป่าไม่ค่อยปลอดภัย'},
  {who:'hero',text:'สามวัน... ทันแน่นอนแม่ ข้าไปเดี๋ยวนี้'},
  {bg:B.market,pan:'right',tint:'dawn',fx:['orb','motes','rays'],text:'ไกลออกไปบนขอบฟ้า แสงสีทองดวงหนึ่งลอยนิ่งอยู่เหนือทุ่ง'},
  {who:'mom',text:'ดวงทองมาหยุดใกล้หมู่บ้านอีกแล้ว คนแก่ว่าปีไหนมันมาใกล้ ปีนั้นจะมีเรื่อง'},
  {who:'hero',text:'แม่ก็พูดแบบนี้ทุกปี'}]},
 elderMeet:{bg:B.market,pan:'in',tint:'day',fx:['motes','dust'],lines:[
  {who:'elder',text:'มาแล้วรึ {hero} ดีเลย ข้ามีงานให้เพียบ'},
  {who:'elder',text:'เรื่องแรก... แพะของปิ๊บหนีออกจากคอกไปทั่วหมู่บ้าน ตัวหนึ่งขึ้นไปยืนบนหลังคาโรงเตี๊ยมแล้ว'},
  {who:'pip',shake:true,text:'พี่ {hero} ช่วยด้วย! ถ้ามันกินพวงมาลัยเทศกาลหมด ข้าโดนตีแน่!'},
  {text:'เป้าหมาย: จับแพะให้ครบ 3 ตัว'}]},
 goatsDone:{bg:B.market,tint:'day',fx:['motes','leaves'],lines:[
  {who:'pip',burst:{x:.5,y:.5,hue:90,n:60,speed:4},text:'ครบสามตัวแล้ว! พี่ {hero} เก่งที่สุดเลย!'},
  {who:'elder',text:'ฮ่า ๆ เริ่มวันได้ดี นี่ ข้าให้ของดี... เมล็ดฟักทองยักษ์'},
  {who:'elder',text:'ปลูกที่แปลงหลังบ้านแล้วรดน้ำทุกวัน ถ้าดูแลดี วันงานจะได้ส่งประกวด'},
  {who:'elder',text:'แล้วแผงขายของบ้านเจ้าก็พังตั้งแต่พายุคราวก่อน ซ่อมให้เสร็จก่อนงานล่ะ'}]},
 stallDone:{bg:B.market,tint:'day',fx:['dust','motes'],lines:[
  {shake:true,burst:{x:.5,y:.7,hue:35,n:50,speed:3,ring:false},text:'ตอก! ตอก! ตอก!'},
  {who:'tom',text:'ฝีมือไม่เลวนี่ไอ้หนู แผงนี้ตั้งได้อีกสิบปี'},
  {who:'tom',text:'โอ๊ย... ขาข้า ข้าตกบันไดเมื่อวาน งานโคมไฟเทศกาลคงต้องฝากเจ้าแล้วล่ะ'},
  {text:'วันนี้ทำได้แค่นี้ก่อน กลับบ้านไปนอน พรุ่งนี้ค่อยว่ากันใหม่'}]},
 day2:{card:{kicker:'วันที่ 2',title:'ทำของ และหาคน'},bg:B.home,pan:'in',tint:'dawn',fx:['rays','motes'],lines:[
  {who:'tom',text:'โคมเทศกาลปีนี้ ผู้ใหญ่บ้านอยากให้สว่างกว่าทุกปี'},
  {who:'tom',text:'ข้ารู้ว่าในถ้ำเหมืองเก่าทางเหนือมีผลึกที่เรืองแสงได้เอง... แต่ช่วงนี้มีค้างคาวกับสไลม์เต็มไปหมด'},
  {who:'hero',text:'ปล่อยเป็นหน้าที่ข้าเอง'},
  {text:'เป้าหมาย: เข้าถ้ำเหมืองเก่า แล้วชนะการต่อสู้ 1 ครั้ง'}]},
 crystal:{bg:B.mine,pan:'in',tint:'cave',fx:['crystals','mist'],lines:[
  {text:'ลึกเข้าไปในอุโมงค์ ผนังหินเต็มไปด้วยผลึกที่เต้นเป็นจังหวะ ราวกับมีหัวใจ'},
  {who:'hero',text:'มัน... อุ่น'},
  {flash:'#b48cff',burst:{x:.5,y:.55,hue:280,n:120,speed:5,ringColor:'rgba(190,140,255,.9)'},text:'ทันทีที่ปลายนิ้วแตะผลึก แสงสีม่วงไหลวนรอบมือ แล้วดับลง'},
  {who:'hero',text:'เมื่อกี้มันอะไรกัน...'},
  {text:'ได้รับ ผลึกเรืองแสง ×3\nออกจากถ้ำแล้วกลับหมู่บ้านได้เลย'}]},
 lanternsDone:{bg:B.work,pan:'in',tint:'warm',fx:['lanterns','embers'],lines:[
  {burst:{x:.3,y:.45,hue:290,n:40,speed:3},text:'โคมดวงแรกสว่างขึ้น...'},
  {burst:{x:.5,y:.4,hue:40,n:40,speed:3},text:'ดวงที่สอง...'},
  {burst:{x:.7,y:.45,hue:300,n:40,speed:3},text:'ดวงที่สาม แสงม่วงอ่อน ๆ ผสมกับเปลวไฟอุ่น'},
  {who:'tom',text:'สวยกว่าที่ข้าทำเองซะอีก!'},
  {who:'tom',text:'ทีนี้ก็เหลือของขายในงาน โรงตีเหล็กยังว่างอยู่ ลองตีดาบสักเล่มไหม คนเมืองชอบซื้อเป็นของที่ระลึก'}]},
 craftDone:{bg:B.anvil,pan:'in',tint:'warm',fx:['embers'],lines:[
  {shake:true,burst:{x:.55,y:.55,hue:28,n:90,speed:7,grav:.12,ring:false},text:'เสียงค้อนกระทบเหล็กดังก้อง ประกายไฟแตกกระจาย'},
  {who:'hero',text:'เล่มแรกของข้า... ไม่เลวเลย'},
  {who:'hero',text:'ดีกว่ามีดเก่าของพ่อเยอะ... แต่ข้าจะเก็บมีดเล่มนั้นไว้เสมอ'},
  {text:'งานเยอะขนาดนี้ คนเดียวคงไม่ไหว ลองไปหาเพื่อนร่วมทางที่ตลาด'}]},
 hireDone:{bg:B.market,tint:'day',fx:['motes'],lines:[
  {who:'ally',text:'ข้าจะช่วยเจ้าดูแลแผงในงาน... ถ้ามีเรื่องอะไร ข้าก็พร้อมสู้ด้วย'},
  {who:'hero',text:'ดีเลย พรุ่งนี้งานใหญ่ กลับไปพักกันก่อน'}]},
 day3:{card:{kicker:'วันที่ 3',title:'งานเทศกาลเก็บเกี่ยว'},bg:B.market,pan:'in',tint:'day',fx:['lanterns','motes','rays'],lines:[
  {text:'เฟิร์นเวลไม่เคยคึกคักขนาดนี้ ธงผ้า เสียงดนตรี กลิ่นขนมปังอบลอยไปทั่วลาน'},
  {who:'grev',text:'โฮ่ เด็กบ้านนอกตั้งแผงด้วยรึ แผงข้าตรงข้ามนี่ราคาถูกกว่าครึ่ง'},
  {who:'hero',text:'ของข้าตีเองกับมือ ลองมาดูก่อนสิ'},
  {who:'grev',text:'ฮึ ก็ได้ ใครขายได้ก่อน คนนั้นชนะ'},
  {text:'เป้าหมาย: ขายของในตลาดให้ได้ 1 ชิ้น'}]},
 soldOne:{bg:B.market,tint:'day',fx:['motes','lanterns'],lines:[
  {burst:{x:.5,y:.5,hue:45,n:70,speed:4},text:'ลูกค้าคนแรกจ่ายเงินพร้อมรอยยิ้ม'},
  {who:'grev',text:'...แค่โชคช่วยเท่านั้นแหละ'},
  {who:'elder',text:'{hero}! ไปที่ลานประกวดฟักทองได้แล้ว ใกล้ประกาศผลแล้ว!'}]},
 raid:{card:{kicker:'คืนเทศกาล',title:'เสียงหอนจากชายป่า'},bg:B.market,pan:'in',tint:'dusk',fx:['lanterns','motes'],lines:[
  {text:'พระอาทิตย์ลับขอบฟ้า โคมไฟทั่วหมู่บ้านสว่างขึ้นพร้อมกัน'},
  {who:'hero',tint:'night',fx:['lanterns','stars','fireflies'],text:'สวยจัง...'},
  {wait:700,shake:true,text:'อูววววววว—'},
  {who:'guard',shake:'big',flash:'#ff5a3a',text:'โจรป่า! มันมากับฝูงหมาป่า! ทุกคนเข้าบ้าน!'},
  {who:'boss',text:'เก็บของมีค่าให้หมด ข้าได้ยินว่ามีของจากซากป่ามาอยู่ที่นี่'},
  {who:'ally',text:'{hero} ข้าอยู่ข้างเจ้า!'},
  {who:'hero',text:'ไม่มีใครแตะเฟิร์นเวลได้ทั้งนั้น'}]},
 awaken:{bg:B.market,tint:'night',fx:['stars','embers'],lines:[
  {text:'การต่อสู้ใกล้จบ แต่หัวหน้าโจรยังไม่ยอม มันเงื้อดาบใส่{hero}ที่หมดแรง'},
  {who:'boss',shake:true,text:'จบแค่นี้แหละ เด็กหมู่บ้าน!'},
  {wait:500,flash:'#ffd27a',shake:'big',burst:{x:.5,y:.5,hue:36,n:180,speed:9,ringColor:'rgba(255,200,110,.95)'},tint:'warm',fx:['embers','motes','rays'],text:'แล้วบางอย่างในอกก็ตื่นขึ้น'},
  {burst:{x:.5,y:.75,hue:30,n:80,speed:5,grav:.1,ring:false},text:'แสงสีอำพันระเบิดออกจากตัว{hero} พื้นดินใต้เท้าสั่นสะเทือน ดาบของโจรกระเด็นหลุดมือ'},
  {who:'boss',text:'แก่นพลัง... เด็กนี่มีแก่นพลัง!? ถอย! ถอยไป!'},
  {tint:'night',fx:['stars','fireflies'],text:'พวกโจรหนีหายไปในความมืด ทิ้งถุงผ้าไว้ใบหนึ่ง'},
  {who:'hero',text:'นี่มัน... แผนที่ กับจานหินเก่า ๆ'},
  {text:'ได้รับ: แผนที่สมบัติเก่า · จานหินโบราณ\nแก่นพลังธาตุดินตื่นขึ้น (+1 แต้มสเตตัส)'}]},
 plate:{bg:B.market,tint:'night',fx:['lanterns','stars'],lines:[
  {who:'elder',text:'อักษรแบบนี้ข้าไม่เคยเห็น... ไม่ใช่ของโจรแถวนี้แน่'},
  {who:'elder',text:'แผนที่นี่ชี้ไปที่ค่ายในป่าตะวันออก ถ้าปล่อยไว้ พวกมันจะกลับมาอีก'},
  {who:'hero',text:'งั้นข้าจะไปเอง'},
  {who:'elder',text:'ใจเย็นก่อน ข้างนอกไม่เหมือนสู้ในหมู่บ้าน เตรียมเสบียงให้พร้อมแล้วค่อยออกเดินทาง'}]},
 departure:{card:{kicker:'การเดินทางครั้งแรก',title:'รังโจรป่า'},bg:B.forest,pan:'right',tint:'dawn',fx:['leaves','motes','rays'],lines:[
  {text:'ทางเดินออกจากเฟิร์นเวลทอดยาวเข้าไปในป่า'},
  {who:'ally',text:'ทางแยกเยอะนะ เลือกทางดี ๆ ล่ะ'},
  {text:'เป้าหมาย: ออกสำรวจป่าตะวันออก ล้มศัตรูให้ได้ 3 ตัว แล้วกลับหมู่บ้าน\nระวังแรงกับเสบียงด้วย'}]},
 camp:{bg:B.camp,pan:'in',tint:'dusk',fx:['embers','fireflies'],lines:[
  {text:'ค่ายโจรร้างเหลือแต่กองไฟที่ยังคุ'},
  {who:'hero',text:'มีจดหมาย...'},
  {text:'"ค่าจ้างครึ่งหนึ่งจ่ายแล้ว ที่เหลือจะจ่ายเมื่อเจอ \'หินที่มีเส้นแสง\' ส่งมาที่เมือง — G."'},
  {who:'hero',text:'หินที่มีเส้นแสง... จานหินนั่นรึ?'},
  {who:'ally',text:'คนในเมืองใหญ่จ้างโจรมาหาของแบบนี้? เรื่องนี้ไม่ธรรมดาแล้ว'},
  {text:'จะสำรวจต่อหรือกลับหมู่บ้านก็ได้\nกระเป๋ามีที่จำกัด ของที่ได้ต้องเอากลับไปขาย'}]},
 home:{bg:B.market,tint:'day',fx:['motes'],lines:[
  {who:'elder',text:'กลับมาแล้ว! ไม่บาดเจ็บนะ'},
  {who:'elder',text:'ของที่ได้จากป่าเอาไปขายที่ตลาดได้ เงินที่ได้เอาไปซื้อของดี ๆ ไว้เดินทางครั้งหน้า'},
  {text:'เป้าหมาย: ขายของที่ได้มา แล้วกลับบ้านนอนพักฟื้น'}]},
 finale:{card:{kicker:'จบบทนำ',title:'โลกที่กว้างกว่าเฟิร์นเวล'},bg:B.home,tint:'night',fx:['stars'],lines:[
  {burst:{x:.5,y:.6,hue:280,n:30,speed:2,ring:false},text:'คืนนั้น{hero}นอนไม่หลับ จานหินวางอยู่ข้างหมอน เส้นแสงบนผิวหินเต้นช้า ๆ เหมือนลมหายใจ'},
  {bg:B.market,tint:'dawn',fx:['orb','rays','motes'],text:'เช้าวันใหม่ ดวงทองยังลอยนิ่งอยู่ไกลออกไป... ใกล้กว่าเมื่อวาน'},
  {who:'hero',text:'จดหมายบอกว่า "ส่งไปที่เมือง"... สักวันข้าต้องไปให้ถึง'},
  {text:'จากนี้ไปเล่นได้อิสระ ป่า เหมือง และพื้นที่รอบหมู่บ้านรอให้สำรวจ\nเบาะแส: จานหิน · จดหมายถึงเมืองใหญ่ · ดวงทองบนฟ้า'}]}};

// pumpkin contest — result lines depend on how many days it was watered (0–3)
function contestScene(days){const lines=[{who:'elder',text:'และผู้ชนะฟักทองยักษ์ปีนี้คือ...'},{wait:900,text:'...'}];
 if(days>=3)lines.push({flash:'#ffe8a0',burst:{x:.5,y:.5,hue:30,n:150,speed:7},who:'elder',text:'ฟักทองของ{hero}! ใหญ่ที่สุดในรอบสิบปี!'},{who:'pip',text:'ใหญ่กว่าแพะข้าอีก!'},{text:'รางวัลชนะเลิศ: 60 เหรียญ'});
 else if(days===2)lines.push({burst:{x:.5,y:.5,hue:45,n:70,speed:4},who:'elder',text:'ป้ามาร์ธาเหมือนทุกปี! แต่รองชนะเลิศคือ{hero} ฟักทองลูกนี้ไม่เลวเลย'},{text:'รางวัลรองชนะเลิศ: 30 เหรียญ'});
 else lines.push({who:'elder',text:'ป้ามาร์ธาเหมือนทุกปี... ส่วนของ{hero}... เอ่อ... ขนาดเท่ากำปั้นพอดี'},{who:'pip',shake:true,text:'ฮ่า ๆ ๆ ๆ!'},{text:'รางวัลปลอบใจ: 10 เหรียญ (ปีหน้ารดน้ำทุกวันนะ)'});
 lines.push({tint:'dusk',fx:['lanterns','motes'],text:'งานดำเนินไปจนพระอาทิตย์เริ่มลับขอบฟ้า...'});
 return {bg:B.market,pan:'in',tint:'day',fx:['lanterns','motes'],lines}}

root.STORY_DATA={B,SPEAKERS,SCENES,contestScene};
})(globalThis);
