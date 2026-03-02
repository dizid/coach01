import 'dotenv/config';
import { execFileSync } from 'child_process';
import { sql } from './utils/db.js';

/**
 * Run a script phase synchronously and stream its output to the console.
 * @param {string} label Human-readable phase label
 * @param {string} scriptPath Absolute or relative path to the script
 */
function runPhase(label, scriptPath) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PHASE: ${label}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execFileSync(process.execPath, [scriptPath], {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (err) {
    console.error(`\nPhase "${label}" failed with exit code ${err.status}`);
    console.error('Continuing to next phase...\n');
  }
}

/**
 * Print a final summary of all coaches in the database.
 */
async function printSummary() {
  const [{ total }] = await sql`SELECT COUNT(*) AS total FROM coaches WHERE active = TRUE`;
  const [{ enriched }] = await sql`SELECT COUNT(*) AS enriched FROM coaches WHERE enriched = TRUE AND active = TRUE`;
  const [{ google }] = await sql`SELECT COUNT(*) AS google FROM coaches WHERE source = 'google_places' AND active = TRUE`;
  const [{ nobco }] = await sql`SELECT COUNT(*) AS nobco FROM coaches WHERE source = 'nobco' AND active = TRUE`;

  const byCity = await sql`
    SELECT city, COUNT(*) AS count
    FROM coaches
    WHERE active = TRUE AND city IS NOT NULL AND city != ''
    GROUP BY city
    ORDER BY count DESC
    LIMIT 10
  `;

  console.log(`\n${'='.repeat(60)}`);
  console.log('PIPELINE COMPLETE — FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total active coaches: ${total}`);
  console.log(`  From Google Places:   ${google}`);
  console.log(`  From NOBCO:           ${nobco}`);
  console.log(`  Enriched (website):   ${enriched}`);
  console.log('');
  console.log('  Top 10 cities:');
  byCity.forEach(({ city, count }) => {
    console.log(`    ${city.padEnd(25)} ${count}`);
  });
  console.log('');
}

async function main() {
  const startTime = Date.now();
  console.log('=== Coach Finder Data Pipeline ===');
  console.log(`Started at: ${new Date().toISOString()}`);

  // Phase 1: Google Places — primary data source
  runPhase('Google Places Collector', new URL('./collectors/google-places.js', import.meta.url).pathname);

  // Phase 2: NOBCO scraper — secondary / enrichment source
  runPhase('NOBCO Directory Scraper', new URL('./collectors/nobco-scraper.js', import.meta.url).pathname);

  // Phase 3: Website enrichment — visits coach websites for extra data
  runPhase('Website Enricher', new URL('./enrichment/website-enricher.js', import.meta.url).pathname);

  // Final summary
  await printSummary();

  const durationMs = Date.now() - startTime;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.round((durationMs % 60000) / 1000);
  console.log(`  Total duration: ${minutes}m ${seconds}s`);
}

main().catch((err) => {
  console.error('Fatal pipeline error:', err);
  process.exit(1);
});
