import { Resend } from "resend";

interface SendQuoteEmailParams {
  to: string;
  projectTitle: string;
  publicUrl: string;
  companyName: string;
}

export async function sendQuoteEmail({
  to,
  projectTitle,
  publicUrl,
  companyName,
}: SendQuoteEmailParams): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!apiKey) {
    return {
      success: false,
      error: "RESEND_API_KEY is not configured. Add it to .env.local.",
    };
  }

  const resend = new Resend(apiKey);

  const subject = `Quote: ${projectTitle}`;

  const text = `Hi,

Please find your quote below:
${publicUrl}

You can review and accept it directly online.

Kind regards,
${companyName}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #111;">
      <p>Hi,</p>
      <p>Please find your quote below:</p>
      <p style="margin: 24px 0;">
        <a href="${publicUrl}" style="display: inline-block; background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          View Quote
        </a>
      </p>
      <p style="color: #555; font-size: 14px;">Or open this link: <a href="${publicUrl}">${publicUrl}</a></p>
      <p>You can review and accept it directly online.</p>
      <p>Kind regards,<br/><strong>${companyName}</strong></p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `${companyName} <${fromEmail}>`,
      to: [to],
      subject,
      text,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
