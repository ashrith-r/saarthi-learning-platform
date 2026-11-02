import test from 'node:test';
import assert from 'node:assert/strict';
import { routePose, blendPose, validPose } from '../public/js/planet-state.js';
test('different application pages receive stable, distinct planet viewpoints', () => {
  const routes = ['/dashboard','/library','/library?saved=1','/practice','/insights','/planner','/admin/materials'];
  const states = routes.map(routePose);
  assert.equal(new Set(states.map(state => JSON.stringify(state))).size, routes.length);
  for (const [index,state] of states.entries()) { assert.ok(validPose(state)); assert.deepEqual(state,routePose(routes[index])); }
});
test('camera transitions follow the short rotation path without discontinuities', () => {
  const from = { yaw:6.1,tilt:0,zoom:1,phase:.5 }, to = {yaw:.1,tilt:.2,zoom:1.1,phase:1};
  assert.deepEqual(blendPose(from,to,0),from);
  const halfway=blendPose(from,to,.5),finished=blendPose(from,to,1);
  assert.ok(halfway.yaw > from.yaw && halfway.yaw < 6.4);
  assert.ok(Math.abs(Math.sin(finished.yaw)-Math.sin(to.yaw)) < 1e-10);
  assert.equal(finished.zoom,to.zoom); assert.equal(finished.phase,to.phase);
  assert.equal(validPose({yaw:NaN}),false);
});
