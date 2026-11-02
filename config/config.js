import dotenv from "dotenv";
dotenv.config();
if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL is not defined")
}
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined")
}
const config = {


  MONGO_URL: process.env.MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  SESSION_SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
  GOOGLE_USER: process.env.GOOGLE_USER,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  CLOUD_API_KEY: process.env.CLOUD_API_KEY,
  CLOUD_API_SECRET: process.env.CLOUD_API_SECRET,
  CLOUD_NAME: process.env.CLOUD_NAME,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
}

export default config;
