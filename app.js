import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import Settings from "./models/siteSettings.js";
import express from "express";
import methodOverride from "method-override";
import flash from "connect-flash"
import MongoStore from "connect-mongo";
import { rateLimit } from "express-rate-limit";
import session from "express-session";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import ejsMate from "ejs-mate"
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth_routes.js"
import Route from "./routes/render_index.js";
import config from "./config/config.js";
const app = express();
import { loadUser } from "./middleware/middleware.js";
import studyRoute from "./routes/studyRoutes.js";
import adminRoute from "./routes/adminRoutes.js"


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine("ejs", ejsMate)
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(compression());
if (config.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: config.SESSION_SECRET,
  ...(config.NODE_ENV === "production" ? { store: MongoStore.create({ mongoUrl: config.MONGO_URL }) } : {}),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax"
  }
}));
app.use(flash())
app.use(cookieParser())
app.use((req, res, next) => {
  req.session.csrfToken ||= randomBytes(32).toString("hex");
  res.locals.csrfToken = req.session.csrfToken;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = null;
  let timeZone=req.cookies.studyTimeZone||'UTC';
  try{if(typeof timeZone!=='string'||timeZone.length>100)throw new Error('Invalid timezone');new Intl.DateTimeFormat('en',{timeZone}).format();}catch{timeZone='UTC';}
  res.locals.timeZone=timeZone;
  const dateParts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  res.locals.today=`${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  res.locals.title = "Saarthi";
  res.locals.workspace = /^\/(admin|subject|content|quiz)(?:\/|$)/.test(req.path);
  res.locals.active = req.path.startsWith('/admin/material')?'materials':req.path.startsWith('/admin/publishing')?'publishing':req.path.startsWith('/admin')?'admin':'library';
  next();
})
app.use(loadUser);
app.use((req,res,next)=>{
 const send=res.send.bind(res);let rendering=false;
 res.send=function(body){if(!rendering&&res.statusCode>=400&&typeof body==='string'&&!String(res.getHeader('Content-Type')).includes('json')){rendering=true;return res.render('error',{status:res.statusCode,message:body.replace(/<[^>]*>/g,'')});}return send(body);};next();
});
app.use(async (req,res,next)=>{
 try { res.locals.site = mongoose.connection.readyState===1 ? await Settings.findOne({key:'main'}).lean() : null;
 res.locals.site ||= new Settings().toObject();
 if(res.locals.title==="Saarthi")res.locals.title=res.locals.site.name;
 if(req.path.startsWith('/admin') && !['GET','HEAD','OPTIONS'].includes(req.method)) res.on('finish',()=>{if(res.statusCode<400 && mongoose.connection.readyState===1)Settings.findOneAndUpdate({key:'main'},{$inc:{revision:1}},{upsert:true}).catch(error=>console.error('Content revision failed:',error.message));});
 next(); } catch(error){next(error);}
});
app.get('/api/content-version', (req,res)=>res.json({revision:res.locals.site.revision||0}));
app.get("/health", (req,res)=>res.json({status:"ok"}));
app.use("/auth", rateLimit({windowMs:15*60*1000,limit:100,standardHeaders:"draft-8",legacyHeaders:false}), authRouter)
app.use(studyRoute);
app.use("/", Route)
app.use("/admin", adminRoute)

app.use((req, res) => {
  res.status(404).render("404", {
    title: "Page Not Found"
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  const bad=err.name==='ValidationError'||err.name==='CastError'||err.name==='MulterError'||err.message==='Only JPEG, PNG and WebP images are supported.';
  const unavailable=err.code==='PROVIDER_NOT_CONFIGURED';
  res.status(unavailable?503:bad?400:500).send(unavailable?err.message:bad?'Check the required fields and file limits, then try again.':'The request could not be completed. Please try again.');
});

export default app;
