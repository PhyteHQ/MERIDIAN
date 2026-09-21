import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSnapshot, getStock, totalStock } from '../lib/meridian.ts';

// Verified upstream identities; quantities below are synthetic test data.
const anchorage = { name: 'Citadel Anchorage', nickname: 'citadel_anchorage', system_name: 'Omicron Delta', shop_items: [{name:'Food Rations', quantity:0}, {name:'Basic Alloy', quantity:2}, {name:'Consumer Goods',quantity:300}] };
const vemork = { name: 'Vemork Station', nickname:'vemork_station', system_name:'Pennsylvania', shop_items:[{name:'Food Rations',quantity:400}, {name:'Basic Alloy',quantity:600}, {name:'Consumer Goods',quantity:200}] };

test('the verified Vemork Station identity resolves to the existing POB view', () => {
  const snapshot = parseSnapshot([anchorage, vemork]);
  assert.deepEqual(snapshot.bases.map(base => base.found), [true,true]);
  assert.equal(snapshot.bases[1].id,'vermok');
  assert.equal(snapshot.bases[1].sourceName,'Vemork Station');
  assert.equal(totalStock(snapshot,'food'),400);
  assert.equal(totalStock(snapshot,'alloy'),602);
  assert.equal(totalStock(snapshot,'goods'),500);
});
test('stable nickname survives a display-name change and takes priority over lookalikes', () => {
  const snapshot=parseSnapshot([anchorage,{...vemork,name:'New station name'}, {...vemork,nickname:'different_station'}]);
  assert.equal(snapshot.bases[1].sourceName,'New station name');
});
test('a base with the same nickname in the wrong system is rejected', () => {
  const snapshot=parseSnapshot([anchorage,{...vemork,system_name:'Manhattan'}]);
  assert.equal(snapshot.bases[1].found,false);
  assert.equal(totalStock(snapshot,'food'),null);
});
test('legacy labels work without a nickname but ambiguous matches remain unknown', () => {
  assert.equal(parseSnapshot([anchorage,{...vemork,nickname:undefined}]).bases[1].found,true);
  assert.equal(parseSnapshot([anchorage,{...vemork,nickname:undefined,name:'Vermok'}]).bases[1].found,true);
  assert.equal(parseSnapshot([anchorage,vemork,{...vemork}]).bases[1].found,false);
});
test('missing stock never becomes zero and zero remains a valid value', () => {
  const snapshot=parseSnapshot([anchorage,{...vemork,shop_items:[]}]);
  assert.equal(getStock(snapshot.bases[0],'food').quantity,0);
  assert.equal(getStock(snapshot.bases[1],'food').quantity,null);
  assert.equal(totalStock(snapshot,'food'),null);
});
