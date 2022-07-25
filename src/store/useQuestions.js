import { defineStore } from 'pinia'

export const useQuestionStore = defineStore({
    id: 'QuestionsOne',
    state: () => ({ answers: [] }),

    actions: {
        addQuestionsOne(answers) {
            this.answers.push({ answers })
        },
    },
})

// actions are just methods (from Vue 2)

    // state: () => ({
    //     werk: 50,
    //     sociaal: 50,
    //     relatie: 50,
    //     financieel: 50,
    //     geluk: 50,
    //     gezondheid: 50,
    //     praktisch: 50
    // }),