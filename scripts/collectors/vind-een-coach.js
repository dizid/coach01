import 'dotenv/config';
import * as cheerio from 'cheerio';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeCity, normalizeSpecialties, normalizeName } from '../utils/normalize.js';
import { findDuplicate, mergeCoachData } from '../utils/dedup.js';
import { CITY_TO_PROVINCE } from '../data/dutch-municipalities.js';
import { sleep } from '../utils/sleep.js';

const BASE_URL = 'https://www.vind-een-coach.nl';
const USER_AGENT = 'CoachFinder Bot 1.0 (educational/research - contact: info@dizid.nl)';
const REQUEST_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 15000;

// Province slugs for browsing the directory
const PROVINCE_SLUGS = [
  'drenthe', 'flevoland', 'friesland', 'gelderland',
  'groningen', 'limburg', 'noord-brabant', 'noord-holland',
  'overijssel', 'utrecht', 'zeeland', 'zuid-holland',
];

// Specialty paths to browse (from vind-een-coach.nl's actual search options)
const SPECIALTY_SLUGS = [
  'burnout-coaching', 'loopbaan-coaching', 'relatiecoach', 'life-coaching',
  'bedrijfscoaching', 'stress-begeleiding', 'professional-coaching',
  'hsp-hooggevoeligheid-coaching', 'faalangst-coaching', 'gezinscoach',
  'coach-kinderen-kindercoaching', 'coach-jongeren', 'adhd',
  'teambuilding', 'beroepskeuze',
];

/**
 * Fetch a URL with timeout and polite headers.
 * @param {string} url
 * @returns {Promise<string>} HTML text
 */
async function fetchPage(url) {
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
 * Check robots.txt.
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
        if (!disallowedPath) continue;
        if (disallowedPath === '/') {
          console.warn('robots.txt disallows all scraping');
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
 * Try to discover an underlying API endpoint from the page source.
 * Many modern sites load data via XHR/fetch calls to a backend API.
 * @param {string} html - The main page HTML
 * @returns {string|null} API endpoint URL or null
 */
function discoverApiEndpoint(html) {
  // Look for API URLs in script tags
  const patterns = [
    /["']((https?:\/\/[^"']*api[^"']*coach[^"']*))/gi,
    /["']((\/api\/[^"']*))/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match) {
      const url = match[1] || match[2];
      if (url && !url.includes('google') && !url.includes('analytics')) {
        return url;
      }
    }
  }

  return null;
}

/**
 * Parse coach listings from an HTML page.
 * Tries multiple selector strategies to handle different page structures.
 * @param {string} html
 * @returns {Array<Object>}
 */
function parseCoachListings(html) {
  const $ = cheerio.load(html);
  const coaches = [];

  // Strategy 1: Look for coach cards/items with common patterns
  const cardSelectors = [
    '[class*="coach-card"]',
    '[class*="coach-item"]',
    '[class*="coach-list"] > *',
    '[class*="result-item"]',
    '[class*="profile-card"]',
    'article[class*="coach"]',
    '.coach',
    '.result',
  ];

  for (const selector of cardSelectors) {
    $(selector).each((_, el) => {
      const $el = $(el);
      const name = $el.find('h2, h3, h4, [class*="name"]').first().text().trim();
      const profileHref = $el.find('a').first().attr('href');
      const city = $el.find('[class*="city"], [class*="location"], [class*="plaats"]').first().text().trim();
      const bio = $el.find('[class*="bio"], [class*="description"], [class*="intro"], p').first().text().trim();
      const specialtyText = $el.find('[class*="special"], [class*="expertise"]').text();

      if (name && name.length > 2) {
        coaches.push({
          name,
          profileUrl: profileHref ? (profileHref.startsWith('http') ? profileHref : `${BASE_URL}${profileHref}`) : null,
          city: city || '',
          bio: bio || '',
          specialties: specialtyText ? specialtyText.split(/[,;|]/).map((s) => s.trim()).filter(Boolean) : [],
        });
      }
    });

    if (coaches.length > 0) break;
  }

  // Strategy 2: JSON-LD structured data
  if (coaches.length === 0) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Person' || item['@type'] === 'LocalBusiness') {
            coaches.push({
              name: item.name || '',
              profileUrl: item.url || null,
              city: item.address?.addressLocality || '',
              bio: item.description || '',
              specialties: [],
              website: item.url || null,
            });
          }
        }
      } catch { /* skip invalid JSON-LD */ }
    });
  }

  // Strategy 3: Look for links to coach profiles
  if (coaches.length === 0) {
    $('a[href*="/coach/"], a[href*="/coaches/"], a[href*="/profiel/"]').each((_, el) => {
      const $el = $(el);
      const name = $el.text().trim();
      const href = $el.attr('href');
      if (name && name.length > 2 && href) {
        coaches.push({
          name,
          profileUrl: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          city: '',
          bio: '',
          specialties: [],
        });
      }
    });
  }

  return coaches;
}

