<template>
  <div
    class="story-graph-node"
    :class="{
      'story-graph-node--selected': selected,
      'story-graph-node--draft': data.status === 'DRAFT',
      'story-graph-node--in-progress': data.status === 'IN_PROGRESS',
      'story-graph-node--review': data.status === 'REVIEW',
      'story-graph-node--completed': data.status === 'COMPLETED',
    }"
  >
    <!-- Type badge and status -->
    <div class="story-graph-node__header">
      <span class="story-graph-node__type-badge">
        {{ getTypeLabel(data.type) }}
      </span>
      <div class="story-graph-node__status" :class="`story-graph-node__status--${data.status.toLowerCase()}`">
        <span v-if="data.status === 'DRAFT'">○</span>
        <span v-else-if="data.status === 'IN_PROGRESS'">◐</span>
        <span v-else-if="data.status === 'REVIEW'">◕</span>
        <span v-else-if="data.status === 'COMPLETED'">●</span>
      </div>
    </div>

    <!-- Content -->
    <div class="story-graph-node__content">
      <span class="story-graph-node__title">
        {{ data.title }}
      </span>
    </div>

    <!-- Connection handles -->
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { StoryElementType, StoryElementStatus } from '@/api/story'

interface NodeData {
  id: string
  type: StoryElementType
  status: StoryElementStatus
  title: string
  content: string | null
}

const props = defineProps<{
  data: NodeData
  selected: boolean
}>()

function getTypeLabel(type: StoryElementType): string {
  const labels: Record<StoryElementType, string> = {
    OVERVIEW: '📋 Zarys',
    ACT: '🎭 Akt',
    SCENE: '🎬 Scena',
    DIALOG: '💬 Dialog',
    EVENT: '⚡ Event',
    CHARACTER: '👤 Postać',
  }
  return labels[type] || type
}
</script>

<style scoped>
.story-graph-node {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 160px;
  max-width: 280px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.story-graph-node:hover {
  border-color: #94a3b8;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.story-graph-node--selected {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

.story-graph-node--draft {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.story-graph-node--in-progress {
  border-color: #f59e0b;
  border-left-width: 4px;
}

.story-graph-node--review {
  border-color: #8b5cf6;
  border-left-width: 4px;
}

.story-graph-node--completed {
  background: #f0fdf4;
  border-color: #22c55e;
}

.story-graph-node__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.story-graph-node__type-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: #64748b;
  flex: 1;
}

.story-graph-node__status {
  font-size: 14px;
  flex-shrink: 0;
}

.story-graph-node__status--draft {
  color: #94a3b8;
}

.story-graph-node__status--in_progress {
  color: #f59e0b;
}

.story-graph-node__status--review {
  color: #8b5cf6;
}

.story-graph-node__status--completed {
  color: #22c55e;
}

.story-graph-node__content {
  flex: 1;
  min-width: 0;
}

.story-graph-node__title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.story-graph-node--completed .story-graph-node__title {
  text-decoration: line-through;
  color: #64748b;
}

/* Vue Flow handles */
.story-graph-node :deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  background: #7c3aed;
  border: 2px solid white;
}

.story-graph-node :deep(.vue-flow__handle-left) {
  left: -5px;
}

.story-graph-node :deep(.vue-flow__handle-right) {
  right: -5px;
}
</style>
