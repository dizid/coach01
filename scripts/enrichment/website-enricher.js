import 'dotenv/config';
import * as cheerio from 'cheerio';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeSpecialties } from '../utils/normalize.js';

const USER_AGENT = 'CoachFinder Bot 1.0 (educational/research - contact: info@dizid.nl)';
// Polite rate limit: 1 request per 3 seconds
const REQUEST_DELAY_MS = 3000;
// Timeout for website fetches
const FETCH_TIMEOUT_MS = 10000;

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with a timeout and polite headers.
 * @param {string} url
 * @returns {Promise<string>} HTML text
 */
async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchIPv4(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract bio text from a coaching website.
 * Looks near "over mij", "about", or "wie ben ik" headings,
 * falling back to the meta description.
 * @param {CheerioAPI} $
 * @returns {string}
 */
function extractBio($) {
  let bio = '';

  // Check headings for over mij / about / werkwijze
  const bioKeywords = ['over mij', 'over ons', 'about', 'wie ben ik', 'wie zijn wij', 'werkwijze'];
  $('h1, h2, h3, h4').each((_, el) => {
    const headingText = $(el).text().toLowerCase().trim();
    if (bioKeywords.some((kw) => headingText.includes(kw))) {
      // Grab the next sibling paragraphs/divs
      let text = '';
      $(el).nextAll('p, div').slice(0, 3).each((__, sib) => {
        text += ' ' + $(sib).text().trim();
      });
      if (text.trim().length > bio.length) bio = text.trim();
    }
  });

  // Fallback: meta description
  if (bio.length < 50) {
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    if (metaDesc.length > bio.length) bio = metaDesc;
  }

  // Fallback: first substantial paragraph
  if (bio.length < 50) {
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 100 && text.length > bio.length) {
        bio = text;
        return false; // break
      }
    });
  }

  return bio.slice(0, 2000);
}

/**
 * Extract pricing information from the page.
 * Looks for euro amounts near price-related Dutch keywords.
 * @param {CheerioAPI} $
 * @param {string} fullText
 * @returns {{ price: number|null, price_type: string }}
 */
function extractPrice($, fullText) {
  const priceKeywords = ['tarief', 'prijs', 'kosten', 'investering', 'sessie', 'per uur', 'per sessie'];

  // Search page text for euro amounts near price keywords
  for (const keyword of priceKeywords) {
    const keywordIdx = fullText.toLowerCase().indexOf(keyword);
    if (keywordIdx === -1) continue;

    // Check 200 chars around the keyword for a euro amount
    const context = fullText.slice(Math.max(0, keywordIdx - 50), keywordIdx + 200);
    const euroMatch = context.match(/€\s*(\d+(?:[.,]\d+)?)/);
    if (euroMatch) {
      const rawPrice = parseFloat(euroMatch[1].replace(',', '.'));
      if (rawPrice > 0 && rawPrice < 10000) {
        // Determine price_type from context
        const ctxLower = context.toLowerCase();
        let price_type = 'per sessie';
        if (ctxLower.includes('per uur') || ctxLower.includes('/uur')) {
          price_type = 'per uur';
        } else if (ctxLower.includes('per maand')) {
          price_type = 'per maand';
        } else if (ctxLower.includes('traject') || ctxLower.includes('programma')) {
          price_type = 'per traject';
        }
        return { price: Math.round(rawPrice), price_type };
      }
    }
  }

  return { price: null, price_type: 'per sessie' };
}

/**
 * Extract coaching specialties from page content via keyword matching.
 * @param {string} fullText
 * @returns {string[]} normalized specialty slugs
 */
function extractSpecialties(fullText) {
  const text = fullText.toLowerCase();

  // Raw terms to check for on the website
  const termChecks = [
    'life coach', 'loopbaancoach', 'burnout coach', 'relatiecoach',
    'executive coach', 'mindfulness coach', 'health coach', 'carriere coach',
    'persoonlijke coach', 'mental coach', 'stresscoach', 'gezondheidscoach',
    'business coach', 'nlp coach', 'personal coach', 'career coach',
    'loopbaan', 'burnout', 'burn-out', 'stress', 'relatie', 'mindfulness',
    'leiderschap', 'persoonlijke groei', 'zelfvertrouwen', 'angst',
    'gezondheid', 'lifestyle', 'timemanagement', 'productiviteit',
    'communicatie', 'ondernemerschap', 'financieel', 'balans',
  ];

  const found = termChecks.filter((term) => text.includes(term));
  return normalizeSpecialties(found);
}

/**
 * Extract languages the coach offers sessions in.
 * @param {string} fullText
 * @returns {string[]}
 */
