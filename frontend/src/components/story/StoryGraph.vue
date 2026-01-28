<template>
  <div class="story-graph">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :default-viewport="{ x: 50, y: 50, zoom: 1 }"
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

      <!-- Custom node types -->
      <template #node-storyGraphNode="nodeProps">
        <StoryGraphNode
          :data="nodeProps.data"
          :selected="nodeProps.selected"
        />
      </template>
    </VueFlow>

    <!-- Connection Modal -->
    <Transition name="fade">
      <div v-if="showConnectionModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="connection-modal-title" @click="cancelConnection">
        <div class="modal" @click.stop>
          <div class="modal__header">
            <h3 id="connection-modal-title" class="modal__title">Utwórz połączenie</h3>
            <button class="modal__close" aria-label="Zamknij dialog" @click="cancelConnection">×</button>
          </div>
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Typ połączenia</label>
              <select v-model="connectionType" class="form-input">
                <option value="leads_to">Prowadzi do</option>
                <option value="branches_to">Rozgałęzia się do</option>
                <option value="requires">Wymaga</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Etykieta (opcjonalnie)</label>
              <input
                v-model="connectionLabel"
                type="text"
                class="form-input"
                placeholder="np. 'po wyborze A', 'jeśli...'"
                @keyup.enter="confirmConnection"
              />
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

    <!-- Delete Confirmation Modal -->
    <Transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" @click="cancelDelete">
        <div class="modal modal--small" @click.stop>
          <div class="modal__header">
            <h3 id="delete-modal-title" class="modal__title">Usuń połączenie</h3>
            <button class="modal__close" aria-label="Zamknij dialog" @click="cancelDelete">×</button>
          </div>
          <div class="modal__body">
            <p>Czy na pewno chcesz usunąć to połączenie?</p>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" @click="cancelDelete">
              Anuluj
            </button>
            <button class="btn btn--danger" @click="confirmDelete">
              Usuń
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
import StoryGraphNode from './StoryGraphNode.vue'
import type { StoryElement, StoryConnection } from '@/api/story'
import dagre from 'dagre'

const props = defineProps<{
  elements: StoryElement[]
  connections: StoryConnection[]
}>()

const emit = defineEmits<{
  'select-node': [nodeId: string]
  'create-connection': [fromId: string, toId: string, label: string | null, connectionType: string]
  'delete-connection': [connectionId: string]
}>()

const { fitView } = useVueFlow()

// Flow state
const nodes = ref<FlowNode[]>([])
const edges = ref<Edge[]>([])

// Connection modal state
const showConnectionModal = ref(false)
const pendingConnection = ref<Connection | null>(null)
const connectionType = ref<'leads_to' | 'branches_to' | 'requires'>('leads_to')
const connectionLabel = ref('')

// Delete confirmation modal state
const showDeleteModal = ref(false)
const pendingDeleteEdgeId = ref<string | null>(null)

/**
 * Layout algorithm using dagre for DAG node positioning
 */
function layoutNodes(elements: StoryElement[], connections: StoryConnection[]): { nodes: FlowNode[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ 
    rankdir: 'LR',  // Left to Right
    nodesep: 100,
    ranksep: 150,
    edgesep: 50,
  })
  g.setDefaultEdgeLabel(() => ({}))

  const NODE_WIDTH = 200
  const NODE_HEIGHT = 80

  // Add nodes
  elements.forEach(element => {
    g.setNode(element.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  // Add edges
  connections.forEach(conn => {
    g.setEdge(conn.from_element_id, conn.to_element_id)
  })

  // Run layout
  dagre.layout(g)

  // Convert nodes with fallback positioning for isolated nodes
  const flowNodes: FlowNode[] = elements.map((element, index) => {
    const nodeWithPosition = g.node(element.id)
    // Fallback for isolated nodes (not connected to any other node)
    const hasPosition = nodeWithPosition && nodeWithPosition.x !== undefined && nodeWithPosition.y !== undefined
    const position = hasPosition
      ? { 
          x: nodeWithPosition.x - NODE_WIDTH / 2, 
          y: nodeWithPosition.y - NODE_HEIGHT / 2 
        }
      : {
          x: 50 + (index % 3) * 250,
          y: 50 + Math.floor(index / 3) * 120
        }
    
    return {
      id: element.id,
      type: 'storyGraphNode',
      position,
      data: {
        id: element.id,
        type: element.type,
        status: element.status,
        title: element.title,
        content: element.content,
      },
    }
  })

  // Przekonwertuj krawędzie
  const flowEdges: Edge[] = connections.map(conn => ({
    id: conn.id,
    source: conn.from_element_id,
    target: conn.to_element_id,
    type: 'smoothstep',
    animated: false,
    label: conn.label || undefined,
    style: { 
      stroke: getConnectionColor(conn.connection_type), 
      strokeWidth: 2 
    },
    labelStyle: {
      fill: '#64748b',
      fontSize: 11,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: 'white',
      fillOpacity: 0.9,
    },
  }))

  return { nodes: flowNodes, edges: flowEdges }
}

function getConnectionColor(connectionType: string): string {
  switch (connectionType) {
    case 'leads_to':
      return '#7c3aed'
    case 'branches_to':
      return '#f59e0b'
    case 'requires':
      return '#ef4444'
    default:
      return '#94a3b8'
  }
}

// Watch for data changes and update layout
watch(
  () => [props.elements, props.connections],
  () => {
    const layout = layoutNodes(props.elements, props.connections)
    nodes.value = layout.nodes
    edges.value = layout.edges
    
    // Fit view after layout update
    nextTick(() => {
      fitView({ padding: 0.2, duration: 300 })
    })
  },
  { immediate: true, deep: true }
)

// Handlers
import type { NodeMouseEvent, EdgeMouseEvent } from '@vue-flow/core'

function handleNodeClick(event: NodeMouseEvent) {
  emit('select-node', event.node.id)
}

function handleConnect(params: Connection) {
  // Pokaż modal do wprowadzenia typu i etykiety połączenia
  pendingConnection.value = params
  connectionType.value = 'leads_to'
  connectionLabel.value = ''
  showConnectionModal.value = true
}

function confirmConnection() {
  if (!pendingConnection.value) return
  
  const { source, target } = pendingConnection.value
  if (!source || !target) return

  emit(
    'create-connection',
    source,
    target,
    connectionLabel.value.trim() || null,
    connectionType.value
  )

  showConnectionModal.value = false
  pendingConnection.value = null
}

function cancelConnection() {
  showConnectionModal.value = false
  pendingConnection.value = null
}

async function handleEdgeClick(event: EdgeMouseEvent) {
  pendingDeleteEdgeId.value = event.edge.id
  showDeleteModal.value = true
}

function confirmDelete() {
  if (pendingDeleteEdgeId.value) {
    emit('delete-connection', pendingDeleteEdgeId.value)
  }
  showDeleteModal.value = false
  pendingDeleteEdgeId.value = null
}

function cancelDelete() {
  showDeleteModal.value = false
  pendingDeleteEdgeId.value = null
}

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
  background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px);
  background-size: 20px 20px;
}

.story-graph :deep(.vue-flow__edge-path) {
  stroke-width: 2;
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

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
  transition: border-color 0.2s;
}

.form-input:focus {
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

.btn--danger {
  background: #ef4444;
  color: white;
}

.btn--danger:hover {
  background: #dc2626;
}

.modal--small {
  max-width: 400px;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
