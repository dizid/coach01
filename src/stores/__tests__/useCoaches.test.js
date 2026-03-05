import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCoachesStore } from '../useCoaches'

// Mock coaches with known specialties for predictable matching
const mockCoaches = [
  {
    id: 1, name: 'Coach Werk', specialties: ['werk', 'carriere', 'burnout'],
    rating: 4.8, experience: 10, reviewCount: 50, price: 100, location: 'Amsterdam',
    bio: '', image: '', certifications: [], languages: [],
  },
  {
    id: 2, name: 'Coach Relatie', specialties: ['relatie', 'communicatie', 'gezin'],
    rating: 4.5, experience: 5, reviewCount: 20, price: 80, location: 'Rotterdam',
    bio: '', image: '', certifications: [], languages: [],
  },
  {
    id: 3, name: 'Coach Geluk', specialties: ['geluk', 'mindfulness', 'stress'],
    rating: 4.9, experience: 15, reviewCount: 100, price: 120, location: 'Utrecht',
    bio: '', image: '', certifications: [], languages: [],
  },
  {
    id: 4, name: 'Coach Generalist', specialties: ['coaching'],
    rating: 4.2, experience: 3, reviewCount: 5, price: 75, location: 'Amsterdam',
    bio: '', image: '', certifications: [], languages: [],
  },
  {
    id: 5, name: 'Coach Gezondheid', specialties: ['gezondheid', 'energie', 'burnout'],
    rating: 4.6, experience: 8, reviewCount: 30, price: 90, location: 'Den Haag',
    bio: '', image: '', certifications: [], languages: [],
  },
]

