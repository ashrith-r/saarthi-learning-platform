import config from "../config/config.js";
import sessionModel from "../models/session.js";
import userModel from "../models/user.js";
import crypto from "crypto"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

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

export async function loadUser(req,res,next) {
  const token = req.cookies.accessToken;
  let decoded
  try{
   decoded = jwt.verify(token,config.JWT_SECRET)
   if (!decoded.sessionID) return next();
   const activeSession = await sessionModel.findOne({
     _id: decoded.sessionID, user: decoded.id, revoked: false,
     createdAt: { $gt: new Date(Date.now() - REFRESH_TOKEN_MAX_AGE) }
   });
   if (!activeSession) return next();
   const user = await userModel.findById(decoded.id)
  if(user)
  {
    req.user = user;
    res.locals.user = user;
   return next();
  }

  }
  catch{
    // An expired access token may be renewed using a valid refresh session.
  }
  
  const refreshToken=req.cookies.refreshToken;
  if(!refreshToken)
  {
   return next();
  }
  let decRT
  try{
   decRT = jwt.verify(refreshToken,config.JWT_SECRET);
     const hashedRefreshToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const session = await sessionModel.findOne({
    refreshToken:hashedRefreshToken,
    user: decRT.id,
    createdAt: { $gt: new Date(Date.now() - REFRESH_TOKEN_MAX_AGE) },
    revoked:false
  });
  if(!session)
  {
   return next()
  }
  const accessToken = jwt.sign({
    id:decRT.id,
    sessionID:session._id
  },
config.JWT_SECRET,{
  expiresIn:"5m"
})
res.cookie("accessToken", accessToken, authCookieOptions(ACCESS_TOKEN_MAX_AGE))

const newRefreshToken = jwt.sign({
  id:decRT.id,
  jti: crypto.randomUUID()
},
config.JWT_SECRET,{
  expiresIn:"15d"
})

const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");
session.refreshToken=newRefreshTokenHash;
await session.save();
res.cookie("refreshToken", newRefreshToken, authCookieOptions(REFRESH_TOKEN_MAX_AGE))

  const user1 = await userModel.findById(decRT.id);
  if(!user1)
  {
   return next();
  }
  req.user = user1;
  res.locals.user = user1;

return next()


  }
  catch{
   return next()
  }
  
}

export async function requireAdmin(req,res,next) {
if(!req.user)
{
   req.flash("error","Login is Required")
   return res.redirect("/auth/login")
}

  if(!req.user.admin)
  {
    req.flash("error","Admin is Required")
return res.redirect(req.get("Referer") || "/");  }
  next();
}

export function requireContentEditor(req,res,next) {
  if (!req.user) return res.redirect('/auth/login');
  if (!req.user.admin && !req.user.editor) return res.status(403).send('Content editor access required.');
  next();
}

export async function requireLogin(req, res, next) {
  if (!req.user) {
    req.flash("error", "Login is Required");
    return res.redirect("/auth/login");
  }
  next();
}

export function validateObjectIdParam(paramName = "id") {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!mongoose.isValidObjectId(value)) {
      req.flash("error", "Invalid request.");
      return res.redirect(req.get("Referer") || "/");
    }
    next();
  };
}

export function requireSameOrigin(req, res, next) {
  const source = req.get("origin") || req.get("referer");
  const token = req.body?._csrf || req.get('x-csrf-token');
  const expected = req.session?.csrfToken;
  if (typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) && typeof expected === 'string' && token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return next();
  try {
    const sourceUrl = new URL(source);
    if (sourceUrl.origin !== req.protocol + "://" + req.get("host")) {
      return res.status(403).send("Invalid form submission.");
    }
  } catch {
    return res.status(403).send("Invalid form submission.");
  }
  next();
}
