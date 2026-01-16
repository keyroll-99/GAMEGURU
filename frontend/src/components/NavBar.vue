<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useDark, useToggle } from '@vueuse/core'

const router = useRouter()
const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const avatarUrl = computed(() => {
  if (authStore.user?.avatar_url) {
    return `${apiUrl}/${authStore.user.avatar_url}`
  }
  return null
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-container">
      <RouterLink to="/" class="navbar-brand">
        🎮 GameGuru
      </RouterLink>

      <nav class="navbar-nav">
        <button class="icon-btn" @click="toggleDark()" title="Toggle Dark Mode">
          {{ isDark ? '🌙' : '☀️' }}
        </button>

        <template v-if="authStore.isAuthenticated">
          <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
          
          <div class="user-menu">
            <div class="user-avatar">
              <img
                v-if="avatarUrl"
                :src="avatarUrl"
                :alt="authStore.user?.username"
              />
              <span v-else class="avatar-placeholder">
                {{ authStore.user?.username?.charAt(0).toUpperCase() || '?' }}
              </span>
            </div>
            <span class="username">{{ authStore.user?.username }}</span>
            <button @click="handleLogout" class="btn btn-outline btn-sm">
              Wyloguj
            </button>
          </div>
        </template>

        <template v-else>
          <RouterLink to="/login" class="nav-link">Zaloguj się</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">
            Zarejestruj się
          </RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  padding: 0 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.navbar-brand {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-heading);
  text-decoration: none;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  color: var(--color-text);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease;
}

.nav-link:hover {
  background-color: var(--color-background-soft);
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.username {
  font-weight: 500;
  color: var(--color-heading);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-outline:hover {
  background-color: var(--color-background-soft);
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background-color: var(--color-background-soft);
}
  color: var(--color-text);
}

.btn-outline:hover {
  background-color: var(--color-background-soft);
}
</style>
