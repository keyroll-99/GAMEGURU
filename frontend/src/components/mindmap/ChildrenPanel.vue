<template>
  <div class="children-panel">
    <div class="children-panel__header">
      <h3>Kolejność zadań</h3>
      <button class="children-panel__close" @click="emit('close')">×</button>
    </div>
    
    <div v-if="parentNode" class="children-panel__parent">
      <span class="children-panel__parent-label">Węzeł nadrzędny:</span>
      <span class="children-panel__parent-title">{{ parentNode.title }}</span>
    </div>

    <div class="children-panel__content">
      <p class="children-panel__hint">
        Przeciągnij zadania, aby ustalić priorytet
      </p>

      <draggable
        v-model="localChildren"
        :item-key="(item: any) => item.id"
        class="children-panel__list"
        handle=".children-panel__drag-handle"
        animation="200"
        ghost-class="children-panel__item--ghost"
        @end="handleDragEnd"
      >
        <template #item="{ element, index }">
          <div class="children-panel__item">
            <div class="children-panel__drag-handle" title="Przeciągnij">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="4" cy="4" r="1.5"/>
                <circle cx="12" cy="4" r="1.5"/>
                <circle cx="4" cy="8" r="1.5"/>
                <circle cx="12" cy="8" r="1.5"/>
                <circle cx="4" cy="12" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
              </svg>
            </div>
            
            <span class="children-panel__index">{{ index + 1 }}</span>
            
            <div class="children-panel__item-content">
              <span 
                class="children-panel__item-type"
                :class="`children-panel__item-type--${element.type.toLowerCase()}`"
              >
                {{ element.type }}
              </span>
              <span class="children-panel__item-title">{{ element.title }}</span>
            </div>

            <span 
              class="children-panel__item-status"
              :class="`children-panel__item-status--${element.status.toLowerCase()}`"
            >
              <span v-if="element.status === 'TODO'">○</span>
              <span v-else-if="element.status === 'IN_PROGRESS'">◐</span>
              <span v-else-if="element.status === 'DONE'">●</span>
            </span>
          </div>
        </template>
      </draggable>

      <div v-if="localChildren.length === 0" class="children-panel__empty">
        Brak zadań do posortowania
      </div>

      <!-- Saving indicator -->
      <div v-if="isSaving" class="children-panel__saving">
        Zapisywanie...
      </div>
    </div>

    <div class="children-panel__actions">
      <button class="btn btn--secondary btn--full" @click="emit('close')">
        Zamknij
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import type { Node } from '@/api/nodes'

const props = defineProps<{
  parentNode: Node | null
  children: Node[]
}>()

const emit = defineEmits<{
  close: []
  reorder: [childrenIds: string[]]
}>()

// Local copy for dragging
const localChildren = ref<Node[]>([])

// Saving state
const isSaving = ref(false)

// Track original order for comparison
const originalOrder = ref<string[]>([])

// Watch for children changes
watch(
  () => props.children,
  (newChildren) => {
    localChildren.value = [...newChildren]
    originalOrder.value = newChildren.map(c => c.id)
  },
  { immediate: true }
)

// Check if order has changed
const hasChanges = computed(() => {
  const currentOrder = localChildren.value.map(c => c.id)
  return JSON.stringify(currentOrder) !== JSON.stringify(originalOrder.value)
})

async function handleDragEnd() {
  // Auto-save when order changes
  if (hasChanges.value) {
    isSaving.value = true
    const childrenIds = localChildren.value.map(c => c.id)
    emit('reorder', childrenIds)
    originalOrder.value = childrenIds
    // Small delay to show saving indicator
    setTimeout(() => {
      isSaving.value = false
    }, 500)
  }
}
</script>

<style scoped>
.children-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.children-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #fafafa;
}

.children-panel__header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.children-panel__close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: white;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.children-panel__close:hover {
  background: #f1f5f9;
  color: #ef4444;
  border-color: #ef4444;
}

.children-panel__parent {
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.children-panel__parent-label {
  font-size: 12px;
  color: #64748b;
}

.children-panel__parent-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.children-panel__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.children-panel__hint {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 16px;
  padding: 10px 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.children-panel__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.children-panel__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
}

.children-panel__item:hover {
  border-color: #94a3b8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.children-panel__item--ghost {
  opacity: 0.5;
  background: #f1f5f9;
}

.children-panel__drag-handle {
  color: #94a3b8;
  cursor: grab;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.children-panel__drag-handle:hover {
  color: #64748b;
}

.children-panel__drag-handle:active {
  cursor: grabbing;
}

.children-panel__index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
}

.children-panel__item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.children-panel__item-type {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.children-panel__item-type--task {
  color: #64748b;
}

.children-panel__item-type--milestone {
  color: #ec4899;
}

.children-panel__item-title {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.children-panel__item-status {
  font-size: 14px;
  flex-shrink: 0;
}

.children-panel__item-status--todo {
  color: #94a3b8;
}

.children-panel__item-status--in_progress {
  color: #f59e0b;
}

.children-panel__item-status--done {
  color: #22c55e;
}

.children-panel__empty {
  text-align: center;
  padding: 40px 20px;
  color: #94a3b8;
  font-size: 14px;
}

.children-panel__saving {
  text-align: center;
  padding: 8px;
  margin-top: 12px;
  background: #ecfdf5;
  color: #059669;
  font-size: 13px;
  border-radius: 6px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.children-panel__actions {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn--primary {
  background: #3b82f6;
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn--primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

.btn--secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn--secondary:hover {
  background: #f1f5f9;
}
</style>
