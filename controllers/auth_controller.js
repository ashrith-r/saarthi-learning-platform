import bcrypt from "bcryptjs";
import crypto from "crypto"
import userModel from "../models/user.js"
import otpModel from "../models/otp.js";
import jwt from "jsonwebtoken"
import { getOTPHTML,generateOTP, getOTPHTMLForgot } from "../config/utils/otp-generate.js";
import { sendEmail } from "../services/email-services.js";
import sessionModel from "../models/session.js";
import config from "../config/config.js";
import examModel from "../models/exam.js";
import updateModel from "../models/update.js";
import testimonialModel from "../models/testimonial.js";
import quoteModel from "../models/quote.js";

const ACCESS_TOKEN_MAX_AGE = 5 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 15 * 24 * 60 * 60 * 1000;

function authCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function createUserSession(req, res, user) {
  const refreshToken=jwt.sign({
    id:user._id,
    jti: crypto.randomUUID()
  },config.JWT_SECRET,{
    expiresIn:"15d"
  })

  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const session = await sessionModel.create({
    user:user._id,
    refreshToken:refreshTokenHash,
    ip:req.ip,
    userAgent:req.headers["user-agent"] || "unknown"
  })
  const accessToken = jwt.sign({
    id:user._id,
    sessionID:session._id
  },
  config.JWT_SECRET,{
    expiresIn:"5m"
  })

  res.cookie("refreshToken", refreshToken, authCookieOptions(REFRESH_TOKEN_MAX_AGE))
  res.cookie("accessToken", accessToken, authCookieOptions(ACCESS_TOKEN_MAX_AGE))
}


export async function renderIndex(req,res) {
  try {
    const exams = await examModel.find();
    const dbUpdates = await updateModel.find().sort({ date: -1 }).limit(10);
    const testimonials = await testimonialModel.find();
    const quote = await quoteModel.findOne().sort({ createdAt: -1 });

    return res.render("index.ejs", {
      exams,
      updates: dbUpdates,
      testimonials,
      quote
    });
  } catch (error) {
    console.error("Error loading home page:", error);
    return res.status(500).send("Internal Server Error");
  }
}
export async function logout(req,res) {
  const refreshToken=req.cookies.refreshToken;
  if (refreshToken) {
    const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await sessionModel.updateMany({ refreshToken: hashedRefreshToken }, { revoked: true });
  }
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  req.flash("success","Logged Out!")
  res.redirect("/")
}
export async function login(req,res)
{

  res.render("login.ejs",{
    title:"login",
    tab:req.query.tab||"login"
  })
}
export async function loginUser(req,res) {
  let{email,password}=req.body;
  email = normalizeEmail(email);
  if (typeof password !== "string" || !password) {
    req.flash("error", "Enter your email and password.");
    return res.redirect("/auth/login");
  }
  let user = await userModel.findOne({
    email:email
  })

  if(!user)
  {
    req.flash("error","User is Not Registered");
   return res.redirect("/auth/login")
  }

  if(user && !user.verified)
  {
    req.flash("error","User is Not Registered");
   return res.redirect("/auth/login")

  }

    let isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    if (!isMatch) {
      const legacyHash = crypto.createHash("sha256").update(password).digest("hex");
      if (legacyHash === user.password) {
        isMatch = true;
        user.password = await bcrypt.hash(password, 12);
        await user.save();
      }
    }
    if (!isMatch) {
      req.flash("error", "Wrong Password");
      return res.redirect("/auth/login");
    }
await createUserSession(req, res, user);

return res.redirect("/dashboard")



}


