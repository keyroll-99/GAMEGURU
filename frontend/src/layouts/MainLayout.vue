<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const router = useRouter()
const authStore = useAuthStore()
const isAuthenticated = computed(() => authStore.isAuthenticated)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

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
  <div class="layout">
    <header class="header">
      <div class="header-container">
        <RouterLink to="/" class="logo">
          <span class="logo-icon">🎮</span>
          <span class="logo-text">GameGuru</span>
        </RouterLink>

        <nav class="nav">
          <template v-if="isAuthenticated">
            <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
            
            <RouterLink to="/profile" class="user-info">
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
            </RouterLink>
            
            <button @click="handleLogout" class="nav-link nav-button">Wyloguj</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="nav-link">Zaloguj</RouterLink>
            <RouterLink to="/register" class="nav-link nav-button-primary">Rejestracja</RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main class="main">
      <slot />
    </main>

    <footer class="footer">
      <div class="footer-container">
        <p>&copy; {{ new Date().getFullYear() }} GameGuru. Wszystkie prawa zastrzeżone.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.header {
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  flex-shrink: 0;
}

.header-container {
  width: 100%;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-text);
}

.logo:hover {
  color: var(--color-primary);
}

.logo-icon {
  font-size: 1.5rem;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  color: var(--color-text-muted);
  transition: all 0.15s ease;
}

.nav-link:hover {
  color: var(--color-text);
  background-color: var(--color-background-muted);
}

.nav-button {
  background: none;
  border: 1px solid var(--color-border);
}

.nav-button-primary {
  background-color: var(--color-primary);
  color: white !important;
}

.nav-button-primary:hover {
  background-color: var(--color-primary-hover);
  color: white !important;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: background-color 0.15s ease;
}

.user-info:hover {
  background-color: var(--color-background-muted);
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
  color: var(--color-text);
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.footer {
  background-color: var(--color-background-soft);
  border-top: 1px solid var(--color-border);
  padding: 1.5rem 0;
  width: 100%;
  flex-shrink: 0;
}

.footer-container {
  width: 100%;
  padding: 0 1.5rem;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
</style>
