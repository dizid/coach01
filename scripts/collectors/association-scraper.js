import 'dotenv/config';
import * as cheerio from 'cheerio';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeSpecialties, normalizeCity, normalizeName } from '../utils/normalize.js';
import { findDuplicate, mergeCoachData } from '../utils/dedup.js';
import { CITY_TO_PROVINCE } from '../data/dutch-municipalities.js';

const USER_AGENT = 'CoachFinder Bot 1.0 (educational/research - contact: info@dizid.nl)';
const REQUEST_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 15000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

const EMCC_BASE_URL = 'https://www.emccglobal.org';
const EMCC_DIRECTORY_URL = `${EMCC_BASE_URL}/directory`;

/**
 * Scrape EMCC Global Directory filtered for Netherlands.
 * @returns {Promise<{ found: number, inserted: number, merged: number }>}
 */
async function scrapeEmccDirectory() {
  console.log('\n--- EMCC Global Directory ---');
  let found = 0;
  let inserted = 0;
  let merged = 0;

  // Try the directory with country filter
  const urls = [
    `${EMCC_DIRECTORY_URL}?country=Netherlands`,
    `${EMCC_DIRECTORY_URL}?country=NL`,
    `${EMCC_DIRECTORY_URL}/?country=netherlands`,
  ];

  for (const url of urls) {
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      // Look for coach listings — EMCC uses various layouts
      const selectors = [
        '[class*="member"], [class*="coach"], [class*="profile"], [class*="result"]',
        '.card, .listing, article',
      ];

      for (const selector of selectors) {
        $(selector).each((_, el) => {
          const $el = $(el);
          const name = $el.find('h2, h3, h4, [class*="name"]').first().text().trim();
          const city = $el.find('[class*="city"], [class*="location"]').first().text().trim();
          const bio = $el.find('[class*="bio"], [class*="description"], p').first().text().trim();
          const profileHref = $el.find('a').first().attr('href');
          const certText = $el.find('[class*="cert"], [class*="level"], [class*="accred"]').text().trim();

          if (name && name.length > 2) {
            found++;
            // Will be processed below
          }
        });

        if (found > 0) break;
      }

      // If we got results from this URL, stop trying alternatives
      if (found > 0) {
        console.log(`  Found ${found} coaches at ${url}`);
        break;
      }

      // Look for JSON-LD
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html());
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            if (item['@type'] === 'Person' || item.name) {
              found++;
            }
          }
        } catch { /* skip */ }
      });

      if (found > 0) break;
      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.error(`  EMCC fetch failed (${url}): ${err.message}`);
    }
  }

  // If HTML parsing didn't work well, try fetching individual pages from the sitemap
  if (found === 0) {
    console.log('  Trying EMCC sitemap approach...');
    try {
      const sitemapXml = await fetchPage(`${EMCC_BASE_URL}/sitemap.xml`);
      const $ = cheerio.load(sitemapXml, { xmlMode: true });

      const profileUrls = [];
      $('url > loc').each((_, el) => {
        const loc = $(el).text().trim();
        if (loc.includes('/directory/') && loc.includes('coach')) {
          profileUrls.push(loc);
        }
      });

      console.log(`  Found ${profileUrls.length} potential profiles in sitemap`);

      for (const profileUrl of profileUrls.slice(0, 500)) {
        try {
          const profileHtml = await fetchPage(profileUrl);
          const $p = cheerio.load(profileHtml);
          const fullText = $p('body').text();

          // Check if this is a Netherlands-based coach
          if (!fullText.toLowerCase().includes('netherlands') && !fullText.toLowerCase().includes('nederland')) {
            continue;
          }

          const name = $p('h1').first().text().trim();
          if (!name) continue;
          found++;

          const coach = {
            name,
            bio: $p('meta[name="description"]').attr('content') || '',
            city: '',
            certifications: ['EMCC geaccrediteerd'],
            specialties: [],
            website: null,
            email: null,
            source_url: profileUrl,
          };

          const action = await upsertAssociationCoach(coach, 'emcc');
          if (action === 'inserted') inserted++;
          if (action === 'merged') merged++;

          await sleep(REQUEST_DELAY_MS);
        } catch { /* skip failed profiles */ }
      }
    } catch (err) {
      console.error(`  EMCC sitemap failed: ${err.message}`);
    }
  }

  console.log(`  EMCC result: found ${found}, new ${inserted}, merged ${merged}`);

  await sql`
    INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
    VALUES ('emcc', 'directory', 'NL', ${found}, ${inserted}, 'completed')
  `.catch(() => {});

  return { found, inserted, merged };
}

