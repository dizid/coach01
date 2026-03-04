import 'dotenv/config';
import * as cheerio from 'cheerio';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeSpecialties, normalizeCity, normalizeName } from '../utils/normalize.js';
import { findDuplicate, mergeCoachData } from '../utils/dedup.js';
import { CITY_TO_PROVINCE } from '../data/dutch-municipalities.js';

const BASE_URL = 'https://www.nobco.nl';
const USER_AGENT = 'CoachFinder Bot 1.0 (educational/research - contact: info@dizid.nl)';
// Polite rate limit: 1 request per 2 seconds
const REQUEST_DELAY_MS = 2000;
const FETCH_TIMEOUT_MS = 15000;

// NOBCO has 4 coach sitemaps with ~700 profiles each (~2,800 total)
const COACH_SITEMAPS = [
  `${BASE_URL}/coach-sitemap.xml`,
  `${BASE_URL}/coach-sitemap2.xml`,
  `${BASE_URL}/coach-sitemap3.xml`,
  `${BASE_URL}/coach-sitemap4.xml`,
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with timeout and polite headers.
 * @param {string} url
 * @returns {Promise<string>} response text
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
        'Accept-Language': 'nl-NL,nl;q=0.9',
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
 * Parse coach profile URLs from a sitemap XML.
 * @param {string} xml
 * @returns {string[]} array of profile URLs
 */
function parseSitemap(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls = [];

  $('url > loc').each((_, el) => {
    const url = $(el).text().trim();
    if (url.includes('/coach/')) {
      urls.push(url);
    }
  });

  return urls;
}

/**
 * Parse a NOBCO coach profile page for structured data.
 * @param {string} html
 * @param {string} profileUrl
 * @returns {Object}
 */
function parseProfile(html, profileUrl) {
  const $ = cheerio.load(html);
  const fullText = $('body').text().replace(/\s+/g, ' ').trim();

  // Name: usually in the main heading
  let name = '';
  $('h1').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 2 && text.length < 100) {
      name = text;
      return false;
    }
  });

  // Bio: search for "over mij", profile description, or large text blocks
  let bio = '';
  $('[class*="bio"], [class*="about"], [class*="description"], [class*="profiel"], [class*="content"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > bio.length && text.length < 5000) bio = text;
  });

  // Also check for headings with "over" or profile sections
  $('h2, h3, h4').each((_, el) => {
    const heading = $(el).text().toLowerCase();
    if (heading.includes('over') || heading.includes('profiel') || heading.includes('werkwijze')) {
      let text = '';
      $(el).nextAll('p, div').slice(0, 4).each((__, sib) => {
        text += ' ' + $(sib).text().trim();
      });
      if (text.trim().length > bio.length) bio = text.trim();
    }
  });

  // Fallback bio from meta
  if (bio.length < 50) {
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    if (metaDesc.length > bio.length) bio = metaDesc;
  }

  // Specialties: look for specific sections and extract keywords
  const rawSpecialties = [];
  $('[class*="special"], [class*="expertise"], [class*="thema"], [class*="aanbod"]').each((_, el) => {
    $(el).find('li, span, a, p').each((__, item) => {
      const text = $(item).text().trim();
      if (text && text.length < 80) rawSpecialties.push(text);
    });
    if (rawSpecialties.length === 0) {
      const text = $(el).text().trim();
      text.split(/[,;]/).forEach((s) => {
        const trimmed = s.trim();
        if (trimmed && trimmed.length < 80) rawSpecialties.push(trimmed);
      });
    }
  });

  // Also detect specialties from full text keywords
  const keywordSpecialties = [
    'burnout', 'stress', 'loopbaan', 'leiderschap', 'relatie',
    'mindfulness', 'persoonlijke groei', 'zelfvertrouwen', 'business',
    'executive', 'carriere', 'communicatie', 'balans', 'gezondheid',
    'life coach', 'team', 'angst', 'verandering',
  ];
  const textLower = fullText.toLowerCase();
  for (const kw of keywordSpecialties) {
    if (textLower.includes(kw)) rawSpecialties.push(kw);
  }

  // Certifications
  const certifications = [];
  const certKeywords = ['nobco', 'emcc', 'icf', 'noloc', 'eqa', 'certified', 'gecertificeerd', 'accreditatie', 'register'];
  $('p, li, span, [class*="cert"], [class*="accred"], [class*="keurmerk"]').each((_, el) => {
    const text = $(el).text().trim();
    if (certKeywords.some((kw) => text.toLowerCase().includes(kw)) && text.length < 200) {
      certifications.push(text.slice(0, 100));
    }
  });

  // Always add NOBCO as certification since this is the NOBCO directory
  if (!certifications.some((c) => c.toLowerCase().includes('nobco'))) {
    certifications.push('NOBCO geregistreerd');
  }

  // Website (external link)
  let website = null;
  $('a[href^="http"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.includes('nobco.nl') && !href.includes('mailto:') &&
        !href.includes('facebook.com') && !href.includes('linkedin.com') &&
        !href.includes('twitter.com') && !href.includes('instagram.com')) {
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

  // Location / city
  let location = '';
  let city = '';
  $('[class*="location"], [class*="address"], [class*="locatie"], [class*="stad"], [class*="plaats"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 0 && text.length < 200 && text.length > location.length) {
      location = text;
    }
  });

  // Try to extract city from location
  if (location) {
    const cityMatch = location.match(/\d{4}\s*[A-Z]{2}\s+([A-Za-z\s]+)/) ||
                      location.match(/\b([A-Z][a-z]+(?: [a-z]+ )?[A-Z][a-z]+)\s*$/);
    if (cityMatch) city = cityMatch[1].trim();
  }

  // Also check for structured address data
  if (!city) {
    $('[itemprop="addressLocality"], [class*="city"]').each((_, el) => {
      city = $(el).text().trim();
      return false;
    });
  }

  return {
    name,
    bio: bio.slice(0, 2000),
    specialties: normalizeSpecialties(rawSpecialties),
    certifications: [...new Set(certifications)].slice(0, 10),
    website,
    email,
    phone,
    location,
    city: normalizeCity(city),
    source_url: profileUrl,
  };
}

