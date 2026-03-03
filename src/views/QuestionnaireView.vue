<template>
  <!-- Email gate modal: shown after questionnaire completes, before showing results -->
  <EmailGateModal v-if="showEmailGate" @confirmed="onEmailConfirmed" />

  <!-- Multi-step questionnaire with modern, friendly design -->
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12">
    <div class="container mx-auto px-4 max-w-3xl">

      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-neutral-600">Stap {{ currentStep }} van 2</span>
          <span class="text-sm font-medium text-primary-600">{{ progressPercentage }}%</span>
        </div>
        <div class="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
          <div
            class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>

      <!-- Questionnaire Card -->
      <div class="bg-white rounded-3xl shadow-soft-lg p-8 md:p-12 animate-fade-in">

        <!-- Step 1: Life Satisfaction Sliders -->
        <div v-show="currentStep === 1">
          <h2 class="text-3xl md:text-4xl font-display font-bold text-neutral-800 mb-3">
            Hoe tevreden ben je?
          </h2>
          <p class="text-lg text-neutral-600 mb-8">
            Geef per levensgebied aan hoe tevreden je momenteel bent.
            <span class="text-neutral-500">Schuif naar rechts voor meer tevreden.</span>
          </p>

          <!-- Sliders -->
          <div class="space-y-6">
            <!-- Werk -->
            <div class="space-y-2">
              <label class="flex items-center justify-between text-neutral-700 font-medium">
                <span class="flex items-center gap-2">
                  <span class="text-2xl">💼</span>
                  <span>Werk & Carrière</span>
                </span>
                <span class="text-primary-600 font-semibold">{{ questionStore.werk }}%</span>
              </label>
              <input
                v-model="questionStore.werk"
                type="range"
                min="1"
                max="100"
                class="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer slider"
              />
            </div>

            <!-- Sociaal -->
            <div class="space-y-2">
              <label class="flex items-center justify-between text-neutral-700 font-medium">
                <span class="flex items-center gap-2">
                  <span class="text-2xl">👥</span>
                  <span>Sociaal Leven</span>
                </span>
                <span class="text-primary-600 font-semibold">{{ questionStore.sociaal }}%</span>
              </label>
              <input
                v-model="questionStore.sociaal"
                type="range"
                min="1"
                max="100"
                class="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer slider"
              />
            </div>

            <!-- Relatie -->
            <div class="space-y-2">
              <label class="flex items-center justify-between text-neutral-700 font-medium">
                <span class="flex items-center gap-2">
                  <span class="text-2xl">❤️</span>
                  <span>Relatie & Familie</span>
                </span>
                <span class="text-primary-600 font-semibold">{{ questionStore.relatie }}%</span>
              </label>
              <input
                v-model="questionStore.relatie"
                type="range"
                min="1"
                max="100"
                class="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer slider"
              />
            </div>

            <!-- Financieel -->
            <div class="space-y-2">
              <label class="flex items-center justify-between text-neutral-700 font-medium">
                <span class="flex items-center gap-2">
                  <span class="text-2xl">💰</span>
                  <span>Financiën</span>
                </span>
                <span class="text-primary-600 font-semibold">{{ questionStore.financieel }}%</span>
              </label>
              <input
                v-model="questionStore.financieel"
                type="range"
                min="1"
                max="100"
                class="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer slider"
              />
            </div>

            <!-- Geluk -->
            <div class="space-y-2">
              <label class="flex items-center justify-between text-neutral-700 font-medium">
                <span class="flex items-center gap-2">
                  <span class="text-2xl">😊</span>
                  <span>Algemeen Geluk</span>
                </span>
                <span class="text-primary-600 font-semibold">{{ questionStore.geluk }}%</span>
              </label>
              <input
                v-model="questionStore.geluk"
                type="range"
                min="1"
                max="100"
                class="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer slider"
              />
            </div>

            <!-- Gezondheid -->
            <div class="space-y-2">
              <label class="flex items-center justify-between text-neutral-700 font-medium">
                <span class="flex items-center gap-2">
                  <span class="text-2xl">🏃</span>
                  <span>Gezondheid</span>
                </span>
                <span class="text-primary-600 font-semibold">{{ questionStore.gezondheid }}%</span>
              </label>
              <input
                v-model="questionStore.gezondheid"
                type="range"
                min="1"
                max="100"
                class="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer slider"
              />
            </div>

            <!-- Praktisch -->
            <div class="space-y-2">
              <label class="flex items-center justify-between text-neutral-700 font-medium">
                <span class="flex items-center gap-2">
                  <span class="text-2xl">📋</span>
                  <span>Praktische Zaken</span>
                </span>
                <span class="text-primary-600 font-semibold">{{ questionStore.praktisch }}%</span>
              </label>
              <input
                v-model="questionStore.praktisch"
                type="range"
                min="1"
                max="100"
                class="w-full h-3 bg-neutral-200 rounded-full appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        <!-- Step 2: Additional Information -->
        <div v-show="currentStep === 2">
          <h2 class="text-3xl md:text-4xl font-display font-bold text-neutral-800 mb-3">
            Een paar laatste vragen
          </h2>
          <p class="text-lg text-neutral-600 mb-8">
            Deze info helpt ons om de perfecte coach voor je te vinden.
          </p>

          <div class="space-y-6">
            <!-- User Goal -->
            <div>
              <label class="block text-neutral-700 font-medium mb-2">
                Wat wil je graag bereiken? <span class="text-neutral-400">(optioneel)</span>
              </label>
              <textarea
                v-model="questionStore.userGoal"
                rows="3"
                placeholder="Bijv: 'Ik wil meer balans tussen werk en privé' of 'Ik zoek een nieuwe carrièrerichting'"
                class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors resize-none"
              ></textarea>
            </div>

            <!-- Timeline -->
            <div>
              <label class="block text-neutral-700 font-medium mb-2">
                Binnen welke termijn? <span class="text-neutral-400">(optioneel)</span>
              </label>
              <select
                v-model="questionStore.userTimeline"
                class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="">Selecteer een termijn</option>
                <option value="urgent">Zo snel mogelijk</option>
                <option value="short">Binnen 1-3 maanden</option>
                <option value="medium">Binnen 3-6 maanden</option>
                <option value="long">Binnen een jaar</option>
                <option value="flexible">Ik heb geen haast</option>
              </select>
            </div>

            <!-- Location Preference -->
            <div>
              <label class="block text-neutral-700 font-medium mb-2">
                Voorkeur voor locatie? <span class="text-neutral-400">(optioneel)</span>
              </label>
              <input
                v-model="questionStore.preferredLocation"
                type="text"
                placeholder="Bijv: Amsterdam, Utrecht, of 'Online'"
                class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
              />
            </div>

            <!-- Budget Preference -->
            <div>
              <label class="block text-neutral-700 font-medium mb-2">
                Budget per sessie? <span class="text-neutral-400">(optioneel)</span>
              </label>
              <select
                v-model="questionStore.preferredPrice"
                class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="">Selecteer een budget</option>
                <option value="75">Tot €75</option>
                <option value="100">Tot €100</option>
                <option value="125">Tot €125</option>
                <option value="150">Tot €150</option>
                <option value="unlimited">Geen limiet</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between mt-12 pt-8 border-t border-neutral-200">
          <button
            v-if="currentStep > 1"
            @click="previousStep"
            class="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 font-medium transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            <span>Vorige</span>
          </button>
          <div v-else></div>

          <button
            v-if="currentStep < 2"
            @click="nextStep"
            class="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 flex items-center gap-2"
          >
            <span>Volgende</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          <button
            v-else
            @click="submitQuestionnaire"
            :disabled="isSubmitting"
            class="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-10 py-3 rounded-xl shadow-soft-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{{ isSubmitting ? 'Bezig met matchen...' : 'Vind mijn coaches' }}</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
            </svg>
          </button>
        </div>

      </div>

      <!-- Satisfaction Summary (shown on step 1) -->
      <div v-if="currentStep === 1" class="mt-6 bg-white rounded-2xl shadow-soft p-6 animate-fade-in">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-neutral-600 mb-1">Algemene tevredenheid</p>
            <p class="text-3xl font-bold text-primary-600">{{ overallSatisfaction }}%</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-neutral-600 mb-1">Gebieden met aandacht</p>
            <p class="text-2xl font-semibold text-neutral-700">{{ areasNeedingAttention }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuestionStore } from '@/stores/useQuestions'
