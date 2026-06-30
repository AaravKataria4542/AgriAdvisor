import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import toast from 'react-hot-toast'

const NAV = [
  { section: 'Overview', items: [
    { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  ]},
  { section: 'AI Tools', items: [
    { to: '/disease-prediction', icon: '🔬', label: 'Disease Detection' },
    { to: '/soil-prediction', icon: '🪱', label: 'Soil Analysis' },
    { to: '/weather', icon: '🌤', label: 'Weather Forecast' },
    { to: '/crop-recommendation', icon: '🌱', label: 'Crop Advisor' },
  ]},
  { section: 'Farm Management', items: [
    { to: '/yield-prediction', icon: '📊', label: 'Yield Prediction' },
    { to: '/fertilizer', icon: '🧪', label: 'Fertilizer Guide' },
  ]},
  { section: 'Marketplace', items: [
    { to: '/marketplace', icon: '🛒', label: 'Marketplace' },
    { to: '/cart', icon: '🛍', label: 'My Cart' },
    { to: '/orders', icon: '📦', label: 'Orders' },
    { to: '/seller', icon: '🏪', label: 'Seller Dashboard' },
  ]},
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🌾</span>
        <div>
          <div className="sidebar-logo-text">AgriAdvisor</div>
          <div className="sidebar-logo-sub">AI Platform</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.to === '/cart' && cartCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#4ade80', color: '#000', borderRadius: '12px', padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                    {cartCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-card" onClick={handleLogout} title="Click to logout">
            <div className="user-avatar">{user.name?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-role">🚪 Logout</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
