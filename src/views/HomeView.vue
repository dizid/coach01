<template>
<div>
  <!-- components: { Questions1 }, -->
<div class="bg-green-300 border-green-600 border-b p-4 m-4 rounded">Vind de coach die bij jou past</div>

<div>
  <questions-one/>
</div>
</div>
</template>

<script>
import QuestionsOne from '@/components/QuestionsOne.vue';

export default {
  components: {
    name:'questionsone',
    QuestionsOne
  }
}
</script>
