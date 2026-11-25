import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateMapRenderHealth, MAP_EMPTY_RENDER_FRAME_LIMIT } from './map-render-health.js';

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
