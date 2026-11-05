import {Router} from "express"
import * as authController from "../controllers/auth_controller.js"
import { requireSameOrigin, requireLogin } from "../middleware/middleware.js";
import * as mobile from '../controllers/mobileAuthController.js';
import {rateLimit} from 'express-rate-limit';
const authRouter =Router();
authRouter.use(['/register','/forgot-password','/mobile/send','/mobile/resend'], rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, skip: req => req.method !== 'POST',
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: 'Too many code requests from this connection. Try again in 15 minutes.'
}));
authRouter.get('/mobile', requireLogin, mobile.mobileSettings);
authRouter.post('/mobile/send', requireSameOrigin, requireLogin, mobile.sendBinding);
authRouter.post('/mobile/verify', requireSameOrigin, mobile.verify);
authRouter.post('/mobile/resend', requireSameOrigin, mobile.resend);
authRouter.post('/reset-password/mobile', requireSameOrigin, mobile.resetMobile);

authRouter.get("/login",authController.login)
authRouter.post("/login",requireSameOrigin,authController.loginUser)
authRouter.post("/register",requireSameOrigin,authController.registerUser)
authRouter.post("/verify-email",requireSameOrigin,authController.verifyEmail)
authRouter.post("/logout",requireSameOrigin,authController.logout)
authRouter.get("/forgot-password",authController.renderForgotPassword)
authRouter.post("/forgot-password",requireSameOrigin,authController.forgotPassword)
authRouter.post("/reset-password",requireSameOrigin,authController.resetPassword)

export default authRouter;
