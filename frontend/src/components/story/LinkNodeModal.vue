<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useNodesStore } from '@/stores/nodes'
import type { Node } from '@/api/nodes'

interface Props {
  projectId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  linkNode: [nodeId: string]
}>()

const nodesStore = useNodesStore()
const searchQuery = ref('')
const selectedNodeId = ref<string | null>(null)
const isLoading = ref(false)

// Filter nodes to only show TASK and MILESTONE types
const availableNodes = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  
  return nodesStore.nodes
    .filter((node) => {
      // Filter by type (TASK or MILESTONE)
      if (node.type !== 'TASK' && node.type !== 'MILESTONE') {
        return false
      }
      
      // Filter by search query
      if (query && !node.title.toLowerCase().includes(query)) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      // Sort by status priority (TODO < IN_PROGRESS < DONE)
      const statusPriority = { TODO: 0, IN_PROGRESS: 1, DONE: 2 }
      const aPriority = statusPriority[a.status] || 999
      const bPriority = statusPriority[b.status] || 999
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // Then sort alphabetically by title
      return a.title.localeCompare(b.title)
    })
})

onMounted(async () => {
  // Fetch nodes if not already loaded
  if (nodesStore.nodes.length === 0) {
    isLoading.value = true
    try {
      await nodesStore.fetchNodes(props.projectId)
    } catch (error) {
      console.error('Failed to fetch nodes:', error)
    } finally {
      isLoading.value = false
    }
  }
})

function handleSelectNode(nodeId: string) {
  selectedNodeId.value = nodeId
}

function handleConfirm() {
  if (selectedNodeId.value) {
    emit('linkNode', selectedNodeId.value)
  }
}

function getStatusColor(status: string) {
  const colors = {
    TODO: '#94a3b8',
    IN_PROGRESS: '#3b82f6',
    DONE: '#10b981',
  }
  return colors[status as keyof typeof colors] || '#94a3b8'
}

function getStatusLabel(status: string) {
  const labels = {
    TODO: 'Do zrobienia',
    IN_PROGRESS: 'W trakcie',
    DONE: 'Ukończone',
  }
  return labels[status as keyof typeof labels] || status
}

function getTypeIcon(type: string) {
  const icons = {
    TASK: '✓',
    MILESTONE: '🏁',
  }
  return icons[type as keyof typeof icons] || '•'
}
</script>

<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal" @click.stop>
      <div class="modal__header">
        <h3 class="modal__title">Powiąż z taskiem</h3>
        <button class="modal__close" @click="$emit('close')">×</button>
      </div>

      <div class="modal__body">
        <!-- Search Bar -->
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="🔍 Szukaj tasku..."
          />
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
          Ładowanie tasków...
        </div>

        <!-- Nodes List -->
        <div v-else-if="availableNodes.length > 0" class="nodes-list">
          <button
            v-for="node in availableNodes"
            :key="node.id"
            class="node-item"
            :class="{ 'node-item--selected': selectedNodeId === node.id }"
            @click="handleSelectNode(node.id)"
          >
            <div class="node-item__left">
              <span class="node-item__type">{{ getTypeIcon(node.type) }}</span>
              <span class="node-item__title">{{ node.title }}</span>
            </div>
            <div class="node-item__right">
              <span
                class="node-item__status"
                :style="{ color: getStatusColor(node.status) }"
              >
                {{ getStatusLabel(node.status) }}
              </span>
            </div>
          </button>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span class="empty-icon">📋</span>
          <p v-if="searchQuery">
            Nie znaleziono tasków dla zapytania "{{ searchQuery }}"
          </p>
          <p v-else>
            Brak dostępnych tasków w projekcie
          </p>
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          Anuluj
        </button>
        <button
          class="btn btn--primary"
          :disabled="!selectedNodeId"
          @click="handleConfirm"
        >
          Powiąż
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  max-width: 600px;
  max-height: 80vh;
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
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal__footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.search-bar {
  margin-bottom: 8px;
}

.search-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #7c3aed;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.node-item:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.node-item--selected {
  border-color: #7c3aed;
  background: #f5f3ff;
}

.node-item__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.node-item__type {
  font-size: 16px;
  flex-shrink: 0;
}

.node-item__title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-item__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 12px;
}

.node-item__status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.05);
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}

.empty-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  color: #64748b;
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

.btn--primary:hover:not(:disabled) {
  background: #6d28d9;
}

.btn--primary:disabled {
  background: #c4b5fd;
  cursor: not-allowed;
  opacity: 0.6;
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
