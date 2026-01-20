<template>
  <div class="mind-map-view">
      <!-- Header -->
      <header class="mind-map-view__header">
        <div class="mind-map-view__header-left">
          <router-link :to="{ name: 'dashboard' }" class="mind-map-view__back">
            ← Powrót
          </router-link>
          <h1 v-if="rootNode">{{ rootNode.title }}</h1>
          <h1 v-else>Mapa myśli</h1>
        </div>
        <div class="mind-map-view__header-actions">
          <button class="btn btn--secondary" @click="handleExpandAll">
            Rozwiń wszystko
          </button>
          <button class="btn btn--secondary" @click="handleCollapseAll">
            Zwiń wszystko
          </button>
          <button class="btn btn--primary" @click="handleAddNode">
            + Dodaj węzeł
          </button>
          <router-link 
            v-if="isOwner" 
            :to="{ name: 'project-settings', params: { id: projectId } }" 
            class="btn btn--icon"
            title="Ustawienia projektu"
          >
            ⚙️
          </router-link>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="isLoading" class="mind-map-view__loading">
        <LoadingSpinner text="Ładowanie mapy..." />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="mind-map-view__error">
        {{ error }}
        <button @click="loadNodes">Spróbuj ponownie</button>
      </div>

      <!-- Mind Map Canvas -->
      <div v-else class="mind-map-view__content">
        <MindMapFlow
          ref="mindMapRef"
          :nodes-tree="nodesTree"
          :selected-node-id="selectedNodeId"
          :all-nodes="allNodes"
          @select-node="handleSelectNode"
          @deselect-node="handleDeselectNode"
          @toggle-expand="handleToggleNode"
          @node-contextmenu="openContextMenu"
          @reorder-children="handleReorderChildren"
          @change-parent="handleChangeParent"
        />
        <div v-if="!nodesTree" class="mind-map-view__empty">
          Brak węzłów. Utwórz pierwszy węzeł klikając "Dodaj węzeł".
        </div>

        <!-- Sidebar z szczegółami -->
        <aside v-if="selectedNode" class="mind-map-view__sidebar">
          <div class="sidebar">
            <div class="sidebar__header">
              <h3>Szczegóły węzła</h3>
              <button class="sidebar__close" @click="handleDeselectNode">×</button>
            </div>

            <div class="sidebar__content">
              <!-- Type badge -->
              <div class="sidebar__type">
                <span :class="`type-badge type-badge--${selectedNode.type.toLowerCase()}`">
                  {{ selectedNode.type }}
                </span>
              </div>

              <!-- Title -->
              <div class="sidebar__field">
                <label>Tytuł</label>
                <input
                  v-model="editTitle"
                  type="text"
                  @blur="handleUpdateTitle"
                  @keyup.enter="handleUpdateTitle"
                />
              </div>

              <!-- Description -->
              <div class="sidebar__field">
                <label>Opis</label>
                <textarea
                  v-model="editDescription"
                  rows="4"
                  placeholder="Dodaj opis..."
                  @blur="handleUpdateDescription"
                ></textarea>
              </div>

              <!-- Status -->
              <div class="sidebar__field">
                <label>Status</label>
                <select v-model="editStatus" @change="handleUpdateStatus">
                  <option value="TODO">Do zrobienia</option>
                  <option value="IN_PROGRESS">W trakcie</option>
                  <option value="DONE">Gotowe</option>
                </select>
              </div>

              <!-- Assignees -->
              <div class="sidebar__field">
                <label>Przypisani ({{ selectedNode.assignees.length }})</label>
                <div class="sidebar__assignees">
                  <div
                    v-for="assignee in selectedNode.assignees"
                    :key="assignee.user.id"
                    class="sidebar__assignee"
                  >
                    <div class="sidebar__assignee-avatar">
                      <img
                        v-if="assignee.user.avatar_url"
                        :src="getAvatarUrl(assignee.user.avatar_url) ?? undefined"
                        :alt="assignee.user.username"
                      />
                      <span v-else>{{ assignee.user.username.charAt(0).toUpperCase() }}</span>
                    </div>
                    <span class="sidebar__assignee-name">{{ assignee.user.username }}</span>
                    <button
                      class="sidebar__assignee-remove"
                      @click="handleRemoveAssignee(assignee.user.id)"
                    >
                      ×
                    </button>
                  </div>
                  <div v-if="selectedNode.assignees.length === 0" class="sidebar__no-assignees">
                    Brak przypisanych osób
                  </div>
                </div>
                
                <!-- Add assignee dropdown (T-098) -->
                <div v-if="availableAssignees.length > 0" class="sidebar__add-assignee">
                  <select v-model="selectedAssigneeId" class="sidebar__assignee-select">
                    <option value="">+ Dodaj osobę...</option>
                    <option 
                      v-for="member in availableAssignees" 
                      :key="member.user_id" 
                      :value="member.user_id"
                    >
                      {{ member.user.username }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Add child button (T-099) -->
              <div class="sidebar__field">
                <button class="btn btn--secondary btn--full" @click="handleAddChildNode">
                  + Dodaj dziecko
                </button>
              </div>

              <!-- Reorder children button -->
              <div v-if="selectedNodeHasChildren" class="sidebar__field">
                <button class="btn btn--secondary btn--full" @click="openChildrenPanel">
                  ⇅ Sortuj zadania
                </button>
              </div>

              <!-- Actions -->
              <div class="sidebar__actions">
                <button
                  v-if="selectedNode.type !== 'ROOT'"
                  class="btn btn--danger"
                  @click="handleDeleteNode"
                >
                  Usuń węzeł
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Add Node Modal -->
      <div v-if="showAddNodeModal" class="modal-overlay" @click.self="showAddNodeModal = false">
        <div class="modal">
          <div class="modal__header">
            <h3>Dodaj nowy węzeł</h3>
            <button class="modal__close" @click="showAddNodeModal = false">×</button>
          </div>
          <form @submit.prevent="handleCreateNode">
            <div class="modal__field">
              <label>Tytuł *</label>
              <input v-model="newNodeTitle" type="text" required />
            </div>
            <div class="modal__field">
              <label>Typ</label>
              <select v-model="newNodeType">
                <option value="TASK">Zadanie</option>
                <option value="MILESTONE">Kamień milowy</option>
              </select>
            </div>
            <div class="modal__field">
              <label>Rodzic</label>
              <select v-model="newNodeParentId">
                <option v-for="node in selectableParents" :key="node.id" :value="node.id">
                  {{ node.title }}
                </option>
              </select>
            </div>
            <div class="modal__actions">
              <button type="button" class="btn btn--secondary" @click="showAddNodeModal = false">
                Anuluj
              </button>
              <button type="submit" class="btn btn--primary">Utwórz</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Context Menu -->
      <div 
        v-if="contextMenu.show" 
        class="context-menu" 
        :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
        @click.stop
      >
        <div class="context-menu__item" @click="handleAddChildNode(); closeContextMenu()">
          Dodaj dziecko
        </div>
        <div class="context-menu__item context-menu__item--danger" @click="handleDeleteNode(); closeContextMenu()">
          Usuń węzeł
        </div>
      </div>

      <!-- Helper overlay to close context menu on click outside -->
      <div 
        v-if="contextMenu.show" 
        class="context-menu-overlay" 
        @click="closeContextMenu"
        @contextmenu.prevent="closeContextMenu"
      ></div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { onKeyStroke } from '@vueuse/core'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { MindMapFlow } from '@/components/mindmap'
import { useNodesStore } from '@/stores/nodes'
import { useAuthStore } from '@/stores/auth'
import { projectsApi, type ProjectMember, type Project } from '@/api/projects'
import type { NodeType, NodeStatus } from '@/api/nodes'

const route = useRoute()
const nodesStore = useNodesStore()
const authStore = useAuthStore()
const toast = useToast()

// Refs
const mindMapRef = ref<InstanceType<typeof MindMapFlow> | null>(null)

// Project info
const currentProject = ref<Project | null>(null)
const projectId = computed(() => route.params.id as string)
const isOwner = computed(() => currentProject.value?.owner_id === authStore.user?.id)

// Project members for assignee dropdown
const projectMembers = ref<ProjectMember[]>([])
const selectedAssigneeId = ref('')

// State from store
const isLoading = computed(() => nodesStore.isLoading)
const error = computed(() => nodesStore.error)
const nodesTree = computed(() => nodesStore.nodesTree)
const selectedNodeId = computed(() => nodesStore.selectedNodeId)
const selectedNode = computed(() => nodesStore.selectedNode)
const rootNode = computed(() => nodesStore.rootNode)
const allNodes = computed(() => nodesStore.nodes)

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) return null
  return `${apiUrl}/${avatarPath}`
}

