<template>
  <div v-if="coach" class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12">
    <div class="container mx-auto px-4 max-w-5xl">

      <!-- Back Button -->
      <button
        @click="goBack"
        class="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 font-medium mb-6 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span>Terug naar overzicht</span>
      </button>

      <!-- Coach Profile Card -->
      <div class="bg-white rounded-3xl shadow-soft-lg overflow-hidden animate-fade-in">

        <!-- Header Section with Image -->
        <div class="relative bg-gradient-to-br from-primary-100 via-accent-50 to-secondary-100 h-64 md:h-80">
          <img
            :src="coach.image"
            :alt="coach.name"
            class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-8 border-white shadow-xl"
          />
        </div>

        <!-- Profile Content -->
        <div class="pt-24 md:pt-28 px-6 md:px-12 pb-12">

          <!-- Name and Location -->
          <div class="text-center mb-8">
            <h1 class="text-4xl font-display font-bold text-neutral-800 mb-2">{{ coach.name }}</h1>
            <p class="text-lg text-neutral-600 flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              {{ coach.location }}
            </p>
          </div>

          <!-- Stats Row -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <!-- Rating -->
            <div class="text-center">
              <div class="flex items-center justify-center gap-1 mb-1">
                <svg class="w-6 h-6 text-warm-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="text-2xl font-bold text-neutral-800">{{ coach.rating }}</span>
              </div>
              <p class="text-sm text-neutral-600">{{ coach.reviewCount }} reviews</p>
            </div>

            <!-- Experience -->
            <div class="text-center">
              <p class="text-2xl font-bold text-neutral-800 mb-1">{{ coach.experience }} jaar</p>
              <p class="text-sm text-neutral-600">Ervaring</p>
            </div>

            <!-- Sessions -->
            <div class="text-center">
              <p class="text-2xl font-bold text-neutral-800 mb-1">{{ coach.sessionsCompleted }}+</p>
              <p class="text-sm text-neutral-600">Sessies gegeven</p>
            </div>

            <!-- Response Time -->
            <div class="text-center">
              <p class="text-2xl font-bold text-neutral-800 mb-1">{{ coach.responseTime }}</p>
              <p class="text-sm text-neutral-600">Reactietijd</p>
            </div>
          </div>

          <!-- Bio -->
          <div class="mb-8">
            <h2 class="text-2xl font-display font-semibold text-neutral-800 mb-4">Over mij</h2>
            <p class="text-lg text-neutral-700 leading-relaxed">{{ coach.bio }}</p>
          </div>

          <!-- Specialties -->
          <div class="mb-8">
            <h2 class="text-2xl font-display font-semibold text-neutral-800 mb-4">Specialisaties</h2>
            <div class="flex flex-wrap gap-3">
              <span
                v-for="specialty in coach.specialties"
                :key="specialty"
                class="px-4 py-2 bg-primary-100 text-primary-700 rounded-xl font-medium capitalize"
              >
                {{ specialty }}
              </span>
            </div>
          </div>

          <!-- Approach -->
          <div class="mb-8">
            <h2 class="text-2xl font-display font-semibold text-neutral-800 mb-4">Mijn aanpak</h2>
            <p class="text-lg text-neutral-700">{{ coach.approach }}</p>
          </div>

          <!-- Certifications -->
          <div class="mb-8">
            <h2 class="text-2xl font-display font-semibold text-neutral-800 mb-4">Certificeringen</h2>
            <ul class="space-y-2">
              <li
                v-for="cert in coach.certifications"
                :key="cert"
                class="flex items-center gap-2 text-neutral-700"
              >
                <svg class="w-5 h-5 text-accent-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span>{{ cert }}</span>
              </li>
            </ul>
          </div>

          <!-- Languages & Availability -->
          <div class="grid md:grid-cols-2 gap-6 mb-12">
            <div>
              <h3 class="font-semibold text-neutral-800 mb-3">Talen</h3>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="lang in coach.languages"
                  :key="lang"
                  class="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-lg text-sm"
                >
                  {{ lang }}
                </span>
              </div>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-800 mb-3">Beschikbaarheid</h3>
              <p class="text-neutral-700">{{ coach.availability }}</p>
            </div>
          </div>

          <!-- Pricing & CTA Section -->
          <div class="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-8">
            <div class="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p class="text-sm text-neutral-600 mb-1">Prijs per sessie</p>
                <p class="text-4xl font-bold text-neutral-800 mb-1">€{{ coach.price }}</p>
                <p class="text-neutral-600">{{ coach.priceType }}</p>
              </div>
              <button
                @click="contactCoach"
                class="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-lg px-10 py-4 rounded-2xl shadow-soft-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span>Neem contact op</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Testimonials Section (placeholder - can be expanded) -->
      <div class="mt-12 bg-white rounded-3xl shadow-soft-lg p-8 md:p-12">
        <h2 class="text-3xl font-display font-bold text-neutral-800 mb-6 text-center">
          Wat anderen zeggen
        </h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-primary-50 rounded-2xl p-6">
            <div class="flex items-center gap-1 mb-3">
              <svg v-for="i in 5" :key="i" class="w-4 h-4 text-warm-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <p class="text-neutral-700 mb-4 italic">"Geweldige coach die echt luistert en praktische adviezen geeft!"</p>
            <p class="text-sm text-neutral-600 font-medium">- Maria, 34</p>
          </div>
          <div class="bg-accent-50 rounded-2xl p-6">
            <div class="flex items-center gap-1 mb-3">
              <svg v-for="i in 5" :key="i" class="w-4 h-4 text-warm-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <p class="text-neutral-700 mb-4 italic">"Dankzij deze coach heb ik mijn werk-privé balans teruggevonden."</p>
            <p class="text-sm text-neutral-600 font-medium">- Jan, 42</p>
          </div>
          <div class="bg-secondary-50 rounded-2xl p-6">
            <div class="flex items-center gap-1 mb-3">
              <svg v-for="i in 5" :key="i" class="w-4 h-4 text-warm-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <p class="text-neutral-700 mb-4 italic">"Professioneel, warm en resultaatgericht. Aanrader!"</p>
            <p class="text-sm text-neutral-600 font-medium">- Sarah, 28</p>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Loading state -->
  <div v-else-if="coachesStore.loading" class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
      <p class="text-neutral-500 text-lg">Laden...</p>
    </div>
  </div>

  <!-- Not Found / Error State -->
  <div v-else class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-xl text-neutral-600 mb-4">{{ coachesStore.error || 'Coach niet gevonden' }}</p>
      <button
        @click="$router.push('/coaches')"
        class="text-primary-600 hover:text-primary-700 font-medium underline"
      >
        Terug naar overzicht
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoachesStore } from '@/stores/useCoaches'

// Router
const route = useRoute()
const router = useRouter()

// Store
const coachesStore = useCoachesStore()

// Get coach ID from route params
const coachId = computed(() => parseInt(route.params.id))

// Get coach data — reactive so it updates after async fetch
const coach = computed(() => coachesStore.getCoachById(coachId.value))

/**
 * Navigate back to coaches list
 */
const goBack = () => {
  router.push('/coaches')
}

/**
 * Navigate to contact/booking page
 */
const contactCoach = () => {
  if (coach.value) {
    router.push(`/coach/${coach.value.id}/contact`)
  }
}

onMounted(async () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // If coach not yet in local state (e.g. user navigated directly via URL),
  // fetch it individually from the API
  if (!coach.value) {
    await coachesStore.fetchCoachById(coachId.value)
  }
})
</script>
