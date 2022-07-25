import { defineStore } from 'pinia'

export const useQuestionStore = defineStore({
    id: 'QuestionsOne',
    state: () => ({
        werk: '',
        sociaal: '',
        relatie: '',
        financieel: '',
        geluk: '50',
        gezondheid: '',
        praktisch: '',

    }),
})

// actions are just methods (from Vue 2)

