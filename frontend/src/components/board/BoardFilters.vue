<template>
  <div class="board-filters">
    <div class="filter-group search-group">
      <span class="filter-icon">🔍</span>
      <input
        :value="search"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
        type="text"
        placeholder="Szukaj..."
        class="filter-input"
      />
    </div>

    <div class="filter-group">
      <select
        :value="assignee"
        @change="$emit('update:assignee', ($event.target as HTMLSelectElement).value)"
        class="filter-select"
      >
        <option value="">Wszyscy wykonawcy</option>
        <option v-for="member in assignees" :key="member.user_id" :value="member.user_id">
          {{ member.user.username }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <select
        :value="type"
        @change="$emit('update:type', ($event.target as HTMLSelectElement).value)"
        class="filter-select"
      >
        <option value="">Wszystkie typy</option>
        <option value="TASK">Zadanie</option>
        <option value="MILESTONE">Kamień milowy</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProjectMember } from '@/api/projects'
import type { NodeType } from '@/api/nodes'

defineProps<{
  search: string
  assignee: string
  type: string
  assignees: ProjectMember[]
}>()

defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:assignee', value: string): void
  (e: 'update:type', value: string): void
}>()
</script>

<style scoped>
.board-filters {
  display: flex;
  gap: 12px;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  position: relative;
  display: flex;
  align-items: center;
}

.search-group {
  flex: 1;
  min-width: 200px;
  max-width: 400px;
}

.filter-icon {
  position: absolute;
  left: 10px;
  font-size: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background-color: white;
  color: #475569;
  cursor: pointer;
  min-width: 160px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-input::placeholder {
  color: #94a3b8;
}

@media (max-width: 768px) {
  .board-filters {
    padding: 12px 16px;
    gap: 8px;
  }

  .search-group {
    max-width: 100%;
    min-width: 100%;
    order: 1;
  }

  .filter-group {
    flex: 1;
  }

  .filter-select {
    width: 100%;
    min-width: 0;
  }
}
</style>
