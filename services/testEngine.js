export function cleanAnswers(questions, input = {}) {
  const result = {};
  for (const q of questions) {
    const value = input?.[String(q._id)];
    if (typeof value === 'string' && q.options.some(o => String(o._id) === value)) result[String(q._id)] = value;
  }
  return result;
}
export function gradeRun(run) {
  const answers = cleanAnswers(run.questions, run.answers);
  let correct = 0, wrong = 0, skipped = 0;
  const tags = new Set();
  const review = run.questions.map(q => {
    const selected = answers[String(q._id)] || null;
    const isCorrect = selected === String(q.correctOption);
    if (!selected) skipped++; else if (isCorrect) correct++; else wrong++;
    if (!isCorrect) for (const tag of q.tags || []) tags.add(tag);
    return { question: q, selected, isCorrect, seconds: Number(run.timeSpent?.[String(q._id)]) || 0 };
  });
  return { correct, wrong, skipped, total: run.questions.length,
    score: Number((correct * run.marks - wrong * run.penalty).toFixed(2)),
    maximum: run.questions.length * run.marks,
    accuracy: run.questions.length ? Math.round(correct / run.questions.length * 100) : 0,
    tags: [...tags], review };
}
export function publicQuestions(questions) {
  return questions.map(({ _id, question_text, question_img, options }) => ({ _id, question_text, question_img, options }));
}
