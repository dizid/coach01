import 'dotenv/config';
import * as cheerio from 'cheerio';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeSpecialties, normalizeCity, normalizeName } from '../utils/normalize.js';
import { findDuplicate, mergeCoachData } from '../utils/dedup.js';
import { CITY_TO_PROVINCE } from '../data/dutch-municipalities.js';
import { sleep } from '../utils/sleep.js';

const USER_AGENT = 'CoachFinder Bot 1.0 (educational/research - contact: info@dizid.nl)';
const REQUEST_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 15000;

/**
 * Fetch a URL with timeout and polite headers.
 * @param {string} url
 * @returns {Promise<string>}
 */
async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchIPv4(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Upsert or merge a coach from association data.
 * @param {Object} coach
 * @param {string} source - 'emcc' or 'lvsc'
 * @returns {Promise<'inserted'|'merged'|'skipped'>}
 */
async function upsertAssociationCoach(coach, source) {
  if (!coach.name || coach.name.length < 3) return 'skipped';

  const province = CITY_TO_PROVINCE[coach.city] || null;
  const existingId = await findDuplicate(coach);

  if (existingId) {
    await mergeCoachData(existingId, { ...coach, province }, source);

    // Update certifications if we have association-specific ones
    if (coach.certifications?.length > 0) {
      await sql`
        UPDATE coaches SET
          certifications = CASE
            WHEN array_length(certifications, 1) IS NULL THEN ${coach.certifications}
            ELSE (
              SELECT ARRAY(
                SELECT DISTINCT unnest(certifications || ${coach.certifications})
              )
            )
          END
        WHERE id = ${existingId}
      `;
    }

    return 'merged';
  }

  try {
    await sql`
      INSERT INTO coaches (
        name, bio, specialties, certifications, city, province, location,
        website, email, source, source_url, name_normalized, data_sources,
        active, enriched
      ) VALUES (
        ${coach.name},
        ${coach.bio || null},
        ${coach.specialties || []},
        ${coach.certifications || []},
        ${coach.city || null},
        ${province},
        ${coach.location || null},
        ${coach.website || null},
        ${coach.email || null},
        ${source},
        ${coach.source_url || null},
        ${normalizeName(coach.name)},
        ${[source]},
        TRUE,
        ${!!coach.website}
      )
    `;
    return 'inserted';
  } catch (err) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return 'skipped';
    }
    throw err;
  }
}

// ─── EMCC Global Directory ───────────────────────────────────────────────

/**
 * EMCC Global does not have a public coach directory that can be scraped.
 * Their website returns 404 for all directory URLs and has no sitemap entries for coaches.
 * Skip EMCC and focus on LVSC which has 1,666 registered professionals.
 * @returns {Promise<{ found: number, inserted: number, merged: number }>}
 */
async function scrapeEmccDirectory() {
  console.log('\n--- EMCC Global Directory ---');
  console.log('  EMCC has no public directory — skipping');

  await sql`
    INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
    VALUES ('emcc', 'directory', 'NL', 0, 0, 'skipped')
  `.catch(() => {});

  return { found: 0, inserted: 0, merged: 0 };
}

// ─── LVSC Directory ──────────────────────────────────────────────────────

const LVSC_BASE_URL = 'https://www.lvsc.eu';

/**
 * Scrape LVSC (Landelijke Vereniging Supervisie en Coaching) register.
 * LVSC has 1,666 registered professionals across 167 pages (10/page, 0-indexed).
 * URL: /beroepsregistratie/vind-een-professioneel-begeleider?page={0-based}
 * Profile URLs: /lid/{name-slug}
 * @returns {Promise<{ found: number, inserted: number, merged: number }>}
 */