// Edit state
const editTitle = ref('')
const editDescription = ref('')
const editStatus = ref<NodeStatus>('TODO')

// Add node modal state
const showAddNodeModal = ref(false)
const newNodeTitle = ref('')
const newNodeType = ref<NodeType>('TASK')
const newNodeParentId = ref<string>('')

// Shortcuts
onKeyStroke('Escape', (e) => {
  if (selectedNode.value) handleDeselectNode()
  showAddNodeModal.value = false
})

onKeyStroke(['Delete', 'Backspace'], (e) => {
  const target = e.target as HTMLElement
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

  if (selectedNode.value && selectedNode.value.type !== 'ROOT') {
    handleDeleteNode()
  }
})

// Selectable parents for new node
const selectableParents = computed(() => {
  return nodesStore.nodes // Allow all nodes to be parents including milestones
})

// Available assignees (members not already assigned to selected node)
const availableAssignees = computed(() => {
  if (!selectedNode.value) return []
  const assignedIds = new Set(selectedNode.value.assignees.map(a => a.user.id))
  return projectMembers.value.filter(m => !assignedIds.has(m.user_id))
})

// Check if selected node has children for reorder button
const selectedNodeHasChildren = computed(() => {
  if (!selectedNode.value) return false
  return allNodes.value.some(n => n.parent_id === selectedNode.value!.id)
})

