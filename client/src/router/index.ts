import { createRouter, createWebHistory } from 'vue-router'
import { msalInstance } from '@/lib/msalConfig'

// Lazy-load each page to keep the initial bundle small.
const LoginPage      = () => import('@/pages/LoginPage.vue')
const DashboardPage  = () => import('@/pages/DashboardPage.vue')
const AlertsPage     = () => import('@/pages/AlertsPage.vue')
const IncidentsPage  = () => import('@/pages/IncidentsPage.vue')
const RiskyUsersPage = () => import('@/pages/RiskyUsersPage.vue')
const SecureScorePage = () => import('@/pages/SecureScorePage.vue')
const NotFoundPage   = () => import('@/pages/NotFoundPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginPage,
      meta: { requiresAuth: false },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: AlertsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/incidents',
      name: 'incidents',
      component: IncidentsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/risky-users',
      name: 'risky-users',
      component: RiskyUsersPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/secure-score',
      name: 'secure-score',
      component: SecureScorePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
    },
  ],
})

// Global navigation guard — redirect to login when not authenticated.
router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true

  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
