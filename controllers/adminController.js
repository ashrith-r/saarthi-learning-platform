import Resource from '../models/learningResource.js';
import Audit from '../models/audit.js';
import chapterModel from "../models/chapter.js";
import examModel from "../models/exam.js";
import lectureModel from "../models/lecture.js";
import noteModel from "../models/notes.js";
import sheetModel from "../models/sheet.js";
import subjectModel from "../models/subjects.js";
import { convertYoutubeLink,getImage } from "../utils.js";
import updateModel from "../models/update.js";
import userModel from "../models/user.js";
import questionModel from "../models/questionBank.js";
import quizModel from "../models/quiz.js";
import quizAttemptModel from "../models/quizAttempt.js";
import { generateQuestionFromAI } from "../services/geminiService.js";

export async function renderAddExam(req,res) {
  const courseTypes = await examModel.distinct("courseType");
  res.render("addExam", { courseTypes: courseTypes.filter(value => typeof value === "string" && value.trim()).sort((a, b) => a.localeCompare(b)) });
}

export async function addExam(req,res) {
    let {examName,courseType, otherCourseType,icon}=req.body;
    examName=examName.trim();
    const alternativeCourseType=typeof otherCourseType==='string'?otherCourseType.trim():'';
    courseType=courseType === "Other" && alternativeCourseType ? alternativeCourseType : courseType.trim();
    icon=typeof icon==='string'?icon.trim():'';
    let data = await examModel.create({
      examName,courseType,icon,
      createdBy: req.user._id,
      updatedBy: req.user._id
    })

 
let exam = data;

    req.flash("success","Exam Added")
    return res.redirect("/")
  
}

export async function renderAddSubject(req,res) {

  let {id}=req.params;
  let exam = await examModel.findById(id);
  res.render("addSub1",{exam})
  
}


export async function addSubject(req,res) {
  let { id: exam_id } = req.params;

  let {subjects}=req.body;
  subjects = Array.isArray(subjects) ? subjects : [subjects];
  for(const subject of subjects) {
if(!subject.icon || subject.icon.trim() === "") {subject.icon=""}

    await subjectModel.create({
      examID:exam_id,
      subjectName:subject.subjectName,
      description:subject.description,
      chapterCount:subject.chapterCount,
      icon:subject.icon,
      createdBy: req.user._id,
      updatedBy: req.user._id
    })
    
  }
  req.flash("success","Subject Added");
  res.redirect("/")

  
}
export async function addNewSubject(req,res) {
  let {id}=req.params;
    let {subject}=req.body;
    
      let exam = await examModel.findById(id);
      exam.subjects.push(subject.subjectName);
      await exam.save()
if(!subject.icon || subject.icon.trim() === "") {subject.icon=""}

    await subjectModel.create({
      examID:id,
      subjectName:subject.subjectName,
      description:subject.description,
      chapterCount:subject.chapterCount,
      icon:subject.icon,
      createdBy: req.user._id,
      updatedBy: req.user._id
    })

    req.flash("success","Subject Added")
    return res.redirect(`/subject/${id}`)
  
}

export async function renderEditChapter(req,res) {

  let {id}=req.params;
  let chapter = await chapterModel.findById(id);
  let subID = chapter.subjectID;
  let subject = await subjectModel.findById(subID);
  res.render("editChapter",{chapter,subject})
}
export async function editChapter(req,res) {
  let {id}=req.params;
  let{chapter}=req.body;

  await chapterModel.findByIdAndUpdate(id,{
     chapterName:chapter.chapterName,
    description:chapter.description,
    updatedBy: req.user._id
  })
  let ch = await chapterModel.findById(id);
  let subID=ch.subjectID
  res.redirect(`/subject/${subID}/chapter`);
}
export async function editExamRender(req,res) {

  let {id}=req.params;
  let exam = await examModel.findById(id);
  let examName = exam.examName;
  let courseType=exam.courseType;
  let icon = exam.icon;
  let courseTypes = await examModel.distinct("courseType");
  res.render("editExam",{
    examName,courseType,icon,exam,courseTypes:courseTypes.filter(value=>typeof value==='string'&&value.trim()).sort((a,b)=>a.localeCompare(b))
  })
  
}

