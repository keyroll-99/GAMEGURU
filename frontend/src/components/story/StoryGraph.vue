<template>
  <div class="story-graph">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :default-viewport="{ x: 50, y: 50, zoom: 0.8 }"
      :min-zoom="0.25"
      :max-zoom="2"
      :fit-view-on-init="true"
      :nodes-draggable="false"
      :nodes-connectable="true"
      :edges-updatable="false"
      @node-click="handleNodeClick"
      @connect="handleConnect"
      @edge-click="handleEdgeClick"
    >
      <Background pattern-color="#e2e8f0" :gap="20" />
      <Controls position="top-right" />
      <MiniMap position="bottom-right" />

      <!-- Custom node type -->
      <template #node-storyGraphNode="nodeProps">
        <StoryGraphNode
          :data="nodeProps.data"
          :selected="nodeProps.selected"
        />
      </template>
    </VueFlow>

    <!-- Connection Modal -->
    <Transition name="modal">
      <div v-if="showConnectionModal" class="modal-overlay" @click="cancelConnection">
        <div class="modal" @click.stop>
          <div class="modal__header">
            <h3 class="modal__title">Nowe połączenie</h3>
            <button class="modal__close" @click="cancelConnection">×</button>
          </div>
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Etykieta (opcjonalnie)</label>
              <input
                v-model="connectionLabel"
                type="text"
                class="form-input"
                placeholder="np. 'następnie', 'jeśli wybór A'..."
                @keyup.enter="confirmConnection"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Typ połączenia</label>
              <select v-model="connectionType" class="form-select">
                <option value="leads_to">Prowadzi do</option>
                <option value="branches_to">Rozgałęzienie do</option>
                <option value="requires">Wymaga</option>
              </select>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" @click="cancelConnection">
              Anuluj
            </button>
            <button class="btn btn--primary" @click="confirmConnection">
              Utwórz
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node as FlowNode, Edge, Connection } from '@vue-flow/core'
import type { NodeMouseEvent, EdgeMouseEvent } from '@vue-flow/core'
import StoryGraphNode from './StoryGraphNode.vue'
import type { StoryElement, StoryConnection } from '@/api/story'
import dagre from 'dagre'

const props = defineProps<{
  elements: StoryElement[]
  connections: StoryConnection[]
}>()

const emit = defineEmits<{
  'select-element': [elementId: string]
  'create-connection': [fromId: string, toId: string, label: string, connectionType: string]
  'delete-connection': [connectionId: string]
}>()

const { fitView } = useVueFlow()

// Flow state
const nodes = ref<FlowNode[]>([])
const edges = ref<Edge[]>([])

// Connection modal state
const showConnectionModal = ref(false)
const pendingConnection = ref<Connection | null>(null)
const connectionLabel = ref('')
const connectionType = ref<'leads_to' | 'branches_to' | 'requires'>('leads_to')

// Layout configuration
const NODE_WIDTH = 180
const NODE_HEIGHT = 80

/**
 * Układa węzły przy użyciu algorytmu Dagre
 */
function layoutNodes(elements: StoryElement[], connections: StoryConnection[]): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ 
    rankdir: 'LR', // Left to Right
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50,
  })
  g.setDefaultEdgeLabel(() => ({}))

  // Dodaj węzły
  elements.forEach((element) => {
    g.setNode(element.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  // Dodaj krawędzie
  connections.forEach((conn) => {
    g.setEdge(conn.from_element_id, conn.to_element_id)
  })

  // Wykonaj layout
  dagre.layout(g)

  // Pobierz pozycje
  const positions = new Map<string, { x: number; y: number }>()
  elements.forEach((element) => {
    const node = g.node(element.id)
    if (node) {
      positions.set(element.id, {
        x: node.x - NODE_WIDTH / 2,
        y: node.y - NODE_HEIGHT / 2,
      })
    }
  })

  return positions
}

/**
 * Konwertuje elementy i połączenia na węzły i krawędzie Vue Flow
 */
function convertToFlow() {
  if (props.elements.length === 0) {
    nodes.value = []
    edges.value = []
    return
  }

  // Layout
  const positions = layoutNodes(props.elements, props.connections)

  // Konwertuj elementy na węzły
  const flowNodes: FlowNode[] = props.elements.map((element) => {
    const pos = positions.get(element.id) || { x: 0, y: 0 }
    return {
      id: element.id,
      type: 'storyGraphNode',
      position: pos,
      data: {
        id: element.id,
        type: element.type,
        status: element.status,
        title: element.title,
        content: element.content,
      },
    }
  })

  // Konwertuj połączenia na krawędzie
  const flowEdges: Edge[] = props.connections.map((conn) => {
    return {
      id: conn.id,
      source: conn.from_element_id,
      target: conn.to_element_id,
      label: conn.label || undefined,
      type: 'smoothstep',
      animated: conn.connection_type === 'leads_to',
      style: getEdgeStyle(conn.connection_type),
      labelStyle: { fontSize: 11, fill: '#64748b' },
      labelBgStyle: { fill: 'white' },
    }
  })

  nodes.value = flowNodes
  edges.value = flowEdges
}

function getEdgeStyle(connectionType: string) {
  const styles: Record<string, any> = {
    leads_to: { stroke: '#3b82f6', strokeWidth: 2 },
    branches_to: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
    requires: { stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '2,2' },
  }
  return styles[connectionType] || { stroke: '#94a3b8', strokeWidth: 2 }
}

// Watch for data changes
watch(
  () => [props.elements, props.connections],
  () => {
    convertToFlow()
  },
  { immediate: true, deep: true }
)

// Handlers
function handleNodeClick(event: NodeMouseEvent) {
  emit('select-element', event.node.id)
}

function handleConnect(connection: Connection) {
  pendingConnection.value = connection
  connectionLabel.value = ''
  connectionType.value = 'leads_to'
  showConnectionModal.value = true
}

function confirmConnection() {
  if (pendingConnection.value) {
    emit(
      'create-connection',
      pendingConnection.value.source,
      pendingConnection.value.target,
      connectionLabel.value,
      connectionType.value
    )
  }
  showConnectionModal.value = false
  pendingConnection.value = null
}

function cancelConnection() {
  showConnectionModal.value = false
  pendingConnection.value = null
}

function handleEdgeClick(event: EdgeMouseEvent) {
  const confirmed = confirm('Czy na pewno chcesz usunąć to połączenie?')
  if (confirmed) {
    emit('delete-connection', event.edge.id)
  }
}

// Expose for parent
defineExpose({
  fitView: () => {
    nextTick(() => {
      fitView({ padding: 0.2 })
    })
  },
})

onMounted(() => {
  nextTick(() => {
    fitView({ padding: 0.2 })
  })
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
.story-graph {
  width: 100%;
  height: 100%;
  position: relative;
}

.story-graph :deep(.vue-flow) {
  background-color: #f8fafc;
}

.story-graph :deep(.vue-flow__controls) {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.story-graph :deep(.vue-flow__controls-button) {
  background: white;
  border: none;
  width: 28px;
  height: 28px;
}

.story-graph :deep(.vue-flow__controls-button:hover) {
  background: #f1f5f9;
}

.story-graph :deep(.vue-flow__minimap) {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 450px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal__header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal__title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.modal__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 24px;
  color: #64748b;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal__close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal__body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.modal__footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #7c3aed;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn--primary {
  background: #7c3aed;
  color: white;
}

.btn--primary:hover {
  background: #6d28d9;
}

.btn--secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn--secondary:hover {
  background: #f8fafc;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
