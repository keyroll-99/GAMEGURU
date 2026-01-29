<template>
  <div
    class="board-card"
    :class="[`board-card--${node.type.toLowerCase()}`, { 'board-card--selected': isSelected }]"
    @click="$emit('click', node)"
  >
    <div class="board-card__header">
      <span class="board-card__type">{{ node.type }}</span>
      <div v-if="node.assignees && node.assignees.length > 0" class="board-card__assignees">
        <div
          v-for="assignee in node.assignees.slice(0, 3)"
          :key="assignee.user.id"
          class="board-card__avatar"
          :title="assignee.user.username"
        >
           <img
            v-if="assignee.user.avatar_url"
            :src="getAvatarUrl(assignee.user.avatar_url) ?? undefined"
            :alt="assignee.user.username"
          >
          <span v-else>{{ assignee.user.username.charAt(0).toUpperCase() }}</span>
        </div>
        <div v-if="node.assignees.length > 3" class="board-card__avatar-more">
          +{{ node.assignees.length - 3 }}
        </div>
      </div>
    </div>
    <div class="board-card__title">{{ node.title }}</div>
    <div v-if="node.description" class="board-card__desc-indicator" title="Ma opis">
      📝
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Node } from '@/api/nodes'

const props = defineProps<{
  node: Node
  isSelected?: boolean
}>()

defineEmits<{
  (e: 'click', node: Node): void
}>()

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) return null
  return `${apiUrl}/${avatarPath}`
}
</script>

<style scoped>
.board-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  position: relative;
}

.board-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
  z-index: 10;
}

.board-card--selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.board-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.board-card__type {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
  text-transform: uppercase;
}

.board-card--milestone .board-card__type {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.board-card__assignees {
  display: flex;
  margin-left: auto;
}

.board-card__avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 2px solid white;
  margin-left: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  overflow: hidden;
  color: #475569;
}

.board-card__avatar:first-child {
  margin-left: 0;
}

.board-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.board-card__avatar-more {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 2px solid white;
  margin-left: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
}

.board-card__title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  line-height: 1.4;
  word-wrap: break-word;
}

.board-card__desc-indicator {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}
</style>