export async function editExam(req,res) {
  try {
    let { examName, courseType, otherCourseType, icon } = req.body;
    const { id } = req.params;
    examName=examName.trim();
    const alternativeCourseType=typeof otherCourseType==='string'?otherCourseType.trim():'';
    courseType=courseType === "Other" && alternativeCourseType ? alternativeCourseType : courseType.trim();
    icon=typeof icon==='string'?icon.trim():'';

    await examModel.findByIdAndUpdate(
      id,
      {
        examName,
        courseType,
        icon,
        updatedBy: req.user._id
      }
    );

    req.flash("success", "Exam updated successfully");
    res.redirect("/"); // change to your exam listing route

  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to update exam");
    res.redirect("/");
  }

}
export async function renderEditSubject(req,res) {
  let {id}=req.params;

  let subject = await subjectModel.findById(id);
// let subject = subjectList.subjectName;
  let eID = subject.examID;
  let exam = await examModel.findById(eID);
  res.render("editSub",{exam,subject})
  
}
export async function editSubject(req,res) {
  let {id}=req.params;
    let {subjects}=req.body;
    let subjectList = await subjectModel.findById(id);
    let eID = subjectList.examID;
  let update = await subjectModel.findByIdAndUpdate(id,{


      subjectName:subjects.name,
      description:subjects.description,
      chapterCount:subjects.chapterCount,
      icon:subjects.icon,
      updatedBy: req.user._id

  })

  req.flash("success","Subject Edited")
  res.redirect(`/subject/${eID}`)

  
}
export async function addChapterForm(req,res) {
let {id }= req.params;
let subject = await subjectModel.findById(id);
let eID = subject.examID;
let exam = await examModel.findById(eID)
  res.render("addChapter",{subject,exam})
  
}

export async function addChapter(req,res) {


   let {subjectID, chapters}=req.body;
   for(let i =0;i<chapters.length;i++)
   {
     await chapterModel.create({
        subjectID,chapterName:chapters[i].chapterName,
        description:chapters[i].description,
        createdBy: req.user._id,
        updatedBy: req.user._id
 })
   }
   res.redirect(`/subject/${subjectID}/chapter`)
  
}


export async function addNote(req,res) {
let {chapterID,title,url,page,designedBy}=req.body;
 await noteModel.create({
  chapterID,title,url,page,designedBy,
  createdBy: req.user._id,
  updatedBy: req.user._id
 })
  res.redirect(`/content/${chapterID}`)
}
export async function addSheet(req,res) {
let {chapterID,title,url,page,level}=req.body;
 await sheetModel.create({
  chapterID,title,url,page,level,
  createdBy: req.user._id,
  updatedBy: req.user._id
 })
  res.redirect(`/content/${chapterID}`)
}
export async function renderAddContent(req,res) {
  let {id}=req.params;
  let selectedChapter = await chapterModel.findById(id);
  res.render("addContent",{selectedChapter})
  
}
export async function addLecture(req,res) {
let {chapterID,title,url,duration,faculty}=req.body;
url = convertYoutubeLink(url);
  await lectureModel.create({
  chapterID,title,url,duration,faculty,
  createdBy: req.user._id,
  updatedBy: req.user._id
 })
res.redirect(`/content/${chapterID}`)  
}
export async function renderEditLecture(req,res) {
  let {id}=req.params;
  let lecture = await lectureModel.findById(id);
  let cID = lecture.chapterID;
  let chapterData= await chapterModel.findById(cID)
  res.render("editLecture",{
    lecture,chapterData
  })
  
}

export async function editLecture(req,res) {
  let {id}=req.params;
let {chapterID,title,url,duration,faculty}=req.body;
url = convertYoutubeLink(url);
let lecture = await lectureModel.findByIdAndUpdate(id,{
  title,url,duration,faculty,
  updatedBy: req.user._id
});
res.redirect(`/content/${chapterID}`)  
}

export async function renderEditSheet(req,res) {
   let {id}=req.params;
  let sheet = await sheetModel.findById(id);
  let cID =  sheet.chapterID;
    let chapterData= await chapterModel.findById(cID)
res.render("editSheet",{chapterData,sheet})
}

