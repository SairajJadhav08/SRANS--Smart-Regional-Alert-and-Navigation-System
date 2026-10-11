import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Request interceptor: attach JWT token if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: a 401 on an authenticated request means the session
// expired, so clear it and send the user to /login. A 401 from the login or
// register calls is just "wrong credentials" — let the form show the message
// instead of reloading the page.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? ''
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register')
    const hadSession = !!error.config?.headers?.Authorization

    if (error.response?.status === 401 && !isAuthAttempt && hadSession) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.dispatchEvent(new Event('auth:logout'))
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default client
