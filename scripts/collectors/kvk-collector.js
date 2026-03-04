import 'dotenv/config';
import pLimit from 'p-limit';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeCity, normalizeName } from '../utils/normalize.js';
import { findDuplicate, mergeCoachData } from '../utils/dedup.js';
import { CITY_TO_PROVINCE } from '../data/dutch-municipalities.js';

const API_KEY = process.env.KVK_API_KEY;
if (!API_KEY) throw new Error('KVK_API_KEY environment variable is required. Get one free at developers.kvk.nl');

const KVK_SEARCH_URL = 'https://api.kvk.nl/api/v1/zoeken';

// Coaching-related business search terms
const SEARCH_TERMS = [
  'coaching',
  'coach',
  'loopbaancoach',
  'coachingpraktijk',
  'burnout coach',
  'life coach',
  'executive coach',
  'persoonlijke ontwikkeling',
  'loopbaanbegeleiding',
  'coaching en advies',
  'business coach',
  'mentoring',
];

// SBI codes that indicate coaching businesses
const COACHING_SBI_CODES = ['70222', '85592', '85599', '96099'];

// Rate limit: 5 requests/second (KvK is generous)
const limit = pLimit(3);
const REQUEST_DELAY_MS = 300; // ~3 req/sec

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search KvK Zoeken API for coaching businesses.
 * @param {string} searchTerm
 * @param {number} startPage - 0-indexed page number
 * @returns {Promise<{ results: Object[], totalItems: number }>}
 */
async function searchKvk(searchTerm, startPage = 0) {
  const params = new URLSearchParams({
    naam: searchTerm,
    pagina: startPage,
    aantal: 10, // results per page (max 10 for free tier)
  });

  const response = await fetchIPv4(`${KVK_SEARCH_URL}?${params}`, {
    headers: {
      'apikey': API_KEY,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`KvK API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return {
    results: data.resultaten || [],
    totalItems: data.totaal || 0,
  };
}

/**
 * Parse a KvK search result into a coach-like object.
 * @param {Object} result - Raw KvK API result
 * @returns {Object|null}
 */
function parseKvkResult(result) {
  if (!result.kvkNummer) return null;

  // Extract address from the first vestiging (branch)
  const vestiging = result.vestigingen?.[0] || {};
  const address = vestiging.adres || {};

  const name = result.handelsnaam || result.naam || '';
  const city = normalizeCity(address.plaats || '');
  const province = CITY_TO_PROVINCE[city] || null;

  // Build full address string
  const streetParts = [address.straatnaam, address.huisnummer, address.huisnummerToevoeging]
    .filter(Boolean)
    .join(' ');
  const location = [streetParts, address.postcode, city].filter(Boolean).join(', ');

  return {
    name,
    city,
    province,
    location: location || null,
    kvk_number: result.kvkNummer,
    sbi_code: result.spiCode || null, // May not always be present
    website: null, // KvK search doesn't return websites
    email: null,
    phone: null,
    source: 'kvk',
    source_url: `https://www.kvk.nl/bestellen/#/handelsregister/kvknummer=${result.kvkNummer}`,
    name_normalized: normalizeName(name),
  };
}

/**
 * Upsert or merge a coach from KvK data.
 * @param {Object} coach - Parsed coach data
 * @returns {Promise<'inserted'|'merged'|'skipped'>}
 */
async function upsertKvkCoach(coach) {
  if (!coach || !coach.name || !coach.kvk_number) return 'skipped';

  const existingId = await findDuplicate(coach);

  if (existingId) {
    // Merge KvK data into existing record
    await mergeCoachData(existingId, coach, 'kvk');
    return 'merged';
  }

  // Insert new coach
  try {
    await sql`
      INSERT INTO coaches (
        name, location, city, province, kvk_number, sbi_code,
        source, source_url, name_normalized, data_sources,
        active, enriched
      ) VALUES (
        ${coach.name},
        ${coach.location},
        ${coach.city},
        ${coach.province},
        ${coach.kvk_number},
        ${coach.sbi_code},
        'kvk',
        ${coach.source_url},
        ${coach.name_normalized},
        ${['kvk']},
        TRUE,
        FALSE
      )
    `;
    return 'inserted';
  } catch (err) {
    // Handle unique constraint violations gracefully
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return 'skipped';
    }
    throw err;
  }
}

/**
 * Process all pages for a single search term.
 * @param {string} searchTerm
 * @returns {Promise<{ found: number, inserted: number, merged: number }>}
 */
async function processSearchTerm(searchTerm) {
  let found = 0;
  let inserted = 0;
  let merged = 0;
  let errors = 0;
  const startTime = Date.now();

  try {
    // First page to get total
    const firstPage = await searchKvk(searchTerm, 0);
    const totalItems = Math.min(firstPage.totalItems, 1000); // Cap at 1000 per term
    const totalPages = Math.ceil(totalItems / 10);

    console.log(`  "${searchTerm}": ${totalItems} results, ${totalPages} pages`);

    // Process first page results
    for (const result of firstPage.results) {
      const coach = parseKvkResult(result);
      const action = await upsertKvkCoach(coach);
      found++;
      if (action === 'inserted') inserted++;
      if (action === 'merged') merged++;
    }

    // Process remaining pages
    for (let page = 1; page < totalPages; page++) {
      await sleep(REQUEST_DELAY_MS);

      try {
        const pageData = await searchKvk(searchTerm, page);
        for (const result of pageData.results) {
          const coach = parseKvkResult(result);
          const action = await upsertKvkCoach(coach);
          found++;
          if (action === 'inserted') inserted++;
          if (action === 'merged') merged++;
        }
      } catch (err) {
        errors++;
        console.error(`  Page ${page} failed: ${err.message}`);
      }

      if ((page + 1) % 10 === 0) {
        console.log(`    Page ${page + 1}/${totalPages} — found ${found}, new ${inserted}`);
      }
    }
  } catch (err) {
    errors++;
    console.error(`  Search term "${searchTerm}" failed: ${err.message}`);
  }

  // Log the run
  try {
    await sql`
      INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status, duration_ms, errors)
      VALUES ('kvk', ${searchTerm}, 'NL', ${found}, ${inserted}, 'completed', ${Date.now() - startTime}, ${errors})
    `;
  } catch (err) {
    console.error('Failed to log run:', err.message);
  }

  return { found, inserted, merged };
}

/**
 * Main entry point.
 */
async function main() {
  console.log(`Starting KvK collector: ${SEARCH_TERMS.length} search terms`);
  console.log('API: KvK Zoeken (free tier)');

  let totalFound = 0;
  let totalInserted = 0;
  let totalMerged = 0;

  for (const term of SEARCH_TERMS) {
    const result = await processSearchTerm(term);
    totalFound += result.found;
    totalInserted += result.inserted;
    totalMerged += result.merged;

    // Small delay between search terms
    await sleep(500);
  }

  // Final summary
  const [{ count }] = await sql`SELECT COUNT(*) AS count FROM coaches WHERE 'kvk' = ANY(data_sources)`;
  console.log('\n=== KvK Collection Summary ===');
  console.log(`  Results processed:  ${totalFound}`);
  console.log(`  New coaches added:  ${totalInserted}`);
  console.log(`  Existing enriched:  ${totalMerged}`);
  console.log(`  Total with KvK data:${count}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
