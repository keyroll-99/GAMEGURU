<template>
  <div
    class="mindmap-node"
    :class="{
      'mindmap-node--selected': selected,
      'mindmap-node--done': data.status === 'DONE',
      'mindmap-node--in-progress': data.status === 'IN_PROGRESS',
      'mindmap-node--root': data.type === 'ROOT',
      'mindmap-node--milestone': data.type === 'MILESTONE',
      'mindmap-node--dragging': isDragging,
      'mindmap-node--drop-target': isDropTarget,
      'mindmap-node--drop-target-valid': isDropTarget && isValidDrop,
      'mindmap-node--drop-target-invalid': isDropTarget && !isValidDrop,
    }"
  >
    <!-- Expand/Collapse button -->
    <button
      v-if="data.hasChildren"
      class="mindmap-node__toggle"
      @click.stop="handleToggle"
    >
      <span v-if="data.isExpanded">−</span>
      <span v-else>+</span>
    </button>

    <!-- Status indicator -->
    <div class="mindmap-node__status" :class="`mindmap-node__status--${data.status.toLowerCase()}`">
      <span v-if="data.status === 'TODO'">○</span>
      <span v-else-if="data.status === 'IN_PROGRESS'">◐</span>
      <span v-else-if="data.status === 'DONE'">●</span>
    </div>

    <!-- Content -->
    <div class="mindmap-node__content">
      <span v-if="data.type !== 'TASK'" class="mindmap-node__type-badge">
        {{ data.type }}
      </span>
      <span class="mindmap-node__title" :class="{ 'mindmap-node__title--done': data.status === 'DONE' }">
        {{ data.title }}
      </span>
    </div>

    <!-- Assignees -->
    <div v-if="data.assignees && data.assignees.length > 0" class="mindmap-node__assignees">
      <div
        v-for="assignee in data.assignees.slice(0, 3)"
        :key="assignee.user.id"
        class="mindmap-node__avatar"
        :title="assignee.user.username"
      >
        <img
          v-if="assignee.user.avatar_url"
          :src="getAvatarUrl(assignee.user.avatar_url) ?? undefined"
          :alt="assignee.user.username"
        />
        <span v-else>{{ assignee.user.username.charAt(0).toUpperCase() }}</span>
      </div>
      <div v-if="data.assignees.length > 3" class="mindmap-node__avatar mindmap-node__avatar--more">
        +{{ data.assignees.length - 3 }}
      </div>
    </div>

    <!-- Children count badge -->
    <div v-if="data.childrenCount > 0" class="mindmap-node__children-count">
      {{ data.childrenCount }}
    </div>

    <!-- Connection handles -->
    <Handle type="target" :position="Position.Left" :connectable="false" />
    <Handle type="source" :position="Position.Right" :connectable="false" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

interface NodeData {
  id: string
  type: 'ROOT' | 'TASK' | 'MILESTONE'
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  title: string
  description: string | null
  hasChildren: boolean
  childrenCount: number
  isExpanded: boolean
  assignees: Array<{
    user: {
      id: string
      username: string
      avatar_url: string | null
    }
  }>
}

const props = defineProps<{
  data: NodeData
  selected: boolean
  isDragging?: boolean
  isDropTarget?: boolean
  isValidDrop?: boolean
}>()

const emit = defineEmits<{
  'toggle-expand': [nodeId: string]
}>()

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) return null
  return `${apiUrl}/${avatarPath}`
}

function handleToggle() {
  emit('toggle-expand', props.data.id)
}
</script>

<style scoped>
.mindmap-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  min-width: 140px;
  max-width: 300px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
}

.mindmap-node:hover {
  border-color: #94a3b8;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.mindmap-node--selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.mindmap-node--done {
  background: #f8fafc;
  opacity: 0.75;
}

.mindmap-node--in-progress {
  border-color: #f59e0b;
  border-left-width: 4px;
}

.mindmap-node--root {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  min-width: 180px;
  padding: 14px 18px;
}

.mindmap-node--root .mindmap-node__status {
  color: rgba(255, 255, 255, 0.9);
}

.mindmap-node--milestone {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-color: transparent;
}

.mindmap-node--milestone .mindmap-node__status {
  color: rgba(255, 255, 255, 0.9);
}

.mindmap-node__toggle {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  color: #64748b;
  transition: all 0.15s ease;
  z-index: 10;
}

.mindmap-node__toggle:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  transform: translateY(-50%) scale(1.1);
}

.mindmap-node__status {
  font-size: 14px;
  flex-shrink: 0;
}

.mindmap-node__status--todo {
  color: #94a3b8;
}

.mindmap-node__status--in_progress {
  color: #f59e0b;
}

.mindmap-node__status--done {
  color: #22c55e;
}

.mindmap-node__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mindmap-node__type-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.85;
}

.mindmap-node__title {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mindmap-node__title--done {
  text-decoration: line-through;
  color: #94a3b8;
}

.mindmap-node__assignees {
  display: flex;
  flex-shrink: 0;
  margin-left: 4px;
}

.mindmap-node__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  margin-left: -6px;
  border: 2px solid white;
  overflow: hidden;
}

.mindmap-node__avatar:first-child {
  margin-left: 0;
}

.mindmap-node__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mindmap-node__avatar--more {
  background: #94a3b8;
  color: white;
  font-size: 9px;
}

.mindmap-node__children-count {
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
  flex-shrink: 0;
  font-weight: 500;
}

.mindmap-node--root .mindmap-node__children-count,
.mindmap-node--milestone .mindmap-node__children-count {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

/* Vue Flow handles */
.mindmap-node :deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
  background: #94a3b8;
  border: 2px solid white;
}

.mindmap-node :deep(.vue-flow__handle-left) {
  left: -4px;
}

.mindmap-node :deep(.vue-flow__handle-right) {
  right: -4px;
}

.mindmap-node--root :deep(.vue-flow__handle-left) {
  display: none;
}

/* Drag & Drop visual feedback (Phase 2.1) */
.mindmap-node--dragging {
  opacity: 0.5;
  cursor: grabbing !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.mindmap-node--drop-target {
  transform: scale(1.05);
  transition: all 0.2s ease;
}

.mindmap-node--drop-target-valid {
  border-color: #22c55e !important;
  border-width: 3px;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1);
  background: rgba(34, 197, 94, 0.05);
}

.mindmap-node--drop-target-invalid {
  border-color: #ef4444 !important;
  border-width: 3px;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2), 0 4px 8px rgba(0, 0, 0, 0.1);
  background: rgba(239, 68, 68, 0.05);
}
</style>
