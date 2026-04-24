import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, XCircle, Cpu } from 'lucide-react';

export default function CheckInSuccessPage() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/checkin/${token}`)
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => { setResult({ valid: false }); setLoading(false); });
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #003865 0%, #00629B 50%, #0085CA 100%)',
      fontFamily: 'IBM Plex Sans, sans-serif', padding: 20,
      backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.06) 1px, transparent 0)',
      backgroundSize: '40px 40px'
    }}>
      <div style={{ maxWidth: 420, width: '100%' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px',
            border: '1px solid rgba(255,255,255,0.2)' }}>
            <Cpu size={16} color="white" />
            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.1em' }}>IEEE EVENT MANAGER</span>
          </div>
        </div>

        <div style={{
          background: 'white', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
        }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, border: '3px solid #e0eaf5', borderTopColor: '#00629B',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#5A7A8F' }}>Verifying your QR code...</p>
            </div>
          ) : !result?.valid ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FEF2F2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <XCircle size={36} color="#C0392B" />
              </div>
              <h2 style={{ color: '#0D2137', fontWeight: 700, marginBottom: 8 }}>Invalid QR Code</h2>
              <p style={{ color: '#5A7A8F', fontSize: '0.9rem' }}>This QR code is not recognized. Please contact the event organizer.</p>
            </div>
          ) : result.already_checked_in ? (
            <>
              <div style={{ background: 'linear-gradient(135deg, #B45309, #D97706)', padding: '32px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <AlertCircle size={36} color="white" />
                </div>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.4rem', margin: 0 }}>Already Checked In</h2>
              </div>
              <div style={{ padding: '28px 32px' }}>
                <p style={{ color: '#5A7A8F', fontSize: '0.9rem', textAlign: 'center', marginBottom: 20 }}>
                  This attendee has already been checked in.
                </p>
                <div style={{ background: '#F0F4F8', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: '0.72rem', color: '#5A7A8F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendee</div>
                    <div style={{ fontWeight: 600, color: '#0D2137' }}>{result.participant?.full_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#5A7A8F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>First Check-in</div>
                    <div style={{ fontWeight: 500, color: '#0D2137', fontSize: '0.9rem' }}>
                      {result.participant?.attended_at ? new Date(result.participant.attended_at).toLocaleString() : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ background: 'linear-gradient(135deg, #065f46, #0B7B5A)', padding: '32px', textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  animation: 'checkIn 0.5s ease' }}>
                  <CheckCircle size={38} color="white" />
                </div>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.5rem', margin: 0 }}>Welcome!</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: 6, fontSize: '0.9rem' }}>Check-in Successful</p>
              </div>
              <div style={{ padding: '28px 32px' }}>
                <div style={{ background: '#ECFDF5', borderRadius: 10, padding: '16px 20px', marginBottom: 16, border: '1px solid #6ee7b7' }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#5A7A8F', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Attendee</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0D2137' }}>{result.participant?.full_name}</div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: '0.72rem', color: '#5A7A8F', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Event</div>
                    <div style={{ fontWeight: 500, color: '#0D2137' }}>{result.event?.name}</div>
                  </div>
                  {result.event?.location && (
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#5A7A8F', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Location</div>
                      <div style={{ fontWeight: 500, color: '#0D2137' }}>📍 {result.event.location}</div>
                    </div>
                  )}
                </div>
                <p style={{ textAlign: 'center', color: '#5A7A8F', fontSize: '0.82rem' }}>
                  {new Date().toLocaleString()}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes checkIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
