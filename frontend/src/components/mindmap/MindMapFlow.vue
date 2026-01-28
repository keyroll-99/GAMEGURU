<template>
  <div class="mind-map-flow">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :default-viewport="{ x: 50, y: 50, zoom: 1 }"
      :min-zoom="0.25"
      :max-zoom="2"
      :fit-view-on-init="false"
      :nodes-draggable="true"
      :nodes-connectable="false"
      :edges-updatable="false"
      :auto-connect="false"
      @node-click="handleNodeClick"
      @node-drag-start="handleNodeDragStart"
      @node-drag="handleNodeDrag"
      @node-drag-stop="handleNodeDragStop"
      @pane-click="handlePaneClick"
      @node-context-menu="handleNodeContextMenu"
      @viewport-change="saveViewportState"
    >
      <Background pattern-color="#e2e8f0" :gap="20" />
      <Controls position="top-right" />
      <MiniMap position="bottom-right" />

      <!-- Custom node types -->
      <template #node-mindmap="nodeProps">
        <MindMapNode
          :data="nodeProps.data"
          :selected="nodeProps.selected"
          :is-dragging="draggedNodeId === nodeProps.id"
          :is-drop-target="dropTargetNodeId === nodeProps.id"
          :is-valid-drop="isValidDropTarget"
          @toggle-expand="handleToggleExpand"
        />
      </template>
    </VueFlow>

    <!-- Children Reorder Panel -->
    <Transition name="slide">
      <div v-if="showChildrenPanel" class="children-panel">
        <ChildrenPanel
          :parent-node="selectedParentNode"
          :children="selectedNodeChildren"
          @close="closeChildrenPanel"
          @reorder="handleReorderChildren"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node as FlowNode, Edge, ViewportTransform } from '@vue-flow/core'
import MindMapNode from './MindMapNode.vue'
import ChildrenPanel from './ChildrenPanel.vue'
import type { TreeNode } from '@/stores/nodes'
import type { Node } from '@/api/nodes'
import { useNodesStore } from '@/stores/nodes'

const props = defineProps<{
  nodesTree: TreeNode | null
  selectedNodeId: string | null
  allNodes: Node[]
}>()

const emit = defineEmits<{
  'select-node': [nodeId: string]
  'deselect-node': []
  'toggle-expand': [nodeId: string]
  'node-contextmenu': [payload: { event: MouseEvent; nodeId: string }]
  'reorder-children': [parentId: string, childrenIds: string[]]
  'change-parent': [nodeId: string, newParentId: string]
}>()

const { fitView, getNodes, setViewport, getViewport } = useVueFlow()

// Get nodes store for state persistence
const nodesStore = useNodesStore()

// Flow state
const nodes = ref<FlowNode[]>([])
const edges = ref<Edge[]>([])

// Drag & Drop visual feedback state (Phase 2.1)
const isDragging = ref(false)
const draggedNodeId = ref<string | null>(null)
const dropTargetNodeId = ref<string | null>(null)
const isValidDropTarget = ref(false)

// Watch viewport changes to save state
let viewportChangeTimeout: ReturnType<typeof setTimeout> | null = null
const saveViewportState = () => {
  if (viewportChangeTimeout) {
    clearTimeout(viewportChangeTimeout)
  }
  
  viewportChangeTimeout = setTimeout(() => {
    const viewport = getViewport()
    nodesStore.setZoom(viewport.zoom)
    nodesStore.setPan({ x: viewport.x, y: viewport.y })
  }, 1000) // Debounce for 1 second
}
// Children panel state
const showChildrenPanel = ref(false)
const selectedParentForReorder = ref<string | null>(null)

const selectedParentNode = computed(() => {
  if (!selectedParentForReorder.value) return null
  return props.allNodes.find(n => n.id === selectedParentForReorder.value) || null
})

const selectedNodeChildren = computed(() => {
  if (!selectedParentForReorder.value) return []
  return props.allNodes
    .filter(n => n.parent_id === selectedParentForReorder.value)
    .sort((a, b) => a.order_index - b.order_index)
})

// Layout configuration
const HORIZONTAL_SPACING = 250
const VERTICAL_SPACING = 80
const NODE_HEIGHT = 50

/**
 * Konwertuje drzewo na węzły i krawędzie Vue Flow z poziomym layoutem
 */
