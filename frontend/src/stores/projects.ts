import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  projectsApi,
  type Project,
  type ProjectMember,
  type CreateProjectData,
  type UpdateProjectData,
  type InviteMemberData,
  type TransferOwnershipData,
} from '@/api/projects'

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const members = ref<ProjectMember[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeProjects = computed(() => projects.value.filter((p) => !p.is_archived))
  const archivedProjects = computed(() => projects.value.filter((p) => p.is_archived))

  // Actions
  function clearError() {
    error.value = null
  }

  async function fetchProjects() {
    isLoading.value = true
    error.value = null

    try {
      projects.value = await projectsApi.getAll()
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Nie udało się pobrać projektów'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProject(id: string) {
    isLoading.value = true
    error.value = null

    try {
      currentProject.value = await projectsApi.getById(id)
      return currentProject.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Nie udało się pobrać projektu'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createProject(data: CreateProjectData) {
    isLoading.value = true
    error.value = null

    try {
      const result = await projectsApi.create(data)
      projects.value.unshift(result.project)
      return { success: true, project: result.project, message: result.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nie udało się utworzyć projektu'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProject(id: string, data: UpdateProjectData) {
    isLoading.value = true
    error.value = null

    try {
      const result = await projectsApi.update(id, data)
      // Update in list
      const index = projects.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...result.project }
      }
      // Update current if same
      if (currentProject.value?.id === id) {
        currentProject.value = { ...currentProject.value, ...result.project }
      }
      return { success: true, message: result.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nie udało się zaktualizować projektu'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  async function archiveProject(id: string) {
    try {
      const result = await projectsApi.archive(id)
      const index = projects.value.findIndex((p) => p.id === id)
      if (index !== -1 && projects.value[index]) {
        projects.value[index].is_archived = true
      }
      if (currentProject.value?.id === id) {
        currentProject.value.is_archived = true
      }
      return { success: true, message: result.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nie udało się zarchiwizować projektu'
      return { success: false, message }
    }
  }

  async function unarchiveProject(id: string) {
    try {
      const result = await projectsApi.unarchive(id)
      const index = projects.value.findIndex((p) => p.id === id)
      if (index !== -1 && projects.value[index]) {
        projects.value[index].is_archived = false
      }
      if (currentProject.value?.id === id) {
        currentProject.value.is_archived = false
      }
      return { success: true, message: result.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nie udało się przywrócić projektu'
      return { success: false, message }
    }
  }

  async function transferOwnership(id: string, data: TransferOwnershipData) {
    try {
      const result = await projectsApi.transferOwnership(id, data)
      // Refresh project data
      await fetchProject(id)
      return { success: true, message: result.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nie udało się przekazać własności'
      return { success: false, message }
    }
  }

  // Members actions
  async function fetchMembers(projectId: string) {
    try {
      members.value = await projectsApi.getMembers(projectId)
      return members.value
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Nie udało się pobrać członków'
      return []
    }
  }

  async function inviteMember(projectId: string, data: InviteMemberData) {
    try {
      const result = await projectsApi.inviteMember(projectId, data)
      members.value.push(result.member)
      // Update member count in project
      const project = projects.value.find((p) => p.id === projectId)
      if (project?._count) {
        project._count.members++
      }
      return { success: true, message: result.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nie udało się zaprosić użytkownika'
      return { success: false, message }
    }
  }

  async function removeMember(projectId: string, userId: string) {
    try {
      const result = await projectsApi.removeMember(projectId, userId)
      members.value = members.value.filter((m) => m.user_id !== userId)
      // Update member count in project
      const project = projects.value.find((p) => p.id === projectId)
      if (project?._count) {
        project._count.members--
      }
      return { success: true, message: result.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nie udało się usunąć członka'
      return { success: false, message }
    }
  }

  async function leaveProject(projectId: string) {
    try {
      const result = await projectsApi.leaveProject(projectId)
      // Remove from local list
      projects.value = projects.value.filter((p) => p.id !== projectId)
      return { success: true, message: result.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Nie udało się opuścić projektu'
      return { success: false, message }
    }
  }

  function clearCurrentProject() {
    currentProject.value = null
    members.value = []
  }

  return {
    // State
    projects,
    currentProject,
    members,
    isLoading,
    error,
    // Getters
    activeProjects,
    archivedProjects,
    // Actions
    clearError,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    archiveProject,
    unarchiveProject,
    transferOwnership,
    fetchMembers,
    inviteMember,
    removeMember,
    leaveProject,
    clearCurrentProject,
  }
})
