import SibApiV3Sdk from "sib-api-v3-sdk";
import config from "../config/config.js";

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = config.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async (to, subject, text, html) => {
  try {
    const result = await apiInstance.sendTransacEmail({
      sender: {
        name: "Saarthi",
        email: config.GOOGLE_USER,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      textContent: text,
      htmlContent: html,
    });

    console.log("Email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Brevo Error:", error.response?.body || error);
    throw error;
  }
};