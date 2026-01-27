import apiClient from './client'

export interface ProjectNote {
  id: string
  project_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface CreateNoteData {
  title: string
  content: string
}

export interface UpdateNoteData {
  title?: string
  content?: string
}

export const notesApi = {
  async getAll(projectId: string): Promise<ProjectNote[]> {
    const response = await apiClient.get(`/projects/${projectId}/notes`)
    return response.data
  },

  async getById(projectId: string, noteId: string): Promise<ProjectNote> {
    const response = await apiClient.get(`/projects/${projectId}/notes/${noteId}`)
    return response.data
  },

  async create(projectId: string, data: CreateNoteData): Promise<ProjectNote> {
    const response = await apiClient.post(`/projects/${projectId}/notes`, data)
    return response.data
  },

  async update(projectId: string, noteId: string, data: UpdateNoteData): Promise<ProjectNote> {
    const response = await apiClient.patch(`/projects/${projectId}/notes/${noteId}`, data)
    return response.data
  },

  async delete(projectId: string, noteId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/projects/${projectId}/notes/${noteId}`)
    return response.data
  },
}