function convertTreeToFlow(tree: TreeNode | null): { nodes: FlowNode[]; edges: Edge[] } {
  if (!tree) return { nodes: [], edges: [] }

  const flowNodes: FlowNode[] = []
  const flowEdges: Edge[] = []

  function calculateSubtreeHeight(node: TreeNode): number {
    if (!node.isExpanded || node.children.length === 0) {
      return NODE_HEIGHT
    }
    
    const childrenHeights = node.children.map(child => calculateSubtreeHeight(child))
    const totalHeight = childrenHeights.reduce((sum, h) => sum + h, 0) + (node.children.length - 1) * VERTICAL_SPACING
    
    return Math.max(NODE_HEIGHT, totalHeight)
  }

  function traverse(node: TreeNode, level: number = 0, yOffset: number = 0): number {
    const subtreeHeight = calculateSubtreeHeight(node)
    const nodeY = yOffset + subtreeHeight / 2 - NODE_HEIGHT / 2

    flowNodes.push({
      id: node.id,
      type: 'mindmap',
      position: { x: level * HORIZONTAL_SPACING, y: nodeY },
      data: {
        ...node,
        hasChildren: node.children.length > 0,
        childrenCount: node.children.length,
      },
    })

    if (node.isExpanded && node.children.length > 0) {
      let currentY = yOffset

      node.children.forEach((child, index) => {
        const childHeight = calculateSubtreeHeight(child)
        
        // Add edge
        flowEdges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        })

        traverse(child, level + 1, currentY)
        currentY += childHeight + VERTICAL_SPACING
      })
    }

    return subtreeHeight
  }

  traverse(tree, 0, 0)

  return { nodes: flowNodes, edges: flowEdges }
}

// Watch for tree changes
watch(
  () => [props.nodesTree, props.selectedNodeId],
  () => {
    const flow = convertTreeToFlow(props.nodesTree)
    // Update selected state based on selectedNodeId
    nodes.value = flow.nodes.map(node => ({
      ...node,
      selected: node.id === props.selectedNodeId,
    }))
    edges.value = flow.edges
  },
  { immediate: true, deep: true }
)

// Handlers
import type { NodeMouseEvent } from '@vue-flow/core'

function handleNodeClick(event: NodeMouseEvent) {
  emit('select-node', event.node.id)
}

function handlePaneClick() {
  emit('deselect-node')
}

function handleToggleExpand(nodeId: string) {
  emit('toggle-expand', nodeId)
}

// Przechowuje oryginalną pozycję węzła przed rozpoczęciem przeciągania
const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map())

function handleNodeDragStart(event: { node: FlowNode }) {
  // Zapisujemy oryginalną pozycję przed rozpoczęciem przeciągania
  dragStartPositions.value.set(event.node.id, { 
    x: event.node.position.x, 
    y: event.node.position.y 
  })
  
  // Set drag state for visual feedback (Phase 2.1)
  isDragging.value = true
  draggedNodeId.value = event.node.id
}

// Throttle drop target updates using requestAnimationFrame (Performance optimization)
let rafId: number | null = null

function handleNodeDrag(event: { node: FlowNode }) {
  // Update drop target during drag for visual feedback (Phase 2.1)
  // Throttled using requestAnimationFrame to prevent excessive calculations
  if (!isDragging.value) return
  
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  
  rafId = requestAnimationFrame(() => {
    const draggedNode = event.node
    const allFlowNodes = getNodes.value
    const targetNode = findDropTarget(draggedNode, allFlowNodes)
    
    if (targetNode && targetNode.id !== draggedNode.id) {
      dropTargetNodeId.value = targetNode.id
      
      // Check if this is a valid drop target (cached computation)
      const currentParentId = props.allNodes.find(n => n.id === draggedNode.id)?.parent_id
      const isNewParent = targetNode.id !== currentParentId
      const notDescendant = !isDescendant(draggedNode.id, targetNode.id)
      const notRoot = (draggedNode.data as TreeNode).type !== 'ROOT'
      
      // TODO: Add business logic validation for node type compatibility
      // e.g., check if target node type can accept dragged node type as child
      // Currently allows all valid structural moves
      
      isValidDropTarget.value = isNewParent && notDescendant && notRoot
    } else {
      dropTargetNodeId.value = null
      isValidDropTarget.value = false
    }
    
    rafId = null
  })
}

