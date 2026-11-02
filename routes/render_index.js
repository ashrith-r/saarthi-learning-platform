import {Router} from "express"
import * as authController from "../controllers/auth_controller.js"
import * as controller from "../controllers/controller.js"
import { requireLogin, requireSameOrigin, validateObjectIdParam } from "../middleware/middleware.js";

const Route = Router()
Route.param("id", validateObjectIdParam("id"));
Route.param("attemptId", validateObjectIdParam("attemptId"));
Route.get("/",authController.renderIndex)
Route.get("/subject/:id",controller.renderSubject)
Route.get("/subject/:id/chapter",controller.renderChapters)
Route.get("/content/:id",(req,res)=>res.redirect("/learn/"+req.params.id))
Route.get("/updates",controller.renderUpdates)
Route.get("/dashboard", requireLogin, controller.renderStudentDashboard)

Route.get("/quiz/:id", requireLogin, controller.renderTakeQuiz);
Route.post("/quiz/:id/submit", requireSameOrigin, requireLogin, controller.submitQuiz);
Route.get("/quiz/attempt/:attemptId", requireLogin, controller.renderQuizResult);

export default Route
