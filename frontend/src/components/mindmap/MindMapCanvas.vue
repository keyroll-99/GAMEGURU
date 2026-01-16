<template>
  <div
    ref="canvasRef"
    class="mindmap-canvas"
    @wheel.prevent="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <!-- Zoom controls -->
    <div class="mindmap-canvas__controls">
      <button @click="zoomIn" title="Powiększ">+</button>
      <span class="mindmap-canvas__zoom-level">{{ Math.round(zoom * 100) }}%</span>
      <button @click="zoomOut" title="Pomniejsz">−</button>
      <button @click="resetView" title="Resetuj widok">⌂</button>
    </div>

    <!-- Scrollable container -->
    <div
      class="mindmap-canvas__viewport"
      :style="{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }"
    >
      <!-- Tree content -->
      <div class="mindmap-canvas__content">
        <slot></slot>
      </div>
    </div>

    <!-- Panning indicator -->
    <div v-if="isPanning" class="mindmap-canvas__panning-indicator">
      Przeciąganie...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const canvasRef = ref<HTMLElement | null>(null)

// Zoom state
const zoom = ref(1)
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2
const ZOOM_STEP = 0.1

// Pan state
const pan = reactive({ x: 50, y: 50 })
const isPanning = ref(false)
const lastMousePos = reactive({ x: 0, y: 0 })

// Zoom handlers (T-089)
const handleWheel = (event: WheelEvent) => {
  const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta))
  
  // Zoom towards mouse position
  if (newZoom !== zoom.value) {
    const rect = canvasRef.value?.getBoundingClientRect()
    if (rect) {
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      
      // Adjust pan to zoom towards mouse
      const zoomFactor = newZoom / zoom.value
      pan.x = mouseX - (mouseX - pan.x) * zoomFactor
      pan.y = mouseY - (mouseY - pan.y) * zoomFactor
    }
    
    zoom.value = newZoom
  }
}

const zoomIn = () => {
  zoom.value = Math.min(MAX_ZOOM, zoom.value + ZOOM_STEP)
}

const zoomOut = () => {
  zoom.value = Math.max(MIN_ZOOM, zoom.value - ZOOM_STEP)
}

const resetView = () => {
  zoom.value = 1
  pan.x = 50
  pan.y = 50
}

// Pan handlers (T-089)
const handleMouseDown = (event: MouseEvent) => {
  // Only pan with left mouse button on empty space
  if (event.button === 0 && event.target === canvasRef.value) {
    isPanning.value = true
    lastMousePos.x = event.clientX
    lastMousePos.y = event.clientY
    if (canvasRef.value) {
      canvasRef.value.style.cursor = 'grabbing'
    }
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isPanning.value) {
    const deltaX = event.clientX - lastMousePos.x
    const deltaY = event.clientY - lastMousePos.y
    
    pan.x += deltaX
    pan.y += deltaY
    
    lastMousePos.x = event.clientX
    lastMousePos.y = event.clientY
  }
}

const handleMouseUp = () => {
  isPanning.value = false
  if (canvasRef.value) {
    canvasRef.value.style.cursor = 'grab'
  }
}

// Expose for parent component
defineExpose({
  zoom,
  pan,
  resetView,
  zoomIn,
  zoomOut,
})
</script>

<style scoped>
.mindmap-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f8fafc;
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
  cursor: grab;
}

.mindmap-canvas__controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: white;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.mindmap-canvas__controls button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  color: #64748b;
  transition: all 0.15s ease;
}

.mindmap-canvas__controls button:hover {
  background: #f1f5f9;
  color: #334155;
}

.mindmap-canvas__zoom-level {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  min-width: 40px;
  text-align: center;
}

.mindmap-canvas__viewport {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.mindmap-canvas__content {
  padding: 20px;
}

.mindmap-canvas__panning-indicator {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