// ─── LVSC Directory ──────────────────────────────────────────────────────

const LVSC_BASE_URL = 'https://www.lvsc.eu';

/**
 * Scrape LVSC (Landelijke Vereniging Supervisie en Coaching) register.
 * LVSC has a register of certified supervisors and coaches.
 * @returns {Promise<{ found: number, inserted: number, merged: number }>}
 */
async function scrapeLvscDirectory() {
  console.log('\n--- LVSC Directory ---');
  let found = 0;
  let inserted = 0;
  let merged = 0;

  // Try the register page
  const registerUrls = [
    `${LVSC_BASE_URL}/register`,
    `${LVSC_BASE_URL}/vind-een-supervisor`,
    `${LVSC_BASE_URL}/zoek-een-supervisor`,
    `${LVSC_BASE_URL}/register/zoeken`,
  ];

  for (const url of registerUrls) {
    try {
      const html = await fetchPage(url);
      const $ = cheerio.load(html);

      // Parse coach/supervisor listings
      $('[class*="member"], [class*="result"], [class*="supervisor"], [class*="coach"], article, .card').each((_, el) => {
        const $el = $(el);
        const name = $el.find('h2, h3, h4, [class*="name"]').first().text().trim();
        const city = $el.find('[class*="city"], [class*="location"], [class*="plaats"]').first().text().trim();
        const profileHref = $el.find('a').first().attr('href');

        if (name && name.length > 2 && name.length < 100) {
          found++;
          // Queue for processing
        }
      });

      // Also check for a search form that might lead to results
      const formAction = $('form[action*="zoek"], form[action*="search"], form[action*="register"]').attr('action');
      if (formAction && found === 0) {
        console.log(`  Found search form at: ${formAction}`);
      }

      if (found > 0) {
        console.log(`  Found ${found} members at ${url}`);
        break;
      }

      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.error(`  LVSC fetch failed (${url}): ${err.message}`);
    }
  }

  // Try sitemap approach
  if (found === 0) {
    console.log('  Trying LVSC sitemap approach...');
    try {
      const sitemapXml = await fetchPage(`${LVSC_BASE_URL}/sitemap.xml`);
      const $ = cheerio.load(sitemapXml, { xmlMode: true });

      const profileUrls = [];
      $('url > loc').each((_, el) => {
        const loc = $(el).text().trim();
        if (loc.includes('/register/') || loc.includes('/supervisor/') || loc.includes('/coach/')) {
          profileUrls.push(loc);
        }
      });

      console.log(`  Found ${profileUrls.length} potential profiles in sitemap`);

      for (const profileUrl of profileUrls.slice(0, 500)) {
        try {
          const profileHtml = await fetchPage(profileUrl);
          const $p = cheerio.load(profileHtml);

          const name = $p('h1').first().text().trim();
          if (!name || name.length < 3) continue;
          found++;

          const city = $p('[class*="city"], [class*="location"], [class*="plaats"]').first().text().trim();

          const coach = {
            name,
            bio: $p('meta[name="description"]').attr('content') || '',
            city: normalizeCity(city),
            certifications: ['LVSC geregistreerd'],
            specialties: [],
            website: null,
            email: null,
            source_url: profileUrl,
          };

          const action = await upsertAssociationCoach(coach, 'lvsc');
          if (action === 'inserted') inserted++;
          if (action === 'merged') merged++;

          await sleep(REQUEST_DELAY_MS);
        } catch { /* skip failed profiles */ }
      }
    } catch (err) {
      console.error(`  LVSC sitemap failed: ${err.message}`);
    }
  }

  console.log(`  LVSC result: found ${found}, new ${inserted}, merged ${merged}`);

  await sql`
    INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
    VALUES ('lvsc', 'register', 'NL', ${found}, ${inserted}, 'completed')
  `.catch(() => {});

  return { found, inserted, merged };
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
