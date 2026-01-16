<script setup lang="ts">
import { ref } from 'vue'
import { useProjectsStore } from '@/stores/projects'

const emit = defineEmits<{
  close: []
  created: [projectId: string]
}>()

const projectsStore = useProjectsStore()

const name = ref('')
const description = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (!name.value.trim()) {
    errorMessage.value = 'Nazwa projektu jest wymagana'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  const result = await projectsStore.createProject({
    name: name.value.trim(),
    description: description.value.trim() || undefined,
  })

  isSubmitting.value = false

  if (result.success && result.project) {
    emit('created', result.project.id)
    emit('close')
  } else {
    errorMessage.value = result.message
  }
}

function handleClose() {
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <div class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal">
      <div class="modal-header">
        <h2>Nowy projekt</h2>
        <button class="close-btn" @click="handleClose">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label for="name">Nazwa projektu *</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Np. Moja gra RPG"
            maxlength="255"
            :disabled="isSubmitting"
          />
        </div>

        <div class="form-group">
          <label for="description">Opis (opcjonalny)</label>
          <textarea
            id="description"
            v-model="description"
            placeholder="Krótki opis projektu..."
            rows="3"
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="modal-actions">
          <button
            type="button"
            class="btn btn-secondary"
            @click="handleClose"
            :disabled="isSubmitting"
          >
            Anuluj
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || !name.trim()"
          >
            {{ isSubmitting ? 'Tworzenie...' : 'Utwórz projekt' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-background);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  margin: 1rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text);
  opacity: 0.6;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  opacity: 1;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--color-background);
  color: var(--color-text);
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: hsla(160, 100%, 37%, 1);
}

.form-group input:disabled,
.form-group textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: hsla(160, 100%, 37%, 1);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: hsla(160, 100%, 32%, 1);
}

.btn-secondary {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-mute);
}
</style>
