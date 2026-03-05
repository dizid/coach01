/**
 * Canonical display names for life satisfaction areas.
 * Used in coach matching, results display, and email templates.
 */
export const AREA_DISPLAY_NAMES = {
  werk: 'Werk & Carrière',
  sociaal: 'Sociaal Leven',
  relatie: 'Relaties',
  financieel: 'Financiën',
  geluk: 'Geluk & Welzijn',
  gezondheid: 'Gezondheid',
  praktisch: 'Praktische Zaken',
}

/**
 * Get human-readable display name for a life area.
 * @param {string} area - Internal area key (e.g. 'werk', 'sociaal')
 * @returns {string} Display name
 */
export function getAreaDisplayName(area) {
  return AREA_DISPLAY_NAMES[area] || area
}
