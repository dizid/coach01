<template>
  <!-- Full-screen overlay: shown after questionnaire, before results -->
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">

      <!-- Backdrop -->
      <div class="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"></div>

      <!-- Modal card -->
      <div class="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 md:p-10 animate-slide-up">

        <!-- Celebration icon -->
        <div class="flex justify-center mb-6">
          <div class="bg-gradient-to-br from-accent-400 to-accent-600 rounded-full p-5 shadow-lg">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>

        <!-- Headline -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-display font-bold text-neutral-800 mb-3">
            Jouw matches zijn gevonden!
          </h2>
          <p class="text-neutral-600 text-lg leading-relaxed">
            Voer je e-mailadres in om je persoonlijke coach matches te zien — altijd gratis.
          </p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">

          <!-- Name (optional, used to pre-fill contact form) -->
          <div>
            <label class="block text-neutral-700 font-medium mb-2 text-sm">
              Jouw naam <span class="text-neutral-400">(optioneel)</span>
            </label>
            <input
              v-model="name"
              type="text"
              placeholder="Bijv: Jan de Vries"
              autocomplete="name"
              class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
            />
          </div>

          <!-- Email (required) -->
          <div>
            <label class="block text-neutral-700 font-medium mb-2 text-sm">
              E-mailadres <span class="text-red-500">*</span>
            </label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="jou@voorbeeld.nl"
              autocomplete="email"
              class="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors"
              :class="emailError ? 'border-red-400 focus:border-red-400' : 'border-neutral-200 focus:border-primary-400'"
            />
            <p v-if="emailError" class="text-red-500 text-xs mt-1">{{ emailError }}</p>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            class="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-lg py-4 rounded-2xl shadow-soft-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 mt-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
            Bekijk mijn coaches
          </button>
        </form>

        <!-- Trust line -->
        <p class="text-center text-xs text-neutral-400 mt-5">
          Geen spam. Alleen relevante updates over jouw coachzoektocht.
        </p>

        <!-- Privacy note -->
        <div class="flex items-center justify-center gap-4 mt-4">
          <div class="flex items-center gap-1 text-xs text-neutral-500">
            <svg class="w-3.5 h-3.5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
            </svg>
            Veilig & privé
          </div>
          <div class="flex items-center gap-1 text-xs text-neutral-500">
            <svg class="w-3.5 h-3.5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Altijd gratis
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['confirmed'])

const name = ref('')
const email = ref('')
const emailError = ref('')

const handleSubmit = () => {
  emailError.value = ''

  // Basic email format check
  if (!email.value.includes('@') || !email.value.includes('.')) {
    emailError.value = 'Voer een geldig e-mailadres in'
    return
  }

  emit('confirmed', {
    email: email.value.trim(),
    name: name.value.trim(),
  })
}
</script>
