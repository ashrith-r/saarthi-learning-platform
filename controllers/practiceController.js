import LegacyAttempt from '../models/quizAttempt.js';
import Quiz from '../models/quiz.js';
import Run from '../models/testRun.js';
import { cleanAnswers, gradeRun, publicQuestions } from '../services/testEngine.js';

export async function catalog(req, res) {
  const [quizzes, runs] = await Promise.all([Quiz.find({ status: { $nin: ['draft', 'reviewed'] } }).populate('chapterID').sort({createdAt:-1}), Run.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(30)]);
  res.render('study/practice', { quizzes, runs, active: 'practice' });
}
export async function start(req, res) {
  const quiz = await Quiz.findOne({ _id: req.params.id, status: { $nin: ['draft', 'reviewed'] } }).populate('questions');
  if (!quiz || !quiz.questions.length) return res.status(404).send('Published test not available.');
  // Reuse an active attempt to make a repeated start safe.
  let run = await Run.findOne({ user: req.user._id, quiz: quiz._id, status: 'active', expiresAt: { $gt: new Date() } });
  if (!run) {
    for(const expired of await Run.find({user:req.user._id,quiz:quiz._id,status:'active',expiresAt:{$lte:new Date()}}))await finalize(expired);
    const activeKey=String(req.user._id)+':'+String(quiz._id);
    try {run=await Run.findOneAndUpdate({activeKey},{$setOnInsert:{activeKey,user:req.user._id,quiz:quiz._id,title:quiz.title,questions:quiz.questions.map(q=>q.toObject()),marks:quiz.marks||1,penalty:quiz.penalty||0,expiresAt:new Date(Date.now()+(quiz.durationMinutes||20)*60000)}},{upsert:true,returnDocument:'after',setDefaultsOnInsert:true});}
    catch(error){if(error.code!==11000)throw error;run=await Run.findOne({activeKey});}
  }
  res.redirect('/practice/run/' + run._id);
}
export async function finalize(run) {
  if (run.status === 'submitted') return run;
  // One conditional database write freezes answers and result together.
  return await Run.findOneAndUpdate({ _id: run._id, status: 'active', updatedAt: run.updatedAt }, { $set:{status: 'submitted', result: gradeRun(run), submittedAt: new Date()},$unset:{activeKey:1} }, { returnDocument:'after' }) || null;
}
export async function show(req, res) {
  let run = await Run.findOne({ _id: req.params.id, user: req.user._id });
  if (!run) return res.status(404).send('Attempt not found.');
  if (run.status === 'active' && run.expiresAt <= new Date()) {
    run = await finalize(run);
    if (!run) return res.redirect(req.originalUrl);
  }
  if (run.status === 'submitted') return res.render('study/result', { run, active: 'practice' });
  res.render('study/test', { run: { _id: run._id, title: run.title, questions: publicQuestions(run.questions), answers: run.answers, flags: run.flags, timeSpent: run.timeSpent, expiresAt: run.expiresAt }, active: 'practice' });
}
export async function save(req, res) {
  const run = await Run.findOne({ _id: req.params.id, user: req.user._id, status: 'active' });
  if (!run) return res.status(409).json({ error: 'Attempt already submitted or unavailable.' });
  if (run.expiresAt <= new Date()) { await finalize(run); return res.status(409).json({ error: 'Time is up. Open results to see your saved answers.' }); }
  const answers = cleanAnswers(run.questions, req.body.answers);
  const ids = new Set(run.questions.map(q => String(q._id)));
  const flags = Array.isArray(req.body.flags) ? req.body.flags.filter(f => typeof f === 'string' && ids.has(f)).slice(0, run.questions.length) : [];
  const timeSpent={};
  for(const id of ids){const seconds=Number(req.body.timeSpent?.[id]);if(Number.isFinite(seconds)&&seconds>=0)timeSpent[id]=Math.min(14400,Math.round(seconds));}
  const updated = await Run.findOneAndUpdate({ _id: run._id, user: req.user._id, status: 'active', expiresAt: { $gt: new Date() } }, { answers, flags, timeSpent }, { returnDocument: 'after' });
  if (!updated) return res.status(409).json({ error: 'Time is up or attempt submitted.' });
  res.json({ saved: true });
}
export async function submit(req, res) {
  const run = await Run.findOne({ _id: req.params.id, user: req.user._id });
  if (!run) return res.status(404).send('Attempt not found.');
  const result = await finalize(run);
  if (!result) return res.status(409).send('Answers changed while submitting. Please submit again.');
  res.redirect('/practice/run/' + run._id);
}
export async function insights(req, res) {
  const runs = await Run.find({ user: req.user._id, status: 'submitted' }).sort({ submittedAt: -1 }).limit(50);
  const mistakes = runs.flatMap(r => r.result.review.filter(a => !a.isCorrect)).slice(0, 50);
  const legacyAttempts=await LegacyAttempt.find({user:req.user._id}).populate('quiz').sort({createdAt:-1}).limit(100);
  res.render('study/insights', { runs, mistakes, legacyAttempts, active: 'insights' });
}
export async function revision(req, res) {
  const runs = await Run.find({ user: req.user._id, status: 'submitted' }).sort({ submittedAt: -1 }).limit(20);
  const unique = new Map();
  for (const r of runs) for (const a of r.result.review) if (!a.isCorrect && !unique.has(String(a.question._id))) unique.set(String(a.question._id), a.question);
  const questions = [...unique.values()].slice(0, 10);
  if (!questions.length) return res.redirect('/practice');
  const run = await Run.create({ user: req.user._id, title: 'Your targeted revision', questions, marks: 1, penalty: 0, expiresAt: new Date(Date.now() + 15 * 60000) });
  res.redirect('/practice/run/' + run._id);
}
