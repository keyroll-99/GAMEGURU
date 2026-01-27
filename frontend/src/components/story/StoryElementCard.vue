<script setup lang="ts">
import type { StoryElement } from '@/api/story'

interface Props {
  element: StoryElement
  isSelected?: boolean
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  depth: 0,
})

const emit = defineEmits<{
  select: [element: StoryElement]
}>()

const statusColors: Record<string, string> = {
  DRAFT: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#f59e0b',
  COMPLETED: '#10b981',
}

const typeIcons: Record<string, string> = {
  OVERVIEW: '📋',
  ACT: '🎭',
  SCENE: '🎬',
  DIALOG: '💬',
  EVENT: '⚡',
  CHARACTER: '👤',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Szkic',
  IN_PROGRESS: 'W trakcie',
  REVIEW: 'Do przeglądu',
  COMPLETED: 'Ukończone',
}

function handleClick() {
  emit('select', props.element)
}
</script>

<template>
  <div
    class="story-element-card"
    :class="{
      'story-element-card--selected': isSelected,
      [`story-element-card--depth-${Math.min(depth, 3)}`]: true,
    }"
    @click="handleClick"
  >
    <div class="story-element-card__icon">
      {{ typeIcons[element.type] || '📄' }}
    </div>
    <div class="story-element-card__content">
      <div class="story-element-card__title">{{ element.title }}</div>
      <div class="story-element-card__meta">
        <span
          class="status-badge"
          :style="{ backgroundColor: statusColors[element.status] }"
        >
          {{ statusLabels[element.status] }}
        </span>
        <span class="type-label">{{ element.type }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.story-element-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
  border-left: 3px solid transparent;
}

.story-element-card:hover {
  background: #f1f5f9;
}

.story-element-card--selected {
  background: #ede9fe;
  border-left-color: #7c3aed;
}

.story-element-card--depth-0 {
  padding-left: 16px;
}

.story-element-card--depth-1 {
  padding-left: 32px;
}

.story-element-card--depth-2 {
  padding-left: 48px;
}

.story-element-card--depth-3 {
  padding-left: 64px;
}

.story-element-card__icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.story-element-card__content {
  flex: 1;
  min-width: 0;
}

.story-element-card__title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.story-element-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  color: white;
  font-weight: 500;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-label {
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
