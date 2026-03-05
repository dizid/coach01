import { getSql } from '../lib/db.js'
import { sendEmail } from '../lib/email.js'

/**
 * Build the 14-day follow-up email.
 * Includes two tracking links — user clicks "Ja" or "Nee".
 */
function followUpHtml({ lead, baseUrl }) {
  const yesUrl = `${baseUrl}/api/confirm-lead?token=${lead.lead_token}&started=true`
  const noUrl  = `${baseUrl}/api/confirm-lead?token=${lead.lead_token}&started=false`

  return `
  <!DOCTYPE html>
  <html lang="nl">
  <head><meta charset="utf-8"></head>
  <body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;padding:24px">
    <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:16px;padding:24px;margin-bottom:24px">
      <h1 style="color:white;margin:0;font-size:22px">Hoe gaat het met je coaching?</h1>
    </div>

    <p>Hallo ${lead.user_name},</p>
    <p>
      Twee weken geleden nam je contact op met <strong>${lead.coach_name}</strong> via CoachFinder.
      We zijn benieuwd: ben je al gestart met coaching?
    </p>

    <div style="text-align:center;margin:32px 0">
      <a href="${yesUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;margin:0 8px">
        Ja, ik ben gestart! 🎉
      </a>
      <a href="${noUrl}" style="display:inline-block;background:#f3f4f6;color:#374151;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;margin:0 8px;margin-top:12px">
        Nee, nog niet
      </a>
    </div>

    <p style="color:#6b7280;font-size:14px">
      Jouw feedback helpt ons om CoachFinder te verbeteren en coaches beter te matchen.
      Het klikken op een link duurt minder dan een seconde!
    </p>

    <p style="color:#9ca3af;font-size:12px;margin-top:32px">
      CoachFinder — geluk.tnxz.nl<br>
      Aanvraagnummer: ${lead.lead_token}
    </p>
  </body>
  </html>
  `
}

/**
 * Scheduled function: runs daily at 09:00 UTC.
 * Finds leads due for follow-up and sends reminder emails.
 */
export default async () => {
  const sql = getSql()
  const baseUrl = process.env.URL || 'https://geluk.tnxz.nl'

  try {
    // Find leads that are due for follow-up and haven't been sent yet
    const leads = await sql`
      SELECT id, lead_token, user_name, user_email, coach_name
      FROM leads
      WHERE follow_up_at <= NOW()
        AND follow_up_sent_at IS NULL
        AND status = 'submitted'
      LIMIT 100
    `

    console.log(`[follow-up] Found ${leads.length} lead(s) due for follow-up`)

    let sent = 0
    for (const lead of leads) {
      const ok = await sendEmail({
        to: lead.user_email,
        subject: `Heb je al coaching gestart met ${lead.coach_name}?`,
        html: followUpHtml({ lead, baseUrl }),
      }, '[follow-up]')

      if (ok) {
        // Mark as sent
        await sql`
          UPDATE leads SET follow_up_sent_at = NOW() WHERE id = ${lead.id}
        `
        sent++
      }
    }

    console.log(`[follow-up] Sent ${sent}/${leads.length} follow-up emails`)
  } catch (err) {
    console.error('[follow-up] Fatal error:', err)
    throw err
  }
}

export const config = {
  schedule: '0 9 * * *',
}
