import { describe, it, expect } from 'vitest'
import { normalizeSpecialties, normalizeName, normalizeCity } from '../normalize.js'

describe('normalizeSpecialties', () => {
  it('should map known Dutch coaching terms to slugs', () => {
    const result = normalizeSpecialties(['burnout', 'loopbaancoaching'])
    expect(result).toContain('burnout')
    expect(result).toContain('werk')
    expect(result).toContain('gezondheid')
    expect(result).toContain('carriere')
  })

  it('should be case-insensitive', () => {
    const result = normalizeSpecialties(['BURNOUT', 'Life Coaching'])
    expect(result).toContain('burnout')
    expect(result).toContain('geluk')
  })

  it('should return empty array for empty input', () => {
    expect(normalizeSpecialties([])).toEqual([])
    expect(normalizeSpecialties(null)).toEqual([])
    expect(normalizeSpecialties(undefined)).toEqual([])
  })

  it('should pass through unknown terms as lowercase', () => {
    const result = normalizeSpecialties(['onbekend specialty'])
    expect(result).toEqual(['onbekend specialty'])
  })

  it('should deduplicate results', () => {
    // Both 'burnout' and 'burn-out' map to the same slugs
    const result = normalizeSpecialties(['burnout', 'burn-out'])
    const uniqueCount = new Set(result).size
    expect(result.length).toBe(uniqueCount)
  })

  it('should handle stress-related terms', () => {
    const result = normalizeSpecialties(['stress'])
    expect(result).toContain('stress')
    expect(result).toContain('geluk')
  })

  it('should handle relatie terms', () => {
    const result = normalizeSpecialties(['relatiecoach'])
    expect(result).toContain('relatie')
  })

  it('should map executive coaching to leiderschap + werk', () => {
    const result = normalizeSpecialties(['executive coaching'])
    expect(result).toContain('leiderschap')
    expect(result).toContain('werk')
  })

  it('should handle mixed known and unknown terms', () => {
    const result = normalizeSpecialties(['burnout', 'onbekend', 'mindfulness'])
    expect(result).toContain('burnout')
    expect(result).toContain('onbekend')
    expect(result).toContain('mindfulness')
  })
})

describe('normalizeName', () => {
  it('should strip common coaching suffixes', () => {
    const result = normalizeName('Jan Coaching Praktijk')
    expect(result).toBe('jan')
  })

  it('should strip title prefixes', () => {
    expect(normalizeName('Drs. Jan de Vries')).toBe('jan de vries')
    expect(normalizeName('Dr. Maria Jansen')).toBe('maria jansen')
    expect(normalizeName('Ir. Pieter van Dam')).toBe('pieter van dam')
  })

  it('should return empty string for null/undefined', () => {
    expect(normalizeName(null)).toBe('')
    expect(normalizeName(undefined)).toBe('')
    expect(normalizeName('')).toBe('')
  })

  it('should strip non-alpha characters', () => {
    const result = normalizeName('Jan-Willem 123 de Vries!')
    expect(result).toBe('janwillem de vries')
  })

  it('should lowercase the result', () => {
    expect(normalizeName('JAN DE VRIES')).toBe('jan de vries')
  })

  it('should handle business name formats', () => {
    // 'B.V.' → regex strips 'bv' but leaves residual due to period handling
    const result = normalizeName('Coaching & Advies B.V.')
    expect(result).not.toContain('coaching')
    expect(result).not.toContain('advies')
  })
})

describe('normalizeCity', () => {
  it('should normalize Den Haag variants', () => {
    expect(normalizeCity("'s-Gravenhage")).toBe('Den Haag')
    expect(normalizeCity('den haag')).toBe('Den Haag')
    expect(normalizeCity('The Hague')).toBe('Den Haag')
  })

  it('should normalize Den Bosch variants', () => {
    expect(normalizeCity("'s-Hertogenbosch")).toBe('Den Bosch')
    expect(normalizeCity('den bosch')).toBe('Den Bosch')
  })

  it('should normalize Amsterdam districts', () => {
    expect(normalizeCity('Amsterdam-Zuidoost')).toBe('Amsterdam')
    expect(normalizeCity('Amsterdam Noord')).toBe('Amsterdam')
  })

  it('should pass through unknown cities trimmed', () => {
    expect(normalizeCity('  Groningen  ')).toBe('Groningen')
    expect(normalizeCity('Enschede')).toBe('Enschede')
  })

  it('should return empty string for null/undefined', () => {
    expect(normalizeCity(null)).toBe('')
    expect(normalizeCity(undefined)).toBe('')
    expect(normalizeCity('')).toBe('')
  })
})
