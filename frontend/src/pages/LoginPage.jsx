import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Cpu, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #003865 0%, #00629B 45%, #0085CA 100%)',
      position: 'relative', overflow: 'hidden', fontFamily: 'var(--font)'
    }}>
      {/* Circuit dots bg */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.07) 1px, transparent 0)',
        backgroundSize: '40px 40px', pointerEvents: 'none'
      }} />
      {/* Glow blobs */}
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,163,224,0.2) 0%, transparent 70%)',
        top: -100, right: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,56,101,0.4) 0%, transparent 70%)',
        bottom: -50, left: -50, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: 16,
          boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #003865, #00629B)',
            padding: '32px 32px 28px', textAlign: 'center'
          }}>
            <div style={{
              width: 56, height: 56, background: 'rgba(255,255,255,0.15)',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Cpu size={26} color="white" />
            </div>
            <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              IEEE Event Manager
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Administrator Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: 32 }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 36 }}
                  value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username" required autoFocus />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password" required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2
                }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign In'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Default: admin / admin123
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
