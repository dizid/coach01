<template>
<div>
<div><h2>Hoe tevreden ben je op de volgende gebieden?</h2>
 <h3>( Schuifje naar rechts is meer tevreden )</h3></div>
 <div>
  <FormKit type="form" @submit="handleSubmit" submit-label="Verder..">
<FormKit name="werk" v-model="answerStore.werk" type="range" label="Werk" min="1" max="100"/>
<FormKit name="sociaal" v-model="answerStore.sociaal" type="range" label="Sociaal" min="1" max="100"/>
<FormKit name="relatie" type="range" label="Relatie" min="1" max="100"/>
<FormKit name="financieel" type="range" label="Financieel" min="1" max="100"/>
<FormKit name="geluk" type="range" label="Geluksnivo" min="1" max="100"/>
<FormKit name="gezondheid" type="range" label="Gezondheid" min="1" max="100"/>
<FormKit name="praktisch" type="range" label="Praktisch" min="1" max="100"/> 
</FormKit></div>
answerStore.geluk: {{ answerStore.geluk }}
</div>
</template>
<script setup>
import { useQuestionStore } from '@/stores/useQuestions'
import { useRouter } from 'vue-router'
// import { ref } from 'vue'  // TEST 
// import { storeToRefs } from 'pinia'
const answerStore = useQuestionStore()
const router = useRouter()
const handleSubmit =  () => {
   console.log(answerStore) // add v-modeldata to store
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