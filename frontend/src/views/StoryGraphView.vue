<template>
  <div class="story-graph-view">
    <ProjectHeader
      :project-id="projectId"
      :project-name="currentProject?.name"
      :is-owner="isOwner"
    >
      <template #actions>
        <button class="btn btn--secondary" @click="handleRefresh">
          🔄 Odśwież
        </button>
        <button class="btn btn--secondary" @click="navigateToStory">
          ← Powrót do fabuły
        </button>
      </template>
    </ProjectHeader>

    <!-- Loading -->
    <div v-if="isLoading" class="story-graph-view__loading">
      <LoadingSpinner text="Ładowanie grafu..." />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="story-graph-view__error">
      <div class="error-message">
        <h3>Błąd podczas ładowania grafu</h3>
        <p>{{ error }}</p>
        <button class="btn btn--primary" @click="loadGraphData">
          Spróbuj ponownie
        </button>
      </div>
    </div>

    <!-- Story Graph -->
    <div v-else class="story-graph-view__content">
      <StoryGraph
        :elements="storyStore.storyElements"
        :connections="storyStore.storyConnections"
        @select-node="handleSelectNode"
        @create-connection="handleCreateConnection"
        @delete-connection="handleDeleteConnection"
      />
      
      <div v-if="storyStore.storyElements.length === 0" class="story-graph-view__empty">
        <div class="empty-state">
          <div class="empty-state__icon">🕸️</div>
          <h3 class="empty-state__title">Brak elementów fabuły</h3>
          <p class="empty-state__text">
            Utwórz elementy fabuły w widoku listy, aby zobaczyć je tutaj jako graf.
          </p>
          <button class="btn btn--primary" @click="navigateToStory">
            Przejdź do fabuły
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useStoryStore } from '@/stores/story'
import { useAuthStore } from '@/stores/auth'
import ProjectHeader from '@/components/project/ProjectHeader.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StoryGraph from '@/components/story/StoryGraph.vue'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const storyStore = useStoryStore()
const authStore = useAuthStore()
const toast = useToast()

const projectId = computed(() => route.params.id as string)
const currentProject = computed(() => projectsStore.currentProject)
const isOwner = computed(() =>
  !!currentProject.value &&
  !!authStore.user &&
  currentProject.value.owner_id === authStore.user.id
)

const isLoading = computed(() => storyStore.isLoading)
const error = computed(() => storyStore.error)

onMounted(async () => {
  const id = projectId.value
  if (!id) return

  // Pobierz projekt jeśli jeszcze nie został pobrany
  if (!currentProject.value || currentProject.value.id !== id) {
    try {
      await projectsStore.fetchProject(id)
    } catch (err: any) {
      toast.error(err.message || 'Błąd podczas pobierania projektu')
      return
    }
  }

  // Pobierz dane grafu
  await loadGraphData()
})

async function loadGraphData() {
  try {
    await storyStore.fetchGraphData(projectId.value)
  } catch (err: any) {
    toast.error(err.message || 'Błąd podczas pobierania grafu')
  }
}

function handleRefresh() {
  loadGraphData()
}

function navigateToStory() {
  router.push(`/projects/${projectId.value}/story`)
}

function handleSelectNode(nodeId: string) {
  // Zaznacz element w store i opcjonalnie przekieruj do edytora
  storyStore.selectElement(nodeId)
  
  // Opcjonalnie można przekierować do widoku listy z zaznaczonym elementem
  // router.push(`/projects/${projectId.value}/story?selected=${nodeId}`)
}

async function handleCreateConnection(
  fromId: string,
  toId: string,
  label: string | null,
  connectionType: string
) {
  try {
    await storyStore.createConnection(fromId, {
      toElementId: toId,
      label: label || undefined,
      connectionType: connectionType as 'leads_to' | 'branches_to' | 'requires',
    })
    toast.success('Połączenie utworzone')
  } catch (err: any) {
    toast.error(err.message || 'Błąd podczas tworzenia połączenia')
  }
}

async function handleDeleteConnection(connectionId: string) {
  try {
    await storyStore.deleteConnection(connectionId)
    toast.success('Połączenie usunięte')
  } catch (err: any) {
    toast.error(err.message || 'Błąd podczas usuwania połączenia')
  }
}
</script>

<style scoped>
.story-graph-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.story-graph-view__loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.story-graph-view__error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 24px;
}

.error-message {
  text-align: center;
  max-width: 500px;
}

.error-message h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.error-message p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
}

.story-graph-view__content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.story-graph-view__empty {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.empty-state {
  text-align: center;
  max-width: 400px;
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
}

.empty-state__icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state__title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.empty-state__text {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.btn {
  padding: 10px 18px;
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
</style>