/**
 * Parse a coach profile page for detailed data.
 * @param {string} html
 * @param {string} profileUrl
 * @returns {Object}
 */
function parseProfilePage(html, profileUrl) {
  const $ = cheerio.load(html);
  const fullText = $('body').text().replace(/\s+/g, ' ').trim();

  // Bio
  let bio = '';
  const bioSelectors = ['[class*="bio"]', '[class*="about"]', '[class*="description"]', '[class*="intro"]'];
  for (const sel of bioSelectors) {
    const text = $(sel).first().text().trim();
    if (text.length > bio.length) bio = text;
  }
  if (bio.length < 50) {
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    if (metaDesc.length > bio.length) bio = metaDesc;
  }

  // Website (external link, not social media)
  let website = null;
  $('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.includes('vind-een-coach') && !href.includes('mailto:') &&
        !href.includes('facebook') && !href.includes('linkedin') &&
        !href.includes('twitter') && !href.includes('instagram')) {
      website = href;
      return false;
    }
  });

  // Email
  let email = null;
  $('a[href^="mailto:"]').each((_, el) => {
    email = $(el).attr('href').replace('mailto:', '').split('?')[0].trim();
    return false;
  });
  if (!email) {
    const emailMatch = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];
  }

  // Phone
  let phone = null;
  $('a[href^="tel:"]').each((_, el) => {
    phone = $(el).attr('href').replace('tel:', '').trim();
    return false;
  });

  // Specialties from page text
  const specialtyTerms = [
    'burnout', 'stress', 'loopbaan', 'relatie', 'leiderschap',
    'mindfulness', 'zelfvertrouwen', 'persoonlijke groei', 'life coach',
    'executive', 'business', 'gezondheid', 'communicatie', 'angst',
  ];
  const foundSpecialties = specialtyTerms.filter((t) => fullText.toLowerCase().includes(t));

  // City
  let city = '';
  $('[class*="location"], [class*="address"], [class*="plaats"], [class*="city"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0 && text.length < 100) city = text;
    return false;
  });

  return {
    bio: bio.slice(0, 2000),
    website,
    email,
    phone,
    city: normalizeCity(city),
    specialties: normalizeSpecialties(foundSpecialties),
    source_url: profileUrl,
  };
}

/**
 * Get pagination info from a page.
 * @param {string} html
 * @returns {number} total pages
 */
function getTotalPages(html) {
  const $ = cheerio.load(html);
  let maxPage = 1;

  $('[class*="pag"] a, .pagination a, nav a, [class*="page"] a').each((_, el) => {
    const text = $(el).text().trim();
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > maxPage) maxPage = num;
  });

  const href = $('a[rel="next"], a[class*="next"]').attr('href');
  if (href) {
    const pageMatch = href.match(/page=(\d+)|pagina=(\d+)/);
    if (pageMatch) {
      const num = parseInt(pageMatch[1] || pageMatch[2], 10);
      if (num > maxPage) maxPage = num;
    }
  }

  return maxPage;
}

/**
 * Upsert or merge a coach from Vind-een-Coach data.
 * @param {Object} coach
 * @returns {Promise<'inserted'|'merged'|'skipped'>}
 */
