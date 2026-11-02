import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAnswers, gradeRun, publicQuestions } from '../services/testEngine.js';
const questions=[{_id:'q1',options:[{_id:'a'},{_id:'b'}],correctOption:'a',tags:['algebra'],solution:{text:'secret'}},{_id:'q2',options:[{_id:'c'},{_id:'d'}],correctOption:'c',tags:['mechanics']}];
test('mock scoring applies marks, negative marking and skipped answers',()=>{
 const r=gradeRun({questions,answers:{q1:'b'},marks:4,penalty:1});assert.equal(r.score,-1);assert.equal(r.wrong,1);assert.equal(r.skipped,1);assert.equal(r.maximum,8);
 assert.equal(gradeRun({questions,answers:{q1:'a',q2:'c'},marks:4,penalty:1}).accuracy,100);
});
test('saved answers exclude foreign options and prototype keys',()=>{assert.deepEqual(cleanAnswers(questions,{q1:'c',q2:{id:'c'},admin:true}),{});});
test('test player never receives the correct answer or solution',()=>{const q=publicQuestions(questions);assert.equal(q[0].correctOption,undefined);assert.equal(q[0].solution,undefined);});
