import Exam from '../models/exam.js';
import Subject from '../models/subjects.js';
import Chapter from '../models/chapter.js';
const text=(s,max=5000)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
export async function validateCurriculum(req,res,next){
 if(!req.user||!(req.user.admin||req.user.editor))return next();
 if(req.method==='POST'){
  if(req.path==='/addExam'||/^\/exam\/edit\//.test(req.path)){
   if(!text(req.body.examName,160)||!text(req.body.courseType,120)||(req.body.otherCourseType!==undefined&&req.body.otherCourseType!==''&&!text(req.body.otherCourseType,120))||(req.body.icon!==undefined&&(typeof req.body.icon!=='string'||req.body.icon.length>64)))return res.status(400).send('Enter an exam name and course type.');
  }
  if(/^\/subject\/[^/]+\/add$/.test(req.path)){
   if(!await Exam.exists({_id:req.params.id||req.path.split('/')[2]}))return res.status(404).send('Exam not found.');
   const value=req.body.subject;
   if(!value||!text(value.subjectName,160)||!text(value.description)||!Number.isInteger(Number(value.chapterCount))||Number(value.chapterCount)<0||(value.icon!==undefined&&(typeof value.icon!=='string'||value.icon.length>64)))return res.status(400).send('Enter a subject name, description and non-negative chapter count.');
  }
  if(/^\/subject\/[^/]+\/addChapter$/.test(req.path)){
   const id=req.path.split('/')[2];if(!await Subject.exists({_id:id}))return res.status(404).send('Subject not found.');
   req.body.subjectID=id;
   if(!Array.isArray(req.body.chapters)||!req.body.chapters.length||req.body.chapters.length>50||req.body.chapters.some(c=>!text(c.chapterName,160)||!text(c.description)))return res.status(400).send('Enter names and descriptions for 1–50 chapters.');
  }
  if(/^\/chapter\/[^/]+\/edit$/.test(req.path)&&(!text(req.body.chapter?.chapterName,160)||!text(req.body.chapter?.description)))return res.status(400).send('Enter a chapter name and description.');
  if(/^\/subject\/[^/]+\/edit$/.test(req.path)&&(!text(req.body.subjects?.name,160)||!text(req.body.subjects?.description)||!Number.isInteger(Number(req.body.subjects?.chapterCount))||Number(req.body.subjects.chapterCount)<0||(req.body.subjects.icon!==undefined&&(typeof req.body.subjects.icon!=='string'||req.body.subjects.icon.length>64))))return res.status(400).send('Enter a subject name, description and valid chapter count.');
 }
 const path=req.path;
 const model=/^\/exam\/edit\//.test(path)?Exam:/^\/chapter\/[^/]+\/edit$/.test(path)?Chapter:/^\/subject\/[^/]+\/(edit|addChapter)$/.test(path)?Subject:/^\/subject\/[^/]+\/add$/.test(path)?Exam:null;
 const id=path.split('/')[path.startsWith('/exam/edit/')?3:2];
 if(model&&!await model.exists({_id:id}))return res.status(404).send('Curriculum record not found.');
 next();
}
