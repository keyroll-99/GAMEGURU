<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useNotesStore } from '@/stores/notes'
import { useAuthStore } from '@/stores/auth'
import ProjectHeader from '@/components/project/ProjectHeader.vue'
import { marked } from 'marked'
import { useToast } from 'vue-toastification'
import { useDebounceFn } from '@vueuse/core'

const route = useRoute()
const projectsStore = useProjectsStore()
const notesStore = useNotesStore()
const authStore = useAuthStore()
const toast = useToast()

const projectId = computed(() => route.params.id as string)
const isOwner = computed(() =>
  !!projectsStore.currentProject &&
  !!authStore.user &&
  projectsStore.currentProject.owner_id === authStore.user.id
)

const notes = computed(() => notesStore.notes)
const currentNote = computed(() => notesStore.currentNote)

const editTitle = ref('')
const editContent = ref('')
const activeTab = ref<'edit' | 'preview'>('edit')
const isSaving = ref(false)
const hasUnsavedChanges = ref(false)

const renderedMarkdown = computed(() => {
  return marked.parse(editContent.value || '')
})

onMounted(async () => {
  const id = projectId.value
  if (!id) return

  if (!projectsStore.currentProject || projectsStore.currentProject.id !== id) {
    await projectsStore.fetchProject(id)
  }
  await notesStore.fetchNotes(id)
})

async function saveNote(showSuccessToast: boolean = false) {
  if (!currentNote.value) return
  if (editTitle.value === currentNote.value.title && editContent.value === currentNote.value.content) {
    hasUnsavedChanges.value = false
    return
  }

  isSaving.value = true
  try {
    const result = await notesStore.updateNote(projectId.value, currentNote.value.id, {
      title: editTitle.value,
      content: editContent.value
    })
    
    if (result.success) {
      hasUnsavedChanges.value = false
      if (showSuccessToast) {
        toast.success('Notatka zapisana')
      }
    } else {
      toast.error(result.message || 'Błąd zapisu')
    }
  } catch (error) {
    toast.error('Błąd zapisu')
  } finally {
    isSaving.value = false
  }
}

async function saveCurrentNote() {
  await saveNote(true)
}

// Debounced version of save for auto-save
const debouncedSave = useDebounceFn(async () => {
  await saveNote(false)
}, 1000) // 1 second debounce

watch(currentNote, (newNote) => {
  if (newNote) {
    editTitle.value = newNote.title
    editContent.value = newNote.content
    hasUnsavedChanges.value = false
  } else {
    editTitle.value = ''
    editContent.value = ''
    hasUnsavedChanges.value = false
  }
})

// Watch for changes in title and content to trigger debounced auto-save
watch([editTitle, editContent], () => {
  if (currentNote.value && !isSaving.value) {
    if (editTitle.value !== currentNote.value.title || editContent.value !== currentNote.value.content) {
      hasUnsavedChanges.value = true
      debouncedSave()
    }
  }
})

function selectNote(note: any) {
  notesStore.setCurrentNote(note)
  activeTab.value = 'edit'
}

async function handleCreateNote() {
  const result = await notesStore.createNote(projectId.value, {
    title: 'Nowa notatka',
    content: ''
  })
  if (result.success) {
    toast.success('Notatka utworzona')
    activeTab.value = 'edit'
  } else {
    toast.error(result.message || 'Błąd tworzenia notatki')
  }
}

async function handleDeleteNote() {
  if (!currentNote.value) return
  if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) return

  const result = await notesStore.deleteNote(projectId.value, currentNote.value.id)
  if (result.success) {
    toast.success('Notatka usunięta')
  } else {
    toast.error(result.message || 'Błąd usuwania')
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString()
}
</script>

