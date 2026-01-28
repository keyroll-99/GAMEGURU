<template>
  <div 
    class="node-tree"
    :class="{ 
      'node-tree--drag-over': isDragOver && canDrop,
      'node-tree--drag-over-valid': isDragOver && canDrop && isValidDrop,
      'node-tree--drag-over-invalid': isDragOver && canDrop && !isValidDrop
    }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- Drop zone indicator (T-104 + Phase 2.1 enhanced) -->
    <div 
      v-if="isDragOver && canDrop" 
      class="node-tree__drop-indicator"
      :class="{
        'node-tree__drop-indicator--valid': isValidDrop,
        'node-tree__drop-indicator--invalid': !isValidDrop
      }"
    >
      <span v-if="isValidDrop">✓ Upuść tutaj</span>
      <span v-else>✗ Nie można tutaj upuścić</span>
    </div>

    <!-- Node card z expand/collapse button -->
    <div 
      class="node-tree__node"
      :class="{ 'node-tree__node--dragging': isDragging }"
      :draggable="node.type !== 'ROOT'"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
    >
      <!-- Expand/Collapse button (T-092) -->
      <button
        v-if="node.children.length > 0"
        class="node-tree__toggle"
        @click.stop="handleToggle"
      >
        <span v-if="node.isExpanded">−</span>
        <span v-else>+</span>
      </button>
      <div v-else class="node-tree__toggle-placeholder"></div>

      <!-- Drag handle -->
      <div v-if="node.type !== 'ROOT'" class="node-tree__drag-handle" title="Przeciągnij">
        ⋮⋮
      </div>

      <!-- Node card -->
      <NodeCard
        :node="node"
        :is-selected="node.id === selectedNodeId"
        @select="handleSelect"
        @contextmenu="handleContextMenu"
      />
    </div>

    <!-- Children (recursive) -->
    <div v-if="node.isExpanded && node.children.length > 0" class="node-tree__children">
      <div class="node-tree__connector"></div>
      <div class="node-tree__children-list">
        <NodeTree
          v-for="(child, index) in node.children"
          :key="child.id"
          :node="child"
          :selected-node-id="selectedNodeId"
          :parent-id="node.id"
          :index="index"
          @select="handleSelect"
          @toggle="handleChildToggle"
          @move="handleChildMove"
          @node-contextmenu="handleChildContextMenu"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TreeNode } from '@/stores/nodes'
import NodeCard from './NodeCard.vue'

const props = defineProps<{
  node: TreeNode
  selectedNodeId: string | null
  parentId?: string
  index?: number
}>()

const emit = defineEmits<{
  select: [nodeId: string]
  toggle: [nodeId: string]
  move: [nodeId: string, newParentId: string, newIndex: number]
  'node-contextmenu': [payload: { event: MouseEvent, nodeId: string }]
}>()

// Drag state
const isDragging = ref(false)
const isDragOver = ref(false)

// Helper function to check if a node is a descendant of another (prevent circular refs)
const isDescendantOf = (ancestorId: string, nodeId: string): boolean => {
  if (!nodeId || !props.node.children) return false
  
  // Check direct children
  if (props.node.children.some(child => child.id === ancestorId)) {
    return true
  }
  
  // Recursively check descendants
  return props.node.children.some(child => isDescendantOf(ancestorId, child.id))
}

// Check if can drop (can't drop on itself or its descendants)
const canDrop = computed(() => {
  const draggedId = window.__draggedNodeId
  if (!draggedId) return false
  if (draggedId === props.node.id) return false
  
  // Can't drop if this node is a descendant of the dragged node (would create circular ref)
  if (isDescendantOf(props.node.id, draggedId)) return false
  
  return true
})

// Check if this is a valid drop (Phase 2.1 - enhanced with descendant check)
const isValidDrop = computed(() => {
  const draggedId = window.__draggedNodeId
  const draggedParentId = window.__draggedNodeParentId
  if (!draggedId || !canDrop.value) return false
  
  // Valid if moving to a different parent and not creating circular reference
  if (props.node.id !== draggedParentId) {
    // Double-check not a descendant
    return !isDescendantOf(props.node.id, draggedId)
  }
  
  // Invalid if dropping on same parent
  return false
})

