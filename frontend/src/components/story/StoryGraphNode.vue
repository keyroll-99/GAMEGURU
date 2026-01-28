<template>
  <div
    class="story-node"
    :class="[
      `story-node--${data.type.toLowerCase()}`,
      `story-node--${data.status.toLowerCase()}`,
      { 'story-node--selected': selected }
    ]"
  >
    <!-- Type badge -->
    <div class="story-node__type" :class="`story-node__type--${data.type.toLowerCase()}`">
      {{ getTypeLabel(data.type) }}
    </div>

    <!-- Content -->
    <div class="story-node__content">
      <h4 class="story-node__title">{{ data.title }}</h4>
    </div>

    <!-- Status indicator -->
    <div class="story-node__status" :class="`story-node__status--${data.status.toLowerCase()}`">
      <span v-if="data.status === 'DRAFT'">○</span>
      <span v-else-if="data.status === 'IN_PROGRESS'">◐</span>
      <span v-else-if="data.status === 'REVIEW'">◑</span>
      <span v-else-if="data.status === 'COMPLETED'">●</span>
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
    OVERVIEW: '📋',
    ACT: '🎭',
    SCENE: '🎬',
    DIALOG: '💬',
    EVENT: '⚡',
    CHARACTER: '👤',
  }
  return labels[type] || type
}
</script>

<style scoped>
.story-node {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
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

.story-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.story-node--selected {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
}

/* Type-based border colors */
.story-node--act {
  border-left-width: 4px;
  border-left-color: #3b82f6;
}

.story-node--scene {
  border-left-width: 4px;
  border-left-color: #10b981;
}

.story-node--event {
  border-left-width: 4px;
  border-left-color: #f59e0b;
}

.story-node--dialog {
  border-left-width: 4px;
  border-left-color: #8b5cf6;
}

.story-node--character {
  border-left-width: 4px;
  border-left-color: #ec4899;
}

.story-node--overview {
  border-left-width: 4px;
  border-left-color: #64748b;
}

/* Status-based background colors */
.story-node--draft {
  background: #f8fafc;
}

.story-node--in_progress {
  background: #fefce8;
}

.story-node--review {
  background: #eff6ff;
}

.story-node--completed {
  background: #f0fdf4;
  opacity: 0.85;
}

.story-node__type {
  position: absolute;
  top: -8px;
  left: 12px;
  font-size: 18px;
  background: white;
  padding: 0 4px;
  border-radius: 4px;
}

.story-node__content {
  flex: 1;
  min-width: 0;
}

.story-node__title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.story-node__status {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 12px;
}

.story-node__status--draft {
  color: #94a3b8;
}

.story-node__status--in_progress {
  color: #eab308;
}

.story-node__status--review {
  color: #8b5cf6;
}

.story-node__status--completed {
  color: #22c55e;
}

/* Vue Flow handles */
.story-node :deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  background: #94a3b8;
  border: 2px solid white;
}

.story-node :deep(.vue-flow__handle-left) {
  left: -5px;
}

.story-node :deep(.vue-flow__handle-right) {
  right: -5px;
}
</style>
