<template>
<div>

<div>
 <h2>Hoe tevreden ben je op de volgende gebieden?</h2>
 <h3>Naar rechts is meer tevreden</h3>
 </div>

<div>
<FormKit type="form" v-model="q100"  @click="handleSubmit" submit-label="Verder..">

<FormKit name="werk" type="range" label="Werk" min="1" max="10"/>
<FormKit name="sociaal" type="range" label="Sociaal" min="1" max="10"/>
<FormKit name="relatie" type="range" label="Relatie" min="1" max="10"/>
<FormKit name="financieel" type="range" label="Financieel" min="1" max="10"/>
<FormKit name="geluk" type="range" label="Geluksnivo" min="1" max="10"/>
<!-- <FormKit type="range" label="Gezondheid" min="1" max="10"/>
<FormKit type="range" label="Praktisch" min="1" max="10"/> -->
<pre wrap>{{ q100 }}</pre>

  </FormKit>
  </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'


const q100 = ref(0)

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