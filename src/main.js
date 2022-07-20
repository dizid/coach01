import { createApp } from 'vue'
import App from './App.vue'
import './assets/tailwind.css'
import router from './router'
import { plugin, defaultConfig } from '@formkit/vue'
import { createPinia } from 'pinia'

createApp(App).use(router).use(plugin, defaultConfig).use(createPinia()).mount('#app')
