import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMapRenderHealth, formatMapRenderFailure, MAP_EMPTY_RENDER_FRAME_LIMIT } from './map-render-health.js';

test('lost WebGL context immediately requests fallback',()=>{
 assert.deepEqual(evaluateMapRenderHealth({width:800,height:600,drawCalls:12,zeroDrawFrames:0,contextLost:true}),{healthy:false,reason:'WebGL-контекст потерян'});
});

test('zero-size canvas requests fallback',()=>{
 assert.equal(evaluateMapRenderHealth({width:0,height:600,drawCalls:10,zeroDrawFrames:0}).healthy,false);
});

test('empty render loop requests fallback after the frame threshold, not before',()=>{
 const input={width:800,height:600,drawCalls:0,zeroDrawFrames:MAP_EMPTY_RENDER_FRAME_LIMIT-1};
 assert.equal(evaluateMapRenderHealth(input).healthy,true);
 assert.equal(evaluateMapRenderHealth({...input,zeroDrawFrames:MAP_EMPTY_RENDER_FRAME_LIMIT}).healthy,false);
});

test('healthy scene draw calls keep the 3D map active',()=>{
 assert.deepEqual(evaluateMapRenderHealth({width:800,height:600,drawCalls:24,zeroDrawFrames:0}),{healthy:true,reason:''});
});

test('fallback diagnostic message handles empty and whitespace-only reasons',()=>{
 assert.equal(formatMapRenderFailure(''),'Неизвестная ошибка');
 assert.equal(formatMapRenderFailure('  \n\t  '),'Неизвестная ошибка');
});

test('fallback diagnostic message is normalized and capped',()=>{
 assert.equal(formatMapRenderFailure(' WebGL   failed \n context '),'WebGL failed context');
 const long='x'.repeat(200);
 const result=formatMapRenderFailure(long);
 assert.equal(result.length,120);
 assert.ok(result.endsWith('…'));
});
