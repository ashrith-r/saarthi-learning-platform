import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, validDate, escapeSearch, MILESTONE_THRESHOLDS } from '../services/studyMetrics.js';
test('study metrics are based on personal activity and handle empty accounts',()=>{
  assert.equal(summarize([],[],[]).accuracy,0);
  const m=summarize([{completed:true,bookmarked:true,updatedAt:new Date()}],[{score:2,totalQuestions:4,weaknesses:{tags:['algebra']}}],[{done:true}]);
  assert.equal(m.accuracy,50);assert.equal(m.completed,1);assert.equal(m.saved,1);assert.equal(m.weekly,1);assert.equal(m.badges.length,3);assert.deepEqual(m.weakTopics,[['algebra',1]]);
});
test('milestone badges appear only at their documented thresholds',()=>{
  assert.deepEqual(MILESTONE_THRESHOLDS,{firstChapter:1,learningMomentum:5,testExplorer:1,planInMotion:1});
  const chapter=(completed)=>Array.from({length:completed},()=>({completed:true}));
  assert.deepEqual(summarize([],[],[]).badges,[]);
  assert.deepEqual(summarize(chapter(1),[],[]).badges,['First chapter']);
  assert.deepEqual(summarize(chapter(4),[],[]).badges,['First chapter']);
  assert.deepEqual(summarize(chapter(5),[],[]).badges,['First chapter','Learning momentum']);
  assert.ok(summarize([], [{score:0,totalQuestions:1}], []).badges.includes('Test explorer'));
  assert.ok(summarize([], [], [{done:true}]).badges.includes('Plan in motion'));
  assert.ok(!summarize([], [], [{done:false}]).badges.includes('Plan in motion'));
});
test('planner dates reject impossible calendar dates and injection objects',()=>{
  assert.equal(validDate('2026-02-30'),false);assert.equal(validDate({}),false);assert.equal(validDate('2026-11-02'),true);
});
test('library treats regex metacharacters as literal search text',()=>{
 for(const text of ['a(b).c','[x]','a+b','\\path']) assert.equal(new RegExp(escapeSearch(text)).test(text),true);
 assert.equal(new RegExp(escapeSearch('a.b')).test('axb'),false);
});
test('streak counts consecutive activity days and does not count old completions as this week',()=>{
 const m=summarize([{completed:true,completedAt:'2026-10-01',updatedAt:'2026-11-02'}],[{score:1,totalQuestions:1,createdAt:'2026-11-02'},{score:1,totalQuestions:1,createdAt:'2026-11-01'}],[],new Date('2026-11-02T12:00:00Z'));
 assert.equal(m.streak,2);assert.equal(m.weekly,0);
});
