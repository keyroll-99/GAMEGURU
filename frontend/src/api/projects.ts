import apiClient from './client'

// Types
export interface Project {
  id: string
  name: string
  description: string | null
  owner_id: string
  is_archived: boolean
  created_at: string
  updated_at: string
  owner: ProjectOwner
  members?: ProjectMember[]
  _count?: {
    members: number
  }
}

export interface ProjectOwner {
  id: string
  username: string
  email?: string
  avatar_url: string | null
}

export interface ProjectMember {
  project_id: string
  user_id: string
  role: 'OWNER' | 'MEMBER'
  joined_at: string
  user: ProjectOwner
}

export interface CreateProjectData {
  name: string
  description?: string
}

export interface UpdateProjectData {
  name?: string
  description?: string
}

export interface InviteMemberData {
  email: string
}

export interface TransferOwnershipData {
  newOwnerId: string
}

// API functions
export const projectsApi = {
  // Projects CRUD
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get('/projects')
    return response.data
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data
  },

  async create(data: CreateProjectData): Promise<{ message: string; project: Project }> {
    const response = await apiClient.post('/projects', data)
    return response.data
  },

  async update(id: string, data: UpdateProjectData): Promise<{ message: string; project: Project }> {
    const response = await apiClient.patch(`/projects/${id}`, data)
    return response.data
  },

  async archive(id: string): Promise<{ message: string; project: Project }> {
    const response = await apiClient.patch(`/projects/${id}/archive`)
    return response.data
  },

  async unarchive(id: string): Promise<{ message: string; project: Project }> {
    const response = await apiClient.patch(`/projects/${id}/unarchive`)
    return response.data
  },

  async transferOwnership(
    id: string,
    data: TransferOwnershipData,
  ): Promise<{ message: string; project: Project }> {
    const response = await apiClient.patch(`/projects/${id}/transfer-ownership`, data)
    return response.data
  },

  // Members
  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiClient.get(`/projects/${projectId}/members`)
    return response.data
  },

  async inviteMember(
    projectId: string,
    data: InviteMemberData,
  ): Promise<{ message: string; member: ProjectMember }> {
    const response = await apiClient.post(`/projects/${projectId}/members`, data)
    return response.data
  },

  async removeMember(projectId: string, userId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/projects/${projectId}/members/${userId}`)
    return response.data
  },

  async leaveProject(projectId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/projects/${projectId}/members/me`)
    return response.data
  },
}
