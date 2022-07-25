import { defineStore } from 'pinia'

export const useQuestionStore = defineStore({
    id: 'QuestionsOne',
    state: () => ({
        werk: '',
        sociaal: '',
        relatie: '',
        financieel: '',
        geluk: '',
        gezondheid: '',
        praktisch: '',

    }),
})

// actions are just methods (from Vue 2)

