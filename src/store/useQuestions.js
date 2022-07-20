import { defineStore } from 'pinia'

export const useQuestionStore = defineStore('Questions', {
    state: () => {
        return {
            werk: 0,
            sociaal: 0
        }
    },
    // could also be defined as
    // state: () => ({ count: 0 })
    //   actions: {
    //     increment() {
    //       this.count++
    //     },
    //   },
})