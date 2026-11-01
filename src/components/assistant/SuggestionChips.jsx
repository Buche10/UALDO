import React, { useState, useEffect } from 'react';
import { PackagePlus, ClipboardList, Search, CheckCircle2, ShoppingCart, ArrowDownRight } from 'lucide-react';
import { can, ABILITIES } from '../../services/permissions';
import { listWithdrawals } from '../../services/withdrawalsClient';
import { countMyPendingWithdrawals } from '../withdrawals/withdrawalHelpers';

const DECIDER_SUGGESTIONS = [
  { label: 'Pedidos por aprobar', prompt: '¿Hay pedidos pendientes por aprobar?', icon: CheckCircle2 },
  { label: 'Qué hay que comprar', prompt: '¿Qué hay que comprar?', icon: ShoppingCart },
  { label: 'Pedir insumos', prompt: 'Quiero pedir insumos para el restaurante', icon: PackagePlus },
];

const STAFF_SUGGESTIONS = [
  { label: 'Reportar faltantes', prompt: 'Quiero reportar lo que falta en el local', icon: PackagePlus },
  { label: 'Mis pedidos', prompt: 'Muéstrame mis pedidos recientes', icon: ClipboardList },
  { label: 'Buscar un insumo', prompt: 'Buscar existencias de un insumo', icon: Search },
];

export default function SuggestionChips({
  user,
  onSelectChip,
  disabled = false,
  hasOpenWithdrawals: propHasOpen,
}) {
  const [internalHasOpen, setInternalHasOpen] = useState(false);
  const hasDecide = user ? can(user, ABILITIES.SUPPLY_DECIDE) : false;
  const canDeclareWithdrawal = user ? can(user, ABILITIES.WITHDRAWALS_DECLARE) : false;
  const userId = user?.id;

  useEffect(() => {
    if (propHasOpen !== undefined) return undefined;
    if (!canDeclareWithdrawal || !userId) return undefined;
    let mounted = true;
    listWithdrawals()
      .then((res) => {
        if (!mounted) return;
        const list = res.ok ? (res.data?.data || res.data || []) : [];
        setInternalHasOpen(countMyPendingWithdrawals(list, userId) > 0);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [canDeclareWithdrawal, userId, propHasOpen]);

  const hasOpenWithdrawals = propHasOpen !== undefined ? propHasOpen : internalHasOpen;
  const baseSuggestions = hasDecide ? DECIDER_SUGGESTIONS : STAFF_SUGGESTIONS;
  const suggestions = [...baseSuggestions];

  if (canDeclareWithdrawal) {
    suggestions.push({
      label: 'Voy a la bodega',
      prompt: 'Voy a retirar de la bodega',
      icon: ArrowDownRight,
    });
    if (hasOpenWithdrawals) {
      suggestions.push({
        label: 'Cerrar mi retiro',
        prompt: 'Cerrar mi retiro',
        icon: CheckCircle2,
      });
    }
  }

  return (
    <div
      role="region"
      aria-label="Sugerencias rápidas"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '8px 12px',
      }}
    >
      {suggestions.map((sug) => {
        const Icon = sug.icon;
        return (
          <button
            key={sug.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelectChip?.(sug.prompt)}
            className="chip-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid var(--border-glass)',
              background: 'var(--surface-soft)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <Icon size={14} color="var(--accent)" />
            <span>{sug.label}</span>
          </button>
        );
      })}
    </div>
  );
}
