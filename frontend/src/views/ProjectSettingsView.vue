<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectHeader from '@/components/project/ProjectHeader.vue'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import type { ProjectMember } from '@/api/projects'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const authStore = useAuthStore()

const projectId = computed(() => route.params.id as string)

// Form state
const editName = ref('')
const editDescription = ref('')
const inviteEmail = ref('')
const transferUserId = ref('')

// UI state
const isSaving = ref(false)
const isInviting = ref(false)
const isTransferring = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const linkCopied = ref(false)

// Computed
const isOwner = computed(() => 
  projectsStore.currentProject?.owner_id === authStore.user?.id
)

const otherMembers = computed(() => 
  projectsStore.members.filter(m => m.user_id !== authStore.user?.id)
)

const projectLink = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}/mind-map/${projectId.value}`
})

onMounted(async () => {
  await loadProject()
})

async function loadProject() {
  const project = await projectsStore.fetchProject(projectId.value)
  if (project) {
    editName.value = project.name
    editDescription.value = project.description || ''
    await projectsStore.fetchMembers(projectId.value)
  }
}

function showSuccess(message: string) {
  successMessage.value = message
  setTimeout(() => successMessage.value = '', 3000)
}

function showError(message: string) {
  errorMessage.value = message
  setTimeout(() => errorMessage.value = '', 5000)
}

async function saveProject() {
  if (!editName.value.trim()) {
    showError('Nazwa projektu jest wymagana')
    return
  }

  isSaving.value = true
  const result = await projectsStore.updateProject(projectId.value, {
    name: editName.value.trim(),
    description: editDescription.value.trim() || undefined,
  })
  isSaving.value = false

  if (result.success) {
    showSuccess('Projekt zaktualizowany')
  } else {
    showError(result.message)
  }
}

async function inviteMember() {
  if (!inviteEmail.value.trim()) {
    showError('Podaj adres email')
    return
  }

  isInviting.value = true
  const result = await projectsStore.inviteMember(projectId.value, {
    email: inviteEmail.value.trim(),
  })
  isInviting.value = false

  if (result.success) {
    inviteEmail.value = ''
    showSuccess('Użytkownik został zaproszony')
  } else {
    showError(result.message)
  }
}

async function copyProjectLink() {
  try {
    await navigator.clipboard.writeText(projectLink.value)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 2000)
  } catch (e) {
    showError('Nie udało się skopiować linku')
  }
}

async function removeMember(member: ProjectMember) {
  if (!confirm(`Czy na pewno chcesz usunąć ${member.user.username} z projektu?`)) {
    return
  }

  const result = await projectsStore.removeMember(projectId.value, member.user_id)
  if (result.success) {
    showSuccess('Członek został usunięty')
  } else {
    showError(result.message)
  }
}

async function leaveProject() {
  if (!confirm('Czy na pewno chcesz opuścić ten projekt?')) {
    return
  }

  const result = await projectsStore.leaveProject(projectId.value)
  if (result.success) {
    router.push('/dashboard')
  } else {
    showError(result.message)
  }
}

async function archiveProject() {
  const action = projectsStore.currentProject?.is_archived ? 'przywrócić' : 'zarchiwizować'
  if (!confirm(`Czy na pewno chcesz ${action} ten projekt?`)) {
    return
  }

  const result = projectsStore.currentProject?.is_archived
    ? await projectsStore.unarchiveProject(projectId.value)
    : await projectsStore.archiveProject(projectId.value)

  if (result.success) {
    showSuccess(result.message)
  } else {
    showError(result.message)
  }
}

async function transferOwnership() {
  if (!transferUserId.value) {
    showError('Wybierz nowego właściciela')
    return
  }

  const member = projectsStore.members.find(m => m.user_id === transferUserId.value)
  if (!member) return

  if (!confirm(`Czy na pewno chcesz przekazać własność projektu użytkownikowi ${member.user.username}? Ta akcja jest nieodwracalna.`)) {
    return
  }

  isTransferring.value = true
  const result = await projectsStore.transferOwnership(projectId.value, {
    newOwnerId: transferUserId.value,
  })
  isTransferring.value = false

  if (result.success) {
    transferUserId.value = ''
    showSuccess('Własność projektu została przekazana')
    await loadProject()
  } else {
    showError(result.message)
  }
}

function goBack() {
  router.push('/dashboard')
}
</script>

<template>
  <div class="project-settings-container">
    <ProjectHeader
      :project-id="projectId"
      :project-name="projectsStore.currentProject?.name"
      :is-owner="isOwner"
    />

  <div class="project-settings">
    <!-- Messages -->
    <div v-if="successMessage" class="message success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="message error">{{ errorMessage }}</div>

    <!-- Loading -->
    <div v-if="projectsStore.isLoading" class="loading">
      <div class="spinner"></div>
      <p>Ładowanie...</p>
    </div>

    <template v-else-if="projectsStore.currentProject">
      <!-- Basic Info Section -->
      <section class="settings-section">
        <h2>Informacje podstawowe</h2>
        <div class="form-group">
          <label for="name">Nazwa projektu</label>
          <input
            id="name"
            v-model="editName"
            type="text"
            :disabled="!isOwner"
            maxlength="255"
          />
        </div>
        <div class="form-group">
          <label for="description">Opis</label>
          <textarea
            id="description"
            v-model="editDescription"
            rows="3"
            :disabled="!isOwner"
          ></textarea>
        </div>
        <button
          v-if="isOwner"
          class="btn btn-primary"
          :disabled="isSaving"
          @click="saveProject"
        >
          {{ isSaving ? 'Zapisywanie...' : 'Zapisz zmiany' }}
        </button>
      </section>

      <!-- Members Section -->
      <section class="settings-section">
        <h2>Członkowie projektu</h2>
        
        <!-- Invite form (owner only) -->
        <div v-if="isOwner" class="invite-form">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="Email użytkownika do zaproszenia"
            :disabled="isInviting"
          />
          <button
            class="btn btn-primary"
            :disabled="isInviting || !inviteEmail.trim()"
            @click="inviteMember"
          >
            {{ isInviting ? 'Zapraszanie...' : 'Zaproś' }}
          </button>
        </div>

        <!-- Copy project link -->
        <div v-if="isOwner" class="invite-link">
          <p class="invite-hint">
            Aby zaprosić użytkownika, musi on być zarejestrowany. Skopiuj link do projektu i wyślij go znajomemu:
          </p>
          <div class="invite-link-row">
            <input 
              type="text" 
              :value="projectLink" 
              readonly 
              class="invite-link-input"
            />
            <button 
              class="btn btn-secondary" 
              @click="copyProjectLink"
            >
              {{ linkCopied ? '✓ Skopiowano!' : '📋 Kopiuj link' }}
            </button>
          </div>
        </div>

        <!-- Members list -->
        <ul class="members-list">
          <li v-for="member in projectsStore.members" :key="member.user_id" class="member-item">
            <div class="member-info">
              <img
                v-if="member.user.avatar_url"
                :src="member.user.avatar_url"
                :alt="member.user.username"
                class="member-avatar"
              />
              <span v-else class="member-avatar-placeholder">
                {{ member.user.username.charAt(0).toUpperCase() }}
              </span>
              <div class="member-details">
                <span class="member-name">{{ member.user.username }}</span>
                <span class="member-email">{{ member.user.email }}</span>
              </div>
              <span v-if="member.role === 'OWNER'" class="role-badge owner">Właściciel</span>
              <span v-else class="role-badge member">Członek</span>
            </div>
            <div class="member-actions">
              <button
                v-if="isOwner && member.user_id !== authStore.user?.id"
                class="btn btn-danger-outline btn-sm"
                @click="removeMember(member)"
              >
                Usuń
              </button>
            </div>
          </li>
        </ul>

        <!-- Leave project (non-owner) -->
        <button
          v-if="!isOwner"
          class="btn btn-danger-outline"
          @click="leaveProject"
        >
          Opuść projekt
        </button>
      </section>

      <!-- Archive Section (owner only) -->
      <section v-if="isOwner" class="settings-section">
        <h2>Archiwizacja</h2>
        <p class="section-description">
          {{ projectsStore.currentProject.is_archived 
            ? 'Ten projekt jest zarchiwizowany. Możesz go przywrócić.'
            : 'Zarchiwizowany projekt będzie ukryty z głównej listy, ale nie zostanie usunięty.' 
          }}
        </p>
        <button
          class="btn"
          :class="projectsStore.currentProject.is_archived ? 'btn-primary' : 'btn-warning'"
          @click="archiveProject"
        >
          {{ projectsStore.currentProject.is_archived ? 'Przywróć projekt' : 'Archiwizuj projekt' }}
        </button>
      </section>

      <!-- Transfer Ownership Section (owner only) -->
      <section v-if="isOwner && otherMembers.length > 0" class="settings-section danger-zone">
        <h2>Przekaż własność</h2>
        <p class="section-description">
          Przekazanie własności sprawi, że stracisz uprawnienia właściciela. 
          Nowy właściciel będzie mógł zarządzać projektem i członkami.
        </p>
        <div class="transfer-form">
          <select v-model="transferUserId" :disabled="isTransferring">
            <option value="">Wybierz nowego właściciela</option>
            <option v-for="member in otherMembers" :key="member.user_id" :value="member.user_id">
              {{ member.user.username }} ({{ member.user.email }})
            </option>
          </select>
          <button
            class="btn btn-danger"
            :disabled="isTransferring || !transferUserId"
            @click="transferOwnership"
          >
            {{ isTransferring ? 'Przekazywanie...' : 'Przekaż własność' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</div>
</template>

<style scoped>
.project-settings-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.project-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  flex: 1;
  overflow-y: auto;
  width: 100%;
}

.message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.message.success {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: hsla(160, 100%, 37%, 1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.settings-section h2 {
  font-size: 1.125rem;
  margin: 0 0 1rem 0;
}

.section-description {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 1rem;
  background: var(--color-background);
  color: var(--color-text);
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

.invite-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.invite-form input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--color-background);
  color: var(--color-text);
}

.members-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.member-item:last-child {
  border-bottom: none;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.member-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: hsla(160, 100%, 37%, 0.2);
  color: hsla(160, 100%, 37%, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.member-details {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 500;
}

.member-email {
  font-size: 0.85rem;
  opacity: 0.7;
}

.role-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-badge.owner {
  background: hsla(160, 100%, 37%, 0.2);
  color: hsla(160, 100%, 37%, 1);
}

.role-badge.member {
  background: rgba(156, 163, 175, 0.2);
  color: #9ca3af;
}

.transfer-form {
  display: flex;
  gap: 0.75rem;
}

.transfer-form select {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--color-background);
  color: var(--color-text);
}

.danger-zone {
  border-color: rgba(239, 68, 68, 0.3);
}

.danger-zone h2 {
  color: #ef4444;
}

.btn {
  padding: 0.75rem 1.25rem;
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

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
}

.btn-primary {
  background: hsla(160, 100%, 37%, 1);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: hsla(160, 100%, 32%, 1);
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background: #d97706;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger-outline {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.btn-danger-outline:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
}

.btn-secondary {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.invite-link {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.invite-hint {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 12px 0;
}

.invite-link-row {
  display: flex;
  gap: 8px;
}

.invite-link-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  color: #64748b;
}
</style>