export async function editSheet(req,res) {

   let {id}=req.params;
let {chapterID,title,url,page,level}=req.body;
let sheet = await sheetModel.findByIdAndUpdate(id,{
  title,url,page,level,
  updatedBy: req.user._id
});
res.redirect(`/content/${chapterID}`)  
}

export async function renderEditNote(req,res) {
   let {id}=req.params;
  let note = await noteModel.findById(id);
  let cID =  note.chapterID;
    let chapterData= await chapterModel.findById(cID)
res.render("editNote",{chapterData,note})
}
export async function editNote(req,res) {
 let {id}=req.params;
let {chapterID,title,url,page,designedBy}=req.body;
let sheet = await noteModel.findByIdAndUpdate(id,{
  title,url,page,designedBy,
  updatedBy: req.user._id
});
res.redirect(`/content/${chapterID}`) 
}
export async function renderAddUpdate(req, res) {
  const [exams, categoryValues] = await Promise.all([
    examModel.find(),
    updateModel.distinct("category", { category: { $type: "string", $ne: "" } })
  ]);
  const categories = categoryValues.filter(value => value.trim()).sort((a, b) => a.localeCompare(b));
  res.render("addUpdate", { exams, categories });
}
export async function addUpdate(req, res) {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const category = typeof req.body.category === "string" ? req.body.category.trim() : "";
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  const { examID, isImportant } = req.body;
  if (!title || title.length > 180 || !category || category.length > 80 || !content || content.length > 10000) {
    return res.status(400).send("Enter a title, category and announcement under the listed length limits.");
  }
  if (examID && !await examModel.exists({ _id: examID })) return res.status(400).send("Choose an existing exam.");
  await updateModel.create({
    title,
    category,
    content,
    examID: examID || null,
    isImportant: isImportant === "on" || isImportant === true,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });
  req.flash("success", "Update posted successfully");
  res.redirect("/updates");
}
export async function renderAdminMenu(req,res){
 const [users,exams,subjects,chapters,resources,lectures,notes,sheets,quizzes,events]=await Promise.all([
 userModel.find().select('username email admin editor verified'),examModel.find(),subjectModel.find(),chapterModel.find(),Resource.find({archived:{$ne:true},published:true}),lectureModel.find({archived:{$ne:true},published:{$ne:false}}),noteModel.find({archived:{$ne:true},published:{$ne:false}}),sheetModel.find({archived:{$ne:true},published:{$ne:false}}),quizModel.find(),Audit.find().populate('actor','username').sort({createdAt:-1}).limit(12)]);
 const contentIds=new Set([...resources.map(r=>String(r.chapter)),...lectures.map(r=>String(r.chapterID)),...notes.map(r=>String(r.chapterID)),...sheets.map(r=>String(r.chapterID))]);
 const incomplete=chapters.filter(c=>!contentIds.has(String(c._id)));
 res.render('adminDashboard',{active:'admin',users,exams,subjects,chapters,events,incomplete,drafts:quizzes.filter(q=>q.status==='draft'||q.status==='reviewed'),stats:{users:users.length,chapters:chapters.length,materials:resources.length+lectures.length+notes.length+sheets.length}});
}

export async function toggleAdminStatus(req, res) {
  try {
    const { id } = req.params;
    
    // Prevent self-demotion
    if (id === req.user._id.toString()) {
      req.flash("error", "You cannot demote yourself from Admin status.");
      return res.redirect("/admin");
    }

    const targetUser = await userModel.findById(id);
    if (!targetUser) {
      req.flash("error", "User not found");
      return res.redirect("/admin");
    }

    targetUser.admin = !targetUser.admin;
    await Audit.create({actor:req.user._id,action:'Administrator role changed',details:targetUser.username});
    await targetUser.save();

    req.flash("success", `User role for "${targetUser.username}" updated to ${targetUser.admin ? 'Admin' : 'Student'}`);
    res.redirect("/admin");
  } catch (error) {
    console.error("Error toggling admin status:", error);
    req.flash("error", "Failed to update user administrative status");
    res.redirect("/admin");
  }
}

