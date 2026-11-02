import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { usePurchasingOverview } from '../../hooks/useSupplyRequests';
import { styles } from '../common/uiStyles';
import ApprovedPurchases from './ApprovedPurchases';
import PendingReports from './PendingReports';
import LowStockSuggestions from './LowStockSuggestions';
import SupplyReminderSettings from './SupplyReminderSettings';
import PurchaseOutcomePanel from './PurchaseOutcomePanel';
import ReservationsCommitment from './ReservationsCommitment';

/**
 * Panel de compras consolidado para el dueño (Brief 22p / 26p / 33p).
 * Muestra lo reportado por aprobar, lo aprobado para compra y los insumos bajo mínimo.
 */
export default function ShoppingListPanel({ onViewRequest, canDecide = false }) {
  const [registeringOutcome, setRegisteringOutcome] = useState(false);
  const { overview, loading, error, reload } = usePurchasingOverview();

  const isEmpty = !overview.aprobado.length && !overview.por_aprobar.length && !overview.bajo_minimo.length;

  if (registeringOutcome) {
    return (
      <PurchaseOutcomePanel
        onBack={() => setRegisteringOutcome(false)}
        onSaved={reload}
      />
    );
  }

  if (loading && isEmpty && !error) {
    return <div style={styles.muted}>Cargando la información de compras...</div>;
  }

  if (error && isEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-live="polite">
        <div style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span>{error}</span>
          <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div aria-live="polite">
        {error && (
          <div style={{ ...styles.errorBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span>{error}</span>
            <button type="button" onClick={reload} className="btn-primary" style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '9999px' }}>
              Reintentar
            </button>
          </div>
        )}
      </div>

      {canDecide && (
        <button
          type="button"
          onClick={() => setRegisteringOutcome(true)}
          className="btn-primary"
          style={{
            alignSelf: 'flex-start',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <ShoppingBag size={14} />
          <span>Registrar compra del día</span>
        </button>
      )}

      {/* Bloque 1: Reportes del personal por aprobar */}
      <PendingReports
        reports={overview.por_aprobar}
        onView={onViewRequest}
        onReload={reload}
      />

      {/* Bloque 2: Compras aprobadas */}
      <ApprovedPurchases
        items={overview.aprobado}
      />

      {/* Bloque 3: Insumos bajo mínimo sin pedir */}
      <LowStockSuggestions
        items={overview.bajo_minimo}
      />

      {/* Bloque 4: Comprometido por reservas (solo informativo) */}
      <ReservationsCommitment items={overview.comprometido_por_reservas} />
      {/* Ajuste de aviso de faltantes (solo para el dueño) */}
      {canDecide && <SupplyReminderSettings />}
    </div>
  );
}
