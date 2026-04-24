import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Calendar, QrCode, LogOut, 
  ChevronRight, Cpu, Menu, X
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/events', icon: Calendar, label: 'Events' },
    { to: '/scanner', icon: QrCode, label: 'QR Scanner' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'linear-gradient(180deg, #003865 0%, #00629B 100%)',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, left: mobileOpen ? 0 : '-240px', height: '100vh', zIndex: 100,
        transition: 'left 0.3s ease', boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
      }}
      className={mobileOpen ? 'mobile-open' : ''}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, background: 'rgba(255,255,255,0.15)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <Cpu size={18} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.02em' }}>
                Event Manager
              </div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                IEEE Platform
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 8, marginBottom: 4, textDecoration: 'none', transition: 'all 0.15s',
              background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
              fontWeight: isActive ? 600 : 400, fontSize: '0.9rem',
              borderLeft: isActive ? '3px solid #0085CA' : '3px solid transparent',
            })}>
              <Icon size={17} />
              {label}
              <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #0085CA, #00A3E0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.8rem', fontWeight: 700
            }}>
              {admin?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500 }}>{admin?.username}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>Administrator</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}
            style={{ width: '100%', color: 'rgba(255,255,255,0.6)', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99
        }} />
      )}

      {/* Main */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        className="main-content">
        {/* Top bar */}
        <header style={{
          background: 'white', borderBottom: '1px solid var(--border)',
          padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMobileOpen(!mobileOpen)}
            style={{ display: 'none' }} id="menu-btn">
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0B7B5A',
              boxShadow: '0 0 0 2px #ECFDF5', animation: 'none' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>System Online</span>
          </div>
        </header>

        <div style={{ flex: 1, padding: '28px 28px' }}>
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
          #menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