function handleNodeDragStop(event: { node: FlowNode }) {
  const draggedNode = event.node
  const draggedNodeData = draggedNode.data as TreeNode
  
  // Reset drag state (Phase 2.1)
  isDragging.value = false
  draggedNodeId.value = null
  dropTargetNodeId.value = null
  isValidDropTarget.value = false
  
  // Nie pozwalaj na przenoszenie węzła ROOT
  if (draggedNodeData.type === 'ROOT') {
    resetNodePosition(draggedNode.id)
    return
  }
  
  // Znajdź węzeł nad którym upuszczono
  const allFlowNodes = getNodes.value
  const targetNode = findDropTarget(draggedNode, allFlowNodes)
  
  if (targetNode && targetNode.id !== draggedNode.id) {
    const targetNodeData = targetNode.data as TreeNode
    const currentParentId = props.allNodes.find(n => n.id === draggedNode.id)?.parent_id
    
    // Sprawdź czy to nie jest upuszczenie na tego samego rodzica
    if (targetNode.id !== currentParentId) {
      // Sprawdź czy nie próbujemy przenieść węzła do jego własnego potomka
      if (!isDescendant(draggedNode.id, targetNode.id)) {
        // Emit change parent event - no longer reset position immediately
        emit('change-parent', draggedNode.id, targetNode.id)
        return // Don't reset position - let the parent handle it
      }
    }
  }
  
  // Only reset if no valid drop target
  resetNodePosition(draggedNode.id)
}

function resetNodePosition(nodeId: string) {
  const originalPos = dragStartPositions.value.get(nodeId)
  if (originalPos) {
    const nodeIndex = nodes.value.findIndex(n => n.id === nodeId)
    const existingNode = nodes.value[nodeIndex]
    if (nodeIndex >= 0 && existingNode) {
      nodes.value[nodeIndex] = {
        ...existingNode,
        id: existingNode.id,
        position: { ...originalPos }
      }
    }
    dragStartPositions.value.delete(nodeId)
  }
}

function findDropTarget(draggedNode: FlowNode, allFlowNodes: FlowNode[]): FlowNode | null {
  const draggedPos = draggedNode.position
  const THRESHOLD = 150 // Zwiększony próg z 100px do 150px dla łatwiejszego upuszczania (Phase 2.2)
  
  let closestNode: FlowNode | null = null
  let closestDistance = Infinity
  
  for (const node of allFlowNodes) {
    if (node.id === draggedNode.id) continue
    
    // Oblicz odległość między środkami węzłów
    const dx = node.position.x - draggedPos.x
    const dy = node.position.y - draggedPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < THRESHOLD && distance < closestDistance) {
      closestDistance = distance
      closestNode = node
    }
  }
  
  return closestNode
}

function isDescendant(potentialAncestorId: string, nodeId: string): boolean {
  // Sprawdza czy potentialAncestorId jest przodkiem nodeId
  // Jeśli tak, to nie możemy przenieść przodka do potomka
  const node = props.allNodes.find(n => n.id === nodeId)
  if (!node) return false
  if (node.parent_id === potentialAncestorId) return true
  if (!node.parent_id) return false
  return isDescendant(potentialAncestorId, node.parent_id)
}

function handleNodeContextMenu(event: NodeMouseEvent) {
  if (event.event instanceof MouseEvent) {
    event.event.preventDefault()
    emit('node-contextmenu', { event: event.event, nodeId: event.node.id })
  }
}

// Children panel methods
function openChildrenPanel(parentId: string) {
  selectedParentForReorder.value = parentId
  showChildrenPanel.value = true
}

function closeChildrenPanel() {
  showChildrenPanel.value = false
  selectedParentForReorder.value = null
}

function handleReorderChildren(childrenIds: string[]) {
  if (selectedParentForReorder.value) {
    emit('reorder-children', selectedParentForReorder.value, childrenIds)
  }
}

// Expose for parent
defineExpose({
  fitView,
  openChildrenPanel,
})

onMounted(() => {
  nextTick(() => {
    // Restore saved viewport state
    setViewport({
      x: nodesStore.pan.x,
      y: nodesStore.pan.y,
      zoom: nodesStore.zoom,
    })
  })
})

onUnmounted(() => {
  // Clear timeout on unmount
  if (viewportChangeTimeout) {
    clearTimeout(viewportChangeTimeout)
  }
})
</script>

<style>
/* Import Vue Flow styles */
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/minimap/dist/style.css';
</style>

<style scoped>
.mind-map-flow {
  width: 100%;
  height: 100%;
  position: relative;
}

.mind-map-flow :deep(.vue-flow) {
  background-color: #f8fafc;
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.mind-map-flow :deep(.vue-flow__edge-path) {
  stroke: #94a3b8;
  stroke-width: 2;
}

.mind-map-flow :deep(.vue-flow__controls) {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.mind-map-flow :deep(.vue-flow__controls-button) {
  background: white;
  border: none;
  width: 28px;
  height: 28px;
}

.mind-map-flow :deep(.vue-flow__controls-button:hover) {
  background: #f1f5f9;
}

.mind-map-flow :deep(.vue-flow__minimap) {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

/* Children Panel */
.children-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 100%;
  background: white;
  border-left: 1px solid #e2e8f0;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
