import 'dotenv/config';
import pLimit from 'p-limit';
import { sql } from '../utils/db.js';
import { fetchIPv4 } from '../utils/fetch-ipv4.js';
import { normalizeCity, normalizeName } from '../utils/normalize.js';
import { MUNICIPALITIES } from '../data/dutch-municipalities.js';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');

const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

// Use municipalities data file — 150 cities instead of original 40
const CITIES = MUNICIPALITIES.map((m) => m.name);

// Province lookup from municipalities data
const CITY_PROVINCE = {};
for (const m of MUNICIPALITIES) {
  CITY_PROVINCE[m.name] = m.province;
}

// 25 coaching search terms (expanded from 17)
const SEARCH_TERMS = [
  'life coach',
  'loopbaancoach',
  'burnout coach',
  'relatiecoach',
  'executive coach',
  'mindfulness coach',
  'health coach',
  'carriere coach',
  'persoonlijke coach',
  'mental coach',
  'stresscoach',
  'gezondheidscoach',
  'business coach',
  'coaching praktijk',
  'NLP coach',
  'personal coach',
  'career coach',
  // New terms
  'teamcoach',
  'organisatiecoach',
  'coach voor ondernemers',
  'HSP coach',
  'ADHD coach',
  'rouwcoach',
  'opvoedcoach',
  'financieel coach',
];

// Max 2 concurrent API requests to respect rate limits
const limit = pLimit(2);

// Optional budget cap: max API requests per run (0 = unlimited)
const MAX_REQUESTS = parseInt(process.env.GOOGLE_MAX_REQUESTS || '0', 10);
let requestCount = 0;

/**
 * Search Google Places API for a given term and city.
 * @param {string} searchTerm
 * @param {string} city
 * @returns {Promise<Object[]>} array of raw place objects
 */
