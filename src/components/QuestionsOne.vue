<template>
<div>
<div><h2>Hoe tevreden ben je op de volgende gebieden?</h2>
 <h3>( Schuifje naar rechts is meer tevreden )</h3></div>
<div><FormKit type="form" v-model="questionsOneFromStore"  @submit="handleSubmit" submit-label="Verder..">
<FormKit name="werk" type="range" label="Werk" min="1" max="100"/>
<FormKit name="sociaal" type="range" label="Sociaal" min="1" max="100"/>
<FormKit name="relatie" type="range" label="Relatie" min="1" max="100"/>
<FormKit name="financieel" type="range" label="Financieel" min="1" max="100"/>
<FormKit name="geluk" type="range" label="Geluksnivo" min="1" max="100"/>
<FormKit name="gezondheid" type="range" label="Gezondheid" min="1" max="100"/>
<FormKit name="praktisch" type="range" label="Praktisch" min="1" max="100"/> 
</FormKit></div></div>
</template>
<script setup>
import { useQuestionStore } from '@/store/useQuestions'
import { useRouter } from 'vue-router'
// goto TheCoaches.vue VIEW  TESt: goto About pag
const router = useRouter()
const handleSubmit =  () => {router.push('about')}

// STORE
const questionsOneFromStore = useQuestionStore()
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