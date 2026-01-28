<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useStoryStore } from '@/stores/story'
import { useAuthStore } from '@/stores/auth'
import ProjectHeader from '@/components/project/ProjectHeader.vue'
import StoryTree from '@/components/story/StoryTree.vue'
import StoryEditor from '@/components/story/StoryEditor.vue'
import StoryProgress from '@/components/story/StoryProgress.vue'
import LinkNodeModal from '@/components/story/LinkNodeModal.vue'
import { useToast } from 'vue-toastification'
import type { StoryElementType, UpdateStoryElementDto } from '@/api/story'

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

const selectedElement = computed(() => storyStore.selectedElement)
const progressStats = computed(() => storyStore.progressStats)
const elementHistory = ref<any[]>([])

const showCreateModal = ref(false)
const createParentId = ref<string | null>(null)
const createType = ref<StoryElementType>('OVERVIEW')
const createTitle = ref('')

const showLinkNodeModal = ref(false)

onMounted(async () => {
  const id = projectId.value
  if (!id) return

  // Pobierz projekt jeśli jeszcze nie został pobrany
  if (!projectsStore.currentProject || projectsStore.currentProject.id !== id) {
    await projectsStore.fetchProject(id)
  }

  // Pobierz elementy fabuły
  await fetchStoryData()
})

async function fetchStoryData() {
  try {
    await Promise.all([
      storyStore.fetchStory(projectId.value),
      storyStore.fetchProgress(projectId.value),
    ])
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas pobierania fabuły')
  }
}

// Obserwuj zmiany wybranego elementu i pobieraj historię
watch(selectedElement, async (newElement) => {
  if (newElement) {
    try {
      elementHistory.value = await storyStore.fetchHistory(newElement.id)
    } catch (error: any) {
      console.error('Failed to fetch history:', error)
      elementHistory.value = []
    }
  } else {
    elementHistory.value = []
  }
})

async function handleSaveElement(data: UpdateStoryElementDto) {
  if (!selectedElement.value) return

  try {
    await storyStore.updateElement(selectedElement.value.id, data)
    toast.success('Zapisano fabułę')
    // Odśwież postęp po zapisie, szczególnie gdy zmieniono status sceny
    if (data.status !== undefined && selectedElement.value.type === 'SCENE') {
      await storyStore.fetchProgress(projectId.value)
    }
    // Odśwież historię po zapisie
    if (selectedElement.value) {
      elementHistory.value = await storyStore.fetchHistory(selectedElement.value.id)
    }
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas zapisywania')
  }
}

async function handleRollback(historyId: string) {
  if (!selectedElement.value) return

  try {
    const element = selectedElement.value
    await storyStore.rollback(element.id, historyId)
    toast.success('Przywrócono wersję')
    
    // Odśwież postęp jeśli to była scena
    if (element.type === 'SCENE') {
      await storyStore.fetchProgress(projectId.value)
    }
  } catch (error: any) {
    toast.error(error.message || 'Nie udało się przywrócić')
  }
}

async function handleDeleteElement() {
  if (!selectedElement.value) return

  try {
    const wasScene = selectedElement.value.type === 'SCENE'
    await storyStore.deleteElement(selectedElement.value.id)
    toast.success('Element usunięty')
    // Odśwież postęp po usunięciu sceny
    if (wasScene) {
      await storyStore.fetchProgress(projectId.value)
    }
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas usuwania')
  }
}

function handleCreateElement(parentId: string | null, type: StoryElementType) {
  createParentId.value = parentId
  createType.value = type
  createTitle.value = ''
  showCreateModal.value = true
}

async function handleConfirmCreate() {
  const trimmedTitle = createTitle.value.trim()
  if (!trimmedTitle) {
    toast.error('Tytuł nie może być pusty')
    return
  }

  try {
    const newElement = await storyStore.createElement({
      projectId: projectId.value,
      parentId: createParentId.value || undefined,
      type: createType.value,
      title: trimmedTitle,
      content: '',
    })

    toast.success('Element utworzony')
    showCreateModal.value = false
    storyStore.selectElement(newElement.id)
    
    // Odśwież postęp po utworzeniu sceny
    if (createType.value === 'SCENE') {
      await storyStore.fetchProgress(projectId.value)
    }
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas tworzenia elementu')
  }
}

function handleCancelCreate() {
  showCreateModal.value = false
}

function handleOpenLinkModal() {
  showLinkNodeModal.value = true
}

function handleCloseLinkModal() {
  showLinkNodeModal.value = false
}

