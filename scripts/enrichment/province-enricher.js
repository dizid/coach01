import 'dotenv/config';
import { sql } from '../utils/db.js';
import { CITY_TO_PROVINCE } from '../data/dutch-municipalities.js';

/**
 * Detect province from coach data using city name, address, or coordinates.
 * @param {Object} coach
 * @returns {string|null}
 */
function detectProvince(coach) {
  // 1. Direct city lookup
  if (coach.city) {
    const province = CITY_TO_PROVINCE[coach.city];
    if (province) return province;

    // Try case-insensitive match
    const cityLower = coach.city.toLowerCase();
    for (const [city, prov] of Object.entries(CITY_TO_PROVINCE)) {
      if (city.toLowerCase() === cityLower) return prov;
    }
  }

  // 2. Parse city from address string and look up
  if (coach.location) {
    for (const [city, province] of Object.entries(CITY_TO_PROVINCE)) {
      if (coach.location.includes(city)) return province;
    }
  }

  // 3. Rough coordinate-based detection (bounding boxes per province)
  if (coach.latitude && coach.longitude) {
    return detectProvinceFromCoords(coach.latitude, coach.longitude);
  }

  return null;
}

/**
 * Detect province from lat/lng using approximate bounding boxes.
 * These are rough boundaries — good enough for 95%+ accuracy.
 * @param {number} lat
 * @param {number} lng
 * @returns {string|null}
 */
function detectProvinceFromCoords(lat, lng) {
  // Ordered from most specific/small to largest to avoid false matches
  const provinces = [
    { name: 'Flevoland', latMin: 52.25, latMax: 52.70, lngMin: 5.10, lngMax: 6.00 },
    { name: 'Utrecht', latMin: 51.95, latMax: 52.25, lngMin: 4.85, lngMax: 5.65 },
    { name: 'Zeeland', latMin: 51.20, latMax: 51.75, lngMin: 3.35, lngMax: 4.25 },
    { name: 'Limburg', latMin: 50.75, latMax: 51.80, lngMin: 5.55, lngMax: 6.25 },
    { name: 'Drenthe', latMin: 52.60, latMax: 53.15, lngMin: 6.10, lngMax: 7.10 },
    { name: 'Groningen', latMin: 53.05, latMax: 53.55, lngMin: 6.15, lngMax: 7.25 },
    { name: 'Friesland', latMin: 52.85, latMax: 53.50, lngMin: 5.05, lngMax: 6.30 },
    { name: 'Overijssel', latMin: 52.15, latMax: 52.70, lngMin: 5.90, lngMax: 6.95 },
    { name: 'Noord-Holland', latMin: 52.20, latMax: 53.00, lngMin: 4.50, lngMax: 5.30 },
    { name: 'Zuid-Holland', latMin: 51.80, latMax: 52.25, lngMin: 3.85, lngMax: 4.90 },
    { name: 'Noord-Brabant', latMin: 51.25, latMax: 51.85, lngMin: 4.35, lngMax: 5.95 },
    { name: 'Gelderland', latMin: 51.75, latMax: 52.45, lngMin: 5.15, lngMax: 6.30 },
  ];

  for (const p of provinces) {
    if (lat >= p.latMin && lat <= p.latMax && lng >= p.lngMin && lng <= p.lngMax) {
      return p.name;
    }
  }
  return null;
}

/**
 * Main entry point — fill province for all coaches missing it.
 */
async function main() {
  console.log('Starting province enricher...');

  const coaches = await sql`
    SELECT id, name, city, location, latitude, longitude
    FROM coaches
    WHERE active = TRUE AND (province IS NULL OR province = '')
    ORDER BY id
  `;

  console.log(`Found ${coaches.length} coaches without province data`);

  let filled = 0;
  let notFound = 0;

  for (const coach of coaches) {
    const province = detectProvince(coach);
    if (province) {
      await sql`UPDATE coaches SET province = ${province}, updated_at = NOW() WHERE id = ${coach.id}`;
      filled++;
    } else {
      notFound++;
    }
  }

  // Province distribution
  const distribution = await sql`
    SELECT province, COUNT(*) AS count
    FROM coaches
    WHERE active = TRUE AND province IS NOT NULL AND province != ''
    GROUP BY province
    ORDER BY count DESC
  `;

  console.log('\n=== Province Enricher Summary ===');
  console.log(`  Provinces filled:   ${filled}`);
  console.log(`  Could not detect:   ${notFound}`);
  console.log('\n  Province distribution:');
  for (const row of distribution) {
    console.log(`    ${row.province.padEnd(20)} ${row.count}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
