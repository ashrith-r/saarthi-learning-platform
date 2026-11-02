import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import Exam from '../models/exam.js';
import Subject from '../models/subjects.js';
import Chapter from '../models/chapter.js';
import Lecture from '../models/lecture.js';
import Question from '../models/questionBank.js';
import Quiz from '../models/quiz.js';
import Run from '../models/testRun.js';
import {Progress,Task,Profile} from '../models/study.js';
import {gradeRun} from '../services/testEngine.js';

export async function seedDemo(){
 if(await User.exists({email:'learner@saarthi.demo'}))return;
 const password=await bcrypt.hash('SaarthiDemo!2026',12);
 const [student,admin]=await User.create([{username:'Aarav Sharma',email:'learner@saarthi.demo',password,verified:true},{username:'Demo Administrator',email:'admin@saarthi.demo',password,verified:true,admin:true}]);
 const exam=await Exam.create({examName:'JEE Foundation',courseType:'Engineering',subjects:['Mathematics','Physics','Chemistry'],icon:'✦',createdBy:admin._id});
 const topics=[['Mathematics','Quadratic equations','What are the roots of x² − 5x + 6 = 0?',['2 and 3','1 and 6','−2 and −3','0 and 5'],'Factor as (x − 2)(x − 3) = 0.','factorization'],['Mathematics','Differentiation','What is the derivative of x³?',['3x²','x²','3x','x⁴/4'],'Use d(xⁿ)/dx = nxⁿ⁻¹.','power rule'],['Physics','Newton’s laws','A force of 10 N acts on a 2 kg object. What is its acceleration?',['5 m/s²','20 m/s²','10 m/s²','2 m/s²'],'Newton’s second law: a = F/m = 10/2 = 5 m/s².','force and motion'],['Physics','Electrostatics','What happens to Coulomb force when separation doubles?',['It becomes one quarter','It doubles','It halves','It stays constant'],'Coulomb force is inversely proportional to the square of separation.','inverse square law'],['Chemistry','Atomic structure','What is the charge of an electron?',['Negative','Positive','Neutral','Variable'],'An electron carries one negative elementary charge.','subatomic particles'],['Chemistry','Chemical bonding','Which bond involves sharing electron pairs?',['Covalent','Ionic','Metallic','Hydrogen'],'A covalent bond forms through sharing electron pairs between atoms.','covalent bonding']];
 const subjects={};
 let index=0;
 for(const [subjectName,chapterName,text,options,solution,tag] of topics){
  if(!subjects[subjectName])subjects[subjectName]=await Subject.create({examID:exam._id,subjectName,description:'Build a strong foundation in '+subjectName,chapterCount:2,createdBy:admin._id});
  const chapter=await Chapter.create({subjectID:subjects[subjectName]._id,chapterName,description:'Understand the core ideas, explore worked examples, and check your understanding.',createdBy:admin._id});
  await Lecture.create({chapterID:chapter._id,title:chapterName+' · concept session',url:'https://www.youtube.com/embed/aircAruvnKk',duration:'18 min',faculty:'Demo resource · illustrative video',createdBy:admin._id});
  const question=new Question({course:exam._id,subject:subjectName,chapter:chapterName,question_text:text,options:options.map(text=>({text})),tags:[tag],solution:{text:solution},createdBy:admin._id});question.correctOption=question.options[0]._id;await question.save();
  const quiz=await Quiz.create({chapterID:chapter._id,title:chapterName+' · knowledge check',questions:[question._id],createdBy:admin._id,status:index===5?'draft':'published',durationMinutes:10,marks:4,penalty:1});
  if(index<3)await Progress.create({user:student._id,chapter:chapter._id,completed:index<2,completedAt:index<2?new Date():null,bookmarked:true,notes:'Review the key formula, then try a practice question.'});
  if(index<4){const answers={[String(question._id)]:String(question.options[index%2?1:0]._id)};const run={user:student._id,quiz:quiz._id,title:quiz.title,questions:[question.toObject()],answers,marks:4,penalty:1,expiresAt:new Date(Date.now()-86400000),status:'submitted',submittedAt:new Date(Date.now()-(4-index)*86400000)};run.result=gradeRun(run);await Run.create(run);}
  index++;
 }
 const date=new Date(Date.now()+86400000).toISOString().slice(0,10);
 const allQuestions=await Question.find({createdBy:admin._id});
 const firstChapter=await Chapter.findOne();
 await Quiz.create({chapterID:firstChapter._id,title:'Foundation sprint · mixed-subject mock',questions:allQuestions.map(q=>q._id),createdBy:admin._id,status:'published',durationMinutes:20,marks:4,penalty:1});
 await Task.create([{user:student._id,title:'Revise inverse square law and solve a practice test',date},{user:student._id,title:'Complete the differentiation concept session',date,done:true}]);
 await Profile.create({user:student._id,exam:'JEE Foundation',targetDate:new Date(Date.now()+90*86400000).toISOString().slice(0,10),weeklyGoal:5});
}
