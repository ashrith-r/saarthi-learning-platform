export const MILESTONE_THRESHOLDS = Object.freeze({
  firstChapter: 1,
  learningMomentum: 5,
  testExplorer: 1,
  planInMotion: 1
});

export function summarize(progress, attempts, tasks, now = new Date()) {
  const completed = progress.filter(p => p.completed).length;
  const answered = attempts.reduce((n, a) => n + a.totalQuestions, 0);
  const correct = attempts.reduce((n, a) => n + (a.correctCount ?? a.score), 0);
  const weaknesses = {};
  for (const a of attempts) for (const tag of a.weaknesses?.tags || []) weaknesses[tag] = (weaknesses[tag] || 0) + 1;
  const weakTopics = Object.entries(weaknesses).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const weekly = progress.filter(p => p.completed && new Date(p.completedAt || p.updatedAt) >= weekAgo).length;
  const dayKey = d => new Date(d).toISOString().slice(0,10);
  const dates = new Set([...progress.filter(p=>p.completed).map(p=>p.completedAt||p.updatedAt), ...attempts.map(a=>a.submittedAt||a.createdAt)].filter(Boolean).map(dayKey));
  let streak=0;
  let cursor = new Date(now);
  if(!dates.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate()-1);
  while(dates.has(dayKey(cursor))){streak++;cursor.setUTCDate(cursor.getUTCDate()-1);}
  return { completed, weekly, streak, accuracy: answered ? Math.round(correct / answered * 100) : 0,
    tests: attempts.length, saved: progress.filter(p => p.bookmarked).length,
    tasksDone: tasks.filter(t => t.done).length, weakTopics,
    badges: [completed >= MILESTONE_THRESHOLDS.firstChapter && 'First chapter', completed >= MILESTONE_THRESHOLDS.learningMomentum && 'Learning momentum', attempts.length >= MILESTONE_THRESHOLDS.testExplorer && 'Test explorer', tasks.filter(t => t.done).length >= MILESTONE_THRESHOLDS.planInMotion && 'Plan in motion'].filter(Boolean) };
}
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function escapeSearch(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
