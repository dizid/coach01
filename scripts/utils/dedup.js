import { sql } from './db.js';

/**
 * Multi-level duplicate detection.
 * Checks in priority order:
 *   1. google_place_id (exact match)
 *   2. name + city (case-insensitive)
 *   3. website (normalized URL)
 *   4. phone (digits only)
 *
 * @param {{ google_place_id?: string, name?: string, city?: string, website?: string, phone?: string }} coach
 * @returns {Promise<number|null>} existing coach ID or null if no duplicate found
 */
export async function findDuplicate(coach) {
  // 1. Google Place ID — most reliable identifier
  if (coach.google_place_id) {
    const rows = await sql`
      SELECT id FROM coaches WHERE google_place_id = ${coach.google_place_id} LIMIT 1
    `;
    if (rows.length > 0) return rows[0].id;
  }

  // 2. Name + city — normalized comparison
  if (coach.name && coach.city) {
    const rows = await sql`
      SELECT id FROM coaches
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(${coach.name}))
        AND LOWER(TRIM(city)) = LOWER(TRIM(${coach.city}))
      LIMIT 1
    `;
    if (rows.length > 0) return rows[0].id;
  }

  // 3. Website — strip protocol and trailing slash for comparison
  if (coach.website) {
    const normalizedWebsite = normalizeWebsite(coach.website);
    if (normalizedWebsite) {
      const rows = await sql`
        SELECT id FROM coaches
        WHERE LOWER(TRIM(TRAILING '/' FROM REPLACE(REPLACE(website, 'https://', ''), 'http://', '')))
          = ${normalizedWebsite}
        LIMIT 1
      `;
      if (rows.length > 0) return rows[0].id;
    }
  }

  // 4. Phone — digits only comparison
  if (coach.phone) {
    const normalizedPhone = normalizePhone(coach.phone);
    if (normalizedPhone.length >= 9) {
      const rows = await sql`
        SELECT id FROM coaches
        WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = ${normalizedPhone}
        LIMIT 1
      `;
      if (rows.length > 0) return rows[0].id;
    }
  }

  return null;
}

/**
 * Strip protocol and trailing slash from a URL for normalized comparison.
 * @param {string} url
 * @returns {string}
 */
function normalizeWebsite(url) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return (parsed.hostname + parsed.pathname).toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

/**
 * Strip all non-digit characters from a phone number.
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  return phone.replace(/[^0-9]/g, '');
}