async function upsertCoach(coach) {
  if (!coach.name || coach.name.length < 3) return 'skipped';

  const province = CITY_TO_PROVINCE[coach.city] || null;
  const existingId = await findDuplicate(coach);

  if (existingId) {
    await mergeCoachData(existingId, { ...coach, province }, 'vind_een_coach');
    return 'merged';
  }

  try {
    await sql`
      INSERT INTO coaches (
        name, bio, city, province, location, website, email, phone,
        specialties, source, source_url, name_normalized, data_sources,
        active, enriched
      ) VALUES (
        ${coach.name},
        ${coach.bio || null},
        ${coach.city || null},
        ${province},
        ${coach.location || null},
        ${coach.website || null},
        ${coach.email || null},
        ${coach.phone || null},
        ${coach.specialties || []},
        'vind_een_coach',
        ${coach.source_url || null},
        ${normalizeName(coach.name)},
        ${['vind_een_coach']},
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

/**
 * Scrape a single category/province via the search results endpoint.
 * Uses the Yii-based API at /site-profile/search-results.html?searchUri={slug}&p={page}&perPage=25
 * @param {string} slug - Province or specialty slug
 * @param {string} label
 * @returns {Promise<{ found: number, inserted: number, merged: number }>}
 */
async function scrapeSection(slug, label) {
  let found = 0;
  let inserted = 0;
  let merged = 0;

  let page = 1;
  const perPage = 25;
  let hasMore = true;

  while (hasMore) {
    const url = `${BASE_URL}/site-profile/search-results.html?searchUri=${slug}&p=${page}&perPage=${perPage}`;

    try {
      const html = await fetchPage(url);
      const listings = parseCoachListings(html);

      if (listings.length === 0) {
        // No more results or empty page
        if (page === 1) console.log(`  ${label}: 0 coaches found`);
        hasMore = false;
        break;
      }

      if (page === 1) {
        const totalPages = getTotalPages(html);
        console.log(`  ${label}: ${listings.length} coaches on page 1, ~${totalPages} total pages`);
      }

      // Process listings from this page
      for (const listing of listings) {
        found++;

        // Visit profile page for detailed data
        let profileData = {};
        if (listing.profileUrl) {
          await sleep(REQUEST_DELAY_MS);
          try {
            const profileHtml = await fetchPage(listing.profileUrl);
            profileData = parseProfilePage(profileHtml, listing.profileUrl);
          } catch (err) {
            // Skip profile on error — use listing data only
          }
        }

        const coach = {
          name: listing.name,
          bio: profileData.bio || listing.bio || '',
          city: normalizeCity(profileData.city || listing.city),
          website: profileData.website || listing.website || null,
          email: profileData.email || null,
          phone: profileData.phone || null,
          specialties: normalizeSpecialties([...listing.specialties, ...(profileData.specialties || [])]),
          source_url: listing.profileUrl || url,
        };

        const action = await upsertCoach(coach);
        if (action === 'inserted') inserted++;
        if (action === 'merged') merged++;
      }

      // If we got fewer than perPage results, we've reached the last page
      if (listings.length < perPage) {
        hasMore = false;
      } else {
        page++;
        await sleep(REQUEST_DELAY_MS);
      }
    } catch (err) {
      console.error(`  ${label} page ${page} failed: ${err.message}`);
      hasMore = false;
    }
  }

  console.log(`  ${label} result: found ${found}, new ${inserted}, merged ${merged}`);
  return { found, inserted, merged };
}

/**
 * Main entry point.
 */
async function main() {
  console.log('Starting Vind-een-Coach.nl collector...');

  const allowed = await checkRobotsTxt();
  if (!allowed) {
    console.error('robots.txt disallows scraping. Aborting.');
    process.exit(1);
  }

  let totalFound = 0;
  let totalInserted = 0;
  let totalMerged = 0;

  // Browse by province
  console.log('\n--- Browsing by province ---');
  for (const slug of PROVINCE_SLUGS) {
    const result = await scrapeSection(slug, slug);
    totalFound += result.found;
    totalInserted += result.inserted;
    totalMerged += result.merged;

    await sql`
      INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
      VALUES ('vind_een_coach', ${slug}, 'NL', ${result.found}, ${result.inserted}, 'completed')
    `.catch(() => {});

    await sleep(1000);
  }

  // Browse by specialty
  console.log('\n--- Browsing by specialty ---');
  for (const slug of SPECIALTY_SLUGS) {
    const result = await scrapeSection(slug, slug);
    totalFound += result.found;
    totalInserted += result.inserted;
    totalMerged += result.merged;

    await sql`
      INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
      VALUES ('vind_een_coach', ${slug}, 'NL', ${result.found}, ${result.inserted}, 'completed')
    `.catch(() => {});

    await sleep(1000);
  }

  // Final summary
  const [{ count }] = await sql`SELECT COUNT(*) AS count FROM coaches WHERE 'vind_een_coach' = ANY(data_sources)`;
  console.log('\n=== Vind-een-Coach.nl Summary ===');
  console.log(`  Coaches found:      ${totalFound}`);
  console.log(`  New coaches added:  ${totalInserted}`);
  console.log(`  Existing enriched:  ${totalMerged}`);
  console.log(`  Total with VEC data:${count}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
