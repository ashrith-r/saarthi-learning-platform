import { randomInt } from "node:crypto";

export function generateOTP()
{
  return randomInt(100000, 1000000).toString();
}
export function getOTPHTML(otp){
return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr>
    <td align="center">

      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        
        <!-- Header -->
        <tr>
          <td align="center" style="background:#2563eb;padding:30px;">
            <h1 style="color:#ffffff;margin:0;">Email Verification</h1>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px 30px;">
            <h2 style="margin-top:0;color:#333333;">
              Hello 
            </h2>

            <p style="font-size:16px;line-height:1.6;color:#555555;">
              Thank you for signing up. Use the following One-Time Password (OTP) to verify your email address.
            </p>

            <!-- OTP Box -->
            <div style="text-align:center;margin:35px 0;">
              <span style="
                display:inline-block;
                background:#eff6ff;
                color:#2563eb;
                font-size:36px;
                font-weight:bold;
                letter-spacing:8px;
                padding:18px 32px;
                border-radius:10px;
                border:2px dashed #2563eb;
              ">
                ${otp}
              </span>
            </div>

            <p style="font-size:15px;color:#555555;">
              This OTP is valid for <strong>10 minutes</strong>.
            </p>

            <p style="font-size:15px;color:#555555;">
              If you did not request this verification, please ignore this email.
            </p>

            <p style="font-size:15px;color:#555555;">
              Regards,<br>
              <strong>Saarthi</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background:#f8fafc;padding:20px;">
            <p style="margin:0;font-size:13px;color:#888888;">
              Â© 2026 Saarthi. All rights reserved.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`
}

export function getOTPHTMLForgot(otp) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Password Reset OTP</title>
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
  <tr>
    <td align="center">

      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td align="center" style="background:#dc2626;padding:30px;">
            <h1 style="margin:0;color:#ffffff;">
              Password Reset Request
            </h1>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px 30px;">

            <h2 style="margin-top:0;color:#333;">
              Hello 👋
            </h2>

            <p style="font-size:16px;line-height:1.6;color:#555;">
              We received a request to reset the password for your
              <strong>Saarthi</strong> account.
            </p>

            <p style="font-size:16px;line-height:1.6;color:#555;">
              Please use the following One-Time Password (OTP) to verify your
              identity and continue resetting your password.
            </p>

            <!-- OTP -->
            <div style="text-align:center;margin:35px 0;">
              <span style="
                display:inline-block;
                background:#fef2f2;
                color:#dc2626;
                font-size:36px;
                font-weight:bold;
                letter-spacing:8px;
                padding:18px 32px;
                border-radius:10px;
                border:2px dashed #dc2626;
              ">
                ${otp}
              </span>
            </div>

            <p style="font-size:15px;color:#555;">
              This OTP is valid for <strong>10 minutes</strong>.
            </p>

            <p style="font-size:15px;color:#555;">
              <strong>Security Tip:</strong> Never share this OTP with anyone.
              Saarthi will never ask for your OTP through phone calls, emails,
              or messages.
            </p>

            <p style="font-size:15px;color:#555;">
              If you did not request a password reset, you can safely ignore
              this email. Your account will remain secure.
            </p>

            <p style="font-size:15px;color:#555;">
              Regards,<br>
              <strong>Team Saarthi</strong>
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background:#f8fafc;padding:20px;">
            <p style="margin:0;font-size:13px;color:#888;">
              © 2026 Saarthi. All rights reserved.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}