// Context Menu state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  nodeId: ''
})

const openContextMenu = (payload: { event: MouseEvent, nodeId: string }) => {
  contextMenu.value = {
    show: true,
    x: payload.event.clientX,
    y: payload.event.clientY,
    nodeId: payload.nodeId
  }
  // Select node as well when right clicking
  handleSelectNode(payload.nodeId)
}

const closeContextMenu = () => {
  contextMenu.value.show = false
}

// Watch selected node to update edit fields
watch(selectedNode, (node) => {
  if (node) {
    editTitle.value = node.title
    editDescription.value = node.description || ''
    editStatus.value = node.status
  }
  // Reset assignee select
  selectedAssigneeId.value = ''
  // Close context menu if selection changes via other means
  closeContextMenu()
})

// Watch assignee selection to add assignee
watch(selectedAssigneeId, async (userId) => {
  if (userId && selectedNode.value) {
    await nodesStore.addAssignee(selectedNode.value.id, userId)
    selectedAssigneeId.value = ''
  }
})

// Load nodes on mount
const loadNodes = async () => {
  const id = route.params.id as string
  await nodesStore.fetchNodes(id)
  
  // Fetch project info for owner check
  currentProject.value = await projectsApi.getById(id)
  
  // Fetch project members for assignee dropdown
  projectMembers.value = await projectsApi.getMembers(id)
  
  // Set default parent for new nodes
  if (nodesStore.rootNode) {
    newNodeParentId.value = nodesStore.rootNode.id
  }
}

onMounted(loadNodes)

// Handlers
const handleSelectNode = (nodeId: string) => {
  nodesStore.selectNode(nodeId)
}

const handleDeselectNode = () => {
  nodesStore.selectNode(null)
}

const handleToggleNode = (nodeId: string) => {
  nodesStore.toggleExpand(nodeId)
}

const handleExpandAll = () => {
  nodesStore.expandAll()
}

const handleCollapseAll = () => {
  nodesStore.collapseAll()
}

