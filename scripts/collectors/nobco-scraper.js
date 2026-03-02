import 'dotenv/config';
import * as cheerio from 'cheerio';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeSpecialties, normalizeCity } from '../utils/normalize.js';
import { findDuplicate } from '../utils/dedup.js';

const BASE_URL = 'https://www.nobco.nl';
const DIRECTORY_URL = `${BASE_URL}/vind-een-coach`;
const USER_AGENT = 'CoachFinder Bot 1.0 (educational/research - contact: info@dizid.nl)';
// Polite rate limit: 1 request per 2 seconds
const REQUEST_DELAY_MS = 2000;

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with polite headers and error handling.
 * @param {string} url
 * @returns {Promise<string>} HTML text
 */
async function fetchPage(url) {
  const response = await fetchIPv4(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'nl-NL,nl;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  return response.text();
}

/**
 * Check robots.txt to confirm we are allowed to scrape the directory.
 * @returns {Promise<boolean>}
 */
async function checkRobotsTxt() {
  try {
    const robotsTxt = await fetchPage(`${BASE_URL}/robots.txt`);
    const lines = robotsTxt.split('\n').map((l) => l.trim().toLowerCase());

    let inRelevantBlock = false;
    for (const line of lines) {
      if (line.startsWith('user-agent:')) {
        inRelevantBlock = line.includes('*') || line.includes('coachfinder');
      }
      if (inRelevantBlock && line.startsWith('disallow:')) {
        const disallowedPath = line.replace('disallow:', '').trim();
        // Empty Disallow means "allow all" — skip it
        if (!disallowedPath) continue;
        if (disallowedPath === '/' || DIRECTORY_URL.includes(disallowedPath)) {
          console.warn(`robots.txt disallows scraping: ${disallowedPath}`);
          return false;
        }
      }
    }
    return true;
  } catch (err) {
    console.warn(`Could not fetch robots.txt: ${err.message} — proceeding with caution`);
    return true;
  }
}

/**
 * Parse coach listing items from a NOBCO search results page.
 * @param {string} html
 * @returns {Array<{ name: string, profileUrl: string, city: string, specialties: string[] }>}
 */
function parseListingPage(html) {
  const $ = cheerio.load(html);
  const coaches = [];

  // NOBCO uses a card/list layout — adjust selectors if site structure changes
  $('[class*="coach"], [class*="Coach"], .member, .member-card, article.coach').each((_, el) => {
    const $el = $(el);
    const name = $el.find('[class*="name"], h2, h3, .title').first().text().trim();
    const profileHref = $el.find('a').first().attr('href');
    const profileUrl = profileHref ? (profileHref.startsWith('http') ? profileHref : `${BASE_URL}${profileHref}`) : null;
    const city = $el.find('[class*="city"], [class*="location"], [class*="stad"]').first().text().trim();
    const specialtyText = $el.find('[class*="specialty"], [class*="specialties"], [class*="expertise"]').text();
    const specialties = specialtyText ? specialtyText.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];

    if (name) {
      coaches.push({ name, profileUrl, city, specialties });
    }
  });

  // Fallback: try generic link-based extraction if above yields nothing
  if (coaches.length === 0) {
    $('a[href*="/coaches/"], a[href*="/coach/"], a[href*="profiel"]').each((_, el) => {
      const $el = $(el);
      const name = $el.text().trim();
      const profileUrl = $el.attr('href');
      if (name && profileUrl) {
        coaches.push({
          name,
          profileUrl: profileUrl.startsWith('http') ? profileUrl : `${BASE_URL}${profileUrl}`,
          city: '',
          specialties: [],
        });
      }
    });
  }

  return coaches;
}

/**
 * Parse detailed coach data from a NOBCO profile page.
 * @param {string} html
 * @param {string} profileUrl
 * @returns {Object}
 */
function parseProfilePage(html, profileUrl) {
  const $ = cheerio.load(html);

  // Extract bio text near "over mij" or profile description sections
  let bio = '';
  $('[class*="bio"], [class*="about"], [class*="description"], [class*="profiel"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > bio.length) bio = text;
  });

  // Also check for sections with "over mij" heading
  $('h1, h2, h3, h4').each((_, el) => {
    const heading = $(el).text().toLowerCase();
    if (heading.includes('over mij') || heading.includes('werkwijze')) {
      const siblingText = $(el).next('p, div').text().trim();
      if (siblingText.length > bio.length) bio = siblingText;
    }
  });

  // Specialties
  const rawSpecialties = [];
  $('[class*="specialty"], [class*="expertise"], [class*="specialisme"]').each((_, el) => {
    $(el).find('li, span, a').each((__, item) => {
      const text = $(item).text().trim();
      if (text) rawSpecialties.push(text);
    });
    if (rawSpecialties.length === 0) {
      const text = $(el).text().trim();
      text.split(/[,;]/).forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) rawSpecialties.push(trimmed);
      });
    }
  });

  // Certifications
  const certifications = [];
  $('[class*="certif"], [class*="opleiding"], [class*="accredit"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) certifications.push(text);
  });

  // Website link
  let website = null;
  $('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.includes('nobco.nl') && !href.includes('mailto:')) {
      website = href;
      return false; // break
    }
  });

  // Location
  let location = '';
  $('[class*="location"], [class*="address"], [class*="locatie"], [class*="stad"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0 && text.length > location.length) location = text;
  });

  // City from location or address
  let city = '';
  const cityMatch = location.match(/\b([A-Z][a-z]+(?: [A-Z][a-z]+)*)\s*$/) ||
                    location.match(/\d{4}\s*[A-Z]{2}\s+([A-Za-z ]+)/);
  if (cityMatch) city = cityMatch[1].trim();

  // Meta description as bio fallback
  if (!bio) {
    bio = $('meta[name="description"]').attr('content') || '';
  }

  return {
    bio: bio.slice(0, 2000), // cap bio length
    specialties: normalizeSpecialties(rawSpecialties),
    certifications: certifications.slice(0, 10),
    website,
    location,
    city: normalizeCity(city),
    source_url: profileUrl,
  };
}

