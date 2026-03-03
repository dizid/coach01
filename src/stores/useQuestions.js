import { defineStore } from 'pinia'

/**
 * Store for managing user questionnaire answers
 * Tracks satisfaction levels across different life areas (1-100 scale)
 */
export const useQuestionStore = defineStore({
    id: 'QuestionsOne',
    state: () => ({
        // Life satisfaction areas (1-100 scale)
        werk: 50,              // Work/career satisfaction
        sociaal: 50,           // Social life satisfaction
        relatie: 50,           // Relationships and family
        financieel: 50,        // Financial situation
        geluk: 50,             // Overall happiness level
        gezondheid: 50,        // Health and wellbeing
        praktisch: 50,         // Practical life organization

        // Additional user information
        userGoal: '',          // What they want to achieve
        userTimeline: '',      // When they want to achieve it
        preferredLocation: '', // Preferred coach location
        preferredPrice: '',    // Budget range
        userEmail: '',         // Captured at email gate (pre-fills contact form)
        userName: '',          // Captured at email gate (optional, pre-fills contact form)

        // Progress tracking
        currentStep: 1,        // Current questionnaire step
        completedSteps: [],    // Array of completed step numbers
    }),

    getters: {
        /**
         * Calculate overall satisfaction percentage
         * @returns {number} Average satisfaction across all areas
         */
        overallSatisfaction: (state) => {
            const areas = [
                state.werk,
                state.sociaal,
                state.relatie,
                state.financieel,
                state.geluk,
                state.gezondheid,
                state.praktisch
            ]
            const total = areas.reduce((sum, val) => sum + Number(val), 0)
            return Math.round(total / areas.length)
        },

        /**
         * Identify areas needing most improvement (below 50)
         * @returns {Array} Array of area names sorted by lowest satisfaction
         */
        areasNeedingImprovement: (state) => {
            const areas = [
                { name: 'werk', value: Number(state.werk) },
                { name: 'sociaal', value: Number(state.sociaal) },
                { name: 'relatie', value: Number(state.relatie) },
                { name: 'financieel', value: Number(state.financieel) },
                { name: 'geluk', value: Number(state.geluk) },
                { name: 'gezondheid', value: Number(state.gezondheid) },
                { name: 'praktisch', value: Number(state.praktisch) },
            ]
            return areas
                .filter(area => area.value < 60)
                .sort((a, b) => a.value - b.value)
                .map(area => area.name)
        },

        /**
         * Check if questionnaire is complete
         * @returns {boolean} True if all required fields filled
         */
        isComplete: (state) => {
            return state.werk > 0 &&
                   state.sociaal > 0 &&
                   state.relatie > 0 &&
                   state.financieel > 0 &&
                   state.gezondheid > 0 &&
                   state.praktisch > 0
        }
    },

    actions: {
        /**
         * Reset all answers to default values
         */
        resetAnswers() {
            this.werk = 50
            this.sociaal = 50
            this.relatie = 50
            this.financieel = 50
            this.geluk = 50
            this.gezondheid = 50
            this.praktisch = 50
            this.userGoal = ''
            this.userTimeline = ''
            this.preferredLocation = ''
            this.preferredPrice = ''
            this.userEmail = ''
            this.userName = ''
            this.currentStep = 1
            this.completedSteps = []
        },

        /**
         * Move to next step in questionnaire
         */
        nextStep() {
            if (!this.completedSteps.includes(this.currentStep)) {
                this.completedSteps.push(this.currentStep)
            }
            this.currentStep++
        },

        /**
         * Move to previous step in questionnaire
         */
        previousStep() {
            if (this.currentStep > 1) {
                this.currentStep--
            }
        },

        /**
         * Set specific step
         * @param {number} step - Step number to navigate to
         */
        goToStep(step) {
            this.currentStep = step
        }
    }
})

