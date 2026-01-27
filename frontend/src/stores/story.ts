import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  storyApi,
  type StoryElement,
  type CreateStoryElementDto,
  type UpdateStoryElementDto,
  type CreateConnectionDto,
  type LinkNodeDto,
  type StoryConnection,
  type StoryHistoryEntry,
  type ProgressStats,
} from '@/api/story'

export interface TreeStoryElement extends StoryElement {
  children: TreeStoryElement[]
  isExpanded: boolean
}

export const useStoryStore = defineStore('story', () => {
  // State
  const storyElements = ref<StoryElement[]>([])
  const storyConnections = ref<StoryConnection[]>([])
  const selectedElementId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const expandedElementIds = ref<Set<string>>(new Set())
  const progressStats = ref<ProgressStats | null>(null)
  const historyCache = ref<Map<string, StoryHistoryEntry[]>>(new Map())

  // Getters
  const selectedElement = computed(() => {
    if (!selectedElementId.value) return null
    return storyElements.value.find((el) => el.id === selectedElementId.value) || null
  })

  const rootElements = computed(() => {
    return storyElements.value.filter((el) => el.parent_id === null)
  })

  /**
   * Transformacja płaskiej listy na drzewo hierarchii
   */
  const storyTree = computed((): TreeStoryElement[] => {
    if (storyElements.value.length === 0) return []

    const buildTree = (parentId: string | null): TreeStoryElement[] => {
      return storyElements.value
        .filter((el) => el.parent_id === parentId)
        .sort((a, b) => a.order_index - b.order_index)
        .map((element) => ({
          ...element,
          children: buildTree(element.id),
          isExpanded: expandedElementIds.value.has(element.id),
        }))
    }

    return buildTree(null)
  })

  /**
   * Pobiera elementy fabuły z połączeniami dla projektu
   */
  const fetchStory = async (projectId: string) => {
    isLoading.value = true
    error.value = null
    try {
      storyElements.value = await storyApi.getByProject(projectId)

      // Domyślnie rozwiń główne elementy
      storyElements.value
        .filter((el) => el.parent_id === null)
        .forEach((el) => expandedElementIds.value.add(el.id))
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas pobierania fabuły'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Pobiera dane do grafu (elementy + połączenia)
   */
  const fetchGraphData = async (projectId: string) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await storyApi.getGraphData(projectId)
      storyElements.value = data.elements
      storyConnections.value = data.connections
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas pobierania grafu'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Pobiera statystyki postępu
   */
  const fetchProgress = async (projectId: string) => {
    try {
      progressStats.value = await storyApi.getProgress(projectId)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas pobierania postępu'
      throw e
    }
  }

  /**
   * Pobiera szczegóły pojedynczego elementu
   */
  const fetchElement = async (elementId: string) => {
    isLoading.value = true
    error.value = null
    try {
      const element = await storyApi.getOne(elementId)
      
      // Aktualizuj w lokalnym stanie
      const index = storyElements.value.findIndex((el) => el.id === elementId)
      if (index !== -1) {
        storyElements.value[index] = element
      } else {
        storyElements.value.push(element)
      }
      
      return element
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas pobierania elementu'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Tworzy nowy element fabuły
   */
  const createElement = async (dto: CreateStoryElementDto) => {
    isLoading.value = true
    error.value = null
    try {
      const newElement = await storyApi.create(dto)
      storyElements.value.push(newElement)

      // Rozwiń rodzica jeśli istnieje
      if (dto.parentId) {
        expandedElementIds.value.add(dto.parentId)
      }

      return newElement
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas tworzenia elementu'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Aktualizuje element fabuły
   */
  const updateElement = async (elementId: string, dto: UpdateStoryElementDto) => {
    isLoading.value = true
    error.value = null
    try {
      const updatedElement = await storyApi.update(elementId, dto)
      const index = storyElements.value.findIndex((el) => el.id === elementId)
      if (index !== -1) {
        storyElements.value[index] = updatedElement
      }
      return updatedElement
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas aktualizacji elementu'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Usuwa element fabuły
   */
  const deleteElement = async (elementId: string) => {
    isLoading.value = true
    error.value = null
    try {
      await storyApi.delete(elementId)

      // Usuń element i wszystkie jego dzieci rekurencyjnie
      const idsToRemove = new Set<string>()
      const collectIds = (id: string) => {
        idsToRemove.add(id)
        storyElements.value
          .filter((el) => el.parent_id === id)
          .forEach((child) => collectIds(child.id))
      }
      collectIds(elementId)

      storyElements.value = storyElements.value.filter((el) => !idsToRemove.has(el.id))

      // Jeśli usunięty element był wybrany, odznacz
      if (selectedElementId.value && idsToRemove.has(selectedElementId.value)) {
        selectedElementId.value = null
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas usuwania elementu'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Tworzy połączenie między elementami
   */
  const createConnection = async (fromElementId: string, dto: CreateConnectionDto) => {
    try {
      const connection = await storyApi.createConnection(fromElementId, dto)
      storyConnections.value.push(connection)
      return connection
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas tworzenia połączenia'
      throw e
    }
  }

  /**
   * Usuwa połączenie
   */
  const deleteConnection = async (connectionId: string) => {
    try {
      await storyApi.deleteConnection(connectionId)
      storyConnections.value = storyConnections.value.filter((c) => c.id !== connectionId)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas usuwania połączenia'
      throw e
    }
  }

  /**
   * Powiązuje element z taskiem
   */
  const linkNode = async (elementId: string, dto: LinkNodeDto) => {
    try {
      const updatedElement = await storyApi.linkNode(elementId, dto)
      const index = storyElements.value.findIndex((el) => el.id === elementId)
      if (index !== -1) {
        storyElements.value[index] = updatedElement
      }
      return updatedElement
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas powiązywania z taskiem'
      throw e
    }
  }

  /**
   * Usuwa powiązanie z taskiem
   */
  const unlinkNode = async (elementId: string, nodeId: string) => {
    try {
      await storyApi.unlinkNode(elementId, nodeId)
      
      // Zaktualizuj lokalny stan
      const element = storyElements.value.find((el) => el.id === elementId)
      if (element && element.linkedNodes) {
        element.linkedNodes = element.linkedNodes.filter((ln) => ln.node_id !== nodeId)
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas usuwania powiązania'
      throw e
    }
  }

  /**
   * Pobiera historię zmian elementu
   */
  const fetchHistory = async (elementId: string) => {
    try {
      const history = await storyApi.getHistory(elementId)
      historyCache.value.set(elementId, history)
      return history
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Błąd podczas pobierania historii'
      throw e
    }
  }

  /**
   * Zaznacza element
   */
  const selectElement = (elementId: string | null) => {
    selectedElementId.value = elementId
  }

  /**
   * Przełącza rozwinięcie elementu
   */
  const toggleExpand = (elementId: string) => {
    if (expandedElementIds.value.has(elementId)) {
      expandedElementIds.value.delete(elementId)
    } else {
      expandedElementIds.value.add(elementId)
    }
  }

  /**
   * Rozwija wszystkie elementy
   */
  const expandAll = () => {
    storyElements.value.forEach((el) => expandedElementIds.value.add(el.id))
  }

  /**
   * Zwija wszystkie elementy (oprócz głównych)
   */
  const collapseAll = () => {
    expandedElementIds.value.clear()
    // Zachowaj rozwinięte główne elementy
    storyElements.value
      .filter((el) => el.parent_id === null)
      .forEach((el) => expandedElementIds.value.add(el.id))
  }

  /**
   * Sprawdza czy element jest rozwinięty
   */
  const isExpanded = (elementId: string) => {
    return expandedElementIds.value.has(elementId)
  }

  /**
   * Resetuje stan
   */
  const reset = () => {
    storyElements.value = []
    storyConnections.value = []
    selectedElementId.value = null
    expandedElementIds.value.clear()
    progressStats.value = null
    historyCache.value.clear()
    error.value = null
  }

  return {
    // State
    storyElements,
    storyConnections,
    selectedElementId,
    isLoading,
    error,
    expandedElementIds,
    progressStats,
    historyCache,

    // Getters
    selectedElement,
    rootElements,
    storyTree,

    // Actions
    fetchStory,
    fetchGraphData,
    fetchProgress,
    fetchElement,
    createElement,
    updateElement,
    deleteElement,
    createConnection,
    deleteConnection,
    linkNode,
    unlinkNode,
    fetchHistory,
    selectElement,
    toggleExpand,
    expandAll,
    collapseAll,
    isExpanded,
    reset,
  }
})
