import apiClient from './client'

export interface ViewState {
  id: string
  user_id: string
  project_id: string
  view_type: string
  zoom: number
  pan_x: number
  pan_y: number
  expanded_nodes: string[]
  created_at: string
  updated_at: string
}

export interface SaveViewStateDto {
  projectId: string
  viewType?: string
  zoom?: number
  panX?: number
  panY?: number
  expandedNodes?: string[]
}

export const viewStateApi = {
  /**
   * Get view state for a project
   */
  get: async (projectId: string): Promise<ViewState | null> => {
    const response = await apiClient.get<ViewState>(`/view-state/${projectId}`)
    return response.data
  },

  /**
   * Save view state for a project
   */
  save: async (dto: SaveViewStateDto): Promise<ViewState> => {
    const response = await apiClient.post<ViewState>('/view-state', dto)
    return response.data
  },

  /**
   * Delete view state for a project
   */
  delete: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/view-state/${projectId}`)
  },
}
