import SibApiV3Sdk from "sib-api-v3-sdk";
import config from "../config/config.js";

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = config.BREVO_API_KEY;

export const emailClient = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async (to, subject, text, html) => {
  if (!config.BREVO_API_KEY || !config.GOOGLE_USER) {
    throw Object.assign(new Error('Email delivery is not configured.'), {code: 'PROVIDER_NOT_CONFIGURED'});
  }
  try {
    const result = await emailClient.sendTransacEmail({
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
    // Provider errors can include request headers, credentials and the OTP email body.
    console.error('Email delivery failed.', {status: Number(error.status || error.response?.status) || null});
    throw Object.assign(new Error('Email delivery failed. Please try again later.'), {code: 'EMAIL_DELIVERY_FAILED'});
  }
};
