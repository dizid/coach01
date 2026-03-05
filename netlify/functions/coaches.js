import { getSql } from './utils/db.js'
import { corsHeaders } from './utils/cors.js'

const CORS = corsHeaders('GET, OPTIONS')

/**
 * Map a database row (snake_case) to the camelCase shape the frontend expects.
 */
function mapCoach(row) {
  return {
    id: row.id,
    name: row.name,
    specialties: row.specialties ?? [],
    bio: row.bio,
    experience: row.experience,
    location: row.location,
    city: row.city,
    province: row.province,
    latitude: row.latitude,
    longitude: row.longitude,
    rating: row.rating != null ? parseFloat(row.rating) : null,
    reviewCount: row.review_count,
    price: row.price,
    priceType: row.price_type,
    image: row.image,
    certifications: row.certifications ?? [],
    approach: row.approach,
    sessionsCompleted: row.sessions_completed,
    responseTime: row.response_time,
    languages: row.languages ?? [],
    availability: row.availability,
    commissionRate: row.commission_rate,
  }
}

export default async (request, context) => {
  // Handle preflight CORS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: CORS,
    })
  }

  const sql = getSql()

  try {
    const url = new URL(request.url)
    const params = url.searchParams

    const id        = params.get('id')
    const location  = params.get('location')
    const maxPrice  = params.get('maxPrice')
    const minRating = params.get('minRating')
    const specialty = params.get('specialty')
    const limit     = Math.min(parseInt(params.get('limit')  ?? '200', 10), 1000)
    const offset    = Math.max(parseInt(params.get('offset') ?? '0',   10), 0)

    // Single-coach lookup
    if (id) {
      const rows = await sql`
        SELECT * FROM coaches
        WHERE id = ${parseInt(id, 10)} AND active = TRUE
        LIMIT 1
      `

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Coach not found' }), {
          status: 404,
          headers: CORS,
        })
      }

      return new Response(JSON.stringify(mapCoach(rows[0])), {
        status: 200,
        headers: CORS,
      })
    }

    // List coaches with optional filters
    const locationFilter = location || null
    const priceFilter    = maxPrice ? parseInt(maxPrice, 10) : null
    const ratingFilter   = minRating ? parseFloat(minRating) : null
    const specialtyFilter = specialty || null

    const countRows = await sql`
      SELECT COUNT(*) AS total FROM coaches
      WHERE active = TRUE
        AND (${locationFilter}::text IS NULL OR location ILIKE ${'%' + (locationFilter || '') + '%'})
        AND (${priceFilter}::int IS NULL OR price <= ${priceFilter})
        AND (${ratingFilter}::numeric IS NULL OR rating >= ${ratingFilter})
        AND (${specialtyFilter}::text IS NULL OR ${specialtyFilter} = ANY(specialties))
    `
    const total = parseInt(countRows[0].total, 10)

    const rows = await sql`
      SELECT * FROM coaches
      WHERE active = TRUE
        AND (${locationFilter}::text IS NULL OR location ILIKE ${'%' + (locationFilter || '') + '%'})
        AND (${priceFilter}::int IS NULL OR price <= ${priceFilter})
        AND (${ratingFilter}::numeric IS NULL OR rating >= ${ratingFilter})
        AND (${specialtyFilter}::text IS NULL OR ${specialtyFilter} = ANY(specialties))
      ORDER BY rating DESC NULLS LAST, review_count DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `

    return new Response(
      JSON.stringify({
        coaches: rows.map(mapCoach),
        total,
        limit,
        offset,
      }),
      { status: 200, headers: CORS }
    )
  } catch (err) {
    console.error('[coaches] error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS,
    })
  }
}

export const config = {
  path: '/api/coaches',
}
