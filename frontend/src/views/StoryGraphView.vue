<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useStoryStore } from '@/stores/story'
import { useAuthStore } from '@/stores/auth'
import ProjectHeader from '@/components/project/ProjectHeader.vue'
import StoryGraph from '@/components/story/StoryGraph.vue'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const storyStore = useStoryStore()
const authStore = useAuthStore()
const toast = useToast()

const projectId = computed(() => route.params.id as string)
const isOwner = computed(() =>
  !!projectsStore.currentProject &&
  !!authStore.user &&
  projectsStore.currentProject.owner_id === authStore.user.id
)

const isLoading = computed(() => storyStore.isLoading)
const error = computed(() => storyStore.error)

const storyGraphRef = ref<InstanceType<typeof StoryGraph> | null>(null)

onMounted(async () => {
  const id = projectId.value
  if (!id) return

  // Pobierz projekt jeśli jeszcze nie został pobrany
  if (!projectsStore.currentProject || projectsStore.currentProject.id !== id) {
    await projectsStore.fetchProject(id)
  }

  // Pobierz dane grafu
  await fetchGraphData()
})

async function fetchGraphData() {
  try {
    await storyStore.fetchGraphData(projectId.value)
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas pobierania grafu')
  }
}

function navigateToStoryList() {
  router.push(`/projects/${projectId.value}/story`)
}

function handleSelectElement(elementId: string) {
  storyStore.selectElement(elementId)
}

async function handleCreateConnection(fromId: string, toId: string, label: string, connectionType: string) {
  try {
    await storyStore.createConnection(fromId, {
      toElementId: toId,
      label: label || undefined,
      connectionType: connectionType as 'leads_to' | 'branches_to' | 'requires',
    })
    toast.success('Połączenie utworzone')
    
    // Optymistyczna aktualizacja - możemy też po prostu odświeżyć dane
    // await fetchGraphData()
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas tworzenia połączenia')
    // Odśwież dane w przypadku błędu
    await fetchGraphData()
  }
}

async function handleDeleteConnection(connectionId: string) {
  try {
    await storyStore.deleteConnection(connectionId)
    toast.success('Połączenie usunięte')
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas usuwania połączenia')
    // Odśwież dane w przypadku błędu
    await fetchGraphData()
  }
}

function handleOpenInEditor() {
  router.push(`/projects/${projectId.value}/story`)
}
</script>

<template>
  <div class="story-graph-view">
    <ProjectHeader
      :project-id="projectId"
      :project-name="projectsStore.currentProject?.name"
      :is-owner="isOwner"
    >
      <template #actions>
        <button class="btn btn--secondary" @click="navigateToStoryList">
          ← Powrót do listy
        </button>
      </template>
    </ProjectHeader>

    <div class="story-graph-view__content">
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Ładowanie grafu...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button class="btn btn--primary" @click="fetchGraphData">
          Spróbuj ponownie
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="storyStore.storyElements.length === 0" class="empty-container">
        <div class="empty-icon">📋</div>
        <h3>Brak elementów fabuły</h3>
        <p>Dodaj pierwszy element fabuły, aby zobaczyć go na grafie</p>
        <button class="btn btn--primary" @click="navigateToStoryList">
          Przejdź do listy
        </button>
      </div>

      <!-- Graph -->
      <StoryGraph
        v-else
        ref="storyGraphRef"
        :elements="storyStore.storyElements"
        :connections="storyStore.storyConnections"
        @select-element="handleSelectElement"
        @create-connection="handleCreateConnection"
        @delete-connection="handleDeleteConnection"
      />

      <!-- Side panel for selected element -->
      <Transition name="slide">
        <div v-if="storyStore.selectedElement" class="side-panel">
          <div class="side-panel__header">
            <h3 class="side-panel__title">{{ storyStore.selectedElement.title }}</h3>
            <button class="side-panel__close" @click="storyStore.selectElement(null)">×</button>
          </div>
          <div class="side-panel__content">
            <div class="side-panel__badge">
              <span class="badge" :class="`badge--${storyStore.selectedElement.type.toLowerCase()}`">
                {{ storyStore.selectedElement.type }}
              </span>
              <span class="badge" :class="`badge--${storyStore.selectedElement.status.toLowerCase()}`">
                {{ storyStore.selectedElement.status }}
              </span>
            </div>
            <div v-if="storyStore.selectedElement.content" class="side-panel__description">
              <p>{{ storyStore.selectedElement.content }}</p>
            </div>
            <div class="side-panel__actions">
              <button class="btn btn--primary btn--block" @click="handleOpenInEditor">
                Otwórz w edytorze
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.story-graph-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.story-graph-view__content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Loading, Error, Empty states */
.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #dc2626;
  font-size: 16px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.5;
}

.empty-container h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.empty-container p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Side Panel */
.side-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background: white;
  border-left: 1px solid #e2e8f0;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.side-panel__header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.side-panel__title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  flex: 1;
  word-break: break-word;
}

.side-panel__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 24px;
  color: #64748b;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.side-panel__close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.side-panel__content {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.side-panel__badge {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge--act {
  background: #dbeafe;
  color: #1e40af;
}

.badge--scene {
  background: #d1fae5;
  color: #065f46;
}

.badge--event {
  background: #fed7aa;
  color: #92400e;
}

.badge--dialog {
  background: #ede9fe;
  color: #5b21b6;
}

.badge--character {
  background: #fce7f3;
  color: #9f1239;
}

.badge--overview {
  background: #f1f5f9;
  color: #334155;
}

.badge--draft {
  background: #f1f5f9;
  color: #64748b;
}

.badge--in_progress {
  background: #fef3c7;
  color: #92400e;
}

.badge--review {
  background: #e0e7ff;
  color: #3730a3;
}

.badge--completed {
  background: #d1fae5;
  color: #065f46;
}

.side-panel__description {
  margin-bottom: 20px;
}

.side-panel__description p {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

.side-panel__actions {
  margin-top: auto;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn--primary {
  background: #7c3aed;
  color: white;
}

.btn--primary:hover {
  background: #6d28d9;
}

.btn--secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn--secondary:hover {
  background: #f8fafc;
}

.btn--block {
  width: 100%;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