export async function renderAddQuestion(req,res) {
  let {id}=req.params;
  let exam = await examModel.findById(id);
  let sub = (await subjectModel.find({ examID: id })).map(subject => subject.subjectName);
res.render("addQuestion",{sub,id})
  
}
export async function addQuestion(req,res) {
  try {
    let {course,question_text,optionAtext,optionBtext,optionCtext,optionDtext,correctOption,subject,chapter,level,tags,solution_text}=req.body;
    
    if(!question_text||![optionAtext,optionBtext,optionCtext,optionDtext].every(v=>typeof v==='string'&&v.trim())||!['0','1','2','3'].includes(String(correctOption))||!await examModel.exists({_id:course}))return res.status(400).send('Enter a question, four options, a correct answer and an existing exam.');
    let {question_img,optionAImage,optionBImage,optionCImage,optionDImage,solution}=req.files||{};
    let qsn_img = getImage(question_img);
    let optionAImg=getImage(optionAImage);
    let optionBImg=getImage(optionBImage);
    let optionCImg=getImage(optionCImage);
    let optionDImg=getImage(optionDImage);
    let solution_img=getImage(solution)

    let options = [{text:optionAtext,img:optionAImg},{text:optionBtext,img:optionBImg},{text:optionCtext,img:optionCImg},{text:optionDtext,img:optionDImg} ]
    let soln = {
      text:solution_text,img:solution_img
    }
    let qsn = new questionModel({
      course,question_text,question_img:qsn_img,options,subject,chapter,level,solution:soln, tags: tags ? tags.split(",").map(tag => tag.trim()) : [],
      createdBy: req.user._id
    })
    const index = Number(correctOption);
    qsn.correctOption = qsn.options[index]._id;
    await qsn.save();

    req.flash("success", "Question added successfully!");
    res.redirect("/admin/questionBank");
  } catch (error) {
    console.error("Error adding question:", error);
    req.flash("error", "Failed to add question.");
    res.redirect("/admin");
  }
}

export async function renderQuestionBank(req,res) {
  try {
    const exams = await examModel.find();
    const questions = await questionModel.find().populate("course").sort({ createdAt: -1 });
    res.render("questionBank", { questions, exams });
  } catch (error) {
    console.error("Error rendering question bank:", error);
    req.flash("error", "Failed to render question bank.");
    res.redirect("/admin");
  }
}

export async function renderEditQuestion(req, res) {
  try {
    const { id } = req.params;
    const question = await questionModel.findById(id);
    if (!question) {
      req.flash("error", "Question not found");
      return res.redirect("/admin/questionBank");
    }
    const exams = await examModel.find();
    const currentExam = await examModel.findById(question.course);
    const sub = currentExam ? (await subjectModel.find({ examID: currentExam._id })).map(subject => subject.subjectName) : [];
    
    res.render("editQuestion", { question, exams, sub });
  } catch (error) {
    console.error("Error rendering edit question form:", error);
    req.flash("error", "Failed to render edit question form.");
    res.redirect("/admin/questionBank");
  }
}

export async function editQuestion(req, res) {
  try {
    const { id } = req.params;
    const {
      course,
      question_text,
      optionAtext,
      optionBtext,
      optionCtext,
      optionDtext,
      correctOption,
      subject,
      chapter,
      level,
      tags,
      solution_text
    } = req.body;

    const question = await questionModel.findById(id);
    if (!question) {
      req.flash("error", "Question not found");
      return res.redirect("/admin/questionBank");
    }

    // Process file uploads
    let question_img_upload = req.files && req.files.question_img ? getImage(req.files.question_img) : null;
    let optionAImg_upload = req.files && req.files.optionAImage ? getImage(req.files.optionAImage) : null;
    let optionBImg_upload = req.files && req.files.optionBImage ? getImage(req.files.optionBImage) : null;
    let optionCImg_upload = req.files && req.files.optionCImage ? getImage(req.files.optionCImage) : null;
    let optionDImg_upload = req.files && req.files.optionDImage ? getImage(req.files.optionDImage) : null;
    let solution_img_upload = req.files && req.files.solution ? getImage(req.files.solution) : null;

    // Update main fields
    question.course = course;
    question.question_text = question_text;
    if (question_img_upload) {
      question.question_img = question_img_upload;
    }
    question.subject = subject;
    question.chapter = chapter;
    question.level = level;
    question.tags = tags ? tags.split(",").map(tag => tag.trim()).filter(t => t !== "") : [];

    // Solution
    question.solution = {
      text: solution_text,
      img: solution_img_upload || question.solution.img
    };

    // Update options text and/or images
    const optTexts = [optionAtext, optionBtext, optionCtext, optionDtext];
    const optImgs = [optionAImg_upload, optionBImg_upload, optionCImg_upload, optionDImg_upload];

    for (let i = 0; i < 4; i++) {
      if (question.options[i]) {
        question.options[i].text = optTexts[i] || "";
        if (optImgs[i]) {
          question.options[i].img = optImgs[i];
        }
      } else {
        question.options.push({
          text: optTexts[i] || "",
          img: optImgs[i] || undefined
        });
      }
    }

    // Update correct option field
    const index = Number(correctOption);
    if (!isNaN(index) && index >= 0 && index < question.options.length) {
      question.correctOption = question.options[index]._id;
    }

    await question.save();

    req.flash("success", "Question updated successfully!");
    res.redirect("/admin/questionBank");
  } catch (error) {
    console.error("Error editing question:", error);
    req.flash("error", "Failed to update question.");
    res.redirect("/admin/questionBank");
  }
}

