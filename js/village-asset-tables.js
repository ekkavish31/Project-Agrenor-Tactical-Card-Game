/* v98.293 · pure data tables of the village asset editor (split out of js/village-asset-edit.js): names of things, what they map to, wall/decor widths. */
(function () {
 'use strict';
 const DECOR_W = {
  'fence-picket': ['รั้วไม้', 110],
  'stone-wall-low': ['กำแพงหินเตี้ย', 110],
  'hedge-row': ['แนวพุ่มไม้', 120],
  'flower-bed': ['แปลงดอกไม้', 118],
  'flower-box': ['กระบะดอกไม้', 90],
  'stepping-stones': ['หินทางเดิน', 130],
  'pond-lilies': ['บ่อบัว', 220],
  'bench': ['ม้านั่ง', 110],
  'market-stall-red': ['แผงตลาดแดง', 230],
  'market-stall-blue': ['แผงตลาดน้ำเงิน', 230],
  'banner-pole': ['เสาธง', 75],
  'woodpile': ['กองฟืน', 115],
  'signpost': ['ป้ายบอกทาง', 70],
  'well': ['บ่อน้ำ', 120],
  'cart': ['เกวียน', 150],
  'hay': ['กองฟาง', 95]
 };
 const NAMES = {
  'border:hedge': 'แนวพุ่มไม้',
  'border:flowers': 'แปลงดอกไม้ (ขอบ)',
  'border:planter': 'กระถาง (ขอบ)',
  'border:wood': 'รั้วไม้',
  'border:stone': 'กำแพงหิน',
  lamp: 'โคมไฟ',
  bushflower: 'พุ่มดอกไม้',
  pot: 'กระถาง',
  statue: 'ของตั้งหน้าอาคาร',
  table: 'โต๊ะ/ถัง',
  crate: 'ลังไม้',
  herb: 'สมุนไพร',
  'flower:1': 'ดอกไม้ชุด 1',
  'flower:2': 'ดอกไม้ชุด 2',
  bush: 'พุ่มไม้'
 };
 const NAME_KIND = {
  'border:hedge': 'decor:hedge-row',
  'border:flowers': 'decor:flower-bed',
  'border:planter': 'prop:3',
  'border:wood': 'decor:fence-picket',
  'border:stone': 'decor:stone-wall-low',
  lamp: 'lamp',
  bushflower: 'prop:2',
  pot: 'prop:3',
  statue: 'prop:4',
  table: 'prop:5',
  crate: 'prop:6',
  herb: 'flowers:3',
  'flower:1': 'flowers:1',
  'flower:2': 'flowers:2',
  bush: 'prop:2'
 };
 const LABEL_HINT = [
  ['propSprite(7', 'ต้นไม้'],
  ['lamp(', 'โคมไฟ'],
  ["decor('bench'", 'ม้านั่ง'],
  ['bush(', 'พุ่มไม้'],
  ['TownArt.detail', 'ดอกไม้'],
  ['propSprite(3', 'กระถาง'],
  ['propSprite(6', 'ลังไม้']
 ];
 window.VillageAssetTables = { DECOR_W, NAMES, NAME_KIND, LABEL_HINT };
})();