async function scrapeLvscDirectory() {
  console.log('\n--- LVSC Directory ---');
  let found = 0;
  let inserted = 0;
  let merged = 0;

  const directoryUrl = `${LVSC_BASE_URL}/beroepsregistratie/vind-een-professioneel-begeleider`;

  // First, get page 0 to detect total pages
  let totalPages = 167; // Known from site: 1,666 members / 10 per page
  try {
    const html = await fetchPage(directoryUrl);
    const $ = cheerio.load(html);

    // Try to find the last page number from pagination
    $('a[href*="page="]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const pageMatch = href.match(/page=(\d+)/);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1], 10);
        if (pageNum > totalPages) totalPages = pageNum;
      }
    });

    // Parse the first page of results
    const pageResults = parseLvscListings($);
    found += pageResults.length;

    for (const member of pageResults) {
      const action = await upsertAssociationCoach(member, 'lvsc');
      if (action === 'inserted') inserted++;
      if (action === 'merged') merged++;
    }

    console.log(`  Page 0: ${pageResults.length} members (total pages: ~${totalPages + 1})`);
  } catch (err) {
    console.error(`  LVSC directory failed: ${err.message}`);
    return { found, inserted, merged };
  }

  // Paginate through remaining pages
  for (let page = 1; page <= totalPages; page++) {
    await sleep(REQUEST_DELAY_MS);

    try {
      const html = await fetchPage(`${directoryUrl}?page=${page}`);
      const $ = cheerio.load(html);
      const pageResults = parseLvscListings($);

      if (pageResults.length === 0) {
        console.log(`  Page ${page}: empty — stopping`);
        break;
      }

      found += pageResults.length;

      for (const member of pageResults) {
        const action = await upsertAssociationCoach(member, 'lvsc');
        if (action === 'inserted') inserted++;
        if (action === 'merged') merged++;
      }

      if ((page + 1) % 20 === 0) {
        console.log(`    Progress: page ${page + 1}/${totalPages + 1} — found ${found}, new ${inserted}, merged ${merged}`);
      }
    } catch (err) {
      console.error(`  LVSC page ${page} failed: ${err.message}`);
    }
  }

  console.log(`  LVSC result: found ${found}, new ${inserted}, merged ${merged}`);

  await sql`
    INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
    VALUES ('lvsc', 'register', 'NL', ${found}, ${inserted}, 'completed')
  `.catch(() => {});

  return { found, inserted, merged };
}

/**
 * Parse LVSC listing page for member cards.
 * LVSC structure:
 *   <h5 class="mb-2">Name</h5>
 *   <span class="icon-span ..."><i class="icon icon-pin-outline"></i><span>City</span></span>
 *   ... Registratie/Specialisatie sections ...
 *   <a href="/lid/slug" class="stretched-link">
 * All inside a col-12 card div.
 * @param {CheerioAPI} $
 * @returns {Object[]}
 */
function parseLvscListings($) {
  const members = [];
  const seen = new Set();

  // Strategy: find h5.mb-2 elements (member names) and extract surrounding data
  $('h5.mb-2').each((_, el) => {
    const $h5 = $(el);
    const name = $h5.text().trim();
    if (!name || name.length < 3 || name.length > 100 || seen.has(name)) return;
    seen.add(name);

    // Navigate up to the card container to find other fields
    const $card = $h5.closest('.col-12, .col-md-10, [class*="col"]').parent();
    const cardText = $card.text();

    // City: inside an icon-span with pin icon
    const city = $card.find('.icon-span span').first().text().trim()
      || $card.find('[class*="icon-pin"]').parent().find('span').last().text().trim();

    // Profile link: stretched-link with /lid/
    const href = $card.find('a[href*="/lid/"]').first().attr('href')
      || $card.find('a.stretched-link').first().attr('href');

    // Registration types
    const certifications = ['LVSC geregistreerd'];
    const cardLower = cardText.toLowerCase();
    if (cardLower.includes('supervisor')) certifications.push('LVSC Supervisor');
    if (cardLower.includes('registercoach')) certifications.push('LVSC Registercoach');
    if (cardLower.includes('organisatie')) certifications.push('LVSC Organisatiebegeleider');

    // Specialties
    const specialties = [];
    const specKeywords = ['coaching', 'supervisie', 'counselling', 'executive', 'team', 'intervisie'];
    for (const kw of specKeywords) {
      if (cardLower.includes(kw)) specialties.push(kw);
    }

    members.push({
      name,
      bio: '',
      city: normalizeCity(city),
      certifications,
      specialties: normalizeSpecialties(specialties),
      website: null,
      email: null,
      source_url: href ? (href.startsWith('http') ? href : `${LVSC_BASE_URL}${href}`) : null,
    });
  });

  // Fallback: find all /lid/ links if h5 strategy got nothing
  if (members.length === 0) {
    $('a[href*="/lid/"]').each((_, el) => {
      const name = $(el).text().trim();
      const href = $(el).attr('href');
      if (!name || name.length < 3 || name.length > 100 || seen.has(name)) return;
      if (name.toLowerCase().includes('bekijk') || name.toLowerCase().includes('profiel')) return;
      seen.add(name);

      members.push({
        name,
        bio: '',
        city: '',
        certifications: ['LVSC geregistreerd'],
        specialties: [],
        website: null,
        email: null,
        source_url: href.startsWith('http') ? href : `${LVSC_BASE_URL}${href}`,
      });
    });
  }

  return members;
}

