<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import { useDebounceFn } from '@vueuse/core'
import type { StoryElement, StoryElementStatus, UpdateStoryElementDto } from '@/api/story'
import type { StoryHistoryEntry } from '@/api/story'

interface Props {
  element: StoryElement | null
  history?: StoryHistoryEntry[]
  linkedNodes?: any[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [data: UpdateStoryElementDto]
  delete: []
  'unlink-node': [nodeId: string]
  'link-task': []
}>()

const editTitle = ref('')
const editContent = ref('')
const editStatus = ref<StoryElementStatus>('DRAFT')
const editMetadata = ref<Record<string, any>>({})
const activeTab = ref<'edit' | 'preview' | 'metadata' | 'history'>('edit')
const isSaving = ref(false)
const hasUnsavedChanges = ref(false)
const isUpdatingFromProps = ref(false)

const renderedMarkdown = computed(() => {
  return marked.parse(editContent.value || '')
})

const statusOptions: Array<{ value: StoryElementStatus; label: string }> = [
  { value: 'DRAFT', label: 'Szkic' },
  { value: 'IN_PROGRESS', label: 'W trakcie' },
  { value: 'REVIEW', label: 'Do przeglądu' },
  { value: 'COMPLETED', label: 'Ukończone' },
]

const metadataJson = computed({
  get: () => JSON.stringify(editMetadata.value, null, 2),
  set: (value: string) => {
    try {
      editMetadata.value = JSON.parse(value)
    } catch (e) {
      // Invalid JSON, do nothing
    }
  },
})

// Watch for element changes
watch(() => props.element, (newElement) => {
  isUpdatingFromProps.value = true
  if (newElement) {
    editTitle.value = newElement.title
    editContent.value = newElement.content || ''
    editStatus.value = newElement.status
    editMetadata.value = newElement.metadata || {}
    hasUnsavedChanges.value = false
  } else {
    editTitle.value = ''
    editContent.value = ''
    editStatus.value = 'DRAFT'
    editMetadata.value = {}
    hasUnsavedChanges.value = false
  }
  // Reset flag on next tick to allow auto-save to work again
  setTimeout(() => {
    isUpdatingFromProps.value = false
  }, 0)
}, { immediate: true })

// Watch for changes to trigger auto-save
watch([editTitle, editContent, editStatus, editMetadata], () => {
  if (props.element && !isSaving.value && !isUpdatingFromProps.value) {
    const changed =
      editTitle.value !== props.element.title ||
      editContent.value !== (props.element.content || '') ||
      editStatus.value !== props.element.status ||
      JSON.stringify(editMetadata.value) !== JSON.stringify(props.element.metadata || {})
    
    if (changed) {
      hasUnsavedChanges.value = true
      debouncedSave()
    }
  }
}, { deep: true })

function saveChanges(immediate = false) {
  if (!props.element) return

  const data: UpdateStoryElementDto = {}
  
  if (editTitle.value !== props.element.title) {
    data.title = editTitle.value
  }
  if (editContent.value !== (props.element.content || '')) {
    data.content = editContent.value
  }
  if (editStatus.value !== props.element.status) {
    data.status = editStatus.value
  }
  if (JSON.stringify(editMetadata.value) !== JSON.stringify(props.element.metadata || {})) {
    data.metadata = editMetadata.value
  }

  if (Object.keys(data).length > 0) {
    isSaving.value = true
    emit('save', data)
    hasUnsavedChanges.value = false
    
    // Reset saving state after a short delay
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  }
}

const debouncedSave = useDebounceFn(() => {
  saveChanges(false)
}, 1000)

function handleSaveImmediate() {
  saveChanges(true)
}

function handleDelete() {
  if (!props.element) return
  if (confirm(`Czy na pewno chcesz usunąć "${props.element.title}"?`)) {
    emit('delete')
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

function getStatusLabel(status: string) {
  const labels = {
    TODO: 'Do zrobienia',
    IN_PROGRESS: 'W trakcie',
    DONE: 'Ukończone',
  }
  return labels[status as keyof typeof labels] || status
}
</script>

<template>
  <div v-if="element" class="story-editor">
    <div class="story-editor__header">
      <input
        v-model="editTitle"
        type="text"
        class="title-input"
        placeholder="Tytuł elementu fabuły..."
      />
      <div class="story-editor__actions">
        <select v-model="editStatus" class="status-select">
          <option
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <button
          class="btn btn--success"
          :disabled="isSaving || !hasUnsavedChanges"
          @click="handleSaveImmediate"
        >
          <span v-if="isSaving">Zapisywanie...</span>
          <span v-else-if="hasUnsavedChanges">💾 Zapisz</span>
          <span v-else>✓ Zapisano</span>
        </button>
        <button class="btn btn--danger-outline" @click="handleDelete">
          Usuń
        </button>
      </div>
    </div>

    <div class="story-editor__tabs">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'edit' }"
        @click="activeTab = 'edit'"
      >
        ✏️ Edycja
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'preview' }"
        @click="activeTab = 'preview'"
      >
        👁️ Podgląd
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'metadata' }"
        @click="activeTab = 'metadata'"
      >
        🏷️ Metadata
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        📜 Historia
      </button>
    </div>

    <div class="story-editor__body">
      <!-- Edit Tab -->
      <textarea
        v-if="activeTab === 'edit'"
        v-model="editContent"
        class="content-textarea"
        placeholder="Napisz treść fabuły w formacie Markdown..."
      ></textarea>

      <!-- Preview Tab -->
      <div
        v-else-if="activeTab === 'preview'"
        class="content-preview markdown-body"
        v-html="renderedMarkdown"
      ></div>

      <!-- Metadata Tab -->
      <div v-else-if="activeTab === 'metadata'" class="metadata-editor">
        <p class="metadata-hint">
          Edytuj metadata w formacie JSON (np. dla postaci: age, role, itp.):
        </p>
        <textarea
          v-model="metadataJson"
          class="metadata-textarea"
          placeholder='{\n  "age": 25,\n  "role": "protagonist"\n}'
        ></textarea>
      </div>

      <!-- History Tab -->
      <div v-else-if="activeTab === 'history'" class="history-view">
        <template v-if="history && history.length > 0">
          <div
            v-for="entry in history"
            :key="entry.id"
            class="history-entry"
          >
            <div class="history-entry__header">
              <span class="history-entry__user">
                {{ entry.user.username }}
              </span>
              <span class="history-entry__date">
                {{ formatDate(entry.changed_at) }}
              </span>
            </div>
            <div class="history-entry__change">
              <strong>{{ entry.field_name }}</strong>:
              <span class="history-entry__old">{{ entry.old_value || '(pusty)' }}</span>
              →
              <span class="history-entry__new">{{ entry.new_value || '(pusty)' }}</span>
            </div>
          </div>
        </template>
        <div v-else class="empty-history">
          Brak historii zmian
        </div>
      </div>
    </div>

    <!-- Linked Nodes Section -->
    <div class="linked-nodes">
      <div class="linked-nodes__header">
        <h4 class="linked-nodes__title">🔗 Powiązane taski</h4>
        <button class="btn btn--small btn--primary" @click="$emit('link-task')">
          + Powiąż task
        </button>
      </div>
      
      <div v-if="linkedNodes && linkedNodes.length > 0" class="linked-nodes__list">
        <div
          v-for="link in linkedNodes"
          :key="link.id"
          class="linked-node-item"
        >
          <div class="linked-node-item__info">
            <span class="linked-node-item__title">{{ link.node.title }}</span>
            <span 
              class="linked-node-item__status"
              :class="`status--${link.node.status.toLowerCase()}`"
            >
              {{ getStatusLabel(link.node.status) }}
            </span>
          </div>
          <button
            class="btn-icon btn-icon--danger"
            title="Usuń powiązanie"
            @click="$emit('unlink-node', link.node_id)"
          >
            ×
          </button>
        </div>
      </div>
      
      <div v-else class="linked-nodes__empty">
        Brak powiązanych tasków. Kliknij "+ Powiąż task" aby dodać.
      </div>
    </div>
  </div>

  <div v-else class="story-editor-empty">
    <span class="empty-icon">📖</span>
    <p>Wybierz element fabuły z drzewa, aby rozpocząć edycję</p>
  </div>
