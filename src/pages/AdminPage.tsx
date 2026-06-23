import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAdmin } from '../hooks/useAdmin'
import AdminLogin from '../components/admin/AdminLogin'
import AdminDashboard from '../components/admin/AdminDashboard'
import SiteSettingsManager from '../components/admin/SiteSettingsManager'
import GiftManager from '../components/admin/GiftManager'
import CategoryManager from '../components/admin/CategoryManager'
import ReservationGroupsManager from '../components/admin/ReservationGroupsManager'
import SurpriseReveal from '../components/admin/SurpriseReveal'
import {
  LayoutDashboard,
  Gift,
  Tag,
  Settings,
  Users,
  EyeOff,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'

type Tab = 'dashboard' | 'gifts' | 'categories' | 'settings' | 'reservations' | 'surprise'

const NAV_ITEMS: { id: Tab; label: string; icon: React.FC<{ size: number }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'gifts', label: 'Presentes', icon: Gift },
  { id: 'categories', label: 'Categorias', icon: Tag },
  { id: 'settings', label: 'Configurações', icon: Settings },
  { id: 'reservations', label: 'Reservas', icon: Users },
  { id: 'surprise', label: 'Revelar surpresas', icon: EyeOff },
]

export default function AdminPage() {
  const { isAuthenticated, login, logout } = useAdmin()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) {
    return <AdminLogin onLogin={login} />
  }

  function handleNav(tab: Tab) {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: '#0b0b0f' }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a22',
            color: '#e8e4dc',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'Jost, sans-serif',
            fontSize: '0.875rem',
          },
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col admin-sidebar transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div
          className="px-6 py-6 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div>
            <p
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.2rem',
                color: '#e8e4dc',
                fontWeight: 400,
              }}
            >
              Lorena & Arthur
            </p>
            <p
              style={{
                fontFamily: 'Jost, sans-serif',
                fontSize: '0.65rem',
                color: 'rgba(232,228,220,0.3)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Admin
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded hover:bg-white/5"
            style={{ color: 'rgba(232,228,220,0.4)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id
            const isSurprise = item.id === 'surprise'
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-colors ${
                  isSurprise ? 'mt-4' : ''
                }`}
                style={{
                  background: isActive
                    ? isSurprise
                      ? 'rgba(220,38,38,0.1)'
                      : 'rgba(201,180,138,0.08)'
                    : 'transparent',
                  borderLeft: isActive
                    ? `2px solid ${isSurprise ? '#fca5a5' : '#c9b48a'}`
                    : '2px solid transparent',
                  color: isActive
                    ? isSurprise
                      ? '#fca5a5'
                      : '#c9b48a'
                    : 'rgba(232,228,220,0.5)',
                }}
              >
                <item.icon size={16} />
                <span
                  style={{
                    fontFamily: 'Jost, sans-serif',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div
          className="px-3 py-4 flex flex-col gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-colors hover:bg-white/5"
            style={{ color: 'rgba(232,228,220,0.4)', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem' }}
          >
            <ExternalLink size={16} />
            Ver site público
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left transition-colors hover:bg-red-900/10"
            style={{ color: 'rgba(248,113,113,0.6)', fontFamily: 'Jost, sans-serif', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-4 px-6 py-4"
          style={{
            background: 'rgba(11,11,15,0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5"
            style={{ color: 'rgba(232,228,220,0.5)' }}
          >
            <Menu size={20} />
          </button>
          <p
            style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: '0.85rem',
              color: 'rgba(232,228,220,0.4)',
            }}
          >
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
          </p>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto scrollbar-thin">
          {activeTab === 'dashboard' && <AdminDashboard />}
          {activeTab === 'gifts' && <GiftManager />}
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'settings' && <SiteSettingsManager />}
          {activeTab === 'reservations' && <ReservationGroupsManager />}
          {activeTab === 'surprise' && <SurpriseReveal />}
        </main>
      </div>
    </div>
  )
}
