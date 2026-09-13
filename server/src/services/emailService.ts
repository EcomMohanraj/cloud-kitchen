import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_resend_api_key')) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey.trim());
  }
  return resendClient;
}

export const sendPasswordResetEmail = async (
  email: string,
  otp: string,
  name?: string
): Promise<{ success: boolean; error?: string }> => {
  const resend = getResendClient();
  const isDevBypass = process.env.DEV_OTP_BYPASS === 'true' || !resend;

  console.log('\n' +
    '╔══════════════════════════════════════════════════════════════════╗\n' +
    `║  🔑 CUSTOMER FORGOT PASSWORD OTP: ${otp}                       ║\n` +
    `║     Target Email: ${email.padEnd(42)} ║\n` +
    '╚══════════════════════════════════════════════════════════════════╝\n'
  );

  if (!resend) {
    console.log('ℹ️  [Resend] RESEND_API_KEY is not configured. DEV_EMAIL_OTP_BYPASS is active (console OTP printed above).');
    return { success: true };
  }

  if (isDevBypass && process.env.NODE_ENV !== 'production') {
    console.log('ℹ️  [Resend] DEV_OTP_BYPASS=true is active. Console OTP printed above.');
    return { success: true };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || 'Yazhisai Gourmet <onboarding@resend.dev>';
    const data = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `${otp} is your Yazhisai Cloud Kitchen Password Reset Code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf8f5; margin: 0; padding: 20px; color: #0f172a; }
            .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #d1fae5; padding: 36px; box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.1); }
            .header { text-align: center; margin-bottom: 28px; }
            .logo { background: linear-gradient(135deg, #059669, #0d9488); color: white; display: inline-block; padding: 12px 24px; border-radius: 16px; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; }
            .badge { display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 6px 14px; border-radius: 20px; border: 1px solid #a7f3d0; margin-top: 16px; }
            h2 { color: #0f172a; font-size: 22px; font-weight: 900; margin-top: 20px; margin-bottom: 10px; text-align: center; }
            p { font-size: 14px; line-height: 1.6; color: #475569; text-align: center; margin: 8px 0; }
            .otp-box { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border: 2px dashed #059669; border-radius: 18px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #047857; margin: 0; font-family: monospace; }
            .expiry { font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">Yazhisai Gourmet</div>
              <br/>
              <span class="badge">Security & Password Reset</span>
            </div>
            <h2>Password Reset Verification</h2>
            <p>Hello ${name || 'Valued Patron'},</p>
            <p>We received a request to reset your password for your Yazhisai Cloud Kitchen customer account.</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="expiry">Valid for 10 minutes • Do not share this code</div>
            </div>
            <p>If you did not request a password reset, you can safely ignore this email. Your account remains completely secure.</p>
            <div class="footer">
              © ${new Date().getFullYear()} Yazhisai Gourmet Cloud Kitchen • Mettupalayam & Karamadai, Coimbatore
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (data.error) {
      console.error('❌ [Resend] API Error:', data.error);
      return { success: false, error: data.error.message };
    }

    console.log(`✅ [Resend] Password reset email dispatched successfully to ${email}. ID: ${data.data?.id}`);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Resend] Failed to dispatch email:', err);
    return { success: false, error: err.message || 'Failed to dispatch email' };
  }
};

export const sendOrderConfirmedEmail = async (order: any): Promise<{ success: boolean }> => {
  console.log(`📧 [emailService] sendOrderConfirmedEmail called for order ${order?.orderNumber || order?.id}`);
  return { success: true };
};

export const sendCodOrderConfirmedEmail = async (order: any): Promise<{ success: boolean }> => {
  console.log(`📧 [emailService] sendCodOrderConfirmedEmail called for order ${order?.orderNumber || order?.id}`);
  return { success: true };
};

export const sendOrderDeliveredEmail = async (order: any): Promise<{ success: boolean }> => {
  console.log(`📧 [emailService] sendOrderDeliveredEmail called for order ${order?.orderNumber || order?.id}`);
  return { success: true };
};
