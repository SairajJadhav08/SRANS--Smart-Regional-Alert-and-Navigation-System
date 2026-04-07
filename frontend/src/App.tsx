import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/layout/Toast'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/routing/ProtectedRoute'
import GovRoute from './components/routing/GovRoute'

const HomePage = React.lazy(() => import('./pages/HomePage'))
const FeaturesPage = React.lazy(() => import('./pages/FeaturesPage'))
const AlertsPage = React.lazy(() => import('./pages/AlertsPage'))
const MapPage = React.lazy(() => import('./pages/MapPage'))
const AboutPage = React.lazy(() => import('./pages/AboutPage'))
const ContactPage = React.lazy(() => import('./pages/ContactPage'))
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'))
const MyRoutesPage = React.lazy(() => import('./pages/MyRoutesPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const NewAlertPage = React.lazy(() => import('./pages/NewAlertPage'))
const EditAlertPage = React.lazy(() => import('./pages/EditAlertPage'))

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Navbar />
          <main>
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/my-routes" element={<MyRoutesPage />} />
                </Route>

                <Route element={<GovRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/dashboard/alerts/new" element={<NewAlertPage />} />
                  <Route path="/dashboard/alerts/:id/edit" element={<EditAlertPage />} />
                </Route>
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