/**
 * Upsert or enrich a coach from NOBCO data.
 * @param {Object} coach
 * @returns {Promise<'inserted'|'merged'|'skipped'>}
 */
async function upsertNobcoCoach(coach) {
  if (!coach.name || coach.name.length < 3) return 'skipped';

  const province = CITY_TO_PROVINCE[coach.city] || null;
  const existingId = await findDuplicate(coach);

  if (existingId) {
    // Merge NOBCO data into existing record
    await mergeCoachData(existingId, {
      ...coach,
      province,
      name_normalized: normalizeName(coach.name),
    }, 'nobco');

    // Also update certifications and specialties if we have better data
    if (coach.certifications?.length > 0) {
      await sql`
        UPDATE coaches SET
          certifications = CASE
            WHEN array_length(certifications, 1) IS NULL OR array_length(certifications, 1) < ${coach.certifications.length}
            THEN ${coach.certifications}
            ELSE certifications
          END
        WHERE id = ${existingId}
      `;
    }
    if (coach.specialties?.length > 0) {
      await sql`
        UPDATE coaches SET
          specialties = CASE
            WHEN array_length(specialties, 1) IS NULL OR array_length(specialties, 1) < ${coach.specialties.length}
            THEN ${coach.specialties}
            ELSE specialties
          END
        WHERE id = ${existingId}
      `;
    }

    return 'merged';
  }

  // Insert new coach
  try {
    await sql`
      INSERT INTO coaches (
        name, bio, specialties, certifications, city, province, location,
        website, email, phone, source, source_url, name_normalized, data_sources,
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
        ${coach.phone || null},
        'nobco',
        ${coach.source_url},
        ${normalizeName(coach.name)},
        ${['nobco']},
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
 * Main entry point — scrape NOBCO coach profiles via sitemaps.
 */
async function main() {
  console.log('Starting NOBCO scraper (sitemap-based)...');
  console.log(`Sitemaps to process: ${COACH_SITEMAPS.length}`);

  let totalFound = 0;
  let totalInserted = 0;
  let totalMerged = 0;
  let totalFailed = 0;

  for (const sitemapUrl of COACH_SITEMAPS) {
    console.log(`\nFetching sitemap: ${sitemapUrl}`);

    let sitemapXml;
    try {
      sitemapXml = await fetchPage(sitemapUrl);
    } catch (err) {
      console.error(`  Failed to fetch sitemap: ${err.message}`);
      continue;
    }

    const profileUrls = parseSitemap(sitemapXml);
    console.log(`  Found ${profileUrls.length} coach profiles`);
    totalFound += profileUrls.length;

    for (let i = 0; i < profileUrls.length; i++) {
      const profileUrl = profileUrls[i];

      try {
        const html = await fetchPage(profileUrl);
        const coach = parseProfile(html, profileUrl);

        if (!coach.name) {
          totalFailed++;
          continue;
        }

        const action = await upsertNobcoCoach(coach);
        if (action === 'inserted') totalInserted++;
        if (action === 'merged') totalMerged++;

        if ((i + 1) % 50 === 0) {
          console.log(`    Progress: ${i + 1}/${profileUrls.length} — new: ${totalInserted}, merged: ${totalMerged}`);
        }
      } catch (err) {
        totalFailed++;
        if ((i + 1) % 100 === 0) {
          console.error(`    Failed ${profileUrl}: ${err.message}`);
        }
      }

      // Polite delay
      await sleep(REQUEST_DELAY_MS);
    }

    // Log run for this sitemap
    const sitemapName = sitemapUrl.split('/').pop();
    await sql`
      INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status)
      VALUES ('nobco', ${sitemapName}, 'NL', ${profileUrls.length}, ${totalInserted}, 'completed')
    `.catch(() => {});
  }

  // Final summary
  const [{ count }] = await sql`SELECT COUNT(*) AS count FROM coaches WHERE 'nobco' = ANY(data_sources)`;
  console.log('\n=== NOBCO Scraper Summary ===');
  console.log(`  Profiles found:     ${totalFound}`);
  console.log(`  New coaches added:  ${totalInserted}`);
  console.log(`  Existing enriched:  ${totalMerged}`);
  console.log(`  Failed to parse:    ${totalFailed}`);
  console.log(`  Total with NOBCO:   ${count}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
