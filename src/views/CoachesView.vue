<template>
  <!-- Coach matching results with modern cards -->
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12">
    <div class="container mx-auto px-4">

      <!-- Header Section -->
      <div class="max-w-4xl mx-auto text-center mb-12 animate-fade-in">
        <h1 class="text-4xl md:text-5xl font-display font-bold text-neutral-800 mb-4">
          Jouw perfecte coaches
        </h1>
        <p class="text-xl text-neutral-600 mb-6">
          We hebben {{ displayedCoaches.length }} coaches gevonden die perfect bij jouw situatie passen
        </p>

        <!-- Match Summary -->
        <div v-if="areasNeedingImprovement.length > 0" class="bg-white rounded-2xl shadow-soft p-6 inline-block">
          <p class="text-sm text-neutral-600 mb-2">Onze focus voor jou:</p>
          <div class="flex flex-wrap gap-2 justify-center">
            <span
              v-for="area in areasNeedingImprovement.slice(0, 3)"
              :key="area"
              class="px-4 py-2 bg-primary-100 text-primary-700 rounded-full font-medium"
            >
              {{ getAreaDisplayName(area) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Filters (optional - can be expanded) -->
      <div class="max-w-6xl mx-auto mb-8">
        <div class="bg-white rounded-2xl shadow-soft p-6">
          <div class="grid md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Locatie</label>
              <select
                v-model="filters.location"
                @change="applyFilters"
                class="w-full px-4 py-2 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors cursor-pointer text-sm"
              >
                <option value="">Alle locaties</option>
                <option v-for="location in availableLocations" :key="location" :value="location">
                  {{ location }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Max. prijs</label>
              <select
                v-model="filters.maxPrice"
                @change="applyFilters"
                class="w-full px-4 py-2 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors cursor-pointer text-sm"
              >
                <option :value="null">Geen limiet</option>
                <option :value="75">Tot €75</option>
                <option :value="100">Tot €100</option>
                <option :value="125">Tot €125</option>
                <option :value="150">Tot €150</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Min. rating</label>
              <select
                v-model="filters.minRating"
                @change="applyFilters"
                class="w-full px-4 py-2 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors cursor-pointer text-sm"
              >
                <option :value="0">Alle ratings</option>
                <option :value="4.5">4.5+ sterren</option>
                <option :value="4.7">4.7+ sterren</option>
                <option :value="4.9">4.9+ sterren</option>
              </select>
            </div>

            <div class="flex items-end">
              <button
                @click="resetFilters"
                class="w-full px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 border-2 border-neutral-200 hover:border-neutral-300 rounded-xl transition-colors"
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Coach Cards Grid -->
      <div class="max-w-6xl mx-auto">
        <!-- Loading state -->
        <div v-if="coachesStore.loading" class="text-center py-12">
          <div class="inline-block w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          <p class="text-neutral-500 text-lg">Laden...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="coachesStore.error" class="text-center py-12">
          <p class="text-red-600 text-lg mb-4">{{ coachesStore.error }}</p>
          <button
            @click="coachesStore.fetchCoaches()"
            class="text-primary-600 hover:text-primary-700 font-medium underline"
          >
            Probeer opnieuw
          </button>
        </div>

        <template v-else>
          <div v-if="displayedCoaches.length === 0" class="text-center py-12">
            <p class="text-xl text-neutral-600">Geen coaches gevonden met deze filters.</p>
            <button
              @click="resetFilters"
              class="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Reset filters
            </button>
          </div>

          <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(coach, index) in displayedCoaches"
            :key="coach.id"
            class="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden transform hover:-translate-y-1 cursor-pointer animate-slide-up"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @click="viewCoachDetail(coach.id)"
          >
            <!-- Coach Image Header -->
            <div class="relative h-48 bg-gradient-to-br from-primary-100 via-accent-50 to-secondary-100">
              <img
                :src="coach.image"
                :alt="coach.name"
                class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <!-- Match badge if from matching -->
              <div v-if="coach.matchScore" class="absolute top-4 right-4 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                Top Match
              </div>
            </div>

            <!-- Coach Info -->
            <div class="p-6">
              <!-- Name and Location -->
              <div class="mb-3">
                <h3 class="font-semibold text-xl text-neutral-800 mb-1">{{ coach.name }}</h3>
                <p class="text-sm text-neutral-500 flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ coach.location }}
                </p>
              </div>

              <!-- Rating -->
              <div class="flex items-center gap-1 mb-3">
                <svg class="w-5 h-5 text-warm-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="font-semibold text-neutral-700">{{ coach.rating }}</span>
                <span class="text-neutral-500 text-sm">({{ coach.reviewCount }})</span>
              </div>

              <!-- Bio -->
              <p class="text-neutral-600 text-sm mb-4 line-clamp-3">{{ coach.bio }}</p>

              <!-- Match Reasons (if matched) -->
              <div v-if="coach.matchReasons && coach.matchReasons.length > 0" class="mb-4">
                <p class="text-xs font-medium text-neutral-500 mb-2">Waarom deze match:</p>
                <div class="space-y-1">
                  <div
                    v-for="(reason, idx) in coach.matchReasons.slice(0, 2)"
                    :key="idx"
                    class="flex items-center gap-1 text-xs text-accent-700"
                  >
                    <svg class="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>{{ reason }}</span>
                  </div>
                </div>
              </div>

              <!-- Specialties -->
              <div class="flex flex-wrap gap-2 mb-4">
                <span
                  v-for="specialty in coach.specialties.slice(0, 3)"
                  :key="specialty"
                  class="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
                >
                  {{ specialty }}
                </span>
              </div>

              <!-- Price and CTA -->
              <div class="flex items-center justify-between pt-4 border-t border-neutral-100">
                <div>
                  <p class="text-sm text-neutral-500">Vanaf</p>
                  <p class="text-xl font-bold text-neutral-800">€{{ coach.price }}</p>
                  <p class="text-xs text-neutral-500">{{ coach.priceType }}</p>
                </div>
                <button
                  @click.stop="viewCoachDetail(coach.id)"
                  class="bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-2 rounded-xl transition-colors text-sm"
                >
                  Bekijk profiel
                </button>
              </div>
            </div>
          </div>
          </div>
        </template>
      </div>

      <!-- Back to questionnaire -->
      <div class="max-w-6xl mx-auto mt-12 text-center">
        <p class="text-neutral-600 mb-4">Niet tevreden met de matches?</p>
        <button
          @click="retakeQuestionnaire"
          class="text-primary-600 hover:text-primary-700 font-medium underline"
        >
          Vul de vragenlijst opnieuw in
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachesStore } from '@/stores/useCoaches'
import { useQuestionStore } from '@/stores/useQuestions'
import { getAreaDisplayName } from '@/utils/areas'

// Router for navigation
const router = useRouter()

// Stores
const coachesStore = useCoachesStore()
const questionStore = useQuestionStore()

// Local filters state
const filters = ref({
  location: '',
  maxPrice: null,
  minRating: 0
})

// Computed properties
const matchedCoaches = computed(() => coachesStore.matchedCoaches)
const displayedCoaches = computed(() => coachesStore.filteredCoaches)
const availableLocations = computed(() => coachesStore.availableLocations)
const areasNeedingImprovement = computed(() => questionStore.areasNeedingImprovement)

// getAreaDisplayName imported from @/utils/areas

/**
 * Apply filters to coach list
 */
const applyFilters = () => {
  coachesStore.updateFilters(filters.value)
}

/**
 * Reset all filters
 */
const resetFilters = () => {
  filters.value = {
    location: '',
    maxPrice: null,
    minRating: 0
  }
  coachesStore.resetFilters()
}

/**
 * View coach detail page
 */
const viewCoachDetail = (coachId) => {
  router.push(`/coach/${coachId}`)
}

/**
 * Return to questionnaire
 */
const retakeQuestionnaire = () => {
  questionStore.resetAnswers()
  router.push('/questionnaire')
}

// Redirect if user didn't go through questionnaire + email gate
onMounted(async () => {
  if (!questionStore.userEmail) {
    router.push('/questionnaire')
    return
  }
  // Ensure coaches are loaded (handles API failure during questionnaire)
  if (coachesStore.allCoaches.length === 0) {
    await coachesStore.fetchCoaches()
  }
  // Re-run matching if coaches were reloaded
  if (matchedCoaches.value.length === 0 && coachesStore.allCoaches.length > 0) {
    const userAnswers = {
      werk: questionStore.werk,
      sociaal: questionStore.sociaal,
      relatie: questionStore.relatie,
      financieel: questionStore.financieel,
      geluk: questionStore.geluk,
      gezondheid: questionStore.gezondheid,
      praktisch: questionStore.praktisch
    }
    coachesStore.matchCoaches(userAnswers)
  }
})
</script>

<style scoped>
/* Line clamp utility */
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
