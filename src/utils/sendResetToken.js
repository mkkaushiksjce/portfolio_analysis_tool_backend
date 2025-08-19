// In production, plug in an email provider (SES, SendGrid, etc.)
export async function sendResetToken({ email, link }) {
  // For this starter, we just log the link so you can click it in dev logs
  console.log(`\n[Password Reset]\nTo: ${email}\nLink: ${link}\n`);
}