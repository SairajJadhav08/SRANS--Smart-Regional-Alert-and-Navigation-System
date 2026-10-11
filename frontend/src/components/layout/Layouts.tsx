import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { User } from '../../types'
import Navbar from './Navbar'
import Footer from './Footer'
import BroadcastBanner from './BroadcastBanner'
import AppShell from './AppShell'

// Where a signed-in user lands when they open the site or finish logging in.
export function homePathFor(user: User | null): string {
  if (user?.is_superuser) return '/superuser'
  if (user?.is_government && user?.is_verified) return '/dashboard'
  return '/overview'
}

// Marketing pages: transparent-on-hero navbar + rich footer.
export function PublicLayout() {
  const { pathname } = useLocation()
  const fullBleed = pathname === '/map'
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar />
      <main className={`public-main${pathname === '/' ? ' is-home' : ''}`} id="main-content">
        <BroadcastBanner />
        <Outlet />
      </main>
      {!fullBleed && <Footer />}
    </>
  )
}

// Pages that exist for both guests and members (live map, alerts feed):
// members see them inside the app shell, guests inside the public layout.
export function AdaptiveLayout() {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <AppShell /> : <PublicLayout />
}

// "/" — landing page for guests, straight into the product for members.
export function HomeGate({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth()
  if (isLoggedIn) return <Navigate to={homePathFor(user)} replace />
  return <>{children}</>
}

// Login / register are pointless once signed in.
export function GuestOnly() {
  const { isLoggedIn, user } = useAuth()
  if (isLoggedIn) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}