<template>
  <div class="project-notes">
    <ProjectHeader
      :project-id="projectId"
      :project-name="projectsStore.currentProject?.name"
      :is-owner="isOwner"
    >
      <template #actions>
        <button class="btn btn--primary" @click="handleCreateNote">
          + Nowa notatka
        </button>
      </template>
    </ProjectHeader>

    <div class="project-notes__content">
      <aside class="project-notes__sidebar">
        <div
          v-for="note in notes"
          :key="note.id"
          class="note-item"
          :class="{ 'note-item--active': currentNote?.id === note.id }"
          @click="selectNote(note)"
        >
          <div class="note-item__title">{{ note.title }}</div>
          <div class="note-item__date">{{ formatDate(note.updated_at) }}</div>
        </div>
        <div v-if="notes.length === 0" class="empty-state">
          Brak notatek.
        </div>
      </aside>

      <main class="project-notes__main">
        <template v-if="currentNote">
          <div class="note-editor">
            <div class="note-editor__header">
              <input
                v-model="editTitle"
                type="text"
                class="note-title-input"
                placeholder="Tytuł notatki..."
              />
              <div class="note-editor__actions">
                <button 
                  class="btn btn--success" 
                  @click="saveCurrentNote"
                  :disabled="isSaving || !hasUnsavedChanges"
                >
                  <span v-if="isSaving">Zapisywanie...</span>
                  <span v-else-if="hasUnsavedChanges">💾 Zapisz</span>
                  <span v-else>✓ Zapisano</span>
                </button>
                <button class="btn btn--danger-outline" @click="handleDeleteNote">Usuń</button>
              </div>
            </div>
            <div class="note-editor__tabs">
              <button
                class="tab-btn"
                :class="{ 'tab-btn--active': activeTab === 'edit' }"
                @click="activeTab = 'edit'"
              >
                Edycja
              </button>
              <button
                class="tab-btn"
                :class="{ 'tab-btn--active': activeTab === 'preview' }"
                @click="activeTab = 'preview'"
              >
                Podgląd
              </button>
            </div>
            <div class="note-editor__body">
              <textarea
                v-if="activeTab === 'edit'"
                v-model="editContent"
                class="note-content-textarea"
                placeholder="Napisz coś w Markdown..."
              ></textarea>
              <div
                v-else
                class="note-preview markdown-body"
                v-html="renderedMarkdown"
              ></div>
            </div>
          </div>
        </template>
        <div v-else class="empty-selection">
          <div class="empty-selection__content">
             <span class="empty-icon">📝</span>
             <p>Wybierz notatkę z listy lub utwórz nową, aby rozpocząć pisanie.</p>
             <button class="btn btn--primary" @click="handleCreateNote">Utwórz pierwszą notatkę</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.project-notes {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
}

.project-notes__content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.project-notes__sidebar {
  width: 300px;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
  overflow-y: auto;
  flex-shrink: 0;
}

.note-item {
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.note-item:hover {
  background: #f1f5f9;
}

.note-item--active {
  background: white;
  border-left: 4px solid #4f46e5;
}

.note-item__title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-item__date {
  font-size: 11px;
  color: #94a3b8;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.project-notes__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
}

.note-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.note-editor__header {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.note-editor__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.note-title-input {
  flex: 1;
  font-size: 24px;
  font-weight: 700;
  border: none;
  outline: none;
  color: #1e293b;
}

.note-title-input::placeholder {
  color: #cbd5e1;
}

.note-editor__tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #e2e8f0;
  gap: 16px;
}

.tab-btn {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #1e293b;
}

.tab-btn--active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.note-editor__body {
  flex: 1;
  overflow: hidden;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.note-content-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  font-family: 'Fira Code', monospace;
  font-size: 15px;
  line-height: 1.6;
  resize: none;
  color: #334155;
}

.note-preview {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

/* Markdown Styles Basic */
.markdown-body :deep(h1) { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; margin-bottom: 16px; }
.markdown-body :deep(h2) { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: .3em; margin-bottom: 16px; }
.markdown-body :deep(h3) { font-size: 1.25em; margin-bottom: 16px; }
.markdown-body :deep(p) { margin-bottom: 16px; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 2em; margin-bottom: 16px; }
.markdown-body :deep(code) { background-color: rgba(27,31,35,.05); border-radius: 3px; font-size: 85%; padding: .2em .4em; }
.markdown-body :deep(pre) { background-color: #f6f8fa; border-radius: 3px; padding: 16px; overflow: auto; margin-bottom: 16px; }

.empty-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  background: #fcfcfc;
}

.empty-selection__content {
  text-align: center;
  max-width: 300px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.empty-selection p {
  margin-bottom: 24px;
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
  background: #4f46e5;
  color: white;
}

.btn--primary:hover {
  background: #4338ca;
}

.btn--danger-outline {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.btn--danger-outline:hover {
  background: #fef2f2;
}

.btn--success {
  background: #10b981;
  color: white;
}

.btn--success:hover:not(:disabled) {
  background: #059669;
}

.btn--success:disabled {
  background: #6ee7b7;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