export async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    if(await quizModel.exists({questions:id}))return res.status(409).send('This question belongs to a quiz. Remove it from the quiz before deleting.');
    const result=await questionModel.findByIdAndDelete(id);
    if (!result) {
      req.flash("error", "Question not found");
      return res.redirect("/admin/questionBank");
    }
    req.flash("success", "Question deleted successfully!");
    res.redirect("/admin/questionBank");
  } catch (error) {
    console.error("Error deleting question:", error);
    req.flash("error", "Failed to delete question.");
    res.redirect("/admin/questionBank");
  }
}

export async function renderCreateQuiz(req, res) {
  try {
    const exams = await examModel.find();
    res.render("quiz/create", { exams });
  } catch (error) {
    console.error("Error rendering create quiz form:", error);
    req.flash("error", "Failed to load page.");
    res.redirect("/admin");
  }
}

export async function createQuiz(req, res) {
  try {
    const { title, chapterID, questions } = req.body;
    
    if (!title || !chapterID || !questions || questions.length === 0) {
      req.flash("error", "Please provide a title, chapter, and select at least one question.");
      return res.redirect("/admin/quiz/create");
    }

    const questionIds=[...new Set(Array.isArray(questions)?questions:[questions])];
    if(!await chapterModel.exists({_id:chapterID})||await questionModel.countDocuments({_id:{$in:questionIds}})!==questionIds.length)return res.status(400).send('Choose valid chapter and questions.');

    await quizModel.create({
      title,
      status: "draft",
      chapterID,
      questions: questionIds,
      createdBy: req.user._id
    });

    req.flash("success", "Quiz created successfully!");
    res.redirect("/admin");
  } catch (error) {
    console.error("Error creating quiz:", error);
    req.flash("error", "Failed to create quiz.");
    res.redirect("/admin/quiz/create");
  }
}

export async function apiGetSubjects(req, res) {
  try {
    const { examId } = req.params;
    const subjects = await subjectModel.find({ examID: examId });
    res.json(subjects);
  } catch (error) {
    console.error("Error getting subjects:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function apiGetChapters(req, res) {
  try {
    const { subjectId } = req.params;
    const chapters = await chapterModel.find({ subjectID: subjectId });
    res.json(chapters);
  } catch (error) {
    console.error("Error getting chapters:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function apiGetQuestions(req, res) {
  try {
    const { examId, subjectName } = req.query;
    if (!examId || !subjectName) {
      return res.status(400).json({ error: "examId and subjectName are required" });
    }
    // course refers to the exam ObjectId, and subject is stored as String in questionModel
    const questions = await questionModel.find({ course: examId, subject: subjectName });
    res.json(questions);
  } catch (error) {
    console.error("Error getting questions:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function apiGenerateQuestion(req, res) {
  if(!process.env.GEMINI_API_KEY)return res.status(503).json({success:false,message:'AI generation is not configured. Add questions manually.'});
  try {
    const { prompt, subject, chapter, difficulty } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: "Prompt is required" });
    }
    const data = await generateQuestionFromAI({ prompt, subject, chapter, difficulty });
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error in apiGenerateQuestion:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to generate question" });
  }
}