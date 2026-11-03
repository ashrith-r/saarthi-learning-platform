import test from 'node:test';
import assert from 'node:assert/strict';
import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';

test('database-backed student and administrator demo journeys', {timeout:1200000}, async t=>{
 const db=await MongoMemoryServer.create();
 process.env.MONGO_URL=db.getUri();process.env.JWT_SECRET='integration-only-secret';process.env.NODE_ENV='test';
 await mongoose.connect(process.env.MONGO_URL);
 const {seedDemo}=await import('../../scripts/demo-data.js');await seedDemo();
 const {default:app}=await import('../../app.js');
 const {default:Quiz}=await import('../../models/quiz.js');const {default:Run}=await import('../../models/testRun.js');
 const {Progress,Task}=await import('../../models/study.js');const {default:User}=await import('../../models/user.js');
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 t.after(async()=>{await new Promise(r=>{server.close(r);server.closeAllConnections();});await mongoose.disconnect();await db.stop();});
 const base='http://127.0.0.1:'+server.address().port;
 async function login(email){const r=await fetch(base+'/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email,password:'SaarthiDemo!2026'}),redirect:'manual'});assert.equal(r.status,302);return r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');}
 const cookie=await login('learner@saarthi.demo'),admin=await login('admin@saarthi.demo');
 async function request(path,{method='GET',body,cookies=cookie,json=false}={}){return fetch(base+path,{method,headers:{cookie:cookies,origin:base,...(body?{'content-type':json?'application/json':'application/x-www-form-urlencoded'}:{})},body:body?(json?JSON.stringify(body):new URLSearchParams(body)):undefined,redirect:'manual'});}
 await t.test('all learning screens render populated data',async()=>{for(const p of ['/dashboard','/library','/library?q=equations','/library?q=%28','/library?q=concept','/planner','/practice','/insights']){const r=await request(p);assert.equal(r.status,200,p);assert.ok((await r.text()).length>1000);}});
 const quiz=await Quiz.findOne({status:'published'}).populate('questions');
 await t.test('chapter notes, bookmark and completion persist',async()=>{let r=await request('/learn/'+quiz.chapterID);assert.equal(r.status,200);r=await request('/learn/'+quiz.chapterID,{method:'POST',body:{notes:'Integration notes',completed:'on',bookmarked:'on'}});assert.equal(r.status,302);assert.equal((await Progress.findOne({chapter:quiz.chapterID})).notes,'Integration notes');});
 await t.test('planner creates tasks and rejects invalid dates',async()=>{assert.equal((await request('/planner',{method:'POST',body:{title:'Test task',date:'2026-12-01'}})).status,302);assert.ok(await Task.exists({title:'Test task'}));assert.equal((await request('/planner',{method:'POST',body:{title:'Bad task',date:'2026-02-30'}})).status,400);});
 let run;
 await t.test('start, autosave, refresh and submit a scored mock test',async()=>{
  const started=await request('/practice/start/'+quiz._id,{method:'POST'});assert.equal(started.status,302);const url=started.headers.get('location');run=await Run.findById(url.split('/').pop());
  const page=await request(url);assert.equal(page.status,200);assert.ok(!(await page.text()).includes(quiz.questions[0].solution.text));
  const answers={[String(quiz.questions[0]._id)]:String(quiz.questions[0].correctOption)};
  assert.equal((await request(url+'/save',{method:'POST',body:{answers,flags:[],timeSpent:{[String(quiz.questions[0]._id)]:12}},json:true})).status,200);
  assert.equal((await request(url)).status,200);
  assert.equal((await request(url+'/submit',{method:'POST'})).status,302);
  assert.equal((await Run.findById(run._id)).result.accuracy,100);assert.equal((await Run.findById(run._id)).result.review[0].seconds,12);
  assert.equal((await request(url+'/submit',{method:'POST'})).status,302);
 });
 await t.test('other students cannot access attempts or edit tasks',async()=>{await User.create({username:'Other',email:'other@example.com',password:(await User.findOne()).password,verified:true});const other=await login('other@example.com');assert.equal((await request('/practice/run/'+run._id,{cookies:other})).status,404);const task=await Task.findOne();assert.equal((await request('/planner/'+task._id,{method:'POST',body:{done:'on'},cookies:other})).status,404);});
 await t.test('expired attempts reject saved answers and finalize results',async()=>{const expired=await Run.create({user:run.user,title:'Expired',questions:run.questions,expiresAt:new Date(Date.now()-1000),marks:1,penalty:0});assert.equal((await request('/practice/run/'+expired._id+'/save',{method:'POST',json:true,body:{answers:{}}})).status,409);assert.equal((await Run.findById(expired._id)).status,'submitted');});
 await t.test('revision creates a private targeted test',async()=>{assert.equal((await request('/revision',{method:'POST'})).status,302);});
 await t.test('admin preview and draft review publishing workflow',async()=>{assert.equal((await request('/admin/publishing',{cookies:admin})).status,200);const draft=await Quiz.findOne({status:'draft'});assert.equal((await request('/practice/start/'+draft._id,{method:'POST'})).status,404);assert.equal((await request('/admin/publishing/'+draft._id+'/preview',{cookies:admin})).status,200);const body={durationMinutes:'10',marks:'4',penalty:'1',status:'published'};assert.equal((await request('/admin/publishing/'+draft._id,{method:'POST',cookies:admin,body})).status,400);body.status='reviewed';assert.equal((await request('/admin/publishing/'+draft._id,{method:'POST',cookies:admin,body})).status,302);body.status='published';assert.equal((await request('/admin/publishing/'+draft._id,{method:'POST',cookies:admin,body})).status,302);});
 await t.test('editor permissions allow review but reserve publication for administrators',async()=>{
 const other=await User.findOne({email:'other@example.com'});
 assert.equal((await request('/admin/publishing')).status,403);
 assert.equal((await request('/admin/users/'+other._id+'/editor',{method:'POST',cookies:admin,body:{editor:'on'}})).status,302);
 const editor=await login('other@example.com');
 assert.equal((await request('/admin/publishing',{cookies:editor})).status,200);
 assert.equal((await request('/admin/publishing/'+quiz._id,{method:'POST',cookies:editor,body:{status:'published',durationMinutes:'10',marks:'4',penalty:'1'}})).status,403);
 });
 await t.test('expiry worker finalizes abandoned assessments',async()=>{
 const expired=await Run.create({user:run.user,title:'Abandoned',questions:run.questions,expiresAt:new Date(Date.now()-1000),marks:1,penalty:0});
 const {finalizeExpiredTests}=await import('../../services/expiredTests.js');await finalizeExpiredTests();assert.equal((await Run.findById(expired._id)).status,'submitted');
 });

 await t.test('admin materials create, update, hide and reject unsafe links',async()=>{
 const {default:Resource}=await import('../../models/learningResource.js');
 assert.equal((await request('/admin/materials',{cookies:admin})).status,200);
 assert.equal((await request('/admin/materials')).status,403);
 const body={chapter:String(quiz.chapterID),kind:'video',title:'Integration live lecture',description:'A real lesson managed by the administrator',url:'https://youtu.be/abcdefghijk',published:'on'};
 assert.equal((await request('/admin/materials',{method:'POST',cookies:admin,body})).status,302);
 let page=await request('/learn/'+quiz.chapterID);assert.match(await page.text(),/Integration live lecture/);
 const material=await Resource.findOne({title:body.title});body.title='Updated live lecture';
 assert.equal((await request('/admin/materials/'+material._id,{method:'POST',cookies:admin,body})).status,302);
 page=await request('/learn/'+quiz.chapterID);assert.match(await page.text(),/Updated live lecture/);
 delete body.published;
 assert.equal((await request('/admin/materials/'+material._id,{method:'POST',cookies:admin,body})).status,302);
 assert.ok(!(await (await request('/learn/'+quiz.chapterID)).text()).includes('Updated live lecture'));
 body.url='javascript:alert(1)';assert.equal((await request('/admin/materials',{method:'POST',cookies:admin,body})).status,400);
 });

 await t.test('existing lecture visibility also reflects on student pages',async()=>{
 const {default:Lecture}=await import('../../models/lecture.js');const lecture=await Lecture.findOne({chapterID:quiz.chapterID});
 assert.ok((await (await request('/learn/'+quiz.chapterID)).text()).includes(lecture.title));
 assert.equal((await request('/admin/legacy-materials/lecture/'+lecture._id,{method:'POST',cookies:admin,body:{published:'off'}})).status,302);
 assert.ok(!(await (await request('/learn/'+quiz.chapterID)).text()).includes(lecture.title));
 assert.equal((await request('/admin/legacy-materials/lecture/'+lecture._id,{method:'POST',cookies:admin,body:{published:'on'}})).status,302);
 });
 await t.test('PDF upload persists in MongoDB and is readable only when published',async()=>{
 const form=new FormData();form.set('chapter',String(quiz.chapterID));form.set('kind','document');form.set('title','Uploaded study guide');form.set('description','Student reference PDF');form.set('published','on');form.set('pdf',new Blob(['%PDF-1.4\n%%EOF'],{type:'application/pdf'}),'study-guide.pdf');
 const r=await fetch(base+'/admin/materials',{method:'POST',headers:{cookie:admin,origin:base},body:form,redirect:'manual'});assert.equal(r.status,302);
 const {default:Resource}=await import('../../models/learningResource.js');const resource=await Resource.findOne({title:'Uploaded study guide'});
 const pdf=await request('/materials/'+resource.fileId);assert.equal(pdf.status,200);assert.equal(pdf.headers.get('content-type'),'application/pdf');assert.match(await pdf.text(),/%PDF/);
 resource.published=false;await resource.save();assert.equal((await request('/materials/'+resource.fileId)).status,404);
 });
 await t.test('editable site name appears without rendering promotional taglines',async()=>{
 const body={name:'Learning Observatory',heroTitle:'A new horizon',heroDescription:'Managed by an administrator',dashboardTitle:'Your next discovery',motivation:'Take the next step.'};
 assert.equal((await request('/admin/site-settings',{method:'POST',cookies:admin,body})).status,302);
 const home=await (await request('/')).text(),dashboard=await (await request('/dashboard')).text();assert.match(home,/Learning Observatory/);assert.match(dashboard,/<h1>Dashboard<\/h1>/);assert.ok(!home.includes('A new horizon'));assert.ok(!dashboard.includes('Your next discovery'));
 assert.equal((await request('/admin/site-settings')).status,302);
 });
 await t.test('CSV preview validates before importing',async()=>{
  const {default:Question}=await import('../../models/questionBank.js');const before=await Question.countDocuments();
  const body={chapterID:String(quiz.chapterID),csv:'question,A,B,C,D,answer,solution,tags\nWhat is 2+2?,4,3,2,1,A,Addition,arithmetic'};
  const r=await request('/admin/import-csv',{method:'POST',cookies:admin,body});assert.equal(r.status,200);assert.match(await r.text(),/1 valid questions/);assert.equal(await Question.countDocuments(),before);
  assert.equal((await request('/admin/import-csv',{method:'POST',cookies:admin,body:{...body,confirm:'yes'}})).status,302);assert.equal(await Question.countDocuments(),before+1);
  const invalid={...body,confirm:'yes',csv:'question,A,B,C,D,answer\nInvalid row,1,2,3,4,Z'};assert.equal((await request('/admin/import-csv',{method:'POST',cookies:admin,body:invalid})).status,200);assert.equal(await Question.countDocuments(),before+1);
 });
 await t.test('public pages and invalid account forms give recoverable responses',async()=>{
  for(const path of ['/','/updates','/auth/login','/auth/login?tab=register','/auth/forgot-password','/health'])assert.equal((await request(path,{cookies:''})).status,200,path);
  assert.equal((await request('/auth/register',{method:'POST',cookies:'',body:{username:'Test',email:'test@example.com',password:'x',confirm:'x'}})).status,302);
  assert.equal((await request('/auth/login',{method:'POST',cookies:'',body:{email:'learner@saarthi.demo',password:'wrong'}})).status,302);
  assert.equal((await request('/admin',{cookies:''})).status,302);
  assert.equal((await request('/admin/addQuote',{cookies:admin})).status,404);
 });
 await t.test('all administrator editors share one workspace and live links',async()=>{
  const {default:Exam}=await import('../../models/exam.js'),{default:Subject}=await import('../../models/subjects.js');
  const exam=await Exam.findOne(),subject=await Subject.findOne();
  const paths=['/admin','/admin/materials','/admin/publishing','/admin/site-settings','/admin/addExam','/admin/addUpdate','/admin/questionBank','/admin/quiz/create','/admin/exam/edit/'+exam._id,'/admin/subject/'+exam._id+'/add','/admin/subject/'+subject._id+'/edit','/admin/subject/'+subject._id+'/addChapter','/admin/chapter/'+quiz.chapterID+'/edit','/admin/'+exam._id+'/addQuestion','/admin/question/edit/'+quiz.questions[0]._id];
  for(const path of paths){const r=await request(path,{cookies:admin});assert.equal(r.status,200,path);const html=await r.text();assert.equal((html.match(/<aside class="workspace-sidebar">/g)||[]).length,1,path);assert.ok(!html.includes('New Quote of Day'));assert.ok(!html.includes('learningChart'));}
 });
 await t.test('curriculum create and edit preserves relationships and validates input',async()=>{
  const {default:Exam}=await import('../../models/exam.js'),{default:Subject}=await import('../../models/subjects.js'),{default:Chapter}=await import('../../models/chapter.js');
  assert.equal((await request('/admin/addExam',{cookies:admin,method:'POST',body:{examName:'',courseType:'Engineering'}})).status,400);
  assert.equal((await request('/admin/addExam',{cookies:admin,method:'POST',body:{examName:'Audit exam',courseType:'Custom academic track',icon:'stars'}})).status,302);
  assert.equal((await request('/admin/addExam',{cookies:admin,method:'POST',body:{examName:'Other course type exam',courseType:'Other'}})).status,302);
  assert.ok(await Exam.exists({examName:'Other course type exam',courseType:'Other'}));
  const exam=await Exam.findOne({examName:'Audit exam'});
  assert.equal((await request('/admin/addExam',{cookies:admin})).status,200);
  assert.match(await (await request('/admin/addExam',{cookies:admin})).text(),/value="Custom academic track"/);
  assert.equal((await request('/admin/exam/edit/'+exam._id,{cookies:admin,method:'POST',body:{examName:'Audit exam edited',courseType:'Custom academic track',icon:'moon'}})).status,302);
  assert.match(await (await request('/')).text(),/bi bi-moon/);
  assert.equal((await request('/admin/subject/'+exam._id+'/add',{cookies:admin,method:'POST',body:{'subject[subjectName]':'Audit subject','subject[description]':'Subject description','subject[chapterCount]':'1','subject[icon]':'book-half'}})).status,302);
  const subject=await Subject.findOne({examID:exam._id});assert.ok(subject);
  assert.match(await (await request('/subject/'+exam._id)).text(),/bi bi-book-half/);
  assert.equal((await request('/admin/subject/'+subject._id+'/addChapter',{cookies:admin,method:'POST',body:{subjectID:String(subject._id),'chapters[0][chapterName]':'Audit chapter','chapters[0][description]':'Chapter description'}})).status,302);
  const chapter=await Chapter.findOne({subjectID:subject._id});assert.ok(chapter);
  assert.equal((await request('/admin/chapter/'+chapter._id+'/edit',{cookies:admin,method:'POST',body:{'chapter[chapterName]':'Edited chapter','chapter[description]':'Edited description'}})).status,302);
  assert.equal((await request('/admin/subject/'+subject._id+'/edit',{cookies:admin,method:'POST',body:{'subjects[name]':'Edited subject','subjects[description]':'Description','subjects[chapterCount]':'1'}})).status,302);
  assert.match(await (await request('/subject/'+subject._id+'/chapter')).text(),/Edited chapter/);
  assert.equal((await request('/subject/'+subject._id+'/chapter%20')).status,404);
  assert.equal((await request('/admin/chapter/'+new mongoose.Types.ObjectId()+'/edit',{cookies:admin})).status,404);
 });
 await t.test('ordered materials, private preview, archive and restore affect student visibility',async()=>{
  const {default:Resource}=await import('../../models/learningResource.js');
  const body={chapter:String(quiz.chapterID),kind:'link',title:'First ordered resource',description:'Reference',url:'https://example.com/reference',position:'3',published:'on'};
  assert.equal((await request('/admin/materials',{method:'POST',cookies:admin,body})).status,302);
  const first=await Resource.findOne({title:body.title});body.title='Second ordered resource';body.position='12';
  await request('/admin/materials',{method:'POST',cookies:admin,body});
  let html=await (await request('/learn/'+quiz.chapterID)).text();assert.ok(html.indexOf('First ordered resource')<html.indexOf('Second ordered resource'));
  assert.equal((await request('/admin/material-archive/resource/'+first._id,{method:'POST',cookies:admin,body:{archived:'on'}})).status,302);
  assert.ok(!(await (await request('/learn/'+quiz.chapterID)).text()).includes(first.title));
  assert.equal((await request('/admin/material-archive/resource/'+first._id,{method:'POST',cookies:cookie,body:{archived:'off'}})).status,403);
  await request('/admin/material-archive/resource/'+first._id,{method:'POST',cookies:admin,body:{archived:'off'}});
  assert.ok((await (await request('/learn/'+quiz.chapterID)).text()).includes(first.title));
  body.title='Draft preview resource';delete body.published;await request('/admin/materials',{method:'POST',cookies:admin,body});
  assert.ok(!(await (await request('/learn/'+quiz.chapterID+'?preview=1')).text()).includes(body.title));
  assert.ok((await (await request('/learn/'+quiz.chapterID+'?preview=1',{cookies:admin})).text()).includes(body.title));
  assert.ok(!(await (await request('/library?kind=video&q=ordered')).text()).includes('First ordered resource'));
 });
 await t.test('legacy materials edit through the single manager and retain metadata',async()=>{
  const {default:Lecture}=await import('../../models/lecture.js');const item=await Lecture.findOne({chapterID:quiz.chapterID});
  const r=await request('/admin/lecture/'+item._id+'/edit',{cookies:admin});assert.equal(r.status,302);assert.match(r.headers.get('location'),/admin\/materials/);
  const body={chapter:String(quiz.chapterID),kind:'video',title:'Unified legacy lecture',url:item.url,description:'',instructor:item.faculty,duration:item.duration,position:'2',published:'on'};
  assert.equal((await request('/admin/material-edit/lecture/'+item._id,{method:'POST',cookies:admin,body})).status,302);
  assert.equal((await Lecture.findById(item._id)).position,2);
  assert.match(await (await request('/learn/'+quiz.chapterID)).text(),/Unified legacy lecture/);
 });
 await t.test('PDF replacement and archive enforce current-file access; invalid uploads rejected',async()=>{
  const {default:Resource}=await import('../../models/learningResource.js');const item=await Resource.findOne({fileId:{$exists:true}}),oldId=item.fileId;
  const form=new FormData();for(const [key,value]of Object.entries({chapter:String(item.chapter),kind:'document',title:item.title,description:'Replaced',published:'on'}))form.set(key,value);form.set('pdf',new Blob(['%PDF-1.4\n%replacement\n%%EOF'],{type:'application/pdf'}),'replacement.pdf');
  assert.equal((await fetch(base+'/admin/materials/'+item._id,{method:'POST',headers:{cookie:admin,origin:base},body:form,redirect:'manual'})).status,302);
  const replaced=await Resource.findById(item._id);assert.notEqual(String(replaced.fileId),String(oldId));assert.equal((await request('/materials/'+oldId)).status,404);
  await request('/admin/material-archive/resource/'+item._id,{method:'POST',cookies:admin,body:{archived:'on'}});assert.equal((await request('/materials/'+replaced.fileId)).status,404);
  const bad=new FormData();bad.set('pdf',new Blob(['not a PDF'],{type:'application/pdf'}),'bad.pdf');
  assert.equal((await fetch(base+'/admin/materials',{method:'POST',headers:{cookie:admin,origin:base},body:bad,redirect:'manual'})).status,400);
  const large=new FormData();large.set('pdf',new Blob([new Uint8Array(15*1024*1024+1)],{type:'application/pdf'}),'large.pdf');assert.equal((await fetch(base+'/admin/materials',{method:'POST',headers:{cookie:admin,origin:base},body:large,redirect:'manual'})).status,400);
 });
 await t.test('planner editing supports long titles, rescheduling and completed state',async()=>{
  const task=await Task.findOne({title:'Test task'});const title='A long study session title '.repeat(5);
  assert.equal((await request('/planner/'+task._id,{method:'POST',body:{title,date:'2026-12-02',done:'on'}})).status,302);
  const updated=await Task.findById(task._id);assert.equal(updated.title,title.trim());assert.equal(updated.date,'2026-12-02');assert.equal(updated.done,true);
  assert.equal((await request('/planner/'+task._id,{method:'POST',body:{title:'x',date:'2026-02-30'}})).status,400);
 });
 await t.test('simultaneous test starts share one active attempt and repeated submit is safe',async()=>{
  await Run.init();const replies=await Promise.all(Array.from({length:6},()=>request('/practice/start/'+quiz._id,{method:'POST'})));
  assert.ok(replies.every(r=>r.status===302));const locations=replies.map(r=>r.headers.get('location'));assert.equal(new Set(locations).size,1);
  assert.equal(await Run.countDocuments({user:run.user,quiz:quiz._id,status:'active'}),1);
  const path=locations[0];assert.equal((await request(path+'/submit',{method:'POST'})).status,302);assert.equal((await request(path+'/submit',{method:'POST'})).status,302);
 });
 await t.test('question creation/editing and quiz assembly persist validated content',async()=>{
  const {default:Question}=await import('../../models/questionBank.js');const reference=quiz.questions[0];
  const values={course:String(reference.course),question_text:'Audit question?',optionAtext:'One',optionBtext:'Two',optionCtext:'Three',optionDtext:'Four',correctOption:'0',subject:reference.subject,chapter:reference.chapter,level:'Easy',tags:'audit',solution_text:'One is correct'};
  const form=new FormData();for(const [key,value]of Object.entries(values))form.set(key,value);
  assert.equal((await fetch(base+'/admin/addQuestion',{method:'POST',headers:{cookie:admin,origin:base},body:form,redirect:'manual'})).status,302);
  const question=await Question.findOne({question_text:values.question_text});assert.ok(question);
  values.question_text='Edited audit question?';assert.equal((await request('/admin/question/edit/'+question._id,{method:'POST',cookies:admin,body:values})).status,302);
  assert.equal((await Question.findById(question._id)).question_text,values.question_text);
  assert.equal((await request('/admin/quiz/create',{method:'POST',cookies:admin,body:{title:'Audit draft',chapterID:String(quiz.chapterID),questions:String(question._id)}})).status,302);
  assert.equal((await Quiz.findOne({title:'Audit draft'})).status,'draft');
  assert.equal((await request('/admin/question/delete/'+question._id,{method:'POST',cookies:admin})).status,409);
 });
 await t.test('announcements and admin metrics reflect saved records, with no quote workflow',async()=>{
  assert.equal((await request('/admin/addUpdate',{method:'POST',cookies:admin,body:{title:'Audit notice',category:'Scholarships',content:'Test announcement'}})).status,302);
  assert.equal((await request('/admin/addUpdate',{method:'POST',cookies:admin,body:{title:'Invalid notice',category:'',content:'Missing category'}})).status,400);
  const updateForm=await (await request('/admin/addUpdate',{cookies:admin})).text();assert.match(updateForm,/value="Scholarships"/);
  const updates=await (await request('/updates')).text();assert.match(updates,/Audit notice/);assert.match(updates,/Scholarships/);
  assert.match(await (await request('/updates?category=Scholarships')).text(),/Audit notice/);
  const html=await (await request('/admin',{cookies:admin})).text();assert.match(html,/Tests awaiting publication/);assert.match(html,/Audit draft/);assert.ok(!html.includes('New Quote of Day'));
 });
 await t.test('all rendered internal links resolve for their authorized role',async()=>{
  const {mkdirSync,writeFileSync}=await import('node:fs');const {default:Exam}=await import('../../models/exam.js'),{default:Subject}=await import('../../models/subjects.js');const exam=await Exam.findOne(),subject=await Subject.findOne();const pages=['/','/subject/'+exam._id,'/subject/'+subject._id+'/chapter','/admin','/admin/materials','/admin/publishing','/admin/site-settings','/admin/addExam','/admin/addUpdate','/admin/questionBank','/admin/quiz/create','/admin/exam/edit/'+exam._id,'/admin/subject/'+exam._id+'/add','/admin/subject/'+subject._id+'/edit','/admin/subject/'+subject._id+'/addChapter','/admin/chapter/'+quiz.chapterID+'/edit','/admin/'+exam._id+'/addQuestion','/admin/question/edit/'+quiz.questions[0]._id,'/dashboard','/library','/planner','/insights','/practice','/updates','/learn/'+quiz.chapterID];
  const links=new Set(pages);for(const path of pages){const html=await (await request(path,{cookies:admin})).text();for(const match of html.matchAll(/href="(\/[^"<>]*)"/g)){const link=match[1].replaceAll('&amp;','&').split('#')[0];if(link&&!link.startsWith('//'))links.add(link);}}
  const records=[];for(const link of links){let path=link,response;for(let i=0;i<4;i++){response=await request(path,{cookies:admin});if(response.status===302){path=response.headers.get('location');continue;}break;}records.push({link,status:response.status});assert.ok(response.status>=200&&response.status<400,link+' -> '+response.status);}
  mkdirSync('.local/verification',{recursive:true});writeFileSync('.local/verification/http-links.json',JSON.stringify(records,null,2));
 });
 await t.test('planner dates follow valid browser timezones and reject invalid timezone settings',async()=>{
  for(const zone of ['Asia/Kolkata','Pacific/Kiritimati','America/Los_Angeles']){const html=await(await request('/planner',{cookies:cookie+'; studyTimeZone='+encodeURIComponent(zone)})).text();assert.ok(html.includes('Dates in '+zone));const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));assert.ok(html.includes(parts.month+'-'+parts.day));}
  assert.match(await(await request('/planner',{cookies:cookie+'; studyTimeZone=Invalid%2FZone'})).text(),/Dates in UTC/);
 });
 await t.test('verification and password reset consume valid OTPs and revoke previous sessions',async()=>{
  const {default:OTP}=await import('../../models/otp.js'),{createHash}=await import('node:crypto'),{default:bcrypt}=await import('bcryptjs');
  const user=await User.create({username:'OTP audit',email:'otp-audit@example.com',password:await bcrypt.hash('SaarthiDemo!2026',4),verified:false});
  const hash=createHash('sha256').update('123456').digest('hex');await OTP.create({user:user._id,email:user.email,purpose:'verify-email',otpHash:hash});
  await request('/auth/verify-email',{method:'POST',cookies:'',body:{email:user.email,otpEntered:'wrong'}});assert.equal((await User.findById(user._id)).verified,false);
  assert.equal((await request('/auth/verify-email',{method:'POST',cookies:'',body:{email:user.email,otpEntered:'123456'}})).status,302);assert.equal((await User.findById(user._id)).verified,true);assert.equal(await OTP.countDocuments({user:user._id}),0);
  const previous=await login(user.email);await OTP.create({user:user._id,email:user.email,purpose:'reset-password',otpHash:hash});
  assert.equal((await request('/auth/reset-password',{method:'POST',cookies:'',body:{email:user.email,otpEntered:'123456',password:'ResetDemo!2026',confirm:'ResetDemo!2026'}})).status,302);
  assert.ok(await bcrypt.compare('ResetDemo!2026',(await User.findById(user._id)).password));assert.equal((await request('/dashboard',{cookies:previous})).status,302);assert.equal(await OTP.countDocuments({user:user._id}),0);
 });
 await t.test('unsupported question images and unconfigured AI fail with useful status',async()=>{
  const form=new FormData();form.set('question_img',new Blob(['pdf'],{type:'application/pdf'}),'not-image.pdf');
  assert.equal((await fetch(base+'/admin/addQuestion',{method:'POST',headers:{cookie:admin,origin:base},body:form,redirect:'manual'})).status,400);
  if(!process.env.GEMINI_API_KEY)assert.equal((await request('/admin/api/generate-question',{method:'POST',cookies:admin,json:true,body:{prompt:'Test'}})).status,503);
 });
 await t.test('logout revokes access and saved work persists after signing in again',async()=>{
  assert.equal((await request('/auth/logout',{method:'POST'})).status,302);
  assert.equal((await request('/dashboard')).status,302);
  const fresh=await login('learner@saarthi.demo');const html=await (await request('/learn/'+quiz.chapterID,{cookies:fresh})).text();assert.match(html,/Integration notes/);
 });

});