export async function registerUser(req,res) {
  let {username,email,password,confirm}=req.body;
  username = String(username || "").trim();
  email = normalizeEmail(email);

  if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password) > 72) {
    req.flash("error", "Password must be at least 8 characters and at most 72 bytes.");
    return res.redirect("/auth/login");
  }

  if(password!=confirm)
  {
    req.flash("error","Enter Same Password")
    return res.redirect("/auth/login?tab=register")
  }
  
  let isAlreadyRegistered = await userModel.findOne({ email });

  if(isAlreadyRegistered && isAlreadyRegistered.verified )
  {
    req.flash("error","User Already Exist")
    return res.redirect("/auth/login?tab=register")
  }

  let hashedPassword = await bcrypt.hash(password, 12);
  const otp = generateOTP();
  let html = getOTPHTML(otp);


  try {
    await sendEmail(email,"OTP Verification","otp",html);
  } catch (error) {
    console.error("❌ Email transmission failed. (If deployed on Render Free Tier, note that outbound SMTP ports 25/465/587 are blocked by default):", error);
    req.flash("error","Unable to send OTP right now. Please try again later.");
    return res.redirect("/auth/login?tab=register");
  }
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
  if(isAlreadyRegistered)
  {
let userID = isAlreadyRegistered._id;

  const pupdt = await userModel.findByIdAndUpdate(userID,{
  password:hashedPassword
})

 await otpModel.findOneAndReplace(
   { email, purpose: "verify-email" },
   { email, purpose: "verify-email", user: userID, otpHash, createdAt: new Date() },
   { upsert: true }
 );

  }
  else{
  const user = await userModel.create({
    username,email,password:hashedPassword
  })

 await otpModel.findOneAndReplace(
   { email, purpose: "verify-email" },
   { email, purpose: "verify-email", user: user._id, otpHash, createdAt: new Date() },
   { upsert: true }
 );
  }




  



 
  req.flash("success","OTP sent Succesfully");
 return res.render("verify-email",{
    title:"login",
    tab:req.query.tab||"login",email
  })
}

export async function verifyEmail(req,res) {

  let {email,otpEntered}=req.body;
  email = normalizeEmail(email);
  const otpHash = crypto.createHash("sha256").update(typeof otpEntered === "string" ? otpEntered : "").digest("hex")
  const otpDoc = await otpModel.findOneAndDelete({
    email, otpHash, purpose: "verify-email",
    createdAt: { $gt: new Date(Date.now() - 600000) }
  });

  if(!otpDoc)
  {
    req.flash("error","Enter Valid OTP & Email")
    return res.render("verify-email",{
    title:"login",
    tab:req.query.tab||"login",email
  })


  }

  const user = await userModel.findByIdAndUpdate(otpDoc.user,{
    verified:true
  })
  await otpModel.deleteMany({
    user:otpDoc.user
  })
  req.flash("success","Welcome to Saarthi! Registered Successfully")
await createUserSession(req, res, user);

return res.redirect("/dashboard")



}

export async function renderForgotPassword(req,res) {

  res.render("forgot-password")
  
}

export async function forgotPassword(req,res) {
  
  let {email}=req.body;
  email = normalizeEmail(email);
  let user = await userModel.findOne({
   email: email
  })
  
  if(!user)
  {
    req.flash("error","Email Doesnt Exist")
    return res.redirect("/auth/login")
  }
  const otp = generateOTP();
  let html1 = getOTPHTMLForgot(otp);

  try {
    await sendEmail(email,"OTP Verification","otp",html1);
  } catch (error) {
    req.flash("error","Unable to send OTP right now. Please try again later.");
    return res.redirect("/auth/forgot-password");
  }
  
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
  await otpModel.findOneAndReplace(
    { email, purpose: "reset-password" },
    { email, purpose: "reset-password", user: user._id, otpHash, createdAt: new Date() },
    { upsert: true }
  );

  req.flash("success","OTP sent Succesfully");
  return res.render("reset-password",{
    title:"Reset Password",
    email
  })
}

export async function resetPassword(req, res) {
  let { email, otpEntered, password, confirm } = req.body;
  email = normalizeEmail(email);

  if (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password) > 72) {
    req.flash("error", "Password must be at least 8 characters and at most 72 bytes.");
    return res.redirect("/auth/login");
  }

  if (password !== confirm) {
    req.flash("error", "Passwords do not match");
    return res.render("reset-password", {
      title: "Reset Password",
      email
    });
  }

  const otpHash = crypto.createHash("sha256").update(typeof otpEntered === "string" ? otpEntered : "").digest("hex");
  const otpDoc = await otpModel.findOneAndDelete({
    email, otpHash, purpose: "reset-password",
    createdAt: { $gt: new Date(Date.now() - 600000) }
  });

  if (!otpDoc) {
    req.flash("error", "Invalid OTP or Email");
    return res.render("reset-password", {
      title: "Reset Password",
      email
    });
  }

  let hashedPassword = await bcrypt.hash(password, 12);
  await userModel.findByIdAndUpdate(otpDoc.user, {
    password: hashedPassword
  });

  await otpModel.deleteMany({
    user: otpDoc.user
  });

  await sessionModel.updateMany({ user: otpDoc.user }, { revoked: true });
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  req.flash("success", "Password reset successfully! Please login.");
  return res.redirect("/auth/login");
}

