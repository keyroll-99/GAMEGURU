import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notesApi, type ProjectNote, type CreateNoteData, type UpdateNoteData } from '@/api/notes'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<ProjectNote[]>([])
  const currentNote = ref<ProjectNote | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchNotes(projectId: string) {
    isLoading.value = true
    error.value = null
    try {
      notes.value = await notesApi.getAll(projectId)
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Nie udało się pobrać notatek'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchNote(projectId: string, noteId: string) {
    isLoading.value = true
    error.value = null
    try {
      currentNote.value = await notesApi.getById(projectId, noteId)
      return currentNote.value
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Nie udało się pobrać notatki'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createNote(projectId: string, data: CreateNoteData) {
    isLoading.value = true
    error.value = null
    try {
      const newNote = await notesApi.create(projectId, data)
      notes.value.unshift(newNote)
      currentNote.value = newNote
      return { success: true, note: newNote }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Nie udało się utworzyć notatki'
      error.value = msg
      return { success: false, message: msg }
    } finally {
      isLoading.value = false
    }
  }

  async function updateNote(projectId: string, noteId: string, data: UpdateNoteData) {
    isLoading.value = true
    error.value = null
    try {
      const updatedNote = await notesApi.update(projectId, noteId, data)
      const index = notes.value.findIndex((n) => n.id === noteId)
      if (index !== -1) {
        notes.value[index] = updatedNote
      }
      if (currentNote.value?.id === noteId) {
        currentNote.value = updatedNote
      }
      return { success: true, note: updatedNote }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Nie udało się zaktualizować notatki'
      error.value = msg
      return { success: false, message: msg }
    } finally {
      isLoading.value = false
    }
  }

  async function deleteNote(projectId: string, noteId: string) {
    isLoading.value = true
    error.value = null
    try {
      await notesApi.delete(projectId, noteId)
      notes.value = notes.value.filter((n) => n.id !== noteId)
      if (currentNote.value?.id === noteId) {
        currentNote.value = null
      }
      return { success: true }
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Nie udało się usunąć notatki'
      error.value = msg
      return { success: false, message: msg }
    } finally {
      isLoading.value = false
    }
  }

  function setCurrentNote(note: ProjectNote | null) {
    currentNote.value = note
  }

  return {
    notes,
    currentNote,
    isLoading,
    error,
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    deleteNote,
    setCurrentNote,
  }
})
