import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:id/settings',
      name: 'project-settings',
      component: () => import('../views/ProjectSettingsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:id/board',
      name: 'project-board',
      component: () => import('../views/ProjectBoardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:id/notes',
      name: 'project-notes',
      component: () => import('../views/ProjectNotesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects/:id/story',
      name: 'project-story',
      component: () => import('../views/ProjectStoryView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Navigation guard dla protected routes
router.beforeEach((to, _from, next) => {
  const accessToken = localStorage.getItem('accessToken')

  // Zalogowany użytkownik na stronie głównej -> dashboard
  if (to.name === 'home' && accessToken) {
    next({ name: 'dashboard' })
    return
  }

  // Niezalogowany na protected route -> login
  if (to.meta.requiresAuth && !accessToken) {
    next({ name: 'login' })
    return
  }

  next()
})

export default router
