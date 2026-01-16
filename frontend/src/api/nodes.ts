import apiClient from './client'

// Typy
export type NodeType = 'ROOT' | 'TASK' | 'MILESTONE'
export type NodeStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export interface NodeAssignee {
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export interface Node {
  id: string
  project_id: string
  parent_id: string | null
  type: NodeType
  status: NodeStatus
  title: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
  assignees: NodeAssignee[]
  children?: Node[]
}

export interface CreateNodeDto {
  projectId: string
  parentId?: string
  title: string
  type?: NodeType
  description?: string
}

export interface UpdateNodeDto {
  title?: string
  description?: string
  status?: NodeStatus
}

export interface MoveNodeDto {
  newParentId?: string
  newOrderIndex: number
}

export interface NodeHistoryEntry {
  id: string
  node_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changed_at: string
  changer: {
    id: string
    username: string
    avatar_url: string | null
  }
}

// API Functions
export const nodesApi = {
  /**
   * Pobiera wszystkie węzły projektu
   */
  getByProject: async (projectId: string): Promise<Node[]> => {
    const response = await apiClient.get(`/projects/${projectId}/nodes`)
    return response.data
  },

  /**
   * Pobiera pojedynczy węzeł
   */
  getOne: async (nodeId: string): Promise<Node> => {
    const response = await apiClient.get(`/nodes/${nodeId}`)
    return response.data
  },

  /**
   * Tworzy nowy węzeł
   */
  create: async (dto: CreateNodeDto): Promise<Node> => {
    const response = await apiClient.post('/nodes', dto)
    return response.data
  },

  /**
   * Aktualizuje węzeł
   */
  update: async (nodeId: string, dto: UpdateNodeDto): Promise<Node> => {
    const response = await apiClient.patch(`/nodes/${nodeId}`, dto)
    return response.data
  },

  /**
   * Usuwa węzeł
   */
  delete: async (nodeId: string): Promise<void> => {
    await apiClient.delete(`/nodes/${nodeId}`)
  },

  /**
   * Przenosi węzeł (drag & drop)
   */
  move: async (nodeId: string, dto: MoveNodeDto): Promise<Node> => {
    const response = await apiClient.patch(`/nodes/${nodeId}/move`, dto)
    return response.data
  },

  /**
   * Dodaje przypisanego użytkownika
   */
  addAssignee: async (nodeId: string, userId: string): Promise<Node> => {
    const response = await apiClient.post(`/nodes/${nodeId}/assignees`, { userId })
    return response.data
  },

  /**
   * Usuwa przypisanego użytkownika
   */
  removeAssignee: async (nodeId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/nodes/${nodeId}/assignees/${userId}`)
  },

  /**
   * Pobiera historię zmian węzła (tylko ROOT)
   */
  getHistory: async (nodeId: string): Promise<NodeHistoryEntry[]> => {
    const response = await apiClient.get(`/nodes/${nodeId}/history`)
    return response.data
  },
}

export default nodesApi
