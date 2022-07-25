<template>
<div>
<div class="text-3xl font-normal leading-normal mt-0 mb-2 text-pink-800">Hoe tevreden ben je op de volgende gebieden?</div>
 <div class="text-1xl font-normal leading-normal mt-0 mb-2 text-pink-800">( Schuifje naar rechts is meer tevreden )</div>
 <div>
  <FormKit type="form" @submit="handleSubmit" submit-label="Verder..">
<FormKit name="werk" v-model="answerStore.werk" type="range" label="Werk" min="1" max="100"/>
<FormKit name="sociaal" v-model="answerStore.sociaal" type="range" label="Sociaal" min="1" max="100"/>
<FormKit name="relatie" v-model="answerStore.relatie" type="range" label="Relatie en familie" min="1" max="100"/>
<FormKit name="financieel" v-model="answerStore.financieel" type="range" label="Financieel" min="1" max="100"/>
<FormKit name="geluk" v-model="answerStore.geluk" type="range" label="Geluksnivo" min="1" max="100"/>
<FormKit name="gezondheid" v-model="answerStore.gezondheid" type="range" label="Gezondheid" min="1" max="100"/>
<FormKit name="praktisch" v-model="answerStore.praktisch" type="range" label="Praktisch" min="1" max="100"/> 
</FormKit></div>
</div>
</template>
<script setup>
// Imports
import { useQuestionStore } from '@/stores/useQuestions'
import { useRouter } from 'vue-router'
// Connection with the Pinia store
const answerStore = useQuestionStore()

// After submitting the form - use the router
const handleSubmit =  () => {
  const router = useRouter()
  router.push('about') // goto TheCoaches.vue  TEST: goto About page
    } 
 </script>
             
<style>  
  
  [data-type="submit"] .formkit-input {
    
                    display: inline-block;
                    outline: 0;
                    border: 0;
                    cursor: pointer;
                    background-color: #4299e1;
                    border-radius: 4px;
                    padding: 8px 16px;
                    font-size: 16px;
                    font-weight: 700;
                    color: white;
                    line-height: 26px;
  }
</style>