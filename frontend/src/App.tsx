import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Toast from './components/layout/Toast'
import ProtectedRoute from './components/routing/ProtectedRoute'
import GovRoute from './components/routing/GovRoute'
import SuperuserRoute from './components/routing/SuperuserRoute'
import './App.css'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
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

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Global skeleton loader
function AppSkeleton() {
  return (
    <div className="skeleton-app">
      <div className="skeleton-nav">
        <div className="skeleton-logo"></div>
      </div>
      <div className="skeleton-main">
        <div className="skeleton-title"></div>
        <div className="skeleton-content" style={{ height: '200px', marginBottom: '20px' }}></div>
        <div className="skeleton-content" style={{ height: '100px' }}></div>
      </div>
    </div>
  )
}

function AppContent() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' } | null>(null)

  useEffect(() => {
    const handleLoginSuccess = () => setToast({ message: 'Successfully logged in', type: 'success' })
    const handleLogout = () => setToast({ message: 'Logged out', type: 'info' })
    const handleAlertCreated = () => setToast({ message: 'Alert created successfully', type: 'success' })
    const handleToastShow = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: 'success' | 'danger' | 'info' | 'warning' }>
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

  // Background Notification Poller
  useEffect(() => {
    if (!('Notification' in window)) return;
    
    let lastAlertId = parseInt(localStorage.getItem('srans_last_alert_id') || '0', 10);
    
    const checkForAlerts = async () => {
      if (Notification.permission !== 'granted') return;
      try {
        // We import getAlerts dynamically or we could import it at the top
        // But App.tsx doesn't import getAlerts yet. Let's do it safely.
        const { getAlerts } = await import('./api');
        const res = await getAlerts();
        
        if (Array.isArray(res.data) && res.data.length > 0) {
          const latest = res.data[0];
          if (lastAlertId === 0) {
            lastAlertId = latest.id;
            localStorage.setItem('srans_last_alert_id', lastAlertId.toString());
          } else if (latest.id > lastAlertId) {
            lastAlertId = latest.id;
            localStorage.setItem('srans_last_alert_id', lastAlertId.toString());
            
            new Notification(`New ${latest.alert_type} Alert: ${latest.title}`, {
              body: latest.description,
              icon: '/Logo.png'
            });
          }
        }
      } catch (err) {
        // silently fail on background polling
      }
    };

    const interval = setInterval(checkForAlerts, 30000);
    checkForAlerts();

    return () => clearInterval(interval);
  }, []);

  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isMapPage = location.pathname === '/map'

  return (
    <>
      {!isAuthPage && <Navbar />}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      <main>
        <Suspense fallback={<AppSkeleton />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/my-routes" element={<MyRoutesPage />} />
            </Route>

            <Route element={<GovRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/alerts/new" element={<NewAlertPage />} />
              <Route path="/alerts/edit/:id" element={<EditAlertPage />} />
            </Route>
            
            <Route element={<SuperuserRoute />}>
              <Route path="/superuser" element={<SuperuserPage />} />
            </Route>
          </Routes>
        </Suspense>
      </main>
      {!isAuthPage && <Footer />}
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
