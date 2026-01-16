<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projects'
import { useAuthStore } from '@/stores/auth'
import ProjectCard from '@/components/ProjectCard.vue'
import CreateProjectModal from '@/components/CreateProjectModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import type { Project } from '@/api/projects'

const router = useRouter()
const projectsStore = useProjectsStore()
const authStore = useAuthStore()

const showCreateModal = ref(false)
const showArchived = ref(false)

const displayedProjects = computed(() => {
  return showArchived.value ? projectsStore.archivedProjects : projectsStore.activeProjects
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Dzień dobry'
  if (hour < 18) return 'Cześć'
  return 'Dobry wieczór'
})

onMounted(() => {
  projectsStore.fetchProjects()
})

function openCreateModal() {
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function handleProjectCreated(projectId: string) {
  router.push(`/projects/${projectId}/map`)
}

function handleProjectClick(project: Project) {
  router.push(`/projects/${project.id}/map`)
}
</script>

<template>
  <div class="dashboard">
    <!-- Hero Section -->
    <header class="dashboard-hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1>{{ greeting }}, <span class="username">{{ authStore.user?.username || 'użytkowniku' }}</span>! 👋</h1>
          <p class="hero-subtitle">Zarządzaj swoimi projektami i śledź postępy w jednym miejscu.</p>
        </div>
        <button class="btn btn-primary btn-lg" @click="openCreateModal">
          <span class="btn-icon">✨</span>
          Nowy projekt
        </button>
      </div>
      
      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <span class="stat-value">{{ projectsStore.activeProjects.length }}</span>
            <span class="stat-label">Aktywne projekty</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <span class="stat-value">{{ projectsStore.archivedProjects.length }}</span>
            <span class="stat-label">W archiwum</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-info">
            <span class="stat-value">{{ projectsStore.projects.length }}</span>
            <span class="stat-label">Wszystkie projekty</span>
          </div>
        </div>
      </div>
    </header>

    <section class="projects-section">
      <div class="section-header">
        <h2>
          <span class="section-icon">{{ showArchived ? '📦' : '🚀' }}</span>
          {{ showArchived ? 'Zarchiwizowane projekty' : 'Twoje projekty' }}
        </h2>
        <div class="section-actions">
          <button
            class="toggle-btn"
            :class="{ active: showArchived }"
            @click="showArchived = !showArchived"
          >
            <span class="toggle-icon">{{ showArchived ? '🔄' : '📦' }}</span>
            {{ showArchived ? 'Pokaż aktywne' : 'Pokaż archiwum' }}
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="projectsStore.isLoading" class="projects-loading">
        <LoadingSpinner text="Ładowanie projektów..." />
      </div>

      <!-- Error state -->
      <div v-else-if="projectsStore.error" class="projects-error">
        <div class="error-icon">⚠️</div>
        <h3>Wystąpił problem</h3>
        <p>{{ projectsStore.error }}</p>
        <button class="btn btn-secondary" @click="projectsStore.fetchProjects()">
          Spróbuj ponownie
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="displayedProjects.length === 0" class="projects-empty">
        <div class="empty-illustration">
          <div class="empty-icon">{{ showArchived ? '📦' : '🎮' }}</div>
          <div class="empty-sparkles">✨</div>
        </div>
        <h3>{{ showArchived ? 'Archiwum jest puste' : 'Rozpocznij swoją przygodę!' }}</h3>
        <p v-if="!showArchived">Utwórz swój pierwszy projekt i zacznij tworzyć niesamowite gry.</p>
        <p v-else>Nie masz jeszcze żadnych zarchiwizowanych projektów.</p>
        <button v-if="!showArchived" class="btn btn-primary btn-lg" @click="openCreateModal">
          <span class="btn-icon">🚀</span>
          Utwórz pierwszy projekt
        </button>
        <button v-else class="btn btn-secondary" @click="showArchived = false">
          Wróć do aktywnych
        </button>
      </div>

      <!-- Projects grid -->
      <div v-else class="projects-grid">
        <ProjectCard
          v-for="(project, index) in displayedProjects"
          :key="project.id"
          :project="project"
          :style="{ animationDelay: `${index * 0.05}s` }"
          class="project-card-animated"
          @click="handleProjectClick"
        />
      </div>
    </section>

    <!-- Create project modal -->
    <Teleport to="body">
      <CreateProjectModal
        v-if="showCreateModal"
        @close="closeCreateModal"
        @created="handleProjectCreated"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: calc(100vh - 80px);
}

