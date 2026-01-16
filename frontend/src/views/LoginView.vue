<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Wypełnij wszystkie pola'
    return
  }

  const result = await authStore.login({
    email: email.value,
    password: password.value,
  })

  if (result.success) {
    toast.success('Zalogowano pomyślnie!')
    router.push('/dashboard')
  } else {
    // errorMessage.value = result.message
    toast.error(result.message || 'Błąd logowania')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <h1>Zaloguj się</h1>
      <p class="auth-subtitle">Wprowadź dane logowania</p>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            placeholder="twoj@email.com"
            :disabled="authStore.isLoading"
          />
        </div>

        <div class="form-group">
          <label for="password">Hasło</label>
          <input
            v-model="password"
            type="password"
            id="password"
            placeholder="••••••••"
            :disabled="authStore.isLoading"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-block"
          :disabled="authStore.isLoading"
        >
          <span v-if="authStore.isLoading">Logowanie...</span>
          <span v-else>Zaloguj się</span>
        </button>
      </form>

      <p class="auth-footer">
        Nie masz konta? <RouterLink to="/register">Zarejestruj się</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: 2rem;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
}

.auth-container h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  text-align: center;
}

.auth-subtitle {
  color: var(--color-text-muted);
  text-align: center;
  margin-bottom: 2rem;
}

.error-message {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.15s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn-block {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: var(--color-text-muted);
}

.auth-footer a {
  color: var(--color-primary);
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>
