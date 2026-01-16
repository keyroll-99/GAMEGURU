<template>
  <div
    class="node-card"
    :class="{
      'node-card--selected': isSelected,
      'node-card--done': node.status === 'DONE',
      'node-card--in-progress': node.status === 'IN_PROGRESS',
      'node-card--root': node.type === 'ROOT',
      'node-card--milestone': node.type === 'MILESTONE',
    }"
    @click.stop="handleClick"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- Status indicator -->
    <div class="node-card__status" :class="`node-card__status--${node.status.toLowerCase()}`">
      <span v-if="node.status === 'TODO'">○</span>
      <span v-else-if="node.status === 'IN_PROGRESS'">◐</span>
      <span v-else-if="node.status === 'DONE'">●</span>
    </div>

    <!-- Content -->
    <div class="node-card__content">
      <!-- Type badge for ROOT/MILESTONE -->
      <span v-if="node.type !== 'TASK'" class="node-card__type-badge">
        {{ node.type }}
      </span>
      
      <span class="node-card__title" :class="{ 'node-card__title--done': node.status === 'DONE' }">
        {{ node.title }}
      </span>
    </div>

    <!-- Assignees -->
    <div v-if="node.assignees.length > 0" class="node-card__assignees">
      <div
        v-for="assignee in node.assignees.slice(0, 3)"
        :key="assignee.user.id"
        class="node-card__avatar"
        :title="assignee.user.username"
      >
        <img
          v-if="assignee.user.avatar_url"
          :src="getAvatarUrl(assignee.user.avatar_url)"
          :alt="assignee.user.username"
        />
        <span v-else>{{ assignee.user.username.charAt(0).toUpperCase() }}</span>
      </div>
      <div v-if="node.assignees.length > 3" class="node-card__avatar node-card__avatar--more">
        +{{ node.assignees.length - 3 }}
      </div>
    </div>

    <!-- Children count -->
    <div v-if="childrenCount > 0" class="node-card__children-count">
      {{ childrenCount }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TreeNode } from '@/stores/nodes'

const props = defineProps<{
  node: TreeNode
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [nodeId: string]
  contextmenu: [payload: { event: MouseEvent, nodeId: string }]
}>()

const childrenCount = computed(() => {
  return props.node.children?.length || 0
})

const handleClick = () => {
  emit('select', props.node.id)
}

const handleContextMenu = (event: MouseEvent) => {
  emit('contextmenu', { event, nodeId: props.node.id })
}

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) return null
  return `${apiUrl}/${avatarPath}`
}
</script>

<style scoped>
.node-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  max-width: 280px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.node-card:hover {
  border-color: #94a3b8;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.node-card--selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.node-card--done {
  background: #f8fafc;
  opacity: 0.7;
}

.node-card--in-progress {
  border-color: #f59e0b;
  border-left-width: 4px;
}

.node-card--root {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.node-card--root .node-card__status {
  color: white;
}

.node-card--milestone {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-color: transparent;
}

.node-card--milestone .node-card__status {
  color: white;
}

.node-card__status {
  font-size: 12px;
  flex-shrink: 0;
}

.node-card__status--todo {
  color: #94a3b8;
}

.node-card__status--in_progress {
  color: #f59e0b;
}

.node-card__status--done {
  color: #22c55e;
}

.node-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.node-card__type-badge {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

.node-card__title {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card__title--done {
  text-decoration: line-through;
  color: #94a3b8;
}

.node-card__assignees {
  display: flex;
  flex-shrink: 0;
  margin-left: 4px;
}

.node-card__avatar {
  width: 22px;
  height: 22px;
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

.node-card__avatar:first-child {
  margin-left: 0;
}

.node-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.node-card__avatar--more {
  background: #94a3b8;
  color: white;
  font-size: 9px;
}

.node-card__children-count {
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.node-card--root .node-card__children-count,
.node-card--milestone .node-card__children-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
</style>
