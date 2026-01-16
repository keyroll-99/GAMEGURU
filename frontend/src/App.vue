<script setup lang="ts">
import { RouterView } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'
</script>

<template>
  <MainLayout>
    <RouterView />
  </MainLayout>
</template>

<style>
/* Global styles */
:root {
  --color-primary: #4f46e5;
  --color-primary-hover: #4338ca;
  --color-background: #ffffff;
  --color-background-soft: #f8fafc;
  --color-background-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: var(--color-text);
  background-color: var(--color-background);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  color: var(--color-primary-hover);
}

button {
  cursor: pointer;
  font-family: inherit;
}

input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
}
</style>
