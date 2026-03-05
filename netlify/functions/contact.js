import { getSql } from '../lib/db.js'
import { corsHeaders } from '../lib/cors.js'
import { sendEmail } from '../lib/email.js'

const CORS = corsHeaders('POST, OPTIONS')

/**
 * Format questionnaire answers into a readable HTML block for the coach email.
 */
function formatQuestionnaire(q) {
  if (!q) return ''

  const areas = [
    { label: 'Werk & Carrière', key: 'werk' },
    { label: 'Sociaal Leven', key: 'sociaal' },
    { label: 'Relatie & Familie', key: 'relatie' },
    { label: 'Financiën', key: 'financieel' },
    { label: 'Algemeen Geluk', key: 'geluk' },
    { label: 'Gezondheid', key: 'gezondheid' },
    { label: 'Praktische Zaken', key: 'praktisch' },
  ]

  const rows = areas
    .filter(a => q[a.key] !== undefined)
    .map(a => {
      const score = q[a.key]
      const color = score < 40 ? '#ef4444' : score < 60 ? '#f59e0b' : '#10b981'
      const flag = score < 60 ? ' ⚠️' : ''
      return `<tr>
        <td style="padding:4px 12px 4px 0;color:#374151">${a.label}${flag}</td>
        <td style="padding:4px 0;font-weight:bold;color:${color}">${score}%</td>
      </tr>`
    })
    .join('')

  const extras = []
  if (q.userGoal) extras.push(`<p><strong>Doel:</strong> ${q.userGoal}</p>`)
  if (q.userTimeline) extras.push(`<p><strong>Termijn:</strong> ${q.userTimeline}</p>`)
  if (q.preferredLocation) extras.push(`<p><strong>Locatie voorkeur:</strong> ${q.preferredLocation}</p>`)
  if (q.preferredPrice) extras.push(`<p><strong>Budget:</strong> tot €${q.preferredPrice} per sessie</p>`)

  return `
    <h3 style="color:#0ea5e9;margin-top:24px">Zelfinventarisatie</h3>
    <table style="border-collapse:collapse">${rows}</table>
    ${extras.join('')}
  `
}

/**
 * Build the HTML email sent to the coach when a new lead comes in.
 */
function coachEmailHtml({ lead, coach }) {
  const sessionLabels = {
    intake: 'Vrijblijvend kennismakingsgesprek',
    regular: 'Enkele sessie',
    package: 'Pakket van meerdere sessies',
  }

  return `
  <!DOCTYPE html>
  <html lang="nl">
  <head><meta charset="utf-8"></head>
  <body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;padding:24px">
    <div style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:16px;padding:24px;margin-bottom:24px">
      <h1 style="color:white;margin:0;font-size:24px">Nieuwe coachaanvraag!</h1>
      <p style="color:#bae6fd;margin:8px 0 0">Via CoachFinder — geluk.tnxz.nl</p>
    </div>

    <p>Hallo ${coach.name},</p>
    <p>Je hebt een nieuwe aanvraag ontvangen van iemand die op zoek is naar coaching. Hier zijn de details:</p>

    <div style="background:#f0f9ff;border-radius:12px;padding:20px;margin:20px 0">
      <h2 style="color:#0ea5e9;margin:0 0 16px">Contactgegevens</h2>
      <p style="margin:4px 0"><strong>Naam:</strong> ${lead.user_name}</p>
      <p style="margin:4px 0"><strong>E-mail:</strong> <a href="mailto:${lead.user_email}">${lead.user_email}</a></p>
      ${lead.user_phone ? `<p style="margin:4px 0"><strong>Telefoon:</strong> ${lead.user_phone}</p>` : ''}
      ${lead.session_type ? `<p style="margin:4px 0"><strong>Type sessie:</strong> ${sessionLabels[lead.session_type] || lead.session_type}</p>` : ''}
      ${lead.preferred_date ? `<p style="margin:4px 0"><strong>Voorkeursdatum:</strong> ${lead.preferred_date}</p>` : ''}
    </div>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0">
      <h2 style="color:#374151;margin:0 0 12px">Bericht</h2>
      <p style="white-space:pre-wrap;color:#4b5563">${lead.message || '(geen bericht)'}</p>
    </div>

    ${lead.questionnaire ? `
    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:20px 0">
      ${formatQuestionnaire(lead.questionnaire)}
    </div>` : ''}

    <div style="background:#fffbeb;border:2px solid #fcd34d;border-radius:12px;padding:20px;margin:24px 0">
      <p style="margin:0;font-weight:bold;color:#92400e">Belangrijk</p>
      <p style="margin:8px 0 0;color:#78350f">
        Als deze persoon een coachingstraject bij jou start, ontvang je een factuur van <strong>€25</strong> van CoachFinder.
        Neem contact op met <strong>${lead.user_email}</strong> om een kennismakingsgesprek in te plannen.
      </p>
    </div>

    <p style="color:#9ca3af;font-size:12px;margin-top:32px">
      Aanvraagnummer: ${lead.lead_token}<br>
      CoachFinder — geluk.tnxz.nl
    </p>
  </body>
  </html>
  `
}

