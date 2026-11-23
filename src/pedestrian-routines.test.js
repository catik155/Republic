import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyStopCount, seededValue } from './pedestrian-routines.js';

test('home routines do not schedule extra outing stops',()=>{
  for(let seed=0;seed<100;seed++)assert.equal(dailyStopCount(false,seed),0);
});

test('outing routines schedule one or two additional stops',()=>{
  for(let seed=0;seed<1000;seed++){
    const stops=dailyStopCount(true,seed);
    assert.ok(stops===1||stops===2);
  }
});

test('outing stop selection remains deterministic for the same seed',()=>{
  for(let seed=0;seed<100;seed++)assert.equal(dailyStopCount(true,seed),dailyStopCount(true,seed));
});

test('seeded values stay in the expected unit interval',()=>{
  for(let seed=-100;seed<100;seed++){
    const value=seededValue(seed);
    assert.ok(value>=0&&value<1);
  }
});
