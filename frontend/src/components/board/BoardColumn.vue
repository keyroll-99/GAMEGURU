<template>
  <div class="board-column">
    <div class="board-column__header" :class="`board-column__header--${status.toLowerCase()}`">
      <h3>{{ title }}</h3>
      <span class="board-column__count">{{ modelValue.length }}</span>
    </div>

    <draggable
      class="board-column__content"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      group="nodes"
      item-key="id"
      :data-status="status"
      @change="handleChange"
      ghost-class="board-card--ghost"
      drag-class="board-card--drag"
      animation="200"
    >
      <template #item="{ element }">
        <BoardCard
          :node="element"
          :is-selected="selectedNodeId === element.id"
          @click="$emit('node-click', element)"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { Node, NodeStatus } from '@/api/nodes'
import BoardCard from './BoardCard.vue'

const props = defineProps<{
  status: NodeStatus
  title: string
  modelValue: Node[] // v-model
  selectedNodeId?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Node[]): void
  (e: 'change', event: any): void
  (e: 'node-click', node: Node): void
}>()

const handleChange = (event: any) => {
  emit('change', { ...event, status: props.status })
}
</script>

<style scoped>
.board-column {
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-radius: 12px;
  height: 100%;
  min-width: 300px;
  width: 320px;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.board-column__header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
  border-radius: 12px 12px 0 0;
}

.board-column__header h3 {
  margin: 0;
  font-size: 16px;
}

.board-column__header--todo { border-top: 4px solid #64748b; }
.board-column__header--in_progress { border-top: 4px solid #3b82f6; }
.board-column__header--done { border-top: 4px solid #10b981; }

.board-column__count {
  background: #e2e8f0;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
}

.board-column__content {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.board-card--ghost {
  opacity: 0.5;
  background: #e2e8f0;
  border: 1px dashed #94a3b8;
}

.board-card--drag {
  opacity: 1;
  transform: rotate(2deg);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  cursor: grabbing;
}
</style>