import { useCoachesStore } from '@/stores/useCoaches'
import EmailGateModal from '@/components/EmailGateModal.vue'

// Router for navigation
const router = useRouter()

// Stores
const questionStore = useQuestionStore()
const coachesStore = useCoachesStore()

// Local state
const currentStep = ref(1)
const isSubmitting = ref(false)
const showEmailGate = ref(false)

// Computed properties
const progressPercentage = computed(() => {
  return Math.round((currentStep.value / 2) * 100)
})

const overallSatisfaction = computed(() => questionStore.overallSatisfaction)

const areasNeedingAttention = computed(() => {
  return questionStore.areasNeedingImprovement.length
})

/**
 * Move to next step
 */
const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/**
 * Move to previous step
 */
const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/**
 * Submit questionnaire and find matching coaches
 */
const submitQuestionnaire = async () => {
  isSubmitting.value = true

  // Simulate processing time for better UX
  await new Promise(resolve => setTimeout(resolve, 800))

  // Prepare user answers for matching
  const userAnswers = {
    werk: questionStore.werk,
    sociaal: questionStore.sociaal,
    relatie: questionStore.relatie,
    financieel: questionStore.financieel,
    geluk: questionStore.geluk,
    gezondheid: questionStore.gezondheid,
    praktisch: questionStore.praktisch
  }

  // Ensure coaches are loaded before matching (user may have skipped the home page)
  if (coachesStore.allCoaches.length === 0) {
    await coachesStore.fetchCoaches()
  }

  // Run matching algorithm
  coachesStore.matchCoaches(userAnswers)

  // Apply optional filters if provided
  if (questionStore.preferredLocation) {
    coachesStore.updateFilters({ location: questionStore.preferredLocation })
  }
  if (questionStore.preferredPrice && questionStore.preferredPrice !== 'unlimited') {
    coachesStore.updateFilters({ maxPrice: parseInt(questionStore.preferredPrice) })
  }

  isSubmitting.value = false

  // Don't show email gate if coaches failed to load
  if (coachesStore.allCoaches.length === 0) {
    return
  }

  // Show email gate before navigating to results
  showEmailGate.value = true
}

/**
 * Called when user confirms their email in the gate modal.
 * Saves email + name to the store (pre-fills contact form later), then navigates.
 */
const onEmailConfirmed = ({ email, name }) => {
  questionStore.userEmail = email
  if (name) questionStore.userName = name
  showEmailGate.value = false
  router.push('/coaches')
}
</script>

<style scoped>
/* Custom slider styling */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.6);
}

.slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.4);
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.6);
}

/* Slider track color based on value */
.slider::-webkit-slider-runnable-track {
  background: linear-gradient(to right,
    #fee2e2 0%,
    #fef3c7 25%,
    #d1fae5 50%,
    #a7f3d0 75%,
    #6ee7b7 100%);
  border-radius: 999px;
}

.slider::-moz-range-track {
  background: linear-gradient(to right,
    #fee2e2 0%,
    #fef3c7 25%,
    #d1fae5 50%,
    #a7f3d0 75%,
    #6ee7b7 100%);
  border-radius: 999px;
}
</style>
