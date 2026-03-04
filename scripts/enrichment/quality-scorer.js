import 'dotenv/config';
import { sql } from '../utils/db.js';

/**
 * Calculate quality score for a coach record (0-100).
 * Scores based on field completeness and data richness.
 * @param {Object} coach - Full coach row from DB
 * @returns {number} Score 0-100
 */
export function calculateQualityScore(coach) {
  let score = 0;

  // Identity (max 20 points)
  if (coach.name) score += 5;
  if (coach.city) score += 5;
  if (coach.province) score += 3;
  if (coach.location) score += 2;
  if (coach.latitude && coach.longitude) score += 3;
  if (coach.image) score += 2;

  // Contact (max 20 points)
  if (coach.website) score += 8;
  if (coach.email) score += 7;
  if (coach.phone) score += 5;

  // Professional (max 35 points)
  if (coach.bio && coach.bio.length > 100) score += 10;
  else if (coach.bio && coach.bio.length > 0) score += 5;
  if (coach.specialties?.length > 0) score += 8;
  if (coach.specialties?.length > 2) score += 4;
  if (coach.certifications?.length > 0) score += 8;
  if (coach.languages?.length > 1) score += 3;
  if (coach.experience) score += 2;

  // Pricing (max 10 points)
  if (coach.price) score += 10;

  // Trust signals (max 15 points)
  if (coach.rating) score += 5;
  if (coach.review_count > 0) score += 3;
  if (coach.review_count > 5) score += 2;
  if (coach.kvk_number) score += 3;
  if (coach.data_sources?.length > 1) score += 2;

  return Math.min(score, 100);
}

/**
 * Main entry point — score all active coaches and update the DB.
 */
async function main() {
  console.log('Starting quality scorer...');

  const coaches = await sql`SELECT * FROM coaches WHERE active = TRUE`;
  console.log(`Scoring ${coaches.length} coaches...`);

  let updated = 0;
  for (const coach of coaches) {
    const score = calculateQualityScore(coach);
    await sql`UPDATE coaches SET quality_score = ${score} WHERE id = ${coach.id}`;
    updated++;
  }

  // Print quality distribution
  const distribution = await sql`
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

  console.log('\n=== Quality Score Distribution ===');
  for (const row of distribution) {
    const bar = '█'.repeat(Math.round(Number(row.count) / 50));
    console.log(`  ${row.grade.padEnd(12)} ${String(row.count).padStart(5)} ${bar}`);
  }
  console.log(`\n  Average quality score: ${avg_score}`);
  console.log(`  Coaches scored: ${updated}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
