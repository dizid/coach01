<template>
<div class="bg-green-300 border-green-600 border-b p-4 m-4 rounded">  
   <h1 class="text-3xl">Jouw pad naar geluk</h1>
    <p>De coach die het beste bij jou past is Paul van Schaik in Rotterdam</p>
    <p>Maak een afspraak op:  <a class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href="https://www.earthequalsheaven.com/">Earth = Heaven</a></p>
   <div>
    Je hebt aangegeven dat je geluksnivo <span class="text-blue-600/75 font-weight: 600">{{ answerStore.geluk }}</span> is. Door een coachingtraject bij Paul kan dit zeker omhoog!
   </div>
  </div>
</template>

<script setup>
import { useQuestionStore } from '@/stores/useQuestions'

const answerStore = useQuestionStore()

</script>
