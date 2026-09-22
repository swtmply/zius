const VERIFICATION_EMAIL_FROM = "Zius <noreply@tryzius.com>";

export async function sendVerificationEmail({
  apiKey,
  email,
  url,
}: {
  apiKey: string;
  email: string;
  url: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: VERIFICATION_EMAIL_FROM,
      to: email,
      subject: "Verify your Zius email",
      text: `Verify your email to finish creating your Zius account:\n\n${url}\n\nThis link expires in one hour.`,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the verification email (${response.status})`);
  }
}