</template>

<style scoped>
.story-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.story-editor__header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.title-input {
  flex: 1;
  font-size: 24px;
  font-weight: 700;
  border: none;
  outline: none;
  color: #1e293b;
  padding: 8px 0;
}

.title-input::placeholder {
  color: #cbd5e1;
}

.story-editor__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.status-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  background: white;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: #7c3aed;
}

.story-editor__tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid #e2e8f0;
  gap: 16px;
}

.tab-btn {
  padding: 12px 16px;
  font-size: 14px;
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
  color: #7c3aed;
  border-bottom-color: #7c3aed;
}

.story-editor__body {
  flex: 1;
  overflow: hidden;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.content-textarea {
  flex: 1;
  width: 100%;
  border: none;
  outline: none;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 15px;
  line-height: 1.6;
  resize: none;
  color: #334155;
}

.content-textarea::placeholder {
  color: #cbd5e1;
}

.content-preview {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.markdown-body :deep(h1) {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
  margin-bottom: 16px;
}

.markdown-body :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
  margin-bottom: 16px;
}

.markdown-body :deep(h3) {
  font-size: 1.25em;
  margin-bottom: 16px;
}

.markdown-body :deep(p) {
  margin-bottom: 16px;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin-bottom: 16px;
}

.markdown-body :deep(code) {
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-size: 85%;
  padding: 0.2em 0.4em;
}

.markdown-body :deep(pre) {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 16px;
  overflow: auto;
  margin-bottom: 16px;
}

.metadata-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.metadata-hint {
  margin-bottom: 12px;
  color: #64748b;
  font-size: 13px;
}

.metadata-textarea {
  flex: 1;
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  color: #334155;
}

.metadata-textarea:focus {
  outline: none;
  border-color: #7c3aed;
}

.history-view {
  flex: 1;
  overflow-y: auto;
}

.history-entry {
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 12px;
}

.history-entry__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.history-entry__user {
  font-weight: 600;
  color: #1e293b;
}

.history-entry__date {
  font-size: 12px;
  color: #94a3b8;
}

.history-entry__change {
  font-size: 13px;
  color: #475569;
}

.history-entry__old {
  color: #ef4444;
  text-decoration: line-through;
}

.history-entry__new {
  color: #10b981;
  font-weight: 500;
}

.empty-history {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.linked-nodes {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.linked-nodes__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.linked-nodes__title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.linked-nodes__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.linked-nodes__empty {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  background: white;
  border: 1px dashed #e2e8f0;
  border-radius: 6px;
}

.linked-node-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.linked-node-item__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.linked-node-item__title {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linked-node-item__status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  width: fit-content;
}

.linked-node-item__status.status--todo {
  background: #f1f5f9;
  color: #64748b;
}

.linked-node-item__status.status--in_progress {
  background: #dbeafe;
  color: #1e40af;
}

.linked-node-item__status.status--done {
  background: #d1fae5;
  color: #065f46;
}

.btn-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 18px;
  color: #64748b;
  transition: color 0.2s;
}

.btn-icon--danger:hover {
  color: #ef4444;
}

.story-editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  background: #fcfcfc;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.story-editor-empty p {
  font-size: 16px;
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

.btn--danger-outline {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.btn--danger-outline:hover {
  background: #fef2f2;
}

.btn--small {
  padding: 6px 12px;
  font-size: 12px;
}
</style>
