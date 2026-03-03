// Email sending utility using Resend
// Requires: pnpm add resend
//
// import { Resend } from "resend";
//
// const resend = new Resend(process.env.RESEND_API_KEY);
//
// interface SendEmailOptions {
//   to: string | string[];
//   subject: string;
//   html: string;
//   from?: string;
// }
//
// export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
//   if (!process.env.RESEND_API_KEY) {
//     console.warn("[email] RESEND_API_KEY not set — skipping email send");
//     return null;
//   }
//
//   const { data, error } = await resend.emails.send({
//     from: from ?? "My App <noreply@yourdomain.com>",
//     to: Array.isArray(to) ? to : [to],
//     subject,
//     html,
//   });
//
//   if (error) {
//     console.error("[email] Failed to send:", error);
//     throw error;
//   }
//
//   return data;
// }