const handleAddNode = () => {
  showAddNodeModal.value = true
  newNodeTitle.value = ''
  newNodeType.value = 'TASK'
  if (selectedNode.value) {
    newNodeParentId.value = selectedNode.value.id
  } else if (rootNode.value) {
    newNodeParentId.value = rootNode.value.id
  }
}

const handleCreateNode = async () => {
  if (!newNodeTitle.value.trim()) return
  
  const projectId = route.params.id as string
  try {
    await nodesStore.createNode({
      projectId,
      parentId: newNodeParentId.value || undefined,
      title: newNodeTitle.value.trim(),
      type: newNodeType.value,
    })
    
    showAddNodeModal.value = false
    toast.success('Węzeł utworzony')
  } catch (e) {
    console.error('Failed to create node:', e)
    toast.error('Błąd podczas tworzenia węzła')
  }
}

const handleUpdateTitle = async () => {
  if (!selectedNode.value || editTitle.value === selectedNode.value.title) return
  try {
      await nodesStore.updateNode(selectedNode.value.id, { title: editTitle.value })
  } catch(e) { toast.error('Błąd aktualizacji tytułu') }
}

const handleUpdateDescription = async () => {
  if (!selectedNode.value || editDescription.value === (selectedNode.value.description || '')) return
  try {
     await nodesStore.updateNode(selectedNode.value.id, { description: editDescription.value })
  } catch(e) { toast.error('Błąd aktualizacji opisu') }
}

const handleUpdateStatus = async () => {
  if (!selectedNode.value || editStatus.value === selectedNode.value.status) return
  try {
      await nodesStore.updateNode(selectedNode.value.id, { status: editStatus.value })
  } catch(e) { toast.error('Błąd aktualizacji statusu') }
}

const handleRemoveAssignee = async (userId: string) => {
  if (!selectedNode.value) return
  try {
      await nodesStore.removeAssignee(selectedNode.value.id, userId)
  } catch(e) { toast.error('Błąd usuwania przypisania') }
}

// T-099: Add child node from sidebar
const handleAddChildNode = () => {
  if (!selectedNode.value) return
  showAddNodeModal.value = true
  newNodeTitle.value = ''
  newNodeType.value = 'TASK'
  newNodeParentId.value = selectedNode.value.id
}

const handleDeleteNode = async () => {
  if (!selectedNode.value) return
  if (!confirm('Czy na pewno chcesz usunąć ten węzeł? Wszystkie dzieci zostaną również usunięte.')) return
  
  try {
      await nodesStore.deleteNode(selectedNode.value.id)
      toast.success('Węzeł usunięty')
  } catch (e) {
      toast.error('Błąd podczas usuwania węzła')
  }
}

// T-102, T-103: Handle node move (drag & drop)
const handleMoveNode = async (nodeId: string, newParentId: string, newIndex: number) => {
  try {
    await nodesStore.moveNode(nodeId, {
      newParentId,
      newOrderIndex: newIndex,
    })

    // Rozwiń nowego rodzica aby pokazać przeniesiony węzeł
    if (!nodesStore.isExpanded(newParentId)) {
      nodesStore.toggleExpand(newParentId)
    }
  } catch(e) {
      toast.error('Błąd podczas przenoszenia węzła')
      console.error('Failed to move node:', e)
  }
}

// Handle parent change from drag & drop
const handleChangeParent = async (nodeId: string, newParentId: string) => {
  try {
    // Pobierz obecne dzieci nowego rodzica aby obliczyć indeks
    const siblingCount = allNodes.value.filter(n => n.parent_id === newParentId).length
    
    await nodesStore.moveNode(nodeId, {
      newParentId,
      newOrderIndex: siblingCount, // Dodaj na końcu listy dzieci
    })

    // Rozwiń nowego rodzica aby pokazać przeniesiony węzeł
    if (!nodesStore.isExpanded(newParentId)) {
      nodesStore.toggleExpand(newParentId)
    }
    
    toast.success('Węzeł przeniesiony')
  } catch(e) {
      toast.error('Błąd podczas przenoszenia węzła')
      console.error('Failed to change parent:', e)
  }
}

