import {validateCurriculum} from '../middleware/curriculum.js';
import {Router} from "express"
import * as adminController from "../controllers/adminController.js"
import { requireAdmin, requireContentEditor, requireSameOrigin, validateObjectIdParam } from "../middleware/middleware.js";
import * as publishing from "../controllers/publishingController.js";
import * as materials from "../controllers/materialController.js";
import {safeMaterialUrl} from "../services/materials.js";
import upload from "../middleware/upload.js";
const adminRoute =Router();
adminRoute.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  return requireSameOrigin(req, res, next);
});
adminRoute.use(validateCurriculum);
adminRoute.param("examId",validateObjectIdParam("examId"));
adminRoute.param("subjectId",validateObjectIdParam("subjectId"));
adminRoute.param("id", validateObjectIdParam("id"));
adminRoute.use((req,res,next)=>{if(req.method==='POST' && /(?:addLecture|addNote|addSheet|lecture\/.*\/edit|note\/.*\/edit|sheet\/.*\/edit)/.test(req.path) && !safeMaterialUrl(req.body?.url))return res.status(400).send('Enter a complete HTTP or HTTPS resource URL.');next();});
adminRoute.post('/legacy-materials/:type/:id',requireContentEditor,materials.legacyVisibility);
adminRoute.get('/materials',requireContentEditor,materials.manager);
adminRoute.post('/materials',requireContentEditor,materials.uploadPdf,materials.save);
adminRoute.post('/material-archive/:type/:id',requireContentEditor,materials.archive);
adminRoute.post('/material-edit/:type/:id',requireContentEditor,materials.uploadPdf,materials.save);
adminRoute.post('/materials/:id',requireContentEditor,materials.uploadPdf,materials.save);
adminRoute.get('/site-settings',requireAdmin,materials.settings);
adminRoute.post('/site-settings',requireAdmin,materials.saveSettings);

adminRoute.get("/",requireContentEditor,adminController.renderAdminMenu)
adminRoute.get("/addExam",requireContentEditor, adminController.renderAddExam)
adminRoute.get("/subject/:id/addChapter",requireContentEditor,adminController.addChapterForm)
adminRoute.get("/exam/edit/:id",requireContentEditor,adminController.editExamRender)
adminRoute.get("/content/:id/addContent",requireContentEditor,(req,res)=>res.redirect("/admin/materials?chapter="+req.params.id))
adminRoute.get("/subject/:id/edit",requireContentEditor,adminController.renderEditSubject)
adminRoute.get("/chapter/:id/edit",requireContentEditor,adminController.renderEditChapter)
adminRoute.get("/subject/:id/add",requireContentEditor,adminController.renderAddSubject)
adminRoute.get("/lecture/:id/edit",requireContentEditor,async(req,res)=>{const {default:Model}=await import('../models/lecture.js');const item=await Model.findById(req.params.id);if(!item)return res.status(404).send('Material not found.');res.redirect('/admin/materials?chapter='+item.chapterID+'#material-'+item._id);})
adminRoute.get("/sheet/:id/edit",requireContentEditor,async(req,res)=>{const {default:Model}=await import('../models/sheet.js');const item=await Model.findById(req.params.id);if(!item)return res.status(404).send('Material not found.');res.redirect('/admin/materials?chapter='+item.chapterID+'#material-'+item._id);})
adminRoute.get("/note/:id/edit",requireContentEditor,async(req,res)=>{const {default:Model}=await import('../models/notes.js');const item=await Model.findById(req.params.id);if(!item)return res.status(404).send('Material not found.');res.redirect('/admin/materials?chapter='+item.chapterID+'#material-'+item._id);})
adminRoute.get("/addUpdate",requireContentEditor,adminController.renderAddUpdate)
adminRoute.get("/:id/addQuestion",requireContentEditor,adminController.renderAddQuestion)
adminRoute.get("/questionBank",requireContentEditor,adminController.renderQuestionBank)


adminRoute.get("/quiz/create", requireContentEditor, adminController.renderCreateQuiz);


adminRoute.post("/subject/:id/add",requireSameOrigin,requireContentEditor,adminController.addNewSubject)
adminRoute.post("/addExam",requireSameOrigin,requireContentEditor,adminController.addExam)
adminRoute.post("/exam/:id/addSubject",requireSameOrigin,requireContentEditor,adminController.addSubject)
adminRoute.post("/subject/:id/addChapter",requireSameOrigin,requireContentEditor,adminController.addChapter)
adminRoute.post("/addLecture",requireSameOrigin,requireContentEditor,adminController.addLecture)
adminRoute.post("/addNote",requireSameOrigin,requireContentEditor,adminController.addNote)
adminRoute.post("/addSheet",requireSameOrigin,requireContentEditor,adminController.addSheet)
adminRoute.post("/exam/edit/:id",requireSameOrigin,requireContentEditor,adminController.editExam)
adminRoute.post("/subject/:id/edit",requireSameOrigin,requireContentEditor,adminController.editSubject)
adminRoute.post("/chapter/:id/edit",requireSameOrigin,requireContentEditor,adminController.editChapter)
adminRoute.post("/lecture/:id/edit",requireSameOrigin,requireContentEditor,adminController.editLecture)
adminRoute.post("/sheet/:id/edit",requireSameOrigin,requireContentEditor,adminController.editSheet)
adminRoute.post("/note/:id/edit",requireSameOrigin,requireContentEditor,adminController.editNote)
adminRoute.post("/addUpdate",requireSameOrigin,requireContentEditor,adminController.addUpdate)
adminRoute.post("/users/:id/toggle-admin", requireSameOrigin, requireAdmin, adminController.toggleAdminStatus)
adminRoute.get("/question/edit/:id", requireContentEditor, adminController.renderEditQuestion)


adminRoute.post("/addQuestion",requireContentEditor,   upload.fields([
        { name: "question_img", maxCount: 1 },
        { name: "optionAImage", maxCount: 1 },
        { name: "optionBImage", maxCount: 1 },
        { name: "optionCImage", maxCount: 1 },
        { name: "optionDImage", maxCount: 1 },
        {name:"solution",maxCount:1}
    ]),adminController.addQuestion)

adminRoute.post("/question/edit/:id", requireContentEditor, upload.fields([
        { name: "question_img", maxCount: 1 },
        { name: "optionAImage", maxCount: 1 },
        { name: "optionBImage", maxCount: 1 },
        { name: "optionCImage", maxCount: 1 },
        { name: "optionDImage", maxCount: 1 },
        {name:"solution",maxCount:1}
    ]), adminController.editQuestion)
adminRoute.post("/question/delete/:id", requireContentEditor, adminController.deleteQuestion)

adminRoute.post("/quiz/create", requireContentEditor, adminController.createQuiz);
adminRoute.get("/api/subjects/:examId", requireContentEditor, adminController.apiGetSubjects);
adminRoute.get("/api/chapters/:subjectId", requireContentEditor, adminController.apiGetChapters);
adminRoute.get("/api/questions", requireContentEditor, adminController.apiGetQuestions);
adminRoute.post("/api/generate-question", requireContentEditor, adminController.apiGenerateQuestion);

adminRoute.get('/publishing',requireContentEditor,(req,res)=>publishing.menu(req,res));
adminRoute.post('/publishing/:id',requireContentEditor,publishing.publish);
adminRoute.get('/publishing/:id/preview',requireContentEditor,publishing.preview);
adminRoute.post('/import-csv',requireContentEditor,publishing.importCsv);
adminRoute.post('/users/:id/editor',requireAdmin,publishing.setEditor);
export default adminRoute

