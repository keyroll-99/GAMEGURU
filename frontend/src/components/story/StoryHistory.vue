<script setup lang="ts">
import { ref, computed } from 'vue'
import type { StoryHistoryEntry } from '@/api/story'

interface Props {
  history: StoryHistoryEntry[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

const emit = defineEmits<{
  rollback: [historyId: string]
}>()

const expandedEntryId = ref<string | null>(null)

function toggleExpand(entryId: string) {
  expandedEntryId.value = expandedEntryId.value === entryId ? null : entryId
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getFieldLabel(fieldName: string) {
  const labels: Record<string, string> = {
    title: 'Tytuł',
    content: 'Treść',
    status: 'Status',
    metadata: 'Metadata',
  }
  return labels[fieldName] || fieldName
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Szkic',
    IN_PROGRESS: 'W trakcie',
    REVIEW: 'Do przeglądu',
    COMPLETED: 'Ukończone',
  }
  return labels[status] || status
}

function formatValue(value: string | null, fieldName: string) {
  if (value === null) return '(pusty)'
  
  if (fieldName === 'status') {
    return getStatusLabel(value)
  }
  
  if (fieldName === 'metadata') {
    try {
      const parsed = JSON.parse(value)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return value
    }
  }
  
  if (fieldName === 'content' && value.length > 100) {
    return value.substring(0, 100) + '...'
  }
  
  return value
}

function handleRollback(entry: StoryHistoryEntry) {
  if (confirm(`Czy na pewno chcesz przywrócić "${getFieldLabel(entry.field_name)}" do poprzedniej wartości?`)) {
    emit('rollback', entry.id)
  }
}

// Compute diff for content fields
function computeDiff(oldValue: string | null, newValue: string | null, fieldName: string) {
  if (fieldName !== 'content' || !oldValue || !newValue) {
    return null
  }
  
  const oldLines = oldValue.split('\n')
  const newLines = newValue.split('\n')
  
  return {
    oldLines,
    newLines,
  }
}
</script>

<template>
  <div class="story-history">
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Ładowanie historii...</p>
    </div>

    <template v-else-if="history && history.length > 0">
      <div
        v-for="entry in history"
        :key="entry.id"
        class="history-entry"
      >
        <div class="history-entry__header" @click="toggleExpand(entry.id)">
          <div class="history-entry__user-info">
            <img
              v-if="entry.user.avatar_url"
              :src="entry.user.avatar_url"
              :alt="entry.user.username"
              class="history-entry__avatar"
            />
            <div v-else class="history-entry__avatar history-entry__avatar--placeholder">
              {{ entry.user.username.charAt(0).toUpperCase() }}
            </div>
            <div class="history-entry__meta">
              <span class="history-entry__user">{{ entry.user.username }}</span>
              <span class="history-entry__date">{{ formatDate(entry.changed_at) }}</span>
            </div>
          </div>
          <div class="history-entry__field">
            <span class="field-badge">{{ getFieldLabel(entry.field_name) }}</span>
            <button
              class="expand-btn"
              :class="{ 'expand-btn--active': expandedEntryId === entry.id }"
            >
              {{ expandedEntryId === entry.id ? '▲' : '▼' }}
            </button>
          </div>
        </div>

        <div v-if="expandedEntryId === entry.id" class="history-entry__body">
          <div class="history-entry__change">
            <div class="change-section">
              <h4 class="change-label change-label--old">Stara wartość</h4>
              <pre class="change-value change-value--old">{{ formatValue(entry.old_value, entry.field_name) }}</pre>
            </div>
            <div class="change-arrow">→</div>
            <div class="change-section">
              <h4 class="change-label change-label--new">Nowa wartość</h4>
              <pre class="change-value change-value--new">{{ formatValue(entry.new_value, entry.field_name) }}</pre>
            </div>
          </div>

          <div class="history-entry__actions">
            <button
              class="btn btn--restore"
              @click="handleRollback(entry)"
            >
              ↶ Przywróć tę wersję
            </button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="empty-history">
      <span class="empty-icon">📜</span>
      <p>Brak historii zmian</p>
      <p class="empty-hint">Historia zmian zostanie zapisana przy kolejnych edycjach</p>
    </div>
  </div>
</template>

<style scoped>
.story-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #64748b;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.history-entry {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  overflow: hidden;
  transition: border-color 0.2s;
}

.history-entry:hover {
  border-color: #cbd5e1;
}

.history-entry__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-entry__header:hover {
  background: #f8fafc;
}

.history-entry__user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.history-entry__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.history-entry__avatar--placeholder {
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.history-entry__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.history-entry__user {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-entry__date {
  font-size: 12px;
  color: #94a3b8;
}

.history-entry__field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.field-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: #f1f5f9;
  color: #475569;
}

.expand-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.expand-btn--active {
  background: #7c3aed;
  color: white;
}

.history-entry__body {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.history-entry__change {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.change-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.change-label {
  font-size: 12px;
  font-weight: 600;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.change-label--old {
  color: #ef4444;
}

.change-label--new {
  color: #10b981;
}

.change-value {
  padding: 12px;
  border-radius: 6px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.change-value--old {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.change-value--new {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.change-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #94a3b8;
  font-weight: bold;
  padding-top: 20px;
}

.history-entry__actions {
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn--restore {
  background: #7c3aed;
  color: white;
}

.btn--restore:hover {
  background: #6d28d9;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(124, 58, 237, 0.2);
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-history p {
  margin: 4px 0;
  font-size: 14px;
}

.empty-hint {
  font-size: 12px;
  color: #cbd5e1;
}

@media (max-width: 768px) {
  .history-entry__change {
    grid-template-columns: 1fr;
  }

  .change-arrow {
    transform: rotate(90deg);
    padding: 8px 0;
  }
}
</style>
