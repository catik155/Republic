import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMapCanvasSize } from './map-canvas-size.js';

test('prefers positive host dimensions',()=>{
 assert.deepEqual(resolveMapCanvasSize({hostWidth:900,hostHeight:500,windowWidth:1200,windowHeight:900}),{width:900,height:500});
});

test('falls back to viewport dimensions and applies desktop minimum height',()=>{
 assert.deepEqual(resolveMapCanvasSize({hostWidth:0,hostHeight:0,windowWidth:1280,windowHeight:700}),{width:1280,height:640});
 assert.deepEqual(resolveMapCanvasSize({hostWidth:800,hostHeight:100,windowWidth:1280,windowHeight:700}),{width:800,height:240});
});

test('mobile canvas height is never below 320 pixels',()=>{
 assert.deepEqual(resolveMapCanvasSize({hostWidth:390,hostHeight:240,windowWidth:390,windowHeight:600,mobile:true}),{width:390,height:320});
});

test('invalid host and viewport values safely fall back to minimum dimensions',()=>{
 assert.deepEqual(resolveMapCanvasSize({hostWidth:NaN,hostHeight:Infinity,windowWidth:0,windowHeight:40}),{width:1,height:240});
 assert.deepEqual(resolveMapCanvasSize({hostWidth:-2,hostHeight:-4,windowWidth:-5,windowHeight:NaN,mobile:true}),{width:1,height:320});
});

test('fractional positive dimensions round to at least one pixel',()=>{
 assert.deepEqual(resolveMapCanvasSize({hostWidth:.2,hostHeight:.3,windowWidth:100,windowHeight:500}),{width:1,height:240});
});
