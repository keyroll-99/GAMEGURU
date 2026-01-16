<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/client'

const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const isUploading = ref(false)
const uploadError = ref('')
const uploadSuccess = ref('')

const avatarUrl = computed(() => {
  if (authStore.user?.avatar_url) {
    return `${apiUrl}/${authStore.user.avatar_url}`
  }
  return null
})

const fileInput = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Walidacja typu
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    uploadError.value = 'Dozwolone są tylko pliki JPG i PNG'
    return
  }

  // Walidacja rozmiaru (1MB)
  if (file.size > 1024 * 1024) {
    uploadError.value = 'Maksymalny rozmiar pliku to 1MB'
    return
  }

  uploadError.value = ''
  uploadSuccess.value = ''
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const response = await apiClient.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    authStore.setUser(response.data.user)
    uploadSuccess.value = 'Avatar zaktualizowany!'
  } catch (err: any) {
    uploadError.value = err.response?.data?.message || 'Błąd podczas uploadu'
  } finally {
    isUploading.value = false
    // Reset input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-container">
      <h1>Twój profil</h1>

      <div class="profile-section">
        <h2>Avatar</h2>
        <div class="avatar-section">
          <div class="current-avatar">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="Twój avatar"
            />
            <span v-else class="avatar-placeholder-large">
              {{ authStore.user?.username?.charAt(0).toUpperCase() || '?' }}
            </span>
          </div>

          <div class="avatar-actions">
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png"
              @change="handleFileChange"
              class="hidden-input"
            />
            <button
              @click="triggerFileInput"
              class="btn btn-primary"
              :disabled="isUploading"
            >
              <span v-if="isUploading">Przesyłanie...</span>
              <span v-else>Zmień avatar</span>
            </button>
            <p class="avatar-hint">JPG lub PNG, max 500KB</p>

            <div v-if="uploadError" class="error-message">
              {{ uploadError }}
            </div>
            <div v-if="uploadSuccess" class="success-message">
              {{ uploadSuccess }}
            </div>
          </div>
        </div>
      </div>

      <div class="profile-section">
        <h2>Informacje o koncie</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Email</label>
            <p>{{ authStore.user?.email }}</p>
          </div>
          <div class="info-item">
            <label>Nazwa użytkownika</label>
            <p>{{ authStore.user?.username }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 2rem 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.profile-container h1 {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.profile-section {
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.profile-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}

.avatar-section {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
}

.current-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.current-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-large {
  color: white;
  font-size: 3rem;
  font-weight: 700;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hidden-input {
  display: none;
}

.avatar-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
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

.error-message {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.success-message {
  background-color: #dcfce7;
  color: #16a34a;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.info-item p {
  font-size: 1rem;
  color: var(--color-text);
}
</style>
