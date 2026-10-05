import React, { useState } from 'react';
import { Lock, Mail, LogIn, Building, AlertCircle, Loader2 } from 'lucide-react';
import { login } from '../services/auth';

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(email, password, 'UALDO PWA Mobile');
    setLoading(false);

    if (res.success) {
      if (onLoginSuccess) {
        onLoginSuccess(res.user, res.token);
      }
    } else {
      setError(res.error || 'Credenciales inválidas');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at top right, rgba(0, 115, 127, 0.2), transparent 45%), radial-gradient(circle at bottom left, rgba(98, 201, 200, 0.15), transparent 45%)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '36px 24px 28px 24px', borderRadius: '24px', textAlign: 'center' }}>
        {/* Header Branding: Mascota + Logo Claro */}
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="/brand/mascota.png" 
            alt="Mascota Ualdo" 
            style={{ width: '96px', height: 'auto', marginBottom: '12px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))' }} 
          />
          <img 
            src="/brand/ualdo-claro.png" 
            alt="Ualdo" 
            style={{ height: '36px', width: 'auto', marginBottom: '8px' }} 
          />
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Ingresa a tu cuenta Ualdo
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: 'var(--error)',
            fontSize: '13px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} color="var(--accent)" />
              <span>Correo Electrónico</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="tu@negocio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ fontSize: '14px', padding: '12px 14px' }}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="var(--accent)" />
              <span>Contraseña</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ fontSize: '14px', padding: '12px 14px' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '14px'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '11px', color: 'var(--text-subtle)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Building size={12} />
            <span>Acceso seguro multi-tenant con Sanctum</span>
          </div>
        </div>
      </div>
    </div>
  );
}