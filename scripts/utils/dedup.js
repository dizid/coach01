import { sql } from './db.js';
import { normalizeName } from './normalize.js';

/**
 * Multi-level duplicate detection (6 levels).
 * Checks in priority order:
 *   1. google_place_id (exact match)
 *   2. kvk_number (exact match)
 *   3. email (case-insensitive)
 *   4. name + city (fuzzy — normalized name comparison)
 *   5. website (normalized URL)
 *   6. phone (digits only)
 *
 * @param {{ google_place_id?: string, kvk_number?: string, email?: string, name?: string, city?: string, website?: string, phone?: string }} coach
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

  // 2. KvK number — official business registration
  if (coach.kvk_number) {
    const rows = await sql`
      SELECT id FROM coaches WHERE kvk_number = ${coach.kvk_number} LIMIT 1
    `;
    if (rows.length > 0) return rows[0].id;
  }

  // 3. Email — unique per business
  if (coach.email) {
    const rows = await sql`
      SELECT id FROM coaches WHERE LOWER(email) = LOWER(${coach.email}) LIMIT 1
    `;
    if (rows.length > 0) return rows[0].id;
  }

  // 4. Name + city — fuzzy comparison using normalized names
  if (coach.name && coach.city) {
    const normalized = normalizeName(coach.name);
    if (normalized.length >= 3) {
      // First try the name_normalized column if populated
      const rows = await sql`
        SELECT id FROM coaches
        WHERE name_normalized = ${normalized}
          AND LOWER(TRIM(city)) = LOWER(TRIM(${coach.city}))
        LIMIT 1
      `;
      if (rows.length > 0) return rows[0].id;

      // Fallback: exact name + city match (for records without name_normalized yet)
      const rows2 = await sql`
        SELECT id FROM coaches
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(${coach.name}))
          AND LOWER(TRIM(city)) = LOWER(TRIM(${coach.city}))
        LIMIT 1
      `;
      if (rows2.length > 0) return rows2[0].id;
    }
  }

  // 5. Website — strip protocol and trailing slash for comparison
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

  // 6. Phone — digits only comparison
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
 * Merge data from a new source into an existing coach record.
 * Only fills NULL/empty fields — never overwrites existing data.
 * Appends source to data_sources array if not already present.
 *
 * @param {number} existingId - The ID of the existing coach record
 * @param {Object} newData - New data fields to merge
 * @param {string} source - Source identifier (e.g. 'kvk', 'vind_een_coach')
 */
export async function mergeCoachData(existingId, newData, source) {
  // Build SET clauses for non-empty new data, only filling NULLs
  await sql`
    UPDATE coaches SET
      bio            = COALESCE(NULLIF(bio, ''), NULLIF(${newData.bio || ''}, '')),
      website        = COALESCE(website, NULLIF(${newData.website || ''}, '')),
      email          = COALESCE(email, NULLIF(${newData.email || ''}, '')),
      phone          = COALESCE(phone, NULLIF(${newData.phone || ''}, '')),
      kvk_number     = COALESCE(kvk_number, NULLIF(${newData.kvk_number || ''}, '')),
      sbi_code       = COALESCE(sbi_code, NULLIF(${newData.sbi_code || ''}, '')),
      province       = COALESCE(NULLIF(province, ''), NULLIF(${newData.province || ''}, '')),
      location       = COALESCE(NULLIF(location, ''), NULLIF(${newData.location || ''}, '')),
      city           = COALESCE(NULLIF(city, ''), NULLIF(${newData.city || ''}, '')),
      source_url     = COALESCE(source_url, NULLIF(${newData.source_url || ''}, '')),
      data_sources   = CASE
        WHEN ${source} = ANY(data_sources) THEN data_sources
        ELSE array_append(data_sources, ${source})
      END,
      name_normalized = COALESCE(name_normalized, NULLIF(${newData.name_normalized || ''}, '')),
      updated_at     = NOW()
    WHERE id = ${existingId}
  `;
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
