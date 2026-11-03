import Quiz from '../models/quiz.js';
import Chapter from '../models/chapter.js';
import Question from '../models/questionBank.js';
import Audit from '../models/audit.js';
import User from '../models/user.js';
import { parse } from 'csv-parse/sync';
export async function menu(req,res,preview=null,csv='') {
 const [quizzes,chapters,events,users]=await Promise.all([Quiz.find().populate('chapterID').sort({createdAt:-1}),Chapter.find(),Audit.find().populate('actor').sort({createdAt:-1}).limit(30),req.user.admin?User.find().select('username email editor admin').limit(100):[]]);
 res.render('study/publishing',{quizzes,chapters,events,users,active:'',preview,csv});
}
export async function setEditor(req,res){
 const user=await User.findByIdAndUpdate(req.params.id,{editor:req.body.editor==='on'});
 if(!user)return res.status(404).send('User not found.');
 await Audit.create({actor:req.user._id,action:'Editor role updated',target:String(user._id),details:user.username});
 res.redirect('/admin/publishing');
}
export async function publish(req,res) {
 const {status,durationMinutes,marks,penalty}=req.body;
 if(!['draft','reviewed','published'].includes(status)||!Number.isInteger(Number(durationMinutes))||Number(durationMinutes)<1||Number(durationMinutes)>240||!Number.isFinite(Number(marks))||Number(marks)<1||Number(marks)>10||!Number.isFinite(Number(penalty))||Number(penalty)<0||Number(penalty)>10)return res.status(400).send('Invalid publishing settings.');
 if(status==='published'&&!req.user.admin)return res.status(403).send('Administrator approval is required to publish.');
 const quiz=await Quiz.findById(req.params.id).populate('questions');
 if(!quiz)return res.status(404).send('Quiz not found.');
 if(status==='published'&&!['reviewed','published'].includes(quiz.status))return res.status(400).send('Review the draft before publishing.');
 if(!quiz.questions.length)return res.status(400).send('Add questions before publishing.');
 quiz.versions.push({changedAt:new Date(),actor:req.user._id,settings:{status:quiz.status,durationMinutes:quiz.durationMinutes,marks:quiz.marks,penalty:quiz.penalty}});
 Object.assign(quiz,{status,durationMinutes:Number(durationMinutes),marks:Number(marks),penalty:Number(penalty)});await quiz.save();
 await Audit.create({actor:req.user._id,action:'Quiz '+status,target:String(quiz._id),details:quiz.title});res.redirect('/admin/publishing');
}
export async function preview(req,res){const quiz=await Quiz.findById(req.params.id).populate('questions');if(!quiz)return res.status(404).send('Quiz not found.');res.render('study/preview',{quiz,active:''});}
export async function importCsv(req,res){
 const csv=typeof req.body.csv==='string'?req.body.csv:'';
 if(csv.length>200000)return res.status(400).send('Maximum CSV size is 200 KB.');
 const chapter=await Chapter.findById(req.body.chapterID).populate('subjectID');if(!chapter?.subjectID)return res.status(400).send('Choose a chapter.');
 let rows;try{rows=parse(csv,{columns:true,skip_empty_lines:true,trim:true,max_record_size:10000});}catch{return res.status(400).send('Invalid CSV.');}
 if(!rows.length||rows.length>100)return res.status(400).send('Import 1–100 questions.');
 const docs=[],errors=[];
 for(const [i,r] of rows.entries()){
  if(!r.question||!['A','B','C','D'].every(k=>r[k])||!['A','B','C','D'].includes(r.answer)){errors.push('Row '+(i+2)+': provide question, A, B, C, D and answer letter A–D.');continue;}
  const q=new Question({course:chapter.subjectID.examID,subject:chapter.subjectID.subjectName,chapter:chapter.chapterName,question_text:r.question,options:['A','B','C','D'].map(k=>({text:r[k]})),tags:(r.tags||'').split('|').filter(Boolean),solution:{text:r.solution||''},createdBy:req.user._id});q.correctOption=q.options[['A','B','C','D'].indexOf(r.answer)]._id;
  try{await q.validate();docs.push(q);}catch(error){errors.push('Row '+(i+2)+': '+error.message);}
 }
 if(req.body.confirm==='yes'&&!errors.length){await Question.insertMany(docs);await Audit.create({actor:req.user._id,action:'CSV import',details:docs.length+' questions'});req.flash('success',docs.length+' questions imported.');return res.redirect('/admin/questionBank');}
 return menu(req,res,{errors,count:docs.length,chapterID:String(chapter._id),questions:docs.map(d=>d.question_text)},csv);
}
