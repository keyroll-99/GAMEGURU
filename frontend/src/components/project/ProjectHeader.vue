<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface Props {
  projectId: string
  projectName?: string
  isOwner?: boolean
}

defineProps<Props>()

const route = useRoute()
</script>

<template>
  <header class="project-header">
    <div class="project-header__top">
      <div class="project-header__left">
        <router-link :to="{ name: 'dashboard' }" class="back-link" title="Powrót do Dashboardu">
          ← Powrót
        </router-link>
        <h1 v-if="projectName">{{ projectName }}</h1>
        <h1 v-else>Projekt</h1>
      </div>
      <div class="project-header__right">
        <slot name="actions"></slot>
      </div>
    </div>
    <nav class="project-header__nav">
      <router-link
        :to="{ name: 'project-board', params: { id: projectId } }"
        class="nav-tab"
        :class="{ 'nav-tab--active': route.name === 'project-board' }"
      >
        <span class="tab-icon">🗺️</span> Mapa Myśli
      </router-link>
      <router-link
        :to="{ name: 'project-story', params: { id: projectId } }"
        class="nav-tab"
        :class="{ 'nav-tab--active': route.name === 'project-story' }"
      >
        <span class="tab-icon">📖</span> Fabuła
      </router-link>
      <router-link
        :to="{ name: 'project-notes', params: { id: projectId } }"
        class="nav-tab"
        :class="{ 'nav-tab--active': route.name === 'project-notes' }"
      >
        <span class="tab-icon">📝</span> Notatki
      </router-link>
      <router-link
        v-if="isOwner"
        :to="{ name: 'project-settings', params: { id: projectId } }"
        class="nav-tab"
        :class="{ 'nav-tab--active': route.name === 'project-settings' }"
      >
        <span class="tab-icon">⚙️</span> Ustawienia
      </router-link>
    </nav>
  </header>
</template>

<style scoped>
.project-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.project-header__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
}

.project-header__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-link {
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.back-link:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.project-header__left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.project-header__right {
  display: flex;
  gap: 8px;
}

.project-header__nav {
  display: flex;
  padding: 0 24px;
  gap: 24px;
}

.nav-tab {
  padding: 12px 4px;
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-tab:hover {
  color: #1e293b;
}

.nav-tab--active {
  color: #4f46e5;
  border-bottom-color: #4f46e5;
}

.tab-icon {
  font-size: 16px;
}
</style>
