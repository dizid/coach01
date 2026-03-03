<template>
  <div v-if="coach" class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12">
    <div class="container mx-auto px-4 max-w-3xl">

      <!-- Back Button -->
      <button
        @click="goBack"
        class="flex items-center gap-2 text-neutral-600 hover:text-neutral-800 font-medium mb-6 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        <span>Terug naar profiel</span>
      </button>

      <!-- Contact Form Card -->
      <div class="bg-white rounded-3xl shadow-soft-lg p-8 md:p-12 animate-fade-in">

        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex items-center justify-center mb-4">
            <img
              :src="coach.image"
              :alt="coach.name"
              class="w-24 h-24 rounded-full object-cover border-4 border-primary-100 shadow-md"
            />
          </div>
          <h1 class="text-3xl md:text-4xl font-display font-bold text-neutral-800 mb-2">
            Neem contact op met {{ coach.name }}
          </h1>
          <p class="text-lg text-neutral-600">
            Vul het formulier in en {{ coach.name.split(' ')[0] }} neemt {{ coach.responseTime }} contact met je op
          </p>
        </div>

        <!-- Success Message (shown after submission) -->
        <div v-if="submitted" class="animate-fade-in">
          <div class="bg-accent-50 border-2 border-accent-200 rounded-2xl p-8 mb-6">
            <div class="flex items-center justify-center mb-4">
              <div class="bg-accent-500 rounded-full p-3">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            </div>
            <h2 class="text-2xl font-bold text-neutral-800 text-center mb-3">Je bericht is verstuurd!</h2>
            <p class="text-neutral-700 text-center mb-6">
              {{ coach.name }} heeft je aanvraag ontvangen en neemt {{ coach.responseTime }} contact met je op via {{ formData.userEmail }}.
            </p>
            <div class="bg-white rounded-xl p-4 mb-4">
              <p class="text-sm text-neutral-600 mb-2">Je aanvraagnummer:</p>
              <p class="font-mono text-primary-600 font-semibold">{{ bookingId }}</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                @click="$router.push('/coaches')"
                class="px-6 py-3 bg-white border-2 border-neutral-200 hover:border-neutral-300 rounded-xl font-medium transition-colors"
              >
                Bekijk andere coaches
              </button>
              <button
                @click="$router.push('/')"
                class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
              >
                Terug naar home
              </button>
            </div>
          </div>
        </div>

        <!-- Contact Form (shown before submission) -->
        <form v-else @submit.prevent="submitForm" class="space-y-6">

          <!-- Name -->
          <div>
            <label class="block text-neutral-700 font-medium mb-2">
              Jouw naam <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.userName"
              type="text"
              required
              placeholder="Bijv: Jan de Vries"
              class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-neutral-700 font-medium mb-2">
              E-mailadres <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.userEmail"
              type="email"
              required
              placeholder="jou@voorbeeld.nl"
              class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
            />
            <p class="text-sm text-neutral-500 mt-1">De coach neemt via dit adres contact met je op</p>
          </div>

          <!-- Phone (optional) -->
          <div>
            <label class="block text-neutral-700 font-medium mb-2">
              Telefoonnummer <span class="text-neutral-400">(optioneel)</span>
            </label>
            <input
              v-model="formData.userPhone"
              type="tel"
              placeholder="06-12345678"
              class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
            />
          </div>

          <!-- Session Type -->
          <div>
            <label class="block text-neutral-700 font-medium mb-2">
              Type sessie <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.sessionType"
              required
              class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">Selecteer type sessie</option>
              <option value="intake">Vrijblijvend kennismakingsgesprek</option>
              <option value="regular">Enkele sessie (€{{ coach.price }})</option>
              <option value="package">Pakket van meerdere sessies</option>
            </select>
          </div>

          <!-- Preferred Date (optional) -->
          <div>
            <label class="block text-neutral-700 font-medium mb-2">
              Voorkeursdatum <span class="text-neutral-400">(optioneel)</span>
            </label>
            <input
              v-model="formData.preferredDate"
              type="date"
              :min="minDate"
              class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors"
            />
          </div>

          <!-- Message -->
          <div>
            <label class="block text-neutral-700 font-medium mb-2">
              Jouw bericht <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="formData.userMessage"
              rows="5"
              required
              placeholder="Vertel iets over je situatie en wat je hoopt te bereiken met coaching..."
              class="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary-400 focus:outline-none transition-colors resize-none"
            ></textarea>
            <p class="text-sm text-neutral-500 mt-1">Minimaal 20 karakters</p>
          </div>

          <!-- Privacy Notice -->
          <div class="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-4">
            <div class="flex items-start gap-3">
              <input
                v-model="formData.privacyAccepted"
                type="checkbox"
                required
                class="mt-1 w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label class="text-sm text-neutral-700">
                Ik ga akkoord met het delen van mijn contactgegevens met {{ coach.name }} voor het maken van een afspraak.
                Mijn gegevens worden niet voor andere doeleinden gebruikt. <span class="text-red-500">*</span>
              </label>
            </div>
          </div>

          <!-- Price Summary -->
          <div class="bg-primary-50 border-2 border-primary-200 rounded-xl p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-neutral-700 font-medium">Prijs per sessie</span>
              <span class="text-2xl font-bold text-neutral-800">€{{ coach.price }}</span>
            </div>
            <p class="text-sm text-neutral-600">{{ coach.priceType }}</p>
            <p class="text-xs text-neutral-500 mt-2">
              Een kennismakingsgesprek is vaak gratis of tegen gereduceerd tarief.
            </p>
          </div>

          <!-- Error message -->
          <div v-if="submitError" class="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {{ submitError }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting || !isFormValid"
            class="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold text-lg px-8 py-4 rounded-2xl shadow-soft-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
          >
            <svg v-if="!isSubmitting" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <svg v-else class="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isSubmitting ? 'Bezig met verzenden...' : 'Verstuur aanvraag' }}</span>
          </button>

          <p class="text-center text-sm text-neutral-500">
            Door dit formulier te versturen ga je geen enkele verplichting aan
          </p>
        </form>

      </div>

      <!-- Trust Indicators -->
      <div v-if="!submitted" class="mt-8 grid md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 text-center shadow-soft">
          <svg class="w-8 h-8 text-accent-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          <p class="text-sm font-medium text-neutral-700">Jouw gegevens zijn veilig</p>
        </div>
        <div class="bg-white rounded-xl p-4 text-center shadow-soft">
          <svg class="w-8 h-8 text-accent-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <p class="text-sm font-medium text-neutral-700">100% vrijblijvend</p>
        </div>
        <div class="bg-white rounded-xl p-4 text-center shadow-soft">
          <svg class="w-8 h-8 text-accent-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm font-medium text-neutral-700">Reactie {{ coach.responseTime }}</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoachesStore } from '@/stores/useCoaches'