const handleSelect = (nodeId: string) => {
  emit('select', nodeId)
}

const handleToggle = () => {
  emit('toggle', props.node.id)
}

const handleChildToggle = (nodeId: string) => {
  emit('toggle', nodeId)
}

// Drag & Drop handlers (T-102, T-103)
const handleDragStart = (event: DragEvent) => {
  if (props.node.type === 'ROOT') {
    event.preventDefault()
    return
  }
  
  isDragging.value = true
  
  // Store dragged node info globally
  window.__draggedNodeId = props.node.id
  window.__draggedNodeParentId = props.parentId
  window.__draggedNodeIndex = props.index
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.node.id)
  }
}

const handleDragEnd = () => {
  isDragging.value = false
  window.__draggedNodeId = undefined
  window.__draggedNodeParentId = undefined
  window.__draggedNodeIndex = undefined
}

const handleDragOver = (event: DragEvent) => {
  if (!canDrop.value) return
  event.dataTransfer!.dropEffect = 'move'
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  
  const draggedId = window.__draggedNodeId
  if (!draggedId || !canDrop.value) return
  
  // Emit move event: move draggedId to this node as parent
  // New index = 0 (first child)
  emit('move', draggedId, props.node.id, 0)
}

const handleChildMove = (nodeId: string, newParentId: string, newIndex: number) => {
  emit('move', nodeId, newParentId, newIndex)
}

const handleContextMenu = (payload: { event: MouseEvent, nodeId: string }) => {
  emit('node-contextmenu', payload)
}

const handleChildContextMenu = (payload: { event: MouseEvent, nodeId: string }) => {
  emit('node-contextmenu', payload)
}
</script>

<style scoped>
.node-tree {
  display: flex;
  flex-direction: row; /* Horizontal layout */
  align-items: center; /* Center children vertically relative to parent */
  position: relative;
}

.node-tree--drag-over {
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.node-tree--drag-over-valid {
  background: rgba(34, 197, 94, 0.1);
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.3);
}

.node-tree--drag-over-invalid {
  background: rgba(239, 68, 68, 0.1);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.node-tree__drop-indicator {
  position: absolute;
  top: -10px; /* Above the node */
  left: 0;
  min-width: 120px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  z-index: 20;
  text-align: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.node-tree__drop-indicator--valid {
  background: #22c55e;
  color: white;
}

.node-tree__drop-indicator--invalid {
  background: #ef4444;
  color: white;
}

.node-tree__node {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s ease;
  margin-right: 60px; /* Space for line */
  position: relative;
  z-index: 2;
}

.node-tree__node--dragging {
  opacity: 0.5;
  cursor: grabbing;
  transform: scale(0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.node-tree__node[draggable="true"] {
  cursor: grab;
}

.node-tree__node[draggable="true"]:active {
  cursor: grabbing;
}

.node-tree__drag-handle {
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 10px;
  letter-spacing: -2px;
  cursor: grab;
  user-select: none;
  flex-shrink: 0;
}

.node-tree__drag-handle:hover {
  color: #64748b;
}

.node-tree__toggle {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.15s ease;
  position: absolute;
  right: -30px; /* On the line */
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
}

.node-tree__toggle:hover {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.node-tree__toggle-placeholder {
  display: none;
}

.node-tree__children {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  /* Remove old connector styles */
}

.node-tree__connector {
  display: none; /* Removed old style connector */
}
.node-tree__children-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  /* Add vertical line to connect children */
}

/* Vertical line for children */
.node-tree__children-list::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #cbd5e1;
}

/* Connect children to the vertical line */
.node-tree__children-list > .node-tree {
  position: relative;
  padding-left: 24px; /* Space for connector */
}

.node-tree__children-list > .node-tree::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 24px;
  height: 2px;
  background: #cbd5e1;
}

/* Add connector from Parent to Children Group */
.node-tree__children::before {
  content: '';
  position: absolute;
  left: -40px; /* From parent node */
  top: 50%;
  width: 40px; /* Distance to children group */
  height: 2px;
  background: #cbd5e1;
}
</style>
