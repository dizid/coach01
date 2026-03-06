<template>
  <div id="app">
    <!-- Modern Navigation Bar -->
    <nav class="bg-white shadow-soft sticky top-0 z-50">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-20">

          <!-- Logo / Brand -->
          <router-link to="/" class="flex items-center gap-3 group">
            <div class="bg-gradient-to-br from-primary-500 to-primary-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-soft-lg transition-all">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div class="hidden md:block">
              <span class="font-display font-bold text-xl text-neutral-800">CoachMatch</span>
              <p class="text-xs text-neutral-500">Vind jouw perfecte coach</p>
            </div>
          </router-link>

          <!-- Desktop Navigation Links -->
          <div class="hidden md:flex items-center gap-8">
            <router-link
              to="/"
              class="text-neutral-700 hover:text-primary-600 font-medium transition-colors relative group"
            >
              Home
              <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
            </router-link>
            <router-link
              to="/questionnaire"
              class="text-neutral-700 hover:text-primary-600 font-medium transition-colors relative group"
            >
              Vragenlijst
              <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
            </router-link>
            <router-link
              to="/coaches"
              v-if="hasMatches"
              class="text-neutral-700 hover:text-primary-600 font-medium transition-colors relative group"
            >
              Mijn Matches
              <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
            </router-link>
          </div>

          <!-- CTA Button -->
          <div class="hidden md:block">
            <router-link
              to="/questionnaire"
              class="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold px-6 py-3 rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-2"
            >
              <span>Start nu</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </router-link>
          </div>

          <!-- Mobile Menu Button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <svg v-else class="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Mobile Menu -->
        <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-neutral-200 animate-fade-in">
          <div class="flex flex-col gap-4">
            <router-link
              to="/"
              @click="mobileMenuOpen = false"
              class="text-neutral-700 hover:text-primary-600 font-medium py-2 transition-colors"
            >
              Home
            </router-link>
            <router-link
              to="/questionnaire"
              @click="mobileMenuOpen = false"
              class="text-neutral-700 hover:text-primary-600 font-medium py-2 transition-colors"
            >
              Vragenlijst
            </router-link>
            <router-link
              to="/coaches"
              v-if="hasMatches"
              @click="mobileMenuOpen = false"
              class="text-neutral-700 hover:text-primary-600 font-medium py-2 transition-colors"
            >
              Mijn Matches
            </router-link>
            <router-link
              to="/questionnaire"
              @click="mobileMenuOpen = false"
              class="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold px-6 py-3 rounded-xl shadow-soft text-center"
            >
              Start nu
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content Area -->
    <main>
      <router-view/>
    </main>

    <!-- Footer -->
    <footer class="bg-neutral-800 text-white py-12 mt-20">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-4 gap-8 mb-8">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="bg-gradient-to-br from-primary-500 to-primary-600 w-10 h-10 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <span class="font-display font-bold text-xl">CoachMatch</span>
            </div>
            <p class="text-neutral-400 text-sm">
              Vind de perfecte coach die bij jouw unieke situatie past.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="font-semibold mb-4">Navigatie</h3>
            <ul class="space-y-2 text-sm">
              <li><router-link to="/" class="text-neutral-400 hover:text-white transition-colors">Home</router-link></li>
              <li><router-link to="/questionnaire" class="text-neutral-400 hover:text-white transition-colors">Vragenlijst</router-link></li>
              <li><router-link to="/coaches" class="text-neutral-400 hover:text-white transition-colors">Coaches</router-link></li>
            </ul>
          </div>

          <!-- Info -->
          <div>
            <h3 class="font-semibold mb-4">Informatie</h3>
            <ul class="space-y-2 text-sm">
              <li><router-link to="/about" class="text-neutral-400 hover:text-white transition-colors">Over ons</router-link></li>
              <li><router-link to="/questionnaire" class="text-neutral-400 hover:text-white transition-colors">Hoe het werkt</router-link></li>
              <li><router-link to="/contact" class="text-neutral-400 hover:text-white transition-colors">Voor coaches</router-link></li>
            </ul>
          </div>

          <!-- Legal -->
          <div>
            <h3 class="font-semibold mb-4">Juridisch</h3>
            <ul class="space-y-2 text-sm">
              <li><router-link to="/privacy" class="text-neutral-400 hover:text-white transition-colors">Privacy beleid</router-link></li>
              <li><router-link to="/terms" class="text-neutral-400 hover:text-white transition-colors">Algemene voorwaarden</router-link></li>
              <li><router-link to="/contact" class="text-neutral-400 hover:text-white transition-colors">Contact</router-link></li>
            </ul>
          </div>
        </div>

        <!-- Copyright -->
        <div class="border-t border-neutral-700 pt-8 text-center text-sm text-neutral-400">
          <p>&copy; {{ currentYear }} CoachMatch. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCoachesStore } from '@/stores/useCoaches'

// Mobile menu state
const mobileMenuOpen = ref(false)

// Access stores
const coachesStore = useCoachesStore()

// Check if user has matched coaches
const hasMatches = computed(() => coachesStore.matchedCoaches.length > 0)

// Current year for footer
const currentYear = new Date().getFullYear()

// Load coaches from API on app mount
onMounted(() => {
  coachesStore.fetchCoaches()
})
</script>

<style>
/* Global app styles */
#app {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

/* Active router link styling */
.router-link-active {
  color: #0ea5e9;
}

/* Smooth transitions for all interactive elements */
* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>
