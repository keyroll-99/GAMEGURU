<script setup lang="ts">
import { computed } from 'vue'
import type { ProgressStats } from '@/api/story'

interface Props {
  stats: ProgressStats | null
}

const props = defineProps<Props>()

const completionPercentage = computed(() => {
  return props.stats?.completionPercentage || 0
})

const statusBreakdown = computed(() => {
  if (!props.stats) return []
  
  const statusColors: Record<string, string> = {
    COMPLETED: '#10b981',
    IN_PROGRESS: '#3b82f6',
    REVIEW: '#f59e0b',
    DRAFT: '#94a3b8',
  }
  
  const statusLabels: Record<string, string> = {
    COMPLETED: 'Ukończone',
    IN_PROGRESS: 'W trakcie',
    REVIEW: 'Do przeglądu',
    DRAFT: 'Szkic',
  }
  
  return Object.entries(props.stats.byStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      count,
      label: statusLabels[status] || status,
      color: statusColors[status] || '#94a3b8',
      percentage: props.stats ? (count / props.stats.total) * 100 : 0,
    }))
})

const typeBreakdown = computed(() => {
  if (!props.stats) return []
  
  const typeIcons: Record<string, string> = {
    OVERVIEW: '📋',
    ACT: '🎭',
    SCENE: '🎬',
    DIALOG: '💬',
    EVENT: '⚡',
    CHARACTER: '👤',
  }
  
  return Object.entries(props.stats.byType)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type,
      count,
      icon: typeIcons[type] || '📄',
    }))
})
</script>

<template>
  <div class="story-progress">
    <div class="story-progress__header">
      <h4 class="story-progress__title">Postęp fabuły</h4>
      <div class="story-progress__percentage">
        {{ completionPercentage.toFixed(0) }}%
      </div>
    </div>

    <div class="story-progress__bar">
      <div
        class="story-progress__fill"
        :style="{ width: `${completionPercentage}%` }"
      ></div>
    </div>

    <div v-if="stats" class="story-progress__details">
      <div class="stats-section">
        <h5 class="stats-section__title">Status</h5>
        <div class="stats-list">
          <div
            v-for="item in statusBreakdown"
            :key="item.status"
            class="stat-item"
          >
            <div class="stat-item__label">
              <span
                class="stat-item__dot"
                :style="{ backgroundColor: item.color }"
              ></span>
              {{ item.label }}
            </div>
            <div class="stat-item__value">{{ item.count }}</div>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h5 class="stats-section__title">Typy elementów</h5>
        <div class="stats-list">
          <div
            v-for="item in typeBreakdown"
            :key="item.type"
            class="stat-item"
          >
            <div class="stat-item__label">
              <span class="stat-item__icon">{{ item.icon }}</span>
              {{ item.type }}
            </div>
            <div class="stat-item__value">{{ item.count }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="story-progress__empty">
      Brak danych o postępie
    </div>
  </div>
</template>

<style scoped>
.story-progress {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.story-progress__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.story-progress__title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.story-progress__percentage {
  font-size: 24px;
  font-weight: 700;
  color: #7c3aed;
}

.story-progress__bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.story-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%);
  transition: width 0.3s ease;
}

.story-progress__details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stats-section__title {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.stat-item__label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
}

.stat-item__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-item__icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.stat-item__value {
  font-weight: 600;
  color: #1e293b;
}

.story-progress__empty {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}

@media (max-width: 768px) {
  .story-progress__details {
    grid-template-columns: 1fr;
  }
}
</style>
