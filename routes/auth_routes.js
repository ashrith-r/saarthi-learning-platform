import {Router} from "express"
import * as authController from "../controllers/auth_controller.js"
import { requireSameOrigin } from "../middleware/middleware.js";
const authRouter =Router();

authRouter.get("/login",authController.login)
authRouter.post("/login",requireSameOrigin,authController.loginUser)
authRouter.post("/register",requireSameOrigin,authController.registerUser)
authRouter.post("/verify-email",requireSameOrigin,authController.verifyEmail)
authRouter.post("/logout",requireSameOrigin,authController.logout)
authRouter.get("/forgot-password",authController.renderForgotPassword)
authRouter.post("/forgot-password",requireSameOrigin,authController.forgotPassword)
authRouter.post("/reset-password",requireSameOrigin,authController.resetPassword)

export default authRouter;
