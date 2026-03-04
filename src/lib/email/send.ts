interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return { success: false, error: "RESEND_API_KEY not set" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FundKita <noreply@fundkita.com>",
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorBody = (await response.text()) || "Unknown error";
      console.error("[email] Failed to send:", errorBody);
      return { success: false, error: errorBody };
    }

    const data = (await response.json()) as { id: string };
    return { success: true, id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[email] Failed to send:", message);
    return { success: false, error: message };
  }
}
