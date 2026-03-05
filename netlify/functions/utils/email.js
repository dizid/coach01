/**
 * Send an email via Resend REST API.
 * Returns true on success, false on failure (logs but doesn't throw).
 * @param {string} prefix - Log prefix for identifying the caller (e.g. '[contact]')
 */
export async function sendEmail({ to, subject, html }, prefix = '[email]') {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(`${prefix} RESEND_API_KEY not set — skipping email send`)
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CoachFinder <noreply@geluk.tnxz.nl>',
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`${prefix} Resend error:`, err)
      return false
    }
    return true
  } catch (err) {
    console.error(`${prefix} Failed to send email:`, err)
    return false
  }
}
