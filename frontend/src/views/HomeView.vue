<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="home">
    <section class="hero">
      <h1 class="hero-title">
        🎮 <span class="gradient-text">GameGuru</span>
      </h1>
      <p class="hero-subtitle">
        Zarządzaj projektami gier w wizualny sposób z wykorzystaniem mind map
      </p>
      <div class="hero-actions">
        <RouterLink to="/register" class="btn btn-primary">Rozpocznij za darmo</RouterLink>
        <RouterLink to="/login" class="btn btn-secondary">Zaloguj się</RouterLink>
      </div>
    </section>

    <section class="features">
      <div class="feature">
        <div class="feature-icon">🗺️</div>
        <h3>Mind Mapy</h3>
        <p>Wizualizuj strukturę swojego projektu jako interaktywne drzewo</p>
      </div>
      <div class="feature">
        <div class="feature-icon">👥</div>
        <h3>Współpraca</h3>
        <p>Zaproś członków zespołu i przydzielaj zadania</p>
      </div>
      <div class="feature">
        <div class="feature-icon">📊</div>
        <h3>Śledzenie postępów</h3>
        <p>Monitoruj status zadań: TODO, IN_PROGRESS, DONE</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.hero {
  text-align: center;
  padding: 4rem 0;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.gradient-text {
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text-muted);
  max-width: 600px;
  margin: 0 auto 2rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.15s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  color: white;
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-background-muted);
  color: var(--color-text);
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  padding: 4rem 0;
}

.feature {
  text-align: center;
  padding: 2rem;
  background-color: var(--color-background-soft);
  border-radius: 1rem;
  border: 1px solid var(--color-border);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.feature p {
  color: var(--color-text-muted);
}
</style>
