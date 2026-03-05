import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuestionStore } from '../useQuestions'

describe('useQuestionStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useQuestionStore()
  })

  describe('overallSatisfaction', () => {
    it('should return average of all 7 areas', () => {
      // Default: all areas at 50 → average = 50
      expect(store.overallSatisfaction).toBe(50)
    })

    it('should calculate correct average with mixed values', () => {
      store.werk = 30
      store.sociaal = 60
      store.relatie = 80
      store.financieel = 40
      store.geluk = 90
      store.gezondheid = 50
      store.praktisch = 70
      // Sum: 30+60+80+40+90+50+70 = 420, average = 60
      expect(store.overallSatisfaction).toBe(60)
    })

    it('should handle string values (from slider inputs)', () => {
      store.werk = '30'
      store.sociaal = '60'
      // Number() conversion should handle this
      expect(store.overallSatisfaction).toBeGreaterThan(0)
    })
  })

  describe('areasNeedingImprovement', () => {
    it('should return areas with satisfaction below 60', () => {
      store.werk = 30
      store.sociaal = 40
      store.relatie = 70  // Above 60 — excluded
      store.financieel = 80 // Above 60 — excluded
      store.geluk = 55
      store.gezondheid = 90 // Above 60 — excluded
      store.praktisch = 50

      const areas = store.areasNeedingImprovement
      expect(areas).toContain('werk')
      expect(areas).toContain('sociaal')
      expect(areas).toContain('geluk')
      expect(areas).toContain('praktisch')
      expect(areas).not.toContain('relatie')
      expect(areas).not.toContain('financieel')
      expect(areas).not.toContain('gezondheid')
    })

    it('should sort by lowest satisfaction first', () => {
      store.werk = 40
      store.sociaal = 20
      store.relatie = 55
      store.financieel = 70
      store.geluk = 30
      store.gezondheid = 70
      store.praktisch = 50

      const areas = store.areasNeedingImprovement
      // sociaal (20) < geluk (30) < werk (40) < praktisch (50) < relatie (55)
      expect(areas[0]).toBe('sociaal')
      expect(areas[1]).toBe('geluk')
      expect(areas[2]).toBe('werk')
    })

    it('should return empty array when all areas are >= 60', () => {
      store.werk = 60
      store.sociaal = 70
      store.relatie = 80
      store.financieel = 90
      store.geluk = 60
      store.gezondheid = 75
      store.praktisch = 65

      expect(store.areasNeedingImprovement).toEqual([])
    })

    it('should exclude exactly 60 (threshold is < 60)', () => {
      store.werk = 60
      store.sociaal = 59
      const areas = store.areasNeedingImprovement
      expect(areas).not.toContain('werk')
      expect(areas).toContain('sociaal')
    })
  })

  describe('isComplete', () => {
    it('should return true with default values (all 50)', () => {
      expect(store.isComplete).toBe(true)
    })

    it('should return false if any area is 0', () => {
      store.werk = 0
      expect(store.isComplete).toBe(false)
    })

    it('should return true when all areas are non-zero', () => {
      store.werk = 1
      store.sociaal = 1
      store.relatie = 1
      store.financieel = 1
      store.geluk = 1
      store.gezondheid = 1
      store.praktisch = 1
      expect(store.isComplete).toBe(true)
    })
  })

  describe('resetAnswers', () => {
    it('should reset all values to defaults', () => {
      store.werk = 10
      store.userEmail = 'test@test.com'
      store.userName = 'Test'
      store.currentStep = 3
      store.completedSteps = [1, 2]

      store.resetAnswers()

      expect(store.werk).toBe(50)
      expect(store.sociaal).toBe(50)
      expect(store.userEmail).toBe('')
      expect(store.userName).toBe('')
      expect(store.currentStep).toBe(1)
      expect(store.completedSteps).toEqual([])
    })
  })

  describe('step navigation', () => {
    it('nextStep should increment currentStep', () => {
      store.nextStep()
      expect(store.currentStep).toBe(2)
    })

    it('nextStep should mark current step as completed', () => {
      store.nextStep()
      expect(store.completedSteps).toContain(1)
    })

    it('nextStep should not add duplicate completed steps', () => {
      store.nextStep() // Step 1 → 2
      store.previousStep() // Step 2 → 1
      store.nextStep() // Step 1 → 2 again
      expect(store.completedSteps.filter(s => s === 1).length).toBe(1)
    })

    it('previousStep should decrement currentStep', () => {
      store.currentStep = 3
      store.previousStep()
      expect(store.currentStep).toBe(2)
    })

    it('previousStep should not go below 1', () => {
      store.currentStep = 1
      store.previousStep()
      expect(store.currentStep).toBe(1)
    })

    it('goToStep should set specific step', () => {
      store.goToStep(5)
      expect(store.currentStep).toBe(5)
    })
  })
})
