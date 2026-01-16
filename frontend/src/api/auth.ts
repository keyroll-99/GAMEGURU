import apiClient from './client'

export interface RegisterData {
  email: string
  username: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  message: string
  user: {
    id: string
    email: string
    username: string
    avatar_url: string | null
  }
  accessToken?: string
  refreshToken?: string
}

export interface RefreshResponse {
  message: string
  accessToken: string
  refreshToken: string
}

export const authApi = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const response = await apiClient.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    })
    return response.data
  },

  async getProfile(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<AuthResponse['user']>('/users/me')
    return response.data
  },
}
