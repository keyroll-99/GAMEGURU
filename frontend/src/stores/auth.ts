import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi, type RegisterData, type LoginData } from '@/api/auth'

export interface User {
  id: string
  email: string
  username: string
  avatar_url?: string | null
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value)

  // Actions
  function setTokens(access: string, refresh: string) {
    accessToken.value = access
    refreshToken.value = refresh
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  function setUser(userData: User) {
    user.value = userData
  }

  function logout() {
    user.value = null
    accessToken.value = null
    refreshToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  function clearError() {
    error.value = null
  }

  async function register(data: RegisterData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.register(data)
      setUser(response.user as User)
      return { success: true, message: response.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Błąd rejestracji'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  async function login(data: LoginData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authApi.login(data)
      if (response.accessToken && response.refreshToken) {
        setTokens(response.accessToken, response.refreshToken)
      }
      setUser(response.user as User)
      return { success: true, message: response.message }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Błąd logowania'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchProfile() {
    if (!accessToken.value) return

    try {
      const userData = await authApi.getProfile()
      setUser(userData as User)
    } catch (err) {
      // Token nieważny - wyloguj
      logout()
    }
  }

  // Inicjalizacja - pobierz profil jeśli mamy token
  if (accessToken.value) {
    fetchProfile()
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    isAuthenticated,
    setTokens,
    setUser,
    logout,
    clearError,
    register,
    login,
    fetchProfile,
  }
})
