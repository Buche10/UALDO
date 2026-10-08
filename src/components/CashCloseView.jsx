import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';
import { listCloses, isValidDate } from '../services/cashCloseClient';
import { getUser } from '../services/auth';
import CashCloseList from './cashclose/CashCloseList';
import CashCloseDetail from './cashclose/CashCloseDetail';
import CashCloseManualForm from './cashclose/CashCloseManualForm';
import CashConfigView from './cashconfig/CashConfigView';

export default function CashCloseView({ onBack, fechaInicial = null }) {
  const [currentUser] = useState(() => getUser());
  const isOwner = Boolean(currentUser?.capabilities?.is_owner);

  const initialFechaSafe = isValidDate(fechaInicial) ? fechaInicial : null;
  const [selectedFecha, setSelectedFecha] = useState(initialFechaSafe);
  const [showManual, setShowManual] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configTab, setConfigTab] = useState('mappings');
  const [closes, setCloses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forbiddenError, setForbiddenError] = useState(false);

  const fetchCloses = useCallback(async () => {
    if (!isOwner) return;
    setLoading(true);
    setError(null);
    setForbiddenError(false);

    const res = await listCloses();
    setLoading(false);

    if (res.ok) {
      setCloses(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } else {
      if (res.status === 403) {
        setForbiddenError(true);
      } else {
        setError(res.error || 'Error al cargar los cierres.');
      }
    }
  }, [isOwner]);

  useEffect(() => {
    if (isOwner) {
      fetchCloses();
    }
  }, [isOwner, fetchCloses]);

  useEffect(() => {
    if (isValidDate(fechaInicial)) {
      setSelectedFecha(fechaInicial);
    }
  }, [fechaInicial]);

  if (!isOwner || forbiddenError) {
    return (
      <div className="glass-card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <ShieldAlert size={32} color="var(--warning)" />
        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Acceso Restringido</h4>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Solo el dueño puede ver la caja.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            style={{ marginTop: '8px', padding: '8px 16px', borderRadius: '9999px', fontSize: '12px', border: '1px solid var(--border-glass)', background: 'var(--chip-bg)', color: 'var(--text-main)', cursor: 'pointer' }}
          >
            Volver
          </button>
        )}
      </div>
    );
  }

  if (showConfig) {
    return (
      <CashConfigView
        initialTab={configTab}
        onBack={() => {
          setShowConfig(false);
          fetchCloses();
        }}
      />
    );
  }

  if (selectedFecha) {
    return (
      <CashCloseDetail
        fecha={selectedFecha}
        onBack={() => {
          setSelectedFecha(null);
          fetchCloses();
        }}
        onOpenConfig={(tab) => {
          setConfigTab(tab || 'mappings');
          setShowConfig(true);
        }}
      />
    );
  }

  if (showManual) {
    return (
      <CashCloseManualForm
        onCancel={() => setShowManual(false)}
        onSuccess={(created) => {
          setShowManual(false);
          if (created?.fecha) setSelectedFecha(created.fecha);
          else fetchCloses();
        }}
        onSwitchToDetail={(f) => {
          setShowManual(false);
          setSelectedFecha(f);
        }}
      />
    );
  }

  return (
    <CashCloseList
      closes={closes}
      loading={loading}
      error={error}
      onSelectFecha={(f) => setSelectedFecha(f)}
      onOpenManual={() => setShowManual(true)}
      onOpenConfig={() => {
        setConfigTab('mappings');
        setShowConfig(true);
      }}
      onRefresh={fetchCloses}
    />
  );
}
