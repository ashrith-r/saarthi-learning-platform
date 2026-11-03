import examModel from "../models/exam.js";
import subjectModel from "../models/subjects.js";
import chapterModel from "../models/chapter.js";
import lectureModel from "../models/lecture.js";
import noteModel from "../models/notes.js";
import sheetModel from "../models/sheet.js";
import updateModel from "../models/update.js";
import questionModel from "../models/questionBank.js";
import quizModel from "../models/quiz.js";
import quizAttemptModel from "../models/quizAttempt.js";

export async function renderSubject(req,res) {

  let id = req.params.id;
  let selectedExam=await examModel.findById(id);
  if (!selectedExam) {
    req.flash("error", "Exam not found");
    return res.redirect("/");
  }

  let subjectList = await subjectModel.find({
    examID:id
  })

  res.render("subject",{selectedExam,subjectList})

  // res.render("subject.ejs",{selectedExam,subjectList})
  
}


export async function renderChapters(req,res) {
  let {id}=req.params;
  let subjectData = await subjectModel.findById(id);
  if (!subjectData) {
    req.flash("error", "Subject not found");
    return res.redirect("/");
  }
  let examID = subjectData.examID;
  let examData = await examModel.findById(examID);
  let chapters = await chapterModel.find({
    subjectID:id
  });
  res.render("chapter.ejs",{
    chapters,examData,subjectData
  })
  
}

export async function renderContent(req,res) {

  let {id}=req.params;
  let chapterData= await chapterModel.findById(id);
  if (!chapterData) {
    req.flash("error", "Chapter not found");
    return res.redirect("/");
  }


  let lectureList = await lectureModel.find({
    chapterID:id
  })
  let noteList = await noteModel.find({
    chapterID:id
  })
  let sheetList = await sheetModel.find({
    chapterID:id
  })
  let quizList = await quizModel.find({
    status: { $nin: ["draft","reviewed"] },
    chapterID:id
  })
  let quizAttempts = [];
  if (req.user) {
    quizAttempts = await quizAttemptModel.find({
      user: req.user._id,
      quiz: { $in: quizList.map(q => q._id) }
    }).sort({ createdAt: -1 });
  }

  res.render("content",{
    chapterData,noteList,lectureList,sheetList,quizList,quizAttempts
  })
  
}
export async function renderUpdates(req, res) {
  const { exam, category } = req.query;
  const filters = { exam: exam || "", category: category || "" };
  const query = {};
  if (exam) {
    query.examID = exam;
  }
  if (category) {
    query.category = category;
  }
  const [updates, exams, categoryValues] = await Promise.all([
    updateModel.find(query).sort({ date: -1 }),
    examModel.find(),
    updateModel.distinct("category", { category: { $type: "string", $ne: "" } })
  ]);
  const categories = categoryValues.filter(value => value.trim()).sort((a, b) => a.localeCompare(b));
  res.render("updates.ejs", {
    updates,
    exams,
    categories,
    filters
  });
}

export async function renderTakeQuiz(req, res) {
  try {
    const { id } = req.params;
    const quiz = await quizModel.findById(id).populate("questions");
    if (!quiz || ["draft","reviewed"].includes(quiz.status)) {
      req.flash("error", "Quiz not found.");
      return res.redirect("/");
    }
    res.render("quiz/take", { quiz });
  } catch (error) {
    console.error("Error loading quiz:", error);
    req.flash("error", "Failed to load quiz.");
    res.redirect("/");
  }
}

export async function submitQuiz(req, res) {
  try {
    const { id } = req.params;
    const quiz = await quizModel.findById(id).populate("questions");
    if (!quiz || ["draft","reviewed"].includes(quiz.status)) {
      req.flash("error", "Quiz not found.");
      return res.redirect("/");
    }

    const userAnswers = req.body.answers || {};
    let score = 0;
    const answers = [];
    const incorrectChapters = new Set();
    const incorrectTags = new Set();

    for (const question of quiz.questions) {
      const questionId = question._id.toString();
      const submitted = userAnswers[questionId];
      const selectedOptionId = typeof submitted === "string" &&
        question.options.some(option => option._id.toString() === submitted) ? submitted : null;
      const isCorrect = Boolean(selectedOptionId && selectedOptionId === question.correctOption.toString());

      if (isCorrect) {
        score++;
      } else {
        if (question.chapter) {
          incorrectChapters.add(question.chapter.trim());
        }
        if (question.tags && question.tags.length > 0) {
          question.tags.forEach(tag => {
            if (tag) incorrectTags.add(tag.trim());
          });
        }
      }

      answers.push({
        question: question._id,
        selectedOption: selectedOptionId,
        isCorrect
      });
    }

    const attempt = await quizAttemptModel.create({
      user: req.user._id,
      quiz: quiz._id,
      answers,
      score,
      totalQuestions: quiz.questions.length,
      weaknesses: {
        chapters: Array.from(incorrectChapters),
        tags: Array.from(incorrectTags)
      }
    });

    req.flash("success", "Quiz submitted successfully!");
    res.redirect(`/quiz/attempt/${attempt._id}`);
  } catch (error) {
    console.error("Error submitting quiz:", error);
    req.flash("error", "Failed to submit quiz.");
    res.redirect("/");
  }
}

export async function renderQuizResult(req, res) {
  try {
    const { attemptId } = req.params;
    const attempt = await quizAttemptModel.findOne({ _id: attemptId, user: req.user._id })
      .populate({
        path: "quiz",
        populate: {
          path: "chapterID"
        }
      })
      .populate({
        path: "answers.question"
      });

    if (!attempt) {
      req.flash("error", "Quiz attempt not found.");
      return res.redirect("/");
    }

    res.render("quiz/result", { attempt });
  } catch (error) {
    console.error("Error rendering quiz result:", error);
    req.flash("error", "Failed to load quiz results.");
    res.redirect("/");
  }
}
