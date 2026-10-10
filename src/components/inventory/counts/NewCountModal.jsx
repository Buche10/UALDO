import React, { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { INVENTORY_LOCATIONS, DEFAULT_LOCATION } from '../../../services/inventoryLocations';

export default function NewCountModal({ isOpen, onClose, onCreate, triggerRef }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const initialFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const triggerEl = triggerRef?.current;
      initialFocusRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !submitting) {
          onClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (triggerEl) {
          triggerEl.focus();
        }
      };
    }
  }, [isOpen, submitting, onClose, triggerRef]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await onCreate(location, notes);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Error al iniciar conteo.');
    } else {
      setLocation(DEFAULT_LOCATION);
      setNotes('');
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(8px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-count-dialog-title"
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-glow)',
          background: 'var(--bg-glass)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 id="new-count-dialog-title" style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            Nuevo Conteo Físico
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar modal"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          aria-live="polite"
          style={{
            minHeight: error ? '16px' : '0px',
            padding: error ? '10px' : 0,
            borderRadius: '8px',
            background: error ? 'var(--error-soft)' : 'transparent',
            color: 'var(--error)',
            fontSize: '12px',
            marginBottom: error ? '14px' : '0px',
            border: error ? '1px solid var(--border-error)' : 'none',
          }}
        >
          {error || null}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="new-count-location-select" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Ubicación a contar
            </label>
            <select
              id="new-count-location-select"
              ref={initialFocusRef}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            >
              {INVENTORY_LOCATIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="new-count-notes-input" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Nota o motivo (opcional)
            </label>
            <input
              id="new-count-notes-input"
              type="text"
              placeholder="Ej: Conteo de reapertura"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'var(--bg-dark)', color: 'var(--text-main)' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{ flex: 1, padding: '12px', borderRadius: '9999px', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ flex: 1, padding: '12px', borderRadius: '9999px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              <span>{submitting ? 'Iniciando...' : 'Iniciar Conteo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
