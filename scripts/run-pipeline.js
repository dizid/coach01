import 'dotenv/config';
import { execFileSync } from 'child_process';
import { sql } from './utils/db.js';

const args = process.argv.slice(2);
const runAll = args.length === 0;
const runCollect = runAll || args.includes('--collect');
const runEnrich = runAll || args.includes('--enrich');
const runScore = runAll || args.includes('--score');
const specificCollector = args.find((a) => a.startsWith('--only='))?.split('=')[1];

/**
 * Run a script phase synchronously and stream its output to the console.
 * @param {string} label Human-readable phase label
 * @param {string} scriptPath Absolute or relative path to the script
 * @param {string[]} extraArgs Extra args to pass to the script
 */
function runPhase(label, scriptPath, extraArgs = []) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PHASE: ${label}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execFileSync(process.execPath, [scriptPath, ...extraArgs], {
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

  // Source breakdown using data_sources array
  const sources = await sql`
    SELECT
      unnest(data_sources) AS source,
      COUNT(DISTINCT id) AS count
    FROM coaches
    WHERE active = TRUE
    GROUP BY source
    ORDER BY count DESC
  `;

  // Quality distribution
  const quality = await sql`
    SELECT
      CASE
        WHEN quality_score >= 80 THEN 'A (80-100)'
        WHEN quality_score >= 60 THEN 'B (60-79)'
        WHEN quality_score >= 40 THEN 'C (40-59)'
        WHEN quality_score >= 20 THEN 'D (20-39)'
        ELSE 'F (0-19)'
      END AS grade,
      COUNT(*) AS count
    FROM coaches WHERE active = TRUE
    GROUP BY grade ORDER BY grade
  `;

  const [{ avg_score }] = await sql`
    SELECT ROUND(AVG(quality_score), 1) AS avg_score FROM coaches WHERE active = TRUE
  `;

  const byCity = await sql`
    SELECT city, COUNT(*) AS count
    FROM coaches
    WHERE active = TRUE AND city IS NOT NULL AND city != ''
    GROUP BY city
    ORDER BY count DESC
    LIMIT 10
  `;

  const byProvince = await sql`
    SELECT province, COUNT(*) AS count
    FROM coaches
    WHERE active = TRUE AND province IS NOT NULL AND province != ''
    GROUP BY province
    ORDER BY count DESC
  `;

  console.log(`\n${'='.repeat(60)}`);
  console.log('PIPELINE COMPLETE — FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total active coaches: ${total}`);
  console.log(`  Enriched (website):   ${enriched}`);
  console.log(`  Average quality score:${avg_score}`);

  console.log('\n  Data sources:');
  for (const { source, count } of sources) {
    console.log(`    ${source.padEnd(20)} ${count}`);
  }

  console.log('\n  Quality distribution:');
  for (const { grade, count } of quality) {
    console.log(`    ${grade.padEnd(12)} ${count}`);
  }

  console.log('\n  Top 10 cities:');
  for (const { city, count } of byCity) {
    console.log(`    ${city.padEnd(25)} ${count}`);
  }

  console.log('\n  By province:');
  for (const { province, count } of byProvince) {
    console.log(`    ${province.padEnd(20)} ${count}`);
  }

  console.log('');
}

async function main() {
  const startTime = Date.now();
  console.log('=== Coach Finder Data Pipeline v2 ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  if (specificCollector) console.log(`Running only: ${specificCollector}`);
  else if (!runAll) console.log(`Phases: ${[runCollect && 'collect', runEnrich && 'enrich', runScore && 'score'].filter(Boolean).join(', ')}`);

  const resolve = (path) => new URL(path, import.meta.url).pathname;

  // Phase 1: Collection
  if (runCollect) {
    if (!specificCollector || specificCollector === 'google') {
      runPhase('Google Places Collector (150 cities × 25 terms)', resolve('./collectors/google-places.js'));
    }
    if (!specificCollector || specificCollector === 'kvk') {
      runPhase('KvK Chamber of Commerce', resolve('./collectors/kvk-collector.js'));
    }
    if (!specificCollector || specificCollector === 'vind') {
      runPhase('Vind-een-Coach.nl', resolve('./collectors/vind-een-coach.js'));
    }
    if (!specificCollector || specificCollector === 'nobco') {
      runPhase('NOBCO Directory (sitemap)', resolve('./collectors/nobco-scraper.js'));
    }
    if (!specificCollector || specificCollector === 'assoc') {
      runPhase('Associations (EMCC/LVSC/ICF)', resolve('./collectors/association-scraper.js'));
    }
  }

  // Phase 2: Enrichment
  if (runEnrich) {
    runPhase('Province Enricher', resolve('./enrichment/province-enricher.js'));
    runPhase('Website Enricher', resolve('./enrichment/website-enricher.js'));
  }

  // Phase 3: Scoring
  if (runScore || runAll) {
    runPhase('Quality Scorer', resolve('./enrichment/quality-scorer.js'));
  }

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
