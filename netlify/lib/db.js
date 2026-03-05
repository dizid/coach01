import { neon, neonConfig } from '@neondatabase/serverless'

// Dev: load .env if DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  try {
    const { config } = await import('dotenv')
    config()
  } catch { /* dotenv not available in production */ }
}

// Force IPv4 to avoid Neon timeout issues in dev
try {
  const { Agent, fetch: undiciFetch } = await import('undici')
  const agent = new Agent({ connect: { family: 4 } })
  neonConfig.fetchFunction = (url, opts) => undiciFetch(url, { ...opts, dispatcher: agent })
} catch { /* undici not available on Netlify — IPv6 works there */ }

/**
 * Get a Neon SQL tagged template function.
 */
export function getSql() {
  return neon(process.env.DATABASE_URL)
}