/**
 * Build the HTML confirmation email sent to the user after submitting a request.
 */
function userConfirmationHtml({ lead, coachName }) {
  return `
  <!DOCTYPE html>
  <html lang="nl">
  <head><meta charset="utf-8"></head>
  <body style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;padding:24px">
    <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;padding:24px;margin-bottom:24px;text-align:center">
      <div style="font-size:48px;margin-bottom:8px">✓</div>
      <h1 style="color:white;margin:0;font-size:24px">Je aanvraag is verstuurd!</h1>
    </div>

    <p>Hallo ${lead.user_name},</p>
    <p>
      Je aanvraag bij <strong>${coachName}</strong> is succesvol ontvangen.
      ${coachName.split(' ')[0]} neemt zo snel mogelijk contact met je op via <strong>${lead.user_email}</strong>.
    </p>

    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0;color:#166534"><strong>Jouw aanvraagnummer:</strong></p>
      <p style="font-family:monospace;color:#0ea5e9;font-size:14px;margin:8px 0 0">${lead.lead_token}</p>
    </div>

    <h3>Wat gebeurt er nu?</h3>
    <ol style="color:#374151;line-height:1.8">
      <li>De coach bekijkt jouw aanvraag en context</li>
      <li>Je ontvangt een reactie om een kennismakingsgesprek in te plannen</li>
      <li>Jullie bepalen samen of het een goede match is</li>
    </ol>

    <p style="color:#9ca3af;font-size:12px;margin-top:32px">
      CoachFinder — geluk.tnxz.nl<br>
      Je ontvangt dit bericht omdat je een aanvraag hebt ingediend via ons platform.
    </p>
  </body>
  </html>
  `
}

export default async (request) => {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS,
    })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: CORS,
    })
  }

  const { coachId, userName, userEmail, userPhone, sessionType, preferredDate, message, questionnaire } = body

  // Basic validation
  if (!userName || !userEmail || !coachId) {
    return new Response(JSON.stringify({ error: 'userName, userEmail and coachId are required' }), {
      status: 400,
      headers: CORS,
    })
  }

  const sql = getSql()

  try {
    // Fetch coach details (name + email for notification)
    const coaches = await sql`
      SELECT id, name, email FROM coaches WHERE id = ${parseInt(coachId, 10)} AND active = TRUE LIMIT 1
    `

    if (coaches.length === 0) {
      return new Response(JSON.stringify({ error: 'Coach not found' }), {
        status: 404,
        headers: CORS,
      })
    }

    const coach = coaches[0]

    // Insert lead into DB
    const leads = await sql`
      INSERT INTO leads (
        user_name, user_email, user_phone,
        coach_id, coach_name,
        session_type, preferred_date, message, questionnaire
      ) VALUES (
        ${userName}, ${userEmail}, ${userPhone || null},
        ${parseInt(coachId, 10)}, ${coach.name},
        ${sessionType || null},
        ${preferredDate || null},
        ${message || null},
        ${questionnaire ? JSON.stringify(questionnaire) : null}
      )
      RETURNING id, lead_token
    `

    const lead = {
      ...leads[0],
      user_name: userName,
      user_email: userEmail,
      user_phone: userPhone,
      session_type: sessionType,
      preferred_date: preferredDate,
      message,
      questionnaire,
    }

    // Email the coach (non-blocking — failure doesn't break the response)
    if (coach.email) {
      await sendEmail({
        to: coach.email,
        subject: `Nieuwe coachaanvraag van ${userName}`,
        html: coachEmailHtml({ lead, coach }),
      }, '[contact]')
    } else {
      console.warn(`[contact] Coach ${coach.id} has no email — skipping coach notification`)
    }

    // Confirmation email to user
    await sendEmail({
      to: userEmail,
      subject: 'Je coachingaanvraag is ontvangen!',
      html: userConfirmationHtml({ lead, coachName: coach.name }),
    }, '[contact]')

    return new Response(
      JSON.stringify({ success: true, leadId: lead.id, leadToken: lead.lead_token }),
      { status: 201, headers: CORS }
    )
  } catch (err) {
    console.error('[contact] error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS,
    })
  }
}

export const config = {
  path: '/api/contact',
}
