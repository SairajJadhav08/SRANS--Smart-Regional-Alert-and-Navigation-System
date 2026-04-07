import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
})

// Request interceptor: attach JWT token if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401 by clearing auth and redirecting
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.dispatchEvent(new Event('auth:logout'))
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
