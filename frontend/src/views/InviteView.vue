<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const projectsStore = useProjectsStore()

const token = route.params.token as string
const message = ref('Trwa dołączanie do projektu...')
const isError = ref(false)

onMounted(async () => {
  if (!token) {
    message.value = 'Nieprawidłowy link zaproszeniowy'
    isError.value = true
    return
  }

  if (authStore.isAuthenticated) {
    // User is logged in, try to join
    const result = await projectsStore.joinProject(token)

    if (result.success && result.projectId) {
      message.value = 'Dołączono do projektu! Przekierowywanie...'
      setTimeout(() => {
        router.push(`/projects/${result.projectId}/board`)
      }, 1000)
    } else {
      message.value = result.message || 'Wystąpił błąd podczas dołączania do projektu'
      isError.value = true
    }
  } else {
    // User is NOT logged in
    // Save token for later
    localStorage.setItem('pendingInviteToken', token)

    message.value = 'Musisz się zalogować, aby dołączyć do projektu. Przekierowywanie...'
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  }
})
</script>

<template>
  <div class="invite-page">
    <div class="invite-card">
      <h1>Zaproszenie do projektu</h1>

      <div class="status-message" :class="{ error: isError }">
        {{ message }}
      </div>

      <div class="loader" v-if="!isError"></div>

      <div class="actions" v-if="isError">
        <button class="btn btn-primary" @click="router.push('/dashboard')">
          Wróć do panelu głównego
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invite-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--color-background-mute);
  padding: 2rem;
}

.invite-card {
  background: var(--color-background);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

h1 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.status-message {
  margin-bottom: 2rem;
  color: var(--color-text);
  font-size: 1.1rem;
}

.status-message.error {
  color: #ef4444;
}

.loader {
  width: 48px;
  height: 48px;
  border: 5px solid var(--color-border);
  border-bottom-color: hsla(160, 100%, 37%, 1);
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  background: hsla(160, 100%, 37%, 1);
  color: white;
  transition: all 0.2s;
}

.btn:hover {
  background: hsla(160, 100%, 32%, 1);
}
</style>
