import { defineStore } from 'pinia'

/**
 * Store for managing coaches data and matching logic
 * Handles coach filtering, matching algorithm, and selections
 */
export const useCoachesStore = defineStore({
    id: 'coaches',

    state: () => ({
        allCoaches: [],                    // Full list of all coaches (loaded from API)
        matchedCoaches: [],                // Coaches matched to user answers
        selectedCoach: null,               // Currently selected coach for detail view
        loading: false,                    // Loading state for async operations
        error: null,                       // Error state for async operations
        filters: {
            location: '',
            maxPrice: null,
            minRating: 0,
            specialty: ''
        }
    }),

    getters: {
        /**
         * Get filtered coaches based on current filter settings
         * @returns {Array} Filtered coach list
         */
        filteredCoaches: (state) => {
            let coaches = state.matchedCoaches.length > 0
                ? state.matchedCoaches
                : state.allCoaches

            // Filter by location
            if (state.filters.location) {
                coaches = coaches.filter(coach =>
                    (coach.location || '').toLowerCase().includes(state.filters.location.toLowerCase())
                )
            }

            // Filter by max price
            if (state.filters.maxPrice) {
                coaches = coaches.filter(coach => coach.price <= state.filters.maxPrice)
            }

            // Filter by minimum rating
            if (state.filters.minRating) {
                coaches = coaches.filter(coach => coach.rating >= state.filters.minRating)
            }

            // Filter by specialty
            if (state.filters.specialty) {
                coaches = coaches.filter(coach =>
                    coach.specialties.includes(state.filters.specialty)
                )
            }

            return coaches
        },

        /**
         * Get top-rated coaches
         * @returns {Array} Top 3 highest rated coaches
         */
        topRatedCoaches: (state) => {
            return [...state.allCoaches]
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 3)
        },

        /**
         * Get all unique locations
         * @returns {Array} Sorted list of unique locations
         */
        availableLocations: (state) => {
            const locations = [...new Set(state.allCoaches.map(coach => coach.location))]
            return locations.sort()
        },

        /**
         * Get all unique specialties
         * @returns {Array} Sorted list of unique specialties
         */
        availableSpecialties: (state) => {
            const specialties = new Set()
            state.allCoaches.forEach(coach => {
                coach.specialties.forEach(specialty => specialties.add(specialty))
            })
            return Array.from(specialties).sort()
        }
    },

    actions: {
        /**
         * Fetch all coaches from the API
         * Sets allCoaches to the returned data
         */
        async fetchCoaches() {
            this.loading = true
            this.error = null
            try {
                const response = await fetch('/api/coaches')
                if (!response.ok) {
                    throw new Error(`API fout: ${response.status}`)
                }
                const data = await response.json()
                this.allCoaches = data.coaches
            } catch (err) {
                this.error = err.message || 'Kon coaches niet laden'
            } finally {
                this.loading = false
            }
        },

        /**
         * Fetch a single coach by ID from the API
         * Used as fallback when allCoaches is not yet loaded (e.g. direct URL access)
         * @param {number} id - Coach ID
         */
        async fetchCoachById(id) {
            this.loading = true
            this.error = null
            try {
                const response = await fetch(`/api/coaches?id=${id}`)
                if (!response.ok) {
                    throw new Error(`Coach niet gevonden`)
                }
                const data = await response.json()
                // Merge fetched coach into allCoaches if not already present
                if (!this.allCoaches.find(c => c.id === data.id)) {
                    this.allCoaches = [...this.allCoaches, data]
                }
                return data
            } catch (err) {
                this.error = err.message || 'Kon coach niet laden'
                return null
            } finally {
                this.loading = false
            }
        },

        /**
         * Match coaches based on user questionnaire answers
         * Uses intelligent scoring algorithm based on satisfaction levels
         * @param {Object} userAnswers - User's questionnaire answers
         */
        matchCoaches(userAnswers) {
            // Map questionnaire areas to coach specialties
            const areaToSpecialtyMap = {
                werk: ['werk', 'carriere', 'burnout', 'leiderschap', 'carrierewisseling'],
                sociaal: ['sociaal', 'zelfvertrouwen', 'angst', 'netwerken', 'communicatie'],
                relatie: ['relatie', 'communicatie', 'gezin', 'zelfliefde'],
                financieel: ['financieel', 'ondernemerschap', 'doelen'],
                geluk: ['geluk', 'mindfulness', 'stress', 'persoonlijke groei'],
                gezondheid: ['gezondheid', 'lifestyle', 'energie', 'burnout', 'balans'],
                praktisch: ['praktisch', 'timemanagement', 'productiviteit']
            }

            // Calculate match score for each coach
            const scoredCoaches = this.allCoaches.map(coach => {
                let score = 0
                let matchReasons = []

                // Check each life area
                Object.entries(userAnswers).forEach(([area, satisfaction]) => {
                    // Lower satisfaction = higher priority for that area
                    if (satisfaction < 60 && areaToSpecialtyMap[area]) {
                        // Check if coach specializes in this area
                        const hasSpecialty = coach.specialties.some(specialty =>
                            areaToSpecialtyMap[area].includes(specialty)
                        )

                        if (hasSpecialty) {
                            // Weight by how low the satisfaction is (more urgent = higher score)
                            const urgencyWeight = (60 - satisfaction) / 10
                            score += urgencyWeight * 10

                            // Add match reason
                            const areaName = this.getAreaDisplayName(area)
                            matchReasons.push(`Expert in ${areaName}`)
                        }
                    }
                })

                // Bonus points for high ratings
                score += (coach.rating || 0) * 2

                // Bonus points for experience
                score += (coach.experience || 0) * 0.5

                // Bonus for high review count (trust signal)
                score += coach.reviewCount > 0 ? Math.log(coach.reviewCount) * 2 : 0

                return {
                    ...coach,
                    matchScore: score,
                    matchReasons: matchReasons
                }
            })

            // Sort by match score and take top matches
            this.matchedCoaches = scoredCoaches
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 8) // Show top 8 matches
        },

        /**
         * Get display name for area
         * @param {string} area - Internal area name
         * @returns {string} Human-readable area name
         */
        getAreaDisplayName(area) {
            const displayNames = {
                werk: 'werk en carrière',
                sociaal: 'sociaal leven',
                relatie: 'relaties',
                financieel: 'financiën',
                geluk: 'geluk en welzijn',
                gezondheid: 'gezondheid',
                praktisch: 'praktische zaken'
            }
            return displayNames[area] || area
        },

        /**
         * Select a coach for detailed view
         * @param {number} coachId - ID of coach to select
         */
        selectCoach(coachId) {
            this.selectedCoach = this.allCoaches.find(coach => coach.id === coachId)
        },

        /**
         * Clear selected coach
         */
        clearSelection() {
            this.selectedCoach = null
        },

        /**
         * Update filters
         * @param {Object} newFilters - New filter values
         */
        updateFilters(newFilters) {
            this.filters = { ...this.filters, ...newFilters }
        },

        /**
         * Reset all filters
         */
        resetFilters() {
            this.filters = {
                location: '',
                maxPrice: null,
                minRating: 0,
                specialty: ''
            }
        },

        /**
         * Get coach by ID — checks local state first, then falls back to API
         * @param {number} id - Coach ID
         * @returns {Object|null} Coach object or null
         */
        getCoachById(id) {
            return this.allCoaches.find(coach => coach.id === id) || null
        }
    }
})
