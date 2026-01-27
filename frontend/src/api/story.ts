import apiClient from './client'

// Typy na podstawie Prisma schema
export type StoryElementType = 'OVERVIEW' | 'ACT' | 'SCENE' | 'DIALOG' | 'EVENT' | 'CHARACTER'
export type StoryElementStatus = 'DRAFT' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED'

export interface StoryElement {
  id: string
  project_id: string
  parent_id: string | null
  type: StoryElementType
  status: StoryElementStatus
  title: string
  content: string | null
  order_index: number
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
  children?: StoryElement[]
  linkedNodes?: LinkedNode[]
}

export interface StoryConnection {
  id: string
  from_element_id: string
  to_element_id: string
  label: string | null
  connection_type: string
}

export interface LinkedNode {
  id: string
  node_id: string
  story_element_id: string
  node: {
    id: string
    title: string
    type: string
    status: string
  }
}

export interface StoryHistoryEntry {
  id: string
  story_element_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_at: string
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export interface CreateStoryElementDto {
  projectId: string
  parentId?: string
  type: StoryElementType
  title: string
  content?: string
  metadata?: Record<string, any>
}

export interface UpdateStoryElementDto {
  title?: string
  content?: string
  status?: StoryElementStatus
  metadata?: Record<string, any>
  orderIndex?: number
}

export interface CreateConnectionDto {
  toElementId: string
  label?: string
  connectionType?: 'leads_to' | 'branches_to' | 'requires'
}

export interface LinkNodeDto {
  nodeId: string
}

export interface ProgressStats {
  total: number
  byStatus: Record<StoryElementStatus, number>
  byType: Record<StoryElementType, number>
  completionPercentage: number
}

export interface GraphData {
  elements: StoryElement[]
  connections: StoryConnection[]
}

// API Functions
export const storyApi = {
  /**
   * Pobiera wszystkie elementy fabuły projektu
   */
  getByProject: async (projectId: string): Promise<StoryElement[]> => {
    const response = await apiClient.get(`/projects/${projectId}/story`)
    return response.data
  },

  /**
   * Pobiera dane do grafu (elementy + połączenia)
   */
  getGraphData: async (projectId: string): Promise<GraphData> => {
    const response = await apiClient.get(`/projects/${projectId}/story/graph`)
    return response.data
  },

  /**
   * Pobiera statystyki postępu fabuły
   */
  getProgress: async (projectId: string): Promise<ProgressStats> => {
    const response = await apiClient.get(`/projects/${projectId}/story/progress`)
    return response.data
  },

  /**
   * Pobiera pojedynczy element fabuły
   */
  getOne: async (elementId: string): Promise<StoryElement> => {
    const response = await apiClient.get(`/story/${elementId}`)
    return response.data
  },

  /**
   * Tworzy nowy element fabuły
   */
  create: async (dto: CreateStoryElementDto): Promise<StoryElement> => {
    const response = await apiClient.post('/story', dto)
    return response.data
  },

  /**
   * Aktualizuje element fabuły
   */
  update: async (elementId: string, dto: UpdateStoryElementDto): Promise<StoryElement> => {
    const response = await apiClient.patch(`/story/${elementId}`, dto)
    return response.data
  },

  /**
   * Usuwa element fabuły
   */
  delete: async (elementId: string): Promise<void> => {
    await apiClient.delete(`/story/${elementId}`)
  },

  /**
   * Tworzy połączenie między elementami
   */
  createConnection: async (fromElementId: string, dto: CreateConnectionDto): Promise<StoryConnection> => {
    const response = await apiClient.post(`/story/${fromElementId}/connections`, dto)
    return response.data
  },

  /**
   * Usuwa połączenie
   */
  deleteConnection: async (connectionId: string): Promise<void> => {
    await apiClient.delete(`/story/connections/${connectionId}`)
  },

  /**
   * Powiązuje element fabuły z taskiem (Node)
   */
  linkNode: async (elementId: string, dto: LinkNodeDto): Promise<StoryElement> => {
    const response = await apiClient.post(`/story/${elementId}/link-node`, dto)
    return response.data
  },

  /**
   * Usuwa powiązanie z taskiem
   */
  unlinkNode: async (elementId: string, nodeId: string): Promise<void> => {
    await apiClient.delete(`/story/${elementId}/link-node/${nodeId}`)
  },

  /**
   * Pobiera historię zmian elementu
   */
  getHistory: async (elementId: string): Promise<StoryHistoryEntry[]> => {
    const response = await apiClient.get(`/story/${elementId}/history`)
    return response.data
  },
}

export default storyApi