async function searchPlaces(searchTerm, city) {
  if (MAX_REQUESTS > 0 && requestCount >= MAX_REQUESTS) {
    return []; // Budget cap reached
  }
  requestCount++;

  const response = await fetchIPv4(PLACES_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
        'places.websiteUri',
        'places.nationalPhoneNumber',
        'places.googleMapsUri',
        'places.businessStatus',
        'places.location',
        'places.regularOpeningHours',
        'places.photos',
      ].join(','),
    },
    body: JSON.stringify({
      textQuery: `${searchTerm} ${city} Nederland`,
      languageCode: 'nl',
      regionCode: 'NL',
      maxResultCount: 20,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Places API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.places || [];
}

/**
 * Extract city name from a formatted address string.
 * The city is typically the second-to-last component before the country.
 * @param {string} address
 * @returns {string}
 */
function extractCityFromAddress(address) {
  if (!address) return '';
  // Format: "Street 1, 1234 AB City, Netherlands"
  const parts = address.split(',').map((p) => p.trim());
  // Find component that looks like "XXXX XX CityName"
  for (let i = parts.length - 2; i >= 0; i--) {
    const match = parts[i].match(/^\d{4}\s+[A-Z]{2}\s+(.+)$/);
    if (match) return match[1].trim();
    // Or just a plain city name (no postal code)
    if (i > 0 && !parts[i].match(/^\d/) && !parts[i].toLowerCase().includes('nederland')) {
      return parts[i].trim();
    }
  }
  return '';
}

/**
 * Build a photo URL from a Google Places photo resource name.
 * @param {string} photoResourceName
 * @returns {string}
 */
function buildPhotoUrl(photoResourceName) {
  return `https://places.googleapis.com/v1/${photoResourceName}/media?maxHeightPx=400&maxWidthPx=400&key=${API_KEY}`;
}

/**
 * Determine a human-readable availability string from opening hours.
 * @param {Object} regularOpeningHours
 * @returns {string}
 */
function extractAvailability(regularOpeningHours) {
  if (!regularOpeningHours) return null;
  if (regularOpeningHours.openNow === true) return 'Nu open';
  if (regularOpeningHours.weekdayDescriptions?.length > 0) {
    // Return a short summary (first weekday)
    return regularOpeningHours.weekdayDescriptions.slice(0, 3).join('; ');
  }
  return null;
}

/**
 * Upsert a single coach into the database.
 * Uses ON CONFLICT on google_place_id to update existing records.
 * @param {Object} coach
 * @returns {Promise<{ inserted: boolean }>}
 */
async function upsertCoach(coach) {
  const rows = await sql`
    INSERT INTO coaches (
      name, location, city, province, latitude, longitude,
      rating, review_count, website, phone,
      google_place_id, image, availability, source, source_url,
      name_normalized, data_sources,
      active, enriched
    ) VALUES (
      ${coach.name},
      ${coach.location},
      ${coach.city},
      ${coach.province},
      ${coach.latitude},
      ${coach.longitude},
      ${coach.rating},
      ${coach.review_count},
      ${coach.website},
      ${coach.phone},
      ${coach.google_place_id},
      ${coach.image},
      ${coach.availability},
      ${coach.source},
      ${coach.source_url},
      ${coach.name_normalized},
      ${['google_places']},
      TRUE,
      FALSE
    )
    ON CONFLICT (google_place_id) DO UPDATE SET
      name        = EXCLUDED.name,
      rating      = COALESCE(EXCLUDED.rating, coaches.rating),
      review_count = COALESCE(EXCLUDED.review_count, coaches.review_count),
      website     = COALESCE(EXCLUDED.website, coaches.website),
      phone       = COALESCE(EXCLUDED.phone, coaches.phone),
      image       = COALESCE(EXCLUDED.image, coaches.image),
      availability = COALESCE(EXCLUDED.availability, coaches.availability),
      province    = COALESCE(EXCLUDED.province, coaches.province),
      name_normalized = COALESCE(EXCLUDED.name_normalized, coaches.name_normalized),
      data_sources = CASE
        WHEN 'google_places' = ANY(coaches.data_sources) THEN coaches.data_sources
        ELSE array_append(coaches.data_sources, 'google_places')
      END,
      updated_at  = NOW()
    RETURNING (xmax = 0) AS inserted
  `;
  return { inserted: rows[0]?.inserted ?? false };
}

/**
 * Log a collection run to the database.
 * @param {{ source: string, search_term: string, city: string, coaches_found: number, coaches_new: number, status: string, duration_ms?: number, errors?: number }} run
 */
async function logRun(run) {
  try {
    await sql`
      INSERT INTO collection_runs (source, search_term, city, coaches_found, coaches_new, status, duration_ms, errors)
      VALUES (${run.source}, ${run.search_term}, ${run.city}, ${run.coaches_found}, ${run.coaches_new}, ${run.status}, ${run.duration_ms || null}, ${run.errors || 0})
    `;
  } catch (err) {
    console.error('Failed to log collection run:', err.message);
  }
}

/**
 * Process one search term + city combination.
 * @param {string} searchTerm
 * @param {string} city
 * @returns {Promise<{ found: number, inserted: number }>}
 */
async function processSearch(searchTerm, city) {
  let found = 0;
  let inserted = 0;
  let errors = 0;
  const startTime = Date.now();

  try {
    const places = await searchPlaces(searchTerm, city);
    found = places.length;

    for (const place of places) {
      try {
        // Skip places that are permanently closed
        if (place.businessStatus === 'CLOSED_PERMANENTLY') continue;

        const rawCity = extractCityFromAddress(place.formattedAddress || '');
        const normalizedCity = normalizeCity(rawCity || city);
        const photoUrl = place.photos?.[0]?.name
          ? buildPhotoUrl(place.photos[0].name)
          : null;

        // Look up province from our municipality data
        const province = CITY_PROVINCE[normalizedCity] || CITY_PROVINCE[city] || null;

        const coach = {
          name: place.displayName?.text || '',
          location: place.formattedAddress || null,
          city: normalizedCity,
          province,
          latitude: place.location?.latitude ?? null,
          longitude: place.location?.longitude ?? null,
          rating: place.rating ?? null,
          review_count: place.userRatingCount ?? 0,
          website: place.websiteUri || null,
          phone: place.nationalPhoneNumber || null,
          google_place_id: place.id,
          image: photoUrl,
          availability: extractAvailability(place.regularOpeningHours),
          source: 'google_places',
          source_url: place.googleMapsUri || null,
          name_normalized: normalizeName(place.displayName?.text || ''),
        };

        if (!coach.name || !coach.google_place_id) continue;

        const result = await upsertCoach(coach);
        if (result.inserted) inserted++;
      } catch (err) {
        errors++;
        console.error(`  Error upserting place "${place.displayName?.text}": ${err.message}`);
      }
    }
  } catch (err) {
    errors++;
    console.error(`  Search failed [${searchTerm} / ${city}]: ${err.message}`);
  }

  await logRun({
    source: 'google_places',
    search_term: searchTerm,
    city,
    coaches_found: found,
    coaches_new: inserted,
    status: errors > 0 ? 'completed_with_errors' : 'completed',
    duration_ms: Date.now() - startTime,
    errors,
  });

  return { found, inserted };
}

/**
 * Main entry point — run all city × search term combinations.
 */
async function main() {
  const total = CITIES.length * SEARCH_TERMS.length;
  console.log(`Starting Google Places collection: ${CITIES.length} cities × ${SEARCH_TERMS.length} terms = ${total} searches`);
  if (MAX_REQUESTS > 0) {
    console.log(`Budget cap: ${MAX_REQUESTS} API requests`);
  }

  let totalFound = 0;
  let totalInserted = 0;
  let completed = 0;

  const tasks = [];

  for (const city of CITIES) {
    for (const term of SEARCH_TERMS) {
      tasks.push(
        limit(async () => {
          const result = await processSearch(term, city);
          totalFound += result.found;
          totalInserted += result.inserted;
          completed++;

          if (completed % 50 === 0 || completed === total) {
            console.log(`  Progress: ${completed}/${total} searches — found ${totalFound}, new ${totalInserted}`);
          }
        })
      );
    }
  }

  await Promise.all(tasks);

  // Final summary
  const [{ count }] = await sql`SELECT COUNT(*) AS count FROM coaches WHERE source = 'google_places'`;
  console.log('\n=== Google Places Collection Summary ===');
  console.log(`  Searches completed: ${completed}`);
  console.log(`  Results found:      ${totalFound}`);
  console.log(`  New coaches added:  ${totalInserted}`);
  console.log(`  Total in DB:        ${count}`);
  if (MAX_REQUESTS > 0) {
    console.log(`  API requests used:  ${requestCount}/${MAX_REQUESTS}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
