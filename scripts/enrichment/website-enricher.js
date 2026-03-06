import 'dotenv/config';
import * as cheerio from 'cheerio';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeSpecialties } from '../utils/normalize.js';
import { sleep } from '../utils/sleep.js';

const USER_AGENT = 'CoachFinder Bot 1.0 (educational/research - contact: info@dizid.nl)';
// Timeout for website fetches
const FETCH_TIMEOUT_MS = 10000;
// Concurrent workers — each visits a different domain so this is safe
const CONCURRENCY = 5;
// Delay between starting each coach within a worker (ms)
const WORKER_DELAY_MS = 500;

// Re-enrich mode: re-process low-quality coaches
const REENRICH_MODE = process.argv.includes('--reenrich');

// Subpages to check if main page doesn't yield enough data
const SUBPAGES = ['/over-mij', '/about', '/over-ons', '/tarieven', '/prijzen', '/prices', '/contact'];

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
  const bioKeywords = ['over mij', 'over ons', 'about', 'wie ben ik', 'wie zijn wij', 'werkwijze', 'mijn verhaal'];
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
  const priceKeywords = ['tarief', 'prijs', 'kosten', 'investering', 'sessie', 'per uur', 'per sessie', 'consult', 'intake'];

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

  // Also try to find prices without keywords (e.g. just "€85" on a pricing page)
  const allEuros = fullText.match(/€\s*(\d+(?:[.,]\d+)?)/g);
  if (allEuros) {
    for (const match of allEuros) {
      const num = parseFloat(match.replace('€', '').trim().replace(',', '.'));
      if (num >= 25 && num <= 500) {
        return { price: Math.round(num), price_type: 'per sessie' };
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
    'teamcoaching', 'hsp', 'adhd', 'rouw', 'opvoeding', 'scheiding',
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
  if (text.includes('duits') || text.includes('german') || text.includes('deutsch')) languages.push('Duits');
  if (text.includes('frans') || text.includes('french') || text.includes('français')) languages.push('Frans');
  if (text.includes('spaans') || text.includes('spanish') || text.includes('español')) languages.push('Spaans');

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
  const certKeywords = ['icf', 'noloc', 'nobco', 'emcc', 'nvp', 'nip', 'lvsc',
    'certified', 'gecertificeerd', 'register', 'accreditatie', 'eqa'];

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
 * Extract data from a single HTML page.
 * @param {string} html
 * @returns {Object} extracted data
 */
function extractFromPage(html) {
  const $ = cheerio.load(html);
  const fullText = $('body').text().replace(/\s+/g, ' ').trim();

  return {
    bio: extractBio($),
    price: extractPrice($, fullText),
    specialties: extractSpecialties(fullText),
    languages: extractLanguages(fullText),
    email: extractEmail($, fullText),
    certifications: extractCertifications($),
  };
}

/**
 * Enrich a single coach record by visiting their website.
 * Now supports multi-page crawling for better data extraction.
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
    if (!REENRICH_MODE) {
      await sql`UPDATE coaches SET enriched = TRUE, updated_at = NOW() WHERE id = ${coach.id}`;
    }
    return false;
  }

  // Extract data from main page
  const data = extractFromPage(html);
  let { bio } = data;
  let { price, price_type } = data.price;
  let { specialties, languages, email, certifications } = data;

  // Multi-page crawling: if bio or price is missing, try subpages
  if (!bio || bio.length < 50 || !price) {
    for (const subpage of SUBPAGES) {
      try {
        const subUrl = new URL(subpage, coach.website).toString();
        await sleep(1000); // Shorter delay for same-site requests
        const subHtml = await fetchWithTimeout(subUrl);
        const subData = extractFromPage(subHtml);

        // Fill in missing data from subpage
        if ((!bio || bio.length < 50) && subData.bio && subData.bio.length > bio.length) {
          bio = subData.bio;
        }
        if (!price && subData.price.price) {
          price = subData.price.price;
          price_type = subData.price.price_type;
        }
        if (!email && subData.email) {
          email = subData.email;
        }
        if (subData.specialties.length > specialties.length) {
          specialties = subData.specialties;
        }
        if (subData.certifications.length > certifications.length) {
          certifications = subData.certifications;
        }

        // Stop crawling subpages if we have enough data
        if (bio && bio.length >= 50 && price && email) break;
      } catch {
        // Skip subpages that fail — totally normal
      }
    }
  }

  // Update enriched flag first
  await sql`UPDATE coaches SET enriched = TRUE, updated_at = NOW() WHERE id = ${coach.id}`;

  // In re-enrich mode, we update even if field has data (if new data is better)
  if (REENRICH_MODE) {
    if (bio && bio.length > 50) {
      await sql`UPDATE coaches SET bio = ${bio} WHERE id = ${coach.id} AND (bio IS NULL OR bio = '' OR length(bio) < ${bio.length})`;
    }
    if (price != null) {
      await sql`UPDATE coaches SET price = ${price}, price_type = ${price_type} WHERE id = ${coach.id}`;
    }
    if (specialties.length > 0) {
      await sql`UPDATE coaches SET specialties = ${specialties} WHERE id = ${coach.id} AND (array_length(specialties, 1) IS NULL OR array_length(specialties, 1) < ${specialties.length})`;
    }
    if (email) {
      await sql`UPDATE coaches SET email = ${email} WHERE id = ${coach.id} AND email IS NULL`;
    }
    if (certifications.length > 0) {
      await sql`UPDATE coaches SET certifications = ${certifications} WHERE id = ${coach.id} AND (array_length(certifications, 1) IS NULL OR array_length(certifications, 1) < ${certifications.length})`;
    }
  } else {
    // Normal mode: only fill NULL/empty fields
    if (bio) {
      await sql`UPDATE coaches SET bio = ${bio} WHERE id = ${coach.id} AND (bio IS NULL OR bio = '')`;
    }
    if (price != null) {
      await sql`UPDATE coaches SET price = ${price}, price_type = ${price_type} WHERE id = ${coach.id} AND price IS NULL`;
    }
    if (specialties.length > 0) {
      await sql`UPDATE coaches SET specialties = ${specialties} WHERE id = ${coach.id} AND array_length(specialties, 1) IS NULL`;
    }
    if (email) {
      await sql`UPDATE coaches SET email = ${email} WHERE id = ${coach.id} AND email IS NULL`;
    }
    if (certifications.length > 0) {
      await sql`UPDATE coaches SET certifications = ${certifications} WHERE id = ${coach.id} AND array_length(certifications, 1) IS NULL`;
    }
  }

  // Always update languages
  if (languages.length > 0) {
    await sql`UPDATE coaches SET languages = ${languages} WHERE id = ${coach.id}`;
  }

  return true;
}

/**
 * Main entry point.
 */
async function main() {
  if (REENRICH_MODE) {
    console.log('Starting website enricher (RE-ENRICH MODE — low-quality coaches)...');
  } else {
    console.log('Starting website enricher...');
  }

  // Fetch coaches to enrich
  const coaches = REENRICH_MODE
    ? await sql`
        SELECT id, name, website
        FROM coaches
        WHERE website IS NOT NULL
          AND active = TRUE
          AND quality_score < 40
        ORDER BY quality_score ASC
        LIMIT 2000
      `
    : await sql`
        SELECT id, name, website
        FROM coaches
        WHERE website IS NOT NULL
          AND enriched = FALSE
          AND active = TRUE
        ORDER BY id
      `;

  console.log(`Found ${coaches.length} coaches to enrich (concurrency: ${CONCURRENCY})`);

  let successCount = 0;
  let failCount = 0;
  let nextIdx = 0;

  // Worker function: picks next coach from queue, processes it, repeats
  async function worker(workerId) {
    while (true) {
      const idx = nextIdx++;
      if (idx >= coaches.length) break;

      const coach = coaches[idx];
      console.log(`[${idx + 1}/${coaches.length}] (W${workerId}) ${coach.name} — ${coach.website}`);

      const ok = await enrichCoach(coach);
      if (ok) {
        successCount++;
        console.log(`  [${idx + 1}] OK`);
      } else {
        failCount++;
      }

      // Small delay between coaches within a worker
      await sleep(WORKER_DELAY_MS);
    }
  }

  // Launch workers in parallel
  const workers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(worker(w + 1));
  }
  await Promise.all(workers);

  console.log('\n=== Website Enricher Summary ===');
  console.log(`  Mode:                 ${REENRICH_MODE ? 'Re-enrich' : 'Normal'}`);
  console.log(`  Coaches processed:    ${coaches.length}`);
  console.log(`  Successfully enriched:${successCount}`);
  console.log(`  Failed/skipped:       ${failCount}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