import { useQuestionStore } from '@/stores/useQuestions'

// Router
const route = useRoute()
const router = useRouter()

// Stores
const coachesStore = useCoachesStore()
const questionStore = useQuestionStore()

// Get coach ID from route params
const coachId = computed(() => parseInt(route.params.id))

// Get coach data
const coach = computed(() => coachesStore.getCoachById(coachId.value))

// Form state — pre-fill name + email from questionnaire store if available
const formData = ref({
  userName: questionStore.userName || '',
  userEmail: questionStore.userEmail || '',
  userPhone: '',
  sessionType: '',
  preferredDate: '',
  userMessage: '',
  privacyAccepted: false
})

const isSubmitting = ref(false)
const submitted = ref(false)
const bookingId = ref('')
const submitError = ref('')

// Minimum date (today)
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Form validation
const isFormValid = computed(() => {
  return formData.value.userName.trim().length > 0 &&
         formData.value.userEmail.trim().length > 0 &&
         formData.value.sessionType.length > 0 &&
         formData.value.userMessage.trim().length >= 20 &&
         formData.value.privacyAccepted
})

/**
 * Navigate back to coach profile
 */
const goBack = () => {
  router.push(`/coach/${coachId.value}`)
}

/**
 * Submit contact form — saves lead to DB and emails the coach via /api/contact.
 */
const submitForm = async () => {
  if (!isFormValid.value || !coach.value) return

  isSubmitting.value = true
  submitError.value = ''

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coachId: coach.value.id,
        userName: formData.value.userName,
        userEmail: formData.value.userEmail,
        userPhone: formData.value.userPhone || null,
        sessionType: formData.value.sessionType,
        preferredDate: formData.value.preferredDate || null,
        message: formData.value.userMessage,
        // Include questionnaire context so the coach gets the full picture
        questionnaire: {
          werk:         questionStore.werk,
          sociaal:      questionStore.sociaal,
          relatie:      questionStore.relatie,
          financieel:   questionStore.financieel,
          geluk:        questionStore.geluk,
          gezondheid:   questionStore.gezondheid,
          praktisch:    questionStore.praktisch,
          userGoal:     questionStore.userGoal || null,
          userTimeline: questionStore.userTimeline || null,
          preferredLocation: questionStore.preferredLocation || null,
          preferredPrice:    questionStore.preferredPrice || null,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Er ging iets mis. Probeer het opnieuw.')
    }

    bookingId.value = data.leadToken
    submitted.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (err) {
    submitError.value = err.message || 'Er ging iets mis. Probeer het opnieuw.'
  } finally {
    isSubmitting.value = false
  }
}

// Scroll to top on mount
onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})
</script>