describe('useCoachesStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCoachesStore()
    store.allCoaches = [...mockCoaches]
  })

  describe('matchCoaches', () => {
    it('should match coaches based on low satisfaction areas', () => {
      const userAnswers = {
        werk: 30,       // Low → should match werk specialists
        sociaal: 70,    // High → no matching
        relatie: 80,    // High → no matching
        financieel: 70, // High → no matching
        geluk: 70,      // High → no matching
        gezondheid: 70, // High → no matching
        praktisch: 70,  // High → no matching
      }

      store.matchCoaches(userAnswers)

      // Coach Werk should be ranked highest (werk + carriere + burnout match)
      expect(store.matchedCoaches.length).toBeGreaterThan(0)
      expect(store.matchedCoaches[0].name).toBe('Coach Werk')
    })

    it('should not match areas with satisfaction >= 60', () => {
      const userAnswers = {
        werk: 60,       // Exactly 60 — should NOT trigger matching
        sociaal: 70,
        relatie: 80,
        financieel: 70,
        geluk: 70,
        gezondheid: 70,
        praktisch: 70,
      }

      store.matchCoaches(userAnswers)

      // All coaches get only bonus points (rating/experience), no specialty match
      const topCoach = store.matchedCoaches[0]
      expect(topCoach.matchReasons).toEqual([])
    })

    it('should trigger matching at satisfaction 59 (just below threshold)', () => {
      const userAnswers = {
        werk: 59,       // Just below 60 — should trigger matching
        sociaal: 70,
        relatie: 80,
        financieel: 70,
        geluk: 70,
        gezondheid: 70,
        praktisch: 70,
      }

      store.matchCoaches(userAnswers)

      // Coach Werk should have matchReasons since werk: 59 < 60
      const werkCoach = store.matchedCoaches.find(c => c.name === 'Coach Werk')
      expect(werkCoach.matchReasons.length).toBeGreaterThan(0)
    })

    it('should weight lower satisfaction higher (more urgency)', () => {
      // Test: werk: 10 should score higher than werk: 55
      const highUrgency = { werk: 10, sociaal: 70, relatie: 70, financieel: 70, geluk: 70, gezondheid: 70, praktisch: 70 }
      const lowUrgency = { werk: 55, sociaal: 70, relatie: 70, financieel: 70, geluk: 70, gezondheid: 70, praktisch: 70 }

      store.matchCoaches(highUrgency)
      const highScore = store.matchedCoaches.find(c => c.name === 'Coach Werk').matchScore

      store.matchCoaches(lowUrgency)
      const lowScore = store.matchedCoaches.find(c => c.name === 'Coach Werk').matchScore

      expect(highScore).toBeGreaterThan(lowScore)
    })

    it('should rank by rating when specialty scores are equal', () => {
      // Both burnout specialists: Coach Werk (4.8) vs Coach Gezondheid (4.6)
      const userAnswers = {
        werk: 30,
        sociaal: 70,
        relatie: 80,
        financieel: 70,
        geluk: 70,
        gezondheid: 30, // Both burnout coaches match here too
        praktisch: 70,
      }

      store.matchCoaches(userAnswers)

      const werkIdx = store.matchedCoaches.findIndex(c => c.name === 'Coach Werk')
      const gezIdx = store.matchedCoaches.findIndex(c => c.name === 'Coach Gezondheid')
      // Both match on burnout, but Coach Werk has higher rating (4.8 vs 4.6)
      // and more experience, so should rank higher
      expect(werkIdx).toBeLessThan(gezIdx)
    })

    it('should return max 8 matches', () => {
      // Add more coaches to exceed 8
      for (let i = 10; i <= 20; i++) {
        store.allCoaches.push({
          id: i, name: `Extra Coach ${i}`, specialties: ['werk'],
          rating: 4.0, experience: 1, reviewCount: 1, price: 50, location: 'Anywhere',
          bio: '', image: '', certifications: [], languages: [],
        })
      }

      const userAnswers = {
        werk: 10, sociaal: 70, relatie: 70, financieel: 70, geluk: 70, gezondheid: 70, praktisch: 70
      }

      store.matchCoaches(userAnswers)
      expect(store.matchedCoaches.length).toBe(8)
    })

    it('should handle empty coaches array', () => {
      store.allCoaches = []
      const userAnswers = { werk: 30, sociaal: 30, relatie: 30, financieel: 30, geluk: 30, gezondheid: 30, praktisch: 30 }

      store.matchCoaches(userAnswers)
      expect(store.matchedCoaches).toEqual([])
    })

    it('should handle all high satisfaction (no urgent areas)', () => {
      const userAnswers = { werk: 80, sociaal: 90, relatie: 85, financieel: 70, geluk: 75, gezondheid: 80, praktisch: 70 }

      store.matchCoaches(userAnswers)

      // All coaches get only bonus points — matchReasons should be empty for all
      store.matchedCoaches.forEach(c => {
        expect(c.matchReasons).toEqual([])
      })
    })

    it('should handle coach with null rating', () => {
      store.allCoaches.push({
        id: 99, name: 'No Rating Coach', specialties: ['werk'],
        rating: null, experience: null, reviewCount: 0, price: 50, location: 'Anywhere',
        bio: '', image: '', certifications: [], languages: [],
      })

      const userAnswers = { werk: 30, sociaal: 70, relatie: 70, financieel: 70, geluk: 70, gezondheid: 70, praktisch: 70 }
      // Should not throw
      store.matchCoaches(userAnswers)
      const noRating = store.matchedCoaches.find(c => c.id === 99)
      expect(noRating).toBeDefined()
      expect(noRating.matchScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('filteredCoaches', () => {
    it('should filter by location', () => {
      store.updateFilters({ location: 'Amsterdam' })
      const filtered = store.filteredCoaches
      expect(filtered.every(c => c.location.includes('Amsterdam'))).toBe(true)
    })

    it('should filter by maxPrice', () => {
      store.updateFilters({ maxPrice: 90 })
      const filtered = store.filteredCoaches
      expect(filtered.every(c => c.price <= 90)).toBe(true)
    })

    it('should filter by minRating', () => {
      store.updateFilters({ minRating: 4.7 })
      const filtered = store.filteredCoaches
      expect(filtered.every(c => c.rating >= 4.7)).toBe(true)
    })

    it('should combine multiple filters', () => {
      store.updateFilters({ location: 'Amsterdam', maxPrice: 110 })
      const filtered = store.filteredCoaches
      expect(filtered.length).toBe(2) // Coach Werk (100) + Generalist (75), both Amsterdam
    })

    it('should use matchedCoaches when available', () => {
      const userAnswers = { werk: 30, sociaal: 70, relatie: 70, financieel: 70, geluk: 70, gezondheid: 70, praktisch: 70 }
      store.matchCoaches(userAnswers)
      store.updateFilters({ location: 'Amsterdam' })
      const filtered = store.filteredCoaches
      // Should only include Amsterdam coaches from matchedCoaches
      expect(filtered.every(c => c.location.includes('Amsterdam'))).toBe(true)
    })

    it('should reset filters correctly', () => {
      store.updateFilters({ location: 'Amsterdam', maxPrice: 80 })
      store.resetFilters()
      expect(store.filters).toEqual({ location: '', maxPrice: null, minRating: 0, specialty: '' })
    })
  })

  describe('getters', () => {
    it('topRatedCoaches should return top 3 by rating', () => {
      const top = store.topRatedCoaches
      expect(top.length).toBe(3)
      expect(top[0].rating).toBeGreaterThanOrEqual(top[1].rating)
      expect(top[1].rating).toBeGreaterThanOrEqual(top[2].rating)
    })

    it('availableLocations should return unique sorted locations', () => {
      const locations = store.availableLocations
      expect(locations).toContain('Amsterdam')
      expect(locations).toContain('Rotterdam')
      // Should be sorted
      const sorted = [...locations].sort()
      expect(locations).toEqual(sorted)
    })

    it('availableSpecialties should return unique sorted specialties', () => {
      const specialties = store.availableSpecialties
      expect(specialties).toContain('werk')
      expect(specialties).toContain('relatie')
      // Should be sorted
      const sorted = [...specialties].sort()
      expect(specialties).toEqual(sorted)
      // Should have no duplicates
      expect(new Set(specialties).size).toBe(specialties.length)
    })
  })

  describe('getAreaDisplayName', () => {
    it('should return display names for known areas', () => {
      expect(store.getAreaDisplayName('werk')).toBe('Werk & Carrière')
      expect(store.getAreaDisplayName('geluk')).toBe('Geluk & Welzijn')
    })

    it('should return raw key for unknown areas', () => {
      expect(store.getAreaDisplayName('onbekend')).toBe('onbekend')
    })
  })
})
