import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nodesApi, type Node, type CreateNodeDto, type UpdateNodeDto, type MoveNodeDto, type ReorderChildrenDto } from '@/api/nodes'
import { viewStateApi, type SaveViewStateDto } from '@/api/view-state'

export interface TreeNode extends Node {
  children: TreeNode[]
  isExpanded: boolean
}

// Debounce helper
let saveStateTimeout: ReturnType<typeof setTimeout> | null = null
const SAVE_DEBOUNCE_MS = 1000

export const useNodesStore = defineStore('nodes', () => {
  // State
  const nodes = ref<Node[]>([])
  const selectedNodeId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const expandedNodeIds = ref<Set<string>>(new Set())
  
  // View state
  const currentProjectId = ref<string | null>(null)
  const zoom = ref(1.0)
  const pan = ref({ x: 50, y: 50 })
  const viewType = ref('mindmap')

  // Getters
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return nodes.value.find((n) => n.id === selectedNodeId.value) || null
  })

  const rootNode = computed(() => {
    return nodes.value.find((n) => n.type === 'ROOT') || null
  })

  /**
   * Transformacja płaskiej listy na drzewo (T-087)
   */
  const nodesTree = computed((): TreeNode | null => {
    if (nodes.value.length === 0) return null

    // Znajdź ROOT
    const root = nodes.value.find((n) => n.type === 'ROOT')
    if (!root) return null

    // Funkcja rekurencyjna do budowania drzewa
    const buildTree = (parentId: string): TreeNode[] => {
      return nodes.value
        .filter((n) => n.parent_id === parentId)
        .sort((a, b) => a.order_index - b.order_index)
        .map((node) => ({
          ...node,
          children: buildTree(node.id),
          isExpanded: expandedNodeIds.value.has(node.id),
        }))
    }

    return {
      ...root,
      children: buildTree(root.id),
      isExpanded: true, // ROOT jest zawsze rozwinięty
    }
  })

  // Actions
  const fetchNodes = async (projectId: string) => {
    isLoading.value = true
    error.value = null
    currentProjectId.value = projectId
    try {
      // Fetch nodes
      nodes.value = await nodesApi.getByProject(projectId)
      
      // Load saved view state
      try {
        const savedState = await viewStateApi.get(projectId)
        if (savedState) {
          zoom.value = savedState.zoom
          pan.value = { x: savedState.pan_x, y: savedState.pan_y }
          viewType.value = savedState.view_type
          expandedNodeIds.value = new Set(savedState.expanded_nodes)
        } else {
          // Default: expand ROOT and first level
          const root = nodes.value.find((n) => n.type === 'ROOT')
          if (root) {
            expandedNodeIds.value.add(root.id)
          }
        }
      } catch (e) {
        // If view state doesn't exist, use defaults
        const root = nodes.value.find((n) => n.type === 'ROOT')
        if (root) {
          expandedNodeIds.value.add(root.id)
        }
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas pobierania węzłów'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const createNode = async (dto: CreateNodeDto) => {
    isLoading.value = true
    error.value = null
    try {
      const newNode = await nodesApi.create(dto)
      nodes.value.push(newNode)
      
      // Rozwiń rodzica
      if (dto.parentId) {
        expandedNodeIds.value.add(dto.parentId)
      }
      
      return newNode
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas tworzenia węzła'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const updateNode = async (nodeId: string, dto: UpdateNodeDto) => {
    isLoading.value = true
    error.value = null
    try {
      const updatedNode = await nodesApi.update(nodeId, dto)
      const index = nodes.value.findIndex((n) => n.id === nodeId)
      if (index !== -1) {
        nodes.value[index] = updatedNode
      }
      return updatedNode
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas aktualizacji węzła'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const deleteNode = async (nodeId: string) => {
    isLoading.value = true
    error.value = null
    try {
      await nodesApi.delete(nodeId)
      
      // Usuń węzeł i wszystkie jego dzieci rekurencyjnie
      const idsToRemove = new Set<string>()
      const collectIds = (id: string) => {
        idsToRemove.add(id)
        nodes.value
          .filter((n) => n.parent_id === id)
          .forEach((child) => collectIds(child.id))
      }
      collectIds(nodeId)
      
      nodes.value = nodes.value.filter((n) => !idsToRemove.has(n.id))
      
      // Jeśli usunięty węzeł był wybrany, odznacz
      if (selectedNodeId.value && idsToRemove.has(selectedNodeId.value)) {
        selectedNodeId.value = null
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas usuwania węzła'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const moveNode = async (nodeId: string, dto: MoveNodeDto) => {
    // Store original state for rollback
    const originalNodes = [...nodes.value]
    
    // Optimistic update - update local state immediately
    const nodeIndex = nodes.value.findIndex((n) => n.id === nodeId)
    if (nodeIndex !== -1) {
      const node = nodes.value[nodeIndex]
      if (node) {
        node.parent_id = dto.newParentId
        node.order_index = dto.newOrderIndex
      }
    }
    
    // Expand new parent to show moved node
    if (dto.newParentId && !expandedNodeIds.value.has(dto.newParentId)) {
      expandedNodeIds.value.add(dto.newParentId)
    }
    
    try {
      // Make API call in background
      const movedNode = await nodesApi.move(nodeId, dto)
      
      // Update with server response
      const index = nodes.value.findIndex((n) => n.id === nodeId)
      if (index !== -1) {
        const node = nodes.value[index]
        if (node) {
          node.parent_id = movedNode.parent_id
          node.order_index = movedNode.order_index
        }
      }
      
      return movedNode
    } catch (e: unknown) {
      // Rollback on error
      nodes.value = originalNodes
      error.value = e instanceof Error ? e.message : 'Błąd podczas przenoszenia węzła'
      throw e
    }
  }

  const reorderChildren = async (parentId: string, childrenIds: string[]) => {
    isLoading.value = true
    error.value = null
    try {
      const updatedNodes = await nodesApi.reorderChildren(parentId, { childrenIds })
      
      // Aktualizuj order_index dla wszystkich dzieci
      updatedNodes.forEach((updatedNode) => {
        const index = nodes.value.findIndex((n) => n.id === updatedNode.id)
        if (index !== -1) {
          const node = nodes.value[index]
          if (node) {
            node.order_index = updatedNode.order_index
          }
        }
      })
      
      return updatedNodes
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas zmiany kolejności'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const addAssignee = async (nodeId: string, userId: string) => {
    try {
      const updatedNode = await nodesApi.addAssignee(nodeId, userId)
      const index = nodes.value.findIndex((n) => n.id === nodeId)
      if (index !== -1) {
        nodes.value[index] = updatedNode
      }
      return updatedNode
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas dodawania przypisania'
      throw e
    }
  }

  const removeAssignee = async (nodeId: string, userId: string) => {
    try {
      await nodesApi.removeAssignee(nodeId, userId)
      const node = nodes.value.find((n) => n.id === nodeId)
      if (node) {
        node.assignees = node.assignees.filter((a) => a.user.id !== userId)
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas usuwania przypisania'
      throw e
    }
  }

  const selectNode = (nodeId: string | null) => {
    selectedNodeId.value = nodeId
  }

  const toggleExpand = (nodeId: string) => {
    if (expandedNodeIds.value.has(nodeId)) {
      expandedNodeIds.value.delete(nodeId)
    } else {
      expandedNodeIds.value.add(nodeId)
    }
    // Auto-save view state
    saveViewStateDebounced()
  }

  const expandAll = () => {
    nodes.value.forEach((n) => expandedNodeIds.value.add(n.id))
    saveViewStateDebounced()
  }

  const collapseAll = () => {
    expandedNodeIds.value.clear()
    // Zawsze zachowaj ROOT rozwinięty
    const root = nodes.value.find((n) => n.type === 'ROOT')
    if (root) {
      expandedNodeIds.value.add(root.id)
    }
    saveViewStateDebounced()
  }

  const isExpanded = (nodeId: string) => {
    return expandedNodeIds.value.has(nodeId)
  }

  /**
   * Save view state with debouncing
   */
  const saveViewStateDebounced = () => {
    if (!currentProjectId.value) return
    
    if (saveStateTimeout) {
      clearTimeout(saveStateTimeout)
    }
    
    saveStateTimeout = setTimeout(() => {
      saveViewState()
    }, SAVE_DEBOUNCE_MS)
  }

  /**
   * Save view state immediately
   */
  const saveViewState = async () => {
    if (!currentProjectId.value) return
    
    try {
      const dto: SaveViewStateDto = {
        projectId: currentProjectId.value,
        viewType: viewType.value,
        zoom: zoom.value,
        panX: pan.value.x,
        panY: pan.value.y,
        expandedNodes: Array.from(expandedNodeIds.value),
      }
      await viewStateApi.save(dto)
    } catch (e) {
      console.error('Failed to save view state:', e)
      // Don't show error to user - it's a background operation
    }
  }

  /**
   * Update zoom level
   */
  const setZoom = (newZoom: number) => {
    zoom.value = newZoom
    saveViewStateDebounced()
  }

  /**
   * Update pan position
   */
  const setPan = (newPan: { x: number; y: number }) => {
    pan.value = newPan
    saveViewStateDebounced()
  }

  /**
   * Set view type
   */
  const setViewType = (type: string) => {
    viewType.value = type
    saveViewState() // Save immediately
  }

  const reset = () => {
    nodes.value = []
    selectedNodeId.value = null
    expandedNodeIds.value.clear()
    error.value = null
    currentProjectId.value = null
    zoom.value = 1.0
    pan.value = { x: 50, y: 50 }
    viewType.value = 'mindmap'
  }

  return {
    // State
    nodes,
    selectedNodeId,
    isLoading,
    error,
    expandedNodeIds,
    zoom,
    pan,
    viewType,
    
    // Getters
    selectedNode,
    rootNode,
    nodesTree,
    
    // Actions
    fetchNodes,
    createNode,
    updateNode,
    deleteNode,
    moveNode,
    reorderChildren,
    addAssignee,
    removeAssignee,
    selectNode,
    toggleExpand,
    expandAll,
    collapseAll,
    isExpanded,
    setZoom,
    setPan,
    setViewType,
    saveViewState,
    reset,
  }
})