function extractLanguages(fullText) {
  const text = fullText.toLowerCase();
  const languages = [];

  if (text.includes('nederlands') || text.includes('dutch')) languages.push('Nederlands');
  if (text.includes('engels') || text.includes('english')) languages.push('Engels');
  if (text.includes('duits') || text.includes('german')) languages.push('Duits');
  if (text.includes('frans') || text.includes('french')) languages.push('Frans');
  if (text.includes('spaans') || text.includes('spanish')) languages.push('Spaans');

  // Default to Dutch if nothing found
  return languages.length > 0 ? languages : ['Nederlands'];
}

/**
 * Extract email addresses from the page.
 * Checks mailto: links first, then falls back to regex on text.
 * @param {CheerioAPI} $
 * @param {string} fullText
 * @returns {string|null}
 */
function extractEmail($, fullText) {
  // mailto: links are most reliable
  let email = null;
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      email = href.replace('mailto:', '').split('?')[0].trim();
      return false; // break
    }
  });

  if (email) return email;

  // Regex fallback on visible text
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : null;
}

/**
 * Extract certifications from the page.
 * @param {CheerioAPI} $
 * @returns {string[]}
 */
function extractCertifications($) {
  const certifications = [];
  const certKeywords = ['icf', 'noloc', 'nobco', 'emcc', 'nvp', 'nip', 'certified', 'gecertificeerd', 'register', 'accreditatie'];

  $('[class*="certif"], [class*="opleiding"], [class*="accredit"], [class*="keurmerk"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) certifications.push(text.slice(0, 100));
  });

  // Also scan for certification mentions in text
  $('p, li').each((_, el) => {
    const text = $(el).text().toLowerCase().trim();
    if (certKeywords.some((kw) => text.includes(kw)) && text.length < 200) {
      certifications.push($(el).text().trim().slice(0, 100));
    }
  });

  // Deduplicate
  return [...new Set(certifications)].slice(0, 10);
}

/**
 * Enrich a single coach record by visiting their website.
 * @param {{ id: number, website: string, name: string }} coach
 * @returns {Promise<boolean>} true if enriched successfully
 */
async function enrichCoach(coach) {
  let html;
  try {
    html = await fetchWithTimeout(coach.website);
  } catch (err) {
    console.error(`  [${coach.name}] Fetch failed: ${err.message}`);
    // Mark as enriched anyway to avoid retrying permanently broken URLs
    await sql`UPDATE coaches SET enriched = TRUE, updated_at = NOW() WHERE id = ${coach.id}`;
    return false;
  }

  const $ = cheerio.load(html);
  const fullText = $('body').text().replace(/\s+/g, ' ').trim();

  const bio = extractBio($);
  const { price, price_type } = extractPrice($, fullText);
  const specialties = extractSpecialties(fullText);
  const languages = extractLanguages(fullText);
  const email = extractEmail($, fullText);
  const certifications = extractCertifications($);

  // Update enriched flag first
  await sql`UPDATE coaches SET enriched = TRUE, updated_at = NOW() WHERE id = ${coach.id}`;

  // Only update fields that have values — don't overwrite existing good data with empty
  if (bio) {
    await sql`UPDATE coaches SET bio = ${bio} WHERE id = ${coach.id} AND (bio IS NULL OR bio = '')`;
  }
  if (price != null) {
    await sql`UPDATE coaches SET price = ${price}, price_type = ${price_type} WHERE id = ${coach.id} AND price IS NULL`;
  }
  if (specialties.length > 0) {
    await sql`UPDATE coaches SET specialties = ${specialties} WHERE id = ${coach.id} AND array_length(specialties, 1) IS NULL`;
  }
  if (languages.length > 0) {
    await sql`UPDATE coaches SET languages = ${languages} WHERE id = ${coach.id}`;
  }
  if (email) {
    await sql`UPDATE coaches SET email = ${email} WHERE id = ${coach.id} AND email IS NULL`;
  }
  if (certifications.length > 0) {
    await sql`UPDATE coaches SET certifications = ${certifications} WHERE id = ${coach.id} AND array_length(certifications, 1) IS NULL`;
  }

  return true;
}

/**
 * Main entry point.
 */
async function main() {
  console.log('Starting website enricher...');

  // Fetch all coaches with a website that haven't been enriched yet
  const coaches = await sql`
    SELECT id, name, website
    FROM coaches
    WHERE website IS NOT NULL
      AND enriched = FALSE
      AND active = TRUE
    ORDER BY id
  `;

  console.log(`Found ${coaches.length} coaches to enrich`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < coaches.length; i++) {
    const coach = coaches[i];
    console.log(`[${i + 1}/${coaches.length}] Enriching: ${coach.name} — ${coach.website}`);

    const ok = await enrichCoach(coach);
    if (ok) {
      successCount++;
      console.log(`  OK`);
    } else {
      failCount++;
    }

    // Polite delay between website visits
    if (i < coaches.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log('\n=== Website Enricher Summary ===');
  console.log(`  Coaches processed: ${coaches.length}`);
  console.log(`  Successfully enriched: ${successCount}`);
  console.log(`  Failed/skipped:        ${failCount}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