/**
 * Get total number of pages from the listing page.
 * @param {string} html
 * @returns {number}
 */
function getTotalPages(html) {
  const $ = cheerio.load(html);
  let maxPage = 1;

  // Look for pagination links
  $('[class*="pag"] a, .pagination a, nav a').each((_, el) => {
    const text = $(el).text().trim();
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > maxPage) maxPage = num;
  });

  return maxPage;
}

/**
 * Upsert or enrich a coach from NOBCO data.
 * If a duplicate is found by name+city, enrich that record.
 * Otherwise, insert a new record.
 * @param {Object} coach
 */
async function upsertNobcoCoach(coach) {
  const existingId = await findDuplicate(coach);

  if (existingId) {
    // Enrich existing record with NOBCO data
    await sql`
      UPDATE coaches SET
        bio           = COALESCE(NULLIF(${coach.bio}, ''), bio),
        specialties   = CASE WHEN array_length(${coach.specialties}::text[], 1) > 0 THEN ${coach.specialties}::text[] ELSE specialties END,
        certifications = CASE WHEN array_length(${coach.certifications}::text[], 1) > 0 THEN ${coach.certifications}::text[] ELSE certifications END,
        website       = COALESCE(NULLIF(${coach.website}, ''), website),
        source_url    = COALESCE(NULLIF(${coach.source_url}, ''), source_url),
        updated_at    = NOW()
      WHERE id = ${existingId}
    `;
    return { action: 'enriched' };
  }

  // Insert new coach from NOBCO
  await sql`
    INSERT INTO coaches (
      name, bio, specialties, certifications, city, location,
      website, source, source_url, active, enriched
    ) VALUES (
      ${coach.name},
      ${coach.bio || null},
      ${coach.specialties},
      ${coach.certifications},
      ${coach.city || null},
      ${coach.location || null},
      ${coach.website || null},
      'nobco',
      ${coach.source_url || null},
      TRUE,
      FALSE
    )
    ON CONFLICT DO NOTHING
  `;
  return { action: 'inserted' };
}

/**
 * Main entry point.
 */
async function main() {
  console.log('Starting NOBCO scraper...');

  const allowed = await checkRobotsTxt();
  if (!allowed) {
    console.error('robots.txt disallows scraping NOBCO. Aborting.');
    process.exit(1);
  }

  // Fetch first page to determine total pages
  console.log(`Fetching ${DIRECTORY_URL} ...`);
  let firstPageHtml;
  try {
    firstPageHtml = await fetchPage(DIRECTORY_URL);
  } catch (err) {
    console.error(`Failed to fetch NOBCO directory: ${err.message}`);
    process.exit(1);
  }

  const totalPages = getTotalPages(firstPageHtml);
  console.log(`Found ${totalPages} pages to scrape`);

  let totalFound = 0;
  let totalInserted = 0;
  let totalEnriched = 0;

  // Process all pages
  for (let page = 1; page <= totalPages; page++) {
    const pageUrl = page === 1 ? DIRECTORY_URL : `${DIRECTORY_URL}?page=${page}`;
    console.log(`\nPage ${page}/${totalPages}: ${pageUrl}`);

    let html;
    try {
      html = page === 1 ? firstPageHtml : await fetchPage(pageUrl);
    } catch (err) {
      console.error(`  Failed to fetch page ${page}: ${err.message}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    const listings = parseListingPage(html);
    console.log(`  Found ${listings.length} coaches on this page`);
    totalFound += listings.length;

    for (const listing of listings) {
      await sleep(REQUEST_DELAY_MS); // polite delay between requests

      let profileData = {};
      if (listing.profileUrl) {
        try {
          const profileHtml = await fetchPage(listing.profileUrl);
          profileData = parseProfilePage(profileHtml, listing.profileUrl);
        } catch (err) {
          console.error(`  Failed to fetch profile ${listing.profileUrl}: ${err.message}`);
        }
      }

      const coach = {
        name: listing.name,
        city: normalizeCity(profileData.city || listing.city),
        location: profileData.location || '',
        bio: profileData.bio || '',
        specialties: normalizeSpecialties([...listing.specialties, ...(profileData.specialties || [])]),
        certifications: profileData.certifications || [],
        website: profileData.website || null,
        source_url: listing.profileUrl || null,
      };

      try {
        const result = await upsertNobcoCoach(coach);
        if (result.action === 'inserted') {
          totalInserted++;
          console.log(`  + Inserted: ${coach.name} (${coach.city})`);
        } else {
          totalEnriched++;
          console.log(`  ~ Enriched: ${coach.name} (${coach.city})`);
        }
      } catch (err) {
        console.error(`  Error saving ${coach.name}: ${err.message}`);
      }
    }

    // Log the run for this page
    try {
      await sql`
        INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
        VALUES ('nobco', ${`page-${page}`}, 'NL', ${listings.length}, ${totalInserted}, 'completed')
      `;
    } catch (err) {
      console.error('Failed to log run:', err.message);
    }

    await sleep(REQUEST_DELAY_MS);
  }

  console.log('\n=== NOBCO Scraper Summary ===');
  console.log(`  Pages scraped:    ${totalPages}`);
  console.log(`  Coaches found:    ${totalFound}`);
  console.log(`  New coaches:      ${totalInserted}`);
  console.log(`  Enriched existing:${totalEnriched}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
