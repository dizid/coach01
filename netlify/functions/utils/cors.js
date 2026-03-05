/**
 * Build CORS headers for Netlify function responses.
 * @param {string} methods - Allowed HTTP methods (default: 'GET, POST, OPTIONS')
 */
export function corsHeaders(methods = 'GET, POST, OPTIONS') {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}
