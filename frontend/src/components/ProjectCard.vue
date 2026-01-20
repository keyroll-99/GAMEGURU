<script setup lang="ts">
import type { Project } from '@/api/projects'
import { useAuthStore } from '@/stores/auth'
import { computed } from 'vue'

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  click: [project: Project]
}>()

const authStore = useAuthStore()

const isOwner = computed(() => props.project.owner_id === authStore.user?.id)
const memberCount = computed(() => props.project._count?.members || props.project.members?.length || 1)

function handleClick() {
  emit('click', props.project)
}
</script>

<template>
  <div
    class="project-card"
    :class="{ archived: project.is_archived }"
    @click="handleClick"
  >
    <!-- Gradient accent -->
    <div class="card-accent"></div>
    
    <div class="project-card-content">
      <div class="project-card-header">
        <div class="project-icon">🎮</div>
        <div class="project-title-area">
          <h3 class="project-name">{{ project.name }}</h3>
          <div class="badges">
            <span v-if="isOwner" class="badge owner-badge">
              <span class="badge-icon">👑</span> Właściciel
            </span>
            <span v-if="project.is_archived" class="badge archived-badge">
              <span class="badge-icon">📦</span> Archiwum
            </span>
          </div>
        </div>
      </div>

      <p v-if="project.description" class="project-description">
        {{ project.description }}
      </p>
      <p v-else class="project-description empty">
        Brak opisu projektu
      </p>

      <div class="project-card-footer">
        <div class="footer-left">
          <div class="members-info">
            <div class="members-avatars">
              <div class="avatar-stack">
                <span class="avatar-placeholder small">{{ project.owner.username.charAt(0).toUpperCase() }}</span>
              </div>
            </div>
            <span class="members-count">{{ memberCount }} {{ memberCount === 1 ? 'osoba' : memberCount < 5 ? 'osoby' : 'osób' }}</span>
          </div>
        </div>

        <div class="footer-right">
          <span class="view-project">
            Otwórz <span class="arrow">→</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  border-color: hsla(160, 100%, 37%, 0.4);
  transform: translateY(-4px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.12),
    0 0 0 1px hsla(160, 100%, 37%, 0.1);
}

.project-card:hover .card-accent {
  opacity: 1;
}

.project-card:hover .arrow {
  transform: translateX(4px);
}

.project-card:hover .view-project {
  color: hsla(160, 100%, 37%, 1);
}

.project-card.archived {
  opacity: 0.7;
}

.project-card.archived .card-accent {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.card-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(135deg, hsla(160, 100%, 37%, 1) 0%, hsla(200, 100%, 50%, 1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-card-content {
  padding: 1.5rem;
}

.project-card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.project-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, hsla(160, 100%, 37%, 0.15) 0%, hsla(200, 100%, 50%, 0.1) 100%);
  border-radius: 12px;
  flex-shrink: 0;
}

.project-title-area {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  word-wrap: break-word;
}

.badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.badge-icon {
  font-size: 0.7rem;
}

.owner-badge {
  background: linear-gradient(135deg, hsla(45, 100%, 50%, 0.2) 0%, hsla(35, 100%, 50%, 0.15) 100%);
  color: #d97706;
  border: 1px solid hsla(45, 100%, 50%, 0.3);
}

.archived-badge {
  background: rgba(156, 163, 175, 0.15);
  color: #6b7280;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.project-description {
  color: var(--color-text);
  opacity: 0.75;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1.25rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.85rem;
}

.project-description.empty {
  opacity: 0.4;
  font-style: italic;
}

.project-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.members-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar-stack {
  display: flex;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, hsla(160, 100%, 37%, 0.2) 0%, hsla(200, 100%, 50%, 0.15) 100%);
  color: hsla(160, 100%, 37%, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  border: 2px solid var(--color-background);
}

.avatar-placeholder.small {
  width: 28px;
  height: 28px;
  font-size: 0.75rem;
}

.members-count {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.7;
  font-weight: 500;
}

.view-project {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.7;
  transition: all 0.2s ease;
}

.arrow {
  transition: transform 0.2s ease;
}
</style>
