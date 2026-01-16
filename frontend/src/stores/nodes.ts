import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nodesApi, type Node, type CreateNodeDto, type UpdateNodeDto, type MoveNodeDto } from '@/api/nodes'

export interface TreeNode extends Node {
  children: TreeNode[]
  isExpanded: boolean
}

export const useNodesStore = defineStore('nodes', () => {
  // State
  const nodes = ref<Node[]>([])
  const selectedNodeId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const expandedNodeIds = ref<Set<string>>(new Set())

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
    try {
      nodes.value = await nodesApi.getByProject(projectId)
      
      // Domyślnie rozwiń ROOT i pierwszy poziom
      if (nodes.value.length > 0) {
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
    isLoading.value = true
    error.value = null
    try {
      const movedNode = await nodesApi.move(nodeId, dto)
      
      // Aktualizuj węzeł w lokalnym stanie
      const index = nodes.value.findIndex((n) => n.id === nodeId)
      if (index !== -1) {
        // Zaktualizuj parent_id i order_index
        nodes.value[index] = {
          ...nodes.value[index],
          parent_id: movedNode.parent_id,
          order_index: movedNode.order_index,
        }
      }
      
      return movedNode
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas przenoszenia węzła'
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
  }

  const expandAll = () => {
    nodes.value.forEach((n) => expandedNodeIds.value.add(n.id))
  }

  const collapseAll = () => {
    expandedNodeIds.value.clear()
    // Zawsze zachowaj ROOT rozwinięty
    const root = nodes.value.find((n) => n.type === 'ROOT')
    if (root) {
      expandedNodeIds.value.add(root.id)
    }
  }

  const isExpanded = (nodeId: string) => {
    return expandedNodeIds.value.has(nodeId)
  }

  const reset = () => {
    nodes.value = []
    selectedNodeId.value = null
    expandedNodeIds.value.clear()
    error.value = null
  }

  return {
    // State
    nodes,
    selectedNodeId,
    isLoading,
    error,
    expandedNodeIds,
    
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
    addAssignee,
    removeAssignee,
    selectNode,
    toggleExpand,
    expandAll,
    collapseAll,
    isExpanded,
    reset,
  }
})
