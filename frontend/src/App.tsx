import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Toast from './components/layout/Toast'
import AppShell from './components/layout/AppShell'
import { PublicLayout, AdaptiveLayout, HomeGate, GuestOnly } from './components/layout/Layouts'
import ProtectedRoute from './components/routing/ProtectedRoute'
import GovRoute from './components/routing/GovRoute'
import SuperuserRoute from './components/routing/SuperuserRoute'
import './App.css'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const AlertsPage = lazy(() => import('./pages/AlertsPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const NewAlertPage = lazy(() => import('./pages/NewAlertPage'))
const EditAlertPage = lazy(() => import('./pages/EditAlertPage'))
const SuperuserPage = lazy(() => import('./pages/SuperuserPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'))
const MyRoutesPage = lazy(() => import('./pages/MyRoutesPage'))
const AiAssistantPage = lazy(() => import('./pages/AiAssistantPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const ReportReviewPage = lazy(() => import('./pages/ReportReviewPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-label="Loading">
      <span className="spinner" />
    </div>
  )
}

type ToastType = 'success' | 'danger' | 'info' | 'warning'

function AppContent() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    const handleLoginSuccess = () => setToast({ message: 'Successfully logged in', type: 'success' })
    const handleLogout = () => setToast({ message: 'Logged out', type: 'info' })
    const handleAlertCreated = () => setToast({ message: 'Alert created successfully', type: 'success' })
    const handleToastShow = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: ToastType }>
      if (customEvent.detail) {
        setToast({ message: customEvent.detail.message, type: customEvent.detail.type })
      }
    }

    window.addEventListener('auth:login_success', handleLoginSuccess)
    window.addEventListener('auth:logout', handleLogout)
    window.addEventListener('alert:created', handleAlertCreated)
    window.addEventListener('toast:show', handleToastShow)

    return () => {
      window.removeEventListener('auth:login_success', handleLoginSuccess)
      window.removeEventListener('auth:logout', handleLogout)
      window.removeEventListener('alert:created', handleAlertCreated)
      window.removeEventListener('toast:show', handleToastShow)
    }
  }, [])

  // Background notification poller: shows a browser notification when a new alert is published
  useEffect(() => {
    if (!('Notification' in window)) return

    let lastAlertId = parseInt(localStorage.getItem('srans_last_alert_id') || '0', 10)

    const checkForAlerts = async () => {
      if (Notification.permission !== 'granted') return
      try {
        const { getAlerts } = await import('./api')
        const res = await getAlerts()

        if (Array.isArray(res.data) && res.data.length > 0) {
          const latest = res.data[0]
          if (lastAlertId === 0) {
            lastAlertId = latest.id
            localStorage.setItem('srans_last_alert_id', lastAlertId.toString())
          } else if (latest.id > lastAlertId) {
            lastAlertId = latest.id
            localStorage.setItem('srans_last_alert_id', lastAlertId.toString())

            new Notification(`New ${latest.alert_type} Alert: ${latest.title}`, {
              body: latest.description,
              icon: '/Logo.png',
            })
          }
        }
      } catch {
        // silently fail on background polling
      }
    }

    const interval = setInterval(checkForAlerts, 30000)
    checkForAlerts()

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth screens: standalone split layout, guests only */}
          <Route element={<GuestOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Marketing site */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomeGate><HomePage /></HomeGate>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/features" element={<FeaturesPage />} />
          </Route>

          {/* Shared by guests and members */}
          <Route element={<AdaptiveLayout />}>
            <Route path="/map" element={<MapPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
          </Route>

          {/* Signed-in product */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/my-routes" element={<MyRoutesPage />} />
              <Route path="/ai-assistant" element={<AiAssistantPage />} />
              <Route path="/report" element={<ReportPage />} />

              <Route element={<GovRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/alerts/new" element={<NewAlertPage />} />
                <Route path="/alerts/edit/:id" element={<EditAlertPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/reports/review" element={<ReportReviewPage />} />
              </Route>

              <Route element={<SuperuserRoute />}>
                <Route path="/superuser" element={<SuperuserPage />} />
              </Route>
            </Route>
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}