async function handleLinkNode(nodeId: string) {
  if (!selectedElement.value) return

  try {
    await storyStore.linkNode(selectedElement.value.id, { nodeId })
    toast.success('Task powiązany')
    showLinkNodeModal.value = false
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas powiązywania tasku')
  }
}

async function handleUnlinkNode(nodeId: string) {
  if (!selectedElement.value) return

  try {
    await storyStore.unlinkNode(selectedElement.value.id, nodeId)
    toast.success('Powiązanie usunięte')
  } catch (error: any) {
    toast.error(error.message || 'Błąd podczas usuwania powiązania')
  }
}

function navigateToGraph() {
  router.push(`/projects/${projectId.value}/story/graph`)
}

const typeOptions: Array<{ value: StoryElementType; label: string; icon: string }> = [
  { value: 'OVERVIEW', label: 'Zarys ogólny', icon: '📋' },
  { value: 'ACT', label: 'Akt', icon: '🎭' },
  { value: 'SCENE', label: 'Scena', icon: '🎬' },
  { value: 'DIALOG', label: 'Dialog', icon: '💬' },
  { value: 'EVENT', label: 'Event', icon: '⚡' },
  { value: 'CHARACTER', label: 'Postać', icon: '👤' },
]
</script>

<template>
  <div class="project-story">
    <ProjectHeader
      :project-id="projectId"
      :project-name="projectsStore.currentProject?.name"
      :is-owner="isOwner"
    >
      <template #actions>
        <button class="btn btn--secondary" @click="navigateToGraph">
          🕸️ Graf fabularny
        </button>
        <button class="btn btn--primary" @click="handleCreateElement(null, 'OVERVIEW')">
          + Nowy element
        </button>
      </template>
    </ProjectHeader>

    <div class="project-story__progress">
      <StoryProgress :stats="progressStats" />
    </div>

    <div class="project-story__content">
      <aside class="project-story__sidebar">
        <StoryTree @create-element="handleCreateElement" />
      </aside>

      <main class="project-story__main">
        <StoryEditor
          :element="selectedElement"
          :history="elementHistory"
          :linked-nodes="selectedElement?.linkedNodes"
          @save="handleSaveElement"
          @delete="handleDeleteElement"
          @link-task="handleOpenLinkModal"
          @unlink-node="handleUnlinkNode"
          @rollback="handleRollback"
        />
      </main>
    </div>

    <!-- Create Element Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="handleCancelCreate">
      <div class="modal" @click.stop>
        <div class="modal__header">
          <h3 class="modal__title">Utwórz nowy element fabuły</h3>
          <button class="modal__close" @click="handleCancelCreate">×</button>
        </div>
        <div class="modal__body">
          <div class="form-group">
            <label class="form-label">Typ elementu</label>
            <div class="type-options">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                class="type-option"
                :class="{ 'type-option--active': createType === option.value }"
                @click="createType = option.value"
              >
                <span class="type-option__icon">{{ option.icon }}</span>
                <span class="type-option__label">{{ option.label }}</span>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Tytuł</label>
            <input
              v-model="createTitle"
              type="text"
              class="form-input"
              placeholder="Wpisz tytuł elementu..."
              @keyup.enter="handleConfirmCreate"
            />
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" @click="handleCancelCreate">
            Anuluj
          </button>
          <button class="btn btn--primary" @click="handleConfirmCreate">
            Utwórz
          </button>
        </div>
      </div>
    </div>

    <!-- Link Node Modal -->
    <LinkNodeModal
      v-if="showLinkNodeModal"
      :project-id="projectId"
      @close="handleCloseLinkModal"
      @link-node="handleLinkNode"
    />
  </div>
</template>

<style scoped>
.project-story {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.project-story__progress {
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.project-story__content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.project-story__sidebar {
  width: 350px;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
  overflow-y: auto;
  flex-shrink: 0;
}

.project-story__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.btn {
  padding: 8px 16px;
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

/* Modal Styles */
.modal-overlay {
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
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal__header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal__title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.modal__close {
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
}

.modal__close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal__body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.modal__footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #7c3aed;
}

.type-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.type-option:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.type-option--active {
  border-color: #7c3aed;
  background: #f5f3ff;
}

.type-option__icon {
  font-size: 20px;
}

.type-option__label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.type-option--active .type-option__label {
  color: #7c3aed;
}

@media (max-width: 768px) {
  .project-story__sidebar {
    width: 280px;
  }
  
  .type-options {
    grid-template-columns: 1fr;
  }
}
</style>
