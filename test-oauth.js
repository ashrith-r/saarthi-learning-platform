import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

try {
  await oauth2Client.getAccessToken();
  console.log("OAuth credentials verified successfully.");
} catch (err) {
  console.error("❌ Error:", err);
}