import { Progress, Task, Profile } from '../models/study.js';
import chapterModel from '../models/chapter.js';
import examModel from '../models/exam.js';
import lectureModel from '../models/lecture.js';
import noteModel from '../models/notes.js';
import sheetModel from '../models/sheet.js';
import quizModel from '../models/quiz.js';
import quizAttemptModel from '../models/quizAttempt.js';
import Resource from '../models/learningResource.js';
import {videoSource} from '../services/materials.js';
import Run from '../models/testRun.js';
import { summarize, validDate, escapeSearch } from '../services/studyMetrics.js';

export async function dashboard(req, res) {
  const user = req.user._id;
  const [progress, tasks, profile, legacyAttempts, exams, runs] = await Promise.all([
    Progress.find({ user }).populate('chapter').sort({ updatedAt: -1 }),
    Task.find({ user }).sort({ date: 1 }), Profile.findOne({ user }),
    quizAttemptModel.find({ user }).populate('quiz').sort({ createdAt: -1 }).limit(100), examModel.find(), Run.find({ user, status: 'submitted' }).sort({ submittedAt: -1 }).limit(100)
  ]);
  const attempts = [...legacyAttempts, ...runs.map(r=>({score:r.result.correct, submittedAt:r.submittedAt, totalQuestions:r.result.total, weaknesses:{tags:r.result.tags}}))];
  res.render('study/dashboard', { progress, tasks, profile, attempts, exams, metrics: summarize(progress, attempts, tasks), active: 'dashboard' });
}
export async function library(req,res){
 const q=typeof req.query.q==='string'?req.query.q.trim().slice(0,100):'';
 const search={ $regex:escapeSearch(q), $options:'i' };
 const filter=q?{$or:[{chapterName:search},{description:search}]}:{};
 const resourceFilter=q?{title:search,published:{$ne:false},archived:{$ne:true}}:{published:{$ne:false},archived:{$ne:true}};
 const [chapters,progress,lectures,notes,sheets,materials]=await Promise.all([
 chapterModel.find(filter).populate({path:'subjectID',populate:{path:'examID'}}).limit(100),Progress.find({user:req.user._id}),lectureModel.find(resourceFilter).limit(20),noteModel.find(resourceFilter).limit(20),sheetModel.find(resourceFilter).limit(20),Resource.find({...resourceFilter,published:true,archived:{$ne:true}}).limit(50)]);
 const kind=['video','document','link'].includes(req.query.kind)?req.query.kind:'';
 const allResources=[...lectures.map(x=>({...x.toObject(),kind:'video'})),...notes.map(x=>({...x.toObject(),kind:'document'})),...sheets.map(x=>({...x.toObject(),kind:'document'})),...materials.map(m=>({...m.toObject(),chapterID:m.chapter}))].filter(x=>!kind||x.kind===kind);
 res.render('study/library',{chapters,progress,resources:allResources,kind,q,active:'library',savedOnly:req.query.saved==='1'});
}
export async function workspace(req, res) {
  const chapter = await chapterModel.findById(req.params.id).populate('subjectID');
  if (!chapter) return res.status(404).send('Chapter not found.');
  const preview=req.query.preview==='1'&&(req.user.admin||req.user.editor);
  const visibility=preview?{archived:{$ne:true}}:{published:{$ne:false},archived:{$ne:true}};
  const [lectures, notes, sheets, quizzes, progress, materials] = await Promise.all([
    lectureModel.find({ chapterID: chapter._id,...visibility }).sort({position:1,createdAt:1}), noteModel.find({ chapterID: chapter._id,...visibility }).sort({position:1,createdAt:1}), sheetModel.find({ chapterID: chapter._id,...visibility }).sort({position:1,createdAt:1}),
    quizModel.find({ chapterID: chapter._id, status: { $nin: ['draft', 'reviewed'] } }), Progress.findOne({ user: req.user._id, chapter: chapter._id }), Resource.find({chapter:chapter._id,...visibility}).sort({position:1,createdAt:1})
  ]);
  res.render('study/workspace', { chapter, lectures, notes, sheets, quizzes, progress, materials, preview, videoSource, active: 'library' });
}
export async function saveProgress(req, res) {
  if (!await chapterModel.exists({ _id: req.params.id })) return res.status(404).send('Chapter not found.');
  if (typeof req.body.notes !== 'string' || req.body.notes.length > 10000) return res.status(400).send('Notes must be under 10,000 characters.');
  const previous = await Progress.findOne({ user: req.user._id, chapter: req.params.id });
  await Progress.findOneAndUpdate({ user: req.user._id, chapter: req.params.id }, { notes: req.body.notes, completed: req.body.completed === 'on', completedAt: req.body.completed === 'on' ? previous?.completedAt || new Date() : null, bookmarked: req.body.bookmarked === 'on' }, { upsert: true, runValidators: true });
  req.flash('success', 'Your learning progress is saved.');
  res.redirect('/learn/' + req.params.id);
}
export async function planner(req, res) {
  const tasks = await Task.find({ user: req.user._id }).sort({ date: 1 });
  res.render('study/planner', { tasks, active: 'planner' });
}
export async function createTask(req, res) {
  const { title, date } = req.body;
  if (typeof title !== 'string' || !title.trim() || title.length > 160 || !validDate(date)) return res.status(400).send('Enter a title and a valid date.');
  await Task.create({ user: req.user._id, title: title.trim(), date });
  res.redirect('/planner');
}
export async function changeTask(req, res) {
  if(req.body.title!==undefined&&(typeof req.body.title!=='string'||!req.body.title.trim()||req.body.title.length>160))return res.status(400).send('Enter a task title under 160 characters.');
  const update = { ...(req.body.title!==undefined?{title:req.body.title.trim()}:{}), done: req.body.done === 'on' };
  if (req.body.date) { if (!validDate(req.body.date)) return res.status(400).send('Invalid date.'); update.date = req.body.date; }
  if (!await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, update)) return res.status(404).send('Task not found.');
  res.redirect('/planner');
}
export async function saveProfile(req, res) {
  const { exam, targetDate, weeklyGoal } = req.body;
  if (typeof exam !== 'string' || exam.length > 120 || !validDate(targetDate) || !Number.isInteger(Number(weeklyGoal)) || Number(weeklyGoal) < 1 || Number(weeklyGoal) > 50) return res.status(400).send('Check your exam, date and weekly goal (1–50).');
  await Profile.findOneAndUpdate({ user: req.user._id }, { exam, targetDate, weeklyGoal: Number(weeklyGoal) }, { upsert: true, runValidators: true });
  res.redirect('/dashboard');
}