/* Hero Section */
.dashboard-hero {
  background: linear-gradient(135deg, 
    hsla(160, 100%, 37%, 0.1) 0%, 
    hsla(200, 100%, 50%, 0.05) 50%,
    hsla(280, 100%, 60%, 0.05) 100%
  );
  border: 1px solid hsla(160, 100%, 37%, 0.2);
  border-radius: 20px;
  padding: 2.5rem;
  margin-bottom: 2.5rem;
  position: relative;
  overflow: hidden;
}

.dashboard-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, hsla(160, 100%, 37%, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.hero-text h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
}

.username {
  background: linear-gradient(135deg, hsla(160, 100%, 37%, 1), hsla(200, 100%, 50%, 1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  margin: 0;
  color: var(--color-text);
  opacity: 0.7;
  font-size: 1.1rem;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
  position: relative;
  z-index: 1;
}

.stat-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: hsla(160, 100%, 37%, 0.3);
}

.stat-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsla(160, 100%, 37%, 0.1);
  border-radius: 12px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--color-heading);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.7;
  margin-top: 0.25rem;
}

/* Section */
.projects-section {
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-header h2 {
  font-size: 1.5rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-icon {
  font-size: 1.5rem;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  border-color: hsla(160, 100%, 37%, 0.5);
  background: hsla(160, 100%, 37%, 0.05);
}

.toggle-btn.active {
  background: hsla(160, 100%, 37%, 0.15);
  border-color: hsla(160, 100%, 37%, 0.5);
  color: hsla(160, 100%, 37%, 1);
}

.toggle-icon {
  font-size: 1rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.05rem;
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-primary {
  background: linear-gradient(135deg, hsla(160, 100%, 37%, 1), hsla(160, 100%, 32%, 1));
  color: white;
  box-shadow: 0 4px 15px hsla(160, 100%, 37%, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px hsla(160, 100%, 37%, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-mute);
  border-color: var(--color-border-hover);
}

/* Loading */
.projects-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 2rem;
  color: var(--color-text);
}

.loading-animation {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.loading-dot {
  width: 12px;
  height: 12px;
  background: hsla(160, 100%, 37%, 1);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(1) { animation-delay: 0s; }
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Error */
.projects-error {
  text-align: center;
  padding: 4rem 2rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.projects-error h3 {
  margin: 0 0 0.5rem 0;
  color: #ef4444;
}

.projects-error p {
  margin: 0 0 1.5rem 0;
  opacity: 0.8;
}

/* Empty State */
.projects-empty {
  text-align: center;
  padding: 5rem 2rem;
  background: linear-gradient(135deg, 
    var(--color-background-soft) 0%, 
    hsla(160, 100%, 37%, 0.03) 100%
  );
  border-radius: 20px;
  border: 2px dashed var(--color-border);
}

.empty-illustration {
  position: relative;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.empty-icon {
  font-size: 5rem;
  animation: float 3s ease-in-out infinite;
}

.empty-sparkles {
  position: absolute;
  top: -10px;
  right: -20px;
  font-size: 1.5rem;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.5; transform: scale(1.2) rotate(15deg); }
}

.projects-empty h3 {
  font-size: 1.5rem;
  margin: 0 0 0.75rem 0;
}

.projects-empty p {
  margin: 0 0 2rem 0;
  opacity: 0.7;
  font-size: 1.1rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

.project-card-animated {
  animation: cardFadeIn 0.5s ease forwards;
  opacity: 0;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .dashboard-hero {
    padding: 1.5rem;
  }
  
  .hero-text h1 {
    font-size: 1.5rem;
  }
  
  .hero-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
