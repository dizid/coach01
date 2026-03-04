<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12">
    <div class="container mx-auto px-4 max-w-3xl">

      <div class="bg-white rounded-3xl shadow-soft-lg p-8 md:p-12 animate-fade-in">

        <h1 class="text-3xl md:text-4xl font-display font-bold text-neutral-800 mb-4">
          Contact
        </h1>

        <p class="text-lg text-neutral-600 mb-8">
          Heb je een vraag, opmerking of suggestie? We horen graag van je.
        </p>

        <div class="space-y-8">

          <!-- Email -->
          <div class="flex items-start gap-4">
            <div class="bg-primary-100 rounded-xl p-3 flex-shrink-0">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div>
              <h2 class="font-semibold text-neutral-800 mb-1">E-mail</h2>
              <a href="mailto:info@tnxz.nl" class="text-primary-600 hover:text-primary-700 underline">info@tnxz.nl</a>
              <p class="text-sm text-neutral-500 mt-1">We reageren meestal binnen 24 uur.</p>
            </div>
          </div>

          <!-- For coaches -->
          <div class="flex items-start gap-4">
            <div class="bg-accent-100 rounded-xl p-3 flex-shrink-0">
              <svg class="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <h2 class="font-semibold text-neutral-800 mb-1">Voor coaches</h2>
              <p class="text-sm text-neutral-600">
                Ben je coach en wil je je profiel aanpassen of verwijderen?
                Stuur ons een e-mail met je naam en de gewenste wijziging.
              </p>
            </div>
          </div>

          <!-- Bug reports -->
          <div class="flex items-start gap-4">
            <div class="bg-warm-100 rounded-xl p-3 flex-shrink-0">
              <svg class="w-6 h-6 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div>
              <h2 class="font-semibold text-neutral-800 mb-1">Probleem melden</h2>
              <p class="text-sm text-neutral-600">
                Werkt er iets niet goed op de website? Laat het ons weten via e-mail
                en we lossen het zo snel mogelijk op.
              </p>
            </div>
          </div>

        </div>

        <!-- Trust badges -->
        <div class="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-neutral-100">
          <div class="text-center">
            <div class="flex justify-center mb-2">
              <svg class="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <p class="text-xs text-neutral-500">Veilig & privé</p>
          </div>
          <div class="text-center">
            <div class="flex justify-center mb-2">
              <svg class="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-xs text-neutral-500">Snelle reactie</p>
          </div>
          <div class="text-center">
            <div class="flex justify-center mb-2">
              <svg class="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <p class="text-xs text-neutral-500">Gratis service</p>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
</script>