// Reorder children handler
const handleReorderChildren = async (parentId: string, childrenIds: string[]) => {
  try {
    await nodesStore.reorderChildren(parentId, childrenIds)
    // Nie pokazujemy toast - UI i tak się aktualizuje natychmiast
  } catch (e) {
    toast.error('Błąd podczas zmiany kolejności')
    console.error('Failed to reorder children:', e)
  }
}

// Open children panel in MindMapFlow component
const openChildrenPanel = () => {
  if (selectedNode.value && mindMapRef.value) {
    mindMapRef.value.openChildrenPanel(selectedNode.value.id)
  }
}
</script>

<style scoped>
.mind-map-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.mind-map-view__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.mind-map-view__header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.mind-map-view__back {
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
}

.mind-map-view__back:hover {
  color: #334155;
}

.mind-map-view__header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.mind-map-view__header-actions {
  display: flex;
  gap: 8px;
}

.mind-map-view__content {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

.mind-map-view__loading,
.mind-map-view__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 16px;
  color: #64748b;
}

.mind-map-view__empty {
  padding: 40px;
  color: #94a3b8;
  text-align: center;
}

/* Sidebar */
.mind-map-view__sidebar {
  width: 350px; /* Slightly wider */
  flex-shrink: 0;
  background: white;
  border-left: 1px solid #e2e8f0;
  overflow-y: auto;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.05);
  z-index: 50;
}

.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .mind-map-view__sidebar {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 350px;
    border-left: 1px solid var(--color-border); 
  }
}

.sidebar__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background-color: #fafafa;
}

.sidebar__header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.sidebar__close {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: white;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.sidebar__close:hover {
  background: #f1f5f9;
  color: #ef4444;
  border-color: #ef4444;
}

.sidebar__content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar__type {
  margin-bottom: 8px;
}

.type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge--root {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.type-badge--task {
  background: #e2e8f0;
  color: #475569;
}

.type-badge--milestone {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.sidebar__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar__field label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.sidebar__field input,
.sidebar__field textarea,
.sidebar__field select {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  background-color: #f8fafc;
}

.sidebar__field input:focus,
.sidebar__field textarea:focus,
.sidebar__field select:focus {
  outline: none;
  border-color: #3b82f6;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sidebar__field textarea {
  resize: vertical;
  min-height: 80px;
}

/* Context Menu */
.context-menu {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
  padding: 6px;
  animation: fadeIn 0.1s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.context-menu__item {
  padding: 10px 12px;
  font-size: 14px;
  color: #334155;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.context-menu__item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.context-menu__item--danger {
  color: #ef4444;
}

.context-menu__item--danger:hover {
  background: #fef2f2;
}

.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.sidebar__assignees {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar__assignee {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 6px;
}

.sidebar__assignee-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
}

.sidebar__assignee-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar__assignee-name {
  flex: 1;
  font-size: 14px;
}

.sidebar__assignee-remove {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 18px;
}

.sidebar__no-assignees {
  color: #94a3b8;
  font-size: 13px;
}

.sidebar__add-assignee {
  margin-top: 8px;
}

.sidebar__assignee-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  background: #f8fafc;
  cursor: pointer;
}

.sidebar__assignee-select:hover {
  border-color: #94a3b8;
}

.sidebar__actions {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn--full {
  width: 100%;
}

.btn--primary {
  background: #3b82f6;
  color: white;
}

.btn--primary:hover {
  background: #2563eb;
}

.btn--secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn--secondary:hover {
  background: #e2e8f0;
}

.btn--danger {
  background: #ef4444;
  color: white;
  width: 100%;
}

.btn--danger:hover {
  background: #dc2626;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.modal__header h3 {
  margin: 0;
  font-size: 18px;
}

.modal__close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #94a3b8;
}

.modal__field {
  padding: 0 20px;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.modal__field label {
  font-size: 14px;
  font-weight: 500;
}

.modal__field input,
.modal__field select {
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  margin-top: 8px;
}

.btn--icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 18px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn--icon:hover {
  background: #e2e8f0;
}
</style>
