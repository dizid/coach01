import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

/**
 * Application routes
 * Defines all navigation paths for the coach matching platform
 */
const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: 'Vind de perfecte coach - Coach Matching Platform'
    }
  },
  {
    path: '/questionnaire',
    name: 'questionnaire',
    // Lazy-loaded questionnaire view
    component: () => import(/* webpackChunkName: "questionnaire" */ '../views/QuestionnaireView.vue'),
    meta: {
      title: 'Vragenlijst - Vind jouw coach'
    }
  },
  {
    path: '/coaches',
    name: 'coaches',
    // Lazy-loaded coaches results view
    component: () => import(/* webpackChunkName: "coaches" */ '../views/CoachesView.vue'),
    meta: {
      title: 'Jouw Coach Matches'
    }
  },
  {
    path: '/coach/:id',
    name: 'coach-detail',
    // Lazy-loaded coach detail view
    component: () => import(/* webpackChunkName: "coach-detail" */ '../views/CoachDetailView.vue'),
    meta: {
      title: 'Coach Profiel'
    }
  },
  {
    path: '/coach/:id/contact',
    name: 'contact-coach',
    // Lazy-loaded contact/booking view
    component: () => import(/* webpackChunkName: "contact" */ '../views/ContactCoachView.vue'),
    meta: {
      title: 'Neem Contact Op'
    }
  },
  {
    path: '/about',
    name: 'about',
    // Keep existing about page for reference
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue'),
    meta: {
      title: 'Over Ons'
    }
  },
  {
    // Catch-all route for 404 - redirect to home
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  // Scroll to top on route change
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Update page title on route change
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Coach Matching Platform'
  next()
})

export default router