// ─── ICF Netherlands ─────────────────────────────────────────────────────

const ICF_FIND_COACH_URL = 'https://coachingfederation.org/find-a-coach';

/**
 * Attempt to scrape ICF's Find-a-Coach directory for Netherlands.
 * Note: ICF may use a JavaScript-heavy search widget.
 * @returns {Promise<{ found: number, inserted: number, merged: number }>}
 */
async function scrapeIcfDirectory() {
  console.log('\n--- ICF Netherlands ---');
  let found = 0;
  let inserted = 0;
  let merged = 0;

  try {
    const html = await fetchPage(`${ICF_FIND_COACH_URL}?country=Netherlands`);
    const $ = cheerio.load(html);

    // ICF likely uses a dynamic search widget — check for embedded data
    $('script').each((_, el) => {
      const content = $(el).html() || '';
      // Look for JSON data embedded in scripts
      if (content.includes('coaches') || content.includes('directory')) {
        const jsonMatch = content.match(/(?:coaches|data|results)\s*[:=]\s*(\[[\s\S]*?\])/);
        if (jsonMatch) {
          try {
            const data = JSON.parse(jsonMatch[1]);
            found += Array.isArray(data) ? data.length : 0;
          } catch { /* not valid JSON */ }
        }
      }
    });

    console.log(`  ICF directory: found ${found} coaches (may need browser-based scraping)`);
  } catch (err) {
    console.error(`  ICF fetch failed: ${err.message}`);
  }

  await sql`
    INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
    VALUES ('icf', 'find-a-coach', 'NL', ${found}, ${inserted}, 'completed')
  `.catch(() => {});

  return { found, inserted, merged };
}

/**
 * Main entry point — run all association scrapers.
 */
async function main() {
  console.log('Starting association scraper (EMCC, LVSC, ICF)...');

  const emcc = await scrapeEmccDirectory();
  const lvsc = await scrapeLvscDirectory();
  const icf = await scrapeIcfDirectory();

  const totalFound = emcc.found + lvsc.found + icf.found;
  const totalInserted = emcc.inserted + lvsc.inserted + icf.inserted;
  const totalMerged = emcc.merged + lvsc.merged + icf.merged;

  console.log('\n=== Association Scraper Summary ===');
  console.log(`  EMCC:   found ${emcc.found}, new ${emcc.inserted}, merged ${emcc.merged}`);
  console.log(`  LVSC:   found ${lvsc.found}, new ${lvsc.inserted}, merged ${lvsc.merged}`);
  console.log(`  ICF:    found ${icf.found}, new ${icf.inserted}, merged ${icf.merged}`);
  console.log(`  Total:  found ${totalFound}, new ${totalInserted}, merged ${totalMerged}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
