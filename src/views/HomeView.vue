<template>
  <!-- Modern, soft, friendly landing page -->
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">

    <!-- Hero Section -->
    <section class="container mx-auto px-4 py-16 md:py-24">
      <div class="max-w-4xl mx-auto text-center animate-fade-in">
        <!-- Main Heading -->
        <h1 class="text-5xl md:text-6xl font-display font-bold text-neutral-800 mb-6 leading-tight">
          Vind de coach die <span class="text-primary-600">perfect</span> bij jou past
        </h1>

        <!-- Subheading -->
        <p class="text-xl md:text-2xl text-neutral-600 mb-8 leading-relaxed">
          Welke gebieden in je leven verdienen meer aandacht?
          Wij matchen je met de ideale Nederlandse coach voor jouw unieke situatie.
        </p>

        <!-- Trust Indicators -->
        <div class="flex flex-wrap justify-center gap-8 mb-12 text-neutral-700">
          <div class="flex items-center gap-2">
            <svg class="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-medium">{{ coachesStore.allCoaches.length || '' }} gecertificeerde coaches</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-medium">Gratis match-service</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-6 h-6 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="font-medium">100% vrijblijvend</span>
          </div>
        </div>

        <!-- CTA Button -->
        <button
          @click="startQuestionnaire"
          class="group bg-primary-500 hover:bg-primary-600 text-white font-semibold text-lg px-12 py-5 rounded-2xl shadow-soft-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
        >
          <span>Start met de vragenlijst</span>
          <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </button>

        <!-- Small text under button -->
        <p class="mt-4 text-sm text-neutral-500">
          Het duurt slechts 2 minuten • Geen account nodig
        </p>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="bg-white py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-display font-bold text-center text-neutral-800 mb-12">
          Hoe werkt het?
        </h2>

        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <!-- Step 1 -->
          <div class="text-center animate-slide-up">
            <div class="bg-primary-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <span class="text-3xl font-bold text-primary-600">1</span>
            </div>
            <h3 class="text-xl font-semibold text-neutral-800 mb-3">Beantwoord de vragen</h3>
            <p class="text-neutral-600">
              Geef aan hoe tevreden je bent met verschillende levensgebieden. Dit duurt slechts 2 minuten.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="text-center animate-slide-up" style="animation-delay: 0.1s">
            <div class="bg-accent-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <span class="text-3xl font-bold text-accent-600">2</span>
            </div>
            <h3 class="text-xl font-semibold text-neutral-800 mb-3">Ontvang matches</h3>
            <p class="text-neutral-600">
              Ons slimme algoritme matcht je met coaches die perfect passen bij jouw behoeften.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="text-center animate-slide-up" style="animation-delay: 0.2s">
            <div class="bg-secondary-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
              <span class="text-3xl font-bold text-secondary-600">3</span>
            </div>
            <h3 class="text-xl font-semibold text-neutral-800 mb-3">Neem contact op</h3>
            <p class="text-neutral-600">
              Kies de coach die je aanspreekt en plan een vrijblijvende kennismaking.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Coaches Preview -->
    <section class="py-16 bg-gradient-to-br from-accent-50 to-primary-50">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-display font-bold text-center text-neutral-800 mb-4">
          Topbeoordeelde coaches
        </h2>
        <p class="text-center text-neutral-600 mb-12 text-lg">
          Ontdek enkele van onze beste coaches
        </p>

        <!-- Loading state for top coaches -->
        <div v-if="coachesStore.loading" class="flex justify-center gap-6 max-w-5xl mx-auto">
          <div
            v-for="i in 3"
            :key="i"
            class="bg-white rounded-2xl shadow-soft overflow-hidden w-full max-w-xs"
          >
            <div class="h-48 bg-neutral-100 animate-pulse"></div>
            <div class="p-6 space-y-3">
              <div class="h-5 bg-neutral-100 rounded animate-pulse w-3/4"></div>
              <div class="h-4 bg-neutral-100 rounded animate-pulse w-1/2"></div>
              <div class="h-4 bg-neutral-100 rounded animate-pulse w-full"></div>
            </div>
          </div>
        </div>

        <div v-else class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div
            v-for="coach in topCoaches"
            :key="coach.id"
            class="bg-white rounded-2xl shadow-soft hover:shadow-soft-lg transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
          >
            <div class="h-48 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
              <img
                :src="coach.image"
                :alt="coach.name"
                class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>
            <div class="p-6">
              <h3 class="font-semibold text-xl text-neutral-800 mb-2">{{ coach.name }}</h3>
              <div class="flex items-center gap-1 mb-3">
                <svg class="w-5 h-5 text-warm-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="font-medium text-neutral-700">{{ coach.rating }}</span>
                <span class="text-neutral-500 text-sm">({{ coach.reviewCount }} reviews)</span>
              </div>
              <p class="text-neutral-600 text-sm mb-3 line-clamp-2">{{ coach.bio }}</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="specialty in coach.specialties.slice(0, 2)"
                  :key="specialty"
                  class="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium"
                >
                  {{ specialty }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center mt-12">
          <button
            @click="startQuestionnaire"
            class="bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300"
          >
            Bekijk alle coaches
          </button>
        </div>
      </div>
    </section>

    <!-- FAQ or Benefits Section -->
    <section class="py-16 bg-white">
      <div class="container mx-auto px-4 max-w-4xl">
        <h2 class="text-4xl font-display font-bold text-center text-neutral-800 mb-12">
          Waarom onze coach matching?
        </h2>

        <div class="grid md:grid-cols-2 gap-8">
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-lg text-neutral-800 mb-2">Persoonlijke matching</h3>
              <p class="text-neutral-600">Ons algoritme vindt coaches die écht bij jouw situatie passen.</p>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-lg text-neutral-800 mb-2">Gecertificeerde professionals</h3>
              <p class="text-neutral-600">Alle coaches zijn gecertificeerd en hebben bewezen expertise.</p>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-lg text-neutral-800 mb-2">Snelle respons</h3>
              <p class="text-neutral-600">De meeste coaches reageren binnen 24 uur op je aanvraag.</p>
            </div>
          </div>

          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-warm-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                </svg>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-lg text-neutral-800 mb-2">100% vrijblijvend</h3>
              <p class="text-neutral-600">Geen verplichtingen. Neem eerst kennismakingsgesprek.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-20 bg-gradient-to-r from-primary-500 to-primary-600">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl font-display font-bold text-white mb-6">
          Klaar om de juiste coach te vinden?
        </h2>
        <p class="text-xl text-primary-50 mb-8 max-w-2xl mx-auto">
          Begin vandaag nog met je persoonlijke ontwikkeling. Het kost je slechts 2 minuten.
        </p>
        <button
          @click="startQuestionnaire"
          class="bg-white text-primary-600 hover:bg-primary-50 font-semibold text-lg px-12 py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3"
        >
          <span>Start nu gratis</span>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </button>
      </div>
    </section>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachesStore } from '@/stores/useCoaches'

// Router for navigation
const router = useRouter()

// Access coaches store (also used for loading state in template)
const coachesStore = useCoachesStore()

// Get top-rated coaches for preview
const topCoaches = computed(() => coachesStore.topRatedCoaches)

/**
 * Navigate to questionnaire
 */
const startQuestionnaire = () => {
  router.push('/questionnaire')
}
</script>

<style scoped>
/* Line clamp utility for truncating text */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